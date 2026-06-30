import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wallet, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity,
    RefreshCcw, Download, DownloadCloud, FileText, Target, Package
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart as RePie, Pie, Cell, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import providerService from '../../services/provider.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'export', label: 'Export', icon: Download },
];

const StatCard = ({ label, value, icon: Icon, color, isMoney }) => (
    <Card>
        <CardBody className="flex items-center gap-3 py-4">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-2xl font-bold text-primary">{isMoney ? formatMoneySimple(value) : value}</p>
                <p className="text-sm text-secondary">{label}</p>
            </div>
        </CardBody>
    </Card>
);

const downloadCSV = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const ProviderAnalytics = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [providerId, setProviderId] = useState(null);

    useEffect(() => {
        const loadProvider = async () => {
            try {
                const regs = await providerService.getMyRegistrations();
                if (regs?.length > 0) {
                    setProviderId(regs[0].id);
                }
            } catch (err) { console.error('Failed to load provider:', err); }
        };
        loadProvider();
    }, []);

    useEffect(() => {
        if (!providerId) return;
        const load = async () => {
            setLoading(true);
            try {
                const data = await providerService.getKittyAnalytics(providerId);
                setAnalytics(data);
            } catch (err) { console.error('Failed to load analytics:', err); }
            finally { setLoading(false); }
        };
        load();
    }, [providerId]);

    const handleExport = () => {
        if (!analytics) return;
        const headers = ['Month', 'Revenue', 'Expenses'];
        const rows = (analytics.monthly_trend || []).map(m => [m.month, m.revenue, m.expenses]);
        downloadCSV(`kitty-analytics-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <BarChart3 size={64} className="text-primary/20 mb-6" />
                <h2 className="text-2xl font-bold text-primary mb-2">No Analytics Available</h2>
                <p className="text-secondary mb-8">Start processing transactions to see your kitty analytics here.</p>
                <Button variant="primary" onClick={() => navigate('/provider')}>Back to Dashboard</Button>
            </div>
        );
    }

    const overviewCards = [
        { label: 'Current Balance', value: analytics.current_balance, icon: Wallet, color: 'bg-emerald-500/10 text-emerald-500', isMoney: true },
        { label: 'Total Inflows', value: analytics.total_inflows, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500', isMoney: true },
        { label: 'Total Outflows', value: analytics.total_outflows, icon: TrendingDown, color: 'bg-red-500/10 text-red-500', isMoney: true },
        { label: 'Net Profit/Loss', value: analytics.net_profit_loss, icon: DollarSign, color: 'bg-primary-500/10 text-primary-500', isMoney: true },
        { label: 'Performance Score', value: `${analytics.performance_score || 0}/100`, icon: Target, color: 'bg-purple-500/10 text-purple-500' },
        { label: 'Active Products', value: analytics.total_products || 0, icon: Package, color: 'bg-amber-500/10 text-amber-500' },
    ];

    const formatMonthlyLabel = (m) => {
        const [year, month] = m.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[parseInt(month, 10) - 1] || m;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <BarChart3 size={24} className="text-primary-500" /> Kitty Analytics
                    </h1>
                    <p className="text-sm text-secondary mt-0.5">Performance dashboard for your operations kitty</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setProviderId(providerId)}>
                        <RefreshCcw size={14} className="mr-1.5" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <DownloadCloud size={14} className="mr-1.5" /> Export
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-elevated rounded-xl border border-theme p-1 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id ? 'bg-background text-primary shadow-sm' : 'text-secondary hover:text-primary'
                        }`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {overviewCards.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
                    </div>
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-semibold text-primary mb-4">Monthly Revenue vs Expenses</h3>
                            {(analytics.monthly_trend && analytics.monthly_trend.length > 0) ? (
                                <div className="h-72">
                                    <ResponsiveContainer>
                                        <BarChart data={analytics.monthly_trend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={formatMonthlyLabel} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(val) => [formatMoneySimple(val), '']} labelFormatter={formatMonthlyLabel} contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} name="Revenue" />
                                            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-secondary">No monthly data yet</div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {overviewCards.slice(0, 4).map(kpi => <StatCard key={kpi.label} {...kpi} />)}
                    </div>
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-semibold text-primary mb-4">Revenue vs Expenses Trend</h3>
                            {(analytics.monthly_trend && analytics.monthly_trend.length > 0) ? (
                                <div className="h-72">
                                    <ResponsiveContainer>
                                        <LineChart data={analytics.monthly_trend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={formatMonthlyLabel} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-secondary)' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(val) => [formatMoneySimple(val), '']} contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="revenue" stroke="var(--color-primary-500)" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                                            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-secondary">No data yet</div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardBody>
                                <h3 className="text-lg font-semibold text-primary mb-4">Revenue by Service</h3>
                                {(analytics.service_revenue && analytics.service_revenue.length > 0) ? (
                                    <div className="h-64">
                                        <ResponsiveContainer>
                                            <RePie>
                                                <Pie data={analytics.service_revenue} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, amount }) => `${type}`}>
                                                    {analytics.service_revenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(val) => [formatMoneySimple(val), '']} contentStyle={{ borderRadius: '8px' }} />
                                            </RePie>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-secondary">No service revenue yet</div>
                                )}
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <h3 className="text-lg font-semibold text-primary mb-4">Service Revenue Breakdown</h3>
                                {(analytics.service_revenue && analytics.service_revenue.length > 0) ? (
                                    <div className="space-y-3">
                                        {analytics.service_revenue.map((svc, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-theme last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    <span className="text-sm text-primary">{svc.type}</span>
                                                </div>
                                                <span className="text-sm font-bold text-primary">{formatMoneySimple(svc.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-secondary">No revenue yet</div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                <Activity size={20} className="text-primary-500" /> Recent Transactions
                            </h3>
                            <span className="text-sm text-secondary">{analytics.total_transactions || 0} total</span>
                        </div>
                        {(analytics.monthly_trend && analytics.monthly_trend.some(m => m.revenue > 0 || m.expenses > 0)) ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-theme">
                                            <th className="text-left py-3 px-3 text-xs font-medium text-secondary uppercase tracking-wider">Month</th>
                                            <th className="text-right py-3 px-3 text-xs font-medium text-secondary uppercase tracking-wider">Revenue</th>
                                            <th className="text-right py-3 px-3 text-xs font-medium text-secondary uppercase tracking-wider">Expenses</th>
                                            <th className="text-right py-3 px-3 text-xs font-medium text-secondary uppercase tracking-wider">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.monthly_trend.map((m, i) => (
                                            <tr key={i} className="border-b border-theme hover:bg-secondary/5">
                                                <td className="py-2.5 px-3 text-primary font-medium">{formatMonthlyLabel(m.month)}</td>
                                                <td className="py-2.5 px-3 text-right text-emerald-600">{formatMoneySimple(m.revenue)}</td>
                                                <td className="py-2.5 px-3 text-right text-red-600">{formatMoneySimple(m.expenses)}</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-primary">{formatMoneySimple(m.revenue - m.expenses)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-secondary">No transactions yet</div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
                <div className="space-y-4">
                    <Card>
                        <CardBody className="text-center py-8">
                            <DownloadCloud size={48} className="text-primary/20 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-primary mb-2">Export Analytics Data</h3>
                            <p className="text-sm text-secondary mb-6 max-w-md mx-auto">
                                Download your kitty analytics data as CSV for further analysis in Excel or other tools.
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Button variant="primary" onClick={handleExport}>
                                    <DownloadCloud size={14} className="mr-1.5" /> Download Monthly Report
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ProviderAnalytics;
