const NotificationProvider = require('../NotificationProvider');
const nodemailer = require('nodemailer');

class EmailProvider extends NotificationProvider {
    constructor(config = {}) {
        super(config);
        // Default to console transport if no config provided (for dev/test)
        if (!config.host) {
            this.transporter = {
                sendMail: async (mailOptions) => {
                    console.log('---------------------------------------------------');
                    console.log(`[EmailProvider] Sending email to: ${mailOptions.to}`);
                    console.log(`[EmailProvider] Subject: ${mailOptions.subject}`);
                    console.log(`[EmailProvider] Body: ${mailOptions.text || mailOptions.html}`);
                    console.log('---------------------------------------------------');
                    return { messageId: `mock-${Date.now()}` };
                }
            };
        } else {
            this.transporter = nodemailer.createTransport(config);
        }
    }

    async send({ to, subject, message, html }) {
        try {
            const info = await this.transporter.sendMail({
                from: this.config.from || '"Store Admin" <noreply@store.com>',
                to,
                subject,
                text: message, // Plain text fallback
                html: html || message // HTML version
            });
            return { success: true, id: info.messageId };
        } catch (error) {
            console.error('[EmailProvider] Error sending email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailProvider;
