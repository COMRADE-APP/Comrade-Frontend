import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, DollarSign, TrendingUp, TrendingDown, Target, Shield, AlertTriangle,
    Coins, Eye, PieChart, BarChart3, Calendar, Clock, Briefcase, Heart,
    CreditCard, Percent, Building2, Activity, FileText, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { paymentsService } from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

// Mock data generators for rich analytics
const generatePerformanceData = () => Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    returns: +(5 + Math.random() * 10 - 3).toFixed(1),
    benchmark: +(4 + Math.random() * 3).toFixed(1),
    netAssets: +(100000 + i * 15000 + Math.random() * 10000).toFixed(0),
}));

const generateAllocations = () => [
    { name: 'Equities', value: 35, color: '#6366f1' },
    { name: 'Bonds', value: 25, color: '#10b981' },
    { name: 'Savings (Piggy)', value: 15, color: '#f59e0b' },
    { name: 'Real Estate', value: 10, color: '#ef4444' },
    { name: 'Cash & MMF', value: 10, color: '#3b82f6' },
    { name: 'Other', value: 5, color: '#8b5cf6' },
];

const generateInvestments = () => [
    { id: 1, name: 'Safaricom PLC', type: 'equity', amount: 450000, returns: 12.4, status: 'active', date: '2025-08-12' },
    { id: 2, name: 'KCB Infrastructure Bond', type: 'bond', amount: 300000, returns: 8.2, status: 'active', date: '2025-06-20' },
    { id: 3, name: 'NCBA MMF', type: 'mmf', amount: 200000, returns: 9.1, status: 'active', date: '2025-09-05' },
    { id: 4, name: 'Centum Real Estate', type: 'real_estate', amount: 500000, returns: -2.1, status: 'active', date: '2025-03-15' },
    { id: 5, name: 'BAT Kenya', type: 'equity', amount: 150000, returns: 5.8, status: 'closed', date: '2024-11-01' },
    { id: 6, name: 'Kenya Red Cross', type: 'donation', amount: 50000, returns: 0, status: 'completed', date: '2025-07-22' },
    { id: 7, name: 'Cytonn High Yield', type: 'fund', amount: 350000, returns: 14.6, status: 'active', date: '2025-01-10' },
    { id: 8, name: 'Stanbic MMK', type: 'mmf', amount: 180000, returns: 7.9, status: 'active', date: '2025-04-18' },
];

const generateCreditTerms = () => [
    { label: 'Max Credit / Member', value: '100,000' },
    { label: 'Interest Rate (Loans)', value: '3.5% p.a.' },
    { label: 'Loan Tenure', value: '6 - 24 months' },
    { label: 'Emergency Fund Access', value: 'Up to 50% of contributions' },
    { label: 'Late Payment Penalty', value: '1.5% per month' },
    { label: 'Guarantor Required', value: '2 active members' },
];

