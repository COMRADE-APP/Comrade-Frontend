import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, RefreshCw, Zap, Plus, Calendar, 
    CheckCircle2, Circle, Settings,
    ShoppingCart, PiggyBank, Coins, ArrowUpCircle,
    TrendingUp, Heart, Landmark, Smartphone, BookOpen, ShieldCheck,
    ListOrdered, X, MoveUp, MoveDown, Save
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const AUTOMATION_TYPES = [
    { key: 'contribute', label: 'Contribute', icon: Coins, color: 'emerald', desc: 'Auto-contribute to group rounds or kitties' },
    { key: 'save', label: 'Save', icon: PiggyBank, color: 'blue', desc: 'Auto-save to a piggy bank target' },
    { key: 'purchase', label: 'Purchase', icon: ShoppingCart, color: 'purple', desc: 'Auto-purchase products on schedule' },
    { key: 'course', label: 'Courses', icon: BookOpen, color: 'amber', desc: 'Auto-pay for courses and learning paths' },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'amber', desc: 'Auto-withdraw to your wallet' },
    { key: 'loan_repayment', label: 'Loan Repayment', icon: Landmark, color: 'rose', desc: 'Auto-repay group or subscribed loans' },
    { key: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'sky', desc: 'Auto-pay insurance premiums' },
    { key: 'bills', label: 'Bills & Airtime', icon: Smartphone, color: 'orange', desc: 'Auto-pay bills, utilities, and airtime' },
    { key: 'investment', label: 'Investment', icon: TrendingUp, color: 'indigo', desc: 'Auto-invest in group or external opportunities' },
    { key: 'donation', label: 'Donation', icon: Heart, color: 'pink', desc: 'Auto-donate to campaigns or charities' },
];

