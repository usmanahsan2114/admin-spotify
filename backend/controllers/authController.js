const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { User, Store, RefreshToken } = require('../db/init').db
const { recordFailedAttempt, resetLoginAttempts } = require('../middleware/accountLockout')
const logger = require('../utils/logger')
const { normalizeEmail, sanitizeUser } = require('../utils/helpers')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-please-change'

// Helper to find store by ID
const findStoreById = async (storeId) => {
    if (!storeId) return null
    return await Store.findByPk(storeId)
}

// Find user by email
const findUserByEmail = async (email, storeId = null) => {
    if (!email) return null
    const normalizedEmail = normalizeEmail(email)
    const where = { email: normalizedEmail }
    if (storeId) where.storeId = storeId
    return await User.findOne({ where })
}

const generateTokens = async (user, ipAddress) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, storeId: user.storeId },
        JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    )

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    await RefreshToken.create({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        createdByIp: ipAddress
    })

    return { accessToken, refreshToken, expiresAt }
}

const setTokenCookie = (res, token, expiresAt) => {
    const cookieOptions = {
        httpOnly: true,
        expires: expiresAt,
        path: '/api/refresh-token', // Only send cookie to refresh endpoint
        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        sameSite: 'strict'
    }
    res.cookie('refreshToken', token, cookieOptions)
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const normalizedEmail = normalizeEmail(email)

        const user = await User.findOne({
            where: {
                email: normalizedEmail,
            },
        })

        if (!user) {
            logger.warn(`[LOGIN] User not found: ${email} (normalized: ${normalizedEmail})`)
            recordFailedAttempt(email)
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password.',
                    code: 'INVALID_CREDENTIALS',
                },
            })
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) {
            logger.warn(`[LOGIN] Password mismatch for: ${email}`)
            recordFailedAttempt(email)
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password.',
                    code: 'INVALID_CREDENTIALS',
                },
            })
        }

        resetLoginAttempts(email)

        if (!user.active) {
            return res.status(403).json({ message: 'Account is inactive.' })
        }

        const userData = user.toJSON ? user.toJSON() : user
        const store = user.storeId ? await findStoreById(user.storeId) : null

        const { accessToken, refreshToken, expiresAt } = await generateTokens(user, req.ip)

        setTokenCookie(res, refreshToken, expiresAt)

        return res.json({
            token: accessToken,
            user: sanitizeUser(userData),
            needsPasswordChange: !user.passwordChangedAt,
            store: store ? {
                id: store.id,
                name: store.name,
                dashboardName: store.dashboardName,
            } : null,
        })
    } catch (error) {
        logger.error('[ERROR] /api/login:', error)
        return res.status(500).json({ message: 'Login failed', error: error.message })
    }
}

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken
        if (!token) return res.status(401).json({ message: 'Token required' })

        const refreshTokenRecord = await RefreshToken.findOne({ where: { token } })

        if (!refreshTokenRecord || refreshTokenRecord.revoked || Date.now() >= refreshTokenRecord.expiresAt) {
            // If token is revoked or expired, or not found
            if (refreshTokenRecord && !refreshTokenRecord.revoked) {
                // Revoke it if it was valid but expired
                refreshTokenRecord.revoked = new Date()
                await refreshTokenRecord.save()
            }
            return res.status(401).json({ message: 'Invalid token' })
        }

        const user = await User.findByPk(refreshTokenRecord.userId)
        if (!user) return res.status(401).json({ message: 'User not found' })

        // Rotate tokens
        refreshTokenRecord.revoked = new Date()
        refreshTokenRecord.replacedByToken = 'rotated' // Placeholder, or actual new token
        await refreshTokenRecord.save()

        const { accessToken, refreshToken: newRefreshToken, expiresAt } = await generateTokens(user, req.ip)

        // Update the old record with the new token for tracking (optional, but good for security audit)
        refreshTokenRecord.replacedByToken = newRefreshToken
        await refreshTokenRecord.save()

        setTokenCookie(res, newRefreshToken, expiresAt)

        return res.json({
            token: accessToken,
            user: sanitizeUser(user)
        })

    } catch (error) {
        logger.error('Refresh token failed:', error)
        return res.status(500).json({ message: 'Refresh failed', error: error.message })
    }
}

const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken
        if (token) {
            const refreshTokenRecord = await RefreshToken.findOne({ where: { token } })
            if (refreshTokenRecord) {
                refreshTokenRecord.revoked = new Date()
                await refreshTokenRecord.save()
            }
        }

        res.clearCookie('refreshToken', { path: '/api/refresh-token' })
        return res.json({ message: 'Logged out successfully' })
    } catch (error) {
        logger.error('Logout failed:', error)
        return res.status(500).json({ message: 'Logout failed', error: error.message })
    }
}

const signup = async (req, res) => {
    try {
        const { email, password, name, role, storeId } = req.body

        const existingUser = await findUserByEmail(email)
        if (existingUser) {
            return res.status(409).json({ message: 'An account with that email already exists.' })
        }

        const userRole = role && ['admin', 'staff'].includes(role) ? role : 'staff'
        const passwordHash = await bcrypt.hash(password, 10)

        let userPermissions
        if (userRole === 'admin') {
            userPermissions = {
                viewOrders: true, editOrders: true, deleteOrders: true,
                viewProducts: true, editProducts: true, deleteProducts: true,
                viewCustomers: true, editCustomers: true,
                viewReturns: true, processReturns: true,
                viewReports: true, manageUsers: true, manageSettings: true,
            }
        } else {
            userPermissions = {
                viewOrders: true, editOrders: true, deleteOrders: false,
                viewProducts: true, editProducts: true, deleteProducts: false,
                viewCustomers: true, editCustomers: false,
                viewReturns: true, processReturns: true,
                viewReports: true, manageUsers: false, manageSettings: false,
            }
        }

        let targetStoreId = storeId
        if (!targetStoreId) {
            const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
            if (!firstStore) {
                return res.status(400).json({ message: 'No store available. Please create a store first.' })
            }
            targetStoreId = firstStore.id
        } else {
            const store = await findStoreById(targetStoreId)
            if (!store) {
                return res.status(400).json({ message: 'Invalid store ID.' })
            }
        }

        const newUser = await User.create({
            storeId: targetStoreId,
            email: email.toLowerCase(),
            name,
            role: userRole,
            passwordHash,
            active: true,
            permissions: userPermissions,
            profilePictureUrl: null,
            fullName: name,
            phone: null,
            defaultDateRangeFilter: 'last7',
            notificationPreferences: {
                newOrders: true,
                lowStock: true,
                returnsPending: true,
            },
        })

        const userData = newUser.toJSON ? newUser.toJSON() : newUser
        const store = await findStoreById(targetStoreId)

        const { accessToken, refreshToken, expiresAt } = await generateTokens(newUser, req.ip)

        setTokenCookie(res, refreshToken, expiresAt)

        return res.status(201).json({
            token: accessToken,
            user: sanitizeUser(userData),
            store: store ? {
                id: store.id,
                name: store.name,
                dashboardName: store.dashboardName,
            } : null,
        })
    } catch (error) {
        logger.error('Signup failed:', error)
        return res.status(500).json({ message: 'Signup failed', error: error.message })
    }
}

module.exports = {
    login,
    signup,
    refreshToken,
    logout
}
