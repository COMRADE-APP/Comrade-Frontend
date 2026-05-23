import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Search, CheckCircle, XCircle, Clock,
    FileText, User, Mail, Loader2, RefreshCw
} from 'lucide-react';
import providerService from '../../services/provider.service';

const STATUS_CONFIG = {
    draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
    under_review: { color: 'bg-amber-100 text-amber-700', label: 'Under Review' },
    pending_documents: { color: 'bg-purple-100 text-purple-700', label: 'Pending Documents' },
    pending_payment: { color: 'bg-orange-100 text-orange-700', label: 'Pending Payment' },
    approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
    cancelled: { color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
};

const APPLICATION_TYPE_LABELS = {
    service_enrollment: 'Service Enrollment',
    insurance_policy: 'Insurance Policy',
    loan_application: 'Loan Application',
    account_setup: 'Account Setup',
};

const ProviderOrders = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await providerService.getProviderApplications();
            setApplications(res.results || res || []);
        } catch (e) {
            console.error('Failed to load applications:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleReview = async (action) => {
        if (!selectedApp) return;
        setSubmitting(true);
        try {
            await providerService.reviewApplication(selectedApp.id, {
                status: action,
                review_notes: reviewNotes,
            });
            setSelectedApp(null);
            setReviewNotes('');
            loadApplications();
        } catch (e) {
            console.error('Failed to review application:', e);
            alert('Failed to update application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchSearch = !search ||
            app.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            app.service_product_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || app.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    const pendingCount = applications.filter(a => ['submitted', 'under_review', 'pending_documents', 'pending_payment'].includes(a.status)).length;

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
                        <ClipboardList className="w-6 h-6" />
                        Applications & Orders
                    </h1>
                    <p className="text-secondary text-sm mt-1">Manage incoming service applications from users.</p>
                </div>
                <button
                    onClick={() => loadApplications(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-elevated border rounded-xl text-secondary hover:bg-secondary/10 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-primary-50/30 border border-primary-200 rounded-xl">
                <div className="p-2 bg-primary-100 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm text-secondary">Pending Review</p>
                    <p className="text-xl font-bold text-primary">{pendingCount} applications</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusCounts[status] || 0;
                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                                filterStatus === status
                                    ? 'border-primary bg-primary-50/30'
                                    : 'bg-elevated hover:bg-secondary/5'
                            }`}
                        >
                            <p className={`text-lg font-bold ${config.color.split(' ')[1]}`}>{count}</p>
                            <p className="text-xs text-secondary">{config.label}</p>
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
                        placeholder="Search applications..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border bg-elevated text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
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

            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-400px)] min-h-[400px]">
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 overflow-hidden border-r pr-4">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredApps.length === 0 ? (
                            <div className="text-center p-8 text-secondary">
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No applications found</p>
                            </div>
                        ) : (
                            filteredApps.map(app => {
                                const StatusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                                return (
                                    <button
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            selectedApp?.id === app.id
                                                ? 'bg-primary-50 border-primary-300'
                                                : 'bg-elevated hover:bg-secondary/5'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-semibold text-primary text-sm truncate pr-2">
                                                {APPLICATION_TYPE_LABELS[app.application_type] || app.application_type}
                                            </h5>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-secondary mb-2">
                                            <User className="w-3 h-3" />
                                            {app.user_name}
                                        </div>
                                        {app.service_product_name && (
                                            <p className="text-xs text-tertiary mb-2 truncate">
                                                Product: {app.service_product_name}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${StatusCfg.color}`}>
                                                {StatusCfg.label}
                                            </span>
                                            <span className="text-[10px] text-secondary">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full overflow-hidden">
                    {!selectedApp ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-secondary border rounded-2xl bg-secondary/5">
                            <FileText size={48} className="text-primary/20 mb-4" />
                            <p>Select an application to view details and take action</p>
                        </div>
                    ) : (
                        <div className="bg-elevated border rounded-2xl flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b bg-secondary/5">
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {(() => {
                                                const StatusCfg = STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.draft;
                                                return (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${StatusCfg.color}`}>
                                                        {StatusCfg.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <h3 className="text-xl font-bold text-primary mb-2">
                                            {APPLICATION_TYPE_LABELS[selectedApp.application_type] || selectedApp.application_type}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-secondary">
                                            <span className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {selectedApp.user_name}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {selectedApp.user_email}
                                            </span>
                                            <span>•</span>
                                            <span>Submitted {new Date(selectedApp.created_at).toLocaleString()}</span>
                                        </div>
                                        {selectedApp.service_product_name && (
                                            <p className="text-sm text-tertiary mt-2">
                                                Service Product: {selectedApp.service_product_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedApp.application_data && Object.keys(selectedApp.application_data).length > 0 && (
                                    <div className="bg-primary rounded-xl p-5 border shadow-sm mb-6">
                                        <h4 className="font-bold text-primary mb-4">Application Data</h4>
                                        <div className="space-y-2">
                                            {Object.entries(selectedApp.application_data).map(([key, value]) => (
                                                <div key={key} className="flex justify-between text-sm">
                                                    <span className="text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-primary font-medium">
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedApp.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
                                        <div className="flex items-center gap-2 mb-3 text-red-700 font-bold text-sm">
                                            <XCircle size={16} /> Rejection Reason
                                        </div>
                                        <p className="text-sm text-red-800">{selectedApp.rejection_reason}</p>
                                    </div>
                                )}

                                {selectedApp.review_notes && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6">
                                        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-sm">
                                            <FileText size={16} /> Review Notes
                                        </div>
                                        <p className="text-sm text-blue-800">{selectedApp.review_notes}</p>
                                    </div>
                                )}
                            </div>

                            {selectedApp.status === 'submitted' && (
                                <div className="p-6 border-t bg-primary">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            Review Notes (optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={reviewNotes}
                                            onChange={e => setReviewNotes(e.target.value)}
                                            placeholder="Add notes about your decision..."
                                            className="w-full rounded-xl border bg-primary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => handleReview('rejected')}
                                            disabled={submitting}
                                            className="flex items-center gap-2 px-5 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleReview('approved')}
                                            disabled={submitting}
                                            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Approve
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

export default ProviderOrders;
