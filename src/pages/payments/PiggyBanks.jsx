import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, Lock, Unlock, TrendingUp, Plus, Users, Calendar,
    ArrowLeft, PiggyBank, X, CheckCircle, User, Search,
    ArrowRightLeft, DollarSign, Wallet, ChevronRight
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const PiggyBanks = () => {
    const navigate = useNavigate();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [createStep, setCreateStep] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        name: '', description: '', target_amount: '', maturity_date: '',
        locking_status: 'unlocked', piggy_type: 'individual',
        payment_group: null, savings_type: 'normal', contribution_mode: 'equal',
    });
    const [contributionAmount, setContributionAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Transfer state
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

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
            alert('Failed to create piggy bank. Please try again.');
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

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) return;
        setTransferLoading(true);
        try {
            await paymentsService.withdrawFromPiggyBank(transferFrom, parseFloat(transferAmount));
            await paymentsService.contributeToPiggyBank(transferTo, parseFloat(transferAmount));
            setShowTransferModal(false);
            setTransferFrom(''); setTransferTo(''); setTransferAmount('');
            loadData();
            alert('Transfer successful!');
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('Transfer failed. Check balances and locking status.');
        } finally { setTransferLoading(false); }
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
                    <Button variant="outline" onClick={() => setShowTransferModal(true)} className="text-sm">
                        <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Transfer
                    </Button>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
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

            {/* ─── Piggy Bank Cards ─── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-secondary/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredPiggyBanks.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-2xl text-center py-16">
                    <PiggyBank className="w-10 h-10 text-tertiary mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-primary mb-1">
                        {searchTerm ? 'No piggy banks found' : 'No piggy banks yet'}
                    </h3>
                    <p className="text-secondary text-sm mb-5 max-w-xs mx-auto">
                        {searchTerm ? 'Try a different search term' : 'Start saving by creating your first piggy bank'}
                    </p>
                    {!searchTerm && (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
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
                                            <h3 className="font-semibold text-primary text-sm group-hover:text-blue-700 transition-colors line-clamp-1">{piggy.name}</h3>
                                            <p className="text-xs text-secondary line-clamp-1 mt-0.5">{piggy.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {piggy.payment_group && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
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
                                </div>

                                {/* Amount */}
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-lg font-bold text-primary">${parseFloat(piggy.current_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className="text-xs text-secondary">of ${parseFloat(piggy.target_amount || 0).toLocaleString()}</span>
                                </div>

                                {/* Progress */}
                                <div className="h-2 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full transition-all duration-700 ${
                                        isAchieved ? 'bg-green-500' : 'bg-blue-500'
                                    }`} style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-secondary">
                                        {piggy.maturity_date ? formatDate(piggy.maturity_date) : 'No deadline'}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowContributeModal(piggy); }}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                            isAchieved 
                                                ? 'bg-green-50 text-green-700 cursor-default'
                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                        disabled={isAchieved}
                                    >
                                        {isAchieved ? '✓ Goal Met' : 'Contribute'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Create Modal ─── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">
                                    {createStep === 1 ? 'Create Kitty' : 'Configure Target'}
                                </h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-5">
                                {[1, 2].map(s => (
                                    <React.Fragment key={s}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            s < createStep ? 'bg-green-500 text-white' : s === createStep ? 'bg-blue-600 text-white' : 'bg-secondary/10 text-secondary'
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
                                        <Input label="Kitty Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Vacation Fund"
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2} placeholder="What are you saving for?"
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setFormData({ ...formData, piggy_type: 'individual', payment_group: null })}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                                        formData.piggy_type === 'individual' ? 'border-blue-500 bg-blue-50' : 'border-theme hover:border-blue-200'
                                                    }`}>
                                                    <User className={`w-5 h-5 mx-auto mb-1 ${formData.piggy_type === 'individual' ? 'text-blue-600' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-xs text-primary">Personal</p>
                                                </button>
                                                <button type="button" onClick={() => setFormData({ ...formData, piggy_type: 'group' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                                        formData.piggy_type === 'group' ? 'border-blue-500 bg-blue-50' : 'border-theme hover:border-blue-200'
                                                    }`}>
                                                    <Users className={`w-5 h-5 mx-auto mb-1 ${formData.piggy_type === 'group' ? 'text-blue-600' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-xs text-primary">Group</p>
                                                </button>
                                            </div>
                                        </div>
                                        {formData.piggy_type === 'group' && (
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1">Link to Group *</label>
                                                <select value={formData.payment_group || ''} required={formData.piggy_type === 'group'}
                                                    onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                                    <option value="">Choose a group...</option>
                                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </select>
                                                {groups.length === 0 && (
                                                    <p className="text-xs text-secondary mt-1">
                                                        No groups. <button type="button" onClick={() => navigate('/payments/create-group')} className="text-blue-600 underline">Create one first</button>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {createStep === 2 && (
                                    <>
                                        <Input label="Target Amount *" type="number" min="1" step="0.01"
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                            required placeholder="e.g., 1000.00"
                                        />
                                        <Input label="Target Date" type="date" value={formData.maturity_date}
                                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Savings Type</label>
                                            <div className="space-y-2">
                                                {[
                                                    { value: 'normal', title: 'Standard', desc: 'Flexible deposits & withdrawals' },
                                                    { value: 'locked', title: 'Locked Savings', desc: 'Save strictly until maturity' },
                                                    { value: 'fixed_deposit', title: 'Fixed Deposit', desc: 'Earn interest. 2% penalty for early withdrawal' },
                                                ].map(opt => (
                                                    <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                                                        <input type="radio" name="savings_type" value={opt.value}
                                                            checked={formData.savings_type === opt.value}
                                                            onChange={(e) => setFormData({ ...formData, savings_type: e.target.value, locking_status: e.target.value !== 'normal' ? 'locked' : formData.locking_status })}
                                                            className="text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-sm text-primary">{opt.title}</p>
                                                            <p className="text-xs text-secondary">{opt.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {formData.piggy_type === 'group' && (
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1">Contribution Mode</label>
                                                <div className="flex gap-3">
                                                    {['equal', 'proportional'].map(m => (
                                                        <button key={m} type="button" onClick={() => setFormData({ ...formData, contribution_mode: m })}
                                                            className={`flex-1 p-2.5 rounded-lg border-2 text-center text-xs font-medium capitalize ${
                                                                formData.contribution_mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-theme text-secondary'
                                                            }`}>
                                                            {m === 'equal' ? 'Equal Split' : 'Custom Proportions'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="flex gap-2 pt-3">
                                    {createStep > 1 && (
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateStep(createStep - 1)}>Back</Button>
                                    )}
                                    <Button type="button" variant="outline" className={createStep === 1 ? "flex-1" : ""} onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1"
                                        disabled={createLoading || (createStep === 1 && !formData.name) || (createStep === 1 && formData.piggy_type === 'group' && !formData.payment_group)}>
                                        {createLoading ? 'Creating...' : createStep === 1 ? 'Next' : 'Create Kitty'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
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
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-blue-800">Current Balance</span>
                                        <span className="font-bold text-blue-900">${parseFloat(showContributeModal.current_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-800">Target</span>
                                        <span className="font-bold text-blue-900">${parseFloat(showContributeModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-tertiary" />
                                    </div>
                                    <input type="number" min="0.01" step="0.01" required value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00"
                                        className="block w-full pl-10 pr-4 py-3 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-blue-500 text-xl font-bold text-center"
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

            {/* ─── Transfer Modal ─── */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <ArrowRightLeft className="w-5 h-5 text-blue-600" /> Transfer Between Kitties
                                </h3>
                                <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">From Kitty</label>
                                    <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} required
                                        className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select source kitty</option>
                                        {piggyBanks.filter(p => p.locking_status !== 'locked').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.current_amount || 0).toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">To Kitty</label>
                                    <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} required
                                        className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select destination kitty</option>
                                        {piggyBanks.filter(p => p.id !== parseInt(transferFrom)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-tertiary" />
                                    </div>
                                    <input type="number" min="0.01" step="0.01" required value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount to transfer"
                                        className="block w-full pl-10 pr-4 py-3 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-blue-500 text-lg font-bold text-center"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={transferLoading || !transferFrom || !transferTo || !transferAmount}>
                                        {transferLoading ? 'Transferring...' : 'Transfer'}
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

export default PiggyBanks;
