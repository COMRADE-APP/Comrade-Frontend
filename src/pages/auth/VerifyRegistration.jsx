import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

const VerifyRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Get email from router state
    const email = location.state?.email || new URLSearchParams(location.search).get('email');

    useEffect(() => {
        if (!email) {
            navigate(ROUTES.REGISTER);
        }
    }, [email, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.verifyRegistrationOTP(email, otp);

            if (response.next_step === 'profile_setup') {
                setSuccess(true);
                // Navigate to registration success page
                setTimeout(() => {
                    navigate(ROUTES.REGISTRATION_SUCCESS, {
                        state: {
                            email,
                            userType: response.user_type
                        }
                    });
                }, 1000);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await authService.resendOTP(email, 'email', 'registration');
            setError('');
            alert('Verification code resent successfully.');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to resend code.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your Email</h2>
                    <p className="text-gray-600">
                        We sent a verification code to<br />
                        <span className="font-semibold text-primary-600">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        ✓ Email verified successfully! Redirecting...
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    <OTPInput length={6} value={otp} onChange={setOtp} />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={loading || otp.length !== 6 || success}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                    <p className="text-sm text-gray-600">
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
                        onClick={() => navigate(ROUTES.REGISTER)}
                        className="text-sm text-gray-400 hover:text-gray-600"
                    >
                        ← Back to Registration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyRegistration;
