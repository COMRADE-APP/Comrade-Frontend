import api from './api';

const announcementService = {
    // Get all announcements
    getAnnouncements: async () => {
        const response = await api.get('/api/announcements/');
        return response.data;
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
};

export default announcementService;
