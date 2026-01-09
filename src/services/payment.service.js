import api from './api';

const paymentService = {
    // Payment Profile
    getMyProfile: async () => {
        return api.get('/payments/profiles/my_profile/');
    },

    getBalance: async () => {
        return api.get('/payments/profiles/balance/');
    },

    // Tier Management
    getTierPricing: async () => {
        return api.get('/payments/tiers/pricing/');
    },

    upgradeTier: async (tier, paymentMethod) => {
        return api.post('/payments/tiers/upgrade/', { tier, payment_method: paymentMethod });
    },

    getCurrentTier: async () => {
        const response = await api.get('/payments/profiles/my_profile/');
        return response.data?.tier || 'free';
    },

    // Transactions
    getTransactions: async (params) => {
        return api.get('/payments/transactions/', { params });
    },

    createTransaction: async (data) => {
        return api.post('/payments/transactions/create_transaction/', data);
    },

    getTransactionHistory: async () => {
        return api.get('/payments/transactions/history/');
    },

    // Payment Groups
    getMyGroups: async () => {
        return api.get('/payments/groups/my_groups/');
    },

    createGroup: async (data) => {
        return api.post('/payments/groups/', data);
    },

    getGroup: async (id) => {
        return api.get(`/payments/groups/${id}/`);
    },

    joinGroup: async (id) => {
        return api.post(`/payments/groups/${id}/join/`);
    },

    contributeToGroup: async (id, amount, notes = '') => {
        return api.post(`/payments/groups/${id}/contribute/`, { amount, notes });
    },

    inviteToGroup: async (id, email) => {
        return api.post(`/payments/groups/${id}/invite/`, { email });
    },

    getGroupMembers: async (id) => {
        return api.get(`/payments/groups/${id}/members/`);
    },

    getGroupContributions: async (id) => {
        return api.get(`/payments/groups/${id}/contributions_list/`);
    },

    // Products (Shop)
    getProducts: async (params) => {
        return api.get('/payments/products/', { params });
    },

    getProduct: async (id) => {
        return api.get(`/payments/products/${id}/`);
    },

    getRecommendations: async () => {
        return api.get('/payments/products/recommendations/');
    },

    // User Subscriptions
    getMySubscriptions: async () => {
        return api.get('/payments/subscriptions/');
    },

    getSubscription: async (id) => {
        return api.get(`/payments/subscriptions/${id}/`);
    },

    // Piggy Bank (Group Targets)
    getTargets: async () => {
        return api.get('/payments/targets/');
    },

    getTarget: async (id) => {
        return api.get(`/payments/targets/${id}/`);
    },

    createTarget: async (data) => {
        return api.post('/payments/targets/', data);
    },

    contributeToTarget: async (id, amount) => {
        return api.post(`/payments/targets/${id}/contribute/`, { amount });
    },
};

// Tier Limits Configuration (matching backend)
export const TIER_LIMITS = {
    free: {
        maxGroupMembers: 3,
        maxGroups: 3,
        monthlyPurchases: 6,
        offlineNotifications: 5,
        features: [
            'Up to 3 members per group',
            '6 purchases per month',
            '5 offline notification subscriptions',
            'Basic support'
        ]
    },
    standard: {
        maxGroupMembers: 7,
        maxGroups: 5,
        monthlyPurchases: 25,
        offlineNotifications: 25,
        price: 9.99,
        priceAnnual: 99.99,
        features: [
            'Up to 7 members per group',
            '25 purchases per month',
            '25 offline notification subscriptions',
            'Priority support',
            'Group purchases up to 25 people'
        ]
    },
    premium: {
        maxGroupMembers: 12,
        maxGroups: 15,
        monthlyPurchases: 45,
        offlineNotifications: 100,
        price: 19.99,
        priceAnnual: 199.99,
        features: [
            'Up to 12 members per group',
            '45 purchases per month',
            '100 offline notification subscriptions',
            'Premium support',
            'Advanced analytics'
        ]
    },
    gold: {
        maxGroupMembers: Infinity,
        maxGroups: Infinity,
        monthlyPurchases: Infinity,
        offlineNotifications: Infinity,
        price: 49.99,
        priceAnnual: 499.99,
        features: [
            'Unlimited group members',
            'Unlimited purchases',
            'Unlimited offline notifications',
            'Dedicated support',
            'Custom features',
            'API access'
        ]
    }
};

export const getTierLimit = (tier, limitType) => {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    return limits[limitType];
};

export default paymentService;
