import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

const VerifySMS = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { completeLogin } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get email and phone info from router state
    const { email, phone_last_4, rememberMe } = location.state || {};

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
            const response = await authService.verifySMSOTP(email, otp, rememberMe);
            await completeLogin(response, rememberMe);
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed. Invalid SMS code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await authService.resendOTP(email, 'sms');
            setError('');
            alert('SMS code resent successfully.');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to resend SMS.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-base">
            <div className="w-full max-w-md bg-elevated rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-primary mb-2">SMS Verification</h2>
                    <p className="text-secondary">
                        Enter the code sent to your phone ending in <span className="font-semibold">****{phone_last_4}</span>
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
                        {loading ? 'Verifying...' : 'Verify Code'}
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
                            Resend SMS
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

export default VerifySMS;
