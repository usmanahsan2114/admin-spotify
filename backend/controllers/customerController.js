const { Customer, Order, Return } = require('../db/init').db
const { db } = require('../db/init')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const { normalizeEmail, normalizePhone, normalizeAddress } = require('../utils/helpers')

// Helper to ensure value is an array
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

// Helper to find customer by ID
const findCustomerById = async (id) => {
    if (!id) return null
    return await Customer.findByPk(id)
}

// Helper to find customer by email
const findCustomerByEmail = async (email, storeId = null) => {
    if (!email) return null
    const normalizedEmail = normalizeEmail(email)
    const where = { email: normalizedEmail }
    if (storeId) where.storeId = storeId
    return await Customer.findOne({ where })
}

// Helper to find customer by contact info
const findCustomerByContact = async (email, phone, address, storeId = null) => {
    const where = {}
    if (storeId) where.storeId = storeId

    const conditions = []
    if (email) conditions.push({ email: normalizeEmail(email) })
    if (phone) conditions.push({ phone: normalizePhone(phone) })
    if (address) conditions.push({ address: normalizeAddress(address) })

    if (conditions.length === 0) return null

    where[Op.or] = conditions
    return await Customer.findOne({ where })
}

// Helper to get orders for customer
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

// Helper to serialize customer
const serializeCustomer = async (customer) => {
    if (!customer) return null
    const ordersForCustomer = await getOrdersForCustomer(customer)
    const lastOrder = ordersForCustomer.length > 0 ? ordersForCustomer[0] : null
    const customerData = customer.toJSON ? customer.toJSON() : customer
    return {
        id: customerData.id,
        name: customerData.name || 'Unknown',
        email: customerData.email || '',
        phone: customerData.phone || 'Not provided',
        address: customerData.address || null,
        alternativePhone: customerData.alternativePhone || null,
        alternativeEmails: ensureArray(customerData.alternativeEmails),
        alternativeNames: ensureArray(customerData.alternativeNames),
        alternativeAddresses: ensureArray(customerData.alternativeAddresses),
        createdAt: customerData.createdAt || new Date().toISOString(),
        orderCount: ordersForCustomer.length,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        totalSpent: ordersForCustomer.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0),
    }
}

// Helper to serialize order
const serializeOrder = (order) => {
    if (!order) return null
    const oData = order.toJSON ? order.toJSON() : order
    return {
        ...oData,
        total: parseFloat(oData.total || 0),
        items: oData.items || [],
        timeline: oData.timeline || [],
    }
}

// Helper to serialize return
const serializeReturn = (returnItem) => {
    if (!returnItem) return null
    const rData = returnItem.toJSON ? returnItem.toJSON() : returnItem
    return {
        ...rData,
        history: rData.history || [],
    }
}

// Helper to merge customer info
const mergeCustomerInfo = (existingCustomer, newInfo) => {
    if (!existingCustomer) return newInfo

    const merged = { ...existingCustomer }

    if (newInfo.name && newInfo.name.trim() && newInfo.name.trim() !== existingCustomer.name?.trim()) {
        if (!merged.alternativeNames) merged.alternativeNames = []
        if (!merged.alternativeNames.includes(newInfo.name.trim())) {
            merged.alternativeNames.push(newInfo.name.trim())
        }
    }

    if (newInfo.email && normalizeEmail(newInfo.email) !== normalizeEmail(existingCustomer.email || '')) {
        if (!merged.alternativeEmails) merged.alternativeEmails = []
        const normalizedNewEmail = normalizeEmail(newInfo.email)
        if (!merged.alternativeEmails.some((e) => normalizeEmail(e) === normalizedNewEmail)) {
            merged.alternativeEmails.push(newInfo.email.trim())
        }
    }

    if (newInfo.phone && normalizePhone(newInfo.phone) !== normalizePhone(existingCustomer.phone || '')) {
        const normalizedNewPhone = normalizePhone(newInfo.phone)
        const normalizedExistingPhone = normalizePhone(existingCustomer.phone || '')
        const normalizedExistingAltPhone = normalizePhone(existingCustomer.alternativePhone || '')

        if (normalizedNewPhone && normalizedNewPhone !== normalizedExistingPhone && normalizedNewPhone !== normalizedExistingAltPhone) {
            if (!merged.alternativePhone) {
                merged.alternativePhone = newInfo.phone.trim()
            }
        }
    }

    if (newInfo.address && normalizeAddress(newInfo.address) !== normalizeAddress(existingCustomer.address || '')) {
        if (!merged.alternativeAddresses) merged.alternativeAddresses = []
        const normalizedNewAddress = normalizeAddress(newInfo.address)
        if (!merged.alternativeAddresses.some((a) => normalizeAddress(a) === normalizedNewAddress)) {
            merged.alternativeAddresses.push(newInfo.address.trim())
        }
    }

    merged.updatedAt = new Date().toISOString()
    return merged
}

