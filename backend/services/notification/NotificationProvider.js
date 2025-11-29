class NotificationProvider {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Send a notification
     * @param {Object} params
     * @param {string} params.to - Recipient (email or phone)
     * @param {string} params.subject - Subject (for email)
     * @param {string} params.message - Body content
     * @param {Object} params.data - Additional data for templates
     * @returns {Promise<Object>} - { success: boolean, id: string }
     */
    async send(params) {
        throw new Error('Method send() must be implemented');
    }
}

module.exports = NotificationProvider;
