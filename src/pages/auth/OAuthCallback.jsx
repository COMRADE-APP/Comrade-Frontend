import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

const OAuthCallback = ({ provider }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const userId = searchParams.get('user_id');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                console.error(`${provider} OAuth error:`, errorParam);
                setError(`${provider} authentication failed`);
                setTimeout(() => navigate(ROUTES.LOGIN, { state: { error: `${provider} authentication failed` } }), 2000);
                return;
            }

            if (accessToken && refreshToken) {
                // Store tokens in the format expected by auth context
                const userData = {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    user_id: userId,
                };
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);

                // Update auth context if setUser is available
                if (setUser) {
                    setUser(userData);
                }

                // Navigate to dashboard
                navigate(ROUTES.DASHBOARD, { replace: true });
            } else {
                navigate(ROUTES.LOGIN);
            }
        };

        handleCallback();
    }, [searchParams, navigate, setUser, provider]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="text-red-600 text-xl mb-4">❌</div>
                        <p className="text-red-600">{error}</p>
                        <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Signing you in with {provider}...</p>
                    </>
                )}
            </div>
        </div>
    );
};

// Specific callback components for each provider
export const AppleCallback = () => <OAuthCallback provider="Apple" />;
export const FacebookCallback = () => <OAuthCallback provider="Facebook" />;
export const XCallback = () => <OAuthCallback provider="X" />;
export const GitHubCallback = () => <OAuthCallback provider="GitHub" />;
export const MicrosoftCallback = () => <OAuthCallback provider="Microsoft" />;

export default OAuthCallback;
