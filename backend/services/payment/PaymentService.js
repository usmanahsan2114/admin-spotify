const CodProvider = require('./providers/CodProvider');
const StripeProvider = require('./providers/StripeProvider');

class PaymentService {
    constructor() {
        this.providers = {
            'COD': new CodProvider(),
            'STRIPE': new StripeProvider({
                apiKey: process.env.STRIPE_SECRET_KEY
            })
        };
    }

    getProvider(method) {
        const provider = this.providers[method?.toUpperCase()];
        if (!provider) {
            throw new Error(`Payment method ${method} not supported`);
        }
        return provider;
    }

    /**
     * Process a payment using the specified method
     * @param {string} method - 'COD', 'STRIPE', etc.
     * @param {Object} params - Payment parameters
     * @returns {Promise<Object>}
     */
    async processPayment(method, params) {
        const provider = this.getProvider(method);
        return provider.processPayment(params);
    }
}

module.exports = new PaymentService();
