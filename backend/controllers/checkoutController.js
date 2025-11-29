const { Order, Product, Customer, Store, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Validate Cart (Stock & Price Check)
exports.validateCart = async (req, res) => {
    try {
        const { items, storeId } = req.body; // items: [{ productId, quantity }]
        console.log('Validating cart:', { itemsCount: items?.length, storeId });

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const validatedItems = [];
        let total = 0;
        let isValid = true;
        const errors = [];

        for (const item of items) {
            if (!item.productId) {
                isValid = false;
                errors.push('Item missing productId');
                continue;
            }

            const where = { id: item.productId, status: 'active' };
            if (storeId) {
                where.storeId = storeId;
            }

            const product = await Product.findOne({
                where
            });

            if (!product) {
                isValid = false;
                errors.push(`Product ${item.productId} not found or inactive`);
                continue;
            }

            if (product.stockQuantity < item.quantity) {
                isValid = false;
                errors.push(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
            }

            validatedItems.push({
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: item.quantity,
                total: parseFloat(product.price) * item.quantity,
                imageUrl: product.imageUrl
            });

            total += parseFloat(product.price) * item.quantity;
        }

        if (!isValid) {
            return res.status(400).json({ message: 'Cart validation failed', errors });
        }

        res.json({
            valid: true,
            items: validatedItems,
            subtotal: total
        });

    } catch (error) {
        console.error('Cart validation error:', error);
        res.status(500).json({ message: 'Error validating cart', error: error.message });
    }
};

const PaymentService = require('../services/payment/PaymentService');
const NotificationService = require('../services/notification/NotificationService');

// Submit Public Order
exports.submitOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            storeId,
            items,
            customer, // { name, email, phone, address }
            shippingMethod,
            paymentMethod,
            paymentSource, // Token or source for payment
            notes
        } = req.body;

        // 1. Validate Store
        const store = await Store.findByPk(storeId);
        if (!store) {
            await t.rollback();
            return res.status(404).json({ message: 'Store not found' });
        }

        // 2. Validate Items & Stock (Again, to be safe)
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction: t });

            if (!product || product.stockQuantity < item.quantity) {
                await t.rollback();
                return res.status(400).json({ message: `Insufficient stock for ${product ? product.name : 'item'}` });
            }

            // Deduct Stock
            product.stockQuantity -= item.quantity;
            await product.save({ transaction: t });

            orderItems.push({
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: item.quantity,
                total: parseFloat(product.price) * item.quantity
            });

            total += parseFloat(product.price) * item.quantity;
        }

        // 2.1 Calculate Shipping
        const ShippingService = require('../services/shipping/ShippingService');
        const shippingRates = ShippingService.calculateRates({
            if(!t.finished) await t.rollback();
        console.error('Order submission error:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
};
