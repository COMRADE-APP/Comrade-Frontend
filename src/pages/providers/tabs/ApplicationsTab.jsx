import React, { useState, useEffect } from 'react';
import { FileText, Search, MoreVertical, CheckCircle, XCircle, Clock, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../services/api';

const STATUS_CONFIG = {
    draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock, label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock, label: 'Submitted' },
    under_review: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: 'Under Review' },
    approved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' },
    requires_changes: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle, label: 'Requires Changes' },
};

const ApplicationsTab = ({ provider, onRefresh }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [reviewForm, setReviewForm] = useState({ status: 'approved', review_notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadApplications();
    }, [provider.id]);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/v1/payments/provider-applications/', { params: { provider_id: provider.id } });
            setApplications(res.data.results || res.data || []);
        } catch (e) {
            console.error('Failed to load applications:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/api/v1/payments/provider-applications/${selectedApp.id}/review/`, reviewForm);
            setShowReviewModal(false);
            loadApplications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredApps = applications.filter(a => {
        const matchSearch = !search || (a.user_name || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || a.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center flex-1 min-w-0">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search applicants..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                            <option key={val} value={val}>{cfg.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-theme">
                            <CardBody className="p-4 flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 skeleton-shimmer" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-1/3 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-1/4 h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : filteredApps.length === 0 ? (
                <Card className="border-theme">
                    <CardBody className="p-12 text-center">
                        <FileText size={48} className="text-primary/15 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">No Applications Found</h3>
                        <p className="text-secondary text-sm">There are no customer applications matching your filters.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredApps.map(app => {
                        const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                        const StatusIcon = statusCfg.icon;
                        return (
                            <Card key={app.id} className="border-theme hover:shadow-md transition-shadow duration-200">
                                <CardBody className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-theme">
                                            <FileText size={20} className="text-primary/40" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-primary text-sm truncate">{app.user_name || 'Customer'}</h4>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                                    <StatusIcon size={10} /> {statusCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary mt-1">
                                                Applied for <span className="font-semibold text-primary">{app.service_product_name || 'Service'}</span>
                                            </p>
                                            <p className="text-[10px] text-secondary mt-0.5">
                                                Submitted: {new Date(app.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 md:self-center shrink-0 mt-3 md:mt-0">
                                        {app.status === 'submitted' || app.status === 'under_review' ? (
                                            <Button variant="primary" size="sm" onClick={() => {
                                                setSelectedApp(app);
                                                setReviewForm({ status: 'approved', review_notes: '' });
                                                setShowReviewModal(true);
                                            }}>
                                                Review Application
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSelectedApp(app);
                                                setShowReviewModal(true);
                                            }}>
                                                <Eye size={14} className="mr-1.5" /> View Details
                                            </Button>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Review/View Modal */}
            {showReviewModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-elevated border-b border-theme p-5 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Application Details</h3>
                                <p className="text-sm text-secondary">{selectedApp.user_name} - {selectedApp.service_product_name}</p>
                            </div>
                            <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><XCircle size={18} /></button>
                        </div>
                        
                        <div className="p-5 space-y-6">
                            {/* Application Data */}
                            <div>
                                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Application Data</h4>
                                <div className="bg-secondary/5 rounded-xl border border-theme p-4 space-y-3">
                                    {selectedApp.application_data && Object.keys(selectedApp.application_data).length > 0 ? (
                                        Object.entries(selectedApp.application_data).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-xs text-secondary font-medium uppercase">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-sm text-primary font-medium mt-0.5">{value?.toString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-secondary">No additional data provided.</p>
                                    )}
                                </div>
                            </div>

                            {/* Documents */}
                            {selectedApp.documents && selectedApp.documents.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Uploaded Documents</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedApp.documents.map((doc, idx) => (
                                            <a key={idx} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-theme hover:bg-primary/5 transition-colors">
                                                <div className="p-2 bg-primary/10 rounded-lg"><FileText size={16} className="text-primary" /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-primary truncate">{doc.document_type || `Document ${idx+1}`}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Form */}
                            {(selectedApp.status === 'submitted' || selectedApp.status === 'under_review') ? (
                                <form onSubmit={handleReview} className="border-t border-theme pt-6 space-y-4">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Your Review</h4>
                                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Decision</label>
                                        <div className="flex flex-wrap gap-3">
                                            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${reviewForm.status === 'approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-theme hover:bg-secondary/5'}`}>
                                                <input type="radio" name="status" value="approved" checked={reviewForm.status === 'approved'} onChange={e => setReviewForm({...reviewForm, status: e.target.value})} className="hidden" />
                                                <CheckCircle size={16} /> Approve
                                            </label>
                                            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${reviewForm.status === 'rejected' ? 'bg-red-50 border-red-500 text-red-700' : 'border-theme hover:bg-secondary/5'}`}>
                                                <input type="radio" name="status" value="rejected" checked={reviewForm.status === 'rejected'} onChange={e => setReviewForm({...reviewForm, status: e.target.value})} className="hidden" />
                                                <XCircle size={16} /> Reject
                                            </label>
                                            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${reviewForm.status === 'requires_changes' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-theme hover:bg-secondary/5'}`}>
                                                <input type="radio" name="status" value="requires_changes" checked={reviewForm.status === 'requires_changes'} onChange={e => setReviewForm({...reviewForm, status: e.target.value})} className="hidden" />
                                                <AlertCircle size={16} /> Request Changes
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Review Notes (visible to customer)</label>
                                        <textarea
                                            required={reviewForm.status !== 'approved'}
                                            rows={3}
                                            value={reviewForm.review_notes}
                                            onChange={e => setReviewForm({...reviewForm, review_notes: e.target.value})}
                                            placeholder={reviewForm.status === 'approved' ? "Optional notes..." : "Please explain why..."}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" type="button" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                                        <Button variant="primary" type="submit" disabled={submitting}>
                                            {submitting ? 'Submitting...' : 'Submit Decision'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="border-t border-theme pt-6">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Review History</h4>
                                    <div className={`p-4 rounded-xl border ${STATUS_CONFIG[selectedApp.status]?.color?.replace('bg-', 'bg-opacity-10 bg-')}`}>
                                        <p className="font-semibold">{STATUS_CONFIG[selectedApp.status]?.label}</p>
                                        {selectedApp.review_notes && <p className="text-sm mt-2">{selectedApp.review_notes}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationsTab;
