import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const activityLogService = {
    // ========================================
    // ACTIVITY LOGS
    // ========================================

    // Get all user activities (with optional filters)
    getActivities: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.TRACKING.ACTIVITIES, { params });
        return response.data;
    },

    // Get activity statistics
    getActivityStats: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.ACTIVITY_STATS);
        return response.data;
    },

    // Log a new activity from frontend
    logActivity: async (activityType, description, metadata = {}) => {
        const response = await api.post(API_ENDPOINTS.TRACKING.ACTIVITY_LOG, {
            activity_type: activityType,
            description,
            metadata,
        });
        return response.data;
    },

    // Get action logs
    getActionLogs: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.ACTIONS);
        return response.data;
    },

    // Get user sessions
    getSessions: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.SESSIONS);
        return response.data;
    },

    // ========================================
    // CONSENT MANAGEMENT
    // ========================================

    // Get all permission consent statuses
    getAllConsents: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.CONSENT_ALL);
        return response.data;
    },

    // Update a specific consent (grant or revoke)
    updateConsent: async (permissionType, isGranted) => {
        const response = await api.post(API_ENDPOINTS.TRACKING.CONSENT_UPDATE, {
            permission_type: permissionType,
            is_granted: isGranted,
        });
        return response.data;
    },

    // ========================================
    // CONNECTION SECURITY
    // ========================================

    // Get connection security logs
    getConnectionLogs: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.CONNECTIONS);
        return response.data;
    },

    // Check current connection security
    checkCurrentConnection: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.CONNECTION_CURRENT);
        return response.data;
    },

    // ========================================
    // SEARCH HISTORY
    // ========================================

    // Get search history
    getSearchHistory: async () => {
        const response = await api.get(API_ENDPOINTS.TRACKING.SEARCHES);
        return response.data;
    },

    // ========================================
    // EXPORT
    // ========================================

    // Export activity log as CSV or JSON
    exportActivityLog: async (format = 'json', startDate = null, endDate = null) => {
        const params = { format };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await api.get(API_ENDPOINTS.TRACKING.EXPORT, {
            params,
            responseType: 'blob',
        });

        // Trigger download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity_log.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    },
};

export default activityLogService;
