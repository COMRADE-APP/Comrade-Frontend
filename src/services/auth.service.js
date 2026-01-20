import axios from 'axios';
import API_ENDPOINTS from '../constants/apiEndpoints';

// Create independent axios instance to avoid circular dependency
const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token interceptor
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
});

const authService = {
    login: async (email, password) => {
        const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });
        return response.data;
    },

    verifyLoginOTP: async (email, otp) => {
        const response = await api.post(API_ENDPOINTS.LOGIN_VERIFY, { email, otp });
        if (response.data.access_token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    resendOTP: async (email) => {
        const response = await api.post(API_ENDPOINTS.RESEND_OTP, { email });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post(API_ENDPOINTS.REGISTER, userData);
        return response.data;
    },

    logout: async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.refresh_token) {
            try {
                await api.post(API_ENDPOINTS.LOGOUT, { refresh: user.refresh_token });
            } catch (error) {
                console.error("Logout failed on server", error);
            }
        }
        localStorage.removeItem('user');
    },

    getCurrentUser: async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return null;
            return user;
        } catch (error) {
            return null;
        }
    },

    getStoredUser: () => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (error) {
            return null;
        }
    },

    isAuthenticated: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return !!user?.access_token;
    },

    // Password Reset
    requestPasswordReset: async (email) => {
        const response = await api.post(API_ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
        return response.data;
    },

    confirmPasswordReset: async (email, otp, password) => {
        const response = await api.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, { email, otp, password });
        return response.data;
    },
};

export default authService;
