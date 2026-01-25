import api from './api';

/**
 * Messages Service - Uses the existing Rooms-based DM system
 * Endpoints: /api/rooms/dm_rooms/ and /api/rooms/direct_messages/
 */
const messagesService = {
    // Get all DM rooms (conversations) for current user
    getConversations: async () => {
        const response = await api.get('/api/rooms/dm_rooms/');
        return response.data;
    },

    // Alias for getConversations
    getAll: async () => {
        return messagesService.getConversations();
    },

    // Get or create a DM room with another user
    getOrCreateDMRoom: async (userId) => {
        const response = await api.post('/api/rooms/dm_rooms/get_or_create/', { user_id: userId });
        return response.data;
    },

    // Alias for starting a conversation
    startConversation: async (userId, message = '') => {
        const dmRoom = await messagesService.getOrCreateDMRoom(userId);

        // If initial message provided, send it
        if (message.trim()) {
            await messagesService.sendMessage(dmRoom.id, message, userId);
        }

        return { conversation: dmRoom, created: true };
    },

    // Get messages in a specific DM room
    getConversation: async (dmRoomId) => {
        const response = await api.get(`/api/rooms/dm_rooms/${dmRoomId}/messages/`);
        return {
            id: dmRoomId,
            messages: Array.isArray(response.data) ? response.data : (response.data?.results || [])
        };
    },

    // Send a direct message
    sendMessage: async (dmRoomId, content, receiverId = null) => {
        const response = await api.post('/api/rooms/direct_messages/', {
            dm_room: dmRoomId,
            content: content,
            receiver: receiverId,
            message_type: 'text'
        });
        return response.data;
    },

    // Send message with media/file
    sendMediaMessage: async (dmRoomId, file, caption = '', receiverId = null) => {
        const formData = new FormData();
        formData.append('dm_room', dmRoomId);
        formData.append('content', caption);
        formData.append('file', file);
        if (receiverId) {
            formData.append('receiver', receiverId);
        }
        formData.append('message_type', 'file');

        const response = await api.post('/api/rooms/direct_messages/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Mark all messages in a room as read
    markRead: async (dmRoomId) => {
        const response = await api.post(`/api/rooms/dm_rooms/${dmRoomId}/mark_all_read/`);
        return response.data;
    },

    // Alias for markRead
    markAllRead: async (dmRoomId) => {
        return messagesService.markRead(dmRoomId);
    },

    // Mark a single message as read
    markMessageRead: async (messageId) => {
        const response = await api.patch(`/api/rooms/direct_messages/${messageId}/`, {
            is_read: true,
            status: 'read'
        });
        return response.data;
    },

    // Search users to start a conversation
    searchUsers: async (query) => {
        const response = await api.get('/auth/users/search/', { params: { q: query } });
        return response.data;
    },

    // Get circles (mutual followers) - uses Follow model from Opinions
    getCircles: async () => {
        try {
            const response = await api.get('/api/opinions/follow/circles/');
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching circles:', error);
            return [];
        }
    },

    // Get message requests (not implemented in current backend - returns empty)
    getRequests: async () => {
        // The existing DM system doesn't have request concept
        // Return empty for now
        return [];
    },

    // Accept/Decline not needed for existing system - all DMs go through directly
    acceptRequest: async () => ({ status: 'accepted' }),
    declineRequest: async () => ({ status: 'declined' }),

    // Toggle mute/pin - not implemented in existing system
    toggleMute: async () => ({ is_muted: false }),
    togglePin: async () => ({ is_pinned: false }),
    archive: async () => ({ status: 'archived' }),

    // Get messaging settings - not implemented
    getSettings: async () => ({
        allow_messages_from: 'everyone',
        show_read_receipts: true,
        show_online_status: true
    }),

    updateSettings: async (settings) => settings
};

export default messagesService;
