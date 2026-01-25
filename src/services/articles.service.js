import apiClient from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Articles Service
 * Handles all article-related API operations including CRUD, drafts, and publishing
 */
const articlesService = {
    /**
     * Get all articles (published)
     */
    getAll: async (params = {}) => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, { params });
        return response.data;
    },

    /**
     * Get a single article by ID
     */
    getById: async (id) => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.DETAIL(id));
        return response.data;
    },

    /**
     * Create a new article (draft or published)
     */
    create: async (data) => {
        const formData = new FormData();

        // Add text fields
        if (data.title) formData.append('title', data.title);
        if (data.content) formData.append('content', data.content);
        if (data.excerpt) formData.append('excerpt', data.excerpt);
        if (data.category) formData.append('category', data.category);
        if (data.tags) formData.append('tags', JSON.stringify(data.tags));
        formData.append('status', data.status || 'draft');

        // Add cover image if present
        if (data.cover_image && data.cover_image instanceof File) {
            formData.append('cover_image', data.cover_image);
        }

        // Add file attachments if present
        if (data.attachments && Array.isArray(data.attachments)) {
            data.attachments.forEach((file, index) => {
                if (file instanceof File) {
                    formData.append(`attachments`, file);
                }
            });
        }

        const response = await apiClient.post(API_ENDPOINTS.ARTICLES.LIST, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Update an existing article
     */
    update: async (id, data) => {
        const formData = new FormData();

        // Add text fields
        if (data.title) formData.append('title', data.title);
        if (data.content) formData.append('content', data.content);
        if (data.excerpt) formData.append('excerpt', data.excerpt);
        if (data.category) formData.append('category', data.category);
        if (data.tags) formData.append('tags', JSON.stringify(data.tags));
        if (data.status) formData.append('status', data.status);

        // Add cover image if present (new upload)
        if (data.cover_image && data.cover_image instanceof File) {
            formData.append('cover_image', data.cover_image);
        }

        const response = await apiClient.patch(API_ENDPOINTS.ARTICLES.DETAIL(id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Delete an article
     */
    delete: async (id) => {
        await apiClient.delete(API_ENDPOINTS.ARTICLES.DETAIL(id));
    },

    /**
     * Save as draft
     */
    saveDraft: async (data) => {
        return articlesService.create({ ...data, status: 'draft' });
    },

    /**
     * Publish an article
     */
    publish: async (data) => {
        return articlesService.create({ ...data, status: 'published' });
    },

    /**
     * Update draft
     */
    updateDraft: async (id, data) => {
        return articlesService.update(id, { ...data, status: 'draft' });
    },

    /**
     * Publish an existing draft
     */
    publishDraft: async (id) => {
        return articlesService.update(id, { status: 'published' });
    },

    /**
     * Get user's drafts
     */
    getMyDrafts: async () => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, {
            params: { status: 'draft', mine: true }
        });
        return response.data;
    },

    /**
     * Get user's published articles
     */
    getMyArticles: async () => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, {
            params: { mine: true }
        });
        return response.data;
    },

    /**
     * Like/Unlike an article
     */
    toggleLike: async (id) => {
        const response = await apiClient.post(`${API_ENDPOINTS.ARTICLES.DETAIL(id)}like/`);
        return response.data;
    },

    /**
     * Bookmark/Unbookmark an article
     */
    toggleBookmark: async (id) => {
        const response = await apiClient.post(`${API_ENDPOINTS.ARTICLES.DETAIL(id)}bookmark/`);
        return response.data;
    },

    /**
     * Get article comments
     */
    getComments: async (id) => {
        const response = await apiClient.get(`${API_ENDPOINTS.ARTICLES.DETAIL(id)}comments/`);
        return response.data;
    },

    /**
     * Add a comment to an article
     */
    addComment: async (id, content) => {
        const response = await apiClient.post(`${API_ENDPOINTS.ARTICLES.DETAIL(id)}comments/`, { content });
        return response.data;
    },

    /**
     * Get articles by category
     */
    getByCategory: async (category) => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, {
            params: { category }
        });
        return response.data;
    },

    /**
     * Search articles
     */
    search: async (query) => {
        const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, {
            params: { search: query }
        });
        return response.data;
    },
};

export default articlesService;
