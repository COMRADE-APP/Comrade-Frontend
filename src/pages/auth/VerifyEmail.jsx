import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { completeLogin } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get email from router state or params
    const email = location.state?.email || new URLSearchParams(location.search).get('email');
    const rememberMe = location.state?.rememberMe || false;

    useEffect(() => {
        if (!email) {
            navigate(ROUTES.LOGIN);
        }
    }, [email, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.verifyLoginOTP(email, otp, rememberMe);

            if (response.verification_required) {
                // Next step required (e.g., 2FA)
                if (response.next_step === 'verify_2fa_totp') {
                    navigate(ROUTES.VERIFY_2FA, { state: { email, rememberMe } });
                } else if (response.next_step === 'verify_sms_otp') {
                    navigate(ROUTES.VERIFY_SMS, { state: { email, phone_last_4: response.phone_last_4, rememberMe } });
                }
            } else {
                // Login complete - use completeLogin to update Context & DB
                await completeLogin(response, rememberMe);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await authService.resendOTP(email, 'email');
            setError('');
            alert('Verification code resent successfully.');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to resend code.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-base">
            <div className="w-full max-w-md bg-elevated rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-primary mb-2">Verify your Email</h2>
                    <p className="text-secondary">
                        We sent a verification code to <span className="font-semibold">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    <OTPInput length={6} value={otp} onChange={setOtp} />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-secondary">
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Resend Code
                        </button>
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="text-sm text-tertiary hover:text-secondary"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