const GroupAutomationsTab = ({ groupId }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [automations, setAutomations] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sequenceModalOpen, setSequenceModalOpen] = useState(false);
    const [selectedAutomation, setSelectedAutomation] = useState(null);
    const [sequence, setSequence] = useState([]);

    useEffect(() => {
        if (groupId) {
            loadAutomations();
            loadMembers();
        }
    }, [groupId]);

    const loadMembers = async () => {
        try {
            const data = await paymentsService.getGroupDetails(groupId);
            setGroupMembers(data.members || []);
        } catch (e) {
            console.error('Error loading members:', e);
        }
    };

    const loadAutomations = async () => {
        setLoading(true);
        try {
            const data = await paymentsService.getGroupAutomations(groupId);
            setAutomations(data || []);
        } catch (e) {
            console.error('Error loading automations:', e);
        } finally {
            setLoading(false);
        }
    };

    const getTypeConfig = (type) => AUTOMATION_TYPES.find(t => t.key === type) || AUTOMATION_TYPES[0];

    const openSequenceModal = (auto) => {
        setSelectedAutomation(auto);
        if (auto.withdrawal_sequence && auto.withdrawal_sequence.length > 0) {
            const ordered = [];
            const remaining = [...groupMembers];
            auto.withdrawal_sequence.forEach(id => {
                const idx = remaining.findIndex(m => m.id === id);
                if (idx !== -1) {
                    ordered.push(remaining.splice(idx, 1)[0]);
                }
            });
            setSequence([...ordered, ...remaining]);
        } else {
            setSequence([...groupMembers]);
        }
        setSequenceModalOpen(true);
    };

    const handleSaveSequence = async () => {
        if (!selectedAutomation) return;
        try {
            const seqIds = sequence.map(m => m.id);
            await paymentsService.updateGroupAutomation(groupId, selectedAutomation.id, {
                withdrawal_sequence: seqIds,
                withdrawal_current_index: 0
            });
            toast.success('Sequence saved successfully');
            setSequenceModalOpen(false);
            loadAutomations();
        } catch (err) {
            toast.error('Failed to save sequence');
        }
    };

    const moveMember = (index, direction) => {
        const newSeq = [...sequence];
        if (direction === 'up' && index > 0) {
            [newSeq[index - 1], newSeq[index]] = [newSeq[index], newSeq[index - 1]];
        } else if (direction === 'down' && index < newSeq.length - 1) {
            [newSeq[index + 1], newSeq[index]] = [newSeq[index], newSeq[index + 1]];
        }
        setSequence(newSeq);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Smart Automations
                    </h3>
                    <p className="text-sm text-secondary">Automate contributions, savings, purchases, and withdrawals.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-emerald-600" onClick={() => navigate(`/payments/groups/${groupId}/create-automation`)}>
                    <Plus className="w-4 h-4" /> New Automation
                </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {AUTOMATION_TYPES.map(t => {
                    const Icon = t.icon;
                    const count = automations.filter(a => a.automation_type === t.key).length;
                    return (
                        <div key={t.key} className={`bg-${t.color}-50 dark:bg-${t.color}-900/10 border border-${t.color}-100 dark:border-${t.color}-800 rounded-xl p-3 flex gap-3 items-center`}>
                            <div className={`p-2 bg-${t.color}-100 dark:bg-${t.color}-800/30 rounded-lg text-${t.color}-600`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-bold text-${t.color}-900 dark:text-${t.color}-100`}>{t.label}</h4>
                                <p className={`text-[10px] text-${t.color}-700 dark:text-${t.color}-300`}>{count} active</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {automations.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800">
                        <Clock className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Automations</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Automate your contributions, savings, and purchases so you never miss a cycle.
                    </p>
                    <Button variant="outline" onClick={() => navigate(`/payments/groups/${groupId}/create-automation`)}>Create Your First Rule</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {automations.map(auto => {
                        const cfg = getTypeConfig(auto.automation_type || 'contribute');
                        const TypeIcon = cfg.icon;
                        const isPendingVote = auto.status === 'pending_vote';
                        
                        return (
                            <Card key={auto.id} className={`border-theme hover:border-${cfg.color}-300 transition-colors ${isPendingVote ? 'border-amber-300 bg-amber-50/20' : ''}`}>
                                <CardBody className="p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <TypeIcon className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${auto.is_active ? `bg-${cfg.color}-100 text-${cfg.color}-600` : 'bg-gray-100 text-gray-500'}`}>
                                                <TypeIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-tertiary font-bold uppercase tracking-wider mb-0.5">
                                                    {cfg.label} Automation
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {isPendingVote ? (
                                                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                            <Clock className="w-3 h-3" /> Voting Pending
                                                        </span>
                                                    ) : auto.is_active ? (
                                                        <span className={`flex items-center gap-1 text-xs text-${cfg.color}-600 font-medium bg-${cfg.color}-50 px-2 py-0.5 rounded-md border border-${cfg.color}-100`}>
                                                            <CheckCircle2 className="w-3 h-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                                            <Circle className="w-3 h-3" /> Paused
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Action Icon / Toggle */}
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    await paymentsService.updateGroupAutomation(groupId, auto.id, { is_active: !auto.is_active });
                                                    loadAutomations();
                                                    toast.success(`Automation ${auto.is_active ? 'paused' : 'activated'}`);
                                                } catch (err) {
                                                    toast.error('Failed to update automation');
                                                }
                                            }}
                                            className="text-secondary hover:text-primary transition-colors p-1"
                                            title={auto.is_active ? 'Pause' : 'Activate'}
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-theme relative z-10">
                                        <div>
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Amount</p>
                                            <p className="text-lg font-bold text-primary">{formatMoneySimple(auto.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Frequency</p>
                                            <p className="text-sm font-medium text-secondary capitalize">{auto.frequency}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Voting UI */}
                                    {isPendingVote && (
                                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800 text-xs">
                                            <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">Vote on this rule:</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="primary" className="!bg-emerald-600 !py-1"
                                                    onClick={async () => {
                                                        try {
                                                            await paymentsService.voteGroupAutomation(groupId, auto.id, 'approve');
                                                            loadAutomations();
                                                            toast.success('Vote cast successfully');
                                                        } catch (err) { toast.error('Failed to vote'); }
                                                    }}
                                                >Approve</Button>
                                                <Button size="sm" variant="outline" className="!py-1"
                                                    onClick={async () => {
                                                        try {
                                                            await paymentsService.voteGroupAutomation(groupId, auto.id, 'reject');
                                                            loadAutomations();
                                                            toast.success('Vote cast successfully');
                                                        } catch (err) { toast.error('Failed to vote'); }
                                                    }}
                                                >Reject</Button>
                                            </div>
                                            <p className="text-tertiary mt-2">Threshold: {auto.votes_count || 0} / {auto.votes_required || 0} votes</p>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="mt-4 flex items-center justify-between text-xs relative z-10">
                                        <div className="flex items-center gap-1.5 text-secondary">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Next Run: <strong>{auto.next_execution_date || (auto.frequency === 'monthly' ? `Day ${auto.execution_day}` : 'Upcoming')}</strong></span>
                                        </div>
                                        {auto.automation_type === 'withdraw' && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-secondary">
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    <span className="capitalize">{auto.withdrawal_mode || 'All'}</span>
                                                </div>
                                                {auto.withdrawal_mode === 'sequential' && (
                                                    <Button size="sm" variant="outline" className="!py-0.5 !px-2 text-[10px]" onClick={() => openSequenceModal(auto)}>
                                                        <ListOrdered className="w-3 h-3 mr-1" /> Configure
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Sequence Modal */}
            {sequenceModalOpen && selectedAutomation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-theme flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-theme flex justify-between items-center bg-elevated">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <ListOrdered className="w-5 h-5 text-amber-500" />
                                Configure Sequence
                            </h3>
                            <button onClick={() => setSequenceModalOpen(false)} className="p-1 hover:bg-secondary/10 rounded-lg text-secondary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-1">
                            <p className="text-sm text-secondary mb-4">
                                Use the arrows to reorder members. In sequential mode, withdrawals rotate according to this order.
                            </p>
                            
                            <div className="space-y-2">
                                {sequence.map((member, index) => {
                                    const isCurrentTurn = selectedAutomation.withdrawal_current_index === index;
                                    return (
                                        <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrentTurn ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-theme bg-elevated'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrentTurn ? 'bg-amber-500 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-primary">{member.user_name}</p>
                                                    {isCurrentTurn && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Current Turn</p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button disabled={index === 0} onClick={() => moveMember(index, 'up')} className="p-1 hover:bg-secondary/10 rounded text-secondary disabled:opacity-30">
                                                    <MoveUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button disabled={index === sequence.length - 1} onClick={() => moveMember(index, 'down')} className="p-1 hover:bg-secondary/10 rounded text-secondary disabled:opacity-30">
                                                    <MoveDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-theme bg-elevated flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSequenceModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" className="!bg-emerald-600 gap-2" onClick={handleSaveSequence}>
                                <Save className="w-4 h-4" /> Save Sequence
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupAutomationsTab;