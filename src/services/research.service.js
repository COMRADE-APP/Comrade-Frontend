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
    },

    // Applications
    applyToPosition: async (projectId, data) => {
        const response = await api.post(`${BASE_URL}/projects/${projectId}/apply/`, data);
        return response.data;
    },

    getProjectApplications: async (projectId, statusFilter = '') => {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await api.get(`${BASE_URL}/projects/${projectId}/applications/`, { params });
        return response.data;
    },

    reviewApplication: async (applicationId, status, reviewerNotes = '') => {
        const response = await api.post(`${BASE_URL}/applications/${applicationId}/review/`, {
            status,
            reviewer_notes: reviewerNotes
        });
        return response.data;
    },

    withdrawApplication: async (applicationId) => {
        const response = await api.post(`${BASE_URL}/applications/${applicationId}/withdraw/`);
        return response.data;
    },

    getMyApplications: async () => {
        const response = await api.get(`${BASE_URL}/applications/my_applications/`);
        return response.data;
    },

    // Analytics
    recordProjectView: async (projectId) => {
        const response = await api.post(`${BASE_URL}/projects/${projectId}/record_view/`);
        return response.data;
    },

    getProjectAnalytics: async (projectId) => {
        const response = await api.get(`${BASE_URL}/projects/${projectId}/analytics/`);
        return response.data;
    },

    // Recruitment Posts
    getRecruitmentPosts: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/recruitment_posts/`, { params });
        return response.data;
    },

    createRecruitmentPost: async (data) => {
        const response = await api.post(`${BASE_URL}/recruitment_posts/`, data);
        return response.data;
    },

    applyToRecruitmentPost: async (postId, data) => {
        const response = await api.post(`${BASE_URL}/recruitment_posts/${postId}/apply/`, data);
        return response.data;
    },

    getRecruitmentPostApplications: async (postId) => {
        const response = await api.get(`${BASE_URL}/recruitment_posts/${postId}/applications/`);
        return response.data;
    },

    convertRecruitmentPostToOpinion: async (postId) => {
        const response = await api.post(`${BASE_URL}/recruitment_posts/${postId}/convert_to_opinion/`);
        return response.data;
    }
};

export default researchService;

