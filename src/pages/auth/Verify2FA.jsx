import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

const Verify2FA = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { completeLogin } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get email and rememberMe from router state
    const email = location.state?.email;
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
            const response = await authService.verify2FA(email, otp, rememberMe);
            await completeLogin(response, rememberMe);
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed. Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-base">
            <div className="w-full max-w-md bg-elevated rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-primary mb-2">Two-Factor Verification</h2>
                    <p className="text-secondary">
                        Enter the 6-digit code from your authenticator app.
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
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
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

export default Verify2FA;
