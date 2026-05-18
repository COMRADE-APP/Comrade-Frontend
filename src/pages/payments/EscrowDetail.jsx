import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { escrowService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { 
    Shield, ArrowLeft, AlertTriangle, CheckCircle, Clock, 
    Upload, MessageSquare, Package, Lock, RefreshCw, Flag 
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
    initiated: { color: 'bg-secondary/10 text-secondary', icon: Clock },
    funded: { color: 'bg-blue-500/15 text-blue-500', icon: Lock },
    in_progress: { color: 'bg-indigo-500/15 text-indigo-500', icon: RefreshCw },
    delivered: { color: 'bg-amber-500/15 text-amber-500', icon: Package },
    released: { color: 'bg-emerald-500/15 text-emerald-500', icon: CheckCircle },
    disputed: { color: 'bg-rose-500/15 text-rose-500', icon: AlertTriangle },
    refunded: { color: 'bg-primary-600/15 text-primary-600', icon: RefreshCw },
    cancelled: { color: 'bg-secondary/10 text-tertiary', icon: Clock },
};

const EscrowDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [escrow, setEscrow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [disputeReason, setDisputeReason] = useState('');
    const [evidenceText, setEvidenceText] = useState('');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadEscrow = async () => {
        try {
            const res = await escrowService.getEscrowDetail(id);
            setEscrow(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEscrow();
    }, [id]);

    const handleDispute = async () => {
        setSubmitting(true);
        try {
            await escrowService.disputeEscrow(id, disputeReason, []);
            setShowDisputeModal(false);
            loadEscrow();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (actionFn, ...args) => {
        setSubmitting(true);
        try {
            await actionFn(id, ...args);
            loadEscrow();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-secondary" /></div>;
    if (!escrow) return <div className="text-center p-12">Escrow not found</div>;

    const SC = STATUS_CONFIG[escrow.status] || STATUS_CONFIG.initiated;
    const StatusIcon = SC.icon;
    const dispute = escrow.disputes?.[0]; // Assuming latest dispute is relevant

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Escrows
            </button>

            <div className="bg-elevated border border-theme rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b border-theme flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${SC.color}`}>
                                <StatusIcon className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold text-primary">{escrow.title}</h1>
                        </div>
                        <p className="text-secondary">{escrow.type_display || escrow.escrow_type} • Created {new Date(escrow.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{formatMoneySimple(escrow.amount)}</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${SC.color}`}>
                            {escrow.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-primary mb-2">Transaction Details</h3>
                            <div className="space-y-3 bg-secondary/5 rounded-xl p-4">
                                <div className="flex justify-between"><span className="text-secondary text-sm">Buyer</span><span className="font-medium text-primary">{escrow.buyer_name}</span></div>
                                <div className="flex justify-between"><span className="text-secondary text-sm">Seller</span><span className="font-medium text-primary">{escrow.seller_name}</span></div>
                                <div className="flex justify-between"><span className="text-secondary text-sm">Escrow Fee</span><span className="font-medium text-primary">{formatMoneySimple(escrow.escrow_fee)}</span></div>
                                <div className="flex justify-between border-t border-theme pt-3"><span className="text-secondary text-sm">Total Funded</span><span className="font-bold text-blue-500">{formatMoneySimple(escrow.total_amount)}</span></div>
                            </div>
                        </div>

                        {escrow.description && (
                            <div>
                                <h3 className="font-semibold text-primary mb-2">Description</h3>
                                <p className="text-sm text-secondary bg-secondary/5 p-4 rounded-xl">{escrow.description}</p>
                            </div>
                        )}

                        {escrow.release_conditions && (
                            <div>
                                <h3 className="font-semibold text-primary mb-2">Release Conditions</h3>
                                <p className="text-sm text-secondary bg-secondary/5 p-4 rounded-xl">{escrow.release_conditions}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Milestones */}
                        {escrow.milestones?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-primary mb-2 flex items-center justify-between">
                                    Milestones
                                </h3>
                                <div className="space-y-2">
                                    {escrow.milestones.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-theme">
                                            <div className="flex items-center gap-3">
                                                {m.completed ? (
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-tertiary"></div>
                                                )}
                                                <div>
                                                    <p className={`font-medium ${m.completed ? 'text-secondary line-through' : 'text-primary'}`}>{m.name}</p>
                                                    <p className="text-xs text-tertiary">{formatMoneySimple(m.amount)}</p>
                                                </div>
                                            </div>
                                            {!m.completed && escrow.status === 'funded' && (
                                                <button 
                                                    onClick={() => escrowService.completeMilestone?.(id, i).then(loadEscrow)}
                                                    className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg font-medium transition-colors"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dispute Section */}
                        {escrow.status === 'disputed' && dispute && (
                            <div className="border border-rose-500/30 bg-rose-500/5 rounded-xl p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-rose-500">Active Dispute</h3>
                                        <p className="text-sm text-secondary mt-1">{dispute.reason}</p>
                                    </div>
                                </div>
                                
                                <div className="border-t border-rose-500/20 pt-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Evidence Timeline</h4>
                                    <div className="space-y-3">
                                        {dispute.evidence?.map((ev, idx) => (
                                            <div key={idx} className="bg-elevated p-3 rounded-lg border border-theme text-sm">
                                                <p className="text-secondary">{ev.description}</p>
                                                <p className="text-xs text-tertiary mt-1">{new Date(ev.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {dispute.status === 'open' && (
                                        <div className="mt-4 flex gap-2">
                                            <input 
                                                value={evidenceText} onChange={e => setEvidenceText(e.target.value)}
                                                placeholder="Add evidence description..."
                                                className="flex-1 bg-elevated border border-theme rounded-lg px-3 py-2 text-sm text-primary"
                                            />
                                            <Button 
                                                variant="outline" 
                                                onClick={() => handleAction(escrowService.submitEscrowEvidence, evidenceText).then(() => setEvidenceText(''))}
                                                disabled={!evidenceText || submitting}
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    )}
                                    {dispute.status === 'open' && (
                                        <div className="mt-6 pt-4 border-t border-rose-500/20">
                                            <h4 className="text-sm font-semibold text-rose-500 mb-3">Admin Resolution</h4>
                                            <p className="text-xs text-secondary mb-3">As an admin/mediator, you can resolve this dispute.</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-xs"
                                                    onClick={() => handleAction(escrowService.resolveEscrow, 'buyer_wins', 0, 'Resolved in favor of buyer')}
                                                    disabled={submitting}
                                                >
                                                    Buyer Wins (Refund)
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10 text-xs"
                                                    onClick={() => handleAction(escrowService.resolveEscrow, 'seller_wins', 0, 'Resolved in favor of seller')}
                                                    disabled={submitting}
                                                >
                                                    Seller Wins (Release)
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs"
                                                    onClick={() => {
                                                        const pct = prompt("Enter percentage to give to buyer (e.g. 50):");
                                                        if (pct) handleAction(escrowService.resolveEscrow, 'split', parseFloat(pct), 'Split resolution');
                                                    }}
                                                    disabled={submitting}
                                                >
                                                    Split Funds
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Available Actions */}
                        <div className="bg-elevated border border-theme rounded-xl p-5">
                            <h3 className="font-semibold text-primary mb-3">Actions</h3>
                            <div className="flex flex-wrap gap-2">
                                {escrow.status === 'funded' && (
                                    <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                        onClick={() => handleAction(escrowService.deliverEscrow, '')} disabled={submitting}>
                                        <Package className="w-4 h-4 mr-2" /> Mark Delivered
                                    </Button>
                                )}
                                {escrow.status === 'delivered' && (
                                    <Button variant="outline" className="flex-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                        onClick={() => handleAction(escrowService.releaseEscrow)} disabled={submitting}>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Release Funds
                                    </Button>
                                )}
                                {['funded', 'delivered'].includes(escrow.status) && (
                                    <Button variant="outline" className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                        onClick={() => setShowDisputeModal(true)} disabled={submitting}>
                                        <Flag className="w-4 h-4 mr-2" /> Raise Dispute
                                    </Button>
                                )}
                                {escrow.status === 'initiated' && (
                                    <p className="text-sm text-tertiary">Waiting for funding.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
                        className="bg-elevated w-full max-w-md rounded-2xl p-6 border border-theme shadow-2xl">
                        <h2 className="text-xl font-bold text-rose-500 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Raise a Dispute
                        </h2>
                        <p className="text-secondary text-sm mb-4">
                            Disputing will freeze the funds until resolved. Please explain the issue clearly.
                        </p>
                        
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Why are you disputing this transaction?"
                            className="w-full bg-secondary/5 border border-theme rounded-xl p-3 text-primary placeholder:text-tertiary min-h-[100px] mb-4 outline-none focus:border-rose-500/50"
                        />
                        
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDisputeModal(false)}>Cancel</Button>
                            <Button 
                                variant="primary" 
                                className="flex-1 !bg-rose-500 hover:!bg-rose-600 border-none text-white"
                                onClick={handleDispute}
                                disabled={!disputeReason || submitting}
                            >
                                Submit Dispute
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default EscrowDetail;
