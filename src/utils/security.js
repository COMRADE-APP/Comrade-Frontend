// Security utility functions

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validate file uploads
 */
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    } = options;

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} not allowed`,
        };
    }

    return { valid: true };
};

/**
 * Check password strength
 */
export const checkPasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = {
        score: 0,
        feedback: [],
    };

    if (password.length >= minLength) strength.score++;
    else strength.feedback.push('Use at least 8 characters');

    if (hasUpperCase) strength.score++;
    else strength.feedback.push('Add uppercase letters');

    if (hasLowerCase) strength.score++;
    else strength.feedback.push('Add lowercase letters');

    if (hasNumbers) strength.score++;
    else strength.feedback.push('Add numbers');

    if (hasSpecialChar) strength.score++;
    else strength.feedback.push('Add special characters');

    // Determine strength level
    if (strength.score < 2) strength.level = 'weak';
    else if (strength.score < 4) strength.level = 'medium';
    else strength.level = 'strong';

    return strength;
};

/**
 * Detect potential SQL injection patterns (basic check)
 */
export const detectSQLInjection = (input) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(--|;|\/\*|\*\/)/g,
        /(\bOR\b.*=.*)/gi,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }

    checkLimit(key) {
        const now = Date.now();
        const userAttempts = this.attempts.get(key) || [];

        // Remove old attempts outside the time window
        const validAttempts = userAttempts.filter(
            (timestamp) => now - timestamp < this.windowMs
        );

        if (validAttempts.length >= this.maxAttempts) {
            return {
                allowed: false,
                retryAfter: this.windowMs - (now - validAttempts[0]),
            };
        }

        validAttempts.push(now);
        this.attempts.set(key, validAttempts);

        return { allowed: true };
    }

    reset(key) {
        this.attempts.delete(key);
    }
}

/**
 * Generate CSRF token (simple client-side version)
 */
export const generateCSRFToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Secure session storage
 */
export const secureStorage = {
    set: (key, value, encrypt = false) => {
        try {
            const data = encrypt ? btoa(JSON.stringify(value)) : JSON.stringify(value);
            sessionStorage.setItem(key, data);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    get: (key, decrypt = false) => {
        try {
            const data = sessionStorage.getItem(key);
            if (!data) return null;
            return decrypt ? JSON.parse(atob(data)) : JSON.parse(data);
        } catch (error) {
            console.error('Retrieval error:', error);
            return null;
        }
    },

    remove: (key) => {
        sessionStorage.removeItem(key);
    },

    clear: () => {
        sessionStorage.clear();
    },
};

export default {
    sanitizeInput,
    validateFile,
    checkPasswordStrength,
    detectSQLInjection,
    RateLimiter,
    generateCSRFToken,
    secureStorage,
};
