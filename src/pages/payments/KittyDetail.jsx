import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
    DollarSign, Users, Activity, Settings, RefreshCw,
    CheckCircle, Clock, XCircle, Download, Upload, Coins,
    PiggyBank, Target, ShieldCheck, BarChart3, Eye, EyeOff,
    PieChart, Heart, Building2, Store, Briefcase, X, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { formatDate } from '../../utils/dateFormatter';

const TYPE_CONFIG = {
    enterprise: { icon: Heart, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-500/10', text: 'text-pink-600' },
    venture: { icon: Building2, color: 'from-primary-500 to-primary-700', bg: 'bg-primary-500/10', text: 'text-primary-600' },
    shop: { icon: Store, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    business: { icon: Briefcase, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
};

const KittyDetail = () => {
    const { kittyId } = useParams();
    const navigate = useNavigate();
    const [kitty, setKitty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('analytics');
    const [txFilter, setTxFilter] = useState('all');
    const [transactions, setTransactions] = useState([]);
    const [loadingTxns, setLoadingTxns] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    useEffect(() => {
        const fetchKitty = async () => {
            setLoading(true);
            try {
                // Assuming we can fetch a single kitty or filter from list
                const res = await api.get('/api/payments/groups/kitties/');
                const currentKitty = res.data.find(k => k.id === kittyId);
                setKitty(currentKitty);
            } catch (error) {
                console.error("Failed to fetch kitty:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchKitty();
    }, [kittyId]);

    useEffect(() => {
        if (activeSection === 'transactions' && kitty) {
            const fetchTransactions = async () => {
                setLoadingTxns(true);
                try {
                    const res = await api.get(API_ENDPOINTS.KITTY_TRANSACTIONS(kitty.id));
                    setTransactions(res.data || []);
                } catch (error) {
                    console.error("Failed to fetch transactions:", error);
                } finally {
                    setLoadingTxns(false);
                }
            };
            fetchTransactions();
        }
    }, [activeSection, kitty]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!kitty) {
        return (
            <div className="text-center py-16">
                <p className="text-secondary">Kitty not found</p>
                <Button onClick={() => navigate('/payments/kitties')} className="mt-4">
                    Back to Kitties
                </Button>
            </div>
        );
    }

    const config = TYPE_CONFIG[kitty.type] || TYPE_CONFIG.business;
    const TypeIcon = config.icon;

    const sections = [
        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        { key: 'transactions', label: 'Transactions', icon: Activity },
        { key: 'actions', label: 'Actions', icon: Settings },
    ];

    const filteredTxns = txFilter === 'all'
        ? transactions
        : transactions.filter(t => t.type === txFilter);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/payments/kitties')}
                    className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Kitties</span>
                </button>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-secondary/10 rounded-full text-xs font-medium text-secondary">{kitty.entity_type}</span>
                    <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-xs font-medium text-emerald-600 capitalize">{kitty.status}</span>
                </div>
            </div>

            {/* Hero Card */}
            <div className={`bg-gradient-to-r ${config.color} p-8 rounded-3xl text-white shadow-xl overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                            <TypeIcon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{kitty.name}</h1>
                            <p className="text-white/80 text-sm mt-1 max-w-xl">{kitty.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-start md:items-end gap-2 md:gap-0">
                        <p className="text-white/70 text-sm md:text-right">Current Balance</p>
                        <p className="text-4xl font-bold">{formatMoneySimple(kitty.balance)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Total Inflow</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatMoneySimple(kitty.total_inflow)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Total Outflow</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatMoneySimple(kitty.total_outflow)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Investors</p>
                        <p className="text-2xl font-bold text-white mt-1">{kitty.investors_count || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Created On</p>
                        <p className="text-lg font-bold text-white mt-1">{formatDate(kitty.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Card className="border-theme overflow-hidden">
                <div className="flex border-b border-theme bg-elevated">
                    {sections.map(s => {
                        const SIcon = s.icon;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setActiveSection(s.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${activeSection === s.key ? 'text-primary' : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                <SIcon size={18} /> {s.label}
                                {activeSection === s.key && (
                                    <motion.div layoutId="kitty-detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {/* ===== ANALYTICS ===== */}
                    {activeSection === 'analytics' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                    <PieChart size={20} className="text-emerald-500" /> Monthly Cash Flow
                                </h3>
                                <div className="space-y-4">
                                    {kitty.monthly_data?.length > 0 ? (
                                        kitty.monthly_data.map((m, i) => {
                                            const maxMonthly = Math.max(...kitty.monthly_data.map(d => Math.max(d.inflow, d.outflow)), 1);
                                            return (
                                                <div key={i} className="flex items-center gap-4">
                                                    <span className="w-10 text-sm text-secondary font-medium">{m.month}</span>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-secondary/10 rounded-full h-3 overflow-hidden">
                                                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(m.inflow / maxMonthly) * 100}%` }} />
                                                            </div>
                                                            <span className="text-xs text-emerald-600 font-medium w-20 text-right">{formatMoneySimple(m.inflow)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-secondary/10 rounded-full h-3 overflow-hidden">
                                                                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(m.outflow / maxMonthly) * 100}%` }} />
                                                            </div>
                                                            <span className="text-xs text-rose-500 font-medium w-20 text-right">{formatMoneySimple(m.outflow)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 text-secondary text-sm">
                                            No monthly data available yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== TRANSACTIONS ===== */}
                    {activeSection === 'transactions' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <Activity size={20} className="text-primary" /> History
                                </h3>
                                <div className="flex gap-2">
                                    {['all', 'deposit', 'withdrawal'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setTxFilter(f)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${txFilter === f
                                                ? 'bg-primary text-white'
                                                : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                                }`}
                                        >
                                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loadingTxns ? (
                                <div className="flex justify-center py-8">
                                    <RefreshCw className="animate-spin text-primary" size={24} />
                                </div>
                            ) : filteredTxns.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTxns.map((tx, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'
                                                    }`}>
                                                    {tx.type === 'deposit'
                                                        ? <ArrowDownCircle size={20} className="text-emerald-600" />
                                                        : <ArrowUpCircle size={20} className="text-rose-500" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary text-sm">{tx.description || 'Transaction'}</p>
                                                    <p className="text-xs text-secondary">{formatDate(tx.created_at)}</p>
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {tx.type === 'deposit' ? '+' : '-'}{formatMoneySimple(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-secondary/5 rounded-xl border border-dashed border-theme">
                                    <Clock className="w-10 h-10 text-tertiary mx-auto mb-3" />
                                    <p className="text-secondary font-medium">No transactions found</p>
                                    <p className="text-xs text-tertiary mt-1">Activity will appear here after operations</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== ACTIONS ===== */}
                    {activeSection === 'actions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-theme hover:shadow-md transition-shadow">
                                <CardBody className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <ArrowUpCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">Withdraw Funds</h4>
                                            <p className="text-xs text-secondary">Transfer funds from kitty to your wallet</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setShowWithdrawModal(true)}
                                        className="w-full bg-primary hover:bg-primary-600"
                                    >
                                        Initiate Withdrawal
                                    </Button>
                                </CardBody>
                            </Card>

                            <Card className="border-theme hover:shadow-md transition-shadow">
                                <CardBody className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">Connect Account</h4>
                                            <p className="text-xs text-secondary">Link external accounts or gateways</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                    >
                                        Manage Connections
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default KittyDetail;
