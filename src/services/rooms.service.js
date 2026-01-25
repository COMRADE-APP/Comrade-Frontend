import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const roomsService = {
    // Get all available rooms
    async getAll(search = '', institution = null) {
        let url = API_ENDPOINTS.ROOMS;
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (institution) params.append('institution', institution);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    },

    // Get rooms user is a member of
    async getMyRooms() {
        const response = await api.get(API_ENDPOINTS.ROOMS_MY);
        return response.data;
    },

    // Get recommended rooms
    async getRecommendations() {
        const response = await api.get(API_ENDPOINTS.ROOMS_RECOMMENDATIONS);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.ROOM_DETAIL(id));
        return response.data;
    },

    async create(roomData) {
        const response = await api.post(API_ENDPOINTS.ROOMS, roomData);
        return response.data;
    },

    async update(id, roomData) {
        const response = await api.put(API_ENDPOINTS.ROOM_DETAIL(id), roomData);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(API_ENDPOINTS.ROOM_DETAIL(id));
        return response.data;
    },

    async getMessages(id) {
        const response = await api.get(API_ENDPOINTS.ROOM_MESSAGES(id));
        return response.data;
    },

    async joinRoom(id) {
        const response = await api.post(API_ENDPOINTS.ROOM_JOIN(id));
        return response.data;
    },

    async leaveRoom(id) {
        const response = await api.post(API_ENDPOINTS.ROOM_LEAVE(id));
        return response.data;
    },

    // Get room members
    async getMembers(id) {
        const response = await api.get(API_ENDPOINTS.ROOM_MEMBERS(id));
        return response.data;
    },

    // Room admin actions
    async makeModerator(roomId, userId) {
        const response = await api.post(API_ENDPOINTS.ROOM_MAKE_MODERATOR(roomId), { user_id: userId });
        return response.data;
    },

    async removeModerator(roomId, userId) {
        const response = await api.post(API_ENDPOINTS.ROOM_REMOVE_MODERATOR(roomId), { user_id: userId });
        return response.data;
    },

    // ==================== CHAT METHODS ====================

    // Get room chats with optional filters
    async getChats(roomId, filters = {}) {
        let url = API_ENDPOINTS.ROOM_CHATS(roomId);
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (params.toString()) url += `?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    },

    // Send a chat message
    async sendChat(roomId, data) {
        const formData = new FormData();
        formData.append('content', data.content || '');
        formData.append('message_type', data.message_type || 'text');

        if (data.reply_to) formData.append('reply_to', data.reply_to);
        if (data.event) formData.append('event', data.event);
        if (data.task) formData.append('task', data.task);
        if (data.resource) formData.append('resource', data.resource);
        if (data.announcement) formData.append('announcement', data.announcement);

        // Handle multiple files
        if (data.files && data.files.length > 0) {
            data.files.forEach(file => formData.append('files', file));
        }

        const response = await api.post(API_ENDPOINTS.ROOM_CHATS(roomId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Forward a chat message to another room
    async forwardChat(roomId, chatId, targetRoomId) {
        const response = await api.post(
            API_ENDPOINTS.ROOM_CHAT_FORWARD(roomId, chatId),
            { target_room: targetRoomId }
        );
        return response.data;
    },

    // Mark a chat message as read
    async markChatRead(roomId, chatId) {
        const response = await api.post(API_ENDPOINTS.ROOM_CHAT_READ(roomId, chatId));
        return response.data;
    },

    // Delete a chat message
    async deleteChat(roomId, chatId) {
        const response = await api.delete(API_ENDPOINTS.ROOM_CHAT_DELETE(roomId, chatId));
        return response.data;
    },

    // ==================== SETTINGS METHODS ====================

    // Get room settings
    async getSettings(roomId) {
        const response = await api.get(API_ENDPOINTS.ROOM_SETTINGS(roomId));
        return response.data;
    },

    // Update room settings
    async updateSettings(roomId, settings) {
        const response = await api.patch(API_ENDPOINTS.ROOM_SETTINGS(roomId), settings);
        return response.data;
    },

    // ==================== MEMBER DETAIL METHODS ====================

    // Get detailed member list with roles and follow status
    async getMembersDetail(roomId) {
        const response = await api.get(API_ENDPOINTS.ROOM_MEMBERS_DETAIL(roomId));
        return response.data;
    },

    // Follow/unfollow a room member
    async followMember(roomId, userId) {
        const response = await api.post(API_ENDPOINTS.ROOM_MEMBER_FOLLOW(roomId, userId));
        return response.data;
    },
};

export default roomsService;
