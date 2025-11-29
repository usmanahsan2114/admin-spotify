const express = require('express');
const router = express.Router();
const storefrontController = require('../controllers/storefrontController');

// Public Storefront API Routes
// Base path: /api/public/v1

// GET /api/public/v1/products - List all products (with filters)
router.get('/products', storefrontController.getPublicProducts);

// GET /api/public/v1/products/:id - Get single product details
router.get('/products/:id', storefrontController.getPublicProductById);

// GET /api/public/v1/categories - Get list of categories
router.get('/categories', storefrontController.getPublicCategories);

module.exports = router;
