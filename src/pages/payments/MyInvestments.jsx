import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, 
    Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, Loader2,
    Building2, Users, Target, ChevronRight
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const STATUS_CONFIG = {
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending', icon: Clock },
    active: { color: 'bg-blue-100 text-blue-700', label: 'Active', icon: TrendingUp },
    matured: { color: 'bg-emerald-100 text-emerald-700', label: 'Matured', icon: CheckCircle },
    completed: { color: 'bg-gray-100 text-gray-700', label: 'Completed', icon: CheckCircle },
    defaulted: { color: 'bg-red-100 text-red-700', label: 'Defaulted', icon: AlertCircle },
};

const MyInvestments = () => {
    const [tab, setTab] = useState('all');
    const [investments, setInvestments] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [invData, oppData] = await Promise.all([
                paymentsService.getGroupInvestments().catch(() => []),
                fundingService.getOpportunities({ status: 'active' }).catch(() => [])
            ]);
            setInvestments(Array.isArray(invData) ? invData : (invData.results || []));
            setOpportunities(oppData?.results || (Array.isArray(oppData) ? oppData : []));
        } catch (e) {
            console.error('Failed to load investments:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate portfolio stats
    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.invested_amount || inv.amount || 0), 0);
    const activeCount = investments.filter(inv => inv.status === 'active').length;
    const pendingCount = investments.filter(inv => inv.status === 'pending').length;
    const maturedCount = investments.filter(inv => inv.status === 'matured' || inv.status === 'completed').length;

    const filteredInvestments = investments.filter(inv => {
        if (tab === 'active') return inv.status === 'active';
        if (tab === 'pending') return inv.status === 'pending';
        if (tab === 'completed') return ['matured', 'completed'].includes(inv.status);
        return true;
    });

    const tabs = [
        { id: 'all', label: 'All', count: investments.length },
        { id: 'active', label: 'Active', count: activeCount },
        { id: 'pending', label: 'Pending', count: pendingCount },
        { id: 'completed', label: 'Completed', count: maturedCount },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <TrendingUp className="w-8 h-8" />
                        My Investments
                    </h1>
                    <p className="text-secondary text-sm mt-1">
                        Track your investment portfolio across all groups and opportunities
                    </p>
                </div>
                <button 
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-elevated border border-theme rounded-xl text-secondary hover:bg-secondary/10 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm text-secondary">Total Invested</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatMoneySimple(totalInvested)}</p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-secondary">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{activeCount}</p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-secondary">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{pendingCount}</p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-secondary">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{maturedCount}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                            tab === t.id 
                                ? 'bg-primary-600 text-white shadow-md' 
                                : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        {t.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            tab === t.id ? 'bg-white/20' : 'bg-secondary/10'
                        }`}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Investment List */}
            {filteredInvestments.length === 0 ? (
                <div className="text-center py-16 bg-elevated rounded-2xl border border-theme">
                    <TrendingUp className="w-12 h-12 text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">No Investments Found</h3>
                    <p className="text-secondary mb-6">
                        {tab !== 'all' ? 'Try switching to a different tab' : 'Start investing through your groups'}
                    </p>
                    <Link to="/payments/groups">
                        <Button variant="primary">Browse Groups</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredInvestments.map((investment, idx) => {
                            const StatusCfg = STATUS_CONFIG[investment.status] || STATUS_CONFIG.pending;
                            const StatusIcon = StatusCfg.icon;
                            
                            return (
                                <motion.div
                                    key={investment.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-elevated border border-theme rounded-2xl p-6 hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${StatusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                                    {StatusCfg.label}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-primary mb-1">
                                                {investment.name || investment.opportunity_name || 'Investment'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                                                {investment.group_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {investment.group_name}
                                                    </span>
                                                )}
                                                {investment.created_at && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(investment.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {investment.maturity_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-4 h-4" />
                                                        Maturity: {new Date(investment.maturity_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <p className="text-sm text-secondary">Invested Amount</p>
                                                <p className="text-2xl font-bold text-primary">
                                                    {formatMoneySimple(investment.invested_amount || investment.amount || 0)}
                                                </p>
                                            </div>
                                            {investment.expected_return && (
                                                <div className="flex items-center gap-1 text-sm text-emerald-600">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    Expected: {investment.expected_return}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Explore Opportunities */}
            {opportunities.length > 0 && (
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Explore Investment Opportunities
                        </h3>
                        <Link to="/funding/ventures" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {opportunities.slice(0, 3).map(opp => (
                            <Link 
                                key={opp.id} 
                                to={`/funding/opportunity/${opp.id}`}
                                className="p-4 border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
                            >
                                <h4 className="font-bold text-primary mb-2 line-clamp-1">{opp.name}</h4>
                                <p className="text-sm text-secondary line-clamp-2 mb-3">{opp.description}</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-tertiary">Target: {formatMoneySimple(opp.target_amount)}</span>
                                    <span className="text-emerald-600 font-medium">{opp.equity_offered}% equity</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyInvestments;