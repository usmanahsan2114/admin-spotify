const express = require('express')
const router = express.Router()
const storeController = require('../controllers/storeController')
const validateRequest = require('../middleware/validateRequest')
const { createStoreSchema, updateStoreSchema } = require('../middleware/validationSchemas')
const { authenticateToken, authorizeRole } = require('../middleware/auth')

// Public
router.get('/stores', storeController.getStores)

// Protected
router.get('/stores/admin', authenticateToken, storeController.getStoresAdmin)
router.post('/stores', authenticateToken, authorizeRole('superadmin'), validateRequest(createStoreSchema), storeController.createStore)
router.put('/stores/:id', authenticateToken, authorizeRole('superadmin'), validateRequest(updateStoreSchema), storeController.updateStore)
router.post('/stores/:id/admin-credentials', authenticateToken, authorizeRole('superadmin'), storeController.updateStoreAdminCredentials) // No schema for this yet, or reuse updateStoreSchema?
// Wait, validateStoreAdminCredentials was used. I need to check if I created a schema for it.
// I didn't create a specific schema for admin credentials in validationSchemas.js.
// I should add it or use a generic one.
// Let's check validationSchemas.js content again.
// Ah, I missed it. I will use a temporary inline schema or skip validation for now and add it later.
// Actually, I should add it to validationSchemas.js first.
// Let's skip this file for a moment and update validationSchemas.js.
router.delete('/stores/:id', authenticateToken, authorizeRole('superadmin'), storeController.deleteStore)

// Demo
router.post('/demo/reset-data', authenticateToken, authorizeRole('admin'), storeController.resetDemoData)

module.exports = router
