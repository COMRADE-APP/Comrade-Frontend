/**
 * Payment Processing Service
 * Frontend API integration for payments, saved methods, method detection,
 * and multi-gateway support (Stripe, Flutterwave, Pesapal, PayPal, M-Pesa).
 */
import api from './api';

const PAYMENT_BASE_URL = '/api/payments';

export const paymentProcessingService = {
    // ── Gateway Configuration ────────────────────────────────
    
    /**
     * Fetch available payment gateways and their public keys.
     * Used to determine which payment buttons to show and
     * to initialize Stripe Elements with the correct publishable key.
     */
    async getGatewayConfig() {
        const response = await api.get(`${PAYMENT_BASE_URL}/gateway-config/`);
        return response.data;
    },

    // ── Payment Processing ───────────────────────────────────

    /**
     * Create a Stripe PaymentIntent (backend returns client_secret).
     * The frontend then confirms it using stripe.confirmPayment().
     */
    async createPaymentIntent(amount, currency = 'USD', method = 'stripe', metadata = {}) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, {
            amount,
            currency,
            payment_method: method,
            metadata,
        });
        return response.data;
    },

    /**
     * Process a payment (generic — routes to correct provider on backend)
     */
    async processPayment(paymentData) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, paymentData);
        return response.data;
    },

    /**
     * Initiate a Flutterwave payment (returns redirect URL to hosted page)
     */
    async initiateFlutterwavePayment({ amount, currency = 'KES', email = '', phone = '', description = '' }) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, {
            amount,
            currency,
            payment_method: 'flutterwave',
            email,
            phone_number: phone,
            description,
        });
        return response.data;
    },

    /**
     * Initiate a Pesapal payment (returns redirect URL to hosted page)
     */
    async initiatePesapalPayment({ amount, currency = 'KES', email = '', phone = '', description = '' }) {
        const response = await api.post(`${PAYMENT_BASE_URL}/process/`, {
            amount,
            currency,
            payment_method: 'pesapal',
            email,
            phone_number: phone,
            description,
        });
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

    // ── Deposits & Withdrawals ───────────────────────────────

    async deposit(data) {
        const response = await api.post(`${PAYMENT_BASE_URL}/deposit/`, data);
        return response.data;
    },

    async withdraw(data) {
        const response = await api.post(`${PAYMENT_BASE_URL}/withdraw/`, data);
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
     */
    async detectPaymentMethod(value) {
        const response = await api.post(`${PAYMENT_BASE_URL}/detect-method/`, { value });
        return response.data;
    },

    // ── Escrow ────────────────────────────────────────────────

    /**
     * Fund an escrow with an external payment gateway
     * @param {string} escrowId
     * @param {string} paymentMethod - 'wallet' | 'stripe' | 'flutterwave' | 'pesapal'
     * @param {string} currency
     */
    async fundEscrow(escrowId, paymentMethod = 'wallet', currency = 'USD') {
        const response = await api.post(`${PAYMENT_BASE_URL}/escrow/${escrowId}/fund/`, {
            payment_method: paymentMethod,
            currency,
        });
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
