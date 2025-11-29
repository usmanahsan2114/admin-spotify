const EmailProvider = require('./providers/EmailProvider');
const SmsProvider = require('./providers/SmsProvider');

class NotificationService {
    constructor() {
        this.emailProvider = new EmailProvider({
            // In production, load from process.env
            // host: process.env.SMTP_HOST,
            // port: process.env.SMTP_PORT,
            // auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        this.smsProvider = new SmsProvider();
    }

    async sendOrderConfirmation(order) {
        const subject = `Order Confirmation #${order.orderNumber}`;
        const message = `Thank you for your order! \n\nOrder Number: ${order.orderNumber}\nTotal: ${order.total}\n\nWe will notify you when it ships.`;

        // Simple HTML Template
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Thank you for your order!</h2>
                <p>Hi ${order.customerName},</p>
                <p>We have received your order and are getting it ready.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Total:</strong> ${order.total}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                </div>
                <p>We will notify you when your order ships.</p>
            </div>
        `;

        // Send Email
        if (order.email) {
            await this.emailProvider.send({
                to: order.email,
                subject,
                message,
                html
            });
        }

        // Send SMS (Optional, if phone exists)
        if (order.phone) {
            await this.smsProvider.send({
                to: order.phone,
                message: `Order #${order.orderNumber} confirmed. Total: ${order.total}. Thanks for shopping!`
            });
        }
    }

    async sendAbandonedCartEmail(cart) {
        const subject = `You left something behind!`;
        const message = `Hi, you left items in your cart. Complete your purchase now!`;

        const itemsHtml = cart.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.name}</strong> x ${item.quantity} - PKR ${item.price}</p>
            </div>
        `).join('');

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Did you forget this?</h2>
                <p>Hi there,</p>
                <p>We noticed you left some great items in your cart. They are reserved for you for a limited time.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    ${itemsHtml}
                </div>
                <p><a href="http://localhost:5174/checkout" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Order</a></p>
            </div>
        `;

        if (cart.email) {
            await this.emailProvider.send({
                to: cart.email,
                subject,
                message,
                html
            });
        }
    }
}

module.exports = new NotificationService();
