import api from './api';

const institutionsService = {
    // Get all institutions (user is member of)
    getInstitutions: async () => {
        const response = await api.get('/api/institutions/');
        return response.data;
    },

    // Alias for getInstitutions
    getAll: async () => {
        const response = await api.get('/api/institutions/');
        return response.data;
    },

    // Get single institution
    getInstitution: async (id) => {
        const response = await api.get(`/api/institutions/${id}/`);
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/api/institutions/${id}/`);
        return response.data;
    },

    // Create institution
    createInstitution: async (data) => {
        const response = await api.post('/api/institutions/', data);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/api/institutions/', data);
        return response.data;
    },

    // Update institution
    updateInstitution: async (id, data) => {
        const response = await api.put(`/api/institutions/${id}/`, data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/api/institutions/${id}/`, data);
        return response.data;
    },

    // Delete institution
    delete: async (id) => {
        const response = await api.delete(`/api/institutions/${id}/`);
        return response.data;
    },

    // Send email verification
    sendEmailVerification: async (id) => {
        const response = await api.post(`/api/institutions/${id}/send_email_verification/`);
        return response.data;
    },

    // Verify email
    verifyEmail: async (id, token) => {
        const response = await api.post(`/api/institutions/${id}/verify_email/`, { token });
        return response.data;
    },

    // Submit for review
    submitForReview: async (id) => {
        const response = await api.post(`/api/institutions/${id}/submit_for_review/`);
        return response.data;
    },

    // Get members
    getMembers: async (id) => {
        const response = await api.get(`/api/institutions/${id}/members/`);
        return response.data;
    },

    // Invite member
    inviteMember: async (id, data) => {
        const response = await api.post(`/api/institutions/${id}/invite_member/`, data);
        return response.data;
    },

    // Get verification logs
    getVerificationLogs: async (id) => {
        const response = await api.get(`/api/institutions/${id}/verification_logs/`);
        return response.data;
    },

    // Upload document
    uploadDocument: async (id, formData) => {
        const response = await api.post(`/api/institutions/${id}/documents/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default institutionsService;
