const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')
const validateRequest = require('../middleware/validateRequest')
const { createCustomerSchema, updateCustomerSchema } = require('../middleware/validationSchemas')
const { authenticateToken, authenticateCustomer } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo')

// Public/Customer Portal
router.get('/me/orders', authenticateCustomer, customerController.getCustomerOrders)

// Protected Routes
router.get('/', authenticateToken, customerController.getCustomers)
router.get('/search', authenticateToken, customerController.searchCustomers)
router.post('/', authenticateToken, restrictDemoStore, validateRequest(createCustomerSchema), customerController.createCustomer)
router.get('/:id', authenticateToken, customerController.getCustomerById)
router.put('/:id', authenticateToken, restrictDemoStore, validateRequest(updateCustomerSchema), customerController.updateCustomer)

module.exports = router
