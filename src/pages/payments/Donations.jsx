import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Heart, Search, Plus, Calendar, User, Users, CheckCircle,
    ArrowLeft, X, TrendingUp, DollarSign, ChevronRight, Globe, Eye, Building2
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const CATEGORIES = [
    { value: 'education', label: 'Education', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { value: 'health', label: 'Health', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { value: 'environment', label: 'Environment', color: 'bg-green-50 text-green-700 border-green-100' },
    { value: 'community', label: 'Community', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-50 text-red-700 border-red-100' },
    { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-700 border-gray-100' },
];

const getCategoryStyle = (cat) => CATEGORIES.find(c => c.value === cat)?.color || 'bg-gray-50 text-gray-700 border-gray-100';

const Donations = () => {
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('for_you');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '', description: '', category: 'other', goal_amount: '',
        deadline: '', donation_type: 'individual', payment_group: null,
        group_mode: 'independent', visibility: 'external',
        cover_image: null,
        organization_name: '', organization_type: '', organization_address: '', organization_reg_number: '',
    });
    const [contributionAmount, setContributionAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [donationsData, groupsData] = await Promise.all([
                paymentsService.getDonations().catch(() => []),
                paymentsService.getMyGroups().catch(() => [])
            ]);
            setDonations(Array.isArray(donationsData) ? donationsData : (donationsData.results || []));
            setGroups(Array.isArray(groupsData) ? groupsData : (groupsData.results || []));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally { setLoading(false); }
    };

    const myGroupIds = groups.map(g => g.id);

    const filteredDonations = donations.filter(donation => {
        const matchesSearch = donation.name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (categoryFilter !== 'all' && donation.category !== categoryFilter) return false;
        if (activeTab === 'for_you') {
            if (donation.visibility === 'internal') {
                return donation.payment_group && myGroupIds.includes(donation.payment_group?.id || donation.payment_group);
            }
            return true;
        }
        if (activeTab === 'public') return donation.visibility !== 'internal';
        if (activeTab === 'my_group') return donation.payment_group && myGroupIds.includes(donation.payment_group?.id || donation.payment_group);
        if (activeTab === 'my_campaigns') return true;
        return true;
    });

    const resetForm = () => {
        setFormData({
            name: '', description: '', category: 'other', goal_amount: '',
            deadline: '', donation_type: 'individual', payment_group: null,
            group_mode: 'independent', visibility: 'external',
            cover_image: null,
            organization_name: '', organization_type: '', organization_address: '', organization_reg_number: '',
        });
        setCreateStep(1);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (createStep === 1) { setCreateStep(2); return; }
        if (createStep === 2) { setCreateStep(3); return; }

        setCreateLoading(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('description', formData.description);
            payload.append('category', formData.category || 'other');
            payload.append('goal_amount', parseFloat(formData.goal_amount) || 0);
            if (formData.deadline) {
                payload.append('deadline', new Date(formData.deadline).toISOString());
            }
            payload.append('visibility', formData.visibility);
            payload.append('donor_type', formData.donation_type === 'group' ? 'group' : 'individual');

            if (formData.donation_type === 'group' && formData.payment_group) {
                payload.append('payment_group', formData.payment_group);
                payload.append('group_mode', formData.group_mode);
            }
            if (formData.cover_image) {
                payload.append('cover_image', formData.cover_image);
            }
            if (formData.organization_name) {
                const orgDetails = {
                    name: formData.organization_name,
                    type: formData.organization_type || 'hospital',
                    address: formData.organization_address || '',
                    registration_number: formData.organization_reg_number || '',
                };
                payload.append('organization_details', JSON.stringify(orgDetails));
            }

            await paymentsService.createDonation(payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create donation:', error);
            alert('Failed to create donation campaign.');
        } finally { setCreateLoading(false); }
    };

    const handleContribute = (e) => {
        e.preventDefault();
        if (!showContributeModal || !contributionAmount) return;
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: showContributeModal.id, type: 'donation',
                    name: `Donation: ${showContributeModal.name}`,
                    price: parseFloat(contributionAmount), qty: 1,
                    image: showContributeModal.cover_image_url || null,
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(contributionAmount)
            }
        });
    };

    const getProgress = (d) => {
        if (!d.goal_amount || d.goal_amount === 0) return 0;
        return Math.min(100, (parseFloat(d.amount_collected || d.current_amount || 0) / parseFloat(d.goal_amount || d.target_amount)) * 100);
    };

    const totalCollected = donations.reduce((sum, d) => sum + parseFloat(d.amount_collected || d.current_amount || 0), 0);
    const activeDonations = donations.filter(d => !d.is_completed).length;

    const tabs = [
        { id: 'for_you', label: 'For You' },
        { id: 'public', label: 'Public' },
        { id: 'my_group', label: 'My Groups' },
        { id: 'my_campaigns', label: 'My Campaigns' },
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
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Donations</h1>
                        <p className="text-secondary mt-0.5 text-sm">Support causes that matter</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
                    <Plus className="w-4 h-4 mr-1.5" /> New Campaign
                </Button>
            </div>

            {/* Impact Summary */}
            <div className="bg-elevated border border-theme rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-500 flex items-center justify-center shadow-md">
                            <Heart className="w-6 h-6 text-white" fill="white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-widest">Total Impact</p>
                            <h2 className="text-3xl font-extrabold text-primary mt-0.5">
                                ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{activeDonations}</p>
                            <p className="text-xs text-secondary font-medium">Active</p>
                        </div>
                        <div className="w-px bg-theme self-stretch"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{donations.length}</p>
                            <p className="text-xs text-secondary font-medium">Total</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <input type="text" placeholder="Search campaigns..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
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
                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                            categoryFilter === 'all' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-secondary/5 text-secondary border-theme hover:text-primary'
                        }`}>All Categories</button>
                    {CATEGORIES.map(cat => (
                        <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                                categoryFilter === cat.value ? cat.color : 'bg-secondary/5 text-secondary border-theme hover:text-primary'
                            }`}>{cat.label}</button>
                    ))}
                </div>
            </div>

            {/* Campaign Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => <div key={i} className="h-52 bg-secondary/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredDonations.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-2xl text-center py-16">
                    <Heart className="w-10 h-10 text-tertiary mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-primary mb-1">
                        {searchTerm ? 'No campaigns found' : 'No donations yet'}
                    </h3>
                    <p className="text-secondary text-sm mb-5 max-w-xs mx-auto">
                        {searchTerm ? 'Try a different search term' : 'Start a campaign to rally support for a cause'}
                    </p>
                    {!searchTerm && (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="text-sm">
                            <Plus className="w-4 h-4 mr-1.5" /> Start a Campaign
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDonations.map(donation => {
                        const progress = getProgress(donation);
                        const amount = parseFloat(donation.amount_collected || donation.current_amount || 0);
                        const goal = parseFloat(donation.goal_amount || donation.target_amount || 0);
                        return (
                            <div key={donation.id}
                                onClick={() => navigate(`/payments/donations/${donation.id}`)}
                                className="bg-elevated border border-theme rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-rose-200 transition-all group flex flex-col"
                            >
                                {/* Cover / Gradient */}
                                <div className="h-32 relative overflow-hidden">
                                    {donation.cover_image_url ? (
                                        <img src={donation.cover_image_url} alt={donation.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                                            <Heart className="w-12 h-12 text-white/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {donation.category && (
                                        <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryStyle(donation.category)}`}>
                                            {donation.category}
                                        </span>
                                    )}
                                    {donation.visibility === 'internal' && (
                                        <span className="absolute top-3 right-3 text-[10px] font-bold text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> Private
                                        </span>
                                    )}
                                    <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm line-clamp-2 drop-shadow">
                                        {donation.name}
                                    </h3>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex flex-col flex-1">
                                    {donation.payment_group && (
                                        <p className="text-[10px] font-semibold text-rose-600 mb-2 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> Group Campaign
                                        </p>
                                    )}

                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-base font-bold text-primary">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="text-xs text-secondary">${goal.toLocaleString()} goal</span>
                                    </div>

                                    <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, progress)}%` }} />
                                    </div>

                                    <div className="flex justify-between items-center mt-auto pt-2">
                                        <span className="text-xs text-secondary">
                                            {progress.toFixed(0)}% funded
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowContributeModal(donation); }}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                        >
                                            Donate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-primary">
                                    {createStep === 1 ? 'New Campaign' : 'Set Goals'}
                                </h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-5">
                                {[1, 2, 3].map(s => (
                                    <React.Fragment key={s}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            s < createStep ? 'bg-green-500 text-white' : s === createStep ? 'bg-rose-500 text-white' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                            {s < createStep ? <CheckCircle className="w-4 h-4" /> : s}
                                        </div>
                                        {s < 3 && <div className={`flex-1 h-0.5 ${s < createStep ? 'bg-green-500' : 'bg-secondary/10'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {createStep === 1 && (
                                    <>
                                        <Input label="Campaign Title *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., School Build Fund" />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3} placeholder="Describe the cause..."
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-rose-400 outline-none resize-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Category</label>
                                            <select value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-400">
                                                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Campaign Type</label>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setFormData({ ...formData, donation_type: 'individual', payment_group: null })}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                                        formData.donation_type === 'individual' ? 'border-rose-400 bg-rose-50' : 'border-theme hover:border-rose-200'
                                                    }`}>
                                                    <User className={`w-5 h-5 mx-auto mb-1 ${formData.donation_type === 'individual' ? 'text-rose-600' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-xs text-primary">Personal</p>
                                                </button>
                                                <button type="button" onClick={() => setFormData({ ...formData, donation_type: 'group' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                                        formData.donation_type === 'group' ? 'border-rose-400 bg-rose-50' : 'border-theme hover:border-rose-200'
                                                    }`}>
                                                    <Users className={`w-5 h-5 mx-auto mb-1 ${formData.donation_type === 'group' ? 'text-rose-600' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-xs text-primary">Group</p>
                                                </button>
                                            </div>
                                        </div>
                                        {formData.donation_type === 'group' && (
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1">Link to Group</label>
                                                <select value={formData.payment_group || ''} required
                                                    onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-400">
                                                    <option value="">Choose a group...</option>
                                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                {createStep === 2 && (
                                    <>
                                        <Input label="Fundraising Goal ($) *" type="number" min="1" step="0.01"
                                            value={formData.goal_amount}
                                            onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                            required placeholder="e.g., 5000.00" />
                                        <Input label="Deadline" type="date" value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Cover Image (Optional)</label>
                                            <input type="file" accept="image/*"
                                                onChange={(e) => setFormData({ ...formData, cover_image: e.target.files[0] })}
                                                className="w-full text-xs text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Visibility</label>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setFormData({ ...formData, visibility: 'external' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 text-xs font-medium ${
                                                        formData.visibility === 'external' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-theme text-secondary'
                                                    }`}>
                                                    <Globe className="w-4 h-4" /> Public
                                                </button>
                                                <button type="button" onClick={() => setFormData({ ...formData, visibility: 'internal' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 text-xs font-medium ${
                                                        formData.visibility === 'internal' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-theme text-secondary'
                                                    }`}>
                                                    <Eye className="w-4 h-4" /> Group Only
                                                </button>
                                            </div>
                                        </div>
                                        <div className="border border-theme rounded-xl p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                                <Building2 className="w-4 h-4" /> Connect to Organization (Optional)
                                            </h4>
                                            <Input label="Organization Name" value={formData.organization_name}
                                                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                                placeholder="e.g., Kenyatta Hospital" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Type" value={formData.organization_type}
                                                    onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                                                    placeholder="e.g., Hospital" />
                                                <Input label="Registration #" value={formData.organization_reg_number}
                                                    onChange={(e) => setFormData({ ...formData, organization_reg_number: e.target.value })}
                                                    placeholder="Reg. number" />
                                            </div>
                                            <Input label="Address" value={formData.organization_address}
                                                onChange={(e) => setFormData({ ...formData, organization_address: e.target.value })}
                                                placeholder="Organization address" />
                                        </div>
                                    </>
                                )}
                                {createStep === 3 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-primary">Review Campaign</h3>
                                        <div className="bg-secondary/5 rounded-xl p-4 space-y-3 text-sm">
                                            <div><span className="text-secondary">Title:</span> <span className="text-primary font-medium">{formData.name}</span></div>
                                            <div><span className="text-secondary">Category:</span> <span className="text-primary font-medium">{formData.category}</span></div>
                                            <div><span className="text-secondary">Goal:</span> <span className="text-primary font-medium">${parseFloat(formData.goal_amount || 0).toLocaleString()}</span></div>
                                            <div><span className="text-secondary">Type:</span> <span className="text-primary font-medium">{formData.donation_type === 'group' ? 'Group Campaign' : 'Personal Campaign'}</span></div>
                                            {formData.organization_name && (
                                                <div><span className="text-secondary">Organization:</span> <span className="text-primary font-medium">{formData.organization_name}</span></div>
                                            )}
                                            {formData.cover_image && (
                                                <div><span className="text-secondary">Cover Image:</span> <span className="text-primary font-medium">{formData.cover_image.name}</span></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-secondary">Please review your campaign details before launching.</p>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-3">
                                    {createStep > 1 && (
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateStep(createStep - 1)}>Back</Button>
                                    )}
                                    <Button type="button" variant="outline" className={createStep === 1 ? "flex-1" : ""} onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1"
                                        disabled={createLoading || (createStep === 1 && !formData.name) || (createStep === 2 && !formData.goal_amount)}>
                                        {createLoading ? 'Creating...' : createStep === 3 ? 'Launch Campaign' : 'Next'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">Donate to {showContributeModal.name}</h3>
                                <button onClick={() => setShowContributeModal(null)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleContribute} className="space-y-4">
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-rose-800">Raised</span>
                                        <span className="font-bold text-rose-900">${parseFloat(showContributeModal.amount_collected || showContributeModal.current_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-800">Goal</span>
                                        <span className="font-bold text-rose-900">${parseFloat(showContributeModal.goal_amount || showContributeModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-tertiary" />
                                    </div>
                                    <input type="number" min="0.01" step="0.01" required value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00"
                                        className="block w-full pl-10 pr-4 py-3 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-rose-500 text-xl font-bold text-center" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[5, 25, 100].map(amt => (
                                        <button key={amt} type="button" onClick={() => setContributionAmount(amt.toString())}
                                            className="py-2 border border-theme rounded-lg font-semibold text-sm text-secondary hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors">
                                            ${amt}
                                        </button>
                                    ))}
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

export default Donations;
