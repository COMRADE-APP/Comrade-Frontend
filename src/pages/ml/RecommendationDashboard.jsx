import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

const RecommendationDashboard = () => {
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
                    <p className="text-secondary">Syncing embedding layers...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Error loading data. Cannot connect to Django Server.</div>;

    const { recommendation } = data.models;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/admin/ml-dashboard')} className="border-theme text-secondary hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to ML Hub
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <Network className="w-8 h-8 mr-3 text-emerald-500" />
                        Categorization & Recommendation Pipeline
                    </h1>
                    <p className="text-secondary mt-1">Dual-stream text extraction to automatically categorize the massive scraping influx.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardBody className="p-6 border-l-4 border-l-red-500 rounded-lg">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Categorization Status</h3>
                        <p className="mt-2 text-3xl font-black text-primary">Monitoring Loss</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-6 border-l-4 border-l-emerald-500 rounded-lg">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Recommendation Matrix</h3>
                        <p className="mt-2 text-3xl font-black text-primary">DQN Evaluator</p>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader className="p-4 border-b border-theme flex flex-col items-start bg-elevated/50">
                    <h3 className="font-semibold text-primary text-xl">Model Training Loss Trajectory</h3>
                    <p className="text-xs text-secondary mt-1">
                        Tracking error depreciation between embedding category resolution and user-state mapping.
                    </p>
                </CardHeader>
                <CardBody className="p-6 bg-elevated">
                    {recommendation && recommendation.length > 0 && !recommendation[0].error ? (
                        <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={recommendation}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#475569" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="cat_loss" stroke="#ef4444" name="Categorization Loss" dot={false} strokeWidth={3} />
                                    <Line type="monotone" dataKey="rec_loss" stroke="#10b981" name="DQN Action Loss" dot={false} strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px]">
                            <p className="text-secondary text-sm">Awaiting neural network instantiation...</p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default RecommendationDashboard;
