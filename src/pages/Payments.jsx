import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { 
    CreditCard, DollarSign, Download, Wallet, Plus, Users, ArrowDownCircle, ArrowUpCircle, 
    ArrowDownLeft, ArrowLeftRight, PiggyBank, CheckCircle, Send, AlertTriangle, TrendingUp, 
    Filter, ChevronRight, ChevronDown, Clock, RefreshCw, ShoppingCart, Heart, Building, 
    Gift, BarChart3, Zap, Coins, BookOpen, ShieldCheck, Landmark, Smartphone, 
    CheckCircle2, Circle, Settings, Calendar, Briefcase, Shield 
} from 'lucide-react';
import paymentsService from '../services/payments.service';
import { paymentProcessingService } from '../services/paymentProcessing.service';
import { formatDate } from '../utils/dateFormatter';
import { formatMoneySimple } from '../utils/moneyUtils.jsx';
import { ROUTES } from '../constants/routes';
import { useToast } from '../contexts/ToastContext';

const AUTOMATION_TYPES = [
    { key: 'contribute', label: 'Contribute', icon: Coins, color: 'emerald', desc: 'Auto-contribute to group rounds or kitties' },
    { key: 'save', label: 'Save', icon: PiggyBank, color: 'blue', desc: 'Auto-save to a piggy bank target' },
    { key: 'purchase', label: 'Purchase', icon: ShoppingCart, color: 'purple', desc: 'Auto-purchase products on schedule' },
    { key: 'course', label: 'Courses', icon: BookOpen, color: 'amber', desc: 'Auto-pay for courses and learning paths' },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'amber', desc: 'Auto-withdraw to your wallet' },
    { key: 'loan_repayment', label: 'Loan Repayment', icon: Landmark, color: 'rose', desc: 'Auto-repay group or subscribed loans' },
    { key: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'sky', desc: 'Auto-pay insurance premiums' },
    { key: 'bills', label: 'Bills & Airtime', icon: Smartphone, color: 'orange', desc: 'Auto-pay bills, utilities, and airtime' },
    { key: 'investment', label: 'Investment', icon: TrendingUp, color: 'indigo', desc: 'Auto-invest in group or external opportunities' },
    { key: 'donation', label: 'Donation', icon: Heart, color: 'pink', desc: 'Auto-donate to campaigns or charities' },
];