const GroupPublicProfile = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');

    const performanceData = generatePerformanceData();
    const allocations = generateAllocations();
    const investments = generateInvestments();
    const creditTerms = generateCreditTerms();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await paymentsService.getPaymentGroupById(groupId);
                setGroup(data);
            } catch (e) {
                console.error('Failed to load group', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [groupId]);

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
    );

    if (!group) return (
        <div className="max-w-4xl mx-auto p-8 text-center">
            <h2 className="text-xl font-bold text-primary">Group not found</h2>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    // Derived mock stats
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const activeInvestments = investments.filter(i => i.status === 'active');
    const avgReturn = (activeInvestments.reduce((s, i) => s + i.returns, 0) / activeInvestments.length).toFixed(1);
    const totalGains = investments.filter(i => i.returns > 0).reduce((s, i) => s + (i.amount * i.returns / 100), 0);
    const totalLosses = Math.abs(investments.filter(i => i.returns < 0).reduce((s, i) => s + (i.amount * i.returns / 100), 0));
    const riskOptions = ['Conservative', 'Moderate', 'Aggressive'];
    const riskCategory = group.risk_category || riskOptions[1];

    const sections = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'investments', label: 'Investments', icon: TrendingUp },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
        { id: 'credit', label: 'Credit & Loans', icon: CreditCard },
    ];

    const getTypeIcon = (type) => {
        const icons = {
            equity: <TrendingUp className="w-4 h-4 text-indigo-500" />,
            bond: <Shield className="w-4 h-4 text-emerald-500" />,
            mmf: <PieChart className="w-4 h-4 text-blue-500" />,
            real_estate: <Building2 className="w-4 h-4 text-red-500" />,
            donation: <Heart className="w-4 h-4 text-pink-500" />,
            fund: <Briefcase className="w-4 h-4 text-primary-600" />,
        };
        return icons[type] || <DollarSign className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-primary-700 to-pink-500 rounded-3xl p-8 md:p-10 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">{group.name}</h1>
                            <p className="text-white/80 max-w-xl mb-4">{group.description || 'A premier investment group focused on generating consistent returns for members.'}</p>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium">
                                    {group.group_type || 'Standard Phase'}
                                </span>
                                <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" /> {group.members?.length || group.member_count || 0} Members
                                </span>
                                <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Est. {new Date(group.created_at || Date.now()).getFullYear()}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => navigate(`/groups-rooms?tab=discover`)}
                                className="bg-white text-indigo-700 hover:bg-white/90 font-bold px-6 rounded-xl shadow-lg">
                                Apply to Join
                            </Button>
                            {group.entry_fee_required && (
                                <span className="text-xs text-white/70 text-center">
                                    Entry Fee: <span className="font-bold text-white">${group.entry_fee_amount}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Invested', value: `${formatMoneySimple(totalInvested)}`, icon: DollarSign, color: 'text-blue-600 bg-blue-50', change: '+12%' },
                    { label: 'Avg Return', value: `${avgReturn}%`, icon: Target, color: 'text-emerald-600 bg-emerald-50', change: '+2.3%' },
                    { label: 'Total Gains', value: `${formatMoneySimple(totalGains)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50', change: null },
                    { label: 'Risk Category', value: riskCategory, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', change: null },
                ].map((stat, i) => (
                    <div key={i} className="bg-elevated border border-theme rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-tertiary font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-bold text-primary">{stat.value}</p>
                            {stat.change && <p className="text-xs text-emerald-500 font-medium">{stat.change} this year</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                            activeSection === s.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        <s.icon className="w-4 h-4" /> {s.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW */}
            {activeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Return History Chart */}
                    <div className="lg:col-span-2 bg-elevated border border-theme rounded-2xl p-6">
                        <h3 className="font-bold text-primary mb-1">Monthly Returns vs Benchmark</h3>
                        <p className="text-xs text-tertiary mb-4">Trailing 12-month performance comparison</p>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-theme, #e5e7eb)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="returns" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} name="Group Returns" />
                                    <Area type="monotone" dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 5" name="Market Benchmark" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Portfolio Allocation */}
                    <div className="bg-elevated border border-theme rounded-2xl p-6">
                        <h3 className="font-bold text-primary mb-4">Portfolio Allocation</h3>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={allocations} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {allocations.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v}%`} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {allocations.map((a, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                                        <span className="text-secondary">{a.name}</span>
                                    </div>
                                    <span className="font-semibold text-primary">{a.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Historical Gains', value: `${formatMoneySimple(totalGains)}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
                            { label: 'Historical Losses', value: `${formatMoneySimple(totalLosses)}`, color: 'text-rose-600', bg: 'bg-rose-50', icon: TrendingDown },
                            { label: 'Active Investments', value: activeInvestments.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity },
                            { label: 'Donations Made', value: investments.filter(i => i.type === 'donation').length, color: 'text-pink-600', bg: 'bg-pink-50', icon: Heart },
                        ].map((item, i) => (
                            <div key={i} className="bg-elevated border border-theme rounded-xl p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-tertiary">{item.label}</p>
                                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INVESTMENTS */}
            {activeSection === 'investments' && (
                <div className="space-y-6">
                    {/* Active Investments */}
                    <div className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-theme">
                            <h3 className="font-bold text-primary text-lg">Active Investments</h3>
                            <p className="text-xs text-tertiary">Current portfolio holdings and their real-time performance</p>
                        </div>
                        <div className="divide-y divide-theme">
                            {activeInvestments.map(inv => (
                                <div key={inv.id} className="p-5 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                            {getTypeIcon(inv.type)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-primary">{inv.name}</p>
                                            <p className="text-xs text-secondary capitalize">{inv.type.replace('_', ' ')} • Added {new Date(inv.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatMoneySimple(inv.amount)}</p>
                                        <p className={`text-sm font-semibold ${inv.returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {inv.returns >= 0 ? '+' : ''}{inv.returns}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Past / Closed */}
                    <div className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-theme">
                            <h3 className="font-bold text-primary">Past Investments & Donations</h3>
                        </div>
                        <div className="divide-y divide-theme">
                            {investments.filter(i => i.status !== 'active').map(inv => (
                                <div key={inv.id} className="p-5 flex items-center justify-between hover:bg-secondary/5 transition-colors opacity-75">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                            {getTypeIcon(inv.type)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-primary">{inv.name}</p>
                                            <p className="text-xs text-secondary capitalize">{inv.type} • {inv.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatMoneySimple(inv.amount)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PERFORMANCE */}
            {activeSection === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Net Asset Value Trend */}
                    <div className="bg-elevated border border-theme rounded-2xl p-6">
                        <h3 className="font-bold text-primary mb-1">Net Asset Value (NAV) Trend</h3>
                        <p className="text-xs text-tertiary mb-4">Monthly growth of the group's total portfolio value</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-theme, #e5e7eb)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                                    <Tooltip formatter={v => `${formatMoneySimple(Number(v))}`} />
                                    <Area type="monotone" dataKey="netAssets" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="NAV" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Returns Bar */}
                    <div className="bg-elevated border border-theme rounded-2xl p-6">
                        <h3 className="font-bold text-primary mb-1">Monthly Returns</h3>
                        <p className="text-xs text-tertiary mb-4">Gain/loss breakdown per month</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-theme, #e5e7eb)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                                    <Tooltip />
                                    <Bar dataKey="returns" name="Returns" radius={[6, 6, 0, 0]}>
                                        {performanceData.map((entry, i) => (
                                            <Cell key={i} fill={entry.returns >= 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Key Performance Indicators */}
                    <div className="lg:col-span-2 bg-elevated border border-theme rounded-2xl p-6">
                        <h3 className="font-bold text-primary mb-4">Key Performance Indicators</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Sharpe Ratio', value: '1.42', desc: 'Above average risk-adjusted returns' },
                                { label: 'Max Drawdown', value: '-8.3%', desc: 'Largest peak-to-trough decline' },
                                { label: 'Win Rate', value: '72%', desc: 'Percentage of profitable investments' },
                                { label: 'Volatility', value: '12.1%', desc: 'Annual standard deviation of returns' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-secondary/5 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-primary">{kpi.value}</p>
                                    <p className="text-sm font-semibold text-secondary mt-1">{kpi.label}</p>
                                    <p className="text-xs text-tertiary mt-1">{kpi.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CREDIT & LOANS */}
            {activeSection === 'credit' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-elevated border border-theme rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <Coins className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary text-lg">Credit & Loan Terms</h3>
                                <p className="text-xs text-tertiary">Standard lending terms for active members</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {creditTerms.map((term, i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-theme last:border-0">
                                    <span className="text-sm text-secondary">{term.label}</span>
                                    <span className="text-sm font-bold text-primary">{term.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-elevated border border-theme rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Percent className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary text-lg">Member Benefits</h3>
                                <p className="text-xs text-tertiary">Perks available to group members</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { title: 'Emergency Loans', desc: 'Quick-disbursement funds within 24 hours for active members.', icon: '⚡' },
                                { title: 'Investment Co-funding', desc: 'Pool resources with other members for larger investment opportunities.', icon: '🤝' },
                                { title: 'Dividend Payouts', desc: 'Quarterly dividend distribution from profitable investments.', icon: '💰' },
                                { title: 'Financial Advisory', desc: 'Access to group-vetted financial advisors at discounted rates.', icon: '📊' },
                                { title: 'Insurance Pool', desc: 'Shared insurance coverage for member emergencies.', icon: '🛡️' },
                            ].map((perk, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-secondary/5 rounded-xl">
                                    <span className="text-xl">{perk.icon}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-primary">{perk.title}</p>
                                        <p className="text-xs text-tertiary">{perk.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupPublicProfile;
