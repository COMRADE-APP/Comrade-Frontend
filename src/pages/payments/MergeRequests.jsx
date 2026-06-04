import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    GitMerge, ArrowLeft, Clock, CheckCircle2, XCircle, Users, DollarSign, ChevronDown, ChevronRight, User, AlertCircle
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { renderContentWithEmojis } from '../../utils/emoji';

const MergeRequests = () => {
    const navigate = useNavigate();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAllMergeRequests();
    }, []);

    const loadAllMergeRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const pbs = await paymentsService.getPiggyBanks();
            const allPbs = Array.isArray(pbs) ? pbs : (pbs?.results || []);
            setPiggyBanks(allPbs);

            const reqMap = new Map();
            for (const pb of allPbs) {
                try {
                    const reqs = await paymentsService.getMyMergeRequests(pb.id);
                    if (reqs && reqs.length > 0) {
                        for (const r of reqs) {
                            if (!reqMap.has(r.id)) {
                                reqMap.set(r.id, { ...r, piggy_bank_name: pb.name, piggy_bank_id: pb.id });
                            }
                        }
                    }
                } catch (e) {
                    // skip individual failures
                }
            }
            const allReqs = Array.from(reqMap.values());
            allReqs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            setAllRequests(allReqs);
        } catch (err) {
            console.error('Error loading merge requests:', err);
            setError('Failed to load merge requests');
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            approved: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
            executed: 'bg-blue-100 text-blue-700 border-blue-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-secondary/10 text-secondary border-theme'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(ROUTES.PIGGY_BANKS)} className="p-2 hover:bg-secondary/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
                            <GitMerge className="w-7 h-7 text-blue-500" /> Merge Requests
                        </h1>
                        <p className="text-secondary mt-0.5 text-sm">Track merge requests across all your piggy banks</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => navigate('/payments/piggy-banks/merge')} className="text-sm">
                    <GitMerge className="w-4 h-4 mr-1.5" /> New Merge
                </Button>
            </div>

            {error && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardBody className="p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </CardBody>
                </Card>
            )}

            <Card>
                <CardBody className="p-6">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/5 rounded-xl animate-pulse" />)}
                        </div>
                    ) : allRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <GitMerge className="w-10 h-10 text-tertiary mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-primary mb-1">No merge requests</h3>
                            <p className="text-sm text-secondary max-w-xs mx-auto">
                                Merge requests will appear here when you or group members initiate a merge.
                            </p>
                            <Button variant="primary" className="mt-4 text-sm" onClick={() => navigate('/payments/piggy-banks/merge')}>
                                <GitMerge className="w-4 h-4 mr-1.5" /> Create Merge Request
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allRequests.map(req => (
                                <div key={req.id} className="border border-theme rounded-xl bg-elevated overflow-hidden">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-semibold text-primary truncate">
                                                        Merge into {renderContentWithEmojis(req.piggy_bank_name)}
                                                    </h3>
                                                    {statusBadge(req.status)}
                                                </div>
                                                <p className="text-xs text-secondary">
                                                    {req.requested_by_name || 'Unknown'} · {req.target_piggy_banks?.length || 0} source(s) · ${parseFloat(req.amount || 0).toFixed(2)}
                                                </p>
                                                {req.reason && (
                                                    <p className="text-xs text-tertiary mt-1 italic">"{req.reason}"</p>
                                                )}
                                                {req.current_user_vote && (
                                                    <p className="text-xs mt-1">
                                                        <span className="font-medium text-secondary">Your vote: </span>
                                                        <span className={req.current_user_vote === 'approve' ? 'text-green-600' : 'text-red-500'}>
                                                            {req.current_user_vote}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                            <button onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                                                className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary transition-colors shrink-0">
                                                {expandedId === req.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {expandedId === req.id && (
                                            <div className="mt-3 pt-3 border-t border-theme space-y-3">
                                                {req.voter_details && req.voter_details.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Voters</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {req.voter_details.map(voter => (
                                                                <div key={voter.member_id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border border-theme bg-secondary/5">
                                                                    {voter.profile_picture ? (
                                                                        <img src={voter.profile_picture} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                                    ) : (
                                                                        <User className="w-4 h-4 text-secondary" />
                                                                    )}
                                                                    <span className="font-medium text-primary">{voter.member_name}</span>
                                                                    <span className={voter.vote === 'approve' ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{voter.vote}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {req.pending_voter_details && req.pending_voter_details.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                                                            Awaiting vote ({req.pending_voter_details.length})
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {req.pending_voter_details.map(voter => (
                                                                <div key={voter.member_id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border border-dashed border-theme bg-secondary/5">
                                                                    {voter.profile_picture ? (
                                                                        <img src={voter.profile_picture} alt="" className="w-4 h-4 rounded-full object-cover opacity-60" />
                                                                    ) : (
                                                                        <User className="w-4 h-4 text-secondary opacity-60" />
                                                                    )}
                                                                    <span className="font-medium text-secondary">{voter.member_name}</span>
                                                                    <span className="text-amber-500 text-[10px]">pending</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {req.created_at && (
                                                    <p className="text-[10px] text-tertiary">Created {formatDate(req.created_at)}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default MergeRequests;
