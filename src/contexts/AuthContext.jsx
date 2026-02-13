import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';
import organizationsService from '../services/organizations.service';
import institutionsService from '../services/institutions.service';
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
    // Active profile for content creation context (personal, org, or institution)
    const [activeProfile, setActiveProfile] = useState(null);
    // List of available accounts the user can switch to
    const [availableAccounts, setAvailableAccounts] = useState([]);
    // Whether to show account selection modal after login
    const [showAccountSelection, setShowAccountSelection] = useState(false);
    // Flag to indicate fresh login (vs page refresh)
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if current route is exempt from profile check
    const isExemptRoute = () => {
        return PROFILE_EXEMPT_ROUTES.some(route =>
            location.pathname.toLowerCase().startsWith(route)
        );
    };

    // Fetch user's organizations and institutions for account switching
    const fetchAvailableAccounts = async (userData, isLogin = false) => {
        const accounts = [];

        // Add personal account first
        const personalAccount = {
            id: userData?.id || null,
            name: userData?.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : (userData?.email || 'User'),
            type: 'personal',
            avatar: userData?.profile_picture || userData?.avatar
        };
        accounts.push(personalAccount);

        // Fetch organizations
        try {
            const orgs = await organizationsService.getMyOrganizations();
            if (Array.isArray(orgs)) {
                accounts.push(...orgs);
            }
        } catch (err) {
            console.log('Could not fetch organizations:', err);
        }

        // Fetch institutions
        try {
            const institutions = await institutionsService.getMyInstitutions();
            if (Array.isArray(institutions)) {
                accounts.push(...institutions);
            }
        } catch (err) {
            console.log('Could not fetch institutions:', err);
        }

        setAvailableAccounts(accounts);

        // Check if we should show account selection (on login with multiple accounts)
        const skipSelection = localStorage.getItem('skipAccountSelection') === 'true';
        const defaultAccountId = localStorage.getItem('defaultAccountId');

        if (isLogin && accounts.length > 1 && !skipSelection) {
            // Show account selection modal after login
            setShowAccountSelection(true);
            // Default to personal but let user choose
            setActiveProfile(personalAccount);
        } else if (defaultAccountId && skipSelection) {
            // User chose to remember their selection
            const defaultAccount = accounts.find(a => a.id === defaultAccountId);
            if (defaultAccount) {
                setActiveProfile(defaultAccount);
            } else {
                setActiveProfile(personalAccount);
            }
        } else {
            // Restore active profile from localStorage or default to personal
            const storedActiveProfile = localStorage.getItem('activeProfile');
            if (storedActiveProfile) {
                try {
                    const parsed = JSON.parse(storedActiveProfile);
                    // Verify the stored profile still exists in available accounts
                    const stillExists = accounts.find(a => a.id === parsed.id && a.type === parsed.type);
                    if (stillExists) {
                        setActiveProfile(stillExists);
                    } else {
                        setActiveProfile(personalAccount);
                    }
                } catch {
                    setActiveProfile(personalAccount);
                }
            } else {
                setActiveProfile(personalAccount);
            }
        }
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

                        // Fetch available accounts for switching
                        await fetchAvailableAccounts(freshUser);
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                    // Fallback: Build accounts from stored user
                    await fetchAvailableAccounts(storedUser);
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

    // Heartbeat for activity status
    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            try {
                if (authService.heartbeat) {
                    await authService.heartbeat();
                }
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };

        // Send immediately on login/load
        sendHeartbeat();

        // Then every 2 minutes
        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);

            if (data.verification_required) {
                navigate(ROUTES.VERIFY_EMAIL_OTP, { state: { email: data.email } });
                return data;
            }

            const userData = data.user || authService.getStoredUser();
            setUser(userData);
            setJustLoggedIn(true);

            const isProfileComplete = userData?.profile_completed !== false;
            setProfileComplete(isProfileComplete);

            // Redirect based on profile completion
            if (!isProfileComplete) {
                navigate(ROUTES.PROFILE_SETUP || '/profile-setup', {
                    state: { email: userData.email, userType: userData.user_type }
                });
            } else {
                // Fetch accounts and check if we need to show selection
                await fetchAvailableAccounts(userData, true);
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

    // Switch active profile (personal, organisation, or institution)
    const switchAccount = (account) => {
        setActiveProfile(account);
        localStorage.setItem('activeProfile', JSON.stringify(account));
        setShowAccountSelection(false);
    };

    // Handle account selection from modal (after login)
    const handleAccountSelected = (account) => {
        switchAccount(account);
        setShowAccountSelection(false);
        setJustLoggedIn(false);
    };

    // Dismiss account selection modal
    const dismissAccountSelection = () => {
        setShowAccountSelection(false);
        setJustLoggedIn(false);
    };

    // Add accounts (called when user's orgs/institutions are fetched)
    const updateAvailableAccounts = (accounts) => {
        setAvailableAccounts(accounts);
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
        // Account switching
        activeProfile,
        availableAccounts,
        switchAccount,
        updateAvailableAccounts,
        // Post-login account selection
        showAccountSelection,
        handleAccountSelected,
        dismissAccountSelection,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
