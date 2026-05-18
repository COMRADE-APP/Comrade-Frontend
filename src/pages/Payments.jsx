import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { CreditCard, DollarSign, Download, Wallet, Plus, Users, ArrowDownCircle, ArrowUpCircle, ArrowDownLeft, ArrowLeftRight, PiggyBank, CheckCircle, Send, AlertTriangle, TrendingUp, Filter, ChevronRight, ChevronDown, Clock, RefreshCw, ShoppingCart, Heart, Building, Gift, BarChart3 } from 'lucide-react';
import paymentsService from '../services/payments.service';
import { paymentProcessingService } from '../services/paymentProcessing.service';
import { formatDate } from '../utils/dateFormatter';
import { formatMoneySimple } from '../utils/moneyUtils.jsx';
import { ROUTES } from '../constants/routes';


const Payments = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [paymentProfile, setPaymentProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [checkoutRequests, setCheckoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    
    const initialTab = searchParams.get('tab') || 'transactions';
    const [activeMainTab, setActiveMainTab] = useState(initialTab);
    const [savedMethods, setSavedMethods] = useState(null);
    const [expandedTxnId, setExpandedTxnId] = useState(null);
    const [txnPage, setTxnPage] = useState(1); 

    useEffect(() => {
        if (activeMainTab !== searchParams.get('tab')) {
            setSearchParams({ tab: activeMainTab });
        }
    }, [activeMainTab, searchParams, setSearchParams]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeMainTab) {
            setActiveMainTab(tab);
        }
    }, [searchParams]);

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
            const [profile, historyData, reqs] = await Promise.all([
                paymentsService.getProfile().catch(() => null),
                paymentsService.getTransactionHistory().catch(() => []),
                paymentsService.getMyCheckoutRequests().catch(() => [])
            ]);
            setPaymentProfile(profile);
            // Use transaction history which has proper IDs for reversal
            const txns = Array.isArray(historyData) ? historyData : (historyData?.results || []);
            setTransactions(txns);
            setCheckoutRequests(Array.isArray(reqs) ? reqs : (reqs?.results || []));
        } catch (error) {
            console.error('Error loading payment data:', error);
            // Fallback to regular transactions endpoint
            try {
                const txns = await paymentsService.getTransactions();
                setTransactions(Array.isArray(txns) ? txns : (txns?.results || []));
            } catch (e) {
                console.error('Fallback transaction fetch also failed:', e);
            }
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
        : filter === 'group_transaction'
            ? transactions.filter(t => t.transaction_details?.group_id)
            : filter === 'investment'
                ? transactions.filter(t => t.transaction_type === 'investment' || t.transaction_type === 'bid')
                : transactions.filter(t => t.transaction_type === filter);


    const handleReviewRequest = async (groupId, requestId, action) => {
        try {
            if (action === 'approve') {
                await paymentsService.approveCheckoutRequest(groupId, requestId);
            } else {
                await paymentsService.rejectCheckoutRequest(groupId, requestId);
            }
            loadData();
        } catch (error) {
            console.error('Error reviewing request:', error);
            alert(error.response?.data?.error || 'Failed to review request');
        }
    };

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
                        onClick={() => navigate('/payments/reverse-transaction')}
                        className="border-theme hover:border-red-500 hover:bg-red-50 text-red-600"
                    >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Reverse
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
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/kitties')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        My Kitties
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

            {/* Main Tabs UI */}
            <div className="flex border-b border-theme mb-4">
                <button
                    onClick={() => setActiveMainTab('transactions')}
                    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeMainTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                >
                    Transactions
                </button>
                <button
                    onClick={() => setActiveMainTab('approvals')}
                    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeMainTab === 'approvals' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'} flex items-center gap-2`}
                >
                    Pending Approvals
                    {checkoutRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {checkoutRequests.filter(r => r.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            {activeMainTab === 'transactions' && (
                <>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'purchase', 'deposit', 'withdrawal', 'transfer', 'group_transaction', 'investment', 'donation'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setTxnPage(1); }}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-elevated text-secondary border border-theme hover:bg-secondary/5'
                                    }`}
                            >
                                {f === 'group_transaction' ? 'Group Transactions' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-20">
                            <DollarSign className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-primary mb-2">No transactions found</h3>
                            <p className="text-secondary mb-4">
                                {filter === 'all' ? "You haven't made any transactions yet" : `No ${filter} transactions`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map((txn, idx) => {
                                const isExpanded = expandedTxnId === txn.id;
                                return (
                                    <Card
                                        key={idx}
                                        className={`transition-all duration-300 overflow-hidden border ${isExpanded ? 'border-primary shadow-md' : 'hover:shadow-md border-theme'}`}
                                    >
                                        <CardBody className="p-0">
                                            <div
                                                className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                                                onClick={() => setExpandedTxnId(isExpanded ? null : txn.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        txn.direction === 'received' ? 'bg-green-500/10' :
                                                        txn.direction === 'sent' ? 'bg-red-500/10' :
                                                        txn.transaction_type === 'deposit' ? 'bg-green-500/10' :
                                                        txn.transaction_type === 'withdrawal' ? 'bg-red-500/10' :
                                                        txn.transaction_type === 'transfer' ? 'bg-blue-500/10' :
                                                        txn.transaction_type === 'purchase' && txn.transaction_details?.group_id ? 'bg-primary-600/10' :
                                                        txn.transaction_type === 'purchase' ? 'bg-amber-500/10' :
                                                        txn.transaction_type === 'group_transaction' ? 'bg-primary-600/10' :
                                                        txn.transaction_type === 'investment' ? 'bg-amber-500/10' :
                                                        'bg-secondary/10'
                                                    }`}>
                                                        {txn.direction === 'received' ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> :
                                                         txn.direction === 'sent' ? <ArrowUpCircle className="w-5 h-5 text-red-600" /> :
                                                         txn.transaction_type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> :
                                                         txn.transaction_type === 'withdrawal' ? <ArrowUpCircle className="w-5 h-5 text-red-600" /> :
                                                         txn.transaction_type === 'transfer' ? <ArrowLeftRight className="w-5 h-5 text-blue-600" /> :
                                                         txn.transaction_type === 'purchase' ? <ShoppingCart className={`w-5 h-5 ${txn.transaction_details?.group_id ? 'text-primary' : 'text-amber-600'}`} /> :
                                                         txn.transaction_type === 'group_transaction' ? <Users className="w-5 h-5 text-primary" /> :
                                                         txn.transaction_type === 'investment' ? <TrendingUp className="w-5 h-5 text-amber-600" /> :
                                                         <DollarSign className="w-5 h-5 text-secondary" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <h4 className="font-bold text-primary truncate">
                                                            {txn.transaction_details?.group_name || txn.group_name ? (
                                                                <Link to={`/payments/groups/${txn.transaction_details?.group_id || txn.group_id}`} className="hover:underline" onClick={e => e.stopPropagation()}>
                                                                    {txn.transaction_details?.group_name || txn.group_name}
                                                                </Link>
                                                            ) : txn.transaction_type === 'group_transaction' ? (
                                                                <span>Group Transaction</span>
                                                            ) : txn.transaction_type === 'purchase' && (txn.transaction_details?.group_id || txn.group_id) ? (
                                                                <span>Group Purchase</span>
                                                            ) : txn.transaction_type === 'purchase' ? (
                                                                <span>Purchase</span>
                                                            ) : (
                                                                txn.transaction_category || (txn.transaction_type ? txn.transaction_type.charAt(0).toUpperCase() + txn.transaction_type.slice(1) : 'Transaction')
                                                            )}
                                                        </h4>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            txn.status === 'completed' || txn.status === 'completed' ? 'bg-green-500/10 text-green-700' :
                                                            txn.status === 'pending' ? 'bg-amber-500/10 text-amber-700' :
                                                            txn.status === 'failed' ? 'bg-red-500/10 text-red-700' :
                                                            'bg-blue-500/10 text-blue-700'
                                                        }`}>
                                                            {txn.status === 'completed' ? <CheckCircle size={10} /> : txn.status === 'pending' ? <Clock size={10} /> : null}
                                                            {(txn.status || 'pending').charAt(0).toUpperCase() + (txn.status || 'pending').slice(1)}
                                                        </span>
                                                        {txn.transaction_type === 'group_transaction' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600/10 text-primary-700 border border-primary-600/20">
                                                                <Users size={10} /> Group
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} /> {formatDate(txn.created_at)}
                                                        </span>
                                                        {txn.transaction_details?.recipient_name && (
                                                            <span className="flex items-center gap-1">
                                                                To: <span className="font-medium text-primary">{txn.transaction_details.recipient_name}</span>
                                                            </span>
                                                        )}
                                                        {txn.transaction_details?.initiator_name && (
                                                            <span className="flex items-center gap-1">
                                                                From: <span className="font-medium text-primary">{txn.transaction_details.initiator_name}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold text-lg ${txn.direction === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {txn.direction === 'received' ? '+' : '-'}{formatMoneySimple(parseFloat(txn.amount))}
                                                    </span>
                                                    {txn.direction === 'received' && (txn.initiator_name || txn.sender_name) && (
                                                        <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                            From {txn.initiator_name || txn.sender_name}
                                                        </span>
                                                    )}
                                                    {txn.direction === 'sent' && (txn.recipient_name || txn.recipient_name) && (
                                                        <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                            To {txn.recipient_name || txn.recipient_name}
                                                        </span>
                                                    )}
                                                    {txn.transaction_type === 'group_transaction' && (txn.transaction_details?.group_id || txn.group_id) && (
                                                        <span className="text-xs text-white bg-primary-600 px-2 py-0.5 rounded-full border border-primary-700">
                                                            Group
                                                        </span>
                                                    )}
                                                    {txn.transaction_type === 'purchase' && (txn.transaction_details?.group_id || txn.group_id) && (
                                                        <span className="text-xs text-white bg-primary-600 px-2 py-0.5 rounded-full border border-primary-700">
                                                            Group Purchase
                                                        </span>
                                                    )}
                                                    {txn.transaction_type === 'purchase' && !txn.transaction_details?.group_id && !txn.group_id && (
                                                        <span className="text-xs text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                            Purchase
                                                        </span>
                                                    )}
                                                    {txn.transaction_type === 'investment' && (
                                                        <span className="text-xs text-secondary bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-700">
                                                            Investment
                                                        </span>
                                                    )}
                                                    {txn.transaction_type === 'donation' && (
                                                        <span className="text-xs text-secondary bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 text-pink-700">
                                                            Donation
                                                        </span>
                                                    )}
                                                    <ChevronRight size={20} className={`text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-theme bg-secondary/5 p-5 animate-in slide-in-from-top-2 duration-200">
                                                    {txn.description && (
                                                        <p className="text-sm text-secondary mb-4">{txn.description}</p>
                                                    )}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Transaction ID</p>
                                                            <p className="font-medium text-primary font-mono text-xs">{txn.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Type</p>
                                                            <p className="font-medium text-primary capitalize">{txn.transaction_type || 'Unknown'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Status</p>
                                                            <p className="font-medium text-primary capitalize">{txn.status || 'pending'}</p>
                                                        </div>
                                                        {txn.transaction_category && (
                                                            <div>
                                                                <p className="text-xs text-secondary mb-1">Category</p>
                                                                <p className="font-medium text-primary">{txn.transaction_category}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Amount</p>
                                                            <p className={`font-semibold ${txn.direction === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {txn.direction === 'received' ? '+' : '-'}{formatMoneySimple(parseFloat(txn.amount))}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Date</p>
                                                            <p className="font-medium text-primary">{formatDate(txn.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    {txn.transaction_details && Object.keys(txn.transaction_details).length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-theme">
                                                            <p className="text-xs text-secondary mb-2 font-medium">Details</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                                                {Object.entries(txn.transaction_details).map(([key, val]) => {
                                                                    if (!val || key === 'group_id' || key === 'group_name' || key === 'group_cover_photo') return null;
                                                                    return (
                                                                        <div key={key} className="bg-white/50 dark:bg-black/10 rounded-lg p-2">
                                                                            <p className="text-secondary capitalize">{key.replace(/_/g, ' ')}</p>
                                                                            <p className="font-medium text-primary mt-0.5 truncate">{String(val)}</p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {activeMainTab === 'approvals' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : checkoutRequests.length === 0 ? (
                        <Card>
                            <CardBody className="py-12 text-center">
                                <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-primary mb-1">No pending approvals</h3>
                                <p className="text-secondary">You don't have any checkout requests waiting for your approval right now.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        checkoutRequests.map((req) => (
                            <Card key={req.id}>
                                <CardBody className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <CreditCard className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-lg text-primary">
                                                        {formatMoneySimple(parseFloat(req.amount))}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        req.status === 'failed' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-secondary flex items-center gap-2 mt-2 flex-wrap">
                                                    <span>Requested by</span>
                                                    <div className="flex items-center gap-1.5 bg-secondary/5 pr-2 rounded-full border border-theme overflow-hidden">
                                                        {req.initiator_profile_picture ? (
                                                            <img src={req.initiator_profile_picture} alt="profile" className="w-6 h-6 object-cover" />
                                                        ) : (
                                                            <div className="w-6 h-6 bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                                {req.initiator_name ? req.initiator_name.charAt(0) : 'U'}
                                                            </div>
                                                        )}
                                                        {req.initiator_username ? (
                                                            <Link to={`/profile/${req.initiator_username}`} className="font-medium text-primary hover:underline text-xs">
                                                                {req.initiator_name}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-medium text-primary text-xs">{req.initiator_name || 'A member'}</span>
                                                        )}
                                                    </div>
                                                    <span>on {formatDate(req.created_at)}</span>
                                                    {req.group_name && (
                                                        <span className="text-xs ml-2 bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                            Group: <Link to={`/payments/groups/${req.group}`} className="hover:underline font-medium text-primary">{req.group_name}</Link>
                                                        </span>
                                                    )}
                                                </div>
                                                {req.recipient_info && (
                                                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-secondary/5 rounded-lg border border-theme inline-flex">
                                                        <span className="text-xs text-secondary font-medium">To:</span>
                                                        {req.recipient_info.profile_picture ? (
                                                            <img src={req.recipient_info.profile_picture} alt="recipient" className="w-5 h-5 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border border-theme bg-white flex items-center justify-center text-[10px] font-bold text-primary">
                                                                {req.recipient_info.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        {req.recipient_info.type === 'funding' && req.recipient_info.id ? (
                                                            <Link to={`/funding/business/${req.recipient_info.id}`} className="text-sm font-medium text-primary hover:underline hover:text-blue-600">
                                                                {req.recipient_info.name}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm font-medium text-primary">{req.recipient_info.name}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/5 rounded-lg p-3 text-sm">
                                        <ul className="list-disc list-inside text-secondary space-y-1">
                                            {req.items_payload?.map((item, idx) => (
                                                <li key={idx} className="line-clamp-1">
                                                    <span className="capitalize">{item.type}</span>: {item.name} (x{item.qty || 1})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-theme">
                                        <div className="text-sm">
                                            <span className="text-green-600 font-medium">Approvals: {req.approvals_count}</span>
                                            <span className="text-secondary mx-2">/</span>
                                            <span className="text-red-600 font-medium">Rejections: {req.rejections_count}</span>
                                            <span className="text-secondary mx-2">/</span>
                                            <span className="text-primary font-medium">Required: {req.total_members}</span>
                                        </div>
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleReviewRequest(req.group, req.id, 'reject')} className="border-red-500 text-red-600 hover:bg-red-50">
                                                    Reject
                                                </Button>
                                                <Button variant="primary" size="sm" onClick={() => handleReviewRequest(req.group, req.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const TransactionRow = ({ transaction }) => (
    <div className="p-4 flex items-center justify-between hover:bg-secondary/5 border-b border-theme last:border-0 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 overflow-hidden rounded-full flex items-center justify-center ${transaction.transaction_type === 'deposit' ? 'bg-green-500/10' :
                transaction.transaction_type === 'withdrawal' ? 'bg-red-500/10' :
                    'bg-blue-500/10'
                }`}>
                {transaction.transaction_details?.group_cover_photo ? (
                    <img src={transaction.transaction_details.group_cover_photo} alt={transaction.transaction_details.group_name} className="w-full h-full object-cover" />
                ) : (
                    <DollarSign className={`w-5 h-5 ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                        transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                            'text-blue-600'
                        }`} />
                )}
            </div>
            <div>
                <h4 className="font-medium text-primary flex items-center gap-2">
                    {transaction.transaction_details?.group_name ? (
                        <Link to={`/payments/groups/${transaction.transaction_details.group_id}`} className="hover:underline">
                            {transaction.transaction_details.group_name} Payment
                        </Link>
                    ) : (
                        <span className="capitalize">{transaction.transaction_type || 'Transaction'}</span>
                    )}
                </h4>
                <p className="text-sm text-secondary">
                    <span className="capitalize">
                        {transaction.transaction_details?.group_name ? 'Group Transaction' : 
                            (transaction.transaction_type === 'purchase' ? 'Individual Purchase' : 
                            transaction.transaction_type === 'group_transaction' ? 'Group Transaction' :
                            transaction.transaction_type === 'investment' || transaction.transaction_type === 'bid' ? 'Investment' :
                            transaction.transaction_type === 'donation' ? 'Donation' : 
                            transaction.transaction_type ? `${transaction.transaction_type} Transaction` : 'Transaction')}
                    </span> &bull; {formatDate(transaction.created_at)}
                </p>
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
