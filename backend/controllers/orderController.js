const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const { Order, Product, Customer, Return, User, Store } = require('../db/init').db
const logger = require('../utils/logger')
const { normalizeEmail, normalizePhone, normalizeAddress } = require('../utils/helpers')
const { detectOrderColumns, getMappingSummary, extractRowData } = require('../utils/columnDetector')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

// Helpers
const findStoreById = async (storeId) => {
    if (!storeId) return null
    return await Store.findByPk(storeId)
}

const findOrderById = async (id) => {
    if (!id) return null
    return await Order.findByPk(id)
}

const findCustomerByContact = async (email, phone, address, storeId = null) => {
    if (!email && !phone && !address) return null

    const normalizedEmail = email ? normalizeEmail(email) : null
    const normalizedPhone = phone ? normalizePhone(phone) : null
    const normalizedAddress = address ? normalizeAddress(address) : null

    const whereConditions = []

    if (normalizedEmail) {
        whereConditions.push({
            email: { [Op.like]: normalizedEmail },
        })
    }

    if (normalizedPhone) {
        whereConditions.push({
            phone: { [Op.like]: `%${normalizedPhone}%` },
        })
    }

    if (normalizedAddress) {
        whereConditions.push({
            address: { [Op.like]: `%${normalizedAddress}%` },
        })
    }

    if (whereConditions.length === 0) return null

    const where = {
        [Op.or]: whereConditions,
    }

    if (storeId) where.storeId = storeId

    const customer = await Customer.findOne({ where })

    if (customer) {
        const customerData = customer.toJSON ? customer.toJSON() : customer

        if (normalizedEmail && customerData.alternativeEmails && Array.isArray(customerData.alternativeEmails)) {
            const matchesEmail = customerData.alternativeEmails.some((altEmail) => normalizeEmail(altEmail) === normalizedEmail)
            if (matchesEmail) return customer
        }

        if (normalizedPhone && customerData.alternativePhones && Array.isArray(customerData.alternativePhones)) {
            const matchesPhone = customerData.alternativePhones.some((altPhone) => normalizePhone(altPhone) === normalizedPhone)
            if (matchesPhone) return customer
        }

        if (normalizedAddress && customerData.alternativeAddresses && Array.isArray(customerData.alternativeAddresses)) {
            const matchesAddress = customerData.alternativeAddresses.some((altAddress) => normalizeAddress(altAddress) === normalizedAddress)
            if (matchesAddress) return customer
        }
    }

    return customer
}

const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    if (value === null || value === undefined) return []
    return []
}

const getOrdersForCustomer = async (customer) => {
    if (!customer || !customer.id) return []

    const customerData = customer.toJSON ? customer.toJSON() : customer
    const alternativeEmails = ensureArray(customerData.alternativeEmails)

    const customerEmails = [
        customerData.email,
        ...alternativeEmails
    ].filter(Boolean).map(normalizeEmail)

    const customerPhones = [
        customerData.phone,
        customerData.alternativePhone,
    ].filter(Boolean).map(normalizePhone)

    const where = {
        storeId: customerData.storeId,
        [Op.or]: [
            { customerId: customerData.id },
            ...(customerEmails.length > 0 ? [{ email: { [Op.in]: customerEmails } }] : []),
            ...(customerPhones.length > 0 ? [{ phone: { [Op.like]: `%${customerPhones[0]}%` } }] : []),
        ],
    }

    const orders = await Order.findAll({
        where,
        order: [['createdAt', 'DESC']],
    })

    return orders.map(order => order.toJSON ? order.toJSON() : order)
}

const serializeReturn = async (returnRequest) => {
    const order = await findOrderById(returnRequest.orderId)
    const customer =
        (returnRequest.customerId && await Customer.findByPk(returnRequest.customerId)) ||
        (order ? await findCustomerByContact(order.email, order.phone, null, order.storeId) : null)

    const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest
    return {
        ...returnData,
        history: Array.isArray(returnData.history) ? [...returnData.history] : [],
        customer: customer
            ? {
                id: customer.id,
                name: customer.name,
                email: customer.email,
            }
            : null,
        order: order
            ? {
                id: order.id,
                productName: order.productName,
                status: order.status,
                quantity: order.quantity,
                createdAt: order.createdAt,
            }
            : null,
    }
}

