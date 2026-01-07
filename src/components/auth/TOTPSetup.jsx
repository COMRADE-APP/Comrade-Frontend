import React, { useState } from 'react';
import totpService from '../../services/totp.service';
import './TOTPSetup.css';

const TOTPSetup = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1); // 1: Generate QR, 2: Verify, 3: Backup Codes
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateQRCode = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await totpService.setupTOTP();
            setQrCode(data.qr_code);
            setSecret(data.secret);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await totpService.verifySetup(verificationCode);
            setBackupCodes(data.backup_codes);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const downloadBackupCodes = () => {
        const content = `TOTP Backup Codes\n\nKeep these codes safe. Each can be used once if you lose access to your authenticator app.\n\n${backupCodes.join('\n')}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'totp-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        alert('Backup codes copied to clipboard!');
    };

    return (
        <div className="totp-setup">
            <div className="totp-setup-header">
                <h2>Set Up Two-Factor Authentication</h2>
                <button className="close-btn" onClick={onCancel}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {step === 1 && (
                <div className="totp-step">
                    <h3>Step 1: Install Authenticator App</h3>
                    <p>
                        Install an authenticator app on your phone. We recommend:
                    </p>
                    <ul>
                        <li>Google Authenticator</li>
                        <li>Microsoft Authenticator</li>
                        <li>Authy</li>
                    </ul>
                    <button
                        className="btn-primary"
                        onClick={generateQRCode}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Continue'}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="totp-step">
                    <h3>Step 2: Scan QR Code</h3>
                    <p>Scan this QR code with your authenticator app:</p>
                    {qrCode && (
                        <div className="qr-code-container">
                            <img src={qrCode} alt="TOTP QR Code" />
                        </div>
                    )}
                    <div className="manual-entry">
                        <p>Or enter this key manually:</p>
                        <code>{secret}</code>
                    </div>

                    <form onSubmit={verifyCode}>
                        <h3>Step 3: Verify Code</h3>
                        <p>Enter the 6-digit code from your authenticator app:</p>
                        <input
                            type="text"
                            maxLength="6"
                            className="verification-input"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            required
                        />
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || verificationCode.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                </div>
            )}

            {step === 3 && (
                <div className="totp-step">
                    <h3>✓ TOTP Enabled Successfully!</h3>
                    <p className="success-message">
                        Two-factor authentication is now active on your account.
                    </p>

                    <h4>Backup Codes</h4>
                    <p className="warning-message">
                        Save these backup codes in a safe place. Each code can be used once if you lose
                        access to your authenticator app.
                    </p>

                    <div className="backup-codes">
                        {backupCodes.map((code, index) => (
                            <code key={index}>{code}</code>
                        ))}
                    </div>

                    <div className="backup-actions">
                        <button className="btn-secondary" onClick={downloadBackupCodes}>
                            Download Codes
                        </button>
                        <button className="btn-secondary" onClick={copyBackupCodes}>
                            Copy to Clipboard
                        </button>
                    </div>

                    <button className="btn-primary" onClick={onComplete}>
                        Complete Setup
                    </button>
                </div>
            )}
        </div>
    );
};

export default TOTPSetup;
