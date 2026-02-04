import api from './api';

const qomaiService = {
    /**
     * Send a message to QomAI
     * @param {string} message - The user's message
     * @param {Array} history - Previous conversation messages
     * @param {string} conversationId - Optional conversation ID
     * @param {string} model - Model to use
     * @param {Array} attachments - File attachments
     * @param {string} mode - 'chat', 'reasoning', or 'research'
     * @param {boolean} enableSearch - Enable/Disable web search
     * @returns {Promise} - The AI response
     */
    async sendMessage(message, history = [], conversationId = null, model = 'qwen-7b', attachments = [], mode = 'chat', enableSearch = true) {
        // Format history for the API
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Use FormData for all requests to ensure consistent handling
        const formData = new FormData();
        formData.append('message', message);
        formData.append('history', JSON.stringify(formattedHistory));
        formData.append('model', model);
        formData.append('mode', mode);
        formData.append('enable_search', enableSearch);

        if (conversationId) {
            formData.append('conversation_id', conversationId);
        }

        if (attachments && attachments.length > 0) {
            attachments.forEach((att, index) => {
                formData.append(`file_${index}`, att.file);
            });
        }

        const response = await api.post('/api/qomai/chat/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
    },

    /**
     * Generate an image from a prompt
     * @param {string} prompt - Image description
     */
    async generateImage(prompt) {
        const response = await api.post('/api/qomai/generate/image/', { prompt }, {
            responseType: 'blob' // Important for image data
        });
        return URL.createObjectURL(response.data);
    },

    /**
     * Transcribe audio file
     * @param {File} audioFile - Audio blob/file
     */
    async transcribeAudio(audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await api.post('/api/qomai/transcribe/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.text;
    },

    /**
     * Get all conversation list
     */
    async getConversations() {
        const response = await api.get('/api/qomai/conversations/');
        return response.data.results || response.data || [];
    },

    /**
     * Get specific conversation
     */
    async getConversation(conversationId) {
        const response = await api.get(`/api/qomai/conversations/${conversationId}/`);
        return response.data;
    },

    /**
     * Create conversation
     */
    async createConversation(title = null) {
        const response = await api.post('/api/qomai/conversations/', {
            title: title || `Chat ${new Date().toLocaleDateString()}`
        });
        return response.data;
    },

    /**
     * Delete conversation
     */
    async deleteConversation(conversationId) {
        await api.delete(`/api/qomai/conversations/${conversationId}/`);
    },

    /**
     * Update user preferences
     */
    async setPreferredModel(model) {
        const response = await api.post('/api/qomai/preferences/', { preferred_model: model });
        return response.data;
    },

    async getPreferences() {
        try {
            const response = await api.get('/api/qomai/preferences/');
            return response.data;
        } catch {
            return { preferred_model: 'qwen-7b' }; // Default fallback
        }
    },

    // Legacy/Unused Analysis methods kept for compatibility if needed
    async analyzeFakeNews(content) {
        const response = await api.post('/api/qomai/analyze/fake-news/', { content });
        return response.data;
    },
    async getRecommendations(type = 'all') {
        const response = await api.get('/api/qomai/recommendations/', { params: { type } });
        return response.data.results || response.data;
    }
};

export default qomaiService;
