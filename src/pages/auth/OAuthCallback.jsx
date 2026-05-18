import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const OAuthCallback = ({ provider }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const userId = searchParams.get('user_id');
            const email = searchParams.get('email');
            const firstName = searchParams.get('first_name');
            const userType = searchParams.get('user_type');
            const profileCompleted = searchParams.get('profile_completed');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                console.error(`${provider} OAuth error:`, errorParam);
                setError(`${provider} authentication failed`);
                setTimeout(() => navigate(ROUTES.LOGIN, { state: { error: `${provider} authentication failed` } }), 2000);
                return;
            }

            if (accessToken && refreshToken) {
                // Determine storage — social logins default to persistent
                const storage = localStorage;
                storage.setItem('access_token', accessToken);
                storage.setItem('refresh_token', refreshToken);
                localStorage.setItem('remember_me', 'true');

                // Store user data for AuthContext
                const isProfileComplete = profileCompleted === 'true';
                const hasPassword = searchParams.get('has_password') === 'true';
                const userData = {
                    id: userId,
                    email: email || '',
                    first_name: firstName || '',
                    user_type: userType || '',
                    profile_completed: isProfileComplete,
                    has_password: hasPassword,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                };
                storage.setItem('user', JSON.stringify(userData));

                // Redirect based on password status and profile completion
                if (hasPassword) {
                    // Redirect to password verification before granting access
                    navigate(ROUTES.SOCIAL_PASSWORD_VERIFY || '/social-verify', { 
                        state: { 
                            email: email,
                            message: `An account with this email already exists. Enter your password to confirm linking your ${provider} login.`
                        } 
                    });
                    return;
                }

                // Skip forced profile setup routing and send them straight to DASHBOARD
                window.location.href = ROUTES.DASHBOARD || '/dashboard';
            } else {
                navigate(ROUTES.LOGIN);
            }
        };

        handleCallback();
    }, [searchParams, navigate, provider]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-base">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="text-red-600 text-xl mb-4">❌</div>
                        <p className="text-red-600">{error}</p>
                        <p className="text-tertiary text-sm mt-2">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-secondary">Signing you in with {provider}...</p>
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
