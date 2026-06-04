import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, Lock, Unlock, TrendingUp, Plus, Users, Calendar,
    ArrowLeft, PiggyBank, X, User, Search,
    GitMerge, DollarSign, ChevronRight
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/dateFormatter';
import { renderContentWithEmojis } from '../../utils/emoji';

const PiggyBanks = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [discoverData, setDiscoverData] = useState([]);
    const [discoverLoading, setDiscoverLoading] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        name: '', description: '', target_amount: '', maturity_date: '',
        locking_status: 'unlocked', piggy_type: 'individual',
        payment_group: null, savings_type: 'normal', contribution_mode: 'equal',
    });
    const [contributionAmount, setContributionAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const isInactive = (piggy) => piggy.status === 'inactive';

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (activeTab === 'discover' && discoverData.length === 0 && !discoverLoading) {
            setDiscoverLoading(true);
            paymentsService.getDiscoverPiggyBanks()
                .then(data => setDiscoverData(Array.isArray(data) ? data : (data.results || [])))
                .catch(() => toast.error('Failed to load discoverable piggy banks'))
                .finally(() => setDiscoverLoading(false));
        }
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [piggyData, groupsData] = await Promise.all([
                paymentsService.getPiggyBanks().catch(() => []),
                paymentsService.getMyGroups().catch(() => [])
            ]);
            setPiggyBanks(Array.isArray(piggyData) ? piggyData : (piggyData.results || []));
            setGroups(Array.isArray(groupsData) ? groupsData : (groupsData.results || []));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally { setLoading(false); }
    };

    const filteredPiggyBanks = piggyBanks.filter(piggy => {
        const matchesSearch = piggy.name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'archive') return matchesSearch && piggy.status === 'inactive';
        if (isInactive(piggy)) return false;
        if (activeTab === 'individual') return matchesSearch && !piggy.payment_group;
        if (activeTab === 'group') return matchesSearch && piggy.payment_group;
        if (activeTab === 'locked') return matchesSearch && piggy.locking_status === 'locked';
        return matchesSearch;
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (createStep === 1) { setCreateStep(2); return; }
        setCreateLoading(true);
        try {
            const payload = {
                name: formData.name, description: formData.description,
                target_amount: parseFloat(formData.target_amount) || 0,
                maturity_date: formData.maturity_date || null,
                locking_status: formData.locking_status,
                savings_type: formData.savings_type,
                contribution_mode: formData.piggy_type === 'group' ? formData.contribution_mode : 'equal',
            };
            if (formData.piggy_type === 'group' && formData.payment_group) {
                payload.payment_group = formData.payment_group;
            }
            await paymentsService.createPiggyBank(payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create piggy bank:', error);
            toast.error('Failed to create piggy bank. Please try again.');
        } finally { setCreateLoading(false); }
    };

    const handleContribute = (e) => {
        e.preventDefault();
        if (!showContributeModal || !contributionAmount) return;
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: showContributeModal.id,
                    type: 'piggy_bank_contribution',
                    name: `Contribution to ${showContributeModal.name}`,
                    price: parseFloat(contributionAmount), qty: 1, image: null,
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(contributionAmount)
            }
        });
    };

    const handleJoinFromDiscover = async (piggy, e) => {
        e.stopPropagation();
        try {
            await paymentsService.joinPiggyBank(piggy.id);
            toast.success(`Joined "${piggy.name}"`);
            setDiscoverData(prev => prev.filter(p => p.id !== piggy.id));
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to join piggy bank');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', target_amount: '', maturity_date: '',
            locking_status: 'unlocked', piggy_type: 'individual',
            payment_group: null, savings_type: 'normal', contribution_mode: 'equal',
        });
        setCreateStep(1);
    };

    const getProgress = (p) => {
        if (!p.target_amount || p.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(p.current_amount || 0) / parseFloat(p.target_amount)) * 100);
    };

    const totalSaved = piggyBanks.reduce((sum, p) => sum + parseFloat(p.current_amount || 0), 0);
    const totalTarget = piggyBanks.reduce((sum, p) => sum + parseFloat(p.target_amount || 0), 0);
    const lockedAmount = piggyBanks.filter(p => p.locking_status === 'locked').reduce((sum, p) => sum + parseFloat(p.current_amount || 0), 0);
    const unlockedAmount = totalSaved - lockedAmount;

    const tabs = [
        { id: 'all', label: 'All Piggy Banks' },
        { id: 'individual', label: 'Personal' },
        { id: 'group', label: 'Group' },
        { id: 'locked', label: 'Locked' },
        { id: 'archive', label: 'Archive' },
        { id: 'discover', label: 'Discover' },
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
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Piggy Banks</h1>
                        <p className="text-secondary mt-0.5 text-sm">Manage your savings goals & funds</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/payments/piggy-banks/merge-requests')} className="text-sm">
                        <GitMerge className="w-4 h-4 mr-1.5" /> Merge Requests
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/payments/piggy-banks/merge')} className="text-sm">
                        <GitMerge className="w-4 h-4 mr-1.5" /> Merge
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/payments/piggy-banks/create')} className="text-sm">
                        <Plus className="w-4 h-4 mr-1.5" /> New Piggy Bank
                    </Button>
                </div>
            </div>

            {/* ─── General Piggy Bank Overview ─── */}
            <div className="bg-elevated border border-theme rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    {/* Master Balance */}
                    <div className="flex-1 flex items-center gap-5">
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md">
                            <PiggyBank className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-widest">Piggy Bank Balance</p>
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-primary mt-1">
                                ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h2>
                            <p className="text-xs text-secondary mt-1">
                                across <strong className="text-primary">{piggyBanks.length}</strong> piggy banks &middot; target <strong className="text-primary">${totalTarget.toLocaleString()}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Split indicators */}
                    <div className="grid grid-cols-2 gap-4 lg:w-[340px]">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Unlock className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-bold text-green-800 uppercase">Available</span>
                            </div>
                            <p className="text-xl font-bold text-green-700">${unlockedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Lock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-800 uppercase">Locked</span>
                            </div>
                            <p className="text-xl font-bold text-amber-700">${lockedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Filters ─── */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input
                        type="text" placeholder="Search piggy banks..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex p-1 bg-secondary/5 rounded-xl border border-theme">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Discover Tab ─── */}
            {activeTab === 'discover' ? (
                discoverLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => <div key={i} className="h-44 bg-secondary/5 rounded-2xl animate-pulse" />)}
                    </div>
                ) : discoverData.length === 0 ? (
                    <div className="bg-elevated border border-theme rounded-2xl text-center py-16">
                        <Users className="w-10 h-10 text-tertiary mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-primary mb-1">No public piggy banks found</h3>
                        <p className="text-secondary text-sm mb-5 max-w-xs mx-auto">
                            Public piggy banks created by other users will appear here for you to discover and join.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {discoverData.map(piggy => {
                            const progress = getProgress(piggy);
                            const isAchieved = progress >= 100;
                            return (
                                <div
                                    key={piggy.id}
                                    onClick={() => navigate(`/payments/piggy-banks/${piggy.id}`)}
                                    className="bg-elevated border border-theme rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-pink-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                                <PiggyBank className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-primary text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">{renderContentWithEmojis(piggy.name)}</h3>
                                                <p className="text-xs text-secondary line-clamp-1 mt-0.5">{renderContentWithEmojis(piggy.description || 'No description')}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {piggy.payment_group && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                                <Users className="w-3 h-3" /> Group
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                            <Users className="w-3 h-3" /> {piggy.member_count || 0} member{(piggy.member_count || 0) !== 1 ? 's' : ''}
                                        </span>
                                        {piggy.locking_status === 'locked' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                <Lock className="w-3 h-3" /> Locked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                <Unlock className="w-3 h-3" /> Flexible
                                            </span>
                                        )}
                                        {piggy.visibility === 'public' && (
                                            <span className="inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                                                Public
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-lg font-bold text-primary">${parseFloat(piggy.current_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="text-xs text-secondary">of ${parseFloat(piggy.target_amount || 0).toLocaleString()}</span>
                                    </div>

                                    <div className="h-2 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full transition-all duration-700 ${
                                            isAchieved ? 'bg-green-500' : 'bg-purple-500'
                                        }`} style={{ width: `${Math.min(100, progress)}%` }} />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-secondary">
                                            {piggy.maturity_date ? formatDate(piggy.maturity_date) : 'No deadline'}
                                        </span>
                                        <button
                                            onClick={(e) => handleJoinFromDiscover(piggy, e)}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-secondary/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredPiggyBanks.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-2xl text-center py-16">
                    <PiggyBank className="w-10 h-10 text-tertiary mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-primary mb-1">
                        {activeTab === 'archive' ? 'No archived piggy banks' : (searchTerm ? 'No piggy banks found' : 'No piggy banks yet')}
                    </h3>
                    <p className="text-secondary text-sm mb-5 max-w-xs mx-auto">
                        {activeTab === 'archive'
                            ? 'Piggy banks that have been merged or dissolved will appear here.'
                            : (searchTerm ? 'Try a different search term' : 'Start saving by creating your first piggy bank')
                        }
                    </p>
                    {!searchTerm && activeTab !== 'archive' && activeTab !== 'discover' && (
                        <Button variant="primary" onClick={() => navigate('/payments/piggy-banks/create')} className="text-sm">
                            <Plus className="w-4 h-4 mr-1.5" /> Create Piggy Bank
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPiggyBanks.map(piggy => {
                        const progress = getProgress(piggy);
                        const isAchieved = progress >= 100;
                        return (
                            <div
                                key={piggy.id}
                                onClick={() => navigate(`/payments/piggy-banks/${piggy.id}`)}
                                className="bg-elevated border border-theme rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-pink-200 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            isAchieved ? 'bg-green-100' : 'bg-pink-50'
                                        }`}>
                                            <PiggyBank className={`w-5 h-5 ${isAchieved ? 'text-green-600' : 'text-pink-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-primary text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">{renderContentWithEmojis(piggy.name)}</h3>
                                            <p className="text-xs text-secondary line-clamp-1 mt-0.5">{renderContentWithEmojis(piggy.description || 'No description')}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {isInactive(piggy) ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                            Inactive
                                        </span>
                                    ) : (
                                        <>
                                            {piggy.payment_group && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    <Users className="w-3 h-3" /> Group
                                                </span>
                                            )}
                                            {piggy.locking_status === 'locked' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                    <Lock className="w-3 h-3" /> Locked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                    <Unlock className="w-3 h-3" /> Flexible
                                                </span>
                                            )}
                                            {piggy.savings_type === 'fixed_deposit' && (
                                                <span className="inline-flex items-center text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                                                    Fixed Deposit
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-lg font-bold text-primary">${parseFloat(piggy.current_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className="text-xs text-secondary">of ${parseFloat(piggy.target_amount || 0).toLocaleString()}</span>
                                </div>

                                {/* Progress */}
                                <div className="h-2 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full transition-all duration-700 ${
                                        isAchieved ? 'bg-green-500' : 'bg-emerald-500'
                                    }`} style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-secondary">
                                        {isInactive(piggy) ? 'Dissolved' : (piggy.maturity_date ? formatDate(piggy.maturity_date) : 'No deadline')}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowContributeModal(piggy); }}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                            isInactive(piggy)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : isAchieved 
                                                    ? 'bg-green-50 text-green-700 cursor-default'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                        disabled={isAchieved || isInactive(piggy)}
                                    >
                                        {isInactive(piggy) ? 'Dissolved' : (isAchieved ? '✓ Goal Met' : 'Contribute')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}



            {/* ─── Contribute Modal ─── */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">Contribute to {showContributeModal.name}</h3>
                                <button onClick={() => setShowContributeModal(null)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleContribute} className="space-y-4">
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-emerald-800">Current Balance</span>
                                        <span className="font-bold text-emerald-900">${parseFloat(showContributeModal.current_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-800">Target</span>
                                        <span className="font-bold text-emerald-900">${parseFloat(showContributeModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-tertiary" />
                                    </div>
                                    <input type="number" min="0.01" step="0.01" required value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00"
                                        className="block w-full pl-10 pr-4 py-3 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-emerald-500 text-xl font-bold text-center"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowContributeModal(null)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={!contributionAmount}>Proceed to Checkout</Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}


        </div>
    );
};

export default PiggyBanks;
