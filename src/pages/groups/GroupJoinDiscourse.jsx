import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { paymentsService } from '../../services/payments.service';
import { Search, Info, Check, X, Users, DollarSign, Eye, TrendingUp, TrendingDown, Target, Shield, AlertTriangle, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// --- Helper for Mock Data (until backend returns these exactly) ---
const generateMockSparklineData = (isGain) => {
    return Array.from({ length: 12 }).map((_, i) => ({
        index: i,
        value: isGain ? (100 + i * 10 + Math.random() * 20) : (100 + (Math.random() * 30 - 15))
    }));
};

const GroupJoinDiscourse = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // State
    const [publicGroups, setPublicGroups] = useState([]);
    const [recommendedGroups, setRecommendedGroups] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('discover'); // discover, recommended, my_requests, approvals
    
    // Modal State
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [requestNotes, setRequestNotes] = useState('');
    const [applicationAnswers, setApplicationAnswers] = useState({});

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [pubRes, recRes, myReq, incReq] = await Promise.allSettled([
                paymentsService.getPublicGroups(),
                paymentsService.getRecommendedGroups(),
                paymentsService.getMyJoinRequests(),
                paymentsService.getIncomingJoinRequests()
            ]);

            setPublicGroups(pubRes.status === 'fulfilled' ? (pubRes.value?.results || pubRes.value || []) : []);
            setRecommendedGroups(recRes.status === 'fulfilled' ? (recRes.value?.results || recRes.value || []) : []);
            setMyRequests(myReq.status === 'fulfilled' ? (myReq.value?.results || myReq.value || []) : []);
            setIncomingRequests(incReq.status === 'fulfilled' ? (incReq.value?.results || incReq.value || []) : []);
            
        } catch (error) {
            console.error('Failed to load discourse data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async (e) => {
        e.preventDefault();
        if (!selectedGroup) return;
        try {
            const res = await paymentsService.requestToJoinGroup(selectedGroup.id, requestNotes, applicationAnswers);
            
            if (res.status === 'pending_payment') {
                navigate('/payments/checkout', {
                    state: {
                        cartItems: [{
                            id: res.id,
                            type: 'join_fee',
                            name: `Entry Fee for ${selectedGroup.name}`,
                            price: selectedGroup.entry_fee_amount,
                            qty: 1
                        }],
                        returnUrl: '/payments/groups'
                    }
                });
                return;
            }

            alert('Request sent successfully!');
            setRequestModalOpen(false);
            setSelectedGroup(null);
            setRequestNotes('');
            setApplicationAnswers({});
            loadAllData();
            setActiveTab('my_requests');
        } catch (error) {
            alert('Failed to send request. ' + (error.response?.data?.error || ''));
        }
    };

    const handleWithdraw = async (requestId) => {
        if (!window.confirm('Withdraw this request?')) return;
        try {
            await paymentsService.withdrawJoinRequest(requestId);
            loadAllData();
        } catch (error) {
            alert('Failed to withdraw request.');
        }
    };

    const handleApprove = async (requestId) => {
        try {
            await paymentsService.approveJoinRequest(requestId, 'Approved by Admin');
            loadAllData();
        } catch (error) {
            alert('Failed to approve request.');
        }
    };

    const handleReject = async (requestId) => {
        try {
            await paymentsService.rejectJoinRequest(requestId, 'Does not meet portfolio requirements.');
            loadAllData();
        } catch (error) {
            alert('Failed to reject request.');
        }
    };

    // --- Components ---
    
    const PortfolioPreviewCard = ({ group, isRecommended }) => {
        // Construct visual portfolio data (mocked if missing from backend)
        const gains = group.history_gains || `+${(Math.random() * 15 + 5).toFixed(1)}%`;
        const losses = group.history_losses || `-${(Math.random() * 3 + 0.5).toFixed(1)}%`;
        const avgReturn = group.average_return || `${(Math.random() * 12 + 2).toFixed(1)}%`;
        const riskOptions = ['Conservative', 'Moderate', 'Aggressive'];
        const risk = group.risk_category || riskOptions[group.id?.charCodeAt(0) % 3 || 1];
        const hasLoans = group.offers_loans || group.id?.charCodeAt(1) % 2 === 0;
        
        const isGain = parseFloat(avgReturn) > 5;
        const sparklineData = generateMockSparklineData(isGain);
        const sparkColor = isGain ? '#10b981' : '#f59e0b';

        return (
            <div onClick={() => navigate(`/groups/profile/${group.id}`)} className={`relative overflow-hidden group bg-elevated border transition-all duration-300 rounded-2xl flex flex-col h-full hover:-translate-y-1 hover:shadow-lg cursor-pointer ${isRecommended ? 'border-amber-400/50 shadow-amber-500/10' : 'border-theme hover:border-primary-500'}`}>
                {isRecommended && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 z-10" />
                )}
                <div className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="pr-4">
                            <h3 className="font-bold text-lg text-primary leading-tight mb-1">{group.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-theme">
                                    {group.group_type || 'Standard Phase'}
                                </span>
                                {isRecommended && (
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800">
                                        ✨ Match
                                    </span>
                                )}
                            </div>
                        </div>
                        {group.portfolio_public && (
                            <button onClick={() => navigate(`/payments/groups/${group.id}`)} className="p-2 bg-primary/5 text-primary-600 rounded-xl hover:bg-primary/10 transition-colors shrink-0" title="View Full Portfolio">
                                <Eye className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-secondary mb-5 line-clamp-2 leading-relaxed">
                        {group.description || 'Join this exclusive payment group to unlock financial collaboration.'}
                    </p>

                    {/* Analytics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-secondary/5 rounded-xl border border-theme">
                        <div>
                            <span className="text-[10px] text-tertiary flex items-center gap-1 mb-0.5"><TrendingUp className="w-3 h-3 text-emerald-500"/> Gains</span>
                            <span className="text-sm font-semibold text-emerald-600">{gains}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-tertiary flex items-center gap-1 mb-0.5"><TrendingDown className="w-3 h-3 text-rose-500"/> Losses</span>
                            <span className="text-sm font-semibold text-rose-600">{losses}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-tertiary flex items-center gap-1 mb-0.5"><AlertTriangle className="w-3 h-3 text-amber-500"/> Risk</span>
                            <span className="text-sm font-semibold text-primary">{risk}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-tertiary flex items-center gap-1 mb-0.5"><Target className="w-3 h-3 text-blue-500"/> Avg Return</span>
                            <span className="text-sm font-semibold text-blue-600">{avgReturn} / yr</span>
                        </div>
                    </div>

                    {/* Sparkline & Perks */}
                    <div className="flex items-center justify-between mb-5 mt-auto">
                        <div className="flex items-center gap-2">
                            {hasLoans && (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    <Coins className="w-3.5 h-3.5" /> Credit/Loans
                                </span>
                            )}
                        </div>
                        <div className="h-8 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData}>
                                    <Line type="monotone" dataKey="value" stroke={sparkColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-theme">
                        <div className="flex items-center gap-4 text-xs font-medium text-tertiary">
                            <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {group.members?.length || group.member_count || 0}</div>
                            <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> ${(group.target_amount || group.current_amount || 0).toLocaleString()}</div>
                        </div>
                        <Button variant="primary" size="sm" onClick={(e) => { 
                            e.stopPropagation();
                            setSelectedGroup(group); 
                            setRequestNotes('');
                            setApplicationAnswers({});
                            setRequestModalOpen(true); 
                        }} className="rounded-xl px-4 py-1.5 h-auto text-xs font-bold shadow-sm hover:shadow-primary-500/25">
                            Apply to Join
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const filteredGroups = Array.isArray(publicGroups) ? publicGroups.filter(g => 
        g.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (loading) return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-theme pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-purple-600" />
                        Group Discourse
                    </h2>
                    <p className="text-secondary max-w-xl">
                        Discover top-performing investment groups and piggy banks. Evaluate portfolio history, risk, and returns before submitting your application.
                    </p>
                </div>
            </div>

            {/* Custom Sub-Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'discover', label: 'Explore Public Groups' },
                    { id: 'recommended', label: 'Recommended For You', badge: recommendedGroups.length },
                    { id: 'my_requests', label: 'My Applications', badge: myRequests.length },
                    { id: 'approvals', label: 'Admin Review', badge: incomingRequests.length, reqAdmin: true }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            activeTab === tab.id 
                                ? 'bg-primary border border-transparent text-white shadow-md' 
                                : 'bg-transparent border border-theme text-secondary hover:bg-secondary/10 hover:border-primary/50'
                        }`}
                    >
                        {tab.label}
                        {!!tab.badge && (
                            <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            
            {/* 1. DISCOVER */}
            {activeTab === 'discover' && (
                <div className="space-y-6">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search portfolios by name, keyword, or asset class..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-elevated border border-theme rounded-2xl text-primary font-medium outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm transition-all"
                        />
                    </div>
                    
                    {filteredGroups.length === 0 ? (
                        <div className="py-12 text-center text-tertiary border border-dashed border-theme rounded-2xl">
                            No public groups match your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGroups.map(group => (
                                <PortfolioPreviewCard key={group.id} group={group} isRecommended={false} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. RECOMMENDED */}
            {activeTab === 'recommended' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-amber-600 mb-2 flex items-center gap-2">✨ Match Powered by QomAI</h3>
                        <p className="text-amber-700/80 text-sm max-w-2xl">
                            These groups match your specified risk tolerance, historical investment patterns, and tier metrics. Applying to these groups yields a higher absolute return on average.
                        </p>
                    </div>
                    
                    {recommendedGroups.length === 0 ? (
                        <div className="py-12 text-center text-tertiary border border-dashed border-theme rounded-2xl">
                            No recommendations at this time. Engage more with the platform to train your profile!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedGroups.map(group => (
                                <PortfolioPreviewCard key={group.id} group={group} isRecommended={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. MY REQUESTS */}
            {activeTab === 'my_requests' && (
                <div className="space-y-6">
                    {myRequests.length === 0 ? (
                        <div className="py-12 text-center text-tertiary border border-dashed border-theme rounded-2xl">
                            You have not submitted any applications.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myRequests.map(req => (
                                <Card key={req.id} className="bg-elevated/50 border-theme hover:border-primary/50 transition-colors">
                                    <CardBody>
                                        <div className="flex justify-between items-start mb-4 border-b border-theme pb-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-primary">{req.group_name || req.group || 'Unknown Group'}</h4>
                                                <span className="text-xs text-secondary mt-1 block">Applied: {new Date(req.created_at || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {req.status || 'Pending'}
                                            </span>
                                        </div>
                                        <div className="bg-secondary/10 rounded-xl p-4 mb-4">
                                            <p className="text-xs text-tertiary uppercase font-bold tracking-wider mb-2">My Pitch</p>
                                            <p className="text-sm text-secondary italic">"{req.notes || req.message || 'No additional pitch provided.'}"</p>
                                        </div>
                                        {req.status === 'pending_payment' && (
                                            <div className="flex justify-end mt-4 mb-2">
                                                <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                                                    navigate('/payments/checkout', {
                                                        state: {
                                                            cartItems: [{
                                                                id: req.id,
                                                                type: 'join_fee',
                                                                name: `Entry Fee for ${req.group_name || req.group || 'Group'}`,
                                                                price: req.group_entry_fee_amount || 0, // Fallback if backend doesn't send
                                                                qty: 1
                                                            }],
                                                            returnUrl: '/payments/groups'
                                                        }
                                                    });
                                                }}>
                                                    Pay Entry Fee
                                                </Button>
                                            </div>
                                        )}
                                        {req.status === 'pending' && (
                                            <div className="flex justify-end">
                                                <Button variant="outline" size="sm" className="text-rose-600 hover:bg-rose-50 hover:border-rose-200" onClick={() => handleWithdraw(req.id)}>
                                                    Withdraw Application
                                                </Button>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. ADMIN APPROVALS */}
            {activeTab === 'approvals' && (
                <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-blue-600 mb-2">Incoming Applications</h3>
                        <p className="text-blue-700/80 text-sm max-w-2xl">
                            Review applicants requesting to join your managed payment groups. Evaluate their pitch and portfolio data before approving or rejecting.
                        </p>
                    </div>

                    {incomingRequests.length === 0 ? (
                        <div className="py-12 text-center text-tertiary border border-dashed border-theme rounded-2xl">
                            No pending applications to review.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incomingRequests.map(req => (
                                <Card key={req.id} className="overflow-hidden border-theme">
                                    <CardBody className="p-0">
                                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-theme">
                                            {/* Left side: Requester Info */}
                                            <div className="p-6 md:w-1/3 bg-secondary/5">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                                        {(req.requester_name || req.requester || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-primary">{req.requester_name || req.requester || 'Anonymous User'}</h4>
                                                        <p className="text-xs text-secondary">Target: {req.group_name || req.group}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-tertiary">Platform Rating</span>
                                                        <span className="font-semibold text-primary">{req.requester_rating || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-tertiary">Successful Groups</span>
                                                        <span className="font-semibold text-primary">{req.requester_groups_count || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Right side: Pitch & Actions */}
                                            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                                <div>
                                                    <h5 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-2">Application Pitch / Portfolio link</h5>
                                                    <p className="text-sm text-secondary bg-elevated border border-theme rounded-xl p-4 leading-relaxed mb-4">
                                                        "{req.notes || req.message || 'Standard application.'}"
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <Button variant="outline" className="flex-1 text-rose-600 hover:bg-rose-50 hover:border-rose-200" onClick={() => handleReject(req.id)}>
                                                        <X className="w-4 h-4 mr-2" /> Reject Applicant
                                                    </Button>
                                                    <Button variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(req.id)}>
                                                        <Check className="w-4 h-4 mr-2" /> Approve & Admit
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Request Modal */}
            {requestModalOpen && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl border-theme scale-100 animate-in zoom-in-95 duration-200">
                        <CardBody className="p-8">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-primary leading-tight mb-2">Apply to {selectedGroup.name}</h3>
                                <p className="text-secondary text-sm">Present your case to the group admins. Explain your investment strategy or share links to your portfolio.</p>
                            </div>
                            
                            <form onSubmit={handleJoinRequest} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-primary mb-2">
                                        Your Pitch & Portfolio Data
                                    </label>
                                    <textarea
                                        value={requestNotes}
                                        onChange={(e) => setRequestNotes(e.target.value)}
                                        placeholder="E.g., I have 3 years of steady trading history, focusing on moderate risk bonds and blue-chips. Here is a link to my verified portfolio..."
                                        className="w-full p-4 bg-secondary/10 border border-theme rounded-xl text-primary h-32 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                        required
                                    />
                                </div>
                                
                                {selectedGroup?.custom_application_questions && selectedGroup.custom_application_questions.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-theme">
                                        <h4 className="font-bold text-primary">Additional Questions</h4>
                                        {selectedGroup.custom_application_questions.map((question, idx) => (
                                            <div key={idx}>
                                                <label className="block text-sm font-medium text-secondary mb-1">
                                                    {question} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={applicationAnswers[question] || ''}
                                                    onChange={(e) => setApplicationAnswers({
                                                        ...applicationAnswers,
                                                        [question]: e.target.value
                                                    })}
                                                    className="w-full px-4 py-2 bg-secondary/10 border border-theme rounded-lg text-primary outline-none focus:border-primary-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {selectedGroup?.entry_fee_required && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 mt-4">
                                        <div className="mt-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-amber-700">Entry Fee Required</h5>
                                            <p className="text-xs text-amber-700/80">
                                                This group requires a non-refundable entry fee of <span className="font-bold">${selectedGroup.entry_fee_amount}</span>. After submitting your application, you will be redirected to checkout to complete the payment.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex justify-end gap-3 pt-6 border-t border-theme">
                                    <Button variant="outline" type="button" onClick={() => {
                                        setRequestModalOpen(false);
                                        setRequestNotes('');
                                        setApplicationAnswers({});
                                    }} className="px-6 rounded-xl">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit" className="px-6 rounded-xl shadow-lg shadow-primary-500/30">
                                        Submit Application
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

export default GroupJoinDiscourse;
