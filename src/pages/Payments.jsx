import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { CreditCard, DollarSign, TrendingUp, Download, Filter, X, AlertCircle, Wallet, Plus, Users, ArrowDownCircle, ArrowUpCircle, PiggyBank, CheckCircle, XCircle } from 'lucide-react';
import paymentsService from '../services/payments.service';
import { formatDate } from '../utils/dateFormatter';
import { ROUTES } from '../constants/routes';

const Payments = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [paymentProfile, setPaymentProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    // Modal states
    const [showSendModal, setShowSendModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // Form data
    const [sendData, setSendData] = useState({ amount: '', recipient: '', payment_option: 'comrade_balance' });
    const [depositData, setDepositData] = useState({ amount: '', payment_method: 'bank_transfer' });
    const [withdrawData, setWithdrawData] = useState({ amount: '', account_number: '', payment_method: 'bank_transfer' });

    // Confirmation states
    const [confirmationStep, setConfirmationStep] = useState('form'); // 'form', 'confirm', 'success', 'error'
    const [resultMessage, setResultMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const loadData = async () => {
        setLoading(true);
        try {
            const [profile, txns] = await Promise.all([
                paymentsService.getProfile().catch(() => null),
                paymentsService.getTransactions().catch(() => []),
            ]);
            setPaymentProfile(profile);
            setTransactions(Array.isArray(txns) ? txns : []);
        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMoney = async (e) => {
        e.preventDefault();
        try {
            await paymentsService.createTransaction(sendData);
            setShowSendModal(false);
            setSendData({ amount: '', recipient: '', payment_option: 'comrade_balance' });
            loadData();
        } catch (error) {
            alert('Failed to send payment');
        }
    };

    // Deposit Flow
    const handleDepositConfirm = () => setConfirmationStep('confirm');
    const handleDepositSubmit = async () => {
        setProcessing(true);
        try {
            const result = await paymentsService.deposit(parseFloat(depositData.amount), depositData.payment_method);
            setResultMessage(result.message || `Successfully deposited $${depositData.amount}`);
            setConfirmationStep('success');
            loadData();
        } catch (error) {
            setResultMessage(error.response?.data?.error || 'Failed to process deposit');
            setConfirmationStep('error');
        } finally {
            setProcessing(false);
        }
    };
    const resetDepositModal = () => {
        setShowDepositModal(false);
        setDepositData({ amount: '', payment_method: 'bank_transfer' });
        setConfirmationStep('form');
        setResultMessage('');
    };

    // Withdraw Flow
    const handleWithdrawConfirm = () => {
        const amount = parseFloat(withdrawData.amount);
        if (amount > parseFloat(paymentProfile?.comrade_balance || 0)) {
            setResultMessage('Insufficient balance');
            setConfirmationStep('error');
            return;
        }
        setConfirmationStep('confirm');
    };
    const handleWithdrawSubmit = async () => {
        setProcessing(true);
        try {
            const result = await paymentsService.withdraw(
                parseFloat(withdrawData.amount),
                withdrawData.account_number,
                withdrawData.payment_method
            );
            setResultMessage(result.message || `Successfully withdrew $${withdrawData.amount}`);
            setConfirmationStep('success');
            loadData();
        } catch (error) {
            setResultMessage(error.response?.data?.error || 'Failed to process withdrawal');
            setConfirmationStep('error');
        } finally {
            setProcessing(false);
        }
    };
    const resetWithdrawModal = () => {
        setShowWithdrawModal(false);
        setWithdrawData({ amount: '', account_number: '', payment_method: 'bank_transfer' });
        setConfirmationStep('form');
        setResultMessage('');
    };

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.transaction_type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Manage your transactions and wallet</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setShowDepositModal(true)}>
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Deposit
                    </Button>
                    <Button variant="outline" onClick={() => setShowWithdrawModal(true)}>
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Withdraw
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/payments/create-group')}>
                        <Users className="w-4 h-4 mr-2" />
                        Create Group
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/payments/groups')}>
                        <Users className="w-4 h-4 mr-2" />
                        View Groups
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/piggy-banks')}>
                        <PiggyBank className="w-4 h-4 mr-2" />
                        Piggy Banks
                    </Button>
                    <Button variant="primary" onClick={() => setShowSendModal(true)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Send Money
                    </Button>
                </div>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm mb-2">Comrade Balance</p>
                            <h2 className="text-4xl font-bold">
                                ${paymentProfile?.comrade_balance || '0.00'}
                            </h2>
                        </div>
                        <CreditCard className="w-12 h-12 text-primary-200" />
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-primary-100 text-xs">This Month</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-xs">Spent</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-xs">Earned</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Received</p>
                                <p className="text-xl font-bold text-gray-900">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Sent</p>
                                <p className="text-xl font-bold text-gray-900">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Transactions</p>
                                <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'purchase', 'deposit', 'withdrawal', 'transfer'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </CardHeader>
                <CardBody className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredTransactions.map((txn, idx) => (
                                <TransactionRow key={idx} transaction={txn} />
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Send Money Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Send Money</h2>
                                <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSendMoney} className="space-y-4">
                                <Input
                                    label="Amount"
                                    type="number"
                                    step="0.01"
                                    value={sendData.amount}
                                    onChange={(e) => setSendData({ ...sendData, amount: e.target.value })}
                                    required
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Recipient Email"
                                    type="email"
                                    value={sendData.recipient}
                                    onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
                                    required
                                    placeholder="recipient@example.com"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={sendData.payment_option}
                                        onChange={(e) => setSendData({ ...sendData, payment_option: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="comrade_balance">Comrade Balance</option>
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="stripe">Stripe</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" type="button" onClick={() => setShowSendModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Send ${sendData.amount || '0.00'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
                                <button onClick={resetDepositModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {confirmationStep === 'form' && (
                                <div className="space-y-4">
                                    <Input
                                        label="Amount"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        value={depositData.amount}
                                        onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                                        required
                                        placeholder="Enter amount to deposit"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                        <select
                                            value={depositData.payment_method}
                                            onChange={(e) => setDepositData({ ...depositData, payment_method: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="mpesa">M-Pesa</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="stripe">Credit/Debit Card</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-4">
                                        <Button variant="outline" onClick={resetDepositModal}>Cancel</Button>
                                        <Button variant="primary" onClick={handleDepositConfirm} disabled={!depositData.amount}>
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {confirmationStep === 'confirm' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                                        <ArrowDownCircle className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Confirm Deposit</h3>
                                    <p className="text-gray-600">
                                        You are about to deposit <span className="font-bold text-gray-900">${depositData.amount}</span> to your Comrade Balance.
                                    </p>
                                    <div className="flex gap-2 justify-center pt-4">
                                        <Button variant="outline" onClick={() => setConfirmationStep('form')}>Back</Button>
                                        <Button variant="primary" onClick={handleDepositSubmit} disabled={processing}>
                                            {processing ? 'Processing...' : 'Confirm Deposit'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {confirmationStep === 'success' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-600">Deposit Successful!</h3>
                                    <p className="text-gray-600">{resultMessage}</p>
                                    <Button variant="primary" onClick={resetDepositModal} className="w-full">Done</Button>
                                </div>
                            )}

                            {confirmationStep === 'error' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-600">Deposit Failed</h3>
                                    <p className="text-gray-600">{resultMessage}</p>
                                    <Button variant="primary" onClick={() => setConfirmationStep('form')} className="w-full">Try Again</Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                                <button onClick={resetWithdrawModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-gray-100 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-600">Available Balance</p>
                                <p className="text-xl font-bold text-gray-900">${paymentProfile?.comrade_balance || '0.00'}</p>
                            </div>

                            {confirmationStep === 'form' && (
                                <div className="space-y-4">
                                    <Input
                                        label="Amount"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        max={paymentProfile?.comrade_balance || 0}
                                        value={withdrawData.amount}
                                        onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                                        required
                                        placeholder="Enter amount to withdraw"
                                    />
                                    <Input
                                        label="Account Number / Phone"
                                        type="text"
                                        value={withdrawData.account_number}
                                        onChange={(e) => setWithdrawData({ ...withdrawData, account_number: e.target.value })}
                                        placeholder="Enter destination account"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Method</label>
                                        <select
                                            value={withdrawData.payment_method}
                                            onChange={(e) => setWithdrawData({ ...withdrawData, payment_method: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="mpesa">M-Pesa</option>
                                            <option value="paypal">PayPal</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-4">
                                        <Button variant="outline" onClick={resetWithdrawModal}>Cancel</Button>
                                        <Button variant="primary" onClick={handleWithdrawConfirm} disabled={!withdrawData.amount}>
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {confirmationStep === 'confirm' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                                        <ArrowUpCircle className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Confirm Withdrawal</h3>
                                    <p className="text-gray-600">
                                        You are about to withdraw <span className="font-bold text-gray-900">${withdrawData.amount}</span> to {withdrawData.account_number || 'your primary account'}.
                                    </p>
                                    <div className="flex gap-2 justify-center pt-4">
                                        <Button variant="outline" onClick={() => setConfirmationStep('form')}>Back</Button>
                                        <Button variant="primary" onClick={handleWithdrawSubmit} disabled={processing}>
                                            {processing ? 'Processing...' : 'Confirm Withdrawal'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {confirmationStep === 'success' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-600">Withdrawal Successful!</h3>
                                    <p className="text-gray-600">{resultMessage}</p>
                                    <Button variant="primary" onClick={resetWithdrawModal} className="w-full">Done</Button>
                                </div>
                            )}

                            {confirmationStep === 'error' && (
                                <div className="space-y-4 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-600">Withdrawal Failed</h3>
                                    <p className="text-gray-600">{resultMessage}</p>
                                    <Button variant="primary" onClick={() => setConfirmationStep('form')} className="w-full">Try Again</Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const TransactionRow = ({ transaction }) => (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.transaction_type === 'deposit' ? 'bg-green-100' :
                transaction.transaction_type === 'withdrawal' ? 'bg-red-100' :
                    'bg-blue-100'
                }`}>
                <DollarSign className={`w-5 h-5 ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                    transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                        'text-blue-600'
                    }`} />
            </div>
            <div>
                <h4 className="font-medium text-gray-900 capitalize">{transaction.transaction_type || 'Transaction'}</h4>
                <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-semibold ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                    'text-gray-900'
                }`}>
                {transaction.transaction_type === 'withdrawal' ? '-' : '+'}${transaction.amount || '0.00'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{transaction.status || 'pending'}</p>
        </div>
    </div>
);

export default Payments;
