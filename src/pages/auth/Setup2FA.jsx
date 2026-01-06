import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

const Setup2FA = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: QR, 2: Verify
    const [secretData, setSecretData] = useState(null);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Init setup on mount
        const initSetup = async () => {
            try {
                const data = await authService.setup2FA();
                setSecretData(data);
            } catch (err) {
                setError('Failed to initiate 2FA setup.');
            }
        };
        initSetup();
    }, []);

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await authService.confirm2FASetup(otp);
            // Success
            alert("2FA Enabled Successfully!");
            navigate('/settings'); // Redirect to settings or dashboard
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!secretData && !error) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Setup Two-Factor Authentication</h2>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

                <div className="space-y-8">
                    {/* Step 1: Scan QR */}
                    <div className="text-center">
                        <div className="mb-4">
                            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded">Step 1</span>
                        </div>
                        <h3 className="text-lg font-medium mb-2">Scan this QR Code</h3>
                        <p className="text-gray-500 mb-4 text-sm">
                            Use Google Authenticator or any TOTP app to scan.
                        </p>

                        {secretData?.qr_code && (
                            <div className="flex justify-center mb-4">
                                <img src={secretData.qr_code} alt="2FA QR Code" className="border p-2 rounded-lg" />
                            </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-lg inline-block text-left">
                            <p className="text-xs text-gray-500 mb-1">Manual Entry Code:</p>
                            <code className="font-mono font-bold text-gray-800">{secretData?.secret}</code>
                        </div>
                    </div>

                    <hr />

                    {/* Step 2: Verify */}
                    <div className="text-center">
                        <div className="mb-4">
                            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded">Step 2</span>
                        </div>
                        <h3 className="text-lg font-medium mb-4">Enter 6-digit Code</h3>

                        <div className="flex justify-center mb-6">
                            <OTPInput length={6} value={otp} onChange={setOtp} />
                        </div>

                        <Button
                            onClick={handleConfirm}
                            disabled={loading || otp.length !== 6}
                            variant="primary"
                            className="w-full max-w-xs"
                        >
                            {loading ? 'Verifying...' : 'Enable 2FA'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setup2FA;
