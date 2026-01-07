/**
 * Payment Processing Service Extension
 * Additional payment features for Stripe, PayPal, M-Pesa integration
 */
import api from './api';

const PAYMENT_BASE_URL = '/api/payments';

export const paymentProcessingService = {
    /**
     * Process a payment
     * @param {Object} paymentData
     * @param {number} paymentData.amount - Amount to charge
     * @param {string} paymentData.currency - Currency code (USD, KES, etc.)
     * @param {string} paymentData.payment_method - Payment method (stripe, paypal, mpesa)
     * @param {string} paymentData.payment_method_id - Payment method ID (for Stripe)
     * @param {string} paymentData.description - Payment description
     * @returns {Promise}
     */
    async processPayment(paymentData) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, paymentData);
        return response.data;
    },

    /**
     * Request refund for a transaction
     * @param {string} transactionId - Transaction ID to refund
     * @param {number} amount - Amount to refund (optional, full refund if not provided)
     * @param {string} reason - Reason for refund
     * @returns {Promise}
     */
    async refundPayment(transactionId, amount = null, reason = '') {
        const response = await api.post(`${PAYMENT_BASE_URL}/refund/`, {
            transaction_id: transactionId,
            amount,
            reason,
        });
        return response.data;
    },

    /**
     * Get payment methods for current user
     * @returns {Promise}
     */
    async getPaymentMethods() {
        const response = await api.get(`${PAYMENT_BASE_URL}/methods/`);
        return response.data;
    },

    /**
     * Add new payment method
     * @param {Object} methodData
     * @returns {Promise}
     */
    async addPaymentMethod(methodData) {
        const response = await api.post(`${PAYMENT_BASE_URL}/methods/`, methodData);
        return response.data;
    },

    /**
     * Delete payment method
     * @param {string} methodId
     * @returns {Promise}
     */
    async deletePaymentMethod(methodId) {
        const response = await api.delete(`${PAYMENT_BASE_URL}/methods/${methodId}/`);
        return response.data;
    },

    /**
     * Get transaction history
     * @returns {Promise}
     */
    async getTransactions() {
        const response = await api.get(`${PAYMENT_BASE_URL}/transactions/`);
        return response.data;
    },
};

export default paymentProcessingService;
