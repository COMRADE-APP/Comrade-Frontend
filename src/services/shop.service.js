import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const shopService = {
    getProducts: async () => {
        const response = await api.get(API_ENDPOINTS.PRODUCTS);
        return response.data;
    },

    getProduct: async (id) => {
        const response = await api.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
        return response.data;
    },

    getRecommendations: async () => {
        const response = await api.get(API_ENDPOINTS.RECOMMENDATIONS);
        return response.data;
    },
};

export default shopService;
