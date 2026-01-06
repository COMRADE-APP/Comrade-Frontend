import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TOTPSetup = () => {
    const [step, setStep] = useState(1);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (step === 1) {
            setupTOTP();
        }
    }, [step]);

    const setupTOTP = async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/auth/totp/setup/');
            setQrCode(response.data.qr_code);
            setSecret(response.data.secret);
            setBackupCodes(response.data.backup_codes);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to setup TOTP');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        try {
            setLoading(true);
            setError('');
            await api.post('/api/auth/totp/verify-setup/', {
                code: verificationCode
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadBackupCodes = () => {
        const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comrade-backup-codes.txt';
        a.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Enable Two-Factor Authentication
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Add an extra layer of security to your account
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Loading */}
                {step === 1 && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Setting up 2FA...</p>
                    </div>
                )}

                {/* Step 2: Scan QR Code */}
                {step === 2 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
                        <p className="text-gray-600 mb-6">
                            Use Google Authenticator, Authy, or any TOTP app to scan this QR code:
                        </p>

                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                            {qrCode && (
                                <img src={qrCode} alt="TOTP QR Code" className="border-4 border-gray-200 rounded-lg" />
                            )}
                        </div>

                        {/* Manual Entry */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
                            <code className="block p-2 bg-white border rounded text-center font-mono text-sm">
                                {secret}
                            </code>
                        </div>

                        {/* Verification */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter 6-digit code from your app
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="000000"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={verifyAndEnable}
                            disabled={loading || verificationCode.length !== 6}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                        >
                            {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                        </button>
                    </div>
                )}

                {/* Step 3: Success & Backup Codes */}
                {step === 3 && (
                    <div>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-semibold text-green-600">2FA Enabled!</h2>
                            <p className="text-gray-600 mt-2">Your account is now more secure</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important: Save Your Backup Codes</h3>
                            <p className="text-sm text-yellow-700">
                                If you lose access to your authenticator app, these codes can be used to log in.
                                Each code can only be used once.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="grid grid-cols-2 gap-2">
                                {backupCodes.map((code, index) => (
                                    <code key={index} className="block p-2 bg-white border rounded text-center font-mono text-sm">
                                        {code}
                                    </code>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={downloadBackupCodes}
                                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                            >
                                📥 Download Codes
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TOTPSetup;
