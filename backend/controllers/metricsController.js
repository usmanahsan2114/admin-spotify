const { Op } = require('sequelize')
const { Order, Product, Customer, Return, User, Store } = require('../db/init').db
const { db } = require('../db/init')
const logger = require('../utils/logger')
const { buildStoreWhere } = require('../middleware/auth')
const { serializeCustomer } = require('./customerController')

// Helper to send CSV response
const sendCsv = (res, filename, headers, rows) => {
    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(csvContent)
}

const getMetricsOverview = async (req, res) => {
    try {
        let startDate = null
        let endDate = null

        if (req.query.startDate) {
            startDate = new Date(req.query.startDate)
            startDate.setHours(0, 0, 0, 0)
        }

        if (req.query.endDate) {
            endDate = new Date(req.query.endDate)
            endDate.setHours(23, 59, 59, 999)
        }

        const dateFilter = {}
        if (startDate || endDate) {
            dateFilter.createdAt = {}
            if (startDate) dateFilter.createdAt[Op.gte] = startDate
            if (endDate) dateFilter.createdAt[Op.lte] = endDate
        }

        const where = buildStoreWhere(req, dateFilter)
        const storeId = req.storeId

        // 1. Total Orders & Revenue (filtered by date)
        const totalOrders = await Order.count({ where })
        const totalRevenue = await Order.sum('total', { where: { ...where, isPaid: true } }) || 0

        // 2. Pending Orders (filtered by date)
        const pendingOrdersCount = await Order.count({ where: { ...where, status: 'Pending' } })

        // 3. Total Products (store-wide, usually not date filtered but can be if needed)
        // For inventory stats, we typically look at current state, so no date filter
        const totalProducts = await Product.count({ where: { storeId } })

        // 4. Low Stock Products (store-wide current state)
        const lowStockCount = await Product.count({
            where: {
                storeId,
                stockQuantity: { [Op.lte]: db.sequelize.col('reorderThreshold') },
                status: 'active'
            }
        })

        // 5. Pending Returns (store-wide current state)
        const pendingReturnsCount = await Return.count({
            where: {
                storeId,
                status: 'Submitted'
            }
        })

        // 6. New Customers (Last 7 Days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const newCustomersLast7Days = await Customer.count({
            where: {
                storeId,
                createdAt: { [Op.gte]: sevenDaysAgo }
            }
        })

        // 7. Total Customers (store-wide)
        const totalCustomers = await Customer.count({ where: { storeId } })

        return res.json({
            totalOrders,
            totalRevenue, // Mapped from totalSales
            totalProducts,
            lowStockCount,
            pendingReturnsCount,
            newCustomersLast7Days,
            totalCustomers,
            pendingOrdersCount, // Mapped from pendingOrders
        })
    } catch (error) {
        logger.error('Failed to fetch metrics overview:', error)
        return res.status(500).json({ message: 'Failed to fetch metrics overview', error: error.message })
    }
}

const getGrowthReport = async (req, res) => {
    try {
        const period = req.query.period || 'month' // 'week', 'month', 'quarter'
        const compareToPrevious = req.query.compareToPrevious !== 'false'

        // Use November 15, 2025 as reference date for consistent results (as per original code)
        const now = new Date('2025-11-15T23:59:59.999Z')
        let currentStart, currentEnd, previousStart, previousEnd

        // If date filter is provided, use it as the current period
        if (req.query.startDate && req.query.endDate) {
            currentStart = new Date(req.query.startDate)
            currentStart.setHours(0, 0, 0, 0)
            currentEnd = new Date(req.query.endDate)
            currentEnd.setHours(23, 59, 59, 999)

            const duration = currentEnd - currentStart
            previousEnd = new Date(currentStart.getTime() - 1)
            previousStart = new Date(previousEnd.getTime() - duration)
        } else {
            // Default periods relative to "now"
            currentEnd = new Date(now)
            currentStart = new Date(now)
            if (period === 'week') {
                currentStart.setDate(now.getDate() - 7)
            } else if (period === 'month') {
                currentStart.setMonth(now.getMonth() - 1)
            } else if (period === 'quarter') {
                currentStart.setMonth(now.getMonth() - 3)
            }
            currentStart.setHours(0, 0, 0, 0)

            const duration = currentEnd - currentStart
            previousEnd = new Date(currentStart.getTime() - 1)
            previousStart = new Date(previousEnd.getTime() - duration)
        }

        const getStats = async (start, end) => {
            const where = buildStoreWhere(req, {
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end,
                },
            })

            const totalSales = await Order.sum('total', { where: { ...where, isPaid: true } }) || 0
            const totalOrders = await Order.count({ where })
            const newCustomers = await Customer.count({
                where: buildStoreWhere(req, {
                    createdAt: {
                        [Op.gte]: start,
                        [Op.lte]: end,
                    },
                }),
            })

            return { totalSales, totalOrders, newCustomers }
        }

        const currentStats = await getStats(currentStart, currentEnd)
        const previousStats = compareToPrevious ? await getStats(previousStart, previousEnd) : null

        const calculateGrowth = (current, previous) => {
            if (!previous) return 0
            return ((current - previous) / previous) * 100
        }

        return res.json({
            period,
            current: currentStats,
            previous: previousStats,
            growth: previousStats ? {
                sales: calculateGrowth(currentStats.totalSales, previousStats.totalSales),
                orders: calculateGrowth(currentStats.totalOrders, previousStats.totalOrders),
                customers: calculateGrowth(currentStats.newCustomers, previousStats.newCustomers),
            } : null,
        })
    } catch (error) {
        logger.error('Failed to fetch growth report:', error)
        return res.status(500).json({ message: 'Failed to fetch growth report', error: error.message })
    }
}

