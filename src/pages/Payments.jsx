import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { CreditCard, DollarSign, Download, Wallet, Plus, Users, ArrowDownCircle, ArrowUpCircle, PiggyBank, CheckCircle, Send, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import paymentsService from '../services/payments.service';
import { paymentProcessingService } from '../services/paymentProcessing.service';
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
    const [savedMethods, setSavedMethods] = useState(null); // null = not loaded yet

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

        // Also load saved payment methods to check if user has any
        try {
            const methods = await paymentProcessingService.getSavedMethods();
            const list = Array.isArray(methods) ? methods : methods?.results || [];
            setSavedMethods(list);
        } catch {
            setSavedMethods([]);
        }
    };



    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.transaction_type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Payments</h1>
                    <p className="text-secondary mt-1">Manage your transactions and wallet</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/deposit')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Deposit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/withdraw')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Withdraw
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/verify-account')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Account
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/create-group')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Create Group
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/groups')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        View Groups
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/piggy-banks')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <PiggyBank className="w-4 h-4 mr-2" />
                        Piggy Banks
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/payments/send')}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Money
                    </Button>
                </div>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm mb-2">Qomrade Balance</p>
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

            {/* Saved Payment Method Prompt */}
            {savedMethods !== null && savedMethods.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-200">No payment methods saved</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                            Add a card, M-Pesa number, or PayPal account so your payment details are saved for faster checkout and autofill.
                        </p>
                        <button
                            onClick={() => navigate('/payment-methods')}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add Payment Method
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-secondary">Total Received</p>
                                <p className="text-xl font-bold text-primary">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-secondary">Total Sent</p>
                                <p className="text-xl font-bold text-primary">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-secondary">Transactions</p>
                                <p className="text-xl font-bold text-primary">{transactions.length}</p>
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
                            : 'bg-elevated text-secondary border border-theme hover:bg-secondary/5'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                    <h3 className="font-semibold text-primary">Recent Transactions</h3>
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
                            <DollarSign className="w-12 h-12 text-tertiary mx-auto mb-4" />
                            <p className="text-secondary">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-theme">
                            {filteredTransactions.map((txn, idx) => (
                                <TransactionRow key={idx} transaction={txn} />
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

const TransactionRow = ({ transaction }) => (
    <div className="p-4 flex items-center justify-between hover:bg-secondary/5 border-b border-theme last:border-0 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.transaction_type === 'deposit' ? 'bg-green-500/10' :
                transaction.transaction_type === 'withdrawal' ? 'bg-red-500/10' :
                    'bg-blue-500/10'
                }`}>
                <DollarSign className={`w-5 h-5 ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                    transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                        'text-blue-600'
                    }`} />
            </div>
            <div>
                <h4 className="font-medium text-primary capitalize">{transaction.transaction_type || 'Transaction'}</h4>
                <p className="text-sm text-secondary">{formatDate(transaction.created_at)}</p>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-semibold ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                    'text-primary'
                }`}>
                {transaction.transaction_type === 'withdrawal' ? '-' : '+'}${transaction.amount || '0.00'}
            </p>
            <p className="text-xs text-secondary capitalize">{transaction.status || 'pending'}</p>
        </div>
    </div>
);

export default Payments;
