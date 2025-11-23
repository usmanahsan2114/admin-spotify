const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')
const validateRequest = require('../middleware/validateRequest')
const { createCustomerSchema, updateCustomerSchema } = require('../middleware/validationSchemas')
const { authenticateToken, authenticateCustomer } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo')

// Public/Customer Portal
router.get('/customers/me/orders', authenticateCustomer, customerController.getCustomerOrders)

// Protected Routes
router.get('/customers', authenticateToken, customerController.getCustomers)
router.post('/customers', authenticateToken, restrictDemoStore, validateRequest(createCustomerSchema), customerController.createCustomer)
router.get('/customers/:id', authenticateToken, customerController.getCustomerById)
router.put('/customers/:id', authenticateToken, restrictDemoStore, validateRequest(updateCustomerSchema), customerController.updateCustomer)

module.exports = router
