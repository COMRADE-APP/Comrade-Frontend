import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, CreditCard,
    ChevronRight, ChevronDown, Loader2, Calendar, Clock, CheckCircle, XCircle,
    AlertCircle, History, ArrowRightLeft, ShoppingBag, Landmark, Gift, Repeat
} from 'lucide-react';
import paymentsService from '../services/payments.service';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { formatMoneySimple } from '../utils/moneyUtils.jsx';

const STATUS_CONFIG = {
    completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
    failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    refunded: { label: 'Refunded', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: RefreshCw },
    reversed: { label: 'Reversed', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: RefreshCw },
    verified: { label: 'Verified', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle },
    settled: { label: 'Settled', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
};

const TYPE_CONFIG = {
    deposit: { icon: ArrowDownLeft, bg: 'bg-green-500/10', color: 'text-green-600', label: 'Deposit' },
    withdrawal: { icon: ArrowUpRight, bg: 'bg-red-500/10', color: 'text-red-600', label: 'Withdrawal' },
    transfer: { icon: ArrowRightLeft, bg: 'bg-blue-500/10', color: 'text-blue-600', label: 'Transfer' },
    purchase: { icon: ShoppingBag, bg: 'bg-purple-500/10', color: 'text-purple-600', label: 'Purchase' },
    contribution: { icon: Landmark, bg: 'bg-teal-500/10', color: 'text-teal-600', label: 'Contribution' },
    refund: { icon: RefreshCw, bg: 'bg-amber-500/10', color: 'text-amber-600', label: 'Refund' },
    reversal: { icon: RefreshCw, bg: 'bg-orange-500/10', color: 'text-orange-600', label: 'Reversal' },
    default: { icon: CreditCard, bg: 'bg-gray-500/10', color: 'text-gray-600', label: 'Payment' },
};

const TransactionHistory = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await paymentsService.getTransactionHistory();
            setTransactions(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTabs = () => [
        { id: 'all', label: 'All Transactions', icon: History },
        { id: 'money_in', label: 'Money In', icon: ArrowDownLeft },
        { id: 'money_out', label: 'Money Out', icon: ArrowUpRight },
        { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
        { id: 'reversed', label: 'Reversed', icon: RefreshCw },
    ];

    const getFilteredTransactions = () => {
        switch (activeTab) {
            case 'money_in':
                return transactions.filter(t => ['deposit', 'refund', 'reversal'].includes(t.transaction_type));
            case 'money_out':
                return transactions.filter(t => ['withdrawal', 'purchase', 'contribution'].includes(t.transaction_type));
            case 'transfers':
                return transactions.filter(t => t.transaction_type === 'transfer');
            case 'reversed':
                return transactions.filter(t => ['reversed', 'refunded'].includes(t.status));
            default:
                return transactions;
        }
    };

    const filtered = getFilteredTransactions();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const isPositive = (tx) => {
        return ['deposit', 'refund', 'reversal'].includes(tx.transaction_type) || tx.status === 'refunded';
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-secondary hover:text-primary mb-6">
                    <ArrowLeft size={18} /> Back
                </button>

                <h1 className="text-3xl font-bold text-primary flex items-center gap-3 mb-8">
                    <History /> Transaction History
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-elevated p-1 rounded-xl border border-theme overflow-x-auto">
                    {getTabs().map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex-1 justify-center ${
                                    activeTab === tab.id
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'text-secondary hover:text-primary hover:bg-secondary/10'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-green-500/20">
                        <CardBody className="p-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                                <ArrowDownLeft className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-xs text-secondary mb-1">Total In</p>
                            <p className="text-lg font-bold text-green-600">
                                {formatMoneySimple(
                                    transactions
                                        .filter(t => isPositive(t))
                                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                                )}
                            </p>
                        </CardBody>
                    </Card>
                    <Card className="border-red-500/20">
                        <CardBody className="p-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                                <ArrowUpRight className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-xs text-secondary mb-1">Total Out</p>
                            <p className="text-lg font-bold text-red-600">
                                {formatMoneySimple(
                                    transactions
                                        .filter(t => !isPositive(t))
                                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                                )}
                            </p>
                        </CardBody>
                    </Card>
                    <Card className="border-blue-500/20">
                        <CardBody className="p-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                                <Repeat className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-xs text-secondary mb-1">Transfers</p>
                            <p className="text-lg font-bold text-blue-600">
                                {transactions.filter(t => t.transaction_type === 'transfer').length}
                            </p>
                        </CardBody>
                    </Card>
                    <Card className="border-gray-500/20">
                        <CardBody className="p-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center mx-auto mb-2">
                                <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                            <p className="text-xs text-secondary mb-1">Pending</p>
                            <p className="text-lg font-bold text-gray-600">
                                {transactions.filter(t => t.status === 'pending').length}
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Transactions List */}
                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-secondary">Loading transactions...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Wallet className="w-16 h-16 text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-primary mb-2">No transactions found</h3>
                        <p className="text-secondary mb-4">
                            {activeTab === 'all' ? 'You haven\'t made any transactions yet' : `No ${activeTab} transactions`}
                        </p>
                        <Button variant="primary" onClick={() => navigate('/shop')}>Browse Services</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(transaction => {
                            const statusCfg = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
                            const StatusIcon = statusCfg.icon;
                            const typeCfg = TYPE_CONFIG[transaction.transaction_type] || TYPE_CONFIG.default;
                            const TypeIcon = typeCfg.icon;
                            const isIn = isPositive(transaction);

                            return (
                                <Card
                                    key={transaction.id}
                                    className={`transition-all duration-300 overflow-hidden border ${
                                        expandedId === transaction.id ? 'border-primary shadow-md' : 'hover:shadow-md border-theme'
                                    }`}
                                >
                                    <CardBody className="p-0">
                                        <div
                                            className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                                            onClick={() => toggleExpand(transaction.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <div className={`w-10 h-10 rounded-full ${typeCfg.bg} flex items-center justify-center`}>
                                                        <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                                                    </div>
                                                    <h4 className="font-bold text-primary capitalize">
                                                        {typeCfg.label}
                                                    </h4>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                                                        <StatusIcon size={12} />
                                                        {statusCfg.label}
                                                    </span>
                                                    {transaction.can_be_reversed && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                                                            <RefreshCw size={12} /> Reversible
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-secondary">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(transaction.created_at)}
                                                    </span>
                                                    {transaction.recipient_email && (
                                                        <span className="flex items-center gap-1">
                                                            <ArrowRightLeft className="w-4 h-4" />
                                                            To: {transaction.recipient_name || transaction.recipient_email}
                                                        </span>
                                                    )}
                                                    {transaction.sender_email && !transaction.recipient_email && (
                                                        <span className="flex items-center gap-1">
                                                            <ArrowDownLeft className="w-4 h-4" />
                                                            From: {transaction.sender_name || transaction.sender_email}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <CreditCard className="w-4 h-4" />
                                                        {transaction.payment_option || 'Wallet'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className={`font-bold text-xl ${isIn ? 'text-green-600' : 'text-primary'}`}>
                                                        {isIn ? '+' : '-'} {formatMoneySimple(transaction.amount)}
                                                    </p>
                                                    {transaction.exchange_rate && transaction.exchange_rate !== 1 && (
                                                        <p className="text-xs text-tertiary">
                                                            Rate: {transaction.exchange_rate.toFixed(4)}
                                                        </p>
                                                    )}
                                                </div>
                                                <button className="p-2 text-secondary hover:text-primary transition-transform">
                                                    {expandedId === transaction.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === transaction.id && (
                                            <div className="border-t border-theme bg-secondary/5 p-5 animate-in slide-in-from-top-2 duration-200">
                                                {/* Transaction Details */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-secondary mb-1">Transaction Code</p>
                                                        <p className="text-sm font-mono text-primary">{transaction.transaction_code}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-secondary mb-1">Category</p>
                                                        <p className="text-sm text-primary capitalize">{transaction.transaction_category || transaction.transaction_type}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-secondary mb-1">Payment Type</p>
                                                        <p className="text-sm text-primary capitalize">{transaction.payment_type}</p>
                                                    </div>
                                                    {transaction.authorization_code && (
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Authorization</p>
                                                            <p className="text-sm font-mono text-primary truncate">{transaction.authorization_code.substring(0, 16)}...</p>
                                                        </div>
                                                    )}
                                                    {transaction.verification_code && (
                                                        <div>
                                                            <p className="text-xs text-secondary mb-1">Verification</p>
                                                            <p className="text-sm font-mono text-primary truncate">{transaction.verification_code.substring(0, 16)}...</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                {transaction.description && (
                                                    <div className="mb-4 p-3 bg-elevated rounded-lg border border-theme">
                                                        <p className="text-xs text-secondary mb-1">Description</p>
                                                        <p className="text-sm text-primary">{transaction.description}</p>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-4 border-t border-theme">
                                                    {transaction.can_be_reversed && (
                                                        <Button variant="outline" size="sm" className="text-xs">
                                                            <RefreshCw size={14} /> Reverse Transaction
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <History size={14} /> View Receipt
                                                    </Button>
                                                    {transaction.status === 'completed' && (
                                                        <Button variant="outline" size="sm" className="text-xs">
                                                            <Gift size={14} /> Get Support
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;
