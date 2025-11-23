const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')
const { validateCustomer } = require('../middleware/validation')
const { authenticateToken, authenticateCustomer } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo')

// Public/Customer Portal
router.get('/customers/me/orders', authenticateCustomer, customerController.getCustomerOrders)

// Protected Routes
router.get('/customers', authenticateToken, customerController.getCustomers)
router.post('/customers', authenticateToken, restrictDemoStore, validateCustomer, customerController.createCustomer)
router.get('/customers/:id', authenticateToken, customerController.getCustomerById)
router.put('/customers/:id', authenticateToken, restrictDemoStore, validateCustomer, customerController.updateCustomer)

module.exports = router
