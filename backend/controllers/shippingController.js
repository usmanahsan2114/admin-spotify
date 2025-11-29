const ShippingService = require('../services/shipping/ShippingService');

// Get Shipping Rates
exports.getRates = async (req, res) => {
    try {
        const { country, city, province, subtotal, weight } = req.query;

        const result = ShippingService.calculateRates({
            subtotal: parseFloat(subtotal) || 0,
            weight: parseFloat(weight) || 0.5,
            city,
            province
        });

        res.json(result.rates);

    } catch (error) {
        console.error('Shipping rates error:', error);
        res.status(500).json({ message: 'Error fetching shipping rates' });
    }
};
