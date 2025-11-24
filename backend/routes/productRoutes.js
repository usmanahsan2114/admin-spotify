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

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stockQuantity
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         price:
 *           type: number
 *           description: The price of the product
 *         stockQuantity:
 *           type: integer
 *           description: The quantity in stock
 *         category:
 *           type: string
 *           description: The product category
 *         imageUrl:
 *           type: string
 *           description: URL of the product image
 *         status:
 *           type: string
 *           enum: [active, draft, archived]
 *           description: The product status
 *       example:
 *         id: d5fE_asz
 *         name: Wireless Headphones
 *         price: 99.99
 *         stockQuantity: 50
 *         category: Electronics
 *         status: active
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: The products managing API
 */

// Public routes
/**
 * @swagger
 * /api/products/public:
 *   get:
 *     summary: Get public products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return (e.g., id,name,price)
 *     responses:
 *       200:
 *         description: The list of public products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/products/public', getProductsPublic)

// Protected routes
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter by low stock
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *     responses:
 *       200:
 *         description: The list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/products', authenticateToken, getProducts)
router.get('/products/low-stock', authenticateToken, getLowStockProducts)
router.get('/products/:id', authenticateToken, getProductById)

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: The created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post('/products', authenticateToken, authorizeRole('admin', 'superadmin'), validateRequest(createProductSchema), createProduct)
router.put('/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), validateRequest(updateProductSchema), updateProduct)
router.delete('/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), deleteProduct)
router.post('/products/:id/reorder', authenticateToken, authorizeRole('admin', 'superadmin'), reorderProduct)

// Import/Export routes
router.get('/export/products', authenticateToken, exportProducts)
router.post('/import/products', authenticateToken, authorizeRole('admin'), importProducts)

module.exports = router
