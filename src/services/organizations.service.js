import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const organizationsService = {
    // Get all organizations
    async getAll() {
        const response = await api.get(API_ENDPOINTS.ORGANIZATIONS);
        return response.data.results || response.data;
    },

    // Get single organization
    async getById(id) {
        const response = await api.get(API_ENDPOINTS.ORGANIZATION_DETAIL(id));
        return response.data;
    },

    // Create organization
    async create(data) {
        const response = await api.post(API_ENDPOINTS.ORGANIZATIONS, data);
        return response.data;
    },

    // Update organization
    async update(id, data) {
        const response = await api.put(API_ENDPOINTS.ORGANIZATION_DETAIL(id), data);
        return response.data;
    },

    // Send email verification
    async sendEmailVerification(id) {
        const response = await api.post(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}send_email_verification/`);
        return response.data;
    },

    // Verify email
    async verifyEmail(id, token) {
        const response = await api.post(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}verify_email/`, { token });
        return response.data;
    },

    // Submit for review
    async submitForReview(id) {
        const response = await api.post(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}submit_for_review/`);
        return response.data;
    },

    // Upload document
    async uploadDocument(id, formData) {
        const response = await api.post(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}documents/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get verification logs
    async getVerificationLogs(id) {
        const response = await api.get(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}verification_logs/`);
        return response.data;
    },

    // Get members
    async getMembers(id) {
        const response = await api.get(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}members/`);
        return response.data;
    },

    // Invite member
    async inviteMember(id, data) {
        const response = await api.post(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}invite_member/`, data);
        return response.data;
    },
};

export default organizationsService;
