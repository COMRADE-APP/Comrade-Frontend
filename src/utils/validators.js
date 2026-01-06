export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    return password.length >= 8;
};

export const validateRequired = (value) => {
    return value && value.trim().length > 0;
};

export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.detail) {
        return error.response.data.detail;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
