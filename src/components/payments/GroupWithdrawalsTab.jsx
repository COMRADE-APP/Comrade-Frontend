import React, { useState, useEffect } from 'react';
import { Plus, Download, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Landmark } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupWithdrawalsTab = ({ groupId, isAdmin }) => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestData, setRequestData] = useState({
        amount: '',
        reason: '',
        type: 'excess_contribution'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadWithdrawals();
    }, [groupId]);

    const loadWithdrawals = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupWithdrawals(groupId);
            setWithdrawals(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await paymentsService.requestWithdrawal(groupId, requestData);
            setShowRequestModal(false);
            setRequestData({ amount: '', reason: '', type: 'excess_contribution' });
            loadWithdrawals();
        } catch (error) {
            console.error('Error requesting withdrawal:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                await paymentsService.approveWithdrawal(id);
            } else {
                await paymentsService.rejectWithdrawal(id);
            }
            loadWithdrawals();
        } catch (error) {
            console.error(`Error ${action}ing withdrawal:`, error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Withdrawals & Payouts</h3>
                    <p className="text-sm text-secondary">Request and track funds moving out of the group.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => setShowRequestModal(true)}>
                    <Download className="w-4 h-4" /> Request Withdrawal
                </Button>
            </div>

            {withdrawals.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                        <Landmark className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Withdrawal History</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Once you or other members request funds from the group pool, they will appear here for review and tracking.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {withdrawals.map((req) => (
                        <Card key={req.id} className="border-theme overflow-hidden">
                            <CardBody className="p-0">
                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            req.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                            req.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                            'bg-secondary/10 text-secondary'
                                        }`}>
                                            {req.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                             req.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                             <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-primary">{formatMoneySimple(req.amount)}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-secondary line-clamp-1">{req.reason}</p>
                                            <p className="text-xs text-tertiary mt-1">Requested by {req.requester_name} • {formatDate(req.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && req.status === 'pending' && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => handleAction(req.id, 'reject')} className="text-rose-600 border-rose-200">Reject</Button>
                                                <Button variant="primary" size="sm" onClick={() => handleAction(req.id, 'approve')} className="!bg-emerald-600">Approve</Button>
                                            </>
                                        )}
                                        <Button variant="outline" size="sm" className="p-2"><FileText className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                {req.immature_exit_deduction > 0 && (
                                    <div className="px-4 py-2 bg-rose-500/5 border-t border-rose-500/10 flex items-center gap-2 text-[10px] text-rose-700">
                                        <AlertTriangle className="w-3 h-3" />
                                        Note: This withdrawal includes a 2% immature exit penalty of {formatMoneySimple(req.immature_exit_deduction)}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Request Modal Placeholder */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-theme shadow-2xl">
                        <CardBody className="p-6">
                            <h3 className="text-xl font-bold text-primary mb-4">Request Withdrawal</h3>
                            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Amount (USD)</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={requestData.amount}
                                        onChange={(e) => setRequestData({...requestData, amount: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Withdrawal Type</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={requestData.type}
                                        onChange={(e) => setRequestData({...requestData, type: e.target.value})}
                                    >
                                        <option value="excess_contribution">Excess Contribution</option>
                                        <option value="exit">Full Exit (Withdraw all my funds)</option>
                                    </select>
                                    {requestData.type === 'exit' && (
                                        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Note: Exit withdrawals may attract a penalty if the group hasn't reached maturity.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Reason</label>
                                    <textarea 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary h-24"
                                        value={requestData.reason}
                                        onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1" type="submit" disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupWithdrawalsTab;
