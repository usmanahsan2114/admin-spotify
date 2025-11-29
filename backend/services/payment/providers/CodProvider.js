const PaymentProvider = require('../PaymentProvider');

class CodProvider extends PaymentProvider {
    async processPayment({ amount, currency }) {
        // COD is always successful initially (pending payment)
        return {
            success: true,
            transactionId: `COD-${Date.now()}`,
            status: 'pending',
            data: {
                message: 'Cash on Delivery selected',
                amount,
                currency
            }
        };
    }

    async refundPayment(transactionId, amount) {
        // COD refunds are manual
        return {
            success: true,
            status: 'refunded_manually',
            data: {
                message: 'COD refund must be handled manually'
            }
        };
    }
}

module.exports = CodProvider;