const getCustomers = async (req, res) => {
    try {
        const storeId = req.isSuperAdmin && req.query.storeId ? req.query.storeId : req.storeId
        const storeWhere = { storeId }

        const limit = parseInt(req.query.limit || '100', 10)
        const offset = parseInt(req.query.offset || '0', 10)
        const maxLimit = 1000
        const safeLimit = Math.min(limit, maxLimit)

        const search = req.query.search
        if (search) {
            storeWhere[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
            ]
        }

        const { count, rows: customersList } = await Customer.findAndCountAll({
            where: storeWhere,
            order: [['createdAt', 'DESC']],
            limit: safeLimit,
            offset: offset,
        })

        const serializedCustomers = await Promise.all(customersList.map(serializeCustomer))

        return res.json({
            data: serializedCustomers,
            pagination: {
                total: count,
                limit: safeLimit,
                offset: offset,
                hasMore: offset + safeLimit < count
            }
        })
    } catch (error) {
        logger.error('[ERROR] /api/customers:', error)
        return res.status(500).json({ message: 'Failed to fetch customers', error: error.message })
    }
}

const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address, alternativePhone } = req.body || {}

        const existingCustomer = await findCustomerByContact(email, phone, address, req.storeId)

        if (existingCustomer) {
            const existingData = existingCustomer.toJSON ? existingCustomer.toJSON() : existingCustomer
            const mergedInfo = mergeCustomerInfo(existingData, {
                name: name ? String(name).trim() : existingData.name,
                email: email ? String(email).trim() : existingData.email,
                phone: phone ? String(phone).trim() : existingData.phone,
                address: address ? String(address).trim() : existingData.address,
                alternativePhone: alternativePhone ? String(alternativePhone).trim() : existingData.alternativePhone,
            })

            await existingCustomer.update(mergedInfo)
            await existingCustomer.reload()

            const serialized = await serializeCustomer(existingCustomer)
            return res.json(serialized)
        }

        const targetStoreId = req.isSuperAdmin && req.body.storeId ? req.body.storeId : req.storeId
        if (!targetStoreId) {
            return res.status(400).json({ message: 'Store ID is required.' })
        }

        const newCustomer = await Customer.create({
            storeId: targetStoreId,
            name: String(name).trim(),
            email: String(email).trim(),
            phone: phone ? String(phone).trim() : 'Not provided',
            address: address ? String(address).trim() : null,
            alternativePhone: alternativePhone ? String(alternativePhone).trim() : null,
            alternativeEmails: [],
            alternativeNames: [],
            alternativeAddresses: [],
        })

        const serialized = await serializeCustomer(newCustomer)
        return res.status(201).json(serialized)
    } catch (error) {
        logger.error('Failed to create customer:', error)
        return res.status(500).json({ message: 'Failed to create customer', error: error.message })
    }
}

