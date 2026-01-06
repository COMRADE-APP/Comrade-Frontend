import api from './api';

const chatService = {
    // Get messages from a room
    getMessages: async (roomId) => {
        const response = await api.get('/api/chat/messages/', {
            params: { room_id: roomId }
        });
        return response.data;
    },

    // Send a message
    sendMessage: async (roomId, content, messageType = 'text', parentMessageId = null) => {
        const response = await api.post('/api/chat/messages/', {
            room: roomId,
            content: content,
            message_type: messageType,
            parent_message: parentMessageId,
        });
        return response.data;
    },

    // Add reaction to message
    addReaction: async (messageId, emoji) => {
        const response = await api.post(`/api/chat/messages/${messageId}/react/`, {
            emoji: emoji
        });
        return response.data;
    },

    // Remove reaction from message
    removeReaction: async (messageId, emoji) => {
        const response = await api.delete(`/api/chat/messages/${messageId}/unreact/`, {
            data: { emoji: emoji }
        });
        return response.data;
    },

    // Mark message as read
    markAsRead: async (messageId) => {
        const response = await api.post(`/api/chat/messages/${messageId}/mark_read/`);
        return response.data;
    },

    // Get users typing in room
    getTypingIndicators: async (roomId) => {
        const response = await api.get('/api/chat/typing/', {
            params: { room_id: roomId }
        });
        return response.data;
    },

    // Start typing indicator
    startTyping: async (roomId) => {
        const response = await api.post('/api/chat/typing/start_typing/', {
            room_id: roomId
        });
        return response.data;
    },

    // Stop typing indicator
    stopTyping: async (roomId) => {
        const response = await api.post('/api/chat/typing/stop_typing/', {
            room_id: roomId
        });
        return response.data;
    },
};

export default chatService;
