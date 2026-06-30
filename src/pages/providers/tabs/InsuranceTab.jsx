import React, { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, XCircle, Clock, RefreshCcw, FileText, DollarSign, AlertCircle, ChevronRight } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const CLAIM_STATUS = {
    submitted: { color: 'bg-blue-50 text-blue-700', bg: 'bg-blue-100 text-blue-600', icon: FileText, label: 'Submitted' },
    under_review: { color: 'bg-amber-50 text-amber-700', bg: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Under Review' },
    approved: { color: 'bg-emerald-50 text-emerald-700', bg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle, label: 'Approved' },
    paid: { color: 'bg-emerald-50 text-emerald-700', bg: 'bg-emerald-100 text-emerald-600', icon: DollarSign, label: 'Paid' },
    rejected: { color: 'bg-red-50 text-red-700', bg: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
    withdrawn: { color: 'bg-gray-50 text-gray-700', bg: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Withdrawn' },
};

const InsuranceTab = ({ provider, onRefresh }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => { loadClaims(); }, [provider?.id]);

    const loadClaims = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/v1/payments/insurance-claims-review/');
            setClaims(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) {
            console.error('Failed to load claims:', err);
        } finally { setLoading(false); }
    };

    const handleReview = async (claim, action, amountApproved = null) => {
        setActionLoading(claim.id);
        try {
            const payload = { action };
            if (action === 'approve' && amountApproved) payload.amount_approved = parseFloat(amountApproved);
            if (rejectNotes && action === 'reject') payload.notes = rejectNotes;
            await api.post(`/api/v1/payments/insurance-claims-review/${claim.id}/review_claim/`, payload);
            setRejectModal(null); setRejectNotes('');
            await loadClaims();
        } catch (err) { console.error('Review failed:', err); }
        finally { setActionLoading(null); }
    };

    const handlePayout = async (claim) => {
        setActionLoading(claim.id);
        try { await api.post(`/api/v1/payments/insurance-claims-review/${claim.id}/payout_claim/`); await loadClaims(); }
        catch (err) { console.error('Payout failed:', err); }
        finally { setActionLoading(null); }
    };

    const handleEscalate = async (claim, reason) => {
        setActionLoading(claim.id);
        try { await api.post(`/api/v1/payments/insurance-claims-review/${claim.id}/escalate/`, { reason }); await loadClaims(); }
        catch (err) { console.error('Escalate failed:', err); }
        finally { setActionLoading(null); }
    };

    const getStatusCfg = (status) => CLAIM_STATUS[status] || CLAIM_STATUS.submitted;
    const totalClaims = claims.length;
    const submittedCount = claims.filter(c => c.status === 'submitted').length;
    const approvedCount = claims.filter(c => c.status === 'approved').length;
    const paidCount = claims.filter(c => c.status === 'paid').length;

    const filtered = claims.filter(c => {
        const ms = !search || c.policy_number?.toLowerCase().includes(search.toLowerCase()) || c.claimant_name?.toLowerCase().includes(search.toLowerCase()) || c.reason?.toLowerCase().includes(search.toLowerCase());
        const mst = !filterStatus || c.status === filterStatus;
        return ms && mst;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Shield size={20} className="text-teal-500" /> Insurance Claims
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">Review, approve, and process insurance claims</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadClaims}>
                    <RefreshCcw size={14} className="mr-1.5" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Claims</p>
                    <p className="text-xl font-bold text-primary">{totalClaims}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Submitted</p>
                    <p className="text-xl font-bold text-blue-600">{submittedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Approved</p>
                    <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Paid</p>
                    <p className="text-xl font-bold text-amber-600">{paidCount}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input type="text" placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">All Statuses</option>
                    {Object.entries(CLAIM_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <Shield size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Insurance Claims</h4>
                    <p className="text-sm text-secondary">No claims have been submitted against your insurance products.</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map(claim => {
                        const sc = getStatusCfg(claim.status);
                        const StatusIcon = sc.icon;
                        const isExpanded = expandedId === claim.id;
                        return (
                            <Card key={claim.id} className="border-theme">
                                <CardBody className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sc.bg}`}>
                                                <StatusIcon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-primary text-sm truncate">
                                                        {claim.policy_number || `Claim #${claim.id?.substring(0, 8)}`}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                                                        {sc.label}
                                                    </span>
                                                </div>
                                                {claim.claimant_name && <p className="text-xs text-secondary mb-0.5">Claimant: {claim.claimant_name}</p>}
                                                <p className="text-xs text-secondary line-clamp-1 mb-1">{claim.reason}</p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-primary font-semibold">{formatMoneySimple(claim.amount_claimed)} claimed</span>
                                                    {claim.amount_approved > 0 && <span className="text-emerald-600 font-semibold">{formatMoneySimple(claim.amount_approved)} approved</span>}
                                                </div>
                                                <button onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                                                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-1.5">
                                                    <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    Details
                                                </button>
                                                {isExpanded && (
                                                    <div className="mt-3 p-3 bg-secondary/5 rounded-xl space-y-1.5 text-xs">
                                                        {claim.policy_name && <p><span className="text-secondary">Policy:</span> <strong className="text-primary">{claim.policy_name}</strong></p>}
                                                        {claim.product_name && <p><span className="text-secondary">Product:</span> <strong className="text-primary">{claim.product_name}</strong></p>}
                                                        {claim.evidence && Array.isArray(claim.evidence) && claim.evidence.length > 0 && <p><span className="text-secondary">Evidence:</span> <span className="text-primary">{claim.evidence.length} files</span></p>}
                                                        {claim.reviewer_notes && <p><span className="text-secondary">Notes:</span> <span className="text-primary whitespace-pre-wrap">{claim.reviewer_notes}</span></p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {(claim.status === 'submitted' || claim.status === 'under_review') && (
                                                <>
                                                    <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                        onClick={() => handleReview(claim, 'approve', claim.amount_claimed)} isLoading={actionLoading === claim.id}>
                                                        <CheckCircle size={14} className="mr-1" /> Approve
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => { setRejectModal(claim); setRejectNotes(''); }}>
                                                        <XCircle size={14} className="mr-1" /> Reject
                                                    </Button>
                                                </>
                                            )}
                                            {claim.status === 'approved' && (
                                                <>
                                                    <Button variant="primary" size="sm" onClick={() => handlePayout(claim)} isLoading={actionLoading === claim.id}>
                                                        <DollarSign size={14} className="mr-1" /> Pay Claim
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                        onClick={() => handleEscalate(claim, 'Manual review requested')}>
                                                        <AlertCircle size={14} className="mr-1" /> Escalate
                                                    </Button>
                                                </>
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
                            <h3 className="font-bold text-primary">Reject Claim</h3>
                            <p className="text-sm text-secondary mt-1">{formatMoneySimple(rejectModal.amount_claimed)} claimed</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Notes</label>
                                <textarea rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                                    className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red/30"
                                    placeholder="Reason for rejection..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
                                <Button variant="primary" className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleReview(rejectModal, 'reject')} isLoading={actionLoading === rejectModal.id}>
                                    Confirm Rejection
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceTab;
