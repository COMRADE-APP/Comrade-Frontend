import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const tasksService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.TASKS);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.TASK_DETAIL(id));
        return response.data;
    },

    async create(taskData) {
        const response = await api.post(API_ENDPOINTS.TASKS, taskData);
        return response.data;
    },

    async update(id, taskData) {
        const response = await api.put(API_ENDPOINTS.TASK_DETAIL(id), taskData);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(API_ENDPOINTS.TASK_DETAIL(id));
        return response.data;
    },

    async submit(id, submissionData) {
        const response = await api.post(API_ENDPOINTS.TASK_SUBMIT(id), submissionData);
        return response.data;
    },

    async getSubmission(id) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(id)}submission/`);
        return response.data;
    },
};

export default tasksService;
