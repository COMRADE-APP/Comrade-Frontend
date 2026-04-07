import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { 
    Briefcase, Search, Plus, Calendar, Users, CheckCircle, 
    ArrowLeft, PieChart, X, TrendingUp, DollarSign, Target
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

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        maturity_date: '',
        payment_group: '',
        quoting_mode: 'proportional', // fixed, proportional, individual
        opportunity_id: '',
    });
    const [quoteAmount, setQuoteAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [investmentsData, groupsData, opsData] = await Promise.all([
                paymentsService.getGroupInvestments().catch(() => []),
                paymentsService.getMyGroups().catch(() => []),
                fundingService.getOpportunities({ status: 'active' }).catch(() => [])
            ]);
            setInvestments(Array.isArray(investmentsData) ? investmentsData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
            setOpportunities(opsData?.results || (Array.isArray(opsData) ? opsData : []));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvestments = investments.filter(inv => {
        const matchesSearch = inv.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const isMyPitch = inv.initiator_name === `${user?.first_name} ${user?.last_name}` || inv.initiated_by === user?.id;
        
        if (!matchesSearch) return false;
        
        switch (activeTab) {
            case 'active':
                return inv.status === 'active';
            case 'completed':
                return inv.status === 'completed';
            case 'my_pitches':
                return isMyPitch;
            case 'for_you':
            default:
                return true;
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            target_amount: '',
            maturity_date: '',
            payment_group: '',
            quoting_mode: 'proportional',
            opportunity_id: '',
        });
        setCreateStep(1);
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (createStep === 1) {
            setCreateStep(2);
            return;
        }

        setCreateLoading(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                target_amount: parseFloat(formData.target_amount) || 0,
                maturity_date: formData.maturity_date || null,
                payment_group: formData.payment_group,
                quoting_mode: formData.quoting_mode,
                ...(formData.opportunity_id ? { investment_opportunity: formData.opportunity_id } : {})
            };

            await paymentsService.createGroupInvestment(payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create investment:', error);
            alert('Failed to construct investment. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleQuote = async (e) => {
        e.preventDefault();
        if (!showQuoteModal || !quoteAmount) return;

        navigate('/checkout', {
            state: {
                cartItems: [{
                    id: showQuoteModal.id,
                    type: 'investment_quote',
                    name: `Investment in ${showQuoteModal.name}`,
                    price: parseFloat(quoteAmount),
                    qty: 1,
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(quoteAmount)
            }
        });
    };

    const getProgress = (inv) => {
        if (!inv.target_amount || inv.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(inv.amount_collected || 0) / parseFloat(inv.target_amount)) * 100);
    };

    const totalTarget = investments.reduce((sum, i) => sum + parseFloat(i.target_amount || 0), 0);
    const totalCollected = investments.reduce((sum, i) => sum + parseFloat(i.amount_collected || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/payments')}
                        className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Group Investments</h1>
                        <p className="text-secondary mt-1">Pool resources and own shares proportionally</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Investment Pitch
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-xs mb-1">Total Pledged Capital</p>
                                <h2 className="text-2xl font-bold">${totalCollected.toFixed(2)}</h2>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-xs mb-1">Target Capital</p>
                                <h2 className="text-2xl font-bold text-primary">${totalTarget.toFixed(2)}</h2>
                            </div>
                            <div className="bg-blue-500/10 p-2 rounded-full">
                                <Target className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-xs mb-1">Active Investments</p>
                                <h2 className="text-2xl font-bold text-primary">{investments.filter(i => i.status === 'active').length}</h2>
                            </div>
                            <div className="bg-primary-600/10 p-2 rounded-full">
                                <Briefcase className="w-5 h-5 text-primary-700" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-theme overflow-x-auto hidescrollbar">
                {['for_you', 'active', 'completed', 'my_pitches', 'opportunities'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                            activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-primary'
                        }`}
                    >
                        {tab === 'for_you' ? 'For You' : 
                         tab === 'my_pitches' ? 'My Pitches' :
                         tab === 'opportunities' ? 'Opportunities' :
                         tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search investments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            {/* Grid - Investments */}
            {activeTab !== 'opportunities' && (
                <>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(i => <div key={i} className="h-48 bg-secondary/10 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : filteredInvestments.length === 0 ? (
                        <Card>
                            <CardBody className="text-center py-12">
                                <Briefcase className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-primary mb-2">
                                    {searchTerm ? 'No investments found' : 'No investments yet'}
                                </h3>
                                <p className="text-secondary mb-6">
                                    {searchTerm
                                        ? 'Try a different search term'
                                        : 'Pitch an investment opportunity to your payment group'
                                    }
                                </p>
                                {!searchTerm && (
                                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Pitch
                                    </Button>
                                )}
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredInvestments.map(inv => (
                                <Card key={inv.id} className="group hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                    <CardBody className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-3">
                                                <div className="p-3 rounded-xl bg-teal-500/10">
                                                    <Briefcase className="w-6 h-6 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-primary break-words line-clamp-2">{inv.name}</h3>
                                                    <p className="text-sm text-secondary line-clamp-1">{inv.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                <Users className="w-3 h-3 mr-1" />
                                                {inv.payment_group_name || 'Group'}
                                            </div>
                                            <div className="flex items-center text-xs font-medium text-primary-700 bg-primary-150 px-2 py-1 rounded-full capitalize">
                                                <PieChart className="w-3 h-3 mr-1" />
                                                {inv.quoting_mode}
                                            </div>
                                            {inv.opportunity_category && (
                                                <div className="flex items-center text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full capitalize">
                                                    <Target className="w-3 h-3 mr-1" />
                                                    {inv.opportunity_category}
                                                </div>
                                            )}
                                            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full capitalize ${
                                                inv.status === 'completed' ? 'text-green-600 bg-green-50' :
                                                inv.status === 'active' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-50'
                                            }`}>
                                                Status: {inv.status}
                                            </div>
                                        </div>

                                        {/* Quotes (Ownership Preview) */}
                                        {inv.quotes && inv.quotes.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Top Contributors</p>
                                                <div className="flex -space-x-2">
                                                    {inv.quotes.slice(0, 5).map((q, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="w-8 h-8 rounded-full bg-primary text-white flex justify-center items-center text-xs font-bold ring-2 ring-white"
                                                            title={`${q.member_name}: $${parseFloat(q.amount_quoted).toFixed(2)} (${parseFloat(q.ownership_percentage).toFixed(1)}%)`}
                                                        >
                                                            {q.member_name?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                    ))}
                                                    {inv.quotes.length > 5 && (
                                                        <div className="w-8 h-8 rounded-full bg-secondary text-white flex justify-center items-center text-xs font-bold ring-2 ring-white">
                                                            +{inv.quotes.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="space-y-2 mt-auto">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-primary">${parseFloat(inv.amount_collected || 0).toFixed(2)} raised</span>
                                                <span className="text-secondary">${parseFloat(inv.target_amount || 0).toFixed(2)} target</span>
                                            </div>
                                            <div className="h-3 bg-secondary/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-500"
                                                    style={{ width: `${Math.min(100, getProgress(inv))}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-secondary pt-1">
                                                <span>{getProgress(inv).toFixed(1)}% funded</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {inv.maturity_date ? formatDate(inv.maturity_date) : 'No deadline'}
                                                </span>
                                            </div>
                                        </div>

                                        {inv.status === 'active' && (
                                            <div className="pt-4 mt-4 border-t border-theme flex gap-2">
                                                <Button 
                                                    variant="primary" 
                                                    className="w-full"
                                                    onClick={() => setShowQuoteModal(inv)}
                                                >
                                                    Quote Share
                                                </Button>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Opportunities Tab Content */}
            {activeTab === 'opportunities' && (
                <div className="space-y-3">
                    <p className="text-secondary text-sm">Browse available non-donation opportunities across all asset classes.</p>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/10 rounded-xl animate-pulse" />)}
                        </div>
                    ) : opportunities.length === 0 ? (
                        <Card>
                            <CardBody className="text-center py-12">
                                <TrendingUp className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-primary mb-2">No opportunities yet</h3>
                                <p className="text-secondary mb-4">Explore the funding hub for investment opportunities.</p>
                                <Button variant="primary" onClick={() => navigate('/funding/opportunities')}>
                                    Explore Opportunities
                                </Button>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="bg-elevated rounded-2xl border border-theme divide-y divide-theme overflow-hidden">
                            {opportunities
                                .filter(op => {
                                    const type = (op.type || op.category || '').toLowerCase();
                                    const matchesSearch = !searchTerm || 
                                        (op.title || op.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (op.provider || '').toLowerCase().includes(searchTerm.toLowerCase());
                                    return type !== 'charity' && type !== 'donation' && matchesSearch;
                                })
                                .map(op => {
                                    const catType = (op.type || op.category || 'general').toLowerCase();
                                    const BADGE_COLORS = {
                                        mmf: 'bg-blue-100 text-blue-700',
                                        stock: 'bg-green-100 text-green-700',
                                        stocks: 'bg-green-100 text-green-700',
                                        bond_domestic: 'bg-amber-100 text-amber-700',
                                        bonds_domestic: 'bg-amber-100 text-amber-700',
                                        bond_foreign: 'bg-primary-100 text-primary-700',
                                        bonds_foreign: 'bg-primary-100 text-primary-700',
                                        agency: 'bg-slate-100 text-slate-700',
                                    };
                                    const badgeClass = BADGE_COLORS[catType] || 'bg-primary-100 text-primary-700';

                                    return (
                                        <div
                                            key={op.id}
                                            className="flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/funding/opportunity/${op.id}`)}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-primary text-sm truncate">{op.title || op.name}</h4>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 capitalize ${badgeClass}`}>
                                                            {catType.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-secondary truncate mt-0.5">
                                                        {op.provider || op.description?.substring(0, 60) || ''}
                                                        {op.expected_return && ` · Return: ${op.expected_return}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {op.min_investment && (
                                                    <span className="text-sm font-bold text-primary hidden sm:block">
                                                        KES {parseFloat(op.min_investment).toLocaleString()}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({ ...prev, opportunity_id: op.id.toString(), name: op.title || op.name }));
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Pitch to Group
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">
                                    {createStep === 1 ? 'Investment Details' : 'Quoting Options'}
                                </h2>
                                <button
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="p-1 hover:bg-secondary/10 rounded"
                                >
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {createStep === 1 && (
                                    <>
                                        <Input
                                            label="Investment Name *"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Downtown Real Estate"
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Pitch the investment opportunity details..."
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Linked Opportunity (Optional)</label>
                                            <select
                                                value={formData.opportunity_id}
                                                onChange={(e) => setFormData({ ...formData, opportunity_id: e.target.value })}
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            >
                                                <option value="">No linked opportunity</option>
                                                {opportunities.map(op => (
                                                    <option key={op.id} value={op.id}>{op.title || op.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <Input
                                            label="Target Capital Required *"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                            required
                                            placeholder="e.g., 50000.00"
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Payment Group *</label>
                                            <select
                                                value={formData.payment_group}
                                                onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            >
                                                <option value="">Select the group backing this...</option>
                                                {groups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {createStep === 2 && (
                                    <>
                                        <Input
                                            label="Fundraising Deadline"
                                            type="date"
                                            value={formData.maturity_date}
                                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Quoting Mode</label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                    <input type="radio" name="quoting_mode" value="proportional" checked={formData.quoting_mode === 'proportional'} onChange={(e) => setFormData({ ...formData, quoting_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-primary text-sm">Proportional Ownership</p>
                                                        <p className="text-xs text-secondary mt-0.5">Members own a percentage strictly based on how much they quote</p>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                    <input type="radio" name="quoting_mode" value="fixed" checked={formData.quoting_mode === 'fixed'} onChange={(e) => setFormData({ ...formData, quoting_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-primary text-sm">Fixed/Equal Splits</p>
                                                        <p className="text-xs text-secondary mt-0.5">Capital is drawn equally and ownership is split equally</p>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                    <input type="radio" name="quoting_mode" value="individual" checked={formData.quoting_mode === 'individual'} onChange={(e) => setFormData({ ...formData, quoting_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-primary text-sm">Individual Returns</p>
                                                        <p className="text-xs text-secondary mt-0.5">Profits are tracked independently relative to their quote amount</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 pt-4">
                                    {createStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setCreateStep(createStep - 1)}
                                        >
                                            Back
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={createLoading || (createStep === 1 && (!formData.name || !formData.target_amount || !formData.payment_group))}
                                    >
                                        {createLoading ? 'Drafting...' : createStep === 1 ? 'Next Step' : 'Publish Investment'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary">Quote Share</h3>
                                <button onClick={() => setShowQuoteModal(null)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleQuote} className="space-y-4">
                                <div className="p-4 bg-teal-50 rounded-lg">
                                    <h4 className="font-bold text-teal-900 mb-2">{showQuoteModal.name}</h4>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-teal-700">Target Capital</span>
                                        <span className="font-medium text-teal-900">${parseFloat(showQuoteModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-teal-700">Capital Pledged</span>
                                        <span className="font-medium text-teal-900">${parseFloat(showQuoteModal.amount_collected || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <Input
                                    label="Amount to Pitch In"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={quoteAmount}
                                    onChange={(e) => setQuoteAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                {quoteAmount && showQuoteModal.target_amount > 0 && showQuoteModal.quoting_mode === 'proportional' && (
                                    <div className="text-sm text-secondary bg-elevated border border-theme p-3 rounded-lg text-center">
                                        You are quoting for approximately <strong className="text-primary">{((parseFloat(quoteAmount) / parseFloat(showQuoteModal.target_amount)) * 100).toFixed(1)}%</strong> of this investment.
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowQuoteModal(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={!quoteAmount}>
                                        Commit Capital
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
