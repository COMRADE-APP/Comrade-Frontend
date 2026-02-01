import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const paymentsService = {
    // ========== Profile ==========
    async getProfile() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_PROFILE);
        return response.data;
    },

    async updatePaymentProfile(profileData) {
        const response = await api.put(API_ENDPOINTS.PAYMENT_PROFILE, profileData);
        return response.data;
    },

    async getBalance() {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_PROFILE}balance/`);
        return response.data;
    },

    // ========== Transactions ==========
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

    // ========== Deposit & Withdraw ==========
    async deposit(amount, paymentMethod = 'bank_transfer') {
        const response = await api.post(`${API_ENDPOINTS.TRANSACTIONS}deposit/`, {
            amount,
            payment_method: paymentMethod
        });
        return response.data;
    },

    async withdraw(amount, accountNumber = '', paymentMethod = 'bank_transfer') {
        const response = await api.post(`${API_ENDPOINTS.TRANSACTIONS}withdraw/`, {
            amount,
            account_number: accountNumber,
            payment_method: paymentMethod
        });
        return response.data;
    },

    // ========== Payment Groups ==========
    async getPaymentGroups() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_GROUPS);
        return response.data;
    },

    async getMyGroups() {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}my_groups/`);
        return response.data;
    },

    async createPaymentGroup(groupData) {
        const response = await api.post(API_ENDPOINTS.PAYMENT_GROUPS, groupData);
        return response.data;
    },

    async getPaymentGroupById(id) {
        const response = await api.get(API_ENDPOINTS.PAYMENT_GROUP_DETAIL(id));
        return response.data;
    },

    async joinGroup(groupId) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}join/`);
        return response.data;
    },

    async contributeToGroup(groupId, amount, notes = '') {
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_TO_GROUP(groupId), { amount, notes });
        return response.data;
    },

    async getGroupMembers(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}members/`);
        return response.data;
    },

    async getGroupContributions(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}contributions_list/`);
        return response.data;
    },

    async inviteToGroup(groupId, email) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}invite/`, { email });
        return response.data;
    },

    // ========== Piggy Banks (Group Targets) ==========
    async getPiggyBanks() {
        const response = await api.get(API_ENDPOINTS.GROUP_TARGETS);
        return response.data;
    },

    async createPiggyBank(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_TARGETS, data);
        return response.data;
    },

    async getPiggyBankById(id) {
        const response = await api.get(API_ENDPOINTS.GROUP_TARGET_DETAIL(id));
        return response.data;
    },

    async contributeToPiggyBank(piggyId, amount) {
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_TARGET(piggyId), { amount });
        return response.data;
    },

    async withdrawFromPiggyBank(piggyId, amount) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}withdraw/`, { amount });
        return response.data;
    },

    async lockPiggyBank(piggyId, lockType = 'locked', maturityDate = null) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}lock/`, {
            lock_type: lockType,
            maturity_date: maturityDate
        });
        return response.data;
    },

    async unlockPiggyBank(piggyId) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}unlock/`);
        return response.data;
    },

    // ========== Group Invitations ==========
    async getInvitations() {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/')}pending/`);
        return response.data;
    },

    async respondToInvitation(invitationId, accept) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}respond/`, {
            invitation_id: invitationId,
            accept
        });
        return response.data;
    },

    async acceptInvitation(invitationId) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}${invitationId}/accept/`);
        return response.data;
    },

    async rejectInvitation(invitationId) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}${invitationId}/reject/`);
        return response.data;
    },

    // ========== Tier Info ==========
    async getTierInfo() {
        // Return tier pricing and features
        return {
            free: {
                price: 0,
                features: ['Up to 3 members per group', '6 purchases/month', '5 offline notifications']
            },
            standard: {
                price: 9.99,
                features: ['Up to 7 members per group', '25 purchases/month', '25 offline notifications', 'Priority support']
            },
            premium: {
                price: 19.99,
                features: ['Up to 12 members per group', '45 purchases/month', '100 offline notifications', 'Premium support']
            },
            gold: {
                price: 49.99,
                features: ['Unlimited group members', 'Unlimited purchases', 'Unlimited notifications', 'Dedicated support', 'API access']
            }
        };
    },

    // ========== Products ==========
    async getProducts() {
        const response = await api.get(API_ENDPOINTS.PRODUCTS);
        return response.data;
    },

    async getProductById(id) {
        const response = await api.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
        return response.data;
    },

    async getRecommendations() {
        const response = await api.get(API_ENDPOINTS.RECOMMENDATIONS);
        return response.data;
    },

    // ========== Subscriptions ==========
    async getSubscriptions() {
        const response = await api.get(API_ENDPOINTS.User_SUBSCRIPTIONS);
        return response.data;
    },
};

export default paymentsService;

