import api from './api';

const profileService = {
    // Get current user's profile
    getMyProfile: async () => {
        const response = await api.get('/auth/profile/');
        return response.data;
    },

    // Get another user's profile
    getProfile: async (userId) => {
        const response = await api.get(`/auth/profile/${userId}/`);
        return response.data;
    },

    // Update profile
    updateProfile: async (data) => {
        const response = await api.patch('/auth/profile/', data);
        return response.data;
    },

    // Upload avatar
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/auth/profile/avatar/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Upload cover
    uploadCover: async (file) => {
        const formData = new FormData();
        formData.append('cover', file);
        const response = await api.post('/auth/profile/cover/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Delete avatar
    deleteAvatar: async () => {
        const response = await api.delete('/auth/profile/avatar/');
        return response.data;
    },

    // Delete cover
    deleteCover: async () => {
        const response = await api.delete('/auth/profile/cover/');
        return response.data;
    },

    // Check email availability
    checkEmail: async (email) => {
        const response = await api.post('/auth/check-email/', { email });
        return response.data;
    },

    // Account management
    deactivateAccount: async () => {
        const response = await api.post('/auth/account/deactivate/');
        return response.data;
    },

    reactivateAccount: async (email, password) => {
        const response = await api.post('/auth/account/reactivate/', { email, password });
        return response.data;
    },

    requestDeletion: async (reason) => {
        const response = await api.post('/auth/account/request-deletion/', { reason });
        return response.data;
    },

    cancelDeletion: async () => {
        const response = await api.post('/auth/account/cancel-deletion/');
        return response.data;
    },

    // Admin: Get deletion requests
    getDeletionRequests: async (status = '') => {
        const params = status ? { status } : {};
        const response = await api.get('/auth/admin/deletion-requests/', { params });
        return response.data;
    },

    // Admin: Approve deletion
    approveDeletion: async (requestId, notes = '') => {
        const response = await api.post(`/auth/admin/deletion-requests/${requestId}/approve/`, { notes });
        return response.data;
    },

    // Admin: Reject deletion
    rejectDeletion: async (requestId, notes = '') => {
        const response = await api.post(`/auth/admin/deletion-requests/${requestId}/reject/`, { notes });
        return response.data;
    },
};

export default profileService;
