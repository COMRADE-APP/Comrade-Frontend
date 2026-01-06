import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const messagesService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.MESSAGES);
        return response.data;
    },

    async send(messageData) {
        const response = await api.post(API_ENDPOINTS.MESSAGE_SEND, messageData);
        return response.data;
    },

    async getConversation(userId) {
        const response = await api.get(API_ENDPOINTS.CONVERSATION(userId));
        return response.data;
    },

    async sendDirectMessage(receiverId, content, file = null) {
        const formData = new FormData();
        formData.append('receiver', receiverId);
        formData.append('content', content);
        if (file) {
            formData.append('file', file);
        }

        const response = await api.post(API_ENDPOINTS.MESSAGE_SEND, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default messagesService;