const getTrendsReport = async (req, res) => {
    try {
        const metric = req.query.metric || 'sales' // 'sales', 'orders', 'customers'
        const startDate = new Date(req.query.startDate || new Date(new Date().setDate(new Date().getDate() - 30)))
        const endDate = new Date(req.query.endDate || new Date())
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        const days = []
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d).toISOString().split('T')[0])
        }

        const dailyData = {}
        days.forEach(day => {
            dailyData[day] = { date: day, sales: 0, orders: 0, customers: 0 }
        })

        if (metric === 'sales' || metric === 'orders') {
            const ordersList = await Order.findAll({
                where: buildStoreWhere(req, {
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                }),
            })

            ordersList.forEach((order) => {
                const oData = order.toJSON ? order.toJSON() : order
                if (!oData.createdAt) return
                const orderDate = new Date(oData.createdAt)
                const dateKey = orderDate.toISOString().split('T')[0]
                if (dailyData[dateKey]) {
                    dailyData[dateKey].orders += 1
                    const orderTotal = oData.total != null ? parseFloat(oData.total) || 0 : 0
                    dailyData[dateKey].sales += orderTotal
                }
            })
        }

        if (metric === 'customers') {
            const customersList = await Customer.findAll({
                where: buildStoreWhere(req, {
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                }),
            })

            customersList.forEach((customer) => {
                const cData = customer.toJSON ? customer.toJSON() : customer
                if (!cData.createdAt) return
                const customerDate = new Date(cData.createdAt)
                const dateKey = customerDate.toISOString().split('T')[0]
                if (dailyData[dateKey]) {
                    dailyData[dateKey].customers += 1
                }
            })
        }

        const dataPoints = Object.values(dailyData)
            .map((data) => ({
                date: data.date,
                dateLabel: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: metric === 'sales' ? data.sales : metric === 'orders' ? data.orders : data.customers,
                sales: data.sales,
                orders: data.orders,
                customers: data.customers,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return res.json({
            metric,
            data: dataPoints,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        })
    } catch (error) {
        logger.error('Failed to fetch trends report:', error)
        return res.status(500).json({ message: 'Failed to fetch trends report', error: error.message })
    }
}

const exportOrders = async (req, res) => {
    try {
        const headers = [
            'Order ID',
            'Created At',
            'Customer Name',
            'Customer Email',
            'Product Name',
            'Quantity',
            'Status',
            'Is Paid',
            'Total',
        ]

        const ordersList = await Order.findAll({
            where: buildStoreWhere(req),
            order: [['createdAt', 'DESC']],
        })

        const rows = ordersList.map((order) => {
            const oData = order.toJSON ? order.toJSON() : order
            return [
                oData.id,
                oData.createdAt,
                oData.customerName,
                oData.email,
                oData.productName,
                oData.quantity,
                oData.status,
                oData.isPaid ? 'Yes' : 'No',
                oData.total ?? '',
            ]
        })

        return sendCsv(res, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    } catch (error) {
        logger.error('Failed to export orders:', error)
        return res.status(500).json({ message: 'Failed to export orders', error: error.message })
    }
}

const exportCustomers = async (req, res) => {
    try {
        const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Orders', 'Last Order Date']

        const customersList = await Customer.findAll({
            where: { storeId: req.storeId },
            order: [['createdAt', 'DESC']],
        })

        const serializedCustomers = await Promise.all(
            customersList.map(c => serializeCustomer(c))
        )

        const rows = serializedCustomers.map((customer) => [
            customer.id,
            customer.name,
            customer.email,
            customer.phone ?? '',
            customer.orderCount ?? 0,
            customer.lastOrderDate ?? '',
        ])

        return sendCsv(
            res,
            `customers_export_${new Date().toISOString().slice(0, 10)}.csv`,
            headers,
            rows,
        )
    } catch (error) {
        logger.error('Failed to export customers:', error)
        return res.status(500).json({ message: 'Failed to export customers', error: error.message })
    }
}

const getPerformanceMetrics = async (req, res) => {
    try {
        // Get database query performance metrics
        const queryStartTime = Date.now()

        const metrics = {
            timestamp: new Date().toISOString(),
            database: {
                connectionPool: db.sequelize.connectionManager.pool ? {
                    size: db.sequelize.connectionManager.pool.size || 0,
                    available: db.sequelize.connectionManager.pool.available || 0,
                    using: db.sequelize.connectionManager.pool.using || 0,
                    waiting: db.sequelize.connectionManager.pool.waiting || 0,
                } : null,
            },
            queries: {},
            counts: {},
        }

        const storeId = req.storeId

        // Orders list query
        const ordersStart = Date.now()
        await Order.findAll({
            where: { storeId },
            limit: 10,
            order: [['createdAt', 'DESC']],
        })
        metrics.queries.ordersList = Date.now() - ordersStart

        // Products list query
        const productsStart = Date.now()
        await Product.findAll({
            where: { storeId },
            limit: 10,
            order: [['name', 'ASC']],
        })
        metrics.queries.productsList = Date.now() - productsStart

        // Low stock query
        const lowStockStart = Date.now()
        await Product.findAll({
            where: {
                storeId,
                status: 'active',
            },
            attributes: ['id', 'name', 'stockQuantity', 'reorderThreshold'],
        })
        metrics.queries.lowStock = Date.now() - lowStockStart

        // Customers list query
        const customersStart = Date.now()
        await Customer.findAll({
            where: { storeId },
            limit: 10,
            order: [['createdAt', 'DESC']],
        })
        metrics.queries.customersList = Date.now() - customersStart

        // Returns list query
        const returnsStart = Date.now()
        await Return.findAll({
            where: { storeId },
            limit: 10,
            order: [['dateRequested', 'DESC']],
        })
        metrics.queries.returnsList = Date.now() - returnsStart

        // Get record counts
        metrics.counts.orders = await Order.count({ where: { storeId } })
        metrics.counts.products = await Product.count({ where: { storeId } })
        metrics.counts.customers = await Customer.count({ where: { storeId } })
        metrics.counts.returns = await Return.count({ where: { storeId } })
        metrics.counts.users = await User.count({ where: { storeId } })

        // Overall query time
        metrics.database.totalQueryTime = Date.now() - queryStartTime

        // Memory usage
        const memoryUsage = process.memoryUsage()
        metrics.memory = {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
        }

        // CPU usage
        const cpuUsage = process.cpuUsage()
        metrics.cpu = {
            user: Math.round(cpuUsage.user / 1000),
            system: Math.round(cpuUsage.system / 1000),
        }

        return res.json(metrics)
    } catch (error) {
        logger.error('Performance metrics failed:', error)
        return res.status(500).json({ message: 'Failed to fetch performance metrics', error: error.message })
    }
}

const getLowStockTrend = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate || new Date(new Date().setDate(new Date().getDate() - 7)))
        const endDate = new Date(req.query.endDate || new Date())
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        // Since we don't track historical stock, we'll return the current low stock count
        // distributed across the dates to prevent empty charts.
        // In a real app, you'd have a daily snapshot table.
        const lowStockCount = await Product.count({
            where: {
                storeId: req.storeId,
                stockQuantity: { [Op.lte]: db.sequelize.col('reorderThreshold') },
                status: 'active'
            }
        })

        const days = []
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push({
                date: new Date(d).toISOString().split('T')[0],
                dateLabel: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                lowStockCount: lowStockCount // Return current count for all days as approximation
            })
        }

        return res.json(days)
    } catch (error) {
        logger.error('Failed to fetch low stock trend:', error)
        return res.status(500).json({ message: 'Failed to fetch low stock trend', error: error.message })
    }
}

