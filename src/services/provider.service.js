import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const BASE = '/api/payments';
const BASE_V1 = '/api/v1/payments';

export const providerService = {
    // ========== Registration & Onboarding ==========
    async getMyRegistrations() {
        const response = await api.get(`${BASE_V1}/provider-registrations/`);
        return response.data.results || response.data;
    },

    async getRegistrationDetail(id) {
        const response = await api.get(`${BASE_V1}/provider-registrations/${id}/`);
        return response.data;
    },

    async createRegistration(formData) {
        const response = await api.post(`${BASE_V1}/provider-registrations/`, formData);
        return response.data;
    },

    async submitRegistration(id) {
        const response = await api.post(`${BASE_V1}/provider-registrations/${id}/submit/`);
        return response.data;
    },

    async updateRegistration(id, payload) {
        const response = await api.patch(`${BASE_V1}/provider-registrations/${id}/`, payload);
        return response.data;
    },

    async getDashboardStats(id) {
        const response = await api.get(`${BASE_V1}/provider-registrations/${id}/dashboard/`);
        return response.data;
    },

    async requestPayout(providerId, data) {
        const response = await api.post(`${BASE_V1}/provider-registrations/${providerId}/request_payout/`, data);
        return response.data;
    },

    // ========== Applications (from groups/users seeking services) ==========
    async getProviderApplications(params = {}) {
        const response = await api.get(`${BASE}/provider-applications/`, { params });
    return response.data;
    },

    async getProviderApplicationsByProvider(providerId) {
        const response = await api.get(`${BASE_V1}/provider-applications/`, { params: { provider_id: providerId } });
        return response.data.results || response.data;
    },

    async submitProviderApplication(data) {
        const response = await api.post(`${BASE}/provider-applications/`, data);
        return response.data;
    },

    async reviewApplication(applicationId, reviewData) {
        const response = await api.post(`${BASE_V1}/provider-applications/${applicationId}/review/`, reviewData);
        return response.data;
    },

    // ========== Service Products ==========
    async getServiceProducts(params = {}) {
        const response = await api.get(`${BASE_V1}/service-products/`, { params });
        return response.data.results || response.data;
    },

    async getProviderLoanProducts() {
        const response = await api.get(`${BASE}/service-products/`, { params: { service_type: 'loan' } });
        return response.data;
    },

    async createServiceProduct(payload) {
        const response = await api.post(`${BASE_V1}/service-products/`, payload);
        return response.data;
    },

    async updateServiceProduct(id, payload) {
        const response = await api.patch(`${BASE_V1}/service-products/${id}/`, payload);
        return response.data;
    },

    async activateProduct(id) {
        const response = await api.post(`${BASE_V1}/service-products/${id}/activate/`);
        return response.data;
    },

    async suspendProduct(id) {
        const response = await api.post(`${BASE_V1}/service-products/${id}/suspend/`);
        return response.data;
    },

    async deleteProduct(id) {
        const response = await api.delete(`${BASE_V1}/service-products/${id}/`);
        return response.data;
    },

    // ========== Documents ==========
    async getProviderDocuments(providerId) {
        const response = await api.get(`${BASE_V1}/provider-documents/`, { params: { provider_id: providerId } });
        return response.data.results || response.data;
    },

    async uploadDocument(formData) {
        const response = await api.post(`${BASE_V1}/provider-documents/`, formData);
        return response.data;
    },

    async deleteDocument(docId) {
        const response = await api.delete(`${BASE_V1}/provider-documents/${docId}/`);
        return response.data;
    },

    // ========== Staff ==========
    async getProviderStaff(providerId) {
        const response = await api.get(`${BASE_V1}/provider-staff/by_provider/`, { params: { provider_id: providerId } });
        return response.data.results || response.data;
    },

    async addStaff(data) {
        const response = await api.post(`${BASE_V1}/provider-staff/`, data);
        return response.data;
    },

    async activateStaff(staffId) {
        const response = await api.post(`${BASE_V1}/provider-staff/${staffId}/activate/`);
        return response.data;
    },

    async deactivateStaff(staffId) {
        const response = await api.post(`${BASE_V1}/provider-staff/${staffId}/deactivate/`);
        return response.data;
    },

    async updateStaffPermissions(staffId, permissions) {
        const response = await api.post(`${BASE_V1}/provider-staff/${staffId}/update_permissions/`, permissions);
        return response.data;
    },

    // ========== Transactions ==========
    async getProviderTransactions(params = {}) {
        const response = await api.get(`${BASE_V1}/provider-transactions/`, { params });
        return response.data;
    },

    async getTransactionSummary(providerId) {
        const response = await api.get(`${BASE_V1}/provider-transactions/summary/`, { params: { provider_id: providerId } });
        return response.data;
    },

    async processTransaction(id) {
        const response = await api.post(`${BASE_V1}/provider-transactions/${id}/process/`);
        return response.data;
    },

    async refundTransaction(id, data) {
        const response = await api.post(`${BASE_V1}/provider-transactions/${id}/refund/`, data);
        return response.data;
    },

    // ========== Queries & Support ==========
    async getProviderQueries(params = {}) {
        const response = await api.get(`${BASE_V1}/provider-queries/`, { params });
        return response.data;
    },

    async handleQueryAction(queryId, action, payload = {}) {
        const response = await api.post(`${BASE_V1}/provider-queries/${queryId}/${action}/`, payload);
        return response.data;
    },

    // ========== Notifications ==========
    async getProviderNotifications(providerId) {
        const response = await api.get(`${BASE_V1}/provider-notifications/`, { params: { provider_id: providerId } });
        return response.data;
    },

    // ========== Partner / Agent / Supplier / Shop Registrations ==========
    async registerPartnerApplication(data) {
        const response = await api.post(API_ENDPOINTS.PARTNER_APPLICATIONS, data);
        return response.data;
    },

    async registerAgentApplication(data) {
        const response = await api.post(API_ENDPOINTS.AGENT_APPLICATIONS, data);
        return response.data;
    },

    async registerSupplierApplication(data) {
        const response = await api.post(API_ENDPOINTS.SUPPLIER_APPLICATIONS, data);
        return response.data;
    },

    async registerShop(data) {
        const response = await api.post(API_ENDPOINTS.SHOP_REGISTRATIONS, data);
        return response.data;
    },

    async checkPartnerStatus() {
        try {
            const partnerRes = await api.get(API_ENDPOINTS.PARTNER_STATUS);
            return { is_partner: true, ...partnerRes.data };
        } catch (e) {
            try {
                const appRes = await api.get(API_ENDPOINTS.PARTNER_APPLICATIONS);
                if (appRes.data && Array.isArray(appRes.data) && appRes.data.length > 0) {
                    return { is_partner: false, has_application: true, application: appRes.data[0] };
                }
            } catch (err) { }
            return { is_partner: false, has_application: false };
        }
    },
};

export default providerService;
