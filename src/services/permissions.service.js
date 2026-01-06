import api from './api';

const permissionsService = {
    // Get all user permissions
    getPermissions: async () => {
        const response = await api.get('/api/permissions/permissions/');
        return response.data;
    },

    // Request a new permission
    requestPermission: async (permissionType, reason, feature = '', page = '') => {
        const response = await api.post('/api/permissions/permissions/request_permission/', {
            permission_type: permissionType,
            reason: reason,
            feature_requiring_permission: feature,
            requested_from_page: page,
        });
        return response.data;
    },

    // Revoke a permission
    revokePermission: async (permissionId) => {
        const response = await api.post(`/api/permissions/permissions/${permissionId}/revoke/`);
        return response.data;
    },

    // Check if user has specific permission
    checkPermission: async (permissionType) => {
        const response = await api.get(`/api/permissions/permissions/check/`, {
            params: { permission_type: permissionType }
        });
        return response.data;
    },

    // Get permission requests history
    getPermissionRequests: async () => {
        const response = await api.get('/api/permissions/requests/');
        return response.data;
    },

    // Get permission audit log
    getPermissionAudit: async () => {
        const response = await api.get('/api/permissions/audit/');
        return response.data;
    },

    // Request browser permission (camera, microphone, location)
    requestBrowserPermission: async (permissionType) => {
        try {
            switch (permissionType) {
                case 'camera':
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    break;
                case 'microphone':
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    break;
                case 'location':
                    await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    break;
                default:
                    throw new Error(`Unknown permission type: ${permissionType}`);
            }
            return { granted: true };
        } catch (error) {
            return { granted: false, error: error.message };
        }
    },
};

export default permissionsService;