const buildStoreWhere = (req, baseWhere = {}) => {
    if (req.isSuperAdmin) {
        return baseWhere
    }
    return { ...baseWhere, storeId: req.storeId }
}

// Controller Functions

const searchOrdersByContact = async (req, res) => {
    try {
        const { email, phone } = req.query

        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone number is required.' })
        }

        const storeId = req.query.storeId || null

        const customer = await findCustomerByContact(email, phone, null, storeId)

        let matchingOrders = []

        if (customer) {
            matchingOrders = await getOrdersForCustomer(customer)
        } else {
            const where = {}
            if (storeId) where.storeId = storeId

            if (email) {
                const normalizedEmail = normalizeEmail(email)
                where.email = { [Op.like]: normalizedEmail }
            } else if (phone) {
                const normalizedPhone = normalizePhone(phone)
                where.phone = { [Op.like]: `%${normalizedPhone}%` }
            }

            const ordersList = await Order.findAll({
                where,
                order: [['createdAt', 'DESC']],
            })
            matchingOrders = ordersList.map(order => order.toJSON ? order.toJSON() : order)
        }

        const publicOrders = matchingOrders
            .map((order) => ({
                id: order.id,
                productName: order.productName,
                customerName: order.customerName,
                email: order.email,
                phone: order.phone,
                quantity: order.quantity,
                status: order.status,
                isPaid: order.isPaid,
                total: order.total,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                notes: order.notes,
            }))
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateB - dateA
            })

        return res.json(publicOrders)
    } catch (error) {
        logger.error('[ERROR] /api/orders/search/by-contact:', error)
        return res.status(500).json({ message: 'Failed to search orders', error: error.message })
    }
}

const getOrders = async (req, res) => {
    try {
        const where = buildStoreWhere(req)

        const startDate = req.query.startDate
        const endDate = req.query.endDate

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                where.createdAt[Op.gte] = start
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.createdAt[Op.lte] = end
            }
        }

        const limit = parseInt(req.query.limit || '100', 10)
        const offset = parseInt(req.query.offset || '0', 10)
        const maxLimit = 1000
        const safeLimit = Math.min(limit, maxLimit)

        // N+1 Optimization: Include Customer
        const ordersList = await Order.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: safeLimit,
            offset: offset,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'phone', 'address'], // Select only needed fields
                }
            ]
        })

        let totalCount = null
        if (req.query.limit || req.query.offset) {
            totalCount = await Order.count({ where })
        }

        const sanitizedOrders = ordersList.map((order) => {
            const orderData = order.toJSON ? order.toJSON() : order
            return {
                ...orderData,
                createdAt: orderData.createdAt || new Date().toISOString(),
                updatedAt: orderData.updatedAt || orderData.createdAt || new Date().toISOString(),
                total: orderData.total !== undefined && orderData.total !== null ? orderData.total : 0,
            }
        })

        if (req.query.limit || req.query.offset) {
            return res.json({
                data: sanitizedOrders,
                pagination: {
                    total: totalCount,
                    limit: safeLimit,
                    offset: offset,
                    hasMore: offset + sanitizedOrders.length < totalCount,
                },
            })
        }

        return res.json(sanitizedOrders)
    } catch (error) {
        logger.error('Failed to fetch orders:', error)
        return res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
    }
}

const getOrderById = async (req, res) => {
    try {
        const order = await findOrderById(req.params.id)
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' })
        }

        const orderData = order.toJSON ? order.toJSON() : order

        const storeId = req.query.storeId
        if (storeId && orderData.storeId !== storeId) {
            return res.status(404).json({ message: 'Order not found.' })
        }

        const authHeader = req.headers.authorization || ''
        const token = authHeader.split(' ')[1]
        let isAuthenticated = false

        if (token) {
            try {
                jwt.verify(token, JWT_SECRET)
                isAuthenticated = true
            } catch {
                // Not authenticated
            }
        }

        const relatedReturns = await Return.findAll({
            where: { orderId: orderData.id },
            order: [['dateRequested', 'DESC']],
        }).then(returns => Promise.all(returns.map(r => serializeReturn(r))))

        return res.json({
            ...orderData,
            returns: relatedReturns,
        })
    } catch (error) {
        logger.error('Failed to fetch order:', error)
        return res.status(500).json({ message: 'Failed to fetch order', error: error.message })
    }
}

