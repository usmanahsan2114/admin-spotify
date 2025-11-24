const { Setting, Store } = require('../db/init').db
const logger = require('../utils/logger')

// Helper to find store by ID
const findStoreById = async (storeId) => {
    if (!storeId) return null
    return await Store.findByPk(storeId)
}

// Helper to get store settings (per store)
const getStoreSettings = async (storeId) => {
    if (!storeId) return null
    const setting = await Setting.findOne({ where: { storeId } })
    if (setting) {
        return {
            logoUrl: setting.logoUrl,
            brandColor: setting.brandColor,
            defaultCurrency: setting.defaultCurrency || 'PKR',
            country: setting.country || 'PK',
            dashboardName: setting.dashboardName,
        }
    }
    // Fallback to store defaults
    const store = await findStoreById(storeId)
    if (store) {
        return {
            logoUrl: store.logoUrl,
            brandColor: store.brandColor,
            defaultCurrency: store.defaultCurrency || 'PKR',
            country: store.country || 'PK',
            dashboardName: store.dashboardName,
        }
    }
    return null
}

const getPublicBusinessSettings = async (req, res) => {
    try {
        // Get storeId from query param
        // If no storeId provided, return generic settings (for public pages like login/signup)
        const storeId = req.query.storeId

        // Set cache control for 10 minutes
        res.set('Cache-Control', 'public, max-age=600')

        if (!storeId) {
            // Return generic settings for public pages (no store-specific branding)
            return res.json({
                logoUrl: null,
                dashboardName: 'Shopify Admin Dashboard',
                defaultCurrency: 'PKR',
                country: 'PK',
            })
        }

        // If storeId provided, return store-specific settings (for store-specific public pages)
        const storeSettings = await getStoreSettings(storeId)

        if (!storeSettings) {
            // Return default settings if store not found
            return res.json({
                logoUrl: null,
                dashboardName: 'Shopify Admin Dashboard',
                defaultCurrency: 'PKR',
                country: 'PK',
            })
        }

        return res.json(storeSettings)
    } catch (error) {
        logger.error('[ERROR] /api/settings/business/public:', error)
        return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
    }
}

const getBusinessSettings = async (req, res) => {
    try {
        // Superadmin can specify storeId in query, regular admin uses their store
        // For superadmin without storeId, return default/generic settings
        if (req.isSuperAdmin && !req.query.storeId && !req.storeId) {
            return res.json({
                logoUrl: null,
                dashboardName: 'Super Admin Dashboard',
                defaultCurrency: 'PKR',
                country: 'PK',
                brandColor: '#1976d2',
            })
        }

        const targetStoreId = req.isSuperAdmin && req.query.storeId ? req.query.storeId : req.storeId
        if (!targetStoreId) {
            return res.status(400).json({ message: 'Store ID is required.' })
        }

        // Return store-specific settings
        const storeSettings = await getStoreSettings(targetStoreId)
        if (!storeSettings) {
            return res.status(404).json({ message: 'Store settings not found.' })
        }
        return res.json(storeSettings)
    } catch (error) {
        logger.error('[ERROR] /api/settings/business:', error)
        return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
    }
}

const updateBusinessSettings = async (req, res) => {
    try {
        // Superadmin can specify storeId in body, regular admin uses their store
        const targetStoreId = req.isSuperAdmin && req.body.storeId ? req.body.storeId : req.storeId
        if (!targetStoreId) {
            return res.status(400).json({ message: 'Store ID is required.' })
        }

        const store = await findStoreById(targetStoreId)
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' })
        }

        const allowedFields = ['logoUrl', 'brandColor', 'defaultCurrency', 'country', 'dashboardName']
        const updateData = {}
        Object.entries(req.body).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                updateData[key] = value
            }
        })

        // Update store or create/update Setting record
        await store.update(updateData)

        // Also update Setting if it exists
        let setting = await Setting.findOne({ where: { storeId: targetStoreId } })
        if (setting) {
            await setting.update(updateData)
        } else {
            await Setting.create({
                storeId: targetStoreId,
                ...updateData,
            })
        }

        const storeSettings = await getStoreSettings(targetStoreId)
        return res.json(storeSettings)
    } catch (error) {
        logger.error('[ERROR] /api/settings/business:', error)
        return res.status(500).json({ message: 'Failed to update business settings', error: error.message })
    }
}

module.exports = {
    getPublicBusinessSettings,
    getBusinessSettings,
    updateBusinessSettings,
    getStoreSettings // Exporting helper in case it's needed elsewhere, though mainly for internal use
}
