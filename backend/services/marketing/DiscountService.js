const { Discount, Sequelize } = require('../../models');
const { Op } = Sequelize;

class DiscountService {
    async validateDiscount(code, storeId, cartTotal, cartItems) {
        const discount = await Discount.findOne({
            where: {
                code,
                storeId,
                isActive: true,
                startsAt: { [Op.lte]: new Date() },
                [Op.or]: [
                    { endsAt: null },
                    { endsAt: { [Op.gte]: new Date() } }
                ]
            }
        });

        if (!discount) {
            throw new Error('Invalid or expired discount code.');
        }

        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
            throw new Error('Discount usage limit reached.');
        }

        if (cartTotal < discount.minOrderValue) {
            throw new Error(`Minimum order value of ${discount.minOrderValue} required.`);
        }

        let discountAmount = 0;

        if (discount.type === 'percentage') {
            discountAmount = (cartTotal * discount.value) / 100;
        } else if (discount.type === 'fixed_amount') {
            discountAmount = parseFloat(discount.value);
        } else if (discount.type === 'bogo') {
            // Simple BOGO: Buy 1 Get 1 Free (cheapest item free)
            // Or Buy X Get Y % Off
            // For MVP, let's assume "Buy 1 Get 1 Free" on the whole cart (cheapest item)
            // Logic: Find cheapest item and deduct its price
            if (cartItems.length < 2) {
                throw new Error('BOGO requires at least 2 items in cart.');
            }
            const sortedItems = [...cartItems].sort((a, b) => a.price - b.price);
            discountAmount = parseFloat(sortedItems[0].price);
        }

        // Ensure discount doesn't exceed total
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal;
        }

        return {
            isValid: true,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            finalTotal: parseFloat((cartTotal - discountAmount).toFixed(2)),
            discountId: discount.id,
            code: discount.code
        };
    }

    async incrementUsage(code, storeId) {
        const discount = await Discount.findOne({ where: { code, storeId } });
        if (discount) {
            await discount.increment('usageCount');
        }
    }
}

module.exports = new DiscountService();
