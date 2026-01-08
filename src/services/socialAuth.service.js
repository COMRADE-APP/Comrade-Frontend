/**
 * Social Authentication Service
 * Handles OAuth login flows for Google, Facebook, GitHub, Apple, Twitter, LinkedIn, Microsoft
 */
import API_ENDPOINTS from '../constants/apiEndpoints';

const socialAuthService = {
    /**
     * Initiate Google OAuth login
     * Opens popup or redirects to Google login
     */
    loginWithGoogle: () => {
        window.location.href = API_ENDPOINTS.GOOGLE_LOGIN;
    },

    /**
     * Initiate Facebook OAuth login
     */
    loginWithFacebook: () => {
        window.location.href = API_ENDPOINTS.FACEBOOK_LOGIN;
    },

    /**
     * Initiate GitHub OAuth login
     */
    loginWithGitHub: () => {
        window.location.href = API_ENDPOINTS.GITHUB_LOGIN;
    },

    /**
     * Initiate Apple OAuth login
     */
    loginWithApple: () => {
        window.location.href = API_ENDPOINTS.APPLE_LOGIN;
    },

    /**
     * Initiate Twitter/X OAuth login
     */
    loginWithTwitter: () => {
        window.location.href = API_ENDPOINTS.TWITTER_LOGIN;
    },

    /**
     * Initiate LinkedIn OAuth login
     */
    loginWithLinkedIn: () => {
        window.location.href = API_ENDPOINTS.LINKEDIN_LOGIN;
    },

    /**
     * Initiate Microsoft OAuth login
     */
    loginWithMicrosoft: () => {
        window.location.href = API_ENDPOINTS.MICROSOFT_LOGIN;
    },

    /**
     * Handle OAuth callback
     * Extracts tokens from URL and stores them
     */
    handleCallback: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');

        if (error) {
            return { success: false, error };
        }

        if (accessToken && refreshToken) {
            // Store tokens
            const userData = {
                access_token: accessToken,
                refresh_token: refreshToken,
            };
            localStorage.setItem('user', JSON.stringify(userData));

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            return { success: true };
        }

        return { success: false, error: 'No tokens received' };
    },

    /**
     * Get all available social providers
     */
    getProviders: () => [
        {
            id: 'google',
            name: 'Google',
            icon: '🔵',
            color: '#4285F4',
            login: socialAuthService.loginWithGoogle
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: '📘',
            color: '#1877F2',
            login: socialAuthService.loginWithFacebook
        },
        {
            id: 'github',
            name: 'GitHub',
            icon: '⚫',
            color: '#24292e',
            login: socialAuthService.loginWithGitHub
        },
        {
            id: 'apple',
            name: 'Apple',
            icon: '🍎',
            color: '#000000',
            login: socialAuthService.loginWithApple
        },
        {
            id: 'twitter',
            name: 'X (Twitter)',
            icon: '🐦',
            color: '#1DA1F2',
            login: socialAuthService.loginWithTwitter
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: '💼',
            color: '#0A66C2',
            login: socialAuthService.loginWithLinkedIn
        },
        {
            id: 'microsoft',
            name: 'Microsoft',
            icon: '🪟',
            color: '#00A4EF',
            login: socialAuthService.loginWithMicrosoft
        },
    ],
};

export default socialAuthService;
