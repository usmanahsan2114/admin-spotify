const { Order, Product, Customer, Store, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const DiscountService = require('../services/marketing/DiscountService');
const PaymentService = require('../services/payment/PaymentService');
const NotificationService = require('../services/notification/NotificationService');
const ShippingService = require('../services/shipping/ShippingService');

// Validate Cart (Stock & Price Check & Discount)
exports.validateCart = async (req, res) => {
    try {
        const { items, storeId, discountCode } = req.body; // items: [{ productId, quantity }]
        console.log('Validating cart:', { itemsCount: items?.length, storeId, discountCode });

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

            const product = await Product.findOne({ where });

            if (!product) {
                isValid = false;
                errors.push(`Product ${item.productId} not found or inactive`);
                continue;
            }

            if (product.stockQuantity < item.quantity) {
                isValid = false;
                errors.push(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
            }

            const itemTotal = parseFloat(product.price) * item.quantity;
            validatedItems.push({
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: item.quantity,
                total: itemTotal,
                imageUrl: product.imageUrl
            });

            total += itemTotal;
        }

        if (!isValid) {
            return res.status(400).json({ message: 'Cart validation failed', errors });
        }

        // Apply Discount
        let discountAmount = 0;
        let finalTotal = total;
        let discountError = null;

        if (discountCode) {
            try {
                const discountResult = await DiscountService.validateDiscount(discountCode, storeId, total, validatedItems);
                if (discountResult.valid) {
                    discountAmount = discountResult.discountAmount;
                    finalTotal = discountResult.newTotal;
                } else {
                    discountError = discountResult.message;
                }
            } catch (err) {
                console.error('Discount validation error:', err);
                discountError = 'Invalid discount code';
            }
        }

        res.json({
            valid: true,
            items: validatedItems,
            subtotal: total,
            discountCode: discountCode || null,
            discountAmount,
            finalTotal,
            discountError
        });

    } catch (error) {
        console.error('Cart validation error:', error);
        res.status(500).json({ message: 'Error validating cart', error: error.message });
    }
};

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
            notes,
            discountCode
        } = req.body;

        // 1. Validate Store
        const store = await Store.findByPk(storeId);
        if (!store) {
            await t.rollback();
            return res.status(404).json({ message: 'Store not found' });
        }

        // 2. Validate Items & Stock
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

            const itemTotal = parseFloat(product.price) * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: item.quantity,
                total: itemTotal
            });

            total += itemTotal;
        }

        // 3. Calculate Discount
        let discountAmount = 0;
        if (discountCode) {
            const discountResult = await DiscountService.validateDiscount(discountCode, storeId, total, orderItems);
            if (discountResult.valid) {
                discountAmount = discountResult.discountAmount;
                // Increment usage
                await DiscountService.incrementUsage(discountCode, storeId);
            }
        }

        // 4. Calculate Shipping (Simplified for now)
        const shippingCost = 0; // TODO: Use ShippingService

        const finalTotal = total - discountAmount + shippingCost;

        // 5. Create Customer (or Find)
        let customerRecord = await Customer.findOne({
            where: { email: customer.email, storeId },
            transaction: t
        });

        if (!customerRecord) {
            customerRecord = await Customer.create({
                storeId,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address
            }, { transaction: t });
        }

        // 6. Create Order
        const order = await Order.create({
            id: uuidv4(),
            storeId,
            customerId: customerRecord.id,
            customerName: customer.name,
            email: customer.email,
            phone: customer.phone,
            shippingAddress: customer.address,
            total: finalTotal,
            status: 'Pending',
            paymentStatus: 'pending', // Will update after payment
            items: orderItems,
            notes,
            discountCode,
            discountAmount
        }, { transaction: t });

        // 7. Process Payment
        // For now, assume COD or success
        if (paymentMethod === 'cod') {
            // No action needed
        } else {
            // Integrate PaymentService here
        }

        await t.commit();

        // 8. Send Notification (Async)
        try {
            await NotificationService.sendOrderConfirmation(order);
        } catch (e) {
            console.error('Failed to send email:', e);
        }

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: order.id,
            total: finalTotal
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('Order submission error:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
};
