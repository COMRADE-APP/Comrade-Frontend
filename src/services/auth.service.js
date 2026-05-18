import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const authService = {
    heartbeat: async () => {
        try {
            await api.post(API_ENDPOINTS.HEARTBEAT);
        } catch {
            // Heartbeat failures should be silent
        }
    },

    login: async (email, password, otp_method = 'email') => {
        const response = await api.post(API_ENDPOINTS.LOGIN, { email, password, otp_method });
        return response.data;
    },

    verifyLoginOTP: async (email, otp, remember_me = false) => {
        const response = await api.post(API_ENDPOINTS.LOGIN_VERIFY, { email, otp, remember_me });
        return response.data;
    },

    verify2FA: async (email, otp, remember_me = false) => {
        const response = await api.post(API_ENDPOINTS.VERIFY_2FA, { email, otp, remember_me });
        return response.data;
    },

    verifySMSOTP: async (email, otp, remember_me = false) => {
        const response = await api.post(API_ENDPOINTS.VERIFY_SMS_OTP, { email, otp, remember_me });
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
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        const refreshToken = rememberMe
            ? localStorage.getItem('refresh_token')
            : sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                await api.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken });
            } catch {
                // Logout failure is non-blocking
            }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
    },

    logoutAllDevices: async () => {
        const response = await api.post(API_ENDPOINTS.LOGOUT_ALL);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        return response.data;
    },

    getCurrentUser: async () => {
        try {
            const rememberMe = localStorage.getItem('remember_me') === 'true';
            const stored = rememberMe
                ? JSON.parse(localStorage.getItem('user'))
                : JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));
            if (!stored?.access_token) return null;

            const response = await api.get('/auth/me/');
            const freshData = response.data;

            const merged = { ...stored, ...freshData };
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(merged));
            } else {
                sessionStorage.setItem('user', JSON.stringify(merged));
            }
            return merged;
        } catch {
            try {
                return JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
            } catch {
                return null;
            }
        }
    },

    getStoredUser: () => {
        try {
            return JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        } catch {
            return null;
        }
    },

    isAuthenticated: () => {
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        const token = rememberMe
            ? localStorage.getItem('access_token')
            : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        return !!token;
    },

    requestPasswordReset: async (email) => {
        const response = await api.post(API_ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
        return response.data;
    },

    confirmPasswordReset: async (email, otp, password) => {
        const response = await api.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, { email, otp, password });
        return response.data;
    },

    setup2FA: async () => {
        const response = await api.post(API_ENDPOINTS.SETUP_2FA);
        return response.data;
    },

    confirm2FASetup: async (otp) => {
        const response = await api.post(API_ENDPOINTS.CONFIRM_2FA_SETUP, { otp });
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword
        });
        return response.data;
    },

    requestRoleChange: async (requestData) => {
        const response = await api.post(API_ENDPOINTS.ROLE_CHANGE_REQUEST, requestData);
        return response.data;
    },

    getRoleChangeRequests: async () => {
        const response = await api.get(API_ENDPOINTS.ROLE_CHANGE_REQUESTS);
        return response.data;
    },

    updateRoleChangeRequest: async (requestId, status, adminNotes = '') => {
        const response = await api.patch(`${API_ENDPOINTS.ROLE_CHANGE_REQUESTS}${requestId}/`, {
            status,
            admin_notes: adminNotes
        });
        return response.data;
    },

    setupProfile: async (profileData) => {
        const formData = new FormData();

        if (profileData.bio) formData.append('bio', profileData.bio);
        if (profileData.location) formData.append('location', profileData.location);
        if (profileData.occupation) formData.append('occupation', profileData.occupation);
        if (profileData.company) formData.append('company', profileData.company);
        if (profileData.website) formData.append('website', profileData.website);

        if (profileData.interests && profileData.interests.length > 0) {
            formData.append('interests', profileData.interests.join(','));
        }

        if (profileData.avatar) {
            formData.append('avatar', profileData.avatar);
        }

        const response = await api.post(API_ENDPOINTS.PROFILE_SETUP, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get(API_ENDPOINTS.PROFILE);
        return response.data;
    },

    updateProfile: async (profileData) => {
        const formData = new FormData();
        Object.entries(profileData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'interests' && Array.isArray(value)) {
                    formData.append(key, value.join(','));
                } else {
                    formData.append(key, value);
                }
            }
        });

        const response = await api.patch(API_ENDPOINTS.PROFILE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default authService;
