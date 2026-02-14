import api from './api';

const BASE_URL = '/api/research';

const researchService = {
    // Projects
    getAllProjects: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/projects/`, { params });
        return response.data;
    },

    getProjectById: async (id) => {
        const response = await api.get(`${BASE_URL}/projects/${id}/`);
        return response.data;
    },

    createProject: async (data) => {
        const response = await api.post(`${BASE_URL}/projects/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateProject: async (id, data) => {
        const response = await api.patch(`${BASE_URL}/projects/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    publishProject: async (id) => {
        const response = await api.post(`${BASE_URL}/projects/${id}/publish/`);
        return response.data;
    },

    requestReview: async (id) => {
        const response = await api.post(`${BASE_URL}/projects/${id}/request_review/`);
        return response.data;
    },

    // Positions
    getPositions: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/positions/`, { params });
        return response.data;
    },

    createPosition: async (data) => {
        const response = await api.post(`${BASE_URL}/positions/`, data);
        return response.data;
    },

    // Participants
    joinResearch: async (researchId, positionId) => {
        const response = await api.post(`${BASE_URL}/participants/join/`, {
            research_id: researchId,
            position_id: positionId
        });
        return response.data;
    },

    getMyParticipations: async () => {
        const response = await api.get(`${BASE_URL}/participants/`);
        return response.data;
    },

    // Reviews
    getReviews: async () => {
        const response = await api.get(`${BASE_URL}/reviews/`);
        return response.data;
    },

    submitReview: async (data) => {
        const response = await api.post(`${BASE_URL}/reviews/`, data);
        return response.data;
    },

    // Publications
    createPublication: async (data) => {
        const response = await api.post(`${BASE_URL}/publications/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updatePublication: async (id, data) => {
        const response = await api.patch(`${BASE_URL}/publications/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default researchService;
