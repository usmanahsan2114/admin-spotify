const { Store } = require('../db/init').db
const logger = require('../utils/logger')

const restrictDemoStore = async (req, res, next) => {
    try {
        // If storeId is in request (from auth middleware)
        if (req.storeId) {
            const store = await Store.findByPk(req.storeId)
            if (store && store.isDemo) {
                return res.status(403).json({
                    message: 'This is a demo store. Write operations are restricted.',
                    isDemo: true
                })
            }
        }
        next()
    } catch (error) {
        logger.error('Demo store check failed:', error)
        next()
    }
}

module.exports = {
    restrictDemoStore
}
