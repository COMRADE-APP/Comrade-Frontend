import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { CheckCircle, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import paymentsService from '../../services/payments.service';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        method: 'mpesa',
        account_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await paymentsService.verifyAccount(formData);
            setResult(response);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Please check details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/payments')} className="mb-4 pl-0 hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payments
            </Button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-primary">Verify Account</h1>
                <p className="text-secondary mt-2">Link and verify your external payment accounts</p>
            </div>

            <Card>
                <CardBody className="p-8">
                    {!result ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">
                                    Account Type
                                </label>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                >
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="bank_transfer">Bank Account</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            <Input
                                label={formData.method === 'mpesa' ? 'Phone Number' :
                                    formData.method === 'paypal' ? 'PayPal Email' : 'Account Number'}
                                type={formData.method === 'paypal' ? 'email' : 'text'}
                                value={formData.account_number}
                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                placeholder={
                                    formData.method === 'mpesa' ? 'e.g. 254712345678' :
                                        formData.method === 'paypal' ? 'email@example.com' : 'Account Number'
                                }
                                required
                            />

                            {error && (
                                <div className="p-4 bg-red-500/10 text-red-700 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-3 text-lg"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify Now'}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-primary mb-2">Verified Successfully!</h3>
                                <p className="text-secondary mb-4">{result.message}</p>
                                <div className="bg-secondary/10 p-4 rounded-lg inline-block text-left text-sm max-w-sm w-full border border-theme">
                                    <p><span className="font-semibold text-primary">Account Name:</span> <span className="text-secondary">{result.account_name}</span></p>
                                    <p><span className="font-semibold text-primary">Account Number:</span> <span className="text-secondary">{result.account_number}</span></p>
                                    <p><span className="font-semibold text-primary">Provider:</span> <span className="text-secondary">{result.provider}</span></p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                                    Verify Another Account
                                </Button>
                                <Button onClick={() => navigate('/payments')} variant="primary" className="w-full">
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <h3 className="font-semibold text-blue-700 mb-2">Why verify?</h3>
                <ul className="text-sm text-blue-600 space-y-2 list-disc pl-5">
                    <li>Secure withdrawals to your personal accounts</li>
                    <li>Higher transaction limits</li>
                    <li>Instant transfers to verified M-Pesa numbers</li>
                </ul>
            </div>
        </div>
    );
};

export default VerifyAccount;
