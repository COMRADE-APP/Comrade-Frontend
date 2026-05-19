import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    ArrowLeft, PieChart as PieChartIcon, Users, DollarSign, Activity,
    TrendingUp, RefreshCcw, Target, ShieldCheck, HelpCircle, BarChart3, ArrowUpRight
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const MetricCard = ({ title, value, icon: Icon, trend }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-theme">
        <CardBody className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-primary/10 text-primary-600`}>
                <Icon size={22} strokeWidth={2} />
            </div>
            <div className="flex-1">
                <p className="text-sm text-secondary mb-0.5">{title}</p>
                <p className="text-xl font-bold text-primary">{value}</p>
            </div>
        </CardBody>
    </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl text-sm">
                <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
                        <span className="font-bold whitespace-nowrap" style={{ color: entry.color }}>
                            {formatMoneySimple(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const PortfolioAnalytics = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    
    const [portfolio, setPortfolio] = useState(null);
    const [ventures, setVentures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [groupId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentsService.getGroupPortfolio(groupId);
            setPortfolio(data);
            // Also fetch ventures for the holdings section
            try {
                const venturesData = await paymentsService.getGroupVentures(groupId);
                setVentures(Array.isArray(venturesData) ? venturesData : (venturesData?.results || []));
            } catch (vErr) {
                console.warn('Could not load ventures for portfolio:', vErr);
            }
        } catch (err) {
            console.error('Load portfolio error:', err);
            setError(err.message || "Failed to load portfolio. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin mb-4" />
                    <p className="text-secondary font-medium animate-pulse">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">
                    <RefreshCcw size={48} />
                </div>
                <h2 className="text-xl font-bold text-primary mb-2">Something went wrong</h2>
                <p className="text-secondary max-w-md text-center mb-6">{error || 'Could not load group portfolio.'}</p>
                <Button onClick={loadData} variant="primary">
                    <RefreshCcw size={16} className="mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    const memberContributionsData = portfolio.contributions_by_member
        ?.filter(m => m.amount > 0)
        ?.sort((a, b) => b.amount - a.amount)
        ?.slice(0, 10) || [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-elevated border-b border-theme sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/payments/groups/${groupId}?tab=ventures`)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/10 border border-theme text-secondary hover:text-primary hover:bg-secondary/20 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-3 border-l pl-4 border-theme">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                                <PieChartIcon size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-primary leading-tight">{portfolio.group_name || 'Group Portfolio'}</h1>
                                <p className="text-xs text-primary-600 font-semibold tracking-wide uppercase">Portfolio Analytics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Total Balance" 
                        value={formatMoneySimple(portfolio.total_balance)} 
                        icon={DollarSign} 
                    />
                    <MetricCard 
                        title="Target Amount" 
                        value={formatMoneySimple(portfolio.target_amount)} 
                        icon={Target} 
                    />
                    <MetricCard 
                        title="Total Contributed" 
                        value={formatMoneySimple(portfolio.total_contributed)} 
                        icon={TrendingUp} 
                    />
                    <MetricCard 
                        title="Member Count" 
                        value={portfolio.member_count} 
                        icon={Users} 
                    />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-theme">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-primary">Member Contributions</h3>
                                    <p className="text-sm text-secondary">Top contributing members by volume.</p>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full font-medium text-sm">
                                {memberContributionsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={memberContributionsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} angle={-15} textAnchor="end" />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(v) => `$${v < 1000 ? v : v/1000 + 'k'}`} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Bar dataKey="amount" name="Contribution" fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-secondary">No contributions data available.</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-theme">
                        <CardBody className="p-6 h-full flex flex-col">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Equity Distribution</h3>
                                <p className="text-sm text-secondary">Relative ownership based on contributions.</p>
                            </div>
                            
                            <div className="flex-1 min-h-[200px] w-full mt-4 relative">
                                {memberContributionsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={memberContributionsData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={5}
                                                dataKey="amount"
                                                stroke="none"
                                            >
                                                {memberContributionsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(val) => formatMoneySimple(val)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-tertiary font-medium">No Data</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Recent Votes */}
                <Card className="border-theme">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-primary mb-6">Recent Governance Activity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolio.recent_votes?.map((vote, idx) => (
                                <div key={idx} className="p-4 border border-theme rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            vote.status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                                            vote.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {vote.status}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-primary mb-1">{vote.title}</h4>
                                    <div className="flex items-center justify-between text-xs text-secondary mt-3 pt-3 border-t border-theme">
                                        <span className="capitalize">{vote.type.replace('_', ' ')}</span>
                                        <span className="font-bold text-primary">{vote.approval}% Approval</span>
                                    </div>
                                </div>
                            ))}
                            {(!portfolio.recent_votes || portfolio.recent_votes.length === 0) && (
                                <div className="col-span-full p-8 text-center text-secondary border border-dashed border-theme rounded-xl flex flex-col items-center">
                                    <HelpCircle size={32} className="text-tertiary mb-3" />
                                    <p>No recent governance activity found.</p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Venture Holdings */}
                <Card className="border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Venture Holdings</h3>
                                <p className="text-sm text-secondary">All investment ventures in this group portfolio.</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                                {ventures.length} Venture{ventures.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {ventures.length === 0 ? (
                            <div className="py-8 text-center text-secondary border border-dashed border-theme rounded-xl">
                                <BarChart3 size={32} className="text-tertiary mx-auto mb-3" />
                                <p>No ventures in this group yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ventures.map(venture => {
                                    const roi = venture.total_fund > 0
                                        ? ((parseFloat(venture.available_fund) - parseFloat(venture.total_fund)) / parseFloat(venture.total_fund)) * 100
                                        : 0;
                                    return (
                                        <div
                                            key={venture.id}
                                            className="p-4 border border-theme rounded-xl hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => navigate(`/funding/ventures/${venture.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                                    <BarChart3 size={18} />
                                                </div>
                                                <span className={`text-xs font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-primary text-sm truncate mb-1">{venture.name}</h4>
                                            <p className="text-xs text-secondary line-clamp-1 mb-3">{venture.description || 'No description'}</p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-secondary">Fund: <strong className="text-primary">{formatMoneySimple(venture.total_fund)}</strong></span>
                                                <ArrowUpRight size={14} className="text-tertiary group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default PortfolioAnalytics;
