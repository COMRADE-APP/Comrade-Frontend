import api from './api';

const BASE = '/api/payments';

export const billsService = {
    // Providers
    getProviders: (category) => api.get(`${BASE}/bill-providers/`, { params: category ? { category } : {} }),
    getProviderDetail: (id) => api.get(`${BASE}/bill-providers/${id}/`),
    
    // User Payments
    getPaymentHistory: () => api.get(`${BASE}/bill-payments/`),
    getPaymentDetail: (id) => api.get(`${BASE}/bill-payments/${id}/`),
    payBill: (data) => api.post(`${BASE}/bill-payments/`, data),

    // Service Provider Management (Saved accounts)
    getMyServiceProviders: () => api.get(`${BASE}/service-providers/`),
    addServiceProvider: (data) => api.post(`${BASE}/service-providers/`, data),
    updateServiceProvider: (id, data) => api.put(`${BASE}/service-providers/${id}/`, data),
    deleteServiceProvider: (id) => api.delete(`${BASE}/service-providers/${id}/`),

    // Standing Orders (Recurring payments)
    getStandingOrders: () => api.get(`${BASE}/standing-orders/`),
    getStandingOrderDetail: (id) => api.get(`${BASE}/standing-orders/${id}/`),
    createStandingOrder: (data) => api.post(`${BASE}/standing-orders/`, data),
    cancelStandingOrder: (id) => api.post(`${BASE}/standing-orders/${id}/cancel/`),
};

export const loansService = {
    // Products
    getProducts: (group) => api.get(`${BASE}/loan-products/`, { params: group !== undefined ? { group } : {} }),
    getProductDetail: (id) => api.get(`${BASE}/loan-products/${id}/`),
    
    // Credit Score
    getMyScore: () => api.get(`${BASE}/credit-scores/my_score/`),
    getCreditHistory: () => api.get(`${BASE}/credit-scores/`),
    
    // Applications
    getMyLoans: () => api.get(`${BASE}/loan-applications/`),
    getLoanDetail: (id) => api.get(`${BASE}/loan-applications/${id}/`),
    applyForLoan: (data) => api.post(`${BASE}/loan-applications/`, data),
    
    // Loan Actions
    approveLoan: (id) => api.post(`${BASE}/loan-applications/${id}/approve/`),
    rejectLoan: (id, reason) => api.post(`${BASE}/loan-applications/${id}/reject/`, { reason }),
    disburseLoan: (id) => api.post(`${BASE}/loan-applications/${id}/disburse/`),
    repayLoan: (id, amount) => api.post(`${BASE}/loan-applications/${id}/repay/`, { amount }),
    
    // Repayments
    getRepayments: () => api.get(`${BASE}/loan-repayments/`),
};

export const escrowService = {
    getMyEscrows: () => api.get(`${BASE}/escrow/`),
    getEscrowDetail: (id) => api.get(`${BASE}/escrow/${id}/`),
    createEscrow: (data) => api.post(`${BASE}/escrow/`, data),
    fundEscrow: (id) => api.post(`${BASE}/escrow/${id}/fund/`),
    deliverEscrow: (id, proof) => api.post(`${BASE}/escrow/${id}/deliver/`, { proof }),
    releaseEscrow: (id) => api.post(`${BASE}/escrow/${id}/release/`),
    disputeEscrow: (id, reason, evidence) => api.post(`${BASE}/escrow/${id}/dispute/`, { reason, evidence }),
};

export const insuranceService = {
    // Products
    getProducts: (category) => api.get(`${BASE}/insurance-products/`, { params: category ? { category } : {} }),
    getProductDetail: (id) => api.get(`${BASE}/insurance-products/${id}/`),
    
    // Policies
    getMyPolicies: () => api.get(`${BASE}/insurance-policies/`),
    getPolicyDetail: (id) => api.get(`${BASE}/insurance-policies/${id}/`),
    subscribeToPlan: (data) => api.post(`${BASE}/insurance-policies/`, data),
    renewPolicy: (id) => api.post(`${BASE}/insurance-policies/${id}/renew/`),
    cancelPolicy: (id) => api.post(`${BASE}/insurance-policies/${id}/cancel/`),
    
    // Claims
    getMyClaims: () => api.get(`${BASE}/insurance-claims/`),
    getClaimDetail: (id) => api.get(`${BASE}/insurance-claims/${id}/`),
    fileClaim: (data) => api.post(`${BASE}/insurance-claims/`, data),
};

// Automation Services
export const automationService = {
    // Currency
    convertCurrency: (from, to, amount) => api.get(`${BASE}/currency/convert/`, { params: { from, to, amount } }),
    getExchangeRates: (base) => api.get(`${BASE}/currency/rates/`, { params: { base } }),
    
    // Notifications
    sendNotification: (userId, type, title, message) => api.post(`${BASE}/notifications/send/`, { user_id: userId, type, title, message }),
    sendBulkNotification: (userIds, type, title, message) => api.post(`${BASE}/notifications/send/`, { user_ids: userIds, type, title, message }),
    
    // Scheduled Tasks
    processStandingOrders: () => api.post(`${BASE}/tasks/process-standing-orders/`),
    checkLoanOverdue: () => api.post(`${BASE}/tasks/check-loan-overdue/`),
    checkInsuranceExpiry: () => api.post(`${BASE}/tasks/check-insurance-expiry/`),
    
    // Analytics
    getDashboard: (period) => api.get(`${BASE}/analytics/dashboard/`, { params: { period } }),
    
    // Security
    checkRateLimit: () => api.get(`${BASE}/security/rate-limit/`),
    reportSuspicious: (userId, type, description) => api.post(`${BASE}/security/report-suspicious/`, { user_id: userId, type, description }),
};
