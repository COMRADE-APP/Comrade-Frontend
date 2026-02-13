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

    // Get hierarchy (branches, divisions, etc.)
    async getHierarchy(id) {
        const response = await api.get(`${API_ENDPOINTS.ORGANIZATION_DETAIL(id)}hierarchy/`);
        return response.data;
    },

    // ============================================================================
    // MEMBER MANAGEMENT
    // ============================================================================

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

    // Add member (direct add)
    async addMember(organisationId, userId, role = 'member', title = '') {
        const response = await api.post(API_ENDPOINTS.ORGANISATION_MEMBERS, {
            organisation: organisationId,
            user: userId,
            role,
            title
        });
        return response.data;
    },

    // Update member title
    async updateMemberTitle(memberId, title) {
        const response = await api.patch(`${API_ENDPOINTS.ORGANISATION_MEMBERS}${memberId}/update_title/`, { title });
        return response.data;
    },

    // Update member role
    async updateMemberRole(memberId, role) {
        const response = await api.patch(`${API_ENDPOINTS.ORGANISATION_MEMBERS}${memberId}/update_role/`, { role });
        return response.data;
    },

    // Remove member (deactivate)
    async removeMember(memberId) {
        const response = await api.post(`${API_ENDPOINTS.ORGANISATION_MEMBERS}${memberId}/deactivate/`);
        return response.data;
    },

    // Get user's organizations where they are a member
    async getMyOrganizations() {
        const response = await api.get(`${API_ENDPOINTS.ORGANISATIONS}my_organizations/`);
        return response.data;
    },
};

export default organizationsService;

