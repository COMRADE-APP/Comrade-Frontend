import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { CheckCircle, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        payment_method: 'mpesa',
        account_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('identity'); // 'identity' or 'payment'
    const [kycStatus, setKycStatus] = useState('unverified'); // unverified, pending, verified
    const [kycRequest, setKycRequest] = useState(null);
    const [idFile, setIdFile] = useState(null);

    useEffect(() => {
        // Check existing KYC status on mount
        const checkStatus = async () => {
            try {
                const res = await api.get('/api/v1/verification/verifications/');
                const personalKyc = res.data.find(v => v.entity_type === 'personal');
                if (personalKyc) {
                    setKycRequest(personalKyc);
                    if (personalKyc.status === 'approved' || personalKyc.is_verified) {
                        setKycStatus('verified');
                    } else if (personalKyc.status === 'rejected') {
                        setKycStatus('unverified');
                        setError(`Previous verification rejected: ${personalKyc.rejection_reason}`);
                    } else {
                        setKycStatus('pending');
                    }
                }
            } catch (e) {
                console.error("Failed to load KYC status", e);
            }
        };
        if (user) checkStatus();
    }, [user]);

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        if (!idFile) return;
        setLoading(true);
        setError(null);
        
        try {
            // 1. Create Verification Request
            let currentReq = kycRequest;
            if (!currentReq || currentReq.status === 'rejected') {
                const createRes = await api.post('/api/v1/verification/verifications/', {
                    entity_type: 'personal',
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                    email: user.email,
                    phone_number: user.phone_number || 'N/A',
                    country: 'Kenya', // default for now
                    city: 'Nairobi',
                    address: 'User Address',
                });
                currentReq = createRes.data;
                setKycRequest(currentReq);
            }

            // 2. Upload ID Document
            const formData = new FormData();
            formData.append('verification_request_id', currentReq.id);
            formData.append('document_type', 'proof_address'); // or 'other' based on choices
            formData.append('document_name', 'National ID / Passport');
            formData.append('file', idFile);
            
            await api.post('/api/v1/verification/documents/', formData);

            // 3. Submit the verification request
            await api.post('/api/v1/verification/verifications/submit/', {
                verification_id: currentReq.id
            });

            setKycStatus('pending');
        } catch (err) {
            console.error("KYC submission failed", err);
            setError(err.response?.data?.detail || err.response?.data?.error || 'Verification submission failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await paymentsService.verifyAccount(formData);
            setResult(response);
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.error || 'Verification failed. Please check details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/payments')} className="mb-4 pl-0 hover:bg-transparent text-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments
            </Button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-primary">Trust & Verification</h1>
                <p className="text-secondary mt-2">Verify your identity and payment methods to unlock higher limits</p>
            </div>

            {/* Verification Tabs */}
            <div className="flex gap-2 p-1 bg-secondary/10 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('identity')}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'identity' ? 'bg-background text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                >
                    Identity Verification (KYC)
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'payment' ? 'bg-background text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                >
                    Payment Methods
                </button>
            </div>

            <Card className="border-theme">
                <CardBody className="p-8">
                    {activeTab === 'identity' && (
                        <div className="space-y-6">
                            {kycStatus === 'unverified' ? (
                                <form onSubmit={handleKycSubmit} className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-primary mb-2">Verify Your Identity</h3>
                                        <p className="text-sm text-secondary">We need to verify your identity to comply with financial regulations and secure your account.</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">National ID / Passport</label>
                                        <div className="border-2 border-dashed border-theme rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById('id-upload').click()}>
                                            <p className="text-primary font-medium">{idFile ? idFile.name : 'Click to upload your ID document'}</p>
                                            <p className="text-xs text-secondary mt-2">Clear, full-color image. Max 5MB.</p>
                                        </div>
                                        <input id="id-upload" type="file" className="hidden" accept="image/*" onChange={e => setIdFile(e.target.files[0])} />
                                    </div>

                                    <Button type="submit" variant="primary" className="w-full py-3" disabled={loading || !idFile}>
                                        {loading ? 'Uploading...' : 'Submit Identity Document'}
                                    </Button>
                                </form>
                            ) : kycStatus === 'pending' ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <AlertCircle className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-2">Review in Progress</h3>
                                    <p className="text-secondary max-w-sm mx-auto">Your identity documents are currently being reviewed. This usually takes less than 24 hours.</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 mb-2">Identity Verified</h3>
                                    <p className="text-secondary">Your identity has been successfully verified. You have full access to all financial features.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        !result ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-primary mb-2">Link Payment Account</h3>
                                    <p className="text-sm text-secondary">Verify a bank account or mobile money number for withdrawals.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">
                                        Account Type
                                    </label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        className="w-full px-4 py-2 border border-theme bg-background text-primary rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                    >
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="bank_transfer">Bank Account</option>
                                        <option value="paypal">PayPal</option>
                                    </select>
                                </div>

                                <Input
                                    label={formData.payment_method === 'mpesa' ? 'Phone Number' :
                                        formData.payment_method === 'paypal' ? 'PayPal Email' : 'Account Number'}
                                    type={formData.payment_method === 'paypal' ? 'email' : 'text'}
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    placeholder={
                                        formData.payment_method === 'mpesa' ? 'e.g. 254712345678' :
                                            formData.payment_method === 'paypal' ? 'email@example.com' : 'Account Number'
                                    }
                                    required
                                />

                                {error && (
                                    <div className="p-4 bg-red-500/10 text-red-700 border border-red-500/20 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify Payment Method'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-primary mb-2">Verified Successfully!</h3>
                                    <p className="text-secondary mb-4">{result.message}</p>
                                    <div className="bg-secondary/5 p-4 rounded-xl inline-block text-left text-sm max-w-sm w-full border border-theme">
                                        <p className="mb-1"><span className="font-semibold text-primary">Account Name:</span> <span className="text-secondary">{result.account_name}</span></p>
                                        <p className="mb-1"><span className="font-semibold text-primary">Account Number:</span> <span className="text-secondary">{result.account_number}</span></p>
                                        <p><span className="font-semibold text-primary">Provider:</span> <span className="text-secondary">{result.provider}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-theme">
                                    <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                                        Verify Another Account
                                    </Button>
                                    <Button onClick={() => navigate('/payments')} variant="primary" className="w-full">
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </CardBody>
            </Card>

            {/* Info Box */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex gap-4">
                <Shield className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Why do we need verification?</h3>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-300">
                        To protect your funds and comply with anti-money laundering regulations, we must verify your identity before enabling withdrawals, loans, or escrow transactions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyAccount;
