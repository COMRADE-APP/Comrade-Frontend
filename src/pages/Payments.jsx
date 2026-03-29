import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
            const [profile, txns, reqs] = await Promise.all([
                paymentsService.getProfile().catch(() => null),
                paymentsService.getTransactions().catch(() => []),
                paymentsService.getMyCheckoutRequests().catch(() => [])
            ]);
            setPaymentProfile(profile);
            setTransactions(Array.isArray(txns) ? txns : (txns?.results || []));
            setCheckoutRequests(Array.isArray(reqs) ? reqs : (reqs?.results || []));
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
        : filter === 'group_transaction'
            ? transactions.filter(t => t.transaction_details?.group_name)
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
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'purchase', 'deposit', 'withdrawal', 'transfer', 'group_transaction', 'investment', 'donation'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-elevated text-secondary border border-theme hover:bg-secondary/5'
                                    }`}
                            >
                                {f === 'group_transaction' ? 'Group Transactions' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                                                        KES {parseFloat(req.amount).toFixed(2)}
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
