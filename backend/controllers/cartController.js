const { Cart, CartItem, Product, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Sync Cart (Create or Update)
exports.syncCart = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { storeId, items, email, customerId, cartId } = req.body;

        // 1. Find or Create Cart
        let cart;
        if (cartId) {
            cart = await Cart.findOne({ where: { id: cartId, storeId }, transaction: t });
        }

        if (!cart) {
            cart = await Cart.create({
                id: uuidv4(),
                storeId,
                email,
                customerId,
                status: 'active',
                lastActiveAt: new Date()
            }, { transaction: t });
        } else {
            // Update existing cart
            await cart.update({
                email: email || cart.email,
                customerId: customerId || cart.customerId,
                status: 'active',
                lastActiveAt: new Date()
            }, { transaction: t });
        }

        // 2. Sync Items (Replace all items for simplicity)
        // In a real app, you might want to diff changes, but replacing is safer for sync
        await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

        if (items && items.length > 0) {
            const cartItems = items.map(item => ({
                id: uuidv4(),
                cartId: cart.id,
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl
            }));
            await CartItem.bulkCreate(cartItems, { transaction: t });
        }

        await t.commit();

        res.json({
            message: 'Cart synced successfully',
            cartId: cart.id
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('Cart sync error:', error);
        res.status(500).json({ message: 'Error syncing cart', error: error.message });
    }
};

// Get Cart (Optional, for cross-device)
exports.getCart = async (req, res) => {
    try {
        const { cartId } = req.params;
        const cart = await Cart.findByPk(cartId, {
            include: [{ model: CartItem, as: 'items' }]
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
};
