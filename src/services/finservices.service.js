import api from './api';

const BASE = '/api/payments';

export const billsService = {
    getProviders: (category) => api.get(`${BASE}/bill-providers/`, { params: category ? { category } : {} }),
    getPaymentHistory: () => api.get(`${BASE}/bill-payments/`),
    payBill: (data) => api.post(`${BASE}/bill-payments/`, data),

    // Service Provider Management
    getMyServiceProviders: () => api.get(`${BASE}/service-providers/`),
    addServiceProvider: (data) => api.post(`${BASE}/service-providers/`, data),
    updateServiceProvider: (id, data) => api.put(`${BASE}/service-providers/${id}/`, data),
    deleteServiceProvider: (id) => api.delete(`${BASE}/service-providers/${id}/`),

    // Standing Orders
    getStandingOrders: () => api.get(`${BASE}/standing-orders/`),
    createStandingOrder: (data) => api.post(`${BASE}/standing-orders/`, data),
    cancelStandingOrder: (id) => api.post(`${BASE}/standing-orders/${id}/cancel/`),
};

export const loansService = {
    getProducts: (group) => api.get(`${BASE}/loan-products/`, { params: group !== undefined ? { group } : {} }),
    getMyScore: () => api.get(`${BASE}/credit-scores/my_score/`),
    getMyLoans: () => api.get(`${BASE}/loan-applications/`),
    applyForLoan: (data) => api.post(`${BASE}/loan-applications/`, data),
    approveLoan: (id) => api.post(`${BASE}/loan-applications/${id}/approve/`),
    disburseLoan: (id) => api.post(`${BASE}/loan-applications/${id}/disburse/`),
};

export const escrowService = {
    getMyEscrows: () => api.get(`${BASE}/escrow/`),
    createEscrow: (data) => api.post(`${BASE}/escrow/`, data),
    fundEscrow: (id) => api.post(`${BASE}/escrow/${id}/fund/`),
    deliverEscrow: (id, proof) => api.post(`${BASE}/escrow/${id}/deliver/`, { proof }),
    releaseEscrow: (id) => api.post(`${BASE}/escrow/${id}/release/`),
    disputeEscrow: (id, reason, evidence) => api.post(`${BASE}/escrow/${id}/dispute/`, { reason, evidence }),
};

export const insuranceService = {
    getProducts: (category) => api.get(`${BASE}/insurance-products/`, { params: category ? { category } : {} }),
    getMyPolicies: () => api.get(`${BASE}/insurance-policies/`),
    subscribeToPlan: (data) => api.post(`${BASE}/insurance-policies/`, data),
    getMyClaims: () => api.get(`${BASE}/insurance-claims/`),
    fileClaim: (data) => api.post(`${BASE}/insurance-claims/`, data),
};
