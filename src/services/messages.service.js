import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const messagesService = {
    // Get all DM rooms (conversations) for current user
    async getAll() {
        const response = await api.get(API_ENDPOINTS.DM_ROOMS);
        return response.data;
    },

    // Get or create a DM room with another user
    async getOrCreateDMRoom(userId) {
        const response = await api.post(API_ENDPOINTS.DM_ROOM_GET_OR_CREATE, { user_id: userId });
        return response.data;
    },

    // Get messages in a specific DM room
    async getConversation(dmRoomId) {
        const response = await api.get(API_ENDPOINTS.DM_ROOM_MESSAGES(dmRoomId));
        return response.data;
    },

    // Send a direct message
    async sendDirectMessage(receiverId, content, file = null, dmRoomId = null) {
        const formData = new FormData();
        formData.append('receiver', receiverId);
        formData.append('content', content);
        if (file) {
            formData.append('file', file);
        }
        if (dmRoomId) {
            formData.append('dm_room', dmRoomId);
        }

        const response = await api.post(API_ENDPOINTS.DM_MESSAGE_SEND, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Mark all messages in a room as read
    async markAllRead(dmRoomId) {
        const response = await api.post(API_ENDPOINTS.DM_ROOM_MARK_READ(dmRoomId));
        return response.data;
    },

    // Mark a single message as read
    async markMessageRead(messageId) {
        const response = await api.post(API_ENDPOINTS.DM_MESSAGE_MARK_READ(messageId));
        return response.data;
    },

    // Search users to start a conversation
    async searchUsers(query) {
        const response = await api.get(`${API_ENDPOINTS.USER_SEARCH}?q=${query}`);
        return response.data;
    },
};

export default messagesService;
