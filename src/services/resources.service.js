import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const resourcesService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.RESOURCES);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.RESOURCE_DETAIL(id));
        return response.data;
    },

    async upload(resourceData) {
        const formData = new FormData();

        Object.keys(resourceData).forEach(key => {
            if (resourceData[key] !== null && resourceData[key] !== undefined) {
                formData.append(key, resourceData[key]);
            }
        });

        const response = await api.post(API_ENDPOINTS.RESOURCE_UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async update(id, resourceData) {
        const response = await api.put(API_ENDPOINTS.RESOURCE_DETAIL(id), resourceData);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(API_ENDPOINTS.RESOURCE_DETAIL(id));
        return response.data;
    },

    async download(id) {
        const response = await api.get(API_ENDPOINTS.RESOURCE_DETAIL(id), {
            responseType: 'blob',
        });
        return response.data;
    },
};

export default resourcesService;
