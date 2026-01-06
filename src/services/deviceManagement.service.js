import api from './api';

const deviceManagementService = {
    // Get all user devices
    getDevices: async () => {
        const response = await api.get('/api/devices/devices/');
        return response.data;
    },

    // Register current device
    registerDevice: async (additionalData = '') => {
        const response = await api.post('/api/devices/devices/', { additional_data: additionalData });
        return response.data;
    },

    // Get current device
    getCurrentDevice: async () => {
        const response = await api.get('/api/devices/devices/current/');
        return response.data;
    },

    // Revoke device access
    revokeDevice: async (deviceId) => {
        const response = await api.post(`/api/devices/devices/${deviceId}/revoke/`);
        return response.data;
    },

    // Mark device as trusted
    trustDevice: async (deviceId) => {
        const response = await api.post(`/api/devices/devices/${deviceId}/trust/`);
        return response.data;
    },
};

export default deviceManagementService;
