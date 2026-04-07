import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import authService from '../../services/auth.service';

const SocialPasswordVerify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { completeLogin } = useAuth();
    
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const email = location.state?.email;
    const message = location.state?.message || "Please enter your password to link your accounts.";

    useEffect(() => {
        // If there's no email in state, the user shouldn't be here directly
        if (!email) {
            navigate(ROUTES.LOGIN);
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // By authenticating with password on the existing email,
            // we prove ownership of the account and issue new standard tokens.
            const response = await authService.login(email, password, 'email', true);

            // Using completeLogin correctly handles OTP redirects if 2FA is enabled!
            if (response.verification_required) {
                if (response.next_step === 'verify_2fa_totp') {
                    navigate(ROUTES.VERIFY_2FA, { state: { email, rememberMe: true } });
                } else if (response.next_step === 'verify_sms_otp') {
                    navigate(ROUTES.VERIFY_SMS, { state: { email, phone_last_4: response.phone_last_4, rememberMe: true } });
                } else {
                    navigate(ROUTES.VERIFY_EMAIL_OTP, { state: { email, rememberMe: true } });
                }
            } else {
                await completeLogin(response, true);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Verification failed. Please check your password.");
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-base">
            <div className="w-full max-w-md bg-elevated rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Security Verification</h2>
                    <p className="text-secondary text-sm">
                        {message}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="bg-base/50"
                    />
                    
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your existing password"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={loading || !password}
                    >
                        {loading ? 'Verifying...' : 'Verify Password'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="text-sm text-tertiary hover:text-secondary"
                    >
                        Cancel and return to login
                    </button>
                    <div className="mt-4">
                        <button
                            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Forgot your password?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialPasswordVerify;
