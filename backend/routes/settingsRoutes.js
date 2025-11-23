const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { authenticateToken, authorizeRole } = require('../middleware/auth')
const { validateBusinessSettings } = require('../middleware/validation')

// Public routes
router.get('/business/public', settingsController.getPublicBusinessSettings)

// Protected routes
router.use(authenticateToken)

router.get('/business', authorizeRole('admin', 'superadmin', 'staff'), settingsController.getBusinessSettings)
router.put('/business', authorizeRole('admin', 'superadmin'), validateBusinessSettings, settingsController.updateBusinessSettings)

module.exports = router
