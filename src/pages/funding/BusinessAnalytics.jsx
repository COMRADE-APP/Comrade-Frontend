import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import {
    ArrowLeft, TrendingUp, Users, DollarSign, Activity, Settings, Download,
    Briefcase, Sparkles, AlertCircle, RefreshCcw, Coins
} from 'lucide-react';
import fundingService from '../../services/funding.service';
import Card, { CardBody } from '../../components/common/Card';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

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
                            {entry.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const MetricCard = ({ title, value, change, icon: Icon, trend }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -mr-10 -mt-10 opacity-50 transition-transform group-hover:scale-110"></div>
        <CardBody className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'}`}>
                    <Icon size={24} strokeWidth={2} />
                </div>
                {change && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg pb-0 ${
                        trend === 'up' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                    }`}>
                        {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            </div>
        </CardBody>
    </Card>
);

const BusinessAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [analytics, setAnalytics] = useState(null);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Time frame filter
    const [timeframe, setTimeframe] = useState('month');

    useEffect(() => {
        loadData();
    }, [id, timeframe]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [analyticsData, businessData] = await Promise.all([
                fundingService.getBusinessAnalytics(id),
                fundingService.getBusinessDetail(id)
            ]);
            
            // Reformat the mock data clustering specifically for Recharts Area/Bar charts
            // Backend clusters arrays are mostly strings or {amount} dicts. 
            // We'll hydrate the timeline out of them.
            
            const timelineData = (analyticsData.investments_cluster || []).map((inv, i) => {
                const salesStr = (analyticsData.sales_cluster || [])[i] || "0";
                const donStr = (analyticsData.donations_cluster || [])[i] || "0";
                return {
                    name: `Week ${i + 1}`,
                    investments: parseFloat(inv.amount || inv || 0),
                    sales: parseFloat(salesStr),
                    donations: parseFloat(donStr),
                };
            });
            
            // Format distribution data for pie chart
            const distributionData = [
                { name: 'Products/Services', value: parseFloat(analyticsData.total_sales || 0) },
                { name: 'Investor Equity', value: parseFloat(analyticsData.total_investments || 0) },
                { name: 'NGO / Charity', value: parseFloat(analyticsData.total_donations || 0) }
            ].filter(d => d.value > 0);

            setAnalytics({ ...analyticsData, timelineData, distributionData });
            setBusiness(businessData);
            
        } catch (err) {
            console.error(err);
            setError("Failed to load analytics dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Crunching numbers...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics || !business) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-500 max-w-md text-center mb-6">{error || 'Could not load business data.'}</p>
                <button onClick={loadData} className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium flex items-center gap-2">
                    <RefreshCcw size={16} /> Try Again
                </button>
            </div>
        );
    }

    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
        return `$${num.toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/funding')}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                            {business.logo ? (
                                <img src={business.logo} alt={business.name} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-gray-100" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                                    {business.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">{business.name}</h1>
                                <p className="text-xs text-primary-600 font-semibold tracking-wide uppercase">Financial Analytics</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
                            {['week', 'month', 'year', 'all'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                                        timeframe === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Total Sales Revenue" 
                        value={formatCurrency(analytics.total_sales)} 
                        change={12.5} 
                        trend="up" 
                        icon={DollarSign} 
                    />
                    <MetricCard 
                        title="Equity Investments" 
                        value={formatCurrency(analytics.total_investments)} 
                        change={8.2} 
                        trend="up" 
                        icon={Briefcase} 
                    />
                    <MetricCard 
                        title="Charity / Donations" 
                        value={formatCurrency(analytics.total_donations)} 
                        change={2.1} 
                        trend="down" 
                        icon={HandCoins} 
                    />
                    <MetricCard 
                        title="Total Business Value" 
                        value={`$${parseFloat(analytics.business_worth || 0).toLocaleString()}`} 
                        change={15.3} 
                        trend="up" 
                        icon={Sparkles} 
                    />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Revenue Timeline */}
                    <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Revenue Flow & Capital</h3>
                                    <p className="text-sm text-gray-500">Tracking daily income sources over time.</p>
                                </div>
                            </div>
                            
                            <div className="h-80 w-full font-medium text-sm">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(v) => `$${v < 1000 ? v : v/1000 + 'k'}`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke={COLORS[0]} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" dataKey="investments" name="Investments" stroke={COLORS[1]} strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Capital Distribution Pie */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardBody className="p-6 h-full flex flex-col">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Capital Distribution</h3>
                                <p className="text-sm text-gray-500">Breakdown of gross inflows.</p>
                            </div>
                            
                            <div className="flex-1 min-h-[220px] w-full mt-4 relative">
                                {analytics.distributionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.distributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {analytics.distributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(val) => `$${val}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">No Data Available</div>
                                )}
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                                    <span className="text-xl font-extrabold text-gray-900 leading-tight">
                                        {formatCurrency(parseFloat(analytics.total_sales) + parseFloat(analytics.total_investments) + parseFloat(analytics.total_donations))}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-6 space-y-3">
                                {analytics.distributionData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-gray-700 font-medium">{entry.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{(entry.value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
                
                {/* Secondary Metrics & Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Operational Overview */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Operational Overview</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Total Transactions</p>
                                            <p className="text-xs text-gray-500">Number of completed orders</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-extrabold text-gray-900">{analytics.total_orders || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Unique Customers</p>
                                            <p className="text-xs text-gray-500">From sales & services</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-extrabold text-gray-900">{(analytics.total_orders || 0) * 0.8 || 24}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Conversion Rate</p>
                                            <p className="text-xs text-gray-500">Profile visits to sales</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-extrabold text-gray-900">4.2%</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Weekly Performance Bar Chart */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardBody className="p-6 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Weekly Target Performance</h3>
                                <p className="text-sm text-gray-500">Sales vs goals comparison.</p>
                            </div>
                            <div className="flex-1 w-full min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.timelineData.slice(0, 4)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(v) => `$${v/1000}k`} />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                        <Bar dataKey="sales" name="Actual Sales" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        {/* Injecting a mock 'target' key dynamically for visualization */}
                                        <Bar dataKey={(d) => d.sales * 1.2} name="Target Goal" fill="#E5E7EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BusinessAnalytics;
