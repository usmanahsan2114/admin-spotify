const { Order, Product, Customer, Return, Store, User, sequelize } = require('../db/init').db
const { Op } = require('sequelize')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const logger = require('../utils/logger')
const { normalizeEmail, normalizePhone, normalizeAddress, ensureArray } = require('../utils/helpers')

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Helper Functions

const findCustomerByContact = async (email, phone, name = null, storeId = null) => {
    const where = {}
    if (storeId) where.storeId = storeId

    if (email) {
        const normalizedEmail = normalizeEmail(email)
        where.email = { [Op.like]: normalizedEmail }
    } else if (phone) {
        const normalizedPhone = normalizePhone(phone)
        where.phone = { [Op.like]: `%${normalizedPhone}%` }
    } else {
        return null
    }

    let customer = await Customer.findOne({ where })

    // If not found by primary contact, check alternative fields
    if (!customer) {
        const orConditions = []
        if (email) {
            const normalizedEmail = normalizeEmail(email)
            orConditions.push({
                alternativeEmails: { [Op.contains]: [normalizedEmail] } // PostgreSQL array contains
            })
        }
        if (phone) {
            const normalizedPhone = normalizePhone(phone)
            orConditions.push({
                alternativePhones: { [Op.contains]: [normalizedPhone] }
            })
        }

        if (orConditions.length > 0) {
            customer = await Customer.findOne({
                where: {
                    [Op.and]: [
                        storeId ? { storeId } : {},
                        { [Op.or]: orConditions }
                    ]
                }
            })
        }
    }

    return customer
}

const findOrderById = async (id, includeCustomer = false) => {
    const options = {
        where: { id },
    }
    if (includeCustomer) {
        options.include = [
            {
                model: Customer,
                as: 'customer',
            }
        ]
    }
    return await Order.findOne(options)
}

const getOrdersForCustomer = async (customer) => {
    const orders = await Order.findAll({
        where: { customerId: customer.id },
        order: [['createdAt', 'DESC']],
    })
    return orders.map(order => order.toJSON ? order.toJSON() : order)
}

const detectOrderColumns = (headers) => {
    const mappings = {
        productName: null,
        customerName: null,
        email: null,
        phone: null,
        quantity: null,
        notes: null
    }

    const normalize = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '')

    headers.forEach((header, index) => {
        const h = normalize(header)
        if (['product', 'productname', 'item'].includes(h)) mappings.productName = index
        else if (['customer', 'customername', 'name', 'client'].includes(h)) mappings.customerName = index
        else if (['email', 'mail', 'e-mail'].includes(h)) mappings.email = index
        else if (['phone', 'mobile', 'cell', 'contact'].includes(h)) mappings.phone = index
        else if (['quantity', 'qty', 'amount', 'count'].includes(h)) mappings.quantity = index
        else if (['notes', 'note', 'comment', 'comments', 'remarks'].includes(h)) mappings.notes = index
    })

    return mappings
}

const getMappingSummary = (mappings) => {
    const required = ['productName', 'customerName', 'email']
    const missing = required.filter(field => mappings[field] === null)
    return {
        mappings,
        missing,
        isValid: missing.length === 0,
        requiredMissing: missing.length
    }
}

const extractRowData = (row, mappings) => {
    const getValue = (index) => (index !== null && row[index] !== undefined) ? String(row[index]).trim() : null

    // Handle object rows (JSON import) vs array rows (CSV)
    if (!Array.isArray(row)) {
        // If row is an object, we try to match keys fuzzily if mappings are indices, 
        // but usually for JSON import we expect keys to match or be mapped differently.
        // For simplicity, if it's an object, we assume keys match our internal names or standard variations.
        const getObjValue = (keys) => {
            for (const key of keys) {
                if (row[key] !== undefined) return String(row[key]).trim()
            }
            return null
        }

        return {
            productName: getObjValue(['productName', 'product', 'Product Name']),
            customerName: getObjValue(['customerName', 'customer', 'Customer Name', 'name']),
            email: getObjValue(['email', 'Email']),
            phone: getObjValue(['phone', 'Phone']),
            quantity: getObjValue(['quantity', 'qty', 'Quantity']) || '1',
            notes: getObjValue(['notes', 'Notes'])
        }
    }

    return {
        productName: getValue(mappings.productName),
        customerName: getValue(mappings.customerName),
        email: getValue(mappings.email),
        phone: getValue(mappings.phone),
        quantity: getValue(mappings.quantity) || '1',
        notes: getValue(mappings.notes)
    }
}