const getCustomerById = async (req, res) => {
    try {
        const customer = await findCustomerById(req.params.id)

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' })
        }

        const customerData = customer.toJSON ? customer.toJSON() : customer

        if (!req.isSuperAdmin && customerData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Customer does not belong to your store.' })
        }

        const relatedCustomers = await Customer.findAll({
            where: {
                storeId: customerData.storeId,
                [Op.or]: [
                    { email: customerData.email },
                    { phone: customerData.phone },
                    { address: customerData.address },
                ].filter(condition => Object.values(condition)[0] && Object.values(condition)[0] !== 'Not provided')
            }
        })

        const allNames = new Set()
        const allEmails = new Set()
        const allPhones = new Set()
        const allAddresses = new Set()

        const add = (set, val) => { if (val && val !== 'Not provided' && val !== '—') set.add(val) }

        add(allNames, customerData.name)
        add(allEmails, customerData.email)
        add(allPhones, customerData.phone)
        add(allAddresses, customerData.address)
        if (customerData.alternativeNames) customerData.alternativeNames.forEach(n => add(allNames, n))
        if (customerData.alternativeEmails) customerData.alternativeEmails.forEach(e => add(allEmails, e))
        if (customerData.alternativePhones) customerData.alternativePhones.forEach(p => add(allPhones, p))
        if (customerData.alternativeAddresses) customerData.alternativeAddresses.forEach(a => add(allAddresses, a))

        for (const related of relatedCustomers) {
            const rData = related.toJSON ? related.toJSON() : related
            if (rData.id === customerData.id) continue

            add(allNames, rData.name)
            add(allEmails, rData.email)
            add(allPhones, rData.phone)
            add(allAddresses, rData.address)
            if (rData.alternativeNames) rData.alternativeNames.forEach(n => add(allNames, n))
            if (rData.alternativeEmails) rData.alternativeEmails.forEach(e => add(allEmails, e))
            if (rData.alternativePhones) rData.alternativePhones.forEach(p => add(allPhones, p))
            if (rData.alternativeAddresses) rData.alternativeAddresses.forEach(a => add(allAddresses, a))
        }

        const relatedIds = relatedCustomers.map(c => c.id)
        const orders = await Order.findAll({
            where: {
                customerId: { [Op.in]: relatedIds },
                storeId: customerData.storeId
            },
            order: [['createdAt', 'DESC']]
        })

        const returns = await Return.findAll({
            where: {
                customerId: { [Op.in]: relatedIds },
                storeId: customerData.storeId
            },
            order: [['dateRequested', 'DESC']]
        })

        const serializedOrders = await Promise.all(orders.map(o => serializeOrder(o)))
        const serializedReturns = await Promise.all(returns.map(r => serializeReturn(r)))

        const mergedCustomer = {
            ...customerData,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            alternativeNames: Array.from(allNames).filter(n => n !== customerData.name),
            alternativeEmails: Array.from(allEmails).filter(e => e !== customerData.email),
            alternativePhones: Array.from(allPhones).filter(p => p !== customerData.phone),
            alternativeAddresses: Array.from(allAddresses).filter(a => a !== customerData.address),
            orders: serializedOrders,
            returns: serializedReturns,
            orderCount: serializedOrders.length,
            totalSpent: serializedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
            lastOrderDate: serializedOrders.length > 0 ? serializedOrders[0].createdAt : null
        }

        return res.json(mergedCustomer)
    } catch (error) {
        logger.error('Failed to fetch customer:', error)
        return res.status(500).json({ message: 'Failed to fetch customer', error: error.message })
    }
}

