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
    login: async (email, password, otp_method = 'email') => {
        const response = await api.post(API_ENDPOINTS.LOGIN, { email, password, otp_method });
        return response.data;
    },

    verifyLoginOTP: async (email, otp) => {
        const response = await api.post(API_ENDPOINTS.LOGIN_VERIFY, { email, otp });
        if (response.data.access_token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    verify2FA: async (email, otp) => {
        const response = await api.post(API_ENDPOINTS.VERIFY_2FA, { email, otp });
        if (response.data.access_token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    verifySMSOTP: async (email, otp) => {
        const response = await api.post(API_ENDPOINTS.VERIFY_SMS_OTP, { email, otp });
        if (response.data.access_token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    resendOTP: async (email, otp_method = 'email', action_type = 'login') => {
        const response = await api.post(API_ENDPOINTS.RESEND_OTP, { email, otp_method, action_type });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post(API_ENDPOINTS.REGISTER, userData);
        return response.data;
    },

    verifyRegistrationOTP: async (email, otp) => {
        const response = await api.post(API_ENDPOINTS.REGISTER_VERIFY, { email, otp });
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
            // Check if token exists
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

    // 2FA Setup
    setup2FA: async () => {
        const response = await api.post(API_ENDPOINTS.SETUP_2FA);
        return response.data;
    },

    confirm2FASetup: async (otp) => {
        const response = await api.post(API_ENDPOINTS.CONFIRM_2FA_SETUP, { otp });
        return response.data;
    },

    // Change Password
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword
        });
        return response.data;
    },

    // Role Change Request
    requestRoleChange: async (requestData) => {
        const response = await api.post(API_ENDPOINTS.ROLE_CHANGE_REQUEST, requestData);
        return response.data;
    },

    // Get Role Change Requests (for admins)
    getRoleChangeRequests: async () => {
        const response = await api.get(API_ENDPOINTS.ROLE_CHANGE_REQUESTS);
        return response.data;
    },

    // Approve/Reject Role Change Request (for admins)
    updateRoleChangeRequest: async (requestId, status, adminNotes = '') => {
        const response = await api.patch(`${API_ENDPOINTS.ROLE_CHANGE_REQUESTS}${requestId}/`, {
            status,
            admin_notes: adminNotes
        });
        return response.data;
    }
};

export default authService;
