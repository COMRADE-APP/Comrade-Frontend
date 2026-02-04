import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const fundingService = {
    // Business Management
    createBusiness: async (data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.BUSINESSES, data);
        return response.data;
    },

    getMyBusinesses: async () => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.BUSINESSES}my_businesses/`);
        // Custom action returns simple array
        return response.data;
    },

    getAllBusinesses: async () => {
        const response = await api.get(API_ENDPOINTS.FUNDING.BUSINESSES);
        // ModelViewSet list returns paginated object { results: [...] }
        return response.data.results || response.data;
    },

    // Documents
    uploadDocument: async (formData) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.DOCUMENTS, formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },

    // Opportunities
    getOpportunities: async () => {
        const response = await api.get(API_ENDPOINTS.FUNDING.OPPORTUNITIES);
        // ModelViewSet list returns paginated object
        return response.data.results || response.data;
    },

    // Requests
    createRequest: async (data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.REQUESTS, data);
        return response.data;
    }
};

export default fundingService;
