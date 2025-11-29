class ShippingService {
    constructor() {
        // In a real app, these would come from the database (Tier 3)
        this.rules = {
            baseRate: 200, // PKR
            freeShippingThreshold: 5000, // PKR
            weightThreshold: 1, // kg
            weightSurcharge: 300, // PKR
            locationSurcharges: {
                'sindh': 50,
                'punjab': 0, // Base rate applies
                'balochistan': 150,
                'kpk': 100,
                'islamabad': 50,
                'default': 100
            }
        };
    }

    /**
     * Calculate shipping rates for a cart
     * @param {Object} params
     * @param {number} params.subtotal - Cart subtotal
     * @param {number} params.weight - Total weight in kg (default 0.5)
     * @param {string} params.city - City name
     * @param {string} params.province - Province/State
     * @returns {Object} - { rates: Array, selectedRate: Object }
     */
    calculateRates({ subtotal, weight = 0.5, city, province }) {
        // 1. Free Shipping Check
        if (subtotal >= this.rules.freeShippingThreshold) {
            return {
                rates: [{
                    id: 'free_shipping',
                    name: 'Free Shipping',
                    price: 0,
                    estimatedDays: '3-5 days'
                }]
            };
        }

        // 2. Base Calculation
        let cost = this.rules.baseRate;

        // 3. Weight Surcharge
        if (weight > this.rules.weightThreshold) {
            cost += this.rules.weightSurcharge;
        }

        // 4. Location Surcharge
        const locationKey = province?.toLowerCase() || 'default';
        const surcharge = this.rules.locationSurcharges[locationKey] !== undefined
            ? this.rules.locationSurcharges[locationKey]
            : this.rules.locationSurcharges['default'];

        cost += surcharge;

        // Return Standard and Express options
        return {
            rates: [
                {
                    id: 'standard',
                    name: 'Standard Shipping',
                    price: cost,
                    estimatedDays: '3-5 days'
                },
                {
                    id: 'express',
                    name: 'Express Shipping',
                    price: cost + 300, // Express premium
                    estimatedDays: '1-2 days'
                }
            ]
        };
    }
}

module.exports = new ShippingService();
