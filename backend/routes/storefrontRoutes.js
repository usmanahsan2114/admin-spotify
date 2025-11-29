const express = require('express');
const router = express.Router();
const storefrontController = require('../controllers/storefrontController');
const checkoutController = require('../controllers/checkoutController');
const discountController = require('../controllers/discountController');
const shippingController = require('../controllers/shippingController');

// Public Storefront API Routes
// Base path: /api/public/v1

// GET /api/public/v1/products - List all products (with filters)
router.get('/products', storefrontController.getPublicProducts);

// GET /api/public/v1/products/:id - Get single product details
router.get('/products/:id', storefrontController.getPublicProductById);

// GET /api/public/v1/categories - Get list of categories
router.get('/categories', storefrontController.getPublicCategories);

// Checkout & Cart
router.post('/checkout/validate', checkoutController.validateCart);
router.post('/orders', checkoutController.submitOrder);

// Discounts
router.post('/discounts/validate', discountController.validateDiscount);

// Shipping
router.get('/shipping/rates', shippingController.getRates);

// Cart Sync
const cartController = require('../controllers/cartController');
router.post('/cart/sync', cartController.syncCart);
router.get('/cart/:cartId', cartController.getCart);

module.exports = router;
