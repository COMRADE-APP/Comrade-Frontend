import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const storiesService = {
    getAll: async () => {
        const response = await api.get(API_ENDPOINTS.STORIES);
        return response.data;
    },

    getMyStories: async () => {
        const response = await api.get(API_ENDPOINTS.MY_STORIES);
        return response.data;
    },

    create: async (data) => {
        // data should be FormData for multipart upload
        const response = await api.post(API_ENDPOINTS.STORIES, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    view: async (id) => {
        const response = await api.post(API_ENDPOINTS.STORY_VIEW(id));
        return response.data;
    },

    getViewers: async (id) => {
        const response = await api.get(API_ENDPOINTS.STORY_VIEWERS(id));
        return response.data;
    }
};

export default storiesService;
