class PaymentProvider {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Process a payment
     * @param {Object} params
     * @param {number} params.amount - Amount to charge
     * @param {string} params.currency - Currency code (e.g., 'PKR')
     * @param {Object} params.source - Payment source (token, card info, etc.)
     * @param {Object} params.metadata - Additional metadata
     * @returns {Promise<Object>} - { success: boolean, transactionId: string, data: Object }
     */
    async processPayment(params) {
        throw new Error('Method processPayment() must be implemented');
    }

    /**
     * Refund a payment
     * @param {string} transactionId
     * @param {number} amount
     * @returns {Promise<Object>}
     */
    async refundPayment(transactionId, amount) {
        throw new Error('Method refundPayment() must be implemented');
    }

    /**
     * Validate provider configuration
     * @returns {boolean}
     */
    validateConfig() {
        return true;
    }
}

module.exports = PaymentProvider;
