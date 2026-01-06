import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const roomsService = {
    async getAll() {
        const response = await api.get(API_ENDPOINTS.ROOMS);
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
};

export default roomsService;