const createOrder = async (req, res) => {
    try {
        const { productName, customerName, email, phone, quantity, notes, storeId, address, alternativeNames, alternativeEmails, alternativePhones, alternativeAddresses } = req.body

        let submittedBy = null
        let orderStoreId = storeId || null
        const authHeader = req.headers.authorization || ''
        const token = authHeader.split(' ')[1]

        if (token) {
            try {
                const payload = jwt.verify(token, JWT_SECRET)
                if (payload.userId) {
                    const user = await User.findByPk(payload.userId)
                    if (user) {
                        submittedBy = user.id
                        orderStoreId = orderStoreId || user.storeId
                    } else {
                        submittedBy = payload.userId
                    }
                }
            } catch (error) {
                logger.warn('Invalid token supplied on order submission.')
            }
        }

        const product = await Product.findOne({
            where: {
                name: { [Op.like]: productName },
                ...(orderStoreId ? { storeId: orderStoreId } : {}),
            },
        })

        if (!product) {
            return res.status(400).json({
                message: `Product "${productName}" not found`
            })
        }

        if (product.stockQuantity < quantity) {
            return res.status(400).json({
                message: `Insufficient stock. Only ${product.stockQuantity} units available.`,
                availableStock: product.stockQuantity
            })
        }

        const productPrice = product.price
        const orderTotal = productPrice * quantity

        if (!orderStoreId && product) {
            orderStoreId = product.storeId
        }

        if (!orderStoreId) {
            const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
            if (!firstStore) {
                return res.status(400).json({ message: 'No store available. Please create a store first.' })
            }
            orderStoreId = firstStore.id
        }

        let customer = await findCustomerByContact(email, phone, null, orderStoreId)
        if (!customer) {
            customer = await Customer.create({
                storeId: orderStoreId,
                name: customerName,
                email,
                phone: phone || null,
                address: address || null,
                alternativePhone: null,
                alternativeEmails: alternativeEmails ? alternativeEmails.split(',').map(s => s.trim()).filter(Boolean) : [],
                alternativeNames: alternativeNames ? alternativeNames.split(',').map(s => s.trim()).filter(Boolean) : [],
                alternativeAddresses: alternativeAddresses ? alternativeAddresses.split(',').map(s => s.trim()).filter(Boolean) : [],
                alternativePhones: alternativePhones ? alternativePhones.split(',').map(s => s.trim()).filter(Boolean) : [],
            })
        }

        const orderDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
        const orderNumber = `ORD-${orderDate}-${randomSuffix}`

        const newOrder = await Order.create({
            storeId: orderStoreId,
            orderNumber,
            productName,
            customerName,
            email,
            phone: phone || '',
            quantity,
            status: 'Pending',
            isPaid: false,
            notes: notes || '',
            submittedBy,
            total: orderTotal,
            customerId: customer.id,
            timeline: [{
                id: crypto.randomUUID(),
                description: 'Order created',
                timestamp: new Date().toISOString(),
                actor: customerName,
            }],
        })

        logger.info(`[orders] New order received: ${newOrder.id}`)
        const orderData = newOrder.toJSON ? newOrder.toJSON() : newOrder
        return res.status(201).json(orderData)
    } catch (error) {
        logger.error('Order creation failed:', error)
        return res.status(500).json({ message: 'Order creation failed', error: error.message })
    }
}