const getSalesOverTime = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate || new Date(new Date().setDate(new Date().getDate() - 30)))
        const endDate = new Date(req.query.endDate || new Date())
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        const ordersList = await Order.findAll({
            where: buildStoreWhere(req, {
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            }),
        })

        const dailyData = {}
        // Initialize days
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const day = new Date(d).toISOString().split('T')[0]
            dailyData[day] = {
                date: day,
                dateLabel: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                orders: 0,
                revenue: 0
            }
        }

        let totalOrders = 0
        let totalRevenue = 0

        ordersList.forEach((order) => {
            const oData = order.toJSON ? order.toJSON() : order
            if (!oData.createdAt) return
            const dateKey = new Date(oData.createdAt).toISOString().split('T')[0]

            if (dailyData[dateKey]) {
                dailyData[dateKey].orders += 1
                const amount = oData.total != null ? parseFloat(oData.total) || 0 : 0
                dailyData[dateKey].revenue += amount

                totalOrders += 1
                totalRevenue += amount
            }
        })

        const data = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))

        const daysCount = data.length || 1
        const averageOrdersPerDay = (totalOrders / daysCount).toFixed(1)
        const averageRevenuePerDay = (totalRevenue / daysCount).toFixed(2)

        return res.json({
            data,
            summary: {
                totalOrders,
                totalRevenue,
                averageOrdersPerDay,
                averageRevenuePerDay
            }
        })
    } catch (error) {
        logger.error('Failed to fetch sales over time:', error)
        return res.status(500).json({ message: 'Failed to fetch sales over time', error: error.message })
    }
}

