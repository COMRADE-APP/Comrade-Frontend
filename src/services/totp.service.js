/**
 * TOTP 2FA Service
 * Handles two-factor authentication setup, verification, and management
 */
import api from './api';

const TOTP_BASE_URL = '/api/auth/totp';

export const totpService = {
    /**
     * Generate TOTP secret and QR code for setup
     * @returns {Promise<{secret: string, qr_code: string, provisioning_uri: string}>}
     */
    async setupTOTP() {
        const response = await api.post(`${TOTP_BASE_URL}/setup/`);
        return response.data;
    },

    /**
     * Verify TOTP code during initial setup
     * @param {string} code - 6-digit TOTP code
     * @returns {Promise<{message: string, backup_codes: string[]}>}
     */
    async verifySetup(code) {
        const response = await api.post(`${TOTP_BASE_URL}/verify-setup/`, { code });
        return response.data;
    },

    /**
     * Verify TOTP code during login
     * @param {string} code - 6-digit TOTP code or backup code
     * @returns {Promise<{message: string, verified: boolean}>}
     */
    async verifyLogin(code) {
        const response = await api.post(`${TOTP_BASE_URL}/verify-login/`, { code });
        return response.data;
    },

    /**
     * Disable TOTP for account
     * @param {string} password - User's password for confirmation
     * @returns {Promise<{message: string}>}
     */
    async disableTOTP(password) {
        const response = await api.post(`${TOTP_BASE_URL}/disable/`, { password });
        return response.data;
    },

    /**
     * Regenerate backup codes
     * @param {string} password - User's password for confirmation
     * @returns {Promise<{message: string, backup_codes: string[]}>}
     */
    async regenerateBackupCodes(password) {
        const response = await api.post(`${TOTP_BASE_URL}/backup-codes/`, { password });
        return response.data;
    },
};

export default totpService;
