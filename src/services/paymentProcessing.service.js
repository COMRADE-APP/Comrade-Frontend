/**
 * Payment Processing Service
 * Frontend API integration for payments, saved methods, and method detection.
 */
import api from './api';

const PAYMENT_BASE_URL = '/api/payments';

export const paymentProcessingService = {
    /**
     * Process a payment
     * @param {Object} paymentData
     * @param {number} paymentData.amount
     * @param {string} paymentData.currency - e.g. 'USD', 'KES'
     * @param {string} paymentData.payment_method - 'stripe' | 'mpesa' | 'paypal'
     * @param {string} [paymentData.payment_method_id] - Stripe PM id
     * @param {string} [paymentData.saved_method_id] - Saved method UUID
     * @param {string} [paymentData.description]
     * @returns {Promise}
     */
    async processPayment(paymentData) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, paymentData);
        return response.data;
    },

    /**
     * Request refund for a transaction
     */
    async refundPayment(transactionId, amount = null, reason = '') {
        const response = await api.post(`${PAYMENT_BASE_URL}/refund/`, {
            transaction_id: transactionId,
            amount,
            reason,
        });
        return response.data;
    },

    // ── Saved Payment Methods ─────────────────────────────────

    /** List all saved payment methods for the current user */
    async getSavedMethods() {
        const response = await api.get(`${PAYMENT_BASE_URL}/methods/`);
        return response.data;
    },

    /** Save a new payment method */
    async savePaymentMethod(methodData) {
        const response = await api.post(`${PAYMENT_BASE_URL}/methods/`, methodData);
        return response.data;
    },

    /** Delete a saved payment method */
    async deletePaymentMethod(methodId) {
        await api.delete(`${PAYMENT_BASE_URL}/methods/${methodId}/`);
    },

    /** Update a saved payment method (nickname, phone, email, etc.) */
    async updatePaymentMethod(methodId, data) {
        const response = await api.patch(`${PAYMENT_BASE_URL}/methods/${methodId}/`, data);
        return response.data;
    },

    /** Set a saved payment method as default */
    async setDefaultMethod(methodId) {
        const response = await api.post(`${PAYMENT_BASE_URL}/methods/${methodId}/set_default/`);
        return response.data;
    },

    // ── Auto-Detection ────────────────────────────────────────

    /**
     * Detect payment method type from a raw input value
     * (card number, phone number, or email).
     * @param {string} value
     * @returns {Promise<{method_type, brand, icon, is_valid, display}>}
     */
    async detectPaymentMethod(value) {
        const response = await api.post(`${PAYMENT_BASE_URL}/detect-method/`, { value });
        return response.data;
    },

    // ── Legacy Aliases ────────────────────────────────────────

    /** @deprecated Use getSavedMethods */
    async getPaymentMethods() {
        return this.getSavedMethods();
    },

    /** @deprecated Use savePaymentMethod */
    async addPaymentMethod(methodData) {
        return this.savePaymentMethod(methodData);
    },

    /** Get transaction history */
    async getTransactions() {
        const response = await api.get(`${PAYMENT_BASE_URL}/transactions/`);
        return response.data;
    },
};

export default paymentProcessingService;
