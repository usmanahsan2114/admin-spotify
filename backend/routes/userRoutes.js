const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateToken, authorizeRole } = require('../middleware/auth')
const validateRequest = require('../middleware/validateRequest')
const { createUserSchema, updateUserSchema, userProfileSchema } = require('../middleware/validationSchemas')

// All routes require authentication
router.use(authenticateToken)

// Current user routes
router.get('/me', userController.getCurrentUser)
router.put('/me', validateRequest(userProfileSchema), userController.updateCurrentUser)
router.post('/me/change-password', userController.changePassword) // Need schema for this? Yes, but maybe later.

// User management routes (Admin/Superadmin only)
router.get('/', authorizeRole('admin', 'superadmin'), userController.getUsers)
router.post('/', authorizeRole('admin', 'superadmin'), validateRequest(createUserSchema), userController.createUser)
router.put('/:id', authorizeRole('admin', 'superadmin'), validateRequest(updateUserSchema), userController.updateUser)
router.delete('/:id', authorizeRole('admin', 'superadmin'), userController.deleteUser)

module.exports = router
