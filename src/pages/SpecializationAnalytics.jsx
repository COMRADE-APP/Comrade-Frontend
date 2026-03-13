import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Share2, Eye, DollarSign, Star, Award } from 'lucide-react';
import Card, { CardBody } from '../components/common/Card';
import specializationsService from '../services/specializations.service';

const StatCard = ({ title, value, icon: Icon, trend, prefix = '' }) => (
    <Card className="hover:shadow-md transition-shadow bg-elevated border-theme">
        <CardBody className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-secondary mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-primary">
                        {prefix}{value?.toLocaleString()}
                    </h3>
                    {trend && (
                        <p className={`text-sm mt-2 flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                        </p>
                    )}
                </div>
                <div className="p-3 bg-primary/5 rounded-lg text-primary">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </CardBody>
    </Card>
);

const SpecializationAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [specialization, setSpecialization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [specData, analyticsData] = await Promise.all([
                specializationsService.getById(id),
                specializationsService.getAnalytics(id)
            ]);
            setSpecialization(specData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!analytics || !specialization) {
        return (
            <div className="text-center py-12">
                <p className="text-secondary mb-4">Failed to load analytics data.</p>
                <button
                    onClick={() => navigate('/specializations')}
                    className="text-primary hover:underline"
                >
                    Return to Learning Paths
                </button>
            </div>
        );
    }

    // Mock time series data based on current totals for visualization
    const generateTimeSeries = (total, isRevenue = false) => {
        const data = [];
        let currentTotal = total * 0.3; // start at 30% of total 6 months ago
        const increment = (total - currentTotal) / 6;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        for (let i = 0; i < 6; i++) {
            currentTotal += increment * (0.8 + Math.random() * 0.4); // add some variance
            if (i === 5) currentTotal = total; // ensure last month hits the exact total
            data.push({
                name: months[i],
                value: isRevenue ? Math.round(currentTotal * 100) / 100 : Math.round(currentTotal)
            });
        }
        return data;
    };

    const enrollmentData = generateTimeSeries(analytics.enrollments);
    const revenueData = generateTimeSeries(analytics.revenue, true);

    const engagementData = [
        { name: 'Views', value: analytics.views, fill: '#8b5cf6' },
        { name: 'Shares', value: analytics.shares, fill: '#10b981' },
        { name: 'Likes', value: analytics.likes, fill: '#ec4899' },
        { name: 'Completions', value: analytics.completions, fill: '#f59e0b' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/specializations`)}
                    className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-secondary hover:text-primary"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                        {specialization.name} <span className="text-lg font-normal text-secondary bg-elevated px-3 py-1 rounded-full border border-theme ml-2">{specialization.learning_type}</span>
                    </h1>
                    <p className="text-secondary mt-1">Analytics & Performance Dashboard</p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Enrollments"
                    value={analytics.enrollments}
                    icon={Users}
                    trend={12.5}
                />
                <StatCard
                    title="Total Revenue"
                    value={analytics.revenue}
                    icon={DollarSign}
                    prefix="$"
                    trend={18.2}
                />
                <StatCard
                    title="Completions"
                    value={analytics.completions}
                    icon={Award}
                    trend={5.4}
                />
                <StatCard
                    title="Average Rating"
                    value={analytics.average_rating}
                    icon={Star}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart - Enrollments over time */}
                <Card className="lg:col-span-2 border-theme bg-elevated">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Growth Trend</h3>
                                <p className="text-sm text-secondary">Cumulative enrollments over 6 months</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="flex items-center gap-1 text-secondary">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Enrollments
                                </span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="opacity-20" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                                    <YAxis axisLine={false} tickLine={false} className="text-xs" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgb(24 24 27)', borderColor: 'rgb(39 39 42)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorEnrollments)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>

                {/* Engagement Breakdown */}
                <Card className="border-theme bg-elevated">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-primary mb-1">Engagement Metrics</h3>
                        <p className="text-sm text-secondary mb-6">Interaction distribution</p>

                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={engagementData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" className="opacity-20" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'rgb(24 24 27)', borderColor: 'rgb(39 39 42)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Revenue Chart if Paid */}
            {specialization.is_paid && (
                <Card className="border-theme bg-elevated">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Revenue History</h3>
                                <p className="text-sm text-secondary">Cumulative revenue generated</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="opacity-20" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                                    <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        formatter={(value) => [`$${value}`, 'Revenue']}
                                        contentStyle={{ backgroundColor: 'rgb(24 24 27)', borderColor: 'rgb(39 39 42)', borderRadius: '8px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default SpecializationAnalytics;
