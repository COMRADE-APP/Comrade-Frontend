import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const userService = {
    async getProfile() {
        const response = await api.get(API_ENDPOINTS.USER_PROFILE);
        return response.data;
    },

    async updateProfile(profileData) {
        const response = await api.put(API_ENDPOINTS.USER_UPDATE, profileData);
        return response.data;
    },

    async uploadProfilePicture(file) {
        const formData = new FormData();
        formData.append('profile_picture', file);
        const response = await api.post(`${API_ENDPOINTS.USER_PROFILE}upload-picture/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async uploadCoverPhoto(file) {
        const formData = new FormData();
        formData.append('cover_photo', file);
        const response = await api.post(`${API_ENDPOINTS.USER_PROFILE}upload-cover/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default userService;
