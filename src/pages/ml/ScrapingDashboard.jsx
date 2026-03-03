import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Database, Terminal, Activity, ShieldAlert, BrainCircuit, Network, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

const ScrapingDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const terminalRef = useRef(null);

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
        const interval = setInterval(fetchMLData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [data?.metrics?.pipeline_logs]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary">Establishing connection to Scraping Array...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-red-500">Error loading data. Cannot connect to Django Server.</div>;

    const { metrics } = data;
    const { scrape_status, pipeline_logs } = metrics;

    const isActive = scrape_status?.active_scrapers > 0 || scrape_status?.phase === 'training';
    const statusColor = isActive ? 'text-green-500' : 'text-slate-400';
    const borderColor = isActive ? 'border-green-500/50' : 'border-slate-500/50';

    const modelCards = [
        { key: 'pricing', label: 'Pricing RL Agent', color: 'purple', Icon: BrainCircuit },
        { key: 'recommendation', label: 'Recommendation NN', color: 'emerald', Icon: Network },
        { key: 'distribution', label: 'Distribution Model', color: 'blue', Icon: Layers },
    ];

    const statusColorMap = {
        idle: 'text-slate-400',
        queued: 'text-yellow-400',
        training: 'text-green-500 animate-pulse',
        complete: 'text-blue-400',
    };

    const barColorMap = {
        idle: 'bg-slate-600',
        queued: 'bg-yellow-500/50',
        training: 'bg-green-500',
        complete: 'bg-blue-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/admin/ml-dashboard')} className="border-theme text-secondary hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to ML Hub
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <Database className="w-8 h-8 mr-3 text-emerald-500" />
                        Scraping Telemetry & Training
                    </h1>
                    <p className="text-secondary mt-1">Live data scraping across 28 platforms and sequential model training.</p>
                </div>
            </div>

            {/* Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={`border-l-4 ${isActive ? "border-l-green-500" : "border-l-slate-500"}`}>
                    <CardBody className="p-4">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center">
                            <Activity className="w-4 h-4 mr-1" /> Pipeline Phase
                        </h3>
                        <p className={`mt-1 text-xl font-black ${statusColor}`}>
                            {scrape_status ? scrape_status.status.toUpperCase() : "IDLE"}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Active Tunnels</h3>
                        <p className="mt-1 text-xl font-black text-primary">
                            {scrape_status ? `${scrape_status.active_scrapers} / 28` : "0 / 28"}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider">Storage Downloaded</h3>
                        <p className="mt-1 text-xl font-black text-blue-500">
                            {scrape_status ? `${parseFloat(scrape_status.current_size_gb).toFixed(4)} GB` : "0.0000 GB"}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center">
                            <ShieldAlert className="w-4 h-4 mr-1 text-orange-500" /> Total Scraped
                        </h3>
                        <p className="mt-1 text-xl font-black text-orange-500">
                            {parseFloat(metrics.total_scraped_data_mb / 1024).toFixed(3)} GB
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Per-Model Training Progress */}
            <h2 className="text-xl font-bold text-primary border-b border-theme pb-2">Model Training Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modelCards.map(({ key, label, color, Icon }) => {
                    const model = scrape_status?.[key] || { status: 'idle', rows: 0, progress_pct: 0 };
                    const targetRows = scrape_status?.target_rows || 100;
                    const pct = model.status === 'complete' ? 100 :
                        model.progress_pct || Math.min((model.rows / targetRows) * 100, 100);

                    return (
                        <Card key={key}>
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                        <Icon className={`w-4 h-4 text-${color}-500`} /> {label}
                                    </h3>
                                    <span className={`text-xs font-black uppercase tracking-wider ${statusColorMap[model.status] || 'text-slate-400'}`}>
                                        {model.status}
                                    </span>
                                </div>
                                <p className="text-xs text-secondary mb-2">
                                    {model.rows} rows {model.status === 'complete' ? 'trained' : 'collected'}
                                    {scrape_status?.target_rows ? ` / ${scrape_status.target_rows} target` : ''}
                                </p>
                                <div className="w-full bg-slate-700/30 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${barColorMap[model.status] || 'bg-slate-600'}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Live Terminal */}
            <Card className={`border ${borderColor} bg-[#0f172a]`}>
                <CardHeader className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center">
                        <Terminal className="w-5 h-5 text-slate-400 mr-2" />
                        <h3 className="font-semibold text-slate-200 font-mono tracking-wider">LIVE_CONSOLE_FEED // pipeline.log</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isActive ? 'bg-green-400' : 'bg-slate-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                        </span>
                        <span className="text-xs text-slate-400 font-mono uppercase tracking-wider ml-1">Live Sync</span>
                    </div>
                </CardHeader>
                <CardBody className="p-0 relative">
                    <div
                        ref={terminalRef}
                        className="bg-[#020617] h-[400px] overflow-y-auto p-4 font-mono text-sm text-green-400 leading-relaxed custom-scrollbar"
                    >
                        {pipeline_logs && pipeline_logs.length > 0 ? (
                            pipeline_logs.map((logLine, index) => {
                                let lineClass = "text-green-500";
                                if (logLine.includes("ERROR")) lineClass = "text-red-500 font-bold";
                                else if (logLine.includes("WARNING")) lineClass = "text-yellow-400";
                                else if (logLine.includes("[PRICING]") || logLine.includes("[RECOMMENDATION]") || logLine.includes("[DISTRIBUTION]")) lineClass = "text-cyan-400";
                                else if (logLine.includes("TRAINING") || logLine.includes("Starting") || logLine.includes("Complete")) lineClass = "text-blue-400 font-bold";

                                return (
                                    <div key={index} className={`whitespace-pre-wrap break-all ${lineClass}`}>
                                        {logLine}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-slate-500 italic">No logs detected in pipeline.log... Initialize scraping process.</div>
                        )}
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-10"></div>
                </CardBody>
            </Card>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #0f172a; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #334155; 
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #475569; 
                }
            `}</style>
        </div>
    );
};

export default ScrapingDashboard;