const updateCustomer = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const customer = await findCustomerById(req.params.id)

        if (!customer) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Customer not found.' })
        }

        const customerData = customer.toJSON ? customer.toJSON() : customer

        if (!req.isSuperAdmin && customerData.storeId !== req.storeId) {
            await transaction.rollback()
            return res.status(403).json({ message: 'Customer does not belong to your store.' })
        }

        const { name, email, phone, address, alternativePhone } = req.body || {}
        const storeIdForCheck = req.isSuperAdmin ? customerData.storeId : req.storeId

        if (email && normalizeEmail(email) !== normalizeEmail(customerData.email)) {
            const existingByEmail = await findCustomerByEmail(email, storeIdForCheck)
            if (existingByEmail && existingByEmail.id !== customerData.id) {
                const existingData = existingByEmail.toJSON ? existingByEmail.toJSON() : existingByEmail
                const existingByContact = await findCustomerByContact(email, phone, address, storeIdForCheck)
                if (existingByContact && existingByContact.id !== customerData.id) {
                    const mergedInfo = mergeCustomerInfo(existingData, {
                        name: customerData.name,
                        email: customerData.email,
                        phone: customerData.phone,
                        address: customerData.address,
                        alternativePhone: customerData.alternativePhone,
                    })
                    const finalMerged = mergeCustomerInfo(mergedInfo, {
                        name: name || customerData.name,
                        email: email || customerData.email,
                        phone: phone || customerData.phone,
                        address: address !== undefined ? address : customerData.address,
                        alternativePhone: alternativePhone !== undefined ? alternativePhone : customerData.alternativePhone,
                    })

                    await Order.update(
                        { customerId: existingByContact.id },
                        { where: { customerId: customerData.id }, transaction }
                    )

                    await existingByContact.update(finalMerged, { transaction })
                    await customer.destroy({ transaction })
                    await transaction.commit()
                    await existingByContact.reload()

                    const serialized = await serializeCustomer(existingByContact)
                    return res.json(serialized)
                }
                await transaction.rollback()
                return res.status(409).json({ message: 'Email already in use by another customer.' })
            }
        }

        const mergedInfo = mergeCustomerInfo(customerData, {
            name: name || customerData.name,
            email: email || customerData.email,
            phone: phone !== undefined ? phone : customerData.phone,
            address: address !== undefined ? address : customerData.address,
            alternativePhone: alternativePhone !== undefined ? alternativePhone : customerData.alternativePhone,
        })

        await customer.update(mergedInfo, { transaction })
        await transaction.commit()
        await customer.reload()

        const serialized = await serializeCustomer(customer)
        return res.json(serialized)
    } catch (error) {
        await transaction.rollback()
        logger.error('Failed to update customer:', error)
        return res.status(500).json({ message: 'Failed to update customer', error: error.message })
    }
}

const searchCustomers = async (req, res) => {
    try {
        const { query } = req.query
        if (!query || query.trim().length < 2) {
            return res.json([])
        }

        const storeId = req.isSuperAdmin && req.query.storeId ? req.query.storeId : req.storeId
        const where = {
            storeId,
            [Op.or]: [
                { name: { [Op.like]: `%${query}%` } },
                { email: { [Op.like]: `%${query}%` } },
                { phone: { [Op.like]: `%${query}%` } },
            ]
        }

        const customers = await Customer.findAll({
            where,
            limit: 20,
            attributes: ['id', 'name', 'email', 'phone', 'address', 'alternativeNames', 'alternativeEmails', 'alternativePhones', 'alternativeAddresses']
        })

        return res.json(customers)
    } catch (error) {
        logger.error('Failed to search customers:', error)
        return res.status(500).json({ message: 'Failed to search customers', error: error.message })
    }
}

const getCustomerOrders = async (req, res) => {
    try {
        const customerId = req.customer?.customerId
        if (!customerId) {
            return res.status(401).json({ message: 'Customer authentication required.' })
        }

        const customer = await findCustomerById(customerId)
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' })
        }

        const ordersForCustomer = await getOrdersForCustomer(customer)
        return res.json(ordersForCustomer)
    } catch (error) {
        logger.error('[ERROR] /api/customers/me/orders:', error)
        return res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
    }
}

module.exports = {
    getCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    getCustomerOrders,
    findCustomerById,
    findCustomerByContact,
    findCustomerByEmail,
    mergeCustomerInfo,
    serializeCustomer,
    getOrdersForCustomer,
    searchCustomers,
}
