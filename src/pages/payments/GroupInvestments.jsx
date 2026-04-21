import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Briefcase, Search, Plus, Calendar, Users, CheckCircle,
    ArrowLeft, PieChart, X, TrendingUp, DollarSign, Target,
    ThumbsUp, ThumbsDown, ChevronRight, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import paymentsService from '../../services/payments.service';
import fundingService from '../../services/funding.service';
import { formatDate } from '../../utils/dateFormatter';

const GroupInvestments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('for_you');
    const [investments, setInvestments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(null);
    const [showVoteModal, setShowVoteModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);
    const [voteLoading, setVoteLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', description: '', target_amount: '', maturity_date: '',
        payment_group: '', quoting_mode: 'proportional', opportunity_id: '', pitch_visibility: 'internal'
    });
    const [quoteAmount, setQuoteAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [investmentsData, groupsData, opsData] = await Promise.all([
                paymentsService.getGroupInvestments().catch(() => []),
                paymentsService.getMyGroups().catch(() => []),
                fundingService.getOpportunities({ status: 'active' }).catch(() => [])
            ]);
            setInvestments(Array.isArray(investmentsData) ? investmentsData : (investmentsData.results || []));
            setGroups(Array.isArray(groupsData) ? groupsData : (groupsData.results || []));
            setOpportunities(opsData?.results || (Array.isArray(opsData) ? opsData : []));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally { setLoading(false); }
    };

    const filteredInvestments = investments.filter(inv => {
        const matchesSearch = inv.name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;

        const isMyPitch = inv.initiator_name === `${user?.first_name} ${user?.last_name}` || inv.initiated_by === user?.id;
        switch (activeTab) {
            case 'active': return inv.status === 'active';
            case 'completed': return inv.status === 'completed';
            case 'my_pitches': return isMyPitch;
            case 'for_you':
            default: return true;
        }
    });

    const resetForm = () => {
        setFormData({
            name: '', description: '', target_amount: '', maturity_date: '',
            payment_group: '', quoting_mode: 'proportional', opportunity_id: '', pitch_visibility: 'internal'
        });
        setCreateStep(1);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (createStep === 1) { setCreateStep(2); return; }
        setCreateLoading(true);
        try {
            const payload = {
                name: formData.name, description: formData.description,
                target_amount: parseFloat(formData.target_amount) || 0,
                maturity_date: formData.maturity_date || null,
                payment_group: formData.payment_group,
                quoting_mode: formData.quoting_mode,
                pitch_visibility: formData.pitch_visibility,
                ...(formData.opportunity_id ? { investment_opportunity: formData.opportunity_id } : {})
            };
            await paymentsService.createGroupInvestment(payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create investment:', error);
            alert('Failed to create investment pitch.');
        } finally { setCreateLoading(false); }
    };

    const handleQuote = (e) => {
        e.preventDefault();
        if (!showQuoteModal || !quoteAmount) return;
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: showQuoteModal.id, type: 'investment_quote',
                    name: `Investment in ${showQuoteModal.name}`,
                    price: parseFloat(quoteAmount), qty: 1, image: null,
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(quoteAmount)
            }
        });
    };

    const handleVote = async (investmentId, voteValue, voteId) => {
        setVoteLoading(true);
        try {
            await paymentsService.castVote(voteId, voteValue);
            setShowVoteModal(null);
            loadData();
        } catch (error) {
            console.error('Vote failed:', error);
            alert('Vote submission failed.');
        } finally { setVoteLoading(false); }
    };

    const getProgress = (inv) => {
        if (!inv.target_amount || inv.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(inv.amount_collected || 0) / parseFloat(inv.target_amount)) * 100);
    };

    const totalTarget = investments.reduce((sum, i) => sum + parseFloat(i.target_amount || 0), 0);
    const totalCollected = investments.reduce((sum, i) => sum + parseFloat(i.amount_collected || 0), 0);
    const activeCount = investments.filter(i => i.status === 'active').length;

    const tabs = [
        { id: 'for_you', label: 'All Pitches' },
        { id: 'active', label: 'Active' },
        { id: 'my_pitches', label: 'My Pitches' },
        { id: 'completed', label: 'Completed' },
        { id: 'opportunities', label: 'Opportunities' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/payments')} className="p-2 hover:bg-secondary/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Group Investments</h1>
                        <p className="text-secondary mt-0.5 text-sm">Pool resources, own shares, vote on pitches</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
                    <Plus className="w-4 h-4 mr-1.5" /> New Pitch
                </Button>
            </div>

            {/* Summary */}
            <div className="bg-elevated border border-theme rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-widest">Capital Pledged</p>
                            <h2 className="text-3xl font-extrabold text-primary mt-0.5">
                                ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{activeCount}</p>
                            <p className="text-xs text-secondary font-medium">Active</p>
                        </div>
                        <div className="w-px bg-theme self-stretch"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">${totalTarget.toLocaleString()}</p>
                            <p className="text-xs text-secondary font-medium">Target</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input type="text" placeholder="Search investments..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex p-1 bg-secondary/5 rounded-xl border border-theme">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Investment Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-secondary/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredInvestments.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-2xl text-center py-16">
                    <Briefcase className="w-10 h-10 text-tertiary mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-primary mb-1">
                        {searchTerm ? 'No investments found' : 'No investment pitches yet'}
                    </h3>
                    <p className="text-secondary text-sm mb-5 max-w-xs mx-auto">
                        {searchTerm ? 'Try a different search term' : 'Pitch an investment to your group to get started'}
                    </p>
                    {!searchTerm && (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
                            <Plus className="w-4 h-4 mr-1.5" /> Create Pitch
                        </Button>
                    )}
                </div>
            ) : activeTab === 'opportunities' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {opportunities.length === 0 && <p className="text-secondary col-span-full">No opportunities available.</p>}
                    {opportunities.map(opp => (
                        <div key={opp.id} className="bg-elevated border border-theme rounded-2xl p-5 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-primary group-hover:text-indigo-600 transition-colors line-clamp-1">{opp.title || opp.name}</h4>
                                {opp.is_verified && (
                                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                        <CheckCircle className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-secondary line-clamp-3 mb-4">{opp.description}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-secondary/5 rounded-xl p-2.5">
                                    <p className="text-[10px] text-tertiary font-semibold uppercase tracking-wider mb-0.5">Expected Return</p>
                                    <p className="text-sm font-bold text-green-600">{opp.expected_return || 'N/A'}</p>
                                </div>
                                <div className="bg-secondary/5 rounded-xl p-2.5">
                                    <p className="text-[10px] text-tertiary font-semibold uppercase tracking-wider mb-0.5">Min Individual</p>
                                    <p className="text-sm font-bold text-primary">${parseFloat(opp.min_individual_entry || opp.min_investment || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-secondary/5 rounded-xl p-2.5">
                                    <p className="text-[10px] text-tertiary font-semibold uppercase tracking-wider mb-0.5">Min Group</p>
                                    <p className="text-sm font-bold text-primary">${parseFloat(opp.min_group_entry || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-secondary/5 rounded-xl p-2.5">
                                    <p className="text-[10px] text-tertiary font-semibold uppercase tracking-wider mb-0.5">Gain Interval</p>
                                    <p className="text-sm font-bold capitalize text-primary">{opp.gain_intervals || 'Monthly'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-theme">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                    opp.risk_level === 'low' ? 'text-green-700 bg-green-50' : 
                                    opp.risk_level === 'high' ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'
                                }`}>
                                    {opp.risk_level || 'Medium'} Risk
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/funding/opportunity/${opp.id}`);
                                    }} className="text-xs py-1.5 px-3">
                                        <ExternalLink className="w-3 h-3 mr-1" /> View
                                    </Button>
                                    <Button variant="primary" onClick={() => {
                                        setFormData({ ...formData, opportunity_id: opp.id, name: opp.title || opp.name, description: opp.description });
                                        setShowCreateModal(true);
                                    }} className="text-xs py-1.5 px-3 shadow-sm">
                                        Pitch Strategy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredInvestments.map(inv => {
                        const progress = getProgress(inv);
                        return (
                            <div key={inv.id}
                                onClick={() => navigate(`/payments/group-investments/${inv.id}`)}
                                className="bg-elevated border border-theme rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-primary text-sm group-hover:text-indigo-700 transition-colors line-clamp-1">{inv.name}</h3>
                                            <p className="text-xs text-secondary line-clamp-1 mt-0.5">{inv.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                        <Users className="w-3 h-3" /> {inv.payment_group_name || 'Group'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md capitalize">
                                        <PieChart className="w-3 h-3" /> {inv.quoting_mode}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md capitalize">
                                        {inv.pitch_visibility || 'Internal'}
                                    </span>
                                    {inv.approval_vote?.user_vote && (
                                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                                            inv.status === 'active' ? 'text-amber-700 bg-amber-50'
                                            : inv.status === 'completed' ? 'text-green-700 bg-green-50'
                                            : 'text-gray-700 bg-gray-50'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-base font-bold text-primary">${parseFloat(inv.amount_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className="text-xs text-secondary">of ${parseFloat(inv.target_amount || 0).toLocaleString()}</span>
                                </div>

                                {/* Progress */}
                                <div className="h-2 bg-secondary/10 rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>

                                {/* Gated Analytics - Only show vote counts if user has voted */}
                                {inv.approval_vote && (
                                    <div className="mb-4 bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                                        {inv.approval_vote.user_vote ? (
                                            <>
                                                <div className="flex justify-between text-xs font-semibold mb-1">
                                                    <span className="text-indigo-900">Approval Sentiment</span>
                                                    <span className={inv.approval_vote.approval_percentage >= 50 ? "text-green-600" : "text-amber-600"}>
                                                        {inv.approval_vote.approval_percentage}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                                    <div className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${inv.approval_vote.approval_percentage}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-secondary">
                                                    <span>{inv.approval_vote.votes_for_count} For</span>
                                                    <span>{inv.approval_vote.votes_against_count} Against</span>
                                                    <span>{inv.approval_vote.votes_abstain_count} Abstain</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-2">
                                                <p className="text-xs font-medium text-indigo-800">Vote to reveal sentiment analytics</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-between items-center pt-2 border-t border-theme">
                                    {!inv.approval_vote?.user_vote ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); setShowVoteModal({ ...inv, vote: 'for' }); }}
                                                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                                title="Vote For">
                                                <ThumbsUp className="w-3.5 h-3.5" /> For
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setShowVoteModal({ ...inv, vote: 'against' }); }}
                                                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                title="Vote Against">
                                                <ThumbsDown className="w-3.5 h-3.5" /> Against
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs font-medium text-secondary flex items-center gap-1.5">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-500"/> Voted {inv.approval_vote.user_vote}
                                        </div>
                                    )}
                                    {inv.status === 'active' && inv.approval_vote?.user_vote && (
                                        <button onClick={(e) => { e.stopPropagation(); setShowQuoteModal(inv); }}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                                            Quote
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}



            {/* Vote Confirmation Modal */}
            {showVoteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm">
                        <CardBody className="p-6 text-center">
                            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
                                showVoteModal.vote === 'for' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                                {showVoteModal.vote === 'for'
                                    ? <ThumbsUp className="w-7 h-7 text-green-600" />
                                    : <ThumbsDown className="w-7 h-7 text-red-600" />
                                }
                            </div>
                            <h3 className="text-lg font-bold text-primary mb-2">
                                Vote {showVoteModal.vote === 'for' ? 'For' : 'Against'}
                            </h3>
                            <p className="text-sm text-secondary mb-6">
                                Are you sure you want to vote <strong>{showVoteModal.vote}</strong> the pitch <strong>"{showVoteModal.name}"</strong>?
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowVoteModal(null)}>Cancel</Button>
                                <Button variant="primary" className={`flex-1 ${showVoteModal.vote === 'for' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} border-0`}
                                    disabled={voteLoading} onClick={() => handleVote(showVoteModal.id, showVoteModal.vote, showVoteModal.approval_vote?.id)}>
                                    {voteLoading ? 'Submitting...' : 'Confirm Vote'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">Quote Shares</h3>
                                <button onClick={() => setShowQuoteModal(null)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleQuote} className="space-y-4">
                                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 text-sm mb-2">{showQuoteModal.name}</h4>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-indigo-700">Capital Raised</span>
                                        <span className="font-bold text-indigo-900">${parseFloat(showQuoteModal.amount_collected || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-700">Target</span>
                                        <span className="font-bold text-indigo-900">${parseFloat(showQuoteModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-tertiary" />
                                    </div>
                                    <input type="number" min="0.01" step="0.01" required value={quoteAmount}
                                        onChange={(e) => setQuoteAmount(e.target.value)} placeholder="0.00"
                                        className="block w-full pl-10 pr-4 py-3 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-indigo-500 text-xl font-bold text-center" />
                                </div>
                                {quoteAmount && showQuoteModal.target_amount > 0 && showQuoteModal.quoting_mode === 'proportional' && (
                                    <div className="text-xs text-secondary bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-center">
                                        This secures <strong className="text-indigo-700">{((parseFloat(quoteAmount) / parseFloat(showQuoteModal.target_amount)) * 100).toFixed(2)}%</strong> equity
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowQuoteModal(null)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={!quoteAmount}>Proceed to Checkout</Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">
                                    {createStep === 1 ? 'New Investment Pitch' : 'Capital & Terms'}
                                </h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-5">
                                {[1, 2].map(s => (
                                    <React.Fragment key={s}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            s < createStep ? 'bg-green-500 text-white' : s === createStep ? 'bg-indigo-600 text-white' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                            {s < createStep ? <CheckCircle className="w-4 h-4" /> : s}
                                        </div>
                                        {s < 2 && <div className={`flex-1 h-0.5 ${s < createStep ? 'bg-green-500' : 'bg-secondary/10'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {createStep === 1 && (
                                    <>
                                        <Input label="Investment Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Real Estate Fund" />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3} placeholder="Describe the investment opportunity..."
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none resize-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Payment Group *</label>
                                            <select value={formData.payment_group} required
                                                onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                                                <option value="">Choose a group...</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Pitch Visibility</label>
                                            <div className="flex gap-2">
                                                {['internal', 'public'].map(m => (
                                                    <button key={m} type="button" onClick={() => setFormData({ ...formData, pitch_visibility: m })}
                                                        className={`flex-1 p-2.5 rounded-lg border-2 text-center text-xs font-medium capitalize ${
                                                            formData.pitch_visibility === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-theme text-secondary'
                                                        }`}>{m === 'internal' ? 'Group Only' : 'Public Pitch'}</button>
                                                ))}
                                            </div>
                                        </div>
                                        {opportunities.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1">Link to Opportunity (optional)</label>
                                                <select value={formData.opportunity_id}
                                                    onChange={(e) => setFormData({ ...formData, opportunity_id: e.target.value })}
                                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                                                    <option value="">None (custom pitch)</option>
                                                    {opportunities.map(o => <option key={o.id} value={o.id}>{o.title || o.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                {createStep === 2 && (
                                    <>
                                        <Input label="Target Capital ($) *" type="number" min="1" step="0.01"
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                            required placeholder="e.g., 50000.00" />
                                        <Input label="Maturity Date" type="date" value={formData.maturity_date}
                                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })} />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Quoting Mode</label>
                                            <div className="flex gap-2">
                                                {['proportional', 'fixed', 'individual'].map(m => (
                                                    <button key={m} type="button" onClick={() => setFormData({ ...formData, quoting_mode: m })}
                                                        className={`flex-1 p-2.5 rounded-lg border-2 text-center text-xs font-medium capitalize ${
                                                            formData.quoting_mode === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-theme text-secondary'
                                                        }`}>{m}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-2 pt-3">
                                    {createStep > 1 && (
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateStep(createStep - 1)}>Back</Button>
                                    )}
                                    <Button type="button" variant="outline" className={createStep === 1 ? "flex-1" : ""} onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1"
                                        disabled={createLoading || (createStep === 1 && (!formData.name || !formData.payment_group))}>
                                        {createLoading ? 'Creating...' : createStep === 1 ? 'Next' : 'Submit Pitch'}
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

export default GroupInvestments;
