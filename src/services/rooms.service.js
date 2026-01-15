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
};

export default roomsService;
