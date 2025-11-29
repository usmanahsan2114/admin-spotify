const { Cart, CartItem, sequelize } = require('../../models');
const NotificationService = require('../notification/NotificationService');
const { Op } = require('sequelize');

class AbandonedCartService {
    async checkAbandonedCarts() {
        console.log('Running Abandoned Cart Check...');

        // Find carts that:
        // 1. Are 'active'
        // 2. Have an email
        // 3. Were last active > 1 hour ago (using 1 minute for demo purposes)
        // 4. Have not received a recovery email yet

        const oneHourAgo = new Date(new Date() - 60 * 60 * 1000);
        // const demoTime = new Date(new Date() - 1 * 60 * 1000); // 1 minute ago for testing

        try {
            const abandonedCarts = await Cart.findAll({
                where: {
                    status: 'active',
                    email: { [Op.not]: null },
                    lastActiveAt: { [Op.lt]: oneHourAgo },
                    recoveryEmailSentAt: null
                },
                include: [{ model: CartItem, as: 'items' }]
            });

            console.log(`Found ${abandonedCarts.length} abandoned carts.`);

            for (const cart of abandonedCarts) {
                if (cart.items && cart.items.length > 0) {
                    console.log(`Sending recovery email to ${cart.email}...`);

                    // Send Email
                    await NotificationService.sendAbandonedCartEmail(cart);

                    // Update Cart Status
                    await cart.update({
                        status: 'abandoned',
                        recoveryEmailSentAt: new Date()
                    });
                }
            }

        } catch (error) {
            console.error('Error checking abandoned carts:', error);
        }
    }
}

module.exports = new AbandonedCartService();
