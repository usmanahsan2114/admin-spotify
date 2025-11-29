const { Order, Product, Customer, Store, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Validate Cart (Stock & Price Check)
exports.validateCart = async (req, res) => {
    try {
        const { items, storeId } = req.body; // items: [{ productId, quantity }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const validatedItems = [];
        let total = 0;
        let isValid = true;
        const errors = [];

        for (const item of items) {
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

        // 3. Handle Customer (Guest or Existing)
        let customerId = null;
        if (customer.email) {
            let existingCustomer = await Customer.findOne({
                where: { email: customer.email, storeId },
                transaction: t
            });

            if (existingCustomer) {
                customerId = existingCustomer.id;
                // Optional: Update address if provided
            } else {
                // Create new customer
                const newCustomer = await Customer.create({
                    id: uuidv4(),
                    storeId,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address
                }, { transaction: t });
                customerId = newCustomer.id;
            }
        }

        // 4. Process Payment
        let paymentResult;
        try {
            paymentResult = await PaymentService.processPayment(paymentMethod || 'COD', {
                amount: total,
                currency: 'PKR', // Default for now, should come from store settings
                source: paymentSource
            });
        } catch (paymentError) {
            await t.rollback();
            return res.status(400).json({ message: 'Payment failed', error: paymentError.message });
        }

        // 5. Create Order
        const order = await Order.create({
            id: uuidv4(),
            storeId,
            customerId,
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productName: orderItems.map(i => i.name).join(', '), // Summary
            customerName: customer.name,
            email: customer.email,
            phone: customer.phone,
            quantity: items.reduce((sum, i) => sum + i.quantity, 0),
            status: 'Pending',
            isPaid: paymentResult.status === 'succeeded',
            total: total, // Add shipping cost here if needed
            notes,
            items: orderItems,
            shippingAddress: customer.address, // Simplified
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: paymentResult.status,
            paymentMetadata: paymentResult.data
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: paymentResult.status
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('Order submission error:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
};
