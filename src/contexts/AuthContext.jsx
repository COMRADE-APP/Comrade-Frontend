import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Routes exempt from profile completion check
const PROFILE_EXEMPT_ROUTES = [
    '/profile-setup',
    '/login',
    '/register',
    '/logout',
    '/auth',
    '/forgot-password',
    '/reset-password',
    '/verify',
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if current route is exempt from profile check
    const isExemptRoute = () => {
        return PROFILE_EXEMPT_ROUTES.some(route =>
            location.pathname.toLowerCase().startsWith(route)
        );
    };

    useEffect(() => {
        // Check if user is logged in on mount
        const initAuth = async () => {
            const storedUser = authService.getStoredUser();
            const isAuth = authService.isAuthenticated();

            if (isAuth && storedUser) {
                setUser(storedUser);
                const profileStatus = storedUser?.profile_completed !== false;
                setProfileComplete(profileStatus);

                // Optionally fetch fresh user data
                try {
                    const freshUser = await authService.getCurrentUser();
                    if (freshUser) {
                        setUser(freshUser);
                        const freshProfileStatus = freshUser?.profile_completed !== false;
                        setProfileComplete(freshProfileStatus);

                        // Redirect to profile setup if profile is incomplete
                        if (!freshProfileStatus && !isExemptRoute()) {
                            navigate(ROUTES.PROFILE_SETUP || '/profile-setup', {
                                state: {
                                    email: freshUser.email,
                                    userType: freshUser.user_type,
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                    // Keep using stored user data if API fails
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); // Only run on mount

    // Effect to handle profile completion redirects when route changes
    useEffect(() => {
        if (!loading && user && !profileComplete && !isExemptRoute()) {
            navigate(ROUTES.PROFILE_SETUP || '/profile-setup', {
                state: {
                    email: user.email,
                    userType: user.user_type,
                }
            });
        }
    }, [location.pathname, loading, user, profileComplete]);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);

            if (data.verification_required) {
                navigate(ROUTES.VERIFY_EMAIL_OTP, { state: { email: data.email } });
                return data;
            }

            const userData = data.user || authService.getStoredUser();
            setUser(userData);

            const isProfileComplete = userData?.profile_completed !== false;
            setProfileComplete(isProfileComplete);

            // Redirect based on profile completion
            if (!isProfileComplete) {
                navigate(ROUTES.PROFILE_SETUP || '/profile-setup', {
                    state: { email: userData.email, userType: userData.user_type }
                });
            } else {
                navigate(ROUTES.DASHBOARD);
            }

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
            setProfileComplete(true);
            navigate(ROUTES.LOGIN);
        } catch (error) {
            console.error('Logout error:', error);
            setUser(null);
            setProfileComplete(true);
            navigate(ROUTES.LOGIN);
        }
    };

    // Update user data (e.g., after profile completion)
    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        // Update localStorage
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedData }));
        }
        if (updatedData.profile_completed) {
            setProfileComplete(true);
        }
    };

    // Mark profile as complete and redirect to dashboard
    const completeProfile = async (profileData) => {
        try {
            // Call API to update profile
            await authService.updateProfile?.({ ...profileData, profile_completed: true });

            // Update local state
            updateUser({ ...profileData, profile_completed: true });
            setProfileComplete(true);

            // Navigate to dashboard
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            console.error('Error completing profile:', error);
            throw error;
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        profileComplete,
        updateUser,
        completeProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
