import api from './api';

const qomaiService = {
    /**
     * Send a message to QomAI
     * @param {string} message - The user's message
     * @param {Array} history - Previous conversation messages
     * @param {string} conversationId - Optional conversation ID
     * @param {string} model - Model to use
     * @param {Array} attachments - File attachments
     * @returns {Promise} - The AI response
     */
    async sendMessage(message, history = [], conversationId = null, model = 'qwen-7b', attachments = []) {
        // Format history for the API
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // If there are attachments, use FormData
        if (attachments.length > 0) {
            const formData = new FormData();
            formData.append('message', message);
            formData.append('history', JSON.stringify(formattedHistory));
            formData.append('model', model);
            if (conversationId) {
                formData.append('conversation_id', conversationId);
            }
            attachments.forEach((att, index) => {
                formData.append(`file_${index}`, att.file);
            });

            const response = await api.post('/api/qomai/chat/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        }

        const response = await api.post('/api/qomai/chat/', {
            message,
            history: formattedHistory,
            conversation_id: conversationId,
            model
        });

        return response.data;
    },

    /**
     * Get all conversations for the current user
     * @returns {Promise} - Array of conversations
     */
    async getConversations() {
        const response = await api.get('/api/qomai/conversations/');
        return response.data.results || response.data || [];
    },

    /**
     * Get chat history for the current user (legacy)
     * @returns {Promise} - Array of previous conversations
     */
    async getChatHistory() {
        const response = await api.get('/api/qomai/history/');
        return response.data.results || response.data;
    },

    /**
     * Get a specific conversation with messages
     * @param {string} conversationId - The conversation ID
     */
    async getConversation(conversationId) {
        const response = await api.get(`/api/qomai/conversations/${conversationId}/`);
        return response.data;
    },

    /**
     * Create a new conversation
     * @param {string} title - Optional title for the conversation
     */
    async createConversation(title = null) {
        const response = await api.post('/api/qomai/conversations/', {
            title: title || `Chat ${new Date().toLocaleDateString()}`
        });
        return response.data;
    },

    /**
     * Update conversation title
     * @param {string} conversationId - The conversation ID
     * @param {string} title - New title
     */
    async updateConversation(conversationId, title) {
        const response = await api.patch(`/api/qomai/conversations/${conversationId}/`, { title });
        return response.data;
    },

    /**
     * Delete a conversation
     * @param {string} conversationId - The conversation ID
     */
    async deleteConversation(conversationId) {
        await api.delete(`/api/qomai/conversations/${conversationId}/`);
    },

    /**
     * Update user's model preference
     * @param {string} model - The preferred model ID
     */
    async setPreferredModel(model) {
        const response = await api.post('/api/qomai/preferences/', { preferred_model: model });
        return response.data;
    },

    /**
     * Get user's preferences
     */
    async getPreferences() {
        try {
            const response = await api.get('/api/qomai/preferences/');
            return response.data;
        } catch {
            return { preferred_model: 'qwen-7b' };
        }
    },

    /**
     * Analyze content for fake news (uses ML model)
     * @param {string} content - The content to analyze
     */
    async analyzeFakeNews(content) {
        const response = await api.post('/api/qomai/analyze/fake-news/', { content });
        return response.data;
    },

    /**
     * Get personalized recommendations
     * @param {string} type - Type of recommendations (opinions, articles, events, etc.)
     */
    async getRecommendations(type = 'all') {
        const response = await api.get('/api/qomai/recommendations/', {
            params: { type }
        });
        return response.data.results || response.data;
    },

    /**
     * Generate learning path suggestions
     * @param {Object} preferences - User preferences for learning
     */
    async generateLearningPath(preferences) {
        const response = await api.post('/api/qomai/generate/learning-path/', preferences);
        return response.data;
    },

    /**
     * Generate test questions for a topic
     * @param {string} topic - The topic to generate questions for
     * @param {number} count - Number of questions
     * @param {string} difficulty - easy, medium, hard
     */
    async generateTestQuestions(topic, count = 10, difficulty = 'medium') {
        const response = await api.post('/api/qomai/generate/test/', {
            topic,
            count,
            difficulty
        });
        return response.data;
    }
};

export default qomaiService;
