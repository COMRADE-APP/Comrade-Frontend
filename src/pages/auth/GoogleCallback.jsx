import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const error = searchParams.get('error');

            if (error) {
                console.error('Google OAuth error:', error);
                navigate(ROUTES.LOGIN, { state: { error: 'Google authentication failed' } });
                return;
            }

            if (accessToken && refreshToken) {
                try {
                    // Fetch user data
                    const response = await fetch('http://localhost:8000/api/auth/user/', {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        
                        // Store in format expected by authService
                        const authData = {
                            access_token: accessToken,
                            refresh_token: refreshToken,
                            user: userData
                        };
                        localStorage.setItem('user', JSON.stringify(authData));
                        
                        // We can't call setUser directly, so we reload or navigate
                        // The AuthProvider will pick up the user from localStorage on mount
                        window.location.href = ROUTES.DASHBOARD;
                    } else {
                        throw new Error('Failed to fetch user data');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    navigate(ROUTES.LOGIN, { state: { error: 'Failed to complete authentication' } });
                }
            } else {
                navigate(ROUTES.LOGIN);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Signing you in with Google...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
