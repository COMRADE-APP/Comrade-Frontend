import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Send httpOnly cookies with every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get token from the correct storage
const getToken = (key) => {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
        return localStorage.getItem(key);
    }
    // Check sessionStorage first, fall back to localStorage (for backward compat)
    return sessionStorage.getItem(key) || localStorage.getItem(key);
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getToken('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Let axios auto-set Content-Type for FormData (multipart/form-data with boundary)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getToken('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                // Store in the correct storage
                const rememberMe = localStorage.getItem('remember_me') === 'true';
                if (rememberMe) {
                    localStorage.setItem('access_token', access);
                } else {
                    sessionStorage.setItem('access_token', access);
                }

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                localStorage.removeItem('remember_me');
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const decoded = jwtDecode(token);
        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

export default api;