const serializeReturn = async (returnItem) => {
    const order = await Order.findByPk(returnItem.orderId)
    return {
        id: returnItem.id,
        orderId: returnItem.orderId,
        reason: returnItem.reason,
        status: returnItem.status,
        dateRequested: returnItem.dateRequested,
        customerName: order ? order.customerName : 'Unknown',
        productName: order ? order.productName : 'Unknown',
        refundAmount: returnItem.refundAmount,
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
        const order = await findOrderById(req.params.id, true)
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
    const t = await sequelize.transaction()
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
            transaction: t
        })

        if (!product) {
            await t.rollback()
            return res.status(400).json({
                message: `Product "${productName}" not found`
            })
        }

        // Atomic stock check and decrement
        // We use a direct update with a where clause to ensure concurrency safety
        const [affectedRows] = await Product.update(
            { stockQuantity: sequelize.literal(`"stockQuantity" - ${quantity}`) },
            {
                where: {
                    id: product.id,
                    stockQuantity: { [Op.gte]: quantity }
                },
                transaction: t
            }
        )

        if (affectedRows === 0) {
            await t.rollback()
            // Re-fetch to get current stock for the error message
            const currentProduct = await Product.findByPk(product.id)
            return res.status(400).json({
                message: `Insufficient stock. Only ${currentProduct ? currentProduct.stockQuantity : 0} units available.`,
                availableStock: currentProduct ? currentProduct.stockQuantity : 0
            })
        }

        const productPrice = product.price
        const orderTotal = productPrice * quantity

        if (!orderStoreId && product) {
            orderStoreId = product.storeId
        }

        if (!orderStoreId) {
            const firstStore = await Store.findOne({ order: [['name', 'ASC']], transaction: t })
            if (!firstStore) {
                await t.rollback()
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
            }, { transaction: t })
        } else {
            // Update existing customer address if provided and different
            if (address) {
                const normalizedNew = normalizeAddress(address)
                const normalizedOld = normalizeAddress(customer.address)

                if (!normalizedOld) {
                    await customer.update({ address: address }, { transaction: t })
                } else if (normalizedNew !== normalizedOld) {
                    let altAddresses = ensureArray(customer.alternativeAddresses)
                    const exists = altAddresses.some(a => normalizeAddress(a) === normalizedNew)
                    if (!exists) {
                        altAddresses.push(address)
                        await customer.update({ alternativeAddresses: altAddresses }, { transaction: t })
                    }
                }
            }

            // Merge alternative fields
            const mergeField = async (field, value, normalizeFunc = (v) => v) => {
                if (!value) return
                const values = value.split(',').map(s => s.trim()).filter(Boolean)
                if (values.length === 0) return

                let current = ensureArray(customer[field])
                let changed = false

                for (const v of values) {
                    const normalizedV = normalizeFunc(v)
                    const exists = current.some(c => normalizeFunc(c) === normalizedV)
                    if (!exists) {
                        current.push(v)
                        changed = true
                    }
                }

                if (changed) {
                    await customer.update({ [field]: current }, { transaction: t })
                }
            }

            await mergeField('alternativeNames', alternativeNames)
            await mergeField('alternativeEmails', alternativeEmails, normalizeEmail)
            await mergeField('alternativePhones', alternativePhones, normalizePhone)
            await mergeField('alternativeAddresses', alternativeAddresses, normalizeAddress)
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
            shippingAddress: address || null,
            timeline: [{
                id: crypto.randomUUID(),
                description: 'Order created',
                timestamp: new Date().toISOString(),
                actor: customerName,
            }],
        }, { transaction: t })

        await t.commit()

        logger.info(`[orders] New order received: ${newOrder.id}`)

        const orderData = newOrder.toJSON ? newOrder.toJSON() : newOrder
        return res.status(201).json(orderData)
    } catch (error) {
        await t.rollback()
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

        // Auto-set isPaid if status is Paid
        if (req.body.status === 'Paid' && req.body.isPaid === undefined) {
            updateData.isPaid = true
        }

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

        // Handle stock adjustments based on status change
        if (req.body.status && req.body.status !== orderData.status) {
            const oldStatus = orderData.status
            const newStatus = req.body.status
            const isCancelledOrRefunded = (s) => ['Cancelled', 'Refunded'].includes(s)

            const product = await Product.findByPk(orderData.productName ? (await Product.findOne({ where: { name: orderData.productName, storeId: orderData.storeId } }))?.id : null)

            if (product) {
                // If cancelling/refunding, restore stock
                if (!isCancelledOrRefunded(oldStatus) && isCancelledOrRefunded(newStatus)) {
                    await product.increment('stockQuantity', { by: orderData.quantity })
                    logger.info(`[orders] Restored stock for order ${orderData.id} (Status: ${newStatus})`)
                }
                // If reactivating a cancelled/refunded order, reduce stock
                else if (isCancelledOrRefunded(oldStatus) && !isCancelledOrRefunded(newStatus)) {
                    if (product.stockQuantity < orderData.quantity) {
                        return res.status(400).json({ message: `Insufficient stock to reactivate order. Available: ${product.stockQuantity}` })
                    }
                    await product.decrement('stockQuantity', { by: orderData.quantity })
                    logger.info(`[orders] Reduced stock for reactivated order ${orderData.id} (Status: ${newStatus})`)
                }
            }
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
                        actor: req.user?.email ?? 'System',
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
            message: 'Import completed',
            results
        })
    } catch (error) {
        logger.error('Failed to import orders:', error)
        return res.status(500).json({ message: 'Failed to import orders', error: error.message })
    }
}

module.exports = {
    searchOrdersByContact,
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    importOrders
}
