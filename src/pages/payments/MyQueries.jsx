import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, Search, Filter, Plus, Clock, CheckCircle, AlertTriangle, 
    XCircle, ChevronRight, Loader2, Star, RefreshCw 
} from 'lucide-react';
import providerService from '../../services/provider.service';
import Button from '../../components/common/Button';

const STATUS_CONFIG = {
    open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', label: 'Open', icon: Clock },
    in_progress: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30', label: 'In Progress', icon: Clock },
    pending_response: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30', label: 'Pending Response', icon: Clock },
    resolved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30', label: 'Resolved', icon: CheckCircle },
    escalated: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30', label: 'Escalated', icon: AlertTriangle },
    closed: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800', label: 'Closed', icon: XCircle },
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'text-gray-500' },
    medium: { label: 'Medium', color: 'text-blue-500' },
    high: { label: 'High', color: 'text-orange-500' },
    urgent: { label: 'Urgent', color: 'text-red-500' },
};

const MyQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterProvider, setFilterProvider] = useState('');
    const [providers, setProviders] = useState([]);
    const [ratingModal, setRatingModal] = useState(null);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        loadQueries();
        loadProviders();
    }, []);

    const loadQueries = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await providerService.getMyQueries();
            setQueries(res.results || res || []);
        } catch (e) {
            console.error('Failed to load queries:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadProviders = async () => {
        try {
            const res = await providerService.getActiveProviders();
            setProviders(res.results || res || []);
        } catch (e) {
            console.error('Failed to load providers:', e);
        }
    };

    const handleRateQuery = async () => {
        if (!ratingModal) return;
        setSubmittingRating(true);
        try {
            await providerService.rateQuery(ratingModal.id, rating, ratingComment);
            setRatingModal(null);
            setRating(5);
            setRatingComment('');
            loadQueries();
        } catch (e) {
            console.error('Failed to rate query:', e);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchSearch = !search || 
            q.subject?.toLowerCase().includes(search.toLowerCase()) ||
            q.provider_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || q.status === filterStatus;
        const matchProvider = !filterProvider || q.provider === filterProvider;
        return matchSearch && matchStatus && matchProvider;
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
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <MessageSquare className="w-8 h-8" />
                        My Queries
                    </h1>
                    <p className="text-secondary text-sm mt-1">
                        Track and manage your inquiries to service providers
                    </p>
                </div>
                <Link to="/payments/queries/submit">
                    <Button variant="primary" className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        New Query
                    </Button>
                </Link>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    const Icon = config.icon;
                    return (
                        <div 
                            key={status}
                            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                filterStatus === status 
                                    ? 'border-primary bg-primary-5' 
                                    : 'border-theme bg-elevated hover:bg-secondary/5'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${config.color.replace('bg-', 'text-').split(' ')[1]}`} />
                                <span className="text-xs text-secondary">{config.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by subject or provider..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-theme bg-elevated text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={filterProvider}
                    onChange={e => setFilterProvider(e.target.value)}
                    className="rounded-xl border border-theme bg-elevated px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Providers</option>
                    {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.business_name}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-theme bg-elevated px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                        <option key={val} value={val}>{cfg.label}</option>
                    ))}
                </select>
                <button 
                    onClick={() => loadQueries(true)}
                    disabled={refreshing}
                    className="p-3 rounded-xl border border-theme bg-elevated hover:bg-secondary/10 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 text-secondary ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Queries List */}
            {filteredQueries.length === 0 ? (
                <div className="text-center py-16 bg-elevated rounded-2xl border border-theme">
                    <MessageSquare className="w-12 h-12 text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">No Queries Found</h3>
                    <p className="text-secondary mb-6">
                        {search || filterStatus || filterProvider 
                            ? 'Try adjusting your filters' 
                            : 'Submit your first query to a service provider'}
                    </p>
                    <Link to="/payments/queries/submit">
                        <Button variant="primary">Submit Query</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredQueries.map(query => {
                            const StatusConfig = STATUS_CONFIG[query.status] || STATUS_CONFIG.open;
                            const PriorityConfig = PRIORITY_CONFIG[query.priority] || PRIORITY_CONFIG.medium;
                            const StatusIcon = StatusConfig.icon;
                            
                            return (
                                <motion.div
                                    key={query.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-elevated border border-theme rounded-2xl p-6 hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${StatusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                                    {StatusConfig.label}
                                                </span>
                                                <span className={`text-xs font-medium ${PriorityConfig.color}`}>
                                                    {PriorityConfig.label} Priority
                                                </span>
                                                {query.satisfaction_rating && (
                                                    <span className="text-xs text-amber-500 flex items-center">
                                                        <Star className="w-3 h-3 fill-current mr-1" />
                                                        {query.satisfaction_rating}/5
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-primary mb-1">{query.subject}</h3>
                                            <p className="text-sm text-secondary mb-2 line-clamp-2">{query.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-tertiary">
                                                <span>{query.provider_name}</span>
                                                <span>•</span>
                                                <span>{new Date(query.created_at).toLocaleDateString()}</span>
                                                {query.reference_id && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Ref: {query.reference_id}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link to={`/payments/queries/${query.id}`}>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    View Details
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                            {query.status === 'resolved' && !query.satisfaction_rating && (
                                                <Button 
                                                    variant="primary" 
                                                    size="sm"
                                                    onClick={() => setRatingModal(query)}
                                                >
                                                    <Star className="w-4 h-4 mr-1" />
                                                    Rate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Rating Modal */}
            <AnimatePresence>
                {ratingModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setRatingModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9 }} 
                            animate={{ scale: 1 }} 
                            exit={{ scale: 0.9 }}
                            className="bg-elevated border border-theme rounded-2xl p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-primary mb-4">Rate Your Experience</h3>
                            <p className="text-secondary text-sm mb-6">
                                How satisfied were you with the resolution of "{ratingModal.subject}"?
                            </p>
                            
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="p-2 transition-transform hover:scale-110"
                                    >
                                        <Star 
                                            className={`w-10 h-10 transition-colors ${
                                                star <= rating 
                                                    ? 'text-amber-400 fill-amber-400' 
                                                    : 'text-gray-300'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Additional comments (optional)
                                </label>
                                <textarea
                                    value={ratingComment}
                                    onChange={e => setRatingComment(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us more about your experience..."
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setRatingModal(null)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    className="flex-1"
                                    onClick={handleRateQuery}
                                    disabled={submittingRating}
                                >
                                    {submittingRating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Rating'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyQueries;