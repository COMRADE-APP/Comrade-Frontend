import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

const PricingDashboard = () => {
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
        const interval = setInterval(fetchMLData, 30000); // Polling
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary">Connecting to Neural Matrix...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Error loading data. Cannot connect to Django Server.</div>;

    const { pricing } = data.models;
    const { is_pricing_training } = data.metrics;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/admin/ml-dashboard')} className="border-theme text-secondary hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to ML Hub
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <BrainCircuit className="w-8 h-8 mr-3 text-purple-600" />
                        Pricing Reinforcement Agent (TD3)
                    </h1>
                    <p className="text-secondary mt-1">Deep Reinforcement Learning applied to volatile global e-commerce supply chains.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={is_pricing_training ? "border-l-4 border-l-green-500" : "border-l-4 border-l-slate-500"}>
                    <CardBody className="p-6">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Agent Trance State</h3>
                        <p className={`mt-2 text-3xl font-black ${is_pricing_training ? "text-green-500" : "text-primary"}`}>
                            {is_pricing_training ? "ACTIVE (TRAINING)" : "INFERENCE READY"}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-6">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Memory Buffer Size</h3>
                        <p className="mt-2 text-3xl font-black text-primary">1e6 Transitions</p>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader className="p-4 border-b border-theme flex flex-col items-start">
                    <h3 className="font-semibold text-primary">Q-Value & Cumulative Reward Tracking</h3>
                    <p className="text-xs text-secondary mt-1">
                        Tracking the TD3 agent's exploration vs exploitation logic over continuous training episodes.
                    </p>
                </CardHeader>
                <CardBody className="p-6">
                    {pricing && pricing.length > 0 && !pricing[0].error ? (
                        <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pricing}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="episode" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="reward" stroke="#8b5cf6" name="Cumulative Reward" dot={false} strokeWidth={3} />
                                    <Line yAxisId="right" type="step" dataKey="tier_upgrades" stroke="#ec4899" name="Tier Advancement Ratio" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px]">
                            <p className="text-secondary text-sm">Awaiting continuous scraper trigger to instantiate Buffer Matrix...</p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default PricingDashboard;
