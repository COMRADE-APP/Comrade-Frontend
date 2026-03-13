import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import {
    BarChart3, Users, Heart, Share2, MessageSquare,
    TrendingUp, MapPin, Download, Star, Sparkles
} from 'lucide-react';
import eventsService from '../../services/events.service';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

const EventAnalyticsDashboard = ({ event }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, [event.id]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const res = await eventsService.getAnalytics(event.id);
            setAnalytics(res.data || res);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card><CardBody className="py-12 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500">Compiling Analytics Data...</p>
            </CardBody></Card>
        );
    }

    if (error || !analytics) {
        return (
            <Card><CardBody className="py-12 text-center text-gray-500">
                <p className="mb-4">{error || 'No analytics data found.'}</p>
                <Button onClick={loadAnalytics} variant="outline">Retry</Button>
            </CardBody></Card>
        );
    }

    // Prepare chart data robustly
    const ticketSalesData = analytics.ticket_sales_timeline || [];

    // Convert object to array for PieChart
    const ageDemographics = Object.entries(analytics.demographics?.age_clusters || {}).map(([key, val]) => ({
        name: key, value: val
    }));

    // Convert interactions to array for BarChart
    const interactionTimeline = analytics.interaction_timeline || [];

    const statsCards = [
        { label: 'Unique Visitors', value: analytics.unique_visitors || 0, icon: Users, color: 'blue' },
        { label: 'Total Reactions', value: analytics.total_reactions || 0, icon: Heart, color: 'pink' },
        { label: 'Total Comments', value: analytics.total_comments || 0, icon: MessageSquare, color: 'green' },
        { label: 'Total Shares', value: analytics.total_shares || 0, icon: Share2, color: 'indigo' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-primary-600" /> Event Analytics Dashboard
                </h3>
                <Button variant="outline" size="sm">
                    <Download size={16} className="mr-2" /> Export Report
                </Button>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className={`bg-${stat.color}-50 p-5 rounded-2xl border border-${stat.color}-100 shadow-sm relative overflow-hidden group`}>
                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <p className={`text-sm font-medium text-${stat.color}-800 mb-1`}>{stat.label}</p>
                                    <p className={`text-3xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                                </div>
                                <div className={`p-2 bg-${stat.color}-200/50 rounded-lg text-${stat.color}-700`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-${stat.color}-800`}>
                                <Icon size={80} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Traffic & Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Traffic Trajectory */}
                <Card><CardBody>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" /> Daily Interaction Trajectory
                    </h4>
                    <div className="h-64 w-full">
                        {interactionTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={interactionTimeline} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="views" name="Page Views" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="interactions" name="Interactions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No timeline data available</div>
                        )}
                    </div>
                </CardBody></Card>

                {/* Ticket Sales Timeline */}
                <Card><CardBody>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-500" /> Ticket Sales Velocity
                    </h4>
                    <div className="h-64 w-full">
                        {ticketSalesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketSalesData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="tickets_sold" name="Tickets Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="revenue" name="Revenue ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No ticket sales data recorded yet.</div>
                        )}
                    </div>
                </CardBody></Card>
            </div>

            {/* Demographics & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Age Clusters */}
                <Card className="lg:col-span-1"><CardBody>
                    <h4 className="font-semibold text-gray-900 mb-4">Attendee Age Clusters</h4>
                    <div className="h-56">
                        {ageDemographics.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ageDemographics}
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {ageDemographics.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip itemStyle={{ color: '#1e293b' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Age data pending...</div>
                        )}
                    </div>
                </CardBody></Card>

                {/* Reaction Types */}
                <Card className="lg:col-span-1"><CardBody>
                    <h4 className="font-semibold text-gray-900 mb-4">Sentiment & Reactions</h4>
                    <div className="space-y-4">
                        {analytics.reaction_counts && Object.keys(analytics.reaction_counts).length > 0 ? (
                            Object.entries(analytics.reaction_counts).map(([type, count]) => {
                                const Icon = type === 'love' ? Heart : type === 'excited' ? Sparkles : Star;
                                const colorClass = type === 'love' ? 'text-red-500 bg-red-50' : type === 'excited' ? 'text-yellow-500 bg-yellow-50' : 'text-blue-500 bg-blue-50';

                                return (
                                    <div key={type} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${colorClass}`}>
                                                <Icon size={18} />
                                            </div>
                                            <span className="capitalize font-medium text-gray-700">{type}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{count}</span>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm py-12">No reactions yet</div>
                        )}
                    </div>
                </CardBody></Card>

                {/* Location Map Placeholder */}
                <Card className="lg:col-span-1"><CardBody>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-indigo-500" /> Geographic Dispersion
                    </h4>
                    <div className="h-56 w-full rounded-xl bg-slate-100 flex flex-col items-center justify-center overflow-hidden relative border border-slate-200">
                        <MapPin size={48} className="text-slate-300 mb-2" />
                        <p className="text-slate-400 text-sm">Regional heatmaps unlock at 50+ attendees.</p>

                        {/* Optional mock list if locations exist */}
                        {analytics.demographics?.locations && Object.keys(analytics.demographics.locations).length > 0 && (
                            <div className="absolute inset-0 bg-white/95 p-4 backdrop-blur-sm overflow-y-auto">
                                <div className="space-y-2">
                                    {Object.entries(analytics.demographics.locations).map(([loc, count]) => (
                                        <div key={loc} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 truncate mr-2">{loc || 'Unknown'}</span>
                                            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody></Card>

            </div>
        </div>
    );
};

export default EventAnalyticsDashboard;
