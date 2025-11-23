const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User, Store } = require('../db/init').db
const logger = require('../utils/logger')
const { normalizeEmail, sanitizeUser } = require('../utils/helpers')
const { buildStoreWhere } = require('../middleware/auth')

// Helper to find user by email (duplicated to avoid circular dependency or complex exports)
const findUserByEmail = async (email, storeId = null) => {
    if (!email) return null
    const normalizedEmail = normalizeEmail(email)
    const where = { email: normalizedEmail }
    if (storeId) where.storeId = storeId
    return await User.findOne({ where })
}

const getUsers = async (req, res) => {
    try {
        // Fetch users (superadmin sees all, admin sees only their store)
        const where = buildStoreWhere(req)

        // Apply date filtering if provided (filter by createdAt)
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

        const usersList = await User.findAll({
            where,
            order: [['createdAt', 'DESC']],
        })
        return res.json(usersList.map((user) => {
            const userData = user.toJSON ? user.toJSON() : user
            return sanitizeUser(userData)
        }))
    } catch (error) {
        logger.error('Failed to fetch users:', error)
        return res.status(500).json({ message: 'Failed to fetch users', error: error.message })
    }
}

const getCurrentUser = (req, res) => {
    // req.user is already set by authenticateToken middleware (full user object)
    if (!req.user || !req.user.id) {
        logger.error('[ERROR] /api/users/me: req.user is missing or invalid', { user: req.user })
        return res.status(401).json({ message: 'Invalid or missing token.' })
    }
    // User is already found and attached by authenticateToken, just return it
    return res.json(sanitizeUser(req.user))
}

const changePassword = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Invalid or missing token.' })
        }

        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long.' })
        }

        // Find user in database to get passwordHash
        const user = await User.findByPk(req.user.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found.' })
        }

        // Verify current password
        if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
            return res.status(401).json({ message: 'Current password is incorrect.' })
        }

        // Update password and set passwordChangedAt
        const hashedPassword = bcrypt.hashSync(newPassword, 10)
        await user.update({
            passwordHash: hashedPassword,
            passwordChangedAt: new Date(),
        })

        logger.info(`[PASSWORD] Password changed for user: ${user.email}`)

        return res.json({ message: 'Password changed successfully.' })
    } catch (error) {
        logger.error('[ERROR] /api/users/me/change-password:', error)
        return res.status(500).json({ message: 'Failed to change password', error: error.message })
    }
}

const updateCurrentUser = async (req, res) => {
    try {
        // req.user is already set by authenticateToken middleware (full user object)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Invalid or missing token.' })
        }
        // User is already found and attached by authenticateToken
        const user = req.user

        const allowedFields = ['fullName', 'phone', 'profilePictureUrl', 'defaultDateRangeFilter', 'notificationPreferences']
        const updateData = {}
        Object.entries(req.body).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                updateData[key] = value
            }
        })

        // Re-fetch user instance to ensure we have a Sequelize model instance, not a plain object
        const userInstance = await User.findByPk(req.user.id)
        if (!userInstance) {
            return res.status(404).json({ message: 'User not found.' })
        }

        await userInstance.update(updateData)
        await userInstance.reload()

        const userData = userInstance.toJSON ? userInstance.toJSON() : userInstance
        return res.json(sanitizeUser(userData))
    } catch (error) {
        logger.error('Failed to update user profile:', error)
        return res.status(500).json({ message: 'Failed to update user profile', error: error.message })
    }
}

