import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const tasksService = {
    async getAll() {
        try {
            const response = await api.get(API_ENDPOINTS.TASKS);
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (data?.results) return data.results;
            if (data && typeof data === 'object') return Object.values(data).flat().filter(Boolean);
            return [];
        } catch (error) {
            console.error('Tasks getAll error:', error?.response?.status, error?.message);
            return [];
        }
    },

    async getMyTasks() {
        try {
            const response = await api.get(API_ENDPOINTS.TASKS_MY);
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (data?.results) return data.results;
            if (data && typeof data === 'object') return Object.values(data).flat().filter(Boolean);
            return [];
        } catch (error) {
            console.error('Tasks getMyTasks error:', error?.response?.status, error?.message);
            return [];
        }
    },

    async getCompletedTasks() {
        try {
            const response = await api.get(`${API_ENDPOINTS.TASKS_MY}completed/`);
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (data?.results) return data.results;
            if (data && typeof data === 'object') return Object.values(data).flat().filter(Boolean);
            return [];
        } catch (error) {
            console.error('Tasks getCompletedTasks error:', error?.response?.status, error?.message);
            return [];
        }
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

    async markCompleted(id) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(id)}mark_completed/`);
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

    // Reactions & Interactions
    async addReaction(taskId, reactionType) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}react/`, { reaction_type: reactionType });
        return response.data;
    },

    async recordView(taskId) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}view/`);
        return response.data;
    },

    async report(taskId) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}report/`);
        return response.data;
    },

    async block(taskId) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}block/`);
        return response.data;
    },

    // Sharing
    async share(taskId, shareData) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}share/`, shareData);
        return response.data;
    },

    // Settings
    async getSettings(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}task_settings/`);
        return response.data;
    },

    async saveSettings(taskId, settingsData) {
        const response = await api.patch(`${API_ENDPOINTS.TASK_DETAIL(taskId)}task_settings/`, settingsData);
        return response.data;
    },

    // Analytics
    async recordAccess(taskId) {
        return api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}record_access/`).catch(() => { });
    },

    async getAnalytics(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}analytics/`);
        return response.data;
    },

    // Responses
    async getMyCreatedSubmissions() {
        const response = await api.get(`${API_ENDPOINTS.TASKS}my_created_submissions/`);
        return response.data;
    },

    async getMyResponse(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}my_response/`);
        return response.data;
    },

    async getResponses(taskId) {
        const response = await api.get(`${API_ENDPOINTS.TASK_DETAIL(taskId)}responses/`);
        return response.data;
    },

    async getResponseById(responseId) {
        const response = await api.get(API_ENDPOINTS.RESPONSE_DETAIL(responseId));
        return response.data;
    },

    async gradeResponse(responseId, gradesData) {
        const response = await api.post(`${API_ENDPOINTS.TASKS}${responseId}/grade_response/`, gradesData);
        return response.data;
    },

    // Save Draft
    async saveDraft(taskId, responses) {
        return api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}save_draft/`, { responses }).catch(() => { });
    },

    // Response Status Management
    async updateResponseStatus(taskId, responseId, statusData) {
        const response = await api.post(API_ENDPOINTS.TASK_UPDATE_STATUS(taskId), { response_id: responseId, ...statusData });
        return response.data;
    },

    async autoGrade(taskId) {
        const response = await api.post(API_ENDPOINTS.TASK_AUTO_GRADE(taskId));
        return response.data;
    },

    async getGradingConfig(taskId) {
        const response = await api.get(API_ENDPOINTS.TASK_GRADING_CONFIG(taskId));
        return response.data;
    },

    async setGradingConfig(taskId, config) {
        const response = await api.post(API_ENDPOINTS.TASK_GRADING_CONFIG(taskId), config);
        return response.data;
    },

    // AI-Powered Features
    async generateFromDocument(formData) {
        const response = await api.post(`${API_ENDPOINTS.TASKS}generate_from_document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });
        return response.data;
    },

    async generateQuestions(data) {
        const response = await api.post(`${API_ENDPOINTS.TASKS}generate_questions/`, data, {
            timeout: 60000,
        });
        return response.data;
    },

    async aiGrade(taskId, responseId) {
        const response = await api.post(`${API_ENDPOINTS.TASK_DETAIL(taskId)}ai_grade/`, { response_id: responseId }, {
            timeout: 120000,
        });
        return response.data;
    },
};

export default tasksService;

