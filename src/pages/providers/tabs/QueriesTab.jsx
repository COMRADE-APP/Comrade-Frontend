import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, AlertTriangle, CheckCircle, Clock, Send, Info } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';

const STATUS_CONFIG = {
    open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', label: 'Open' },
    in_progress: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30', label: 'In Progress' },
    resolved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30', label: 'Resolved' },
    escalated: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30', label: 'Escalated' },
    closed: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800', label: 'Closed' },
};

const QueriesTab = ({ provider, onRefresh }) => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [resolveNotes, setResolveNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadQueries();
    }, [provider.id]);

    const loadQueries = async () => {
        setLoading(true);
        try {
            const res = await providerService.getProviderQueries({ provider_id: provider.id });
            setQueries(res.results || res || []);
        } catch (e) {
            console.error('Failed to load queries:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        setSubmitting(true);
        try {
            let payload = {};
            if (action === 'resolve') payload = { resolution_notes: resolveNotes };
            await providerService.handleQueryAction(selectedQuery.id, action, payload);
            if (action === 'resolve') setResolveNotes('');
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
        const matchSearch = !search || q.subject.toLowerCase().includes(search.toLowerCase()) || (q.user_name || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || q.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
            {/* Left: Query List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 overflow-hidden border-r border-theme pr-4">
                <div className="flex flex-col gap-3 shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search queries..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="p-4 rounded-xl border border-theme bg-secondary/5 skeleton-shimmer h-24" />
                        ))
                    ) : filteredQueries.length === 0 ? (
                        <div className="text-center p-6 text-secondary text-sm">
                            No queries found
                        </div>
                    ) : (
                        filteredQueries.map(q => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuery(q)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    selectedQuery?.id === q.id
                                        ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-700'
                                        : 'bg-elevated border-theme hover:bg-secondary/5'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-semibold text-primary text-sm truncate pr-2">{q.subject}</h5>
                                    <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CONFIG[q.status]?.color}`}>
                                        {STATUS_CONFIG[q.status]?.label}
                                    </span>
                                </div>
                                <p className="text-xs text-secondary truncate">{q.user_name}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-secondary">{new Date(q.created_at).toLocaleDateString()}</span>
                                    {q.priority === 'urgent' && <span className="text-[10px] text-red-600 font-bold flex items-center"><AlertTriangle size={10} className="mr-0.5" /> URGENT</span>}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Query Detail */}
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full overflow-hidden">
                {!selectedQuery ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-secondary border border-theme rounded-2xl bg-secondary/5">
                        <MessageSquare size={48} className="text-primary/20 mb-4" />
                        <p>Select a query from the list to view details and respond</p>
                    </div>
                ) : (
                    <Card className="flex-1 flex flex-col border-theme h-full">
                        {/* Detail Header */}
                        <div className="p-5 border-b border-theme shrink-0 bg-secondary/5">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-primary mb-1">{selectedQuery.subject}</h3>
                                    <p className="text-sm text-secondary flex items-center gap-2">
                                        <span className="font-semibold text-primary">{selectedQuery.user_name}</span>
                                        <span>({selectedQuery.user_email})</span>
                                        <span>·</span>
                                        <span>{new Date(selectedQuery.created_at).toLocaleString()}</span>
                                    </p>
                                    {selectedQuery.service_product_name && (
                                        <p className="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
                                            Related Product: {selectedQuery.service_product_name}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {selectedQuery.status === 'open' && (
                                        <Button variant="outline" size="sm" onClick={() => handleAction('assign')} disabled={submitting}>
                                            Assign to me
                                        </Button>
                                    )}
                                    {selectedQuery.status !== 'resolved' && selectedQuery.status !== 'closed' && (
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('escalate')} disabled={submitting}>
                                            Escalate
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thread/Description */}
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                            <div className="bg-background rounded-xl p-4 border border-theme shadow-sm mb-6">
                                <p className="text-sm text-primary whitespace-pre-wrap">{selectedQuery.description}</p>
                            </div>

                            {selectedQuery.resolution_notes && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-6">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm">
                                        <CheckCircle size={16} /> Resolution Notes
                                    </div>
                                    <p className="text-sm text-emerald-800">{selectedQuery.resolution_notes}</p>
                                    {selectedQuery.resolved_at && (
                                        <p className="text-xs text-emerald-600 mt-2">Resolved on: {new Date(selectedQuery.resolved_at).toLocaleString()}</p>
                                    )}
                                </div>
                            )}

                            {selectedQuery.satisfaction_rating && (
                                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                                    <span className="font-bold">Customer Rating:</span>
                                    {'★'.repeat(selectedQuery.satisfaction_rating)}{'☆'.repeat(5 - selectedQuery.satisfaction_rating)}
                                </div>
                            )}
                        </div>

                        {/* Action Area */}
                        {(selectedQuery.status === 'in_progress' || selectedQuery.status === 'open') && (
                            <div className="p-5 border-t border-theme shrink-0 bg-background">
                                <label className="block text-sm font-medium text-primary mb-2">Resolution Notes</label>
                                <textarea
                                    rows={3}
                                    value={resolveNotes}
                                    onChange={e => setResolveNotes(e.target.value)}
                                    placeholder="Explain how this was resolved..."
                                    className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                                />
                                <div className="flex justify-end gap-3">
                                    <Button variant="primary" onClick={() => handleAction('resolve')} disabled={submitting || !resolveNotes.trim()}>
                                        <CheckCircle size={16} className="mr-1.5" /> Mark as Resolved
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default QueriesTab;
