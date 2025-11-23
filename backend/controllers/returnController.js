const crypto = require('crypto')
const { Op } = require('sequelize')
const { Return, Order, Product, Customer, Store, User } = require('../db/init').db
const logger = require('../utils/logger')
const { normalizeEmail, normalizePhone, normalizeAddress } = require('../utils/helpers')

// Helpers
const findReturnById = async (id) => {
    if (!id) return null
    return await Return.findByPk(id)
}

const findOrderById = async (id) => {
    if (!id) return null
    return await Order.findByPk(id)
}

const findCustomerById = async (id) => {
    if (!id) return null
    return await Customer.findByPk(id)
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

    // Additional check for alternative emails/phones/addresses in JSON fields
    if (customer) {
        const customerData = customer.toJSON ? customer.toJSON() : customer
        if (normalizedEmail && customerData.alternativeEmails && Array.isArray(customerData.alternativeEmails)) {
            if (customerData.alternativeEmails.some((altEmail) => normalizeEmail(altEmail) === normalizedEmail)) return customer
        }
        if (normalizedPhone && customerData.alternativePhones && Array.isArray(customerData.alternativePhones)) {
            if (customerData.alternativePhones.some((altPhone) => normalizePhone(altPhone) === normalizedPhone)) return customer
        }
        if (normalizedAddress && customerData.alternativeAddresses && Array.isArray(customerData.alternativeAddresses)) {
            if (customerData.alternativeAddresses.some((altAddress) => normalizeAddress(altAddress) === normalizedAddress)) return customer
        }
    }

    return customer
}

const findOrderProduct = async (order) => {
    if (!order) return null
    if (order.productId) {
        return await Product.findByPk(order.productId)
    }
    if (order.productName) {
        return await Product.findOne({
            where: {
                name: { [Op.like]: order.productName },
                storeId: order.storeId,
            },
        })
    }
    return null
}

const serializeReturn = async (returnRequest) => {
    const order = await findOrderById(returnRequest.orderId)
    const customer =
        (returnRequest.customerId && await findCustomerById(returnRequest.customerId)) ||
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

const ensureReturnCustomer = async (returnRequest) => {
    if (returnRequest.customerId) return returnRequest
    const order = await findOrderById(returnRequest.orderId)
    if (!order) return returnRequest
    const customer =
        (order.customerId && await findCustomerById(order.customerId)) ||
        await findCustomerByContact(order.email, order.phone, null, order.storeId)
    if (customer) {
        returnRequest.customerId = customer.id
        await returnRequest.save()
    }
    return returnRequest
}

const linkReturnToOrder = async (returnRequest) => {
    const order = await findOrderById(returnRequest.orderId)
    if (!order) return
    const timeline = order.timeline || []
    timeline.push({
        id: crypto.randomUUID(),
        description: `Return request created: ${returnRequest.id}`,
        timestamp: new Date().toISOString(),
        actor: 'System',
    })
    order.timeline = timeline
    await order.save()
}

const appendReturnHistory = (returnRequest, status, actor, note) => {
    if (!returnRequest) return
    returnRequest.history = returnRequest.history || []
    returnRequest.history.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status,
        actor: actor || 'System',
        note: note || '',
    })
}

const adjustProductStockForReturn = async (returnRequest, transaction = null) => {
    if (!returnRequest || !returnRequest.orderId) return
    const order = await findOrderById(returnRequest.orderId)
    if (!order) return

    const product = await findOrderProduct(order)
    if (product && returnRequest.returnedQuantity) {
        const productData = product.toJSON ? product.toJSON() : product
        const newStockQuantity = (productData.stockQuantity || 0) + returnRequest.returnedQuantity
        await product.update({ stockQuantity: newStockQuantity }, { transaction })
    }
}

const buildStoreWhere = (req, baseWhere = {}) => {
    if (req.isSuperAdmin) {
        return baseWhere
    }
    return { ...baseWhere, storeId: req.storeId }
}

// Controller Functions

const getReturns = async (req, res) => {
    try {
        const where = buildStoreWhere(req)

        const startDate = req.query.startDate
        const endDate = req.query.endDate

        if (startDate || endDate) {
            where.dateRequested = {}
            if (startDate) {
                where.dateRequested[Op.gte] = new Date(startDate)
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.dateRequested[Op.lte] = end
            }
        }

        const returnsList = await Return.findAll({
            where,
            order: [['dateRequested', 'DESC']],
        })

        const serializedReturns = await Promise.all(
            returnsList.map(r => serializeReturn(r))
        )

        return res.json(serializedReturns)
    } catch (error) {
        logger.error('Failed to fetch returns:', error)
        return res.status(500).json({ message: 'Failed to fetch returns', error: error.message })
    }
}

