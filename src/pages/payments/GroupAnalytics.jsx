import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import {
    ArrowLeft, TrendingUp, Users, DollarSign, Activity, Download,
    Target, RefreshCcw, Coins, Gift, Briefcase, PiggyBank, Wallet, Award,
    Clock, CheckCircle, Calendar
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-sm">
                <p className="font-bold text-gray-900 mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600">{entry.name}:</span>
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

const MetricCard = ({ title, value, change, icon: Icon, trend }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-theme">
        <CardBody className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : trend === 'down' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                <Icon size={22} strokeWidth={2} />
            </div>
            <div className="flex-1">
                <p className="text-sm text-secondary mb-0.5">{title}</p>
                <p className="text-xl font-bold text-primary">{value}</p>
            </div>
            {change !== undefined && change !== null && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${
                    trend === 'up' ? 'text-emerald-700 bg-emerald-100' : 
                    trend === 'down' ? 'text-red-700 bg-red-100' : 
                    'text-gray-700 bg-gray-100'
                }`}>
                    {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(change)}%
                </span>
            )}
        </CardBody>
    </Card>
);

const GroupAnalytics = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    
    const [analytics, setAnalytics] = useState(null);
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all');

    useEffect(() => {
        loadData();
    }, [groupId, timeframe]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const groupIdParam = groupId || 'unknown';
            console.log('Loading analytics for group:', groupIdParam);
            
            // Fetch both in parallel but handle errors separately
            let analyticsData = null;
            let groupData = null;
            
            try {
                analyticsData = await paymentsService.getGroupAnalytics(groupIdParam);
                console.log('Analytics response:', analyticsData);
            } catch (e) {
                console.error('Analytics fetch error:', e);
            }
            
            try {
                groupData = await paymentsService.getPaymentGroupDetail(groupIdParam);
                console.log('Group response:', groupData);
            } catch (e) {
                console.error('Group fetch error:', e);
            }
            
            if (!analyticsData && !groupData) {
                throw new Error('Failed to load data from both endpoints');
            }
            
            const timelineData = ((analyticsData?.monthly_trend) || []).map((entry, i) => ({
                name: entry.month ? new Date(entry.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : `M${i+1}`,
                contributions: parseFloat(entry.total || 0),
                transactions: entry.count || 0,
            }));

            const categoryBreakdown = [
                { name: 'Contributions', value: parseFloat(analyticsData?.total_contributed || 0) },
                { name: 'Piggy Banks', value: parseFloat(analyticsData?.piggy_bank_total || 0) },
                { name: 'Donations', value: parseFloat(analyticsData?.donations_total || 0) },
                { name: 'Investments', value: parseFloat(analyticsData?.investments_total || 0) },
            ].filter(d => d.value > 0);

            setAnalytics({ ...analyticsData, timelineData, categoryBreakdown });
            setGroup(groupData);
        } catch (err) {
            console.error('Load data error:', err);
            setError(err.message || "Failed to load analytics. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin mb-4" />
                    <p className="text-secondary font-medium animate-pulse">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics || !group) {
        return (
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">
                    <RefreshCcw size={48} />
                </div>
                <h2 className="text-xl font-bold text-primary mb-2">Something went wrong</h2>
                <p className="text-secondary max-w-md text-center mb-6">{error || 'Could not load group data.'}</p>
                <Button onClick={loadData} variant="primary">
                    <RefreshCcw size={16} className="mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-elevated border-b border-theme sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/payments/groups/${groupId}`)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/10 border border-theme text-secondary hover:text-primary hover:bg-secondary/20 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-3 border-l pl-4 border-theme">
                            {group.cover_photo ? (
                                <img src={group.cover_photo} alt={group.name} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-secondary/10" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary-700 flex items-center justify-center font-bold text-lg">
                                    {group.name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h1 className="text-lg font-bold text-primary leading-tight">{group.name}</h1>
                                <p className="text-xs text-primary-600 font-semibold tracking-wide uppercase">Group Analytics</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex bg-secondary/5 p-1 rounded-xl border border-theme">
                            {['month', 'year', 'all'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                                        timeframe === t ? 'bg-primary text-white' : 'text-secondary hover:text-primary hover:bg-secondary/10'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Total Contributed" 
                        value={formatMoneySimple(analytics.total_contributed)} 
                        icon={DollarSign} 
                        trend="up"
                    />
                    <MetricCard 
                        title="Group Members" 
                        value={analytics.total_members} 
                        icon={Users} 
                    />
                    <MetricCard 
                        title="Progress" 
                        value={`${analytics.progress || 0}%`} 
                        icon={Target} 
                    />
                    <MetricCard 
                        title="Pending Checkouts" 
                        value={analytics.pending_checkouts || 0} 
                        icon={Clock} 
                    />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-theme">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-primary">Contribution Flow</h3>
                                    <p className="text-sm text-secondary">Tracking monthly group contributions over time.</p>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full font-medium text-sm">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(v) => `$${v < 1000 ? v : v/1000 + 'k'}`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="contributions" name="Contributions" stroke={COLORS[0]} strokeWidth={3} fillOpacity={1} fill="url(#colorContributions)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-theme">
                        <CardBody className="p-6 h-full flex flex-col">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Fund Distribution</h3>
                                <p className="text-sm text-secondary">Breakdown of group financial activities.</p>
                            </div>
                            
                            <div className="flex-1 min-h-[200px] w-full mt-4 relative">
                                {analytics.categoryBreakdown?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.categoryBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {analytics.categoryBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(val) => formatMoneySimple(val)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-tertiary font-medium">No Data</div>
                                )}
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-tertiary uppercase tracking-widest">Total</span>
                                    <span className="text-xl font-extrabold text-primary leading-tight">
                                        {formatMoneySimple(analytics.total_contributed)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {analytics.categoryBreakdown?.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-primary font-medium">{entry.name}</span>
                                        </div>
                                        <span className="font-bold text-primary">{formatMoneySimple(entry.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-6">Top Contributors</h3>
                            <div className="space-y-4">
                                {analytics.top_contributors?.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary">{user.name}</p>
                                                <p className="text-xs text-secondary">
                                                    {user.is_anonymous ? 'Anonymous' : 'Member'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-emerald-600">{formatMoneySimple(user.contributed)}</span>
                                    </div>
                                ))}
                                {(!analytics.top_contributors || analytics.top_contributors.length === 0) && (
                                    <p className="text-sm text-secondary text-center py-4">No contributions yet.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-6">Group Activity</h3>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">Total Members</p>
                                            <p className="text-xs text-secondary">Active in group</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-primary">{analytics.total_members}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">Checkout Requests</p>
                                            <p className="text-xs text-secondary">Total requests made</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-primary">{analytics.checkout_requests_count || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">Pending Checkouts</p>
                                            <p className="text-xs text-secondary">Awaiting approval</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-primary">{analytics.pending_checkouts || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
                                            <Award size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">Tier</p>
                                            <p className="text-xs text-secondary">Group capacity tier</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold text-primary capitalize">{analytics.capacity_category}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={() => navigate(`/payments/groups/${groupId}?tab=rounds`)} className="justify-center py-4">
                        <Award className="w-4 h-4 mr-2" /> Rounds
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/payments/groups/${groupId}?tab=kitties`)} className="justify-center py-4">
                        <Wallet className="w-4 h-4 mr-2" /> Kitties
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/payments/groups/${groupId}?tab=piggybanks`)} className="justify-center py-4">
                        <PiggyBank className="w-4 h-4 mr-2" /> Piggy Banks
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/payments/groups/${groupId}?tab=donations`)} className="justify-center py-4">
                        <Gift className="w-4 h-4 mr-2" /> Donations
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GroupAnalytics;
