const express = require('express')
const router = express.Router()
const {
    getProductsPublic,
    getProducts,
    getLowStockProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProduct,
    exportProducts,
    importProducts
} = require('../controllers/productController')
const { authenticateToken, authorizeRole } = require('../middleware/auth')
const validateRequest = require('../middleware/validateRequest')
const { createProductSchema, updateProductSchema } = require('../middleware/validationSchemas')

// Public routes
router.get('/products/public', getProductsPublic)

// Protected routes
router.get('/products', authenticateToken, getProducts)
router.get('/products/low-stock', authenticateToken, getLowStockProducts)
router.get('/products/:id', authenticateToken, getProductById)
router.post('/products', authenticateToken, authorizeRole('admin', 'superadmin'), validateRequest(createProductSchema), createProduct)
router.put('/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), validateRequest(updateProductSchema), updateProduct)
router.delete('/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), deleteProduct)
router.post('/products/:id/reorder', authenticateToken, authorizeRole('admin', 'superadmin'), reorderProduct)

// Import/Export routes
router.get('/export/products', authenticateToken, exportProducts)
router.post('/import/products', authenticateToken, authorizeRole('admin'), importProducts)

module.exports = router