const getReturnById = async (req, res) => {
    try {
        const returnRequest = await findReturnById(req.params.id)
        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found.' })
        }

        const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest

        if (!req.isSuperAdmin && returnData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Return does not belong to your store.' })
        }

        const serialized = await serializeReturn(returnRequest)
        return res.json(serialized)
    } catch (error) {
        logger.error('Failed to fetch return:', error)
        return res.status(500).json({ message: 'Failed to fetch return', error: error.message })
    }
}

const createReturn = async (req, res) => {
    const transaction = await Return.sequelize.transaction()
    try {
        const { orderId, customerId, reason, returnedQuantity, status } = req.body || {}

        const order = await findOrderById(orderId)
        if (!order) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Order not found.' })
        }

        const orderData = order.toJSON ? order.toJSON() : order

        const existingReturns = await Return.findAll({
            where: { orderId },
            transaction,
        })
        const totalReturnedQuantity = existingReturns.reduce((sum, r) => {
            const rData = r.toJSON ? r.toJSON() : r
            if (rData.status === 'Rejected') return sum
            return sum + (rData.returnedQuantity || 0)
        }, 0)
        const remainingQuantity = orderData.quantity - totalReturnedQuantity

        const quantityNumber = Number(returnedQuantity)
        if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'returnedQuantity must be a positive number.' })
        }

        if (quantityNumber > remainingQuantity) {
            await transaction.rollback()
            return res
                .status(400)
                .json({ message: `returnedQuantity cannot exceed the remaining order quantity (${remainingQuantity} available).` })
        }

        const newReturn = await Return.create({
            orderId,
            customerId,
            storeId: orderData.storeId,
            reason,
            status: status || 'Submitted',
            dateRequested: new Date(),
            returnedQuantity: quantityNumber,
            refundAmount: 0,
        }, { transaction })

        appendReturnHistory(newReturn, newReturn.status, req.user?.email, 'Return request created')
        await newReturn.save({ transaction })

        await transaction.commit()

        // Post-creation tasks (non-blocking or separate transaction if needed, but here we just await)
        await ensureReturnCustomer(newReturn)
        await linkReturnToOrder(newReturn)

        logger.info(`[returns] New return created: ${newReturn.id}`)
        const serialized = await serializeReturn(newReturn)
        return res.status(201).json(serialized)
    } catch (error) {
        await transaction.rollback()
        logger.error('Failed to create return:', error)
        return res.status(500).json({ message: 'Failed to create return', error: error.message })
    }
}

const updateReturn = async (req, res) => {
    const transaction = await Return.sequelize.transaction()
    try {
        const returnRequest = await findReturnById(req.params.id)
        if (!returnRequest) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Return request not found.' })
        }

        const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest

        if (!req.isSuperAdmin && returnData.storeId !== req.storeId) {
            await transaction.rollback()
            return res.status(403).json({ message: 'Return does not belong to your store.' })
        }

        const { status, refundAmount, note } = req.body
        const previousStatus = returnData.status

        if (status) returnRequest.status = status
        if (refundAmount !== undefined) returnRequest.refundAmount = refundAmount

        if (status && status !== previousStatus) {
            appendReturnHistory(returnRequest, status, req.user?.email, note || `Status changed from ${previousStatus} to ${status}`)

            if (status === 'Approved' && previousStatus !== 'Approved') {
                await adjustProductStockForReturn(returnRequest, transaction)
            }
        } else if (note) {
            appendReturnHistory(returnRequest, returnRequest.status, req.user?.email, note)
        }

        await returnRequest.save({ transaction })
        await transaction.commit()
        await returnRequest.reload()

        const serialized = await serializeReturn(returnRequest)
        return res.json(serialized)
    } catch (error) {
        await transaction.rollback()
        logger.error('Failed to update return:', error)
        return res.status(500).json({ message: 'Failed to update return', error: error.message })
    }
}

const deleteReturn = async (req, res) => {
    try {
        const returnRequest = await findReturnById(req.params.id)
        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found.' })
        }

        const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest

        if (!req.isSuperAdmin && returnData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Return does not belong to your store.' })
        }

        await returnRequest.destroy()
        return res.json({ message: 'Return request deleted successfully.' })
    } catch (error) {
        logger.error('Failed to delete return:', error)
        return res.status(500).json({ message: 'Failed to delete return', error: error.message })
    }
}

module.exports = {
    getReturns,
    getReturnById,
    createReturn,
    updateReturn,
    deleteReturn,
}
