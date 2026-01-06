import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const organizationsService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.ORGANIZATIONS);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.ORGANIZATION_DETAIL(id));
        return response.data;
    },
};

export default organizationsService;
