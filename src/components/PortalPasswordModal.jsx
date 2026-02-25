import React, { useState } from 'react';
import { X, Lock, KeyRound, Eye, EyeOff, Shield, Building2, GraduationCap } from 'lucide-react';
import portalService from '../services/portal.service';

/**
 * PortalPasswordModal - Prompts for PIN/password when switching to an entity account.
 * Also used for initial setup of portal password when creating an entity.
 * 
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - account: { id, name, type, has_portal_password, role, avatar }
 *  - onVerified: (account) => void  — called after successful verification
 *  - mode: 'verify' | 'setup'       — verify existing or set new password
 */
const PortalPasswordModal = ({ isOpen, onClose, account, onVerified, mode = 'verify' }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordType, setPasswordType] = useState('pin'); // 'pin' | 'password'
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen || !account) return null;

    const EntityIcon = account.type === 'organisation' ? Building2 : GraduationCap;

    const handleVerify = async () => {
        if (!password) {
            setError('Please enter your password/PIN');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const verifyFn = account.type === 'organisation'
                ? portalService.verifyOrgPortalPassword
                : portalService.verifyInstPortalPassword;

            const response = await verifyFn(account.id, { password });

            if (response.data?.verified) {
                setSuccess(true);
                setTimeout(() => {
                    onVerified(account);
                    resetState();
                }, 500);
            } else {
                setError(response.data?.error || 'Incorrect password');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async () => {
        if (!password) {
            setError(`Please enter a ${passwordType === 'pin' ? 'PIN' : 'password'}`);
            return;
        }
        if (passwordType === 'pin' && (!/^\d+$/.test(password) || password.length < 4)) {
            setError('PIN must be at least 4 digits');
            return;
        }
        if (passwordType === 'password' && password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const setFn = account.type === 'organisation'
                ? portalService.setOrgPortalPassword
                : portalService.setInstPortalPassword;

            await setFn(account.id, { password, password_type: passwordType });

            setSuccess(true);
            setTimeout(() => {
                onVerified(account);
                resetState();
            }, 800);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to set password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elevated rounded-2xl w-full max-w-md border border-theme shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header with gradient */}
                <div className={`p-6 pb-4 ${account.type === 'organisation'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    : 'bg-gradient-to-br from-purple-600 to-violet-700'
                    } text-white relative`}>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                            {account.avatar ? (
                                <img src={account.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <EntityIcon className="w-7 h-7 text-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{account.name}</h3>
                            <p className="text-sm text-white/70 capitalize flex items-center gap-1.5">
                                <Shield size={14} />
                                {mode === 'setup' ? 'Set up portal access' : 'Portal access'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {mode === 'setup' ? (
                        <>
                            <p className="text-sm text-secondary">
                                Set a {passwordType === 'pin' ? 'PIN' : 'password'} to secure this entity's portal.
                                Members will need this to switch to the entity account.
                            </p>

                            {/* Type toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPasswordType('pin')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${passwordType === 'pin'
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-400'
                                        : 'bg-secondary text-secondary hover:bg-tertiary'
                                        }`}
                                >
                                    <KeyRound size={16} className="inline mr-1.5" />
                                    PIN
                                </button>
                                <button
                                    onClick={() => setPasswordType('password')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${passwordType === 'password'
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-400'
                                        : 'bg-secondary text-secondary hover:bg-tertiary'
                                        }`}
                                >
                                    <Lock size={16} className="inline mr-1.5" />
                                    Password
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-secondary">
                            Enter the portal {account.password_type === 'pin' ? 'PIN' : 'password'} to switch to <strong>{account.name}</strong>.
                        </p>
                    )}

                    {/* Password input */}
                    <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                        <input
                            type={showPassword ? 'text' : (passwordType === 'pin' ? 'tel' : 'password')}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder={passwordType === 'pin' ? 'Enter PIN' : 'Enter password'}
                            inputMode={passwordType === 'pin' ? 'numeric' : undefined}
                            pattern={passwordType === 'pin' ? '[0-9]*' : undefined}
                            className="w-full pl-11 pr-11 py-3 bg-secondary border border-theme rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary text-lg tracking-widest"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && (mode === 'verify' ? handleVerify() : handleSetup())}
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Confirm password (setup only) */}
                    {mode === 'setup' && (
                        <div className="relative">
                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                            <input
                                type={showPassword ? 'text' : (passwordType === 'pin' ? 'tel' : 'password')}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                placeholder={`Confirm ${passwordType === 'pin' ? 'PIN' : 'password'}`}
                                inputMode={passwordType === 'pin' ? 'numeric' : undefined}
                                className="w-full pl-11 pr-4 py-3 bg-secondary border border-theme rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary text-lg tracking-widest"
                                onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                            />
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                            <X size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm">
                            <Shield size={16} className="shrink-0" />
                            {mode === 'setup' ? 'Portal password set successfully!' : 'Access granted!'}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        onClick={mode === 'verify' ? handleVerify : handleSetup}
                        disabled={loading || !password || success}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${account.type === 'organisation'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-l-white rounded-full animate-spin" />
                                {mode === 'verify' ? 'Verifying...' : 'Setting up...'}
                            </span>
                        ) : success ? (
                            '✓ Success'
                        ) : mode === 'verify' ? (
                            'Unlock Portal'
                        ) : (
                            `Set ${passwordType === 'pin' ? 'PIN' : 'Password'}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PortalPasswordModal;
