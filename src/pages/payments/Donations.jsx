import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { 
    Heart, Search, Plus, Calendar, User, Users, CheckCircle, 
    ArrowLeft, Target, X, Share2, TrendingUp 
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const Donations = () => {
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('for_you'); // for_you, public, my_group, my_campaigns
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'other',
        goal_amount: '',
        deadline: '',
        donation_type: 'individual',
        payment_group: null,
        group_mode: 'independent', // fixed, proportional, independent
        visibility: 'external',
    });
    const [contributionAmount, setContributionAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [donationsData, groupsData] = await Promise.all([
                paymentsService.getDonations().catch(() => []),
                paymentsService.getMyGroups().catch(() => [])
            ]);
            setDonations(Array.isArray(donationsData) ? donationsData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const myGroupIds = groups.map(g => g.id);
    const userId = '@TODO'; // We'll need user ID or just assume my_campaigns is matched differently or we don't have it easily. Actually wait, can I check 'donor_profile' or 'user'? 
    // Wait, the API returns only donations the user can see anyway. Let's filter client side.
    
    const filteredDonations = donations.filter(donation => {
        const matchesSearch = donation.name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'for_you') {
            // For You = public external + internal but from user's groups
            if (donation.visibility === 'internal') {
                return donation.payment_group && myGroupIds.includes(donation.payment_group.id || donation.payment_group);
            }
            return true;
        }
        if (activeTab === 'public') return donation.visibility !== 'internal';
        if (activeTab === 'my_group') return donation.payment_group && myGroupIds.includes(donation.payment_group.id || donation.payment_group);
        if (activeTab === 'my_campaigns') return true; // TODO: properly check if user created this. We'll show all for now or filter if we have donor_profile
        return true;
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'other',
            goal_amount: '',
            deadline: '',
            donation_type: 'individual',
            payment_group: null,
            group_mode: 'independent',
            visibility: 'external',
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
                category: formData.category || 'other',
                goal_amount: parseFloat(formData.goal_amount) || 0,
                deadline: formData.deadline || null,
                visibility: formData.visibility,
            };

            if (formData.donation_type === 'group' && formData.payment_group) {
                payload.payment_group = formData.payment_group;
                payload.group_mode = formData.group_mode;
            }

            await paymentsService.createDonation(payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create donation:', error);
            alert('Failed to create donation. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!showContributeModal || !contributionAmount) return;

        navigate('/checkout', {
            state: {
                cartItems: [{
                    id: showContributeModal.id,
                    type: 'donation',
                    name: `Donation to ${showContributeModal.name}`,
                    price: parseFloat(contributionAmount),
                    qty: 1,
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(contributionAmount)
            }
        });
    };

    const getProgress = (donation) => {
        if (!donation.goal_amount || donation.goal_amount === 0) return 0;
        return Math.min(100, (parseFloat(donation.amount_collected || 0) / parseFloat(donation.goal_amount)) * 100);
    };

    const totalCollected = donations.reduce((sum, d) => sum + parseFloat(d.amount_collected || 0), 0);
    const activeDonations = donations.filter(d => !d.is_completed).length;

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
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Donations & Charity</h1>
                        <p className="text-secondary mt-1">Give back together</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Donation Campaign
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-primary-700 text-white">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-xs mb-1">Total Impact</p>
                                <h2 className="text-2xl font-bold">${totalCollected.toFixed(2)}</h2>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-xs mb-1">Active Campaigns</p>
                                <h2 className="text-2xl font-bold text-primary">{activeDonations}</h2>
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
                                <p className="text-secondary text-xs mb-1">Total Campaigns</p>
                                <h2 className="text-2xl font-bold text-primary">{donations.length}</h2>
                            </div>
                            <div className="bg-green-500/10 p-2 rounded-full">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Search and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { id: 'for_you', label: 'For You', icon: Heart },
                        { id: 'public', label: 'Public', icon: Users },
                        { id: 'my_group', label: 'My Group', icon: Target },
                        { id: 'my_campaigns', label: 'My Campaigns', icon: User },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'bg-elevated text-secondary border border-theme hover:bg-secondary/10'
                            }`}
                        >
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Donations Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredDonations.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Heart className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">
                            {searchTerm ? 'No campaigns found' : 'No donations yet'}
                        </h3>
                        <p className="text-secondary mb-6">
                            {searchTerm
                                ? 'Try a different search term'
                                : 'Start a campaign to rally support for a cause'
                            }
                        </p>
                        {!searchTerm && (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Start a Campaign
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDonations.map(donation => (
                        <Card key={donation.id} className="group hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <CardBody className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className={`p-3 rounded-xl ${donation.is_completed ? 'bg-green-500/10' : 'bg-indigo-500/10'}`}>
                                            <Heart className={`w-6 h-6 ${donation.is_completed ? 'text-green-600' : 'text-indigo-600'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-primary break-words line-clamp-2">{donation.name}</h3>
                                                {donation.category && (
                                                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-[10px] rounded-full uppercase tracking-wider font-bold shrink-0 ml-2">
                                                        {donation.category.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-secondary line-clamp-1">{donation.description || 'No description'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {donation.payment_group ? (
                                        <div className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            <Users className="w-3 h-3 mr-1" />
                                            Group Campaign
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                            <User className="w-3 h-3 mr-1" />
                                            Individual
                                        </div>
                                    )}
                                    {donation.group_mode && donation.payment_group && (
                                        <div className="flex items-center text-xs font-medium text-primary-700 bg-primary-150 px-2 py-1 rounded-full capitalize">
                                            {donation.group_mode.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2 mt-auto">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-primary">${parseFloat(donation.amount_collected || 0).toFixed(2)}</span>
                                        <span className="text-secondary">${parseFloat(donation.goal_amount || 0).toFixed(2)} goal</span>
                                    </div>
                                    <div className="h-3 bg-secondary/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${donation.is_completed
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-indigo-500 to-primary-600'
                                            }`}
                                            style={{ width: `${Math.min(100, getProgress(donation))}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-secondary pt-1">
                                        <span>{getProgress(donation).toFixed(1)}% funded</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {donation.deadline ? formatDate(donation.deadline) : 'No deadline'}
                                        </span>
                                    </div>
                                </div>

                                {!donation.is_completed && (
                                    <div className="pt-4 mt-4 border-t border-theme">
                                        <Button 
                                            variant="primary" 
                                            className="w-full"
                                            onClick={() => setShowContributeModal(donation)}
                                        >
                                            Contribute Now
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">
                                    {createStep === 1 ? 'Campaign Details' : 'Configure Rules'}
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
                                            label="Campaign Name *"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Local Shelter Support"
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            >
                                                <option value="health">Health & Medical</option>
                                                <option value="education">Education</option>
                                                <option value="relief">Disaster Relief</option>
                                                <option value="community">Community & Social</option>
                                                <option value="environment">Environment</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Tell us why you are raising funds..."
                                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                            />
                                        </div>

                                        <Input
                                            label="Goal Amount *"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={formData.goal_amount}
                                            onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                            required
                                            placeholder="e.g., 5000.00"
                                        />
                                    </>
                                )}

                                {createStep === 2 && (
                                    <>
                                        <Input
                                            label="Deadline"
                                            type="date"
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Campaign Type</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, donation_type: 'individual', payment_group: null })}
                                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                                        formData.donation_type === 'individual'
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-theme hover:border-theme-hover'
                                                    }`}
                                                >
                                                    <User className={`w-6 h-6 mx-auto mb-2 ${formData.donation_type === 'individual' ? 'text-primary' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-sm text-primary">Individual</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, donation_type: 'group' })}
                                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                                        formData.donation_type === 'group'
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-theme hover:border-theme-hover'
                                                    }`}
                                                >
                                                    <Users className={`w-6 h-6 mx-auto mb-2 ${formData.donation_type === 'group' ? 'text-primary' : 'text-tertiary'}`} />
                                                    <p className="font-medium text-sm text-primary">Group</p>
                                                </button>
                                            </div>
                                        </div>

                                        {formData.donation_type === 'group' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary mb-1">Campaign Visibility</label>
                                                    <div className="flex gap-3 mb-4">
                                                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                            formData.visibility === 'external' ? 'border-primary bg-primary/5' : 'border-theme hover:bg-secondary/5'
                                                        }`}>
                                                            <input type="radio" name="visibility" value="external" checked={formData.visibility === 'external'} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="text-primary focus:ring-primary hidden" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-primary text-sm">External (Public)</p>
                                                                <p className="text-xs text-secondary mt-0.5">Visible to everyone</p>
                                                            </div>
                                                        </label>
                                                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                            formData.visibility === 'internal' ? 'border-primary bg-primary/5' : 'border-theme hover:bg-secondary/5'
                                                        }`}>
                                                            <input type="radio" name="visibility" value="internal" checked={formData.visibility === 'internal'} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="text-primary focus:ring-primary hidden" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-primary text-sm">Internal (Group Only)</p>
                                                                <p className="text-xs text-secondary mt-0.5">Visible only to members</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-secondary mb-1">Select Group *</label>
                                                    <select
                                                        value={formData.payment_group || ''}
                                                        onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                        required={formData.donation_type === 'group'}
                                                        className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                    >
                                                        <option value="">Choose a group...</option>
                                                        {groups.map(group => (
                                                            <option key={group.id} value={group.id}>{group.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-secondary mb-1">Group Donation Mode</label>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                            <input type="radio" name="group_mode" value="independent" checked={formData.group_mode === 'independent'} onChange={(e) => setFormData({ ...formData, group_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-primary text-sm">Independent</p>
                                                                <p className="text-xs text-secondary mt-0.5">Members donate whatever they wish individually</p>
                                                            </div>
                                                        </label>
                                                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                            <input type="radio" name="group_mode" value="proportional" checked={formData.group_mode === 'proportional'} onChange={(e) => setFormData({ ...formData, group_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-primary text-sm">Proportional</p>
                                                                <p className="text-xs text-secondary mt-0.5">Donation amount is split among active members</p>
                                                            </div>
                                                        </label>
                                                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                                            <input type="radio" name="group_mode" value="fixed" checked={formData.group_mode === 'fixed'} onChange={(e) => setFormData({ ...formData, group_mode: e.target.value })} className="text-primary focus:ring-primary" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-primary text-sm">Fixed</p>
                                                                <p className="text-xs text-secondary mt-0.5">Fixed deduction for the whole group from treasury</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </>
                                        )}
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
                                        disabled={createLoading || (createStep === 1 && (!formData.name || !formData.goal_amount)) || (createStep === 2 && formData.donation_type === 'group' && !formData.payment_group)}
                                    >
                                        {createLoading ? 'Saving...' : createStep === 1 ? 'Next Step' : 'Launch Campaign'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary">Contribute</h3>
                                <button onClick={() => setShowContributeModal(null)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <form onSubmit={handleContribute} className="space-y-4">
                                <div className="p-4 bg-indigo-50 rounded-lg">
                                    <h4 className="font-bold text-indigo-900 mb-2">{showContributeModal.name}</h4>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-indigo-700">Goal Amount</span>
                                        <span className="font-medium text-indigo-900">${parseFloat(showContributeModal.goal_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-700">Remaining</span>
                                        <span className="font-medium text-indigo-900">
                                            ${Math.max(0, parseFloat(showContributeModal.goal_amount || 0) - parseFloat(showContributeModal.amount_collected || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <Input
                                    label="Contribution Amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowContributeModal(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={!contributionAmount}>
                                        Donate Now
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

export default Donations;