const updateOrder = async (req, res) => {
    try {
        const order = await findOrderById(req.params.id)

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' })
        }

        const orderData = order.toJSON ? order.toJSON() : order

        if (!req.isSuperAdmin && orderData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Order does not belong to your store.' })
        }

        const allowedFields = ['status', 'isPaid', 'notes', 'quantity', 'phone']
        const updateData = {}
        Object.entries(req.body).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                updateData[key] = value
            }
        })

        const existingTimeline = Array.isArray(orderData.timeline) ? [...orderData.timeline] : []
        const updatedFields = Object.keys(req.body).filter((key) => allowedFields.includes(key) && req.body[key] !== undefined)

        if (updatedFields.length > 0) {
            existingTimeline.push({
                id: crypto.randomUUID(),
                description: `Order updated (${updatedFields.join(', ')})`,
                timestamp: new Date().toISOString(),
                actor: req.user?.email ?? 'System',
            })
            updateData.timeline = existingTimeline
        }

        await order.update(updateData)
        await order.reload()

        const updatedOrder = order.toJSON ? order.toJSON() : order
        return res.json(updatedOrder)
    } catch (error) {
        logger.error('Failed to update order:', error)
        return res.status(500).json({ message: 'Failed to update order', error: error.message })
    }
}

const importOrders = async (req, res) => {
    try {
        const { csvData } = req.body

        if (!csvData || csvData.trim() === '') {
            return res.status(400).json({
                message: 'No rows found in the import file.',
                error: 'CSV data is empty or missing.'
            })
        }

        const storeId = req.isSuperAdmin ? null : req.storeId

        const rows = typeof csvData === 'string' ? JSON.parse(csvData) : csvData

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({
                message: 'No rows found in the import file.',
                error: 'CSV data must be a non-empty array.'
            })
        }

        const headers = Object.keys(rows[0])
        const columnMappings = detectOrderColumns(headers)
        const mappingSummary = getMappingSummary(columnMappings)

        if (mappingSummary.requiredMissing > 0) {
            return res.status(400).json({
                message: 'Unable to detect required columns. Please ensure your CSV has columns for: Product Name, Customer Name, and Email.',
                mappingSummary,
                error: 'Missing required column mappings'
            })
        }

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [],
            mappingSummary
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            try {
                const data = extractRowData(row, columnMappings)

                const productName = data.productName?.trim()
                const customerName = data.customerName?.trim()
                const email = data.email?.trim()
                const phone = data.phone?.trim() || ''
                const quantity = parseInt(data.quantity || 1)
                const notes = data.notes?.trim() || ''

                if (!productName || !customerName || !email) {
                    results.failed++
                    results.errors.push({
                        index: i,
                        message: `Missing required fields (productName, customerName, or email)`
                    })
                    continue
                }

                if (isNaN(quantity) || quantity < 1) {
                    results.failed++
                    results.errors.push({
                        index: i,
                        message: `Invalid quantity: ${data.quantity}`
                    })
                    continue
                }

                let targetStoreId = storeId
                if (!targetStoreId) {
                    // Try to find product to infer store
                    const product = await Product.findOne({ where: { name: { [Op.like]: productName } } })
                    if (product) {
                        targetStoreId = product.storeId
                    } else {
                        // Default to first store
                        const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
                        if (firstStore) targetStoreId = firstStore.id
                    }
                }

                if (!targetStoreId) {
                    results.failed++
                    results.errors.push({ index: i, message: 'No store available' })
                    continue
                }

                let customer = await findCustomerByContact(email, phone, null, targetStoreId)
                if (!customer) {
                    customer = await Customer.create({
                        storeId: targetStoreId,
                        name: customerName,
                        email,
                        phone,
                    })
                }

                const orderDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
                const orderNumber = `ORD-${orderDate}-${randomSuffix}`

                await Order.create({
                    storeId: targetStoreId,
                    orderNumber,
                    productName,
                    customerName,
                    email,
                    phone,
                    quantity,
                    status: 'Pending',
                    isPaid: false,
                    notes,
                    customerId: customer.id,
                    total: 0, // Should calculate based on product price if possible
                    timeline: [{
                        id: crypto.randomUUID(),
                        description: 'Order imported via CSV',
                        timestamp: new Date().toISOString(),
                        actor: req.user?.email || 'System',
                    }],
                })

                results.created++
            } catch (error) {
                results.failed++
                results.errors.push({
                    index: i,
                    message: error.message
                })
            }
        }

        return res.json({
            message: `Import completed. Created: ${results.created}, Failed: ${results.failed}`,
            results
        })
    } catch (error) {
        logger.error('Import failed:', error)
        return res.status(500).json({ message: 'Import failed', error: error.message })
    }
}

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    searchOrdersByContact,
    importOrders,
}
