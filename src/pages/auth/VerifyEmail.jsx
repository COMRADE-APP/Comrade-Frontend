import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ROUTES } from '../../constants/routes';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, resendOTP } = useAuth();
    const { showToast } = useToast();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // Get email from router state or params
    const email = location.state?.email || new URLSearchParams(location.search).get('email');

    useEffect(() => {
        if (!email) {
            navigate(ROUTES.LOGIN);
        }
    }, [email, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await verifyOTP(email, otp);
            showToast('Verification successful!', 'success');

            // Login complete - navigate to success page
            navigate(ROUTES.LOGIN_SUCCESS, {
                state: {
                    firstName: response.first_name,
                    userType: response.user_type
                },
                replace: true
            });
        } catch (err) {
            const message = err.response?.data?.detail || err.response?.data?.message || 'Verification failed. Please try again.';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await resendOTP(email);
            showToast('Verification code resent successfully.', 'success');
        } catch (err) {
            const message = err.response?.data?.detail || err.response?.data?.message || "Failed to resend code.";
            showToast(message, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-200">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Verify your Email</h2>
                    <p className="text-gray-600">
                        We've sent a 6-digit verification code to <br />
                        <span className="text-gray-900 font-semibold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-8">
                    <div className="flex justify-center">
                        <OTPInput length={6} value={otp} onChange={setOtp} />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-3"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                </form>

                <div className="mt-10 text-center space-y-4">
                    <p className="text-sm text-gray-600">
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-primary-600 font-bold hover:text-primary-700"
                        >
                            Resend Code
                        </button>
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
