/**
 * Kitty Management Page
 * Manage fund pools (kitties) for enterprises, shops, ventures, and businesses.
 * Includes analytics, transaction records, withdraw, and connection settings.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
    Building2, Store, Briefcase, Heart, Settings, ChevronRight,
    DollarSign, Eye, EyeOff, Download, Upload, Link2, CreditCard,
    Smartphone, Landmark, BarChart3, PieChart, Activity, RefreshCw,
    CheckCircle, Clock, XCircle, ChevronDown, X, Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

// ==================== MOCK DATA ====================
const MOCK_KITTIES = [
    {
        id: 'k1', name: 'Solar for Schools', type: 'enterprise', entity_type: 'Charity',
        balance: 245000, currency: 'KES', status: 'active',
        total_inflow: 890000, total_outflow: 645000,
        description: 'Community solar energy initiative for rural schools',
        created_at: '2026-01-15', investors_count: 23, is_charity: true,
        monthly_data: [
            { month: 'Sep', inflow: 85000, outflow: 42000 },
            { month: 'Oct', inflow: 120000, outflow: 95000 },
            { month: 'Nov', inflow: 95000, outflow: 68000 },
            { month: 'Dec', inflow: 140000, outflow: 110000 },
            { month: 'Jan', inflow: 180000, outflow: 130000 },
            { month: 'Feb', inflow: 150000, outflow: 100000 },
            { month: 'Mar', inflow: 120000, outflow: 100000 },
        ],
        connected_accounts: [{ type: 'mpesa', name: 'M-PESA Paybill', number: '***745' }],
    },
    {
        id: 'k2', name: 'TechHub Ventures', type: 'venture', entity_type: 'Capital Venture',
        balance: 1250000, currency: 'KES', status: 'active',
        total_inflow: 3200000, total_outflow: 1950000,
        description: 'Technology venture capital fund',
        created_at: '2025-11-20', investors_count: 8, is_charity: false,
        monthly_data: [
            { month: 'Sep', inflow: 350000, outflow: 200000 },
            { month: 'Oct', inflow: 480000, outflow: 310000 },
            { month: 'Nov', inflow: 520000, outflow: 280000 },
            { month: 'Dec', inflow: 600000, outflow: 400000 },
            { month: 'Jan', inflow: 450000, outflow: 260000 },
            { month: 'Feb', inflow: 400000, outflow: 250000 },
            { month: 'Mar', inflow: 400000, outflow: 250000 },
        ],
        connected_accounts: [
            { type: 'bank', name: 'KCB Business Account', number: '***892' },
            { type: 'mpesa', name: 'M-PESA Till', number: '***123' },
        ],
    },
    {
        id: 'k3', name: 'Mama Mboga Supplies', type: 'shop', entity_type: 'Shop',
        balance: 45200, currency: 'KES', status: 'active',
        total_inflow: 320000, total_outflow: 274800,
        description: 'Fresh produce and grocery supply shop',
        created_at: '2026-02-01', investors_count: 0, is_charity: false,
        monthly_data: [
            { month: 'Jan', inflow: 80000, outflow: 65000 },
            { month: 'Feb', inflow: 120000, outflow: 109800 },
            { month: 'Mar', inflow: 120000, outflow: 100000 },
        ],
        connected_accounts: [],
    },
    {
        id: 'k4', name: 'GreenBuild Co.', type: 'business', entity_type: 'Business',
        balance: 780000, currency: 'KES', status: 'active',
        total_inflow: 2100000, total_outflow: 1320000,
        description: 'Sustainable construction materials company',
        created_at: '2025-09-10', investors_count: 12, is_charity: false,
        monthly_data: [
            { month: 'Sep', inflow: 200000, outflow: 120000 },
            { month: 'Oct', inflow: 280000, outflow: 170000 },
            { month: 'Nov', inflow: 350000, outflow: 230000 },
            { month: 'Dec', inflow: 400000, outflow: 280000 },
            { month: 'Jan', inflow: 320000, outflow: 200000 },
            { month: 'Feb', inflow: 300000, outflow: 180000 },
            { month: 'Mar', inflow: 250000, outflow: 140000 },
        ],
        connected_accounts: [{ type: 'bank', name: 'Equity Business', number: '***567' }],
    },
];

const MOCK_TRANSACTIONS = [
    { id: 't1', type: 'inflow', amount: 25000, description: 'Investment from John K.', date: '2026-03-14', status: 'completed', method: 'wallet' },
    { id: 't2', type: 'outflow', amount: 15000, description: 'Equipment purchase', date: '2026-03-13', status: 'completed', method: 'mpesa' },
    { id: 't3', type: 'inflow', amount: 50000, description: 'Donation from Mary W.', date: '2026-03-12', status: 'completed', method: 'bank' },
    { id: 't4', type: 'outflow', amount: 8000, description: 'Transport costs', date: '2026-03-11', status: 'completed', method: 'mpesa' },
    { id: 't5', type: 'inflow', amount: 100000, description: 'Group investment - Syndicate A', date: '2026-03-10', status: 'completed', method: 'wallet' },
    { id: 't6', type: 'outflow', amount: 35000, description: 'Withdrawal to personal wallet', date: '2026-03-09', status: 'completed', method: 'wallet' },
    { id: 't7', type: 'inflow', amount: 12000, description: 'Product sale #4521', date: '2026-03-08', status: 'completed', method: 'mpesa' },
    { id: 't8', type: 'outflow', amount: 6500, description: 'Marketing expenses', date: '2026-03-07', status: 'pending', method: 'bank' },
    { id: 't9', type: 'inflow', amount: 75000, description: 'Investment from Peter Q.', date: '2026-03-06', status: 'completed', method: 'wallet' },
    { id: 't10', type: 'outflow', amount: 20000, description: 'Salary disbursement', date: '2026-03-05', status: 'completed', method: 'bank' },
];

// ==================== TYPE BADGES ====================
const TYPE_CONFIG = {
    enterprise: { icon: Heart, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-500/10', text: 'text-pink-600' },
    venture: { icon: Building2, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-600' },
    shop: { icon: Store, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    business: { icon: Briefcase, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10', text: 'text-blue-600' },
};

// ==================== MINI BAR CHART ====================
const MiniBarChart = ({ data, dataKey, color = 'bg-primary' }) => {
    const maxVal = Math.max(...data.map(d => d[dataKey]), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                        className={`w-full rounded-t ${color} transition-all duration-300`}
                        style={{ height: `${(d[dataKey] / maxVal) * 100}%`, minHeight: '2px' }}
                    />
                    <span className="text-[8px] text-tertiary">{d.month?.slice(0, 1)}</span>
                </div>
            ))}
        </div>
    );
};

// ==================== KITTY CARD ====================
const KittyCard = ({ kitty, onSelect, isSelected }) => {
    const config = TYPE_CONFIG[kitty.type] || TYPE_CONFIG.business;
    const TypeIcon = config.icon;
    const [showBalance, setShowBalance] = useState(true);

    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onSelect(kitty.id)}
            className={`bg-elevated rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-theme hover:border-primary/30'}`}
        >
            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${config.color} p-4 text-white`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <TypeIcon size={16} />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{kitty.entity_type}</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}
                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                </div>
                <h3 className="font-bold text-lg leading-tight">{kitty.name}</h3>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{kitty.description}</p>
            </div>

            {/* Balance & stats */}
            <div className="p-4 space-y-3">
                <div>
                    <p className="text-xs text-secondary mb-0.5">Available Balance</p>
                    <p className="text-2xl font-bold text-primary">
                        {showBalance ? `KES ${kitty.balance.toLocaleString()}` : '••••••'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-green-500/5 rounded-lg">
                        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                            <ArrowDownCircle size={10} /> Total In
                        </p>
                        <p className="text-sm font-bold text-green-700">KES {(kitty.total_inflow / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="p-2 bg-red-500/5 rounded-lg">
                        <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                            <ArrowUpCircle size={10} /> Total Out
                        </p>
                        <p className="text-sm font-bold text-red-700">KES {(kitty.total_outflow / 1000).toFixed(0)}K</p>
                    </div>
                </div>

                {kitty.monthly_data && (
                    <MiniBarChart data={kitty.monthly_data} dataKey="inflow" color="bg-primary/60" />
                )}

                <div className="flex items-center justify-between pt-2 border-t border-theme text-xs text-secondary">
                    <span>Since {new Date(kitty.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-primary font-medium">
                        Details <ChevronRight size={12} />
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ==================== KITTY DETAIL PANEL ====================
const KittyDetailPanel = ({ kitty, onClose }) => {
    const [activeSection, setActiveSection] = useState('analytics');
    const [txFilter, setTxFilter] = useState('all');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const config = TYPE_CONFIG[kitty.type] || TYPE_CONFIG.business;
    const TypeIcon = config.icon;

    const filteredTxns = txFilter === 'all'
        ? MOCK_TRANSACTIONS
        : MOCK_TRANSACTIONS.filter(t => t.type === txFilter);

    const sections = [
        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        { key: 'transactions', label: 'Transactions', icon: Activity },
        { key: 'actions', label: 'Actions', icon: Settings },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-elevated rounded-2xl border border-theme shadow-xl overflow-hidden"
        >
            {/* Detail Header */}
            <div className={`bg-gradient-to-r ${config.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <X size={18} />
                    </button>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">{kitty.entity_type}</span>
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium capitalize">{kitty.status}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <TypeIcon size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{kitty.name}</h2>
                        <p className="text-white/70 text-sm mt-0.5">{kitty.description}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/60 text-xs">Balance</p>
                        <p className="text-xl font-bold">KES {kitty.balance.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/60 text-xs">Total In</p>
                        <p className="text-xl font-bold text-green-200">KES {(kitty.total_inflow / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/60 text-xs">Total Out</p>
                        <p className="text-xl font-bold text-red-200">KES {(kitty.total_outflow / 1000).toFixed(0)}K</p>
                    </div>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-theme">
                {sections.map(s => {
                    const SIcon = s.icon;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${activeSection === s.key ? 'text-primary' : 'text-secondary hover:text-primary'
                                }`}
                        >
                            <SIcon size={16} /> {s.label}
                            {activeSection === s.key && (
                                <motion.div layoutId="detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Section Content */}
            <div className="p-6">
                {/* ===== ANALYTICS ===== */}
                {activeSection === 'analytics' && (
                    <div className="space-y-6">
                        {/* Monthly Inflow vs Outflow */}
                        <div>
                            <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                                <PieChart size={18} /> Monthly Cash Flow
                            </h4>
                            <div className="space-y-2">
                                {kitty.monthly_data?.map((m, i) => {
                                    const maxMonthly = Math.max(...kitty.monthly_data.map(d => Math.max(d.inflow, d.outflow)), 1);
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-8 text-xs text-secondary font-medium">{m.month}</span>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-secondary/10 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${(m.inflow / maxMonthly) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-green-600 font-medium w-16 text-right">{(m.inflow / 1000).toFixed(0)}K</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-secondary/10 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-red-400 h-full rounded-full transition-all" style={{ width: `${(m.outflow / maxMonthly) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-red-500 font-medium w-16 text-right">{(m.outflow / 1000).toFixed(0)}K</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-secondary">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Inflows</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Outflows</span>
                            </div>
                        </div>

                        {/* Growth Rate */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardBody className="p-4 text-center">
                                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-xs text-secondary">Net Growth</p>
                                    <p className="text-xl font-bold text-green-600">
                                        +KES {((kitty.total_inflow - kitty.total_outflow) / 1000).toFixed(0)}K
                                    </p>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="p-4 text-center">
                                    <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                                    <p className="text-xs text-secondary">Avg Monthly Inflow</p>
                                    <p className="text-xl font-bold text-primary">
                                        KES {kitty.monthly_data ? (kitty.monthly_data.reduce((s, m) => s + m.inflow, 0) / kitty.monthly_data.length / 1000).toFixed(0) : 0}K
                                    </p>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Connected Accounts */}
                        {kitty.connected_accounts?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                    <Link2 size={18} /> Connected Accounts
                                </h4>
                                <div className="space-y-2">
                                    {kitty.connected_accounts.map((acc, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-secondary/5 rounded-xl border border-theme">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${acc.type === 'mpesa' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                                {acc.type === 'mpesa' ? <Smartphone size={18} className="text-green-600" /> : <Landmark size={18} className="text-blue-600" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">{acc.name}</p>
                                                <p className="text-xs text-secondary">{acc.number}</p>
                                            </div>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TRANSACTIONS ===== */}
                {activeSection === 'transactions' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-primary flex items-center gap-2">
                                <Activity size={18} /> Transaction Records
                            </h4>
                            <Button variant="outline" size="sm">
                                <Download size={14} className="mr-1" /> Export
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            {['all', 'inflow', 'outflow'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTxFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${txFilter === f
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f === 'inflow' ? 'Inflows' : 'Outflows'}
                                </button>
                            ))}
                        </div>

                        {/* Transaction List */}
                        <div className="space-y-2">
                            {filteredTxns.map(txn => (
                                <div key={txn.id} className="flex items-center gap-3 p-3 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'inflow' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {txn.type === 'inflow'
                                            ? <ArrowDownCircle size={18} className="text-green-600" />
                                            : <ArrowUpCircle size={18} className="text-red-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{txn.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-secondary">
                                            <span>{new Date(txn.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="capitalize">{txn.method}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${txn.type === 'inflow' ? 'text-green-600' : 'text-red-500'}`}>
                                            {txn.type === 'inflow' ? '+' : '-'}KES {txn.amount.toLocaleString()}
                                        </p>
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${txn.status === 'completed'
                                            ? 'bg-green-500/10 text-green-600'
                                            : txn.status === 'pending'
                                                ? 'bg-yellow-500/10 text-yellow-600'
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {txn.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== ACTIONS ===== */}
                {activeSection === 'actions' && (
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div>
                            <h4 className="font-semibold text-primary mb-4">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="p-4 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-3">
                                        <Upload size={18} className="text-orange-600" />
                                    </div>
                                    <p className="font-semibold text-primary text-sm">Withdraw to Personal</p>
                                    <p className="text-xs text-secondary mt-0.5">Transfer funds to your wallet</p>
                                </button>
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    className="p-4 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                                        <Link2 size={18} className="text-blue-600" />
                                    </div>
                                    <p className="font-semibold text-primary text-sm">Connect Account</p>
                                    <p className="text-xs text-secondary mt-0.5">Link bank or M-PESA</p>
                                </button>
                                <button className="p-4 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors text-left group">
                                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                                        <Download size={18} className="text-purple-600" />
                                    </div>
                                    <p className="font-semibold text-primary text-sm">Generate Statement</p>
                                    <p className="text-xs text-secondary mt-0.5">Download PDF report</p>
                                </button>
                                <button className="p-4 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors text-left group">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                                        <RefreshCw size={18} className="text-green-600" />
                                    </div>
                                    <p className="font-semibold text-primary text-sm">Auto-Transfer</p>
                                    <p className="text-xs text-secondary mt-0.5">Schedule recurring transfers</p>
                                </button>
                            </div>
                        </div>

                        {/* Kitty Settings */}
                        <div>
                            <h4 className="font-semibold text-primary mb-4">Kitty Settings</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-theme">
                                    <div>
                                        <p className="text-sm font-medium text-primary">Withdrawal Limit</p>
                                        <p className="text-xs text-secondary">Maximum daily withdrawal amount</p>
                                    </div>
                                    <span className="text-sm font-bold text-primary">KES 500,000</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-theme">
                                    <div>
                                        <p className="text-sm font-medium text-primary">Notifications</p>
                                        <p className="text-xs text-secondary">Get alerts on transactions</p>
                                    </div>
                                    <div className="w-10 h-6 bg-green-500 rounded-full flex items-center p-0.5">
                                        <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-theme">
                                    <div>
                                        <p className="text-sm font-medium text-primary">Low Balance Alert</p>
                                        <p className="text-xs text-secondary">Notify when balance drops below threshold</p>
                                    </div>
                                    <span className="text-sm font-bold text-primary">KES 10,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <WithdrawModal kitty={kitty} onClose={() => setShowWithdrawModal(false)} />
            )}

            {/* Connect Account Modal */}
            {showSettingsModal && (
                <ConnectAccountModal kitty={kitty} onClose={() => setShowSettingsModal(false)} />
            )}
        </motion.div>
    );
};

// ==================== WITHDRAW MODAL ====================
const WithdrawModal = ({ kitty, onClose }) => {
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > kitty.balance) return;
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        setSuccess(true);
        setProcessing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-elevated rounded-2xl shadow-2xl max-w-md w-full"
            >
                <div className="p-5 border-b border-theme flex justify-between items-center">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        <Upload size={20} className="text-orange-600" /> Withdraw to Personal
                    </h3>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-xl">&times;</button>
                </div>
                <div className="p-5 space-y-5">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-primary mb-2">Withdrawal Initiated</h4>
                            <p className="text-secondary text-sm">KES {Number(amount).toLocaleString()} will be transferred to your personal wallet shortly.</p>
                            <Button onClick={onClose} className="mt-4 bg-primary text-white w-full">Done</Button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-secondary/5 rounded-xl p-4 border border-theme">
                                <p className="text-xs text-secondary">Available in Kitty</p>
                                <p className="text-2xl font-bold text-primary">KES {kitty.balance.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1.5">Withdraw Amount (KES)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    max={kitty.balance}
                                    min={0}
                                    className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                />
                                {amount && parseFloat(amount) > kitty.balance && (
                                    <p className="text-xs text-red-500 mt-1">Amount exceeds available balance</p>
                                )}
                            </div>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700">
                                Withdrawals are processed within 24 hours. A confirmation will be sent to your registered email.
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                                <Button
                                    onClick={handleWithdraw}
                                    disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > kitty.balance}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {processing ? 'Processing...' : 'Withdraw'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ==================== CONNECT ACCOUNT MODAL ====================
const ConnectAccountModal = ({ kitty, onClose }) => {
    const [accountType, setAccountType] = useState('bank');
    const [formData, setFormData] = useState({ account_name: '', account_number: '', bank_name: '', mpesa_number: '' });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1500));
        setSuccess(true);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-elevated rounded-2xl shadow-2xl max-w-md w-full"
            >
                <div className="p-5 border-b border-theme flex justify-between items-center">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        <Link2 size={20} className="text-blue-600" /> Connect Account
                    </h3>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-xl">&times;</button>
                </div>
                <div className="p-5 space-y-5">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-primary mb-2">Account Connected</h4>
                            <p className="text-secondary text-sm">Your {accountType === 'bank' ? 'bank account' : 'M-PESA'} has been linked to {kitty.name}.</p>
                            <Button onClick={onClose} className="mt-4 bg-primary text-white w-full">Done</Button>
                        </div>
                    ) : (
                        <>
                            {/* Account Type Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Account Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setAccountType('bank')}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${accountType === 'bank' ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'}`}
                                    >
                                        <Landmark size={18} className="text-blue-600" />
                                        <span className="text-sm font-medium text-primary">Bank Account</span>
                                    </button>
                                    <button
                                        onClick={() => setAccountType('mpesa')}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${accountType === 'mpesa' ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'}`}
                                    >
                                        <Smartphone size={18} className="text-green-600" />
                                        <span className="text-sm font-medium text-primary">M-PESA</span>
                                    </button>
                                </div>
                            </div>

                            {accountType === 'bank' ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Bank Name</label>
                                        <select
                                            value={formData.bank_name}
                                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Select bank</option>
                                            <option value="kcb">KCB Bank</option>
                                            <option value="equity">Equity Bank</option>
                                            <option value="coop">Co-operative Bank</option>
                                            <option value="stanbic">Stanbic Bank</option>
                                            <option value="absa">ABSA Bank</option>
                                            <option value="ncba">NCBA Bank</option>
                                            <option value="dtb">Diamond Trust Bank</option>
                                            <option value="family">Family Bank</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Account Name</label>
                                        <input
                                            value={formData.account_name}
                                            onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                            placeholder="Account holder name"
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Account Number</label>
                                        <input
                                            value={formData.account_number}
                                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                            placeholder="Enter account number"
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">M-PESA Number</label>
                                        <input
                                            value={formData.mpesa_number}
                                            onChange={e => setFormData({ ...formData, mpesa_number: e.target.value })}
                                            placeholder="07XX XXX XXX"
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Account Name</label>
                                        <input
                                            value={formData.account_name}
                                            onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                            placeholder="Registered name"
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving ? 'Connecting...' : 'Connect Account'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ==================== MAIN PAGE ====================
const KittyManagement = () => {
    const navigate = useNavigate();
    const [kitties, setKitties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedKittyId, setSelectedKittyId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        // Simulate loading kitties from API
        const timer = setTimeout(() => {
            setKitties(MOCK_KITTIES);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const selectedKitty = kitties.find(k => k.id === selectedKittyId);

    const filteredKitties = kitties.filter(k => {
        const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || k.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalBalance = kitties.reduce((sum, k) => sum + k.balance, 0);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary/40 rounded-xl transition-colors">
                    <ArrowLeft size={20} className="text-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">My Kitties</h1>
                    <p className="text-secondary text-sm mt-0.5">Manage fund pools for your enterprises, shops & ventures</p>
                </div>
            </div>

            {/* Overview Card */}
            <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white border-0">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-white/70 text-sm">Total Kitty Balance</p>
                                <p className="text-3xl font-bold">KES {totalBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                            const Icon = cfg.icon;
                            const count = kitties.filter(k => k.type === type).length;
                            const balance = kitties.filter(k => k.type === type).reduce((s, k) => s + k.balance, 0);
                            return (
                                <div key={type} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon size={14} className="text-white/70" />
                                        <span className="text-xs text-white/70 capitalize">{type}s</span>
                                    </div>
                                    <p className="text-lg font-bold">{count}</p>
                                    <p className="text-xs text-white/60">KES {(balance / 1000).toFixed(0)}K</p>
                                </div>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search kitties..."
                        className="w-full pl-10 pr-4 py-2.5 border border-theme rounded-xl foc:ring-2 focus:ring-primary outline-none bg-elevated text-primary text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'enterprise', 'venture', 'shop', 'business'].map(f => (
                        <button
                            key={f}
                            onClick={() => setTypeFilter(f)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${typeFilter === f
                                ? 'bg-primary text-white'
                                : 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-theme'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            ) : filteredKitties.length === 0 ? (
                <div className="text-center py-16 bg-elevated rounded-2xl border border-dashed border-theme">
                    <Wallet className="w-12 h-12 text-tertiary mx-auto mb-4" />
                    <p className="text-secondary font-medium">No kitties found</p>
                    <p className="text-xs text-tertiary mt-1">Register a business, shop, or venture to create a kitty</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredKitties.map(kitty => (
                        <KittyCard
                            key={kitty.id}
                            kitty={kitty}
                            onSelect={setSelectedKittyId}
                            isSelected={selectedKittyId === kitty.id}
                        />
                    ))}
                </div>
            )}

            {/* Detail Panel */}
            <AnimatePresence>
                {selectedKitty && (
                    <KittyDetailPanel
                        kitty={selectedKitty}
                        onClose={() => setSelectedKittyId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default KittyManagement;
