import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle, Building2, 
    Star, Send, Loader2, MessageSquare 
} from 'lucide-react';
import providerService from '../../services/provider.service';
import Button from '../../components/common/Button';

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

const QueryDetail = () => {
    const { queryId } = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        loadQuery();
    }, [queryId]);

    const loadQuery = async () => {
        setLoading(true);
        try {
            const res = await providerService.getQueryDetail(queryId);
            setQuery(res);
        } catch (e) {
            console.error('Failed to load query:', e);
            navigate('/payments/queries');
        } finally {
            setLoading(false);
        }
    };

    const handleRateQuery = async () => {
        setSubmittingRating(true);
        try {
            await providerService.rateQuery(query.id, rating, ratingComment);
            loadQuery();
            setRatingModal(false);
            setRating(5);
            setRatingComment('');
        } catch (e) {
            console.error('Failed to rate query:', e);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!query) return null;

    const StatusConfig = STATUS_CONFIG[query.status] || STATUS_CONFIG.open;
    const PriorityConfig = PRIORITY_CONFIG[query.priority] || PRIORITY_CONFIG.medium;
    const StatusIcon = StatusConfig.icon;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <button 
                onClick={() => navigate('/payments/queries')}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to My Queries
            </button>

            {/* Header */}
            <div className="bg-elevated border border-theme rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${StatusConfig.color}`}>
                                <StatusIcon className="w-4 h-4 inline mr-1" />
                                {StatusConfig.label}
                            </span>
                            <span className={`text-sm font-medium ${PriorityConfig.color}`}>
                                {PriorityConfig.label} Priority
                            </span>
                            {query.satisfaction_rating && (
                                <span className="text-sm text-amber-500 flex items-center bg-amber-50 px-2 py-1 rounded">
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    {query.satisfaction_rating}/5
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-primary mb-2">{query.subject}</h1>
                        <div className="flex items-center gap-4 text-sm text-secondary">
                            <span className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {query.provider_name}
                            </span>
                            <span>•</span>
                            <span>Submitted {new Date(query.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    {query.status === 'resolved' && !query.satisfaction_rating && (
                        <Button 
                            variant="primary"
                            onClick={() => setRatingModal(true)}
                            className="flex items-center gap-2"
                        >
                            <Star className="w-5 h-5" />
                            Rate Experience
                        </Button>
                    )}
                </div>
            </div>

            {/* Query Details */}
            <div className="bg-elevated border border-theme rounded-2xl p-6">
                <h2 className="text-lg font-bold text-primary mb-4">Query Details</h2>
                
                <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/5 rounded-xl">
                            <p className="text-xs text-secondary mb-1">Query Type</p>
                            <p className="font-medium text-primary">{query.query_type_display}</p>
                        </div>
                        <div className="p-4 bg-secondary/5 rounded-xl">
                            <p className="text-xs text-secondary mb-1">Priority</p>
                            <p className="font-medium text-primary">{PriorityConfig.label}</p>
                        </div>
                    </div>

                    {query.reference_id && (
                        <div className="p-4 bg-secondary/5 rounded-xl">
                            <p className="text-xs text-secondary mb-1">Reference ID</p>
                            <p className="font-medium text-primary">{query.reference_id}</p>
                        </div>
                    )}

                    <div className="p-4 bg-secondary/5 rounded-xl">
                        <p className="text-xs text-secondary mb-2">Description</p>
                        <p className="text-primary whitespace-pre-wrap">{query.description}</p>
                    </div>
                </div>
            </div>

            {/* Resolution */}
            {query.resolution_notes && (
                <div className="bg-elevated border border-emerald-200 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Resolution
                    </h2>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-primary whitespace-pre-wrap">{query.resolution_notes}</p>
                        {query.resolved_by_name && (
                            <p className="text-sm text-emerald-600 mt-3">
                                Resolved by {query.resolved_by_name} on {new Date(query.resolved_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Rating */}
            {query.satisfaction_rating && (
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-primary mb-4">Your Feedback</h2>
                    <div className="flex items-center gap-4 p-4 bg-secondary/5 rounded-xl">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star}
                                    className={`w-6 h-6 ${
                                        star <= query.satisfaction_rating 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'
                                    }`} 
                                />
                            ))}
                        </div>
                        <span className="text-primary font-medium">{query.satisfaction_rating}/5</span>
                    </div>
                    {query.satisfaction_comment && (
                        <p className="mt-4 text-secondary italic">"{query.satisfaction_comment}"</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                <Link to="/payments/queries/submit" className="flex-1">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Submit New Query
                    </Button>
                </Link>
            </div>

            {/* Rating Modal */}
            {ratingModal && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setRatingModal(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9 }} 
                        animate={{ scale: 1 }}
                        className="bg-elevated border border-theme rounded-2xl p-6 w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-primary mb-4">Rate Your Experience</h3>
                        <p className="text-secondary text-sm mb-6">
                            How satisfied were you with the resolution?
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
                                className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setRatingModal(false)}
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
        </div>
    );
};

export default QueryDetail;