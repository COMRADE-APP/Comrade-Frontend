import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import paymentsService from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { formatDate } from '../../utils/dateFormatter';

const ReverseTransaction = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [reason, setReason] = useState('');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setError(null);
        setNotFound(false);
        setTransaction(null);
        setSuccess(false);
        
        try {
            const txn = await paymentsService.getTransactionById(searchQuery.trim());
            if (txn) {
                setTransaction(txn);
            } else {
                setNotFound(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to find transaction');
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleReverse = async () => {
        if (!transaction) return;
        
        if (!window.confirm('Are you sure you want to reverse this transaction? This action cannot be undone.')) {
            return;
        }
        
        setProcessing(true);
        try {
            await paymentsService.reverseTransaction(
                transaction.transaction_code || transaction.id,
                reason
            );
            setSuccess(true);
            setTransaction(null);
            setSearchQuery('');
            setReason('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reverse transaction');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => navigate('/payments')}
                    className="flex items-center gap-2 text-secondary hover:text-primary mb-6"
                >
                    <ArrowLeft size={18} /> Back to Payments
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ArrowLeft className="w-6 h-6 text-red-600" />
                        </div>
                        Reverse Transaction
                    </h1>
                    <p className="text-secondary mt-2">
                        Search for a transaction using its ID or code to request a reversal.
                    </p>
                </div>

                {success && (
                    <Card className="mb-6 border-green-500/20 bg-green-50 dark:bg-green-900/20">
                        <CardBody className="p-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Transaction Reversed</h3>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-1">The transaction has been successfully reversed.</p>
                        </CardBody>
                    </Card>
                )}

                <Card className="mb-6">
                    <CardBody className="p-6">
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Transaction ID or Code
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Enter transaction ID or code"
                                    className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-elevated text-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                            </div>
                            <Button 
                                variant="primary" 
                                onClick={handleSearch}
                                disabled={loading || !searchQuery.trim()}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 mt-2">{error}</p>
                        )}
                    </CardBody>
                </Card>

                {notFound && !loading && (
                    <Card>
                        <CardBody className="p-6 text-center">
                            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-primary mb-1">Transaction Not Found</h3>
                            <p className="text-sm text-secondary">No transaction found with that ID or code.</p>
                        </CardBody>
                    </Card>
                )}

                {transaction && (
                    <Card className="border-red-500/20">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-bold text-red-700">Confirm Reversal</h3>
                            </div>
                            
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    You are about to reverse this transaction. The funds will be returned to the sender's wallet.
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-secondary">Transaction ID</span>
                                    <span className="font-mono text-sm text-primary">{transaction.id || transaction.transaction_code}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-secondary">Type</span>
                                    <span className="text-primary capitalize">{transaction.transaction_type}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-secondary">Amount</span>
                                    <span className="font-bold text-red-600">-{formatMoneySimple(parseFloat(transaction.amount))}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-secondary">Status</span>
                                    <span className="text-primary capitalize">{transaction.status}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-secondary">Date</span>
                                    <span className="text-primary">{formatDate(transaction.created_at)}</span>
                                </div>
                                {transaction.sender_name && (
                                    <div className="flex justify-between py-2 border-b border-theme">
                                        <span className="text-secondary">From</span>
                                        <span className="text-primary">{transaction.sender_name}</span>
                                    </div>
                                )}
                                {transaction.recipient_name && (
                                    <div className="flex justify-between py-2 border-b border-theme">
                                        <span className="text-secondary">To</span>
                                        <span className="text-primary">{transaction.recipient_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary mb-1">
                                    Reason for reversal (optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain why you are reversing this transaction..."
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    rows="3"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => { setTransaction(null); setSearchQuery(''); }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={handleReverse}
                                    disabled={processing}
                                    className="flex-1 !bg-red-600 hover:!bg-red-700 !border-transparent"
                                >
                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reversal'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ReverseTransaction;
