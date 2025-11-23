const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateToken, authorizeRole } = require('../middleware/auth')
const { validateUser, validateUserProfile } = require('../middleware/validation')

// All routes require authentication
router.use(authenticateToken)

// Current user routes
router.get('/me', userController.getCurrentUser)
router.put('/me', validateUserProfile, userController.updateCurrentUser)
router.post('/me/change-password', userController.changePassword)

// User management routes (Admin/Superadmin only)
router.get('/', authorizeRole('admin', 'superadmin'), userController.getUsers)
router.post('/', authorizeRole('admin', 'superadmin'), validateUser, userController.createUser)
router.put('/:id', authorizeRole('admin', 'superadmin'), validateUser, userController.updateUser)
router.delete('/:id', authorizeRole('admin', 'superadmin'), userController.deleteUser)

module.exports = router
