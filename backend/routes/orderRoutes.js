const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const validateRequest = require('../middleware/validateRequest')
const { createOrderSchema, updateOrderSchema } = require('../middleware/validationSchemas')
const { authenticateToken, authorizeRole } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo') // Need to check if this is extracted or inline

// Public (or semi-public)
router.get('/orders/search/by-contact', orderController.searchOrdersByContact)
router.post('/orders', validateRequest(createOrderSchema), orderController.createOrder)

// Protected
router.get('/orders', authenticateToken, orderController.getOrders)
router.get('/orders/:id', orderController.getOrderById) // Note: Controller handles auth check for details
router.put('/orders/:id', authenticateToken, validateRequest(updateOrderSchema), orderController.updateOrder)
router.post('/import/orders', authenticateToken, orderController.importOrders)

module.exports = router
