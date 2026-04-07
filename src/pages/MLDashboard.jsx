import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Database, Network, Layers, Activity, Server, FileText, Bot } from 'lucide-react';
import api from '../services/api';
import Card, { CardBody, CardHeader } from '../components/common/Card';

const MLDashboard = () => {
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
                    <p className="text-secondary">Syncing Live Telemetry...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Error loading data. Cannot connect to Django Server.</div>;

    const { metrics } = data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <Activity className="w-8 h-8 mr-3 text-primary-600" />
                        Comrade ML Ops Center
                    </h1>
                    <p className="text-secondary mt-1">Live monitoring of mass data scraping and neural network pipelines.</p>
                </div>
            </div>

            {/* Top Level Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-secondary font-bold uppercase">Pricing Agent (RL)</p>
                                <p className={`text-xl font-bold ${metrics.is_pricing_training ? "text-green-500" : "text-primary"}`}>
                                    {metrics.is_pricing_training ? "ACTIVE" : "IDLE"}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card className={metrics.scrape_status?.active_scrapers > 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-slate-400"}>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${metrics.scrape_status?.active_scrapers > 0 ? 'bg-green-500/10' : 'bg-slate-400/10'}`}>
                                <Database className={`w-5 h-5 ${metrics.scrape_status?.active_scrapers > 0 ? 'text-green-600' : 'text-slate-500'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-secondary font-bold uppercase">Raw Extracted Data</p>
                                <p className="text-xl font-bold text-primary">
                                    {metrics.scrape_status ? (
                                        <>
                                            {metrics.scrape_status.current_size_gb} <span className="text-sm text-secondary">/ {metrics.scrape_status.target_size_gb} GB</span>
                                        </>
                                    ) : (
                                        `${metrics.total_scraped_data_mb} MB`
                                    )}
                                </p>
                            </div>
                        </div>
                        {metrics.scrape_status && (
                            <div className="mt-4 pt-4 border-t border-theme flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-secondary font-medium">Scraper Target Engine:</span>
                                    <span className={`font-bold ${metrics.scrape_status.active_scrapers > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                                        {metrics.scrape_status.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-secondary font-medium">Active Array Tunnels:</span>
                                    <span className="font-bold text-primary">{metrics.scrape_status.active_scrapers} / 28 Channels</span>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-l-primary-600">
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center">
                                <Server className="w-5 h-5 text-primary-700" />
                            </div>
                            <div>
                                <p className="text-xs text-secondary font-bold uppercase">Storage Sync Status</p>
                                <p className="text-xl font-bold text-primary">Healthy</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Neural Matrix Component Navigator */}
            <h2 className="text-xl font-bold text-primary mt-8 mb-4 border-b border-theme pb-2">Neural Network Matrix & Scraping Tunnels</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Pricing RL Card */}
                <div
                    onClick={() => navigate('/admin/ml/pricing')}
                    className="cursor-pointer group relative overflow-hidden rounded-xl border border-theme bg-elevated p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary-600/50"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BrainCircuit className="w-24 h-24 text-primary-700" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-primary-600/10 flex items-center justify-center mb-4 text-primary-700">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">Pricing RL Agent</h3>
                        <p className="text-sm text-secondary mb-4 line-clamp-2">
                            Deep Reinforcement Learning applied to volatile global e-commerce supply chains tracking Q-Values and Reward trajectories.
                        </p>
                        <span className="text-sm font-semibold text-primary-700 group-hover:text-primary-600 flex items-center">
                            View Analytics &rarr;
                        </span>
                    </div>
                </div>

                {/* Recommendation Card */}
                <div
                    onClick={() => navigate('/admin/ml/recommendation')}
                    className="cursor-pointer group relative overflow-hidden rounded-xl border border-theme bg-elevated p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/50"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Network className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                            <Network className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">Categorization Pipeline</h3>
                        <p className="text-sm text-secondary mb-4 line-clamp-2">
                            Dual-stream text extraction to automatically categorize massive scraping data and recommend subsets.
                        </p>
                        <span className="text-sm font-semibold text-emerald-500 group-hover:text-emerald-400 flex items-center">
                            View Analytics &rarr;
                        </span>
                    </div>
                </div>

                {/* Distribution Card */}
                <div
                    onClick={() => navigate('/admin/ml/distribution')}
                    className="cursor-pointer group relative overflow-hidden rounded-xl border border-theme bg-elevated p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-blue-500/50"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">Distribution Optimizer</h3>
                        <p className="text-sm text-secondary mb-4 line-clamp-2">
                            Multi-objective optimization tracking defining Supplier Gains vs Affordability matrices based on system constraints.
                        </p>
                        <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-400 flex items-center">
                            View Analytics &rarr;
                        </span>
                    </div>
                </div>

                {/* Scraping Tracker Card */}
                <div
                    onClick={() => navigate('/admin/ml/scraping')}
                    className="cursor-pointer group relative overflow-hidden rounded-xl border border-theme bg-elevated p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-orange-500/50"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database className="w-24 h-24 text-orange-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                            <Database className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">Scraping Architecture</h3>
                        <p className="text-sm text-secondary mb-4 line-clamp-2">
                            Deep analysis of the 28-platform distributed scraping spiders with live pipeline logging console.
                        </p>
                        <span className="text-sm font-semibold text-orange-500 group-hover:text-orange-400 flex items-center">
                            View Logs & Analytics &rarr;
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MLDashboard;
