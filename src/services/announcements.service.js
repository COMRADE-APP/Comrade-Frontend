import api from './api';

const announcementService = {
    // Get all announcements (with pagination handling)
    getAll: async () => {
        const response = await api.get('/api/announcements/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },

    // Alias
    getAnnouncements: async () => {
        const response = await api.get('/api/announcements/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },

    // Get single announcement
    getAnnouncement: async (id) => {
        const response = await api.get(`/api/announcements/${id}/`);
        return response.data;
    },

    // Create announcement
    createAnnouncement: async (data) => {
        const response = await api.post('/api/announcements/', data);
        return response.data;
    },

    // Update announcement
    updateAnnouncement: async (id, data) => {
        const response = await api.put(`/api/announcements/${id}/`, data);
        return response.data;
    },

    // Delete announcement
    deleteAnnouncement: async (id) => {
        const response = await api.delete(`/api/announcements/${id}/`);
        return response.data;
    },

    // Subscribe to announcement
    subscribe: async (id, preferences) => {
        const response = await api.post(`/api/announcements/${id}/subscribe/`, preferences);
        return response.data;
    },

    // Unsubscribe from announcement
    unsubscribe: async (id) => {
        const response = await api.post(`/api/announcements/${id}/unsubscribe/`);
        return response.data;
    },

    // Convert service to announcement
    convertToAnnouncement: async (data) => {
        const response = await api.post('/api/announcements/convert/', data);
        return response.data;
    },

    // Get user subscriptions
    getSubscriptions: async () => {
        const response = await api.get('/api/announcements/subscriptions/');
        return response.data;
    },

    // Grant permission to user for announcement
    grantPermission: async (announcementId, userId, role) => {
        const response = await api.post(`/api/announcements/${announcementId}/grant_permission/`, {
            user_id: userId,
            role: role, // 'admin', 'moderator', 'creator'
        });
        return response.data;
    },

    // Get conversion history
    getConversionHistory: async () => {
        const response = await api.get('/api/announcements/convert/history/');
        return response.data;
    },

    // Get pending offline notifications
    getPendingNotifications: async () => {
        const response = await api.get('/api/announcements/notifications/pending/');
        return response.data;
    },

    // Comments
    getComments: async (announcementId) => {
        const response = await api.get(`/api/announcements/${announcementId}/comments/`);
        return response.data;
    },

    addComment: async (announcementId, commentData) => {
        const response = await api.post(`/api/announcements/${announcementId}/comments/`, commentData);
        return response.data;
    },

    // Reactions
    addReaction: async (announcementId, reactionType) => {
        const response = await api.post(`/api/announcements/${announcementId}/react/`, { reaction_type: reactionType });
        return response.data;
    },
};

// Named export alias for consistency
export const announcementsService = announcementService;
export default announcementService;
