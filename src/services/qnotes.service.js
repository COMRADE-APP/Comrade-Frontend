import api from './api';

const BASE_URL = '/api/qnotes';

const qnotesService = {
    // Get random notes (shuffled feed)
    getRandom: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/qnotes/random/`, { params });
        return response.data;
    },

    // Get trending notes
    getTrending: async () => {
        const response = await api.get(`${BASE_URL}/qnotes/trending/`);
        return response.data;
    },

    // Get single note
    getById: async (id) => {
        const response = await api.get(`${BASE_URL}/qnotes/${id}/`);
        return response.data;
    },

    // Create new note
    create: async (data) => {
        const response = await api.post(`${BASE_URL}/qnotes/`, data);
        return response.data;
    },

    // Delete note
    delete: async (id) => {
        const response = await api.delete(`${BASE_URL}/qnotes/${id}/`);
        return response.data;
    },

    // Like/unlike note
    toggleLike: async (id) => {
        const response = await api.post(`${BASE_URL}/qnotes/${id}/like/`);
        return response.data;
    },

    // Repost note
    toggleRepost: async (id) => {
        const response = await api.post(`${BASE_URL}/qnotes/${id}/repost/`);
        return response.data;
    },

    // Save/unsave note
    toggleSave: async (id) => {
        const response = await api.post(`${BASE_URL}/qnotes/${id}/save/`);
        return response.data;
    },

    // Get share info for note
    getShareInfo: async (id) => {
        const response = await api.post(`${BASE_URL}/qnotes/${id}/share/`);
        return response.data;
    },

    // Get comments for a note
    getComments: async (id) => {
        const response = await api.get(`${BASE_URL}/qnotes/${id}/comments/`);
        return response.data;
    },

    // Add comment to note
    addComment: async (id, content, parent = null) => {
        const response = await api.post(`${BASE_URL}/qnotes/${id}/comments/`, { content, parent });
        return response.data;
    },

    // Like/unlike a comment
    toggleCommentLike: async (noteId, commentId) => {
        const response = await api.post(`${BASE_URL}/qnotes/${noteId}/comments/${commentId}/like/`);
        return response.data;
    },
};

export default qnotesService;
