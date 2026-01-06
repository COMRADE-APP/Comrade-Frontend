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
    const { login } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get email from router state
    const email = location.state?.email;

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
            await authService.verify2FA(email, otp);
            // Login success - storage updated in service
            window.location.href = ROUTES.DASHBOARD;
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed. Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Verification</h2>
                    <p className="text-gray-600">
                        Enter the 6-digit code from your authenticator app.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
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
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verify2FA;
