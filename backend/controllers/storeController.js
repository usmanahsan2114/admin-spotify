const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { Store, User, Order, Product, Customer, Return, Setting } = require('../db/init').db
const logger = require('../utils/logger')
const { generateMultiStoreData } = require('../generateMultiStoreData')

// Helper to find store by ID
const findStoreById = async (storeId) => {
    if (!storeId) return null
    return await Store.findByPk(storeId)
}

const getStores = async (req, res) => {
    try {
        const storesList = await Store.findAll({
            attributes: ['id', 'name', 'dashboardName', 'domain', 'category', 'isDemo'],
            order: [['name', 'ASC']],
        })
        return res.json(storesList.map(store => store.toJSON ? store.toJSON() : store))
    } catch (error) {
        logger.error('[ERROR] /api/stores:', error)
        return res.status(500).json({ message: 'Failed to fetch stores', error: error.message })
    }
}

const getStoresAdmin = async (req, res) => {
    try {
        const where = req.isSuperAdmin ? {} : { id: req.storeId }

        const storesList = await Store.findAll({
            where,
            attributes: ['id', 'name', 'dashboardName', 'domain', 'category', 'isDemo', 'createdAt', 'defaultCurrency', 'country', 'logoUrl', 'brandColor'],
            order: [['name', 'ASC']],
        })

        const storesWithCounts = await Promise.all(
            storesList.map(async (store) => {
                const storeId = store.id

                const userCount = await User.count({ where: { storeId } })
                const orderCount = await Order.count({ where: { storeId } })
                const productCount = await Product.count({ where: { storeId } })
                const customerCount = await Customer.count({ where: { storeId } })

                const orders = await Order.findAll({
                    where: { storeId },
                    attributes: ['total'],
                    raw: true,
                })
                const totalRevenue = orders.reduce((sum, order) => {
                    const orderTotal = order.total != null ? parseFloat(order.total) || 0 : 0
                    return sum + orderTotal
                }, 0)

                const pendingOrdersCount = await Order.count({
                    where: {
                        storeId,
                        status: 'Pending'
                    }
                })

                const { Sequelize } = require('sequelize')
                const lowStockCount = await Product.count({
                    where: {
                        storeId,
                        stockQuantity: {
                            [Op.lte]: Sequelize.col('reorderThreshold')
                        }
                    }
                })

                const adminUser = await User.findOne({
                    where: {
                        storeId,
                        role: 'admin'
                    },
                    attributes: ['id', 'email', 'name', 'active'],
                    raw: true
                })

                const storeData = store.toJSON ? store.toJSON() : store
                return {
                    ...storeData,
                    userCount,
                    orderCount,
                    productCount,
                    customerCount,
                    totalRevenue,
                    pendingOrdersCount,
                    lowStockCount,
                    adminUser: adminUser ? {
                        id: adminUser.id,
                        email: adminUser.email,
                        name: adminUser.name,
                        active: adminUser.active
                    } : null,
                }
            })
        )

        return res.json(storesWithCounts)
    } catch (error) {
        logger.error('[ERROR] /api/stores/admin:', error)
        return res.status(500).json({ message: 'Failed to fetch stores', error: error.message })
    }
}

const createStore = async (req, res) => {
    try {
        const { name, dashboardName, domain, category, defaultCurrency, country, logoUrl, brandColor, isDemo } = req.body

        const existingStore = await Store.findOne({ where: { domain } })
        if (existingStore) {
            return res.status(409).json({ message: 'A store with this domain already exists.' })
        }

        const newStore = await Store.create({
            name: String(name).trim(),
            dashboardName: String(dashboardName).trim(),
            domain: String(domain).trim(),
            category: String(category).trim(),
            defaultCurrency: defaultCurrency || 'PKR',
            country: country || 'PK',
            logoUrl: logoUrl ? String(logoUrl).trim() : null,
            brandColor: brandColor || '#1976d2',
            isDemo: Boolean(isDemo),
        })

        await Setting.create({
            storeId: newStore.id,
            defaultCurrency: defaultCurrency || 'PKR',
            country: country || 'PK',
        })

        const storeData = newStore.toJSON ? newStore.toJSON() : newStore
        return res.status(201).json(storeData)
    } catch (error) {
        logger.error('[ERROR] /api/stores POST:', error)
        return res.status(500).json({ message: 'Failed to create store', error: error.message })
    }
}

const updateStore = async (req, res) => {
    try {
        const store = await Store.findByPk(req.params.id)
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' })
        }

        const { name, dashboardName, domain, category, defaultCurrency, country, logoUrl, brandColor, isDemo } = req.body

        if (domain && domain !== store.domain) {
            const existingStore = await Store.findOne({ where: { domain } })
            if (existingStore) {
                return res.status(409).json({ message: 'A store with this domain already exists.' })
            }
        }

        const updateData = {}
        if (name !== undefined) updateData.name = String(name).trim()
        if (dashboardName !== undefined) updateData.dashboardName = String(dashboardName).trim()
        if (domain !== undefined) updateData.domain = String(domain).trim()
        if (category !== undefined) updateData.category = String(category).trim()
        if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency
        if (country !== undefined) updateData.country = country
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? String(logoUrl).trim() : null
        if (brandColor !== undefined) updateData.brandColor = brandColor
        if (isDemo !== undefined) updateData.isDemo = Boolean(isDemo)

        await store.update(updateData)
        await store.reload()

        const storeData = store.toJSON ? store.toJSON() : store
        return res.json(storeData)
    } catch (error) {
        logger.error('[ERROR] /api/stores PUT:', error)
        return res.status(500).json({ message: 'Failed to update store', error: error.message })
    }
}

