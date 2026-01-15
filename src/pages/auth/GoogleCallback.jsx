import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import API_ENDPOINTS from '../../constants/apiEndpoints';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            // Check for URL params (from our custom callback)
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                console.error('Google OAuth error:', errorParam);
                navigate(ROUTES.LOGIN, { state: { error: 'Google authentication failed' } });
                return;
            }

            if (accessToken && refreshToken) {
                // Store tokens separately for API interceptor
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);

                // Also store user object for AuthContext
                const user = {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                };
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect to dashboard - AuthContext will fetch full user data
                window.location.href = ROUTES.DASHBOARD;
                return;
            }

            // If no tokens in URL, try to get JWT from our callback endpoint
            // This handles the case where allauth redirects to frontend and we need to exchange session for JWT
            try {
                const response = await fetch(API_ENDPOINTS.GOOGLE_CALLBACK, {
                    method: 'GET',
                    credentials: 'include', // Include session cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.access_token) {
                        // Store tokens separately for API interceptor
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);

                        // Store full user object for AuthContext
                        const user = {
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            id: data.user_id,
                            email: data.email,
                            first_name: data.first_name,
                            user_type: data.user_type,
                            profile_completed: data.profile_completed,
                        };
                        localStorage.setItem('user', JSON.stringify(user));

                        // Check if profile needs to be completed
                        if (data.profile_completed === false) {
                            window.location.href = ROUTES.PROFILE_SETUP || '/profile-setup';
                        } else {
                            window.location.href = ROUTES.DASHBOARD;
                        }
                        return;
                    }
                }
            } catch (err) {
                console.error('Error exchanging session for JWT:', err);
            }

            // Fallback: redirect to login
            navigate(ROUTES.LOGIN, { state: { error: 'Please try logging in again' } });
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {error ? (
                    <div className="text-red-600 mb-4">{error}</div>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Signing you in with Google...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback;
