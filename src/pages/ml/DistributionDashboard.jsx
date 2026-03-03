import React, { useState, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ArrowLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

const DistributionDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMLData = async () => {
            try {
                const res = await api.get('/api/payments/ml-dashboard/');
                setData(res.data);
            } catch (err) {
                console.error("Failed to load ML logs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMLData();
        const interval = setInterval(fetchMLData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary">Evaluating distribution loss equations...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Error loading data. Cannot connect to Django Server.</div>;

    const { distribution, distribution_metrics } = data.models;

    const getTierDistributionData = (tiers, type = 'individual') => {
        if (!tiers) return [];
        return tiers.map(t => ({
            name: t.name,
            Supplier_Gain: t[type].supplier_gain,
            Platform_Fee: t[type].platform_fee,
            User_Discount: t[type].user_discount
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/admin/ml-dashboard')} className="border-theme text-secondary hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to ML Hub
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <Layers className="w-8 h-8 mr-3 text-blue-500" />
                        Tier Pricing Distribution Engine
                    </h1>
                    <p className="text-secondary mt-1">Multi-objective optimizer strictly defining Supplier Gains vs Affordability based on user constraints.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="p-4 border-b border-theme flex flex-col items-start bg-elevated/50">
                        <h3 className="font-semibold text-primary">Training Loss Rates</h3>
                        <p className="text-xs text-secondary mt-1">Tracking loss convergence over continuous backpropagation intervals.</p>
                    </CardHeader>
                    <CardBody className="p-6 bg-elevated h-[350px]">
                        {distribution && distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={distribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                                    <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="total_loss" stroke="#8b5cf6" fillOpacity={0.1} fill="#8b5cf6" name="Total Loss" />
                                    <Area type="monotone" dataKey="supplier_loss" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" name="Supplier Margin Penality" />
                                    <Area type="monotone" dataKey="affordability_penalty" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" name="Affordability Penalty" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="flex justify-center items-center h-full"><p className="text-sm text-secondary">No training data yet.</p></div>}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="p-4 border-b border-theme flex flex-col items-start bg-elevated/50">
                        <h3 className="font-semibold text-primary">Initial Platform Affordability Target</h3>
                        <p className="text-xs text-secondary mt-1">Expected margin mapping inferred globally from existing platform states.</p>
                    </CardHeader>
                    <CardBody className="p-6 bg-elevated h-[350px]">
                        {distribution_metrics?.platforms ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={distribution_metrics.platforms}>
                                    <PolarGrid stroke="#475569" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} stroke="#475569" />
                                    <Radar name="Supplier Gain Target" dataKey="supplier_margin" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.5} />
                                    <Radar name="User Savings Mode" dataKey="customer_gain" stroke="#3b82f6" fill="#bfdbfe" fillOpacity={0.5} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex justify-center items-center h-full"><p className="text-sm text-secondary">No telemetry data.</p></div>}
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="p-4 border-b border-theme flex flex-col items-start bg-elevated/50">
                        <h3 className="font-semibold text-primary">Inferred Distribution (Individual Buy)</h3>
                    </CardHeader>
                    <CardBody className="p-6 bg-elevated h-[350px]">
                        {distribution_metrics?.tiers ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getTierDistributionData(distribution_metrics.tiers, 'individual')} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#475569" opacity={0.2} />
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} width={70} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="Supplier_Gain" stackId="a" fill="#38bdf8" name="Supplier Margin" />
                                    <Bar dataKey="Platform_Fee" stackId="a" fill="#64748b" name="Comrade Fee" />
                                    <Bar dataKey="User_Discount" stackId="a" fill="#10b981" name="User Discount" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="invisible">x</p>}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="p-4 border-b border-theme flex flex-col items-start bg-elevated/50">
                        <h3 className="font-semibold text-primary">Inferred Distribution (Group Buy)</h3>
                    </CardHeader>
                    <CardBody className="p-6 bg-elevated h-[350px]">
                        {distribution_metrics?.tiers ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getTierDistributionData(distribution_metrics.tiers, 'group')} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#475569" opacity={0.2} />
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} width={70} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="Supplier_Gain" stackId="a" fill="#38bdf8" name="Supplier Margin" />
                                    <Bar dataKey="Platform_Fee" stackId="a" fill="#64748b" name="Comrade Fee" />
                                    <Bar dataKey="User_Discount" stackId="a" fill="#fb923c" name="Group Discount" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="invisible">x</p>}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default DistributionDashboard;
