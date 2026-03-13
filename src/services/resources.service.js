import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const resourcesService = {
    async getAll() {
        const response = await api.get('/api/resources/resource/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
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

        const response = await api.post(API_ENDPOINTS.RESOURCE_UPLOAD, formData);
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

    // Comments
    async getComments(resourceId) {
        const response = await api.get(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}comments/`);
        return response.data;
    },

    async addComment(resourceId, commentData) {
        const response = await api.post(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}comments/`, commentData);
        return response.data;
    },

    async reactComment(resourceId, commentId, action) {
        const response = await api.post(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}comments/${commentId}/react/`, { action });
        return response.data;
    },

    // Reviews
    async getReviews(resourceId) {
        const response = await api.get(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}reviews/`);
        return response.data;
    },

    async addReview(resourceId, reviewData) {
        const response = await api.post(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}reviews/`, reviewData);
        return response.data;
    },

    // Reactions
    async addReaction(resourceId, reactionType) {
        const response = await api.post(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}react/`, { reaction_type: reactionType });
        return response.data;
    },

    // Sharing
    async share(resourceId, shareData) {
        const response = await api.post(`${API_ENDPOINTS.RESOURCE_DETAIL(resourceId)}share/`, shareData);
        return response.data;
    },

    // Access Requests
    async requestAccess(resourceId, message = '') {
        const response = await api.post(`/api/resources/resource/${resourceId}/request_access/`, { message });
        return response.data;
    },

    async getAccessRequests(resourceId, statusFilter = '') {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await api.get(`/api/resources/resource/${resourceId}/access_requests/`, { params });
        return response.data;
    },

    async reviewAccess(resourceId, requestId, status, reviewNote = '') {
        const response = await api.post(`/api/resources/resource/${resourceId}/review-access/${requestId}/`, { status, review_note: reviewNote });
        return response.data;
    },

    // Analytics
    async recordAnalytics(resourceId, action, metadata = {}) {
        const response = await api.post(`/api/resources/resource/${resourceId}/record_analytics/`, { action, metadata });
        return response.data;
    },

    async getAnalytics(resourceId) {
        const response = await api.get(`/api/resources/resource/${resourceId}/analytics/`);
        return response.data;
    },
};

export default resourcesService;