const createUser = async (req, res) => {
    try {
        const { email, password, name, role, active, permissions, storeId } = req.body

        // Check if user already exists (within same store)
        const existingUser = await findUserByEmail(email, storeId || req.storeId)
        if (existingUser) {
            return res.status(409).json({ message: 'An account with that email already exists.' })
        }

        // Enforce User Limits per Store (unless Super Admin)
        if (!req.isSuperAdmin) {
            const targetStoreId = req.storeId
            if (role === 'admin') {
                const adminCount = await User.count({ where: { storeId: targetStoreId, role: 'admin' } })
                if (adminCount >= 1) {
                    return res.status(403).json({ message: 'Limit reached: Each store can have only 1 Admin. Contact Super Admin to increase limits.' })
                }
            } else if (role === 'staff') {
                const staffCount = await User.count({ where: { storeId: targetStoreId, role: 'staff' } })
                if (staffCount >= 3) {
                    return res.status(403).json({ message: 'Limit reached: Each store can have only 3 Staff members. Contact Super Admin to increase limits.' })
                }
            }
        }

        const userRole = role && ['admin', 'staff'].includes(role) ? role : 'staff'
        const passwordHash = await bcrypt.hash(password, 10)

        // Set default permissions based on role if not provided
        let userPermissions = permissions
        if (!userPermissions) {
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
        }

        // Superadmin can create users for any store, regular admin only for their store
        const targetStoreId = req.isSuperAdmin ? (storeId || req.storeId) : req.storeId
        if (!targetStoreId) {
            return res.status(400).json({ message: 'Store ID is required.' })
        }

        // Verify store exists
        const targetStore = await Store.findByPk(targetStoreId)
        if (!targetStore) {
            return res.status(404).json({ message: 'Store not found.' })
        }

        const newUser = await User.create({
            storeId: targetStoreId,
            email: email.toLowerCase(),
            name,
            role: userRole,
            passwordHash,
            active: active !== undefined ? active : true,
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
        return res.status(201).json(sanitizeUser(userData))
    } catch (error) {
        logger.error('User creation failed:', error)
        return res.status(500).json({ message: 'User creation failed', error: error.message })
    }
}

const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found.' })
        }

        // Verify user belongs to same store (superadmin can manage any user)
        if (!req.isSuperAdmin && user.storeId !== req.storeId) {
            return res.status(403).json({ message: 'User does not belong to your store.' })
        }

        const { name, email, role, password, active, permissions } = req.body

        if (name) user.name = String(name).trim()
        if (email && normalizeEmail(email) !== normalizeEmail(user.email)) {
            // Check email uniqueness (superadmin checks globally, admin checks within their store)
            const checkStoreId = req.isSuperAdmin ? null : req.storeId
            const existingUser = await findUserByEmail(email, checkStoreId)
            if (existingUser && existingUser.id !== user.id) {
                return res.status(409).json({ message: 'Email already in use.' })
            }
            user.email = email.toLowerCase()
        }
        if (role) {
            user.role = role
            // Reset permissions to defaults when role changes
            if (role === 'admin') {
                user.permissions = {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                }
            } else if (role === 'staff' && !permissions) {
                user.permissions = {
                    viewOrders: true, editOrders: true, deleteOrders: false,
                    viewProducts: true, editProducts: true, deleteProducts: false,
                    viewCustomers: true, editCustomers: false,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: false, manageSettings: false,
                }
            }
        }
        if (password) user.passwordHash = await bcrypt.hash(password, 10)
        if (active !== undefined) user.active = active
        if (name) user.fullName = name
        if (permissions) user.permissions = permissions

        await user.save()
        const userData = user.toJSON ? user.toJSON() : user
        return res.json(sanitizeUser(userData))
    } catch (error) {
        logger.error('User update failed:', error)
        return res.status(500).json({ message: 'User update failed', error: error.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found.' })
        }

        // Verify user belongs to same store (superadmin can manage any user)
        if (!req.isSuperAdmin && user.storeId !== req.storeId) {
            return res.status(403).json({ message: 'User does not belong to your store.' })
        }

        // Prevent deleting yourself
        if (user.id === req.user.id) {
            return res.status(403).json({ message: 'Cannot delete your own account.' })
        }

        await user.destroy()
        return res.status(204).send()
    } catch (error) {
        logger.error('User deletion failed:', error)
        return res.status(500).json({ message: 'User deletion failed', error: error.message })
    }
}

module.exports = {
    getUsers,
    getCurrentUser,
    changePassword,
    updateCurrentUser,
    createUser,
    updateUser,
    deleteUser,
}
