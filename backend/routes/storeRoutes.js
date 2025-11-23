const express = require('express')
const router = express.Router()
const storeController = require('../controllers/storeController')
const { validateStore, validateStoreAdminCredentials } = require('../middleware/validation')
const { authenticateToken, authorizeRole } = require('../middleware/auth') // We need to extract these too!

// Temporary: Import middleware from server.js is hard because they are defined inline.
// I need to extract auth middleware first or duplicate it.
// For now, I will assume they are extracted to middleware/auth.js
// If not, I must extract them.

// Public
router.get('/stores', storeController.getStores)

// Protected
router.get('/stores/admin', authenticateToken, storeController.getStoresAdmin)
router.post('/stores', authenticateToken, authorizeRole('superadmin'), validateStore, storeController.createStore)
router.put('/stores/:id', authenticateToken, authorizeRole('superadmin'), validateStore, storeController.updateStore)
router.post('/stores/:id/admin-credentials', authenticateToken, authorizeRole('superadmin'), validateStoreAdminCredentials, storeController.updateStoreAdminCredentials)
router.delete('/stores/:id', authenticateToken, authorizeRole('superadmin'), storeController.deleteStore)

// Demo
router.post('/demo/reset-data', authenticateToken, authorizeRole('admin'), storeController.resetDemoData)

module.exports = router
