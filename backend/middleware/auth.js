const jwt = require('jsonwebtoken')
const { User } = require('../db/init').db
const logger = require('../utils/logger')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]

    if (!token) {
        logger.debug('[AUTH] No token provided in Authorization header')
        return res.status(401).json({ message: 'Authorization token required.' })
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET)

        const user = await User.findByPk(payload.userId)
        if (!user) {
            logger.warn(`[AUTH] User not found for userId: ${payload.userId}`)
            return res.status(401).json({ message: 'User not found.' })
        }

        if (!user.active) {
            return res.status(403).json({ message: 'Account is inactive.' })
        }

        req.user = user.toJSON ? user.toJSON() : user
        req.storeId = user.storeId
        req.isSuperAdmin = user.role === 'superadmin'

        return next()
    } catch (error) {
        logger.warn('[AUTH] Token verification failed:', error.message)
        return res.status(401).json({ message: 'Invalid or expired token.' })
    }
}

const authorizeRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions.' })
    }
    return next()
}

const authorizeSuperAdminOrStoreAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: 'Authentication required.' })
    }
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
        return next()
    }
    return res.status(403).json({ message: 'Admin or superadmin access required.' })
}

const canAccessStore = (storeId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Authentication required.' })
        }
        if (req.user.role === 'superadmin') {
            return next()
        }
        if (req.user.storeId === storeId) {
            return next()
        }
        return res.status(403).json({ message: 'Access denied to this store.' })
    }
}

const buildStoreFilter = (req) => {
    if (req.isSuperAdmin) {
        return {}
    }
    return { storeId: req.storeId }
}

const buildStoreWhere = (req, baseWhere = {}) => {
    if (req.isSuperAdmin) {
        return baseWhere
    }
    return { ...baseWhere, storeId: req.storeId }
}

const authenticateCustomer = (req, res, next) => {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'Authorization token required.' })
    }

    return jwt.verify(token, JWT_SECRET, (error, payload) => {
        if (error || payload.type !== 'customer') {
            return res.status(401).json({ message: 'Invalid or expired customer token.' })
        }

        req.customer = payload // Attach customer payload
        return next()
    })
}

module.exports = {
    authenticateToken,
    authorizeRole,
    authorizeSuperAdminOrStoreAdmin,
    canAccessStore,
    buildStoreFilter,
    buildStoreWhere,
    authenticateCustomer,
}
