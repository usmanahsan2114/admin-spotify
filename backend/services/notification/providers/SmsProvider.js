const NotificationProvider = require('../NotificationProvider');

class SmsProvider extends NotificationProvider {
    async send({ to, message }) {
        // Mock SMS sending
        console.log('---------------------------------------------------');
        console.log(`[SmsProvider] Sending SMS to: ${to}`);
        console.log(`[SmsProvider] Message: ${message}`);
        console.log('---------------------------------------------------');

        return { success: true, id: `sms-${Date.now()}` };
    }
}

module.exports = SmsProvider;
