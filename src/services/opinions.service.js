import api from './api';

const BASE_URL = '/api/opinions';

const opinionsService = {
    // Get all opinions (public feed)
    getAll: async (params = {}) => {
        const response = await api.get(`${BASE_URL}/opinions/`, { params });
        return response.data;
    },

    // Get personalized feed (following)
    getFeed: async () => {
        const response = await api.get(`${BASE_URL}/opinions/feed/`);
        return response.data;
    },

    // Get trending opinions
    getTrending: async () => {
        const response = await api.get(`${BASE_URL}/opinions/trending/`);
        return response.data;
    },

    // Get single opinion
    getById: async (id) => {
        const response = await api.get(`${BASE_URL}/opinions/${id}/`);
        return response.data;
    },

    // Create new opinion
    create: async (data) => {
        const response = await api.post(`${BASE_URL}/opinions/`, data);
        return response.data;
    },

    // Update opinion
    update: async (id, data) => {
        const response = await api.patch(`${BASE_URL}/opinions/${id}/`, data);
        return response.data;
    },

    // Delete opinion
    delete: async (id) => {
        const response = await api.delete(`${BASE_URL}/opinions/${id}/`);
        return response.data;
    },

    // Like/unlike opinion
    toggleLike: async (id) => {
        const response = await api.post(`${BASE_URL}/opinions/${id}/like/`);
        return response.data;
    },

    // Repost opinion
    toggleRepost: async (id, comment = '') => {
        const response = await api.post(`${BASE_URL}/opinions/${id}/repost/`, { comment });
        console.log("repost--------------------------->", response.data);
        return response.data;
    },

    // Bookmark opinion
    toggleBookmark: async (id) => {
        const response = await api.post(`${BASE_URL}/opinions/${id}/bookmark/`);
        return response.data;
    },

    // Get comments for an opinion
    getComments: async (id) => {
        const response = await api.get(`${BASE_URL}/opinions/${id}/comments/`);
        return response.data;
    },

    // Add comment to opinion (supports text, image, video, file)
    addComment: async (id, content, media = null, parentCommentId = null) => {
        const formData = new FormData();
        formData.append('content', content);
        if (parentCommentId) {
            formData.append('parent_comment', parentCommentId);
        }
        if (media) {
            formData.append('file', media);
        }
        const response = await api.post(`${BASE_URL}/opinions/${id}/comments/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Get user's opinions
    getUserOpinions: async (userId) => {
        const response = await api.get(`${BASE_URL}/opinions/`, { params: { user_id: userId } });
        return response.data;
    },

    // Get bookmarks
    getBookmarks: async () => {
        const response = await api.get(`${BASE_URL}/bookmarks/`);
        return response.data;
    },

    // Follow/unfollow user
    toggleFollow: async (userId) => {
        const response = await api.post(`${BASE_URL}/follow/toggle/`, { user_id: userId });
        return response.data;
    },

    // Get followers
    getFollowers: async (userId = null) => {
        const params = userId ? { user_id: userId } : {};
        const response = await api.get(`${BASE_URL}/follow/followers/`, { params });
        return response.data;
    },

    // Get following
    getFollowing: async (userId = null) => {
        const params = userId ? { user_id: userId } : {};
        const response = await api.get(`${BASE_URL}/follow/following/`, { params });
        return response.data;
    },

    // Get suggestions
    getSuggestions: async () => {
        const response = await api.get(`${BASE_URL}/follow/suggestions/`);
        return response.data;
    },

    // Alias for Profile page
    getFollowSuggestions: async () => {
        const response = await api.get(`${BASE_URL}/follow/suggestions/`);
        return response.data;
    },
};

export default opinionsService;
