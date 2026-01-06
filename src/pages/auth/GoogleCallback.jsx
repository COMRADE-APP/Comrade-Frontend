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
            const userId = searchParams.get('user_id');
            const error = searchParams.get('error');

            if (error) {
                console.error('Google OAuth error:', error);
                navigate(ROUTES.LOGIN, { state: { error: 'Google authentication failed' } });
                return;
            }

            if (accessToken && refreshToken) {
                // Store tokens
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);

                // Fetch user data
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/user/`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        // Navigate to dashboard after successful login
                        navigate(ROUTES.DASHBOARD, { replace: true });
                    } else {
                        throw new Error('Failed to fetch user data');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate(ROUTES.LOGIN, { state: { error: 'Failed to complete authentication' } });
                }
            } else {
                navigate(ROUTES.LOGIN);
            }
        };

        handleCallback();
    }, [searchParams, navigate, setUser]);

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