const updateStoreAdminCredentials = async (req, res) => {
    try {
        const store = await Store.findByPk(req.params.id)
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' })
        }

        const { email, password, name } = req.body

        let adminUser = await User.findOne({
            where: {
                storeId: store.id,
                role: 'admin'
            }
        })

        if (adminUser) {
            const updateData = {}
            if (email) {
                if (email.toLowerCase() !== adminUser.email.toLowerCase()) {
                    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } })
                    if (existingUser && existingUser.id !== adminUser.id) {
                        return res.status(409).json({ message: 'An account with this email already exists.' })
                    }
                }
                updateData.email = email.toLowerCase()
            }
            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10)
                updateData.passwordChangedAt = new Date()
            }
            if (name) updateData.name = String(name).trim()

            await adminUser.update(updateData)
            await adminUser.reload()
        } else {
            if (!password) {
                return res.status(400).json({ message: 'Password is required for new admin account.' })
            }

            const passwordHash = await bcrypt.hash(password, 10)
            adminUser = await User.create({
                storeId: store.id,
                email: email.toLowerCase(),
                name: name || `Admin - ${store.name}`,
                role: 'admin',
                passwordHash,
                active: true,
                permissions: {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                },
            })
        }

        const userData = adminUser.toJSON ? adminUser.toJSON() : adminUser
        return res.json({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            active: userData.active,
            storeId: userData.storeId,
        })
    } catch (error) {
        logger.error('[ERROR] /api/stores/:id/admin-credentials:', error)
        return res.status(500).json({ message: 'Failed to create/update admin credentials', error: error.message })
    }
}

const deleteStore = async (req, res) => {
    try {
        const store = await Store.findByPk(req.params.id)
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' })
        }

        if (store.isDemo) {
            return res.status(400).json({ message: 'Demo store cannot be deleted.' })
        }

        const storeId = store.id
        const storeName = store.name

        // Use db.sequelize.transaction if possible, but we need access to db instance
        // We imported models from db.init.db, so we can access sequelize there
        const { sequelize } = require('../db/init').db

        await sequelize.transaction(async (transaction) => {
            await Order.destroy({ where: { storeId }, transaction })
            await Return.destroy({ where: { storeId }, transaction })
            await Product.destroy({ where: { storeId }, transaction })
            await Customer.destroy({ where: { storeId }, transaction })
            await Setting.destroy({ where: { storeId }, transaction }).catch(() => { })
            await User.destroy({ where: { storeId }, transaction })
            await store.destroy({ transaction })
        })

        logger.info(`[STORES] Store deleted: ${storeName} (${storeId})`)
        return res.json({ message: `Store "${storeName}" has been deleted successfully along with all associated data.` })
    } catch (error) {
        logger.error('[ERROR] /api/stores/:id DELETE:', error)
        return res.status(500).json({ message: 'Failed to delete store', error: error.message })
    }
}

const resetDemoData = async (req, res) => {
    try {
        const demoStore = await Store.findOne({ where: { isDemo: true } })
        if (!demoStore) {
            return res.status(404).json({ message: 'Demo store not found.' })
        }

        const demoStoreId = demoStore.id

        await Order.destroy({ where: { storeId: demoStoreId } })
        await Return.destroy({ where: { storeId: demoStoreId } })
        await Product.destroy({ where: { storeId: demoStoreId } })
        await Customer.destroy({ where: { storeId: demoStoreId } })

        const multiStoreData = generateMultiStoreData()
        const demoStoreTemplate = multiStoreData.stores.find(s => s.isDemo)

        if (!demoStoreTemplate) {
            return res.status(500).json({ message: 'Demo store template not found in seed data.' })
        }

        const demoProducts = [
            { name: 'Demo Product 1', price: 29.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 10 },
            { name: 'Demo Product 2', price: 49.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 8 },
            { name: 'Demo Product 3', price: 19.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 12 },
            { name: 'Demo Product 4', price: 39.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 6 },
            { name: 'Demo Product 5', price: 59.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 9 },
        ]

        for (const prodTemplate of demoProducts) {
            await Product.create({
                storeId: demoStoreId,
                name: prodTemplate.name,
                price: prodTemplate.price,
                stockQuantity: prodTemplate.stockQuantity,
                reorderThreshold: prodTemplate.reorderThreshold,
                description: prodTemplate.description,
                category: prodTemplate.category,
                status: prodTemplate.status,
            })
        }

        const demoCustomerNames = ['John Demo', 'Jane Demo', 'Bob Demo', 'Alice Demo', 'Charlie Demo', 'Diana Demo', 'Eve Demo', 'Frank Demo', 'Grace Demo', 'Henry Demo']
        for (const name of demoCustomerNames) {
            await Customer.create({
                storeId: demoStoreId,
                name,
                email: `${name.toLowerCase().replace(' ', '.')}@demo.shopifyadmin.pk`,
                phone: `+92${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                address: `${Math.floor(Math.random() * 9999) + 1} Demo St, Demo City`,
            })
        }

        logger.info('[DEMO] Demo store data reset successfully')

        return res.json({
            message: 'Demo store data reset successfully.',
            resetAt: new Date().toISOString(),
        })
    } catch (error) {
        logger.error('[ERROR] /api/demo/reset-data:', error)
        return res.status(500).json({ message: 'Failed to reset demo store data', error: error.message })
    }
}

module.exports = {
    getStores,
    getStoresAdmin,
    createStore,
    updateStore,
    updateStoreAdminCredentials,
    deleteStore,
    resetDemoData,
}
