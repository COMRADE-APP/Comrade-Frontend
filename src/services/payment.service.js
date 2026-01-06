import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const paymentService = {
    // Payment Profile Management
    getPaymentProfile: async () => {
        const response = await api.get('/api/payment/profile/my_profile/');
        return response.data;
    },

    getBalance: async () => {
        const response = await api.get('/api/payment/profile/balance/');
        return response.data;
    },

    // Payment Methods
    getPaymentMethods: async () => {
        const response = await api.get('/api/payment/methods/');
        return response.data;
    },

    addPaymentMethod: async (paymentMethodData) => {
        const response = await api.post('/api/payment/methods/add/', paymentMethodData);
        return response.data;
    },

    deletePaymentMethod: async (methodId) => {
        const response = await api.delete(`/api/payment/methods/${methodId}/`);
        return response.data;
    },

    setDefaultPaymentMethod: async (methodId) => {
        const response = await api.post(`/api/payment/methods/${methodId}/set_default/`);
        return response.data;
    },

    // Payment Processing
    createPaymentIntent: async (amount, currency = 'usd', metadata = {}) => {
        const response = await api.post('/api/payment/stripe/create_intent/', {
            amount,
            currency,
            metadata
        });
        return response.data;
    },

    processPayment: async (paymentData) => {
        const response = await api.post('/api/payment/process/', paymentData);
        return response.data;
    },

    // Transactions
    getTransactions: async () => {
        const response = await api.get('/api/payment/transactions/history/');
        return response.data;
    },

    getTransactionStatus: async (transactionId) => {
        const response = await api.get(`/api/payment/transactions/${transactionId}/status/`);
        return response.data;
    },

    // Refunds
    requestRefund: async (transactionId, amount = null, reason = '') => {
        const response = await api.post('/api/payment/refund/', {
            transaction_id: transactionId,
            amount,
            reason
        });
        return response.data;
    },

    // PayPal
    createPayPalPayment: async (amount, description) => {
        const response = await api.post('/api/payment/paypal/create/', {
            amount,
            description
        });
        return response.data;
    },

    // M-Pesa
    initiateMpesaPayment: async (phoneNumber, amount) => {
        const response = await api.post('/api/payment/mpesa/stk_push/', {
            phone_number: phoneNumber,
            amount
        });
        return response.data;
    },

    queryMpesaStatus: async (checkoutRequestId) => {
        const response = await api.get(`/api/payment/mpesa/status/${checkoutRequestId}/`);
        return response.data;
    },

    // Payment Groups
    getPaymentGroups: async () => {
        const response = await api.get('/api/payment/groups/my_groups/');
        return response.data;
    },

    createPaymentGroup: async (groupData) => {
        const response = await api.post('/api/payment/groups/', groupData);
        return response.data;
    },

    joinPaymentGroup: async (groupId) => {
        const response = await api.post(`/api/payment/groups/${groupId}/join/`);
        return response.data;
    },

    contributeToGroup: async (groupId, amount, notes = '') => {
        const response = await api.post(`/api/payment/groups/${groupId}/contribute/`, {
            amount,
            notes
        });
        return response.data;
    },

    getGroupMembers: async (groupId) => {
        const response = await api.get(`/api/payment/groups/${groupId}/members/`);
        return response.data;
    },

    getGroupContributions: async (groupId) => {
        const response = await api.get(`/api/payment/groups/${groupId}/contributions_list/`);
        return response.data;
    },

    inviteToGroup: async (groupId, email) => {
        const response = await api.post(`/api/payment/groups/${groupId}/invite/`, { email });
        return response.data;
    },

    // Piggy Banks / Group Targets
    getGroupTargets: async () => {
        const response = await api.get(API_ENDPOINTS.GROUP_TARGETS);
        return response.data;
    },

    createTarget: async (targetData) => {
        const response = await api.post(API_ENDPOINTS.GROUP_TARGETS, targetData);
        return response.data;
    },

    contributeTarget: async (targetId, amount) => {
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_TARGET(targetId), { amount });
        return response.data;
    },
};

export default paymentService;