const getGrowthComparison = async (req, res) => {
    try {
        const period = req.query.period || 'month'

        // Reuse getGrowthReport logic but format for GrowthComparisonResponse
        // Use November 15, 2025 as reference date
        const now = new Date('2025-11-15T23:59:59.999Z')
        let currentStart, currentEnd, previousStart, previousEnd

        if (req.query.startDate && req.query.endDate) {
            currentStart = new Date(req.query.startDate)
            currentStart.setHours(0, 0, 0, 0)
            currentEnd = new Date(req.query.endDate)
            currentEnd.setHours(23, 59, 59, 999)

            const duration = currentEnd - currentStart
            previousEnd = new Date(currentStart.getTime() - 1)
            previousStart = new Date(previousEnd.getTime() - duration)
        } else {
            currentEnd = new Date(now)
            currentStart = new Date(now)
            if (period === 'week') {
                currentStart.setDate(now.getDate() - 7)
            } else if (period === 'month') {
                currentStart.setMonth(now.getMonth() - 1)
            } else if (period === 'quarter') {
                currentStart.setMonth(now.getMonth() - 3)
            }
            currentStart.setHours(0, 0, 0, 0)

            const duration = currentEnd - currentStart
            previousEnd = new Date(currentStart.getTime() - 1)
            previousStart = new Date(previousEnd.getTime() - duration)
        }

        const getStats = async (start, end) => {
            const where = buildStoreWhere(req, {
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end,
                },
            })

            const revenue = await Order.sum('total', { where: { ...where, isPaid: true } }) || 0
            const orders = await Order.count({ where })

            return { revenue, orders, startDate: start.toISOString(), endDate: end.toISOString() }
        }

        const current = await getStats(currentStart, currentEnd)
        const previous = await getStats(previousStart, previousEnd)

        const calculateGrowth = (curr, prev) => {
            if (!prev) return 0
            return ((curr - prev) / prev) * 100
        }

        return res.json({
            current: { ...current, period: 'Current' },
            previous: { ...previous, period: 'Previous' },
            change: {
                ordersPercent: calculateGrowth(current.orders, previous.orders),
                revenuePercent: calculateGrowth(current.revenue, previous.revenue)
            }
        })
    } catch (error) {
        logger.error('Failed to fetch growth comparison:', error)
        return res.status(500).json({ message: 'Failed to fetch growth comparison', error: error.message })
    }
}

module.exports = {
    getMetricsOverview,
    getGrowthReport,
    getTrendsReport,
    exportOrders,
    exportCustomers,
    getPerformanceMetrics,
    getLowStockTrend,
    getSalesOverTime,
    getGrowthComparison,
}
