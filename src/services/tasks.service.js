import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const tasksService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.TASKS);
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },

    async getMyTasks() {
        const response = await api.get(API_ENDPOINTS.TASKS_MY);
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
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

    async getQuestions(taskId) {
        const response = await api.get(API_ENDPOINTS.TASK_QUESTIONS(taskId));
        return response.data;
    },

    async getSubmissions(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}submissions/`);
        return response.data;
    },

    // Comments
    async getComments(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}comments/`);
        return response.data;
    },

    async addComment(taskId, commentData) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}comments/`, commentData);
        return response.data;
    },

    // Reactions
    async addReaction(taskId, reactionType) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}react/`, { reaction_type: reactionType });
        return response.data;
    },

    // Sharing
    async share(taskId, shareData) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}share/`, shareData);
        return response.data;
    },
};

export default tasksService;
