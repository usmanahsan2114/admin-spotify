// Validate Discount Code
exports.validateDiscount = async (req, res) => {
    try {
        const { code, storeId, cartTotal } = req.body;

        // Mock Implementation
        // In real app, check DB for Discount model

        if (code === 'WELCOME10') {
            return res.json({
                valid: true,
                type: 'percentage',
                value: 10,
                discountAmount: (cartTotal * 0.10).toFixed(2)
            });
        }

        if (code === 'FREESHIP') {
            return res.json({
                valid: true,
                type: 'shipping',
                value: 0,
                discountAmount: 0 // Logic handled in shipping
            });
        }

        res.status(400).json({ valid: false, message: 'Invalid discount code' });

    } catch (error) {
        console.error('Discount validation error:', error);
        res.status(500).json({ message: 'Error validating discount' });
    }
};
