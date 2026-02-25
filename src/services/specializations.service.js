import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const specializationsService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATIONS);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATION_DETAIL(id));
        return response.data;
    },

    async join(id) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATION_JOIN(id));
        return response.data;
    },

    async getAllStacks() {
        const response = await api.get(API_ENDPOINTS.STACKS);
        return response.data;
    },

    async getStackById(id) {
        const response = await api.get(API_ENDPOINTS.STACK_DETAIL(id));
        return response.data;
    },

    async completeStack(id) {
        const response = await api.post(API_ENDPOINTS.STACK_COMPLETE(id));
        return response.data;
    },

    async getCertificates() {
        const response = await api.get(API_ENDPOINTS.CERTIFICATES);
        return response.data;
    },

    async create(data) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATIONS, data);
        return response.data;
    },

    async createStack(data) {
        const response = await api.post(API_ENDPOINTS.STACKS, data);
        return response.data;
    },
};

export default specializationsService;
