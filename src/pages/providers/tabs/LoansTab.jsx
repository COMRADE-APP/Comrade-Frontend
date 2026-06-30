import React, { useState, useEffect } from 'react';
import { DollarSign, Search, CheckCircle, XCircle, Clock, RefreshCw, FileText, User, AlertCircle, ChevronRight } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';
import { loansService } from '../../../services/finservices.service';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const STATUS_CONFIG = {
    pending: { color: 'bg-amber-50 text-amber-700', bg: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Pending' },
    approved: { color: 'bg-emerald-50 text-emerald-700', bg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-50 text-red-700', bg: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
    disbursed: { color: 'bg-blue-50 text-blue-700', bg: 'bg-blue-100 text-blue-600', icon: DollarSign, label: 'Disbursed' },
    repaying: { color: 'bg-primary-50 text-primary-700', bg: 'bg-primary-100 text-primary-600', icon: Clock, label: 'Repaying' },
    completed: { color: 'bg-emerald-50 text-emerald-700', bg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle, label: 'Completed' },
    defaulted: { color: 'bg-red-50 text-red-700', bg: 'bg-red-100 text-red-600', icon: AlertCircle, label: 'Defaulted' },
    cancelled: { color: 'bg-gray-50 text-gray-700', bg: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Cancelled' },
};

const LoansTab = ({ provider, onRefresh }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => { loadApplications(); }, [provider?.id]);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await providerService.getProviderLoanApplications(provider.id);
            setApplications(Array.isArray(data) ? data : (data?.results || []));
        } catch (err) { console.error('Failed to load loan applications:', err); }
        finally { setLoading(false); }
    };

    const handleApprove = async (app) => {
        setActionLoading(app.id);
        try { await loansService.approveLoan(app.id); await loadApplications(); }
        catch (err) { console.error('Approve failed:', err); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        try { await loansService.rejectLoan(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); await loadApplications(); }
        catch (err) { console.error('Reject failed:', err); }
        finally { setActionLoading(null); }
    };

    const handleDisburse = async (app) => {
        setActionLoading(app.id);
        try { await loansService.disburseLoan(app.id); await loadApplications(); }
        catch (err) { console.error('Disburse failed:', err); }
        finally { setActionLoading(null); }
    };

    const getStatusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const totalApps = applications.length;
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const disbursedCount = applications.filter(a => a.status === 'disbursed' || a.status === 'repaying').length;

    const filtered = applications.filter(app => {
        const ms = !search || app.user_name?.toLowerCase().includes(search.toLowerCase()) || app.user_email?.toLowerCase().includes(search.toLowerCase()) || app.loan_product_name?.toLowerCase().includes(search.toLowerCase());
        const mst = !filterStatus || app.status === filterStatus;
        return ms && mst;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <DollarSign size={20} className="text-amber-500" /> Loan Applications
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">Review, approve, and disburse loan applications</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadApplications}>
                    <RefreshCcw size={14} className="mr-1.5" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Applications</p>
                    <p className="text-xl font-bold text-primary">{totalApps}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Pending</p>
                    <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Approved</p>
                    <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Disbursed</p>
                    <p className="text-xl font-bold text-blue-600">{disbursedCount}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                    <option value="repaying">Repaying</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="defaulted">Defaulted</option>
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <FileText size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Loan Applications</h4>
                    <p className="text-sm text-secondary">No loan applications have been submitted yet.</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map(app => {
                        const sc = getStatusCfg(app.status);
                        const StatusIcon = sc.icon;
                        const isExpanded = expandedId === app.id;
                        return (
                            <Card key={app.id} className="border-theme">
                                <CardBody className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sc.bg}`}>
                                                <StatusIcon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-0.5">
                                                    <p className="font-bold text-primary text-sm">{app.user_name || 'Applicant'}</p>
                                                    <span className="text-xs text-secondary">{app.user_email}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-primary">{formatMoneySimple(app.amount)}</span>
                                                    <span className="text-xs text-secondary">• {app.tenure_months} months</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                                                </div>
                                                {app.purpose && <p className="text-xs text-secondary line-clamp-1 mb-1">{app.purpose}</p>}
                                                <button onClick={() => setExpandedId(isExpanded ? null : app.id)}
                                                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-0.5">
                                                    <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    Details
                                                </button>
                                                {isExpanded && (
                                                    <div className="mt-3 p-3 bg-secondary/5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                        <div><p className="text-secondary">Monthly Payment</p><p className="font-bold text-primary">{formatMoneySimple(app.monthly_payment)}</p></div>
                                                        <div><p className="text-secondary">Total Repayment</p><p className="font-bold text-primary">{formatMoneySimple(app.total_repayment)}</p></div>
                                                        <div><p className="text-secondary">Processing Fee</p><p className="font-bold text-primary">{formatMoneySimple(app.processing_fee_amount)}</p></div>
                                                        <div><p className="text-secondary">Credit Score</p><p className="font-bold text-primary">{app.credit_score_at_application || 'N/A'}</p></div>
                                                        {app.rejection_reason && <div className="col-span-full"><p className="text-secondary">Rejection Reason</p><p className="text-red-600">{app.rejection_reason}</p></div>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {app.status === 'pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                        onClick={() => handleApprove(app)} isLoading={actionLoading === app.id}>
                                                        <CheckCircle size={14} className="mr-1" /> Approve
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => setRejectModal(app)}>
                                                        <XCircle size={14} className="mr-1" /> Reject
                                                    </Button>
                                                </>
                                            )}
                                            {app.status === 'approved' && (
                                                <Button variant="primary" size="sm" onClick={() => handleDisburse(app)} isLoading={actionLoading === app.id}>
                                                    <DollarSign size={14} className="mr-1" /> Disburse
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-theme">
                            <h3 className="font-bold text-primary">Reject Loan Application</h3>
                            <p className="text-sm text-secondary mt-1">{rejectModal.user_name} • {formatMoneySimple(rejectModal.amount)}</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Reason for rejection</label>
                                <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                    className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red/30"
                                    placeholder="Explain why this application is being rejected..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
                                <Button variant="primary" className="bg-red-600 hover:bg-red-700"
                                    onClick={handleReject} isLoading={actionLoading === rejectModal.id}>Confirm Rejection</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoansTab;