const getTransactionTitle = (txn) => {
    const type = txn.transaction_type || txn.type || '';
    const hasGroup = !!(txn.group_id || txn.group_name || txn.transaction_details?.group_id || txn.transaction_details?.group_name);
    const direction = txn.direction || '';

    switch (type) {
        case 'contribution':
            return hasGroup ? 'Group Contribution' : 'Contribution';
        case 'piggy_bank_contribution':
        case 'savings_deposit':
            return 'Piggy Bank Contribution';
        case 'piggy_bank_withdrawal':
        case 'savings_withdrawal':
            return 'Piggy Bank Withdrawal';
        case 'withdrawal':
            return hasGroup ? 'Group Withdrawal' : 'Withdrawal';
        case 'payout':
            return hasGroup ? 'Group Benefits' : 'Payout';
        case 'purchase':
            return hasGroup ? 'Group Purchase' : 'Purchase';
        case 'transfer':
            return 'Transfer';
        case 'loan_repayment':
            return 'Loan Payment';
        case 'loan_disbursement':
            return direction === 'received' ? 'Loan Received' : 'Loan Payment';
        case 'deposit':
            return 'Deposit';
        case 'bill_payment':
            return 'Bill Payment';
        case 'escrow_release':
            return 'Escrow Release';
        case 'escrow_refund':
            return 'Escrow Refund';
        case 'insurance_premium':
            return 'Insurance Premium';
        case 'insurance_claim_payout':
            return 'Insurance Payout';
        case 'kitty_withdrawal':
            return 'Kitty Withdrawal';
        case 'investment_withdrawal':
            return 'Investment Withdrawal';
        case 'fee':
            return 'Fee Payment';
        case 'refund':
            return 'Refund';
        case 'reversal':
            return 'Reversal';
        default:
            if (type) {
                return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            return 'Transaction';
    }
};

const Payments = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    
    const [paymentProfile, setPaymentProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [automations, setAutomations] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
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
            const [profile, historyData, reqs, autos] = await Promise.all([
                paymentsService.getProfile().catch(() => null),
                paymentsService.getTransactionHistory().catch(() => []),
                paymentsService.getMyPendingApprovals().catch(() => []),
                paymentsService.getUserAutomations().catch(() => [])
            ]);
            setPaymentProfile(profile);
            // Use transaction history which has proper IDs for reversal
            const txns = Array.isArray(historyData) ? historyData : (historyData?.results || []);
            setTransactions(txns);
            setPendingApprovals(Array.isArray(reqs) ? reqs : (reqs?.results || []));
            setAutomations(Array.isArray(autos) ? autos : (autos?.results || []));
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

    const handleToggleAutomation = async (id, currentStatus) => {
        try {
            const updated = await paymentsService.toggleUserAutomation(id, !currentStatus);
            setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: updated.is_active, status: updated.status } : a));
        } catch (error) {
            console.error('Error toggling automation:', error);
            alert(error.response?.data?.error || 'Failed to toggle automation');
        }
    };

    const handleCancelAutomation = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this automation?")) return;
        try {
            await paymentsService.cancelUserAutomation(id);
            setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: false, status: 'rejected' } : a));
        } catch (error) {
            console.error('Error cancelling automation:', error);
            alert(error.response?.data?.error || 'Failed to cancel automation');
        }
    };

    const getTypeConfig = (type) => AUTOMATION_TYPES.find(t => t.key === type) || AUTOMATION_TYPES[0];

    const filteredTransactions = filter === 'all'
        ? transactions
        : filter === 'group_transaction'
            ? transactions.filter(t => t.transaction_details?.group_id)
            : filter === 'investment'
                ? transactions.filter(t => t.transaction_type === 'investment' || t.transaction_type === 'bid')
                : transactions.filter(t => t.transaction_type === filter);


    const handleReviewRequest = async (req, action) => {
        try {
            const { request_type, group_id, id, target_id } = req;
            let response;
            
            if (request_type === 'checkout') {
                if (action === 'approve') response = await paymentsService.approveCheckoutRequest(group_id, id);
                else response = await paymentsService.rejectCheckoutRequest(group_id, id);
            } else if (request_type === 'withdrawal') {
                // Assuming standard endpoints, you might need to adapt these methods in your service
                response = await api.post(`/api/payments/withdrawal-requests/${id}/${action}/`);
            } else if (request_type === 'piggy_bank') {
                response = await api.post(`/api/payments/targets/${target_id}/vote_conversion/${id}/`, { vote: action });
            } else if (request_type === 'loan') {
                response = await api.post(`/api/payments/loan-applications/${id}/${action}/`);
            } else if (request_type === 'group_invitation') {
                const endpointAction = action === 'approve' ? 'accept' : 'decline';
                response = await api.post(`/api/payments/invitations/${id}/${endpointAction}/`);
            } else if (request_type === 'escrow') {
                const endpointAction = action === 'approve' ? 'release_funds' : 'dispute';
                response = await api.post(`/api/payments/escrow/${id}/${endpointAction}/`);
            } else if (request_type === 'automation') {
                response = await api.post(`/api/payments/groups/${group_id}/vote_automation/`, { automation_id: id, vote: action });
            } else {
                throw new Error("Unknown request type");
            }
            
            toast({
                title: "Success",
                description: `Successfully processed ${request_type} request.`,
                status: "success",
            });
            loadData();
        } catch (error) {
            console.error('Error reviewing request:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || 'Failed to review request',
                status: "error",
            });
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
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payments/create-automation')}
                        className="border-theme hover:border-primary hover:bg-primary/5 text-primary"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Automations
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
                    {pendingApprovals.length > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {pendingApprovals.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveMainTab('automations')}
                    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeMainTab === 'automations' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'} flex items-center gap-2`}
                >
                    Automations
                    {automations.filter(a => a.is_active).length > 0 && (
                        <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {automations.filter(a => a.is_active).length}
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
                                                            {getTransactionTitle(txn)}
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
                                                        {(txn.transaction_details?.group_name || txn.group_name) && (
                                                            <span className="flex items-center gap-1">
                                                                Group: <Link to={`/payments/groups/${txn.transaction_details?.group_id || txn.group_id}`} className="font-medium text-primary hover:underline" onClick={e => e.stopPropagation()}>{txn.transaction_details?.group_name || txn.group_name}</Link>
                                                            </span>
                                                        )}
                                                        {txn.transaction_type === 'withdrawal' ? (
                                                            <>
                                                                <span className="flex items-center gap-1">
                                                                    From: <span className="font-medium text-primary">{txn.group_name || txn.transaction_details?.group_name || 'Wallet'}</span>
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    To: <span className="font-medium text-primary">{(txn.group_name || txn.transaction_details?.group_name) ? 'Wallet' : (txn.payment_option || txn.transaction_details?.payment_option || 'External')}</span>
                                                                </span>
                                                            </>
                                                        ) : txn.transaction_type === 'deposit' ? (
                                                            <>
                                                                <span className="flex items-center gap-1">
                                                                    From: <span className="font-medium text-primary">{txn.payment_option || txn.transaction_details?.payment_option || 'External'}</span>
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    To: <span className="font-medium text-primary">Wallet</span>
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {txn.transaction_details?.initiator_name && (txn.transaction_details?.initiator_name !== txn.transaction_details?.recipient_name) && (
                                                                    <span className="flex items-center gap-1">
                                                                        From: <span className="font-medium text-primary">{txn.transaction_details.initiator_name}</span>
                                                                    </span>
                                                                )}
                                                                {txn.transaction_details?.recipient_name && (txn.transaction_details?.initiator_name !== txn.transaction_details?.recipient_name) && (
                                                                    <span className="flex items-center gap-1">
                                                                        To: <span className="font-medium text-primary">{txn.transaction_details.recipient_name}</span>
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold text-lg ${txn.direction === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {txn.direction === 'received' ? '+' : '-'}{formatMoneySimple(parseFloat(txn.amount))}
                                                    </span>
                                                    {txn.transaction_type === 'withdrawal' ? (
                                                         <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                             To {((txn.group_name || txn.transaction_details?.group_name) || txn.payment_option === 'comrade_balance' || txn.transaction_details?.payment_option === 'comrade_balance') ? 'Wallet' : (txn.payment_option || txn.transaction_details?.payment_option || 'External')}
                                                         </span>
                                                     ) : txn.transaction_type === 'deposit' ? (
                                                         <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                             From {((txn.group_name || txn.transaction_details?.group_name) || txn.payment_option === 'comrade_balance' || txn.transaction_details?.payment_option === 'comrade_balance') ? 'Wallet' : (txn.payment_option || txn.transaction_details?.payment_option || 'External')}
                                                         </span>
                                                     ) : (
                                                         <>
                                                             {txn.direction === 'received' && (txn.initiator_name || txn.sender_name) && (txn.initiator_name !== txn.recipient_name) && (
                                                                 <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                                     From {txn.initiator_name || txn.sender_name}
                                                                 </span>
                                                             )}
                                                             {txn.direction === 'sent' && (txn.recipient_name || txn.recipient_name) && (txn.initiator_name !== txn.recipient_name) && (
                                                                 <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                                     To {txn.recipient_name || txn.recipient_name}
                                                                 </span>
                                                             )}
                                                         </>
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
                                                                     const duplicates = ['id', 'transaction_code', 'transaction_type', 'transaction_category', 'amount', 'status', 'description', 'payment_profile', 'recipient_profile', 'sender_email', 'recipient_email', 'initiator_name', 'recipient_name', 'direction', 'group_id', 'group_name', 'group_cover_photo', 'created_at'];
                                                                     if (!val || duplicates.includes(key)) return null;
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
                    ) : pendingApprovals.length === 0 ? (
                        <Card>
                            <CardBody className="py-12 text-center">
                                <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-primary mb-1">No pending approvals</h3>
                                <p className="text-secondary">You don't have any items waiting for your approval right now.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        pendingApprovals.map((req) => (
                            <Card key={req.id}>
                                <CardBody className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 ${
                                                req.request_type === 'checkout' ? 'bg-blue-500/10 text-blue-600' :
                                                req.request_type === 'withdrawal' ? 'bg-orange-500/10 text-orange-600' :
                                                req.request_type === 'piggy_bank' ? 'bg-pink-500/10 text-pink-600' :
                                                req.request_type === 'loan' ? 'bg-purple-500/10 text-purple-600' :
                                                req.request_type === 'escrow' ? 'bg-teal-500/10 text-teal-600' :
                                                req.request_type === 'group_invitation' ? 'bg-green-500/10 text-green-600' :
                                                'bg-gray-500/10 text-gray-600'
                                            }`}>
                                                {req.request_type === 'checkout' ? <CreditCard className="w-6 h-6" /> :
                                                 req.request_type === 'withdrawal' ? <ArrowUpCircle className="w-6 h-6" /> :
                                                 req.request_type === 'piggy_bank' ? <TrendingUp className="w-6 h-6" /> :
                                                 req.request_type === 'loan' ? <Briefcase className="w-6 h-6" /> :
                                                 req.request_type === 'escrow' ? <Shield className="w-6 h-6" /> :
                                                 <CheckCircle className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-lg text-primary">
                                                        {req.title} {req.amount !== "0.00" && `- ${formatMoneySimple(parseFloat(req.amount))}`}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700`}>
                                                        {req.request_type.toUpperCase().replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-secondary flex items-center gap-2 mt-2 flex-wrap">
                                                    <span>From</span>
                                                    <span className="font-medium text-primary text-xs">{req.initiator_name || 'System'}</span>
                                                    <span>on {formatDate(req.created_at)}</span>
                                                    {req.group_name && (
                                                        <span className="text-xs ml-2 bg-secondary/10 px-2 py-0.5 rounded-full border border-theme">
                                                            Group: <Link to={`/payments/groups/${req.group_id}`} className="hover:underline font-medium text-primary">{req.group_name}</Link>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {req.metadata && Object.keys(req.metadata).length > 0 && (
                                        <div className="bg-secondary/5 rounded-lg p-3 text-sm mb-4">
                                            {req.request_type === 'checkout' && Array.isArray(req.metadata.items_payload) ? (
                                                <ul className="list-disc list-inside text-secondary space-y-1">
                                                    {req.metadata.items_payload.map((item, idx) => (
                                                        <li key={idx} className="line-clamp-1">
                                                            <span className="capitalize">{item?.type || 'item'}</span>: {item?.name || 'Unknown'} (x{item?.qty || 1})
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="text-secondary">
                                                    {Object.entries(req.metadata).map(([key, value]) => (
                                                        <p key={key}><span className="capitalize font-medium">{key.replace('_', ' ')}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-theme">
                                        <div className="text-sm">
                                            {req.total_members > 1 && (
                                                <>
                                                    <span className="text-green-600 font-medium">Approvals: {req.approvals_count}</span>
                                                    <span className="text-secondary mx-2">/</span>
                                                    <span className="text-red-600 font-medium">Rejections: {req.rejections_count}</span>
                                                    <span className="text-secondary mx-2">/</span>
                                                    <span className="text-primary font-medium">Required: {req.total_members}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleReviewRequest(req, 'reject')} className="border-red-500 text-red-600 hover:bg-red-50">
                                                {req.request_type === 'group_invitation' ? 'Decline' : req.request_type === 'escrow' ? 'Dispute' : 'Reject'}
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={() => handleReviewRequest(req, 'approve')} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                                                {req.request_type === 'group_invitation' ? 'Accept' : req.request_type === 'escrow' ? 'Release Funds' : 'Approve'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeMainTab === 'automations' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Smart Automations
                            </h3>
                            <p className="text-sm text-secondary">Automate contributions, savings, purchases, and withdrawals.</p>
                        </div>
                        <Button variant="primary" size="sm" className="gap-2 !bg-emerald-600" onClick={() => navigate('/payments/create-automation')}>
                            <Plus className="w-4 h-4 mr-1" /> New Automation
                        </Button>
                    </div>

                    {/* Feature Highlights / Category Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {AUTOMATION_TYPES.map(t => {
                            const Icon = t.icon;
                            const count = automations.filter(a => a.automation_type === t.key).length;
                            const isSelected = selectedCategory === t.key;
                            return (
                                <div 
                                    key={t.key} 
                                    onClick={() => setSelectedCategory(isSelected ? null : t.key)}
                                    className={`bg-${t.color}-50 dark:bg-${t.color}-900/10 border ${
                                        isSelected 
                                            ? `border-${t.color}-500 ring-2 ring-${t.color}-500/20` 
                                            : `border-${t.color}-100 dark:border-${t.color}-800`
                                    } rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:shadow-sm transition-all`}
                                >
                                    <div className={`p-2 bg-${t.color}-100 dark:bg-${t.color}-800/30 rounded-lg text-${t.color}-600`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-xs font-bold text-${t.color}-900 dark:text-${t.color}-100`}>{t.label}</h4>
                                        <p className={`text-[10px] text-${t.color}-700 dark:text-${t.color}-300`}>{count} active</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto rounded-full"></div></div>
                    ) : automations.length === 0 ? (
                        <Card>
                            <CardBody className="py-12 text-center">
                                <RefreshCw className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-primary mb-1">No automations active</h3>
                                <p className="text-secondary">Set up recurring savings, contributions, or purchase plans to automate your wealth.</p>
                                <Button variant="primary" className="mt-4" onClick={() => navigate('/payments/create-automation')}>
                                    Create First Automation
                                </Button>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* Filter Summary */}
                            {selectedCategory && (
                                <div className="flex items-center justify-between bg-secondary/5 px-4 py-2 rounded-lg text-xs text-secondary">
                                    <span>Showing only <strong>{AUTOMATION_TYPES.find(c => c.key === selectedCategory)?.label}</strong> automations</span>
                                    <button onClick={() => setSelectedCategory(null)} className="font-bold text-primary hover:underline">Clear Filter</button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {automations
                                    .filter(auto => !selectedCategory || auto.automation_type === selectedCategory)
                                    .map((auto) => {
                                        const cfg = getTypeConfig(auto.automation_type || 'contribute');
                                        const TypeIcon = cfg.icon;

                                        return (
                                            <Card key={auto.id} className={`border-theme hover:border-${cfg.color}-300 transition-colors`}>
                                                <CardBody className="p-5 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                        <TypeIcon className="w-24 h-24" />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2.5 rounded-xl ${auto.is_active ? `bg-${cfg.color}-100 text-${cfg.color}-600` : 'bg-gray-100 text-gray-500'}`}>
                                                                <TypeIcon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-tertiary font-bold uppercase tracking-wider mb-0.5">
                                                                    {cfg.label} Automation
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    {auto.is_active ? (
                                                                        <span className={`flex items-center gap-1 text-xs text-${cfg.color}-600 font-medium bg-${cfg.color}-50 px-2 py-0.5 rounded-md border border-${cfg.color}-100`}>
                                                                            <CheckCircle2 className="w-3 h-3" /> Active
                                                                        </span>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                                                            <Circle className="w-3 h-3" /> Paused
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action / Settings Button */}
                                                        <button 
                                                            onClick={() => handleToggleAutomation(auto.id, auto.is_active)}
                                                            className="text-secondary hover:text-primary transition-colors p-1"
                                                            title={auto.is_active ? 'Pause' : 'Activate'}
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-theme relative z-10">
                                                        <div>
                                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Amount</p>
                                                            <p className="text-lg font-bold text-primary">{formatMoneySimple(parseFloat(auto.amount))}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Frequency</p>
                                                            <p className="text-sm font-medium text-secondary capitalize">{auto.frequency}</p>
                                                        </div>
                                                    </div>

                                                    {/* Additional Info & Cancel Action */}
                                                    <div className="mt-4 flex items-center justify-between text-xs relative z-10 gap-4">
                                                        <div className="flex items-center gap-1.5 text-secondary">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>Next Run: <strong>{auto.next_contribution_date ? formatDate(auto.next_contribution_date) : (auto.frequency === 'monthly' ? `Day ${auto.execution_day}` : 'Upcoming')}</strong></span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {auto.group_name && (
                                                                <span className="text-[10px] bg-secondary/10 px-2 py-0.5 rounded text-secondary font-medium max-w-[120px] truncate" title={auto.group_name}>
                                                                    {auto.group_name}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleCancelAutomation(auto.id)}
                                                                className="text-red-500 hover:text-red-700 font-semibold hover:underline"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        );
                                    })}
                            </div>
                        </div>
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