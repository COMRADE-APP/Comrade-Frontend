import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const paymentsService = {
    async getProfile() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_PROFILE);
        return response.data;
    },

    async getTransactions() {
        const response = await api.get(API_ENDPOINTS.TRANSACTIONS);
        return response.data;
    },

    async getTransactionById(id) {
        const response = await api.get(API_ENDPOINTS.TRANSACTION_DETAIL(id));
        return response.data;
    },

    async createTransaction(transactionData) {
        const response = await api.post(API_ENDPOINTS.CREATE_TRANSACTION, transactionData);
        return response.data;
    },

    async getTransactionHistory() {
        const response = await api.get(API_ENDPOINTS.TRANSACTION_HISTORY);
        return response.data;
    },

    async updatePaymentProfile(profileData) {
        const response = await api.put(API_ENDPOINTS.PAYMENT_PROFILE, profileData);
        return response.data;
    },
};

export default paymentsService;
