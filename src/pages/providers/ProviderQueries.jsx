import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Search, CheckCircle, AlertTriangle, Clock,
    XCircle, User, Mail, Loader2, Star, RefreshCw
} from 'lucide-react';
import providerService from '../../services/provider.service';

const STATUS_CONFIG = {
    open: { color: 'bg-blue-100 text-blue-700', label: 'Open', icon: Clock },
    in_progress: { color: 'bg-amber-100 text-amber-700', label: 'In Progress', icon: Clock },
    pending_response: { color: 'bg-purple-100 text-purple-700', label: 'Pending Response', icon: Clock },
    resolved: { color: 'bg-emerald-100 text-emerald-700', label: 'Resolved', icon: CheckCircle },
    escalated: { color: 'bg-red-100 text-red-700', label: 'Escalated', icon: AlertTriangle },
    closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed', icon: XCircle },
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'text-gray-500' },
    medium: { label: 'Medium', color: 'text-blue-500' },
    high: { label: 'High', color: 'text-orange-500' },
    urgent: { label: 'Urgent', color: 'text-red-500' },
};

const ProviderQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [resolveNotes, setResolveNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await providerService.getProviderQueries();
            const data = res.results || res || [];
            setQueries(data);
        } catch (e) {
            console.error('Failed to load queries:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAction = async (action) => {
        if (!selectedQuery) return;
        setSubmitting(true);
        try {
            if (action === 'resolve') {
                await providerService.handleQueryAction(selectedQuery.id, 'resolve', { notes: resolveNotes });
                setResolveNotes('');
            } else if (action === 'assign') {
                await providerService.handleQueryAction(selectedQuery.id, 'assign', { assignee: 'self' });
            } else if (action === 'escalate') {
                await providerService.handleQueryAction(selectedQuery.id, 'escalate');
            }

            setSelectedQuery(null);
            loadQueries();
        } catch (e) {
            console.error(`Failed to ${action} query:`, e);
            alert(`Failed to ${action} query. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchSearch = !search ||
            q.subject?.toLowerCase().includes(search.toLowerCase()) ||
            q.user_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || q.status === filterStatus;
        const matchPriority = !filterPriority || q.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    const statusCounts = queries.reduce((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Customer Queries
                    </h1>
                    <p className="text-secondary text-sm mt-1">Manage inquiries from users about your services.</p>
                </div>
                <button
                    onClick={() => loadQueries(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-elevated border rounded-xl text-secondary hover:bg-secondary/10 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    const Icon = config.icon;
                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all text-left ${
                                filterStatus === status
                                    ? 'border-primary bg-primary-50/30'
                                    : 'bg-elevated hover:bg-secondary/5'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                                <span className="text-xs text-secondary">{config.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{count}</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search queries..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border bg-elevated text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="rounded-xl border bg-elevated px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Priorities</option>
                    {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
                        <option key={val} value={val}>{cfg.label}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border bg-elevated px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                        <option key={val} value={val}>{cfg.label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-350px)] min-h-[500px]">
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 overflow-hidden border-r pr-4">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredQueries.length === 0 ? (
                            <div className="text-center p-8 text-secondary">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No queries found</p>
                            </div>
                        ) : (
                            filteredQueries.map(q => {
                                const StatusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.open;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setSelectedQuery(q)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            selectedQuery?.id === q.id
                                                ? 'bg-primary-50 border-primary-300'
                                                : 'bg-elevated hover:bg-secondary/5'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-semibold text-primary text-sm truncate pr-2">{q.subject}</h5>
                                            {q.priority === 'urgent' && (
                                                <span className="text-[10px] text-red-600 font-bold flex items-center">
                                                    <AlertTriangle size={10} className="mr-0.5" /> URGENT
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-secondary mb-2">
                                            <User className="w-3 h-3" />
                                            {q.user_name}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${StatusCfg.color}`}>
                                                {StatusCfg.label}
                                            </span>
                                            <span className="text-[10px] text-secondary">
                                                {new Date(q.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full overflow-hidden">
                    {!selectedQuery ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-secondary border rounded-2xl bg-secondary/5">
                            <MessageSquare size={48} className="text-primary/20 mb-4" />
                            <p>Select a query from the list to view details and respond</p>
                        </div>
                    ) : (
                        <div className="bg-elevated border rounded-2xl flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b bg-secondary/5">
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {(() => {
                                                const StatusCfg = STATUS_CONFIG[selectedQuery.status] || STATUS_CONFIG.open;
                                                const PriorityCfg = PRIORITY_CONFIG[selectedQuery.priority] || PRIORITY_CONFIG.medium;
                                                return (
                                                    <>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${StatusCfg.color}`}>
                                                            {StatusCfg.label}
                                                        </span>
                                                        <span className={`text-xs font-medium ${PriorityCfg.color}`}>
                                                            {PriorityCfg.label} Priority
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <h3 className="text-xl font-bold text-primary mb-2">{selectedQuery.subject}</h3>
                                        <div className="flex items-center gap-4 text-sm text-secondary">
                                            <span className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {selectedQuery.user_name}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {selectedQuery.user_email}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(selectedQuery.created_at).toLocaleString()}</span>
                                        </div>
                                        {selectedQuery.reference_id && (
                                            <p className="text-xs text-tertiary mt-2">
                                                Reference ID: {selectedQuery.reference_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="bg-primary rounded-xl p-5 border shadow-sm mb-6">
                                    <p className="text-sm text-primary whitespace-pre-wrap">{selectedQuery.description}</p>
                                </div>

                                {selectedQuery.resolution_notes && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-6">
                                        <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-sm">
                                            <CheckCircle size={16} /> Resolution Notes
                                        </div>
                                        <p className="text-sm text-emerald-800">{selectedQuery.resolution_notes}</p>
                                        {selectedQuery.resolved_at && (
                                            <p className="text-xs text-emerald-600 mt-3">
                                                Resolved on: {new Date(selectedQuery.resolved_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedQuery.satisfaction_rating && (
                                    <div className="flex items-center gap-3 mt-4 p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                                        <span className="font-bold">Customer Rating:</span>
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    className={`w-5 h-5 ${
                                                        star <= selectedQuery.satisfaction_rating
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm">({selectedQuery.satisfaction_rating}/5)</span>
                                    </div>
                                )}
                            </div>

                            {(selectedQuery.status === 'open' || selectedQuery.status === 'in_progress') && (
                                <div className="p-6 border-t bg-primary">
                                    <div className="flex gap-3 mb-4">
                                        {selectedQuery.status === 'open' && (
                                            <button
                                                onClick={() => handleAction('assign')}
                                                disabled={submitting}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                                            >
                                                Take Ownership
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            Resolution Notes {selectedQuery.status !== 'resolved' && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={resolveNotes}
                                            onChange={e => setResolveNotes(e.target.value)}
                                            placeholder="Explain how this query was resolved..."
                                            className="w-full rounded-xl border bg-primary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => handleAction('escalate')}
                                            disabled={submitting}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            Escalate
                                        </button>
                                        <button
                                            onClick={() => handleAction('resolve')}
                                            disabled={submitting || !resolveNotes.trim()}
                                            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Mark Resolved
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProviderQueries;
