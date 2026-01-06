import api from './api';

const activityLogService = {
    // Get all user activities
    getActivities: async () => {
        const response = await api.get('/api/activity/activities/');
        return response.data;
    },

    // Get recent activities (last 24 hours)
    getRecentActivities: async () => {
        const response = await api.get('/api/activity/activities/recent/');
        return response.data;
    },

    // Get activity statistics
    getActivityStats: async () => {
        const response = await api.get('/api/activity/activities/stats/');
        return response.data;
    },

    // Get action logs
    getActionLogs: async () => {
        const response = await api.get('/api/activity/logs/');
        return response.data;
    },

    // Get user sessions
    getSessions: async () => {
        const response = await api.get('/api/activity/sessions/');
        return response.data;
    },

    // Get active sessions
    getActiveSessions: async () => {
        const response = await api.get('/api/activity/sessions/active/');
        return response.data;
    },
};

export default activityLogService;
