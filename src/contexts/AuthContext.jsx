import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { ROUTES } from '../constants/routes';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in on mount
        const initAuth = async () => {
            const storedUser = authService.getStoredUser();
            const isAuth = authService.isAuthenticated();

            if (isAuth && storedUser) {
                setUser(storedUser);
                // Optionally fetch fresh user data
                try {
                    const freshUser = await authService.getCurrentUser();
                    setUser(freshUser);
                } catch (error) {
                    console.error('Error fetching user:', error);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);

            if (data.verification_required) {
                navigate(ROUTES.VERIFY_EMAIL_OTP, { state: { email: data.email } });
                return data;
            }

            setUser(data.user || authService.getStoredUser());
            navigate(ROUTES.DASHBOARD);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const data = await authService.register(userData);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            navigate(ROUTES.LOGIN);
        } catch (error) {
            console.error('Logout error:', error);
            setUser(null);
            navigate(ROUTES.LOGIN);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
