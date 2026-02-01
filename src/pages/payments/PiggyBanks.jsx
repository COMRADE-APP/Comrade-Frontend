import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, Lock, Unlock, TrendingUp, Plus, Users, Calendar,
    ArrowLeft, PiggyBank, X, CheckCircle, User, Search, Filter
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const PiggyBanks = () => {
    const navigate = useNavigate();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, individual, group, pending
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [createStep, setCreateStep] = useState(1);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        maturity_date: '',
        locking_status: 'unlocked',
        piggy_type: 'individual', // individual or group
        payment_group: null,
    });
    const [contributionAmount, setContributionAmount] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [piggyData, groupsData] = await Promise.all([
                paymentsService.getPiggyBanks().catch(() => []),
                paymentsService.getMyGroups().catch(() => [])
            ]);
            setPiggyBanks(Array.isArray(piggyData) ? piggyData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPiggyBanks = piggyBanks.filter(piggy => {
        const matchesSearch = piggy.name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'individual') return matchesSearch && !piggy.payment_group;
        if (activeTab === 'group') return matchesSearch && piggy.payment_group;
        if (activeTab === 'pending') return matchesSearch && piggy.status === 'pending';
        return matchesSearch;
    });

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
                locking_status: formData.locking_status,
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
        } finally {
            setCreateLoading(false);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!showContributeModal || !contributionAmount) return;

        try {
            await paymentsService.contributeToPiggyBank(showContributeModal.id, parseFloat(contributionAmount));
            setShowContributeModal(null);
            setContributionAmount('');
            loadData();
            alert('Contribution successful!');
        } catch (error) {
            alert('Contribution failed.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            target_amount: '',
            maturity_date: '',
            locking_status: 'unlocked',
            piggy_type: 'individual',
            payment_group: null,
        });
        setCreateStep(1);
    };

    const getProgress = (piggy) => {
        if (!piggy.target_amount || piggy.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(piggy.current_amount || 0) / parseFloat(piggy.target_amount)) * 100);
    };

    const totalSaved = piggyBanks.reduce((sum, p) => sum + parseFloat(p.current_amount || 0), 0);
    const totalTarget = piggyBanks.reduce((sum, p) => sum + parseFloat(p.target_amount || 0), 0);
    const avgCompletion = piggyBanks.length > 0
        ? piggyBanks.reduce((sum, p) => sum + getProgress(p), 0) / piggyBanks.length
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/payments')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Piggy Banks</h1>
                        <p className="text-gray-600 mt-1">Manage your savings goals</p>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Piggy Bank
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-pink-100 text-xs mb-1">Total Saved</p>
                                <h2 className="text-2xl font-bold">${totalSaved.toFixed(2)}</h2>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full">
                                <PiggyBank className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs mb-1">Target Amount</p>
                                <h2 className="text-2xl font-bold text-gray-900">${totalTarget.toFixed(2)}</h2>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-full">
                                <Target className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs mb-1">Active Goals</p>
                                <h2 className="text-2xl font-bold text-gray-900">{piggyBanks.length}</h2>
                            </div>
                            <div className="bg-green-50 p-2 rounded-full">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs mb-1">Avg. Progress</p>
                                <h2 className="text-2xl font-bold text-gray-900">{avgCompletion.toFixed(0)}%</h2>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-full">
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Search and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search piggy banks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { id: 'all', label: 'All', icon: null },
                        { id: 'individual', label: 'Individual', icon: User },
                        { id: 'group', label: 'Group', icon: Users },
                        { id: 'pending', label: 'Pending', icon: null },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Piggy Banks Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredPiggyBanks.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No piggy banks found' : 'No piggy banks yet'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm
                                ? 'Try a different search term'
                                : 'Create a piggy bank to start saving towards your goals'
                            }
                        </p>
                        {!searchTerm && (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Piggy Bank
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPiggyBanks.map(piggy => (
                        <PiggyBankCard
                            key={piggy.id}
                            piggy={piggy}
                            progress={getProgress(piggy)}
                            onContribute={() => setShowContributeModal(piggy)}
                        />
                    ))}
                </div>
            )}

            {/* Create Piggy Bank Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg relative">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {createStep === 1 ? 'Create Piggy Bank' : 'Configure Target'}
                                </h2>
                                <button
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center gap-2 mb-6">
                                {[1, 2].map((s) => (
                                    <React.Fragment key={s}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${s < createStep ? 'bg-green-500 text-white' :
                                                s === createStep ? 'bg-primary-600 text-white' :
                                                    'bg-gray-200 text-gray-500'
                                            }`}>
                                            {s < createStep ? <CheckCircle className="w-5 h-5" /> : s}
                                        </div>
                                        {s < 2 && (
                                            <div className={`flex-1 h-1 ${s < createStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {createStep === 1 && (
                                    <>
                                        <Input
                                            label="Piggy Bank Name *"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Vacation Fund"
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                placeholder="What are you saving for?"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, piggy_type: 'individual', payment_group: null })}
                                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${formData.piggy_type === 'individual'
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <User className={`w-6 h-6 mx-auto mb-2 ${formData.piggy_type === 'individual' ? 'text-primary-600' : 'text-gray-400'
                                                        }`} />
                                                    <p className="font-medium text-sm">Individual</p>
                                                    <p className="text-xs text-gray-500">Just for you</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, piggy_type: 'group' })}
                                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${formData.piggy_type === 'group'
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Users className={`w-6 h-6 mx-auto mb-2 ${formData.piggy_type === 'group' ? 'text-primary-600' : 'text-gray-400'
                                                        }`} />
                                                    <p className="font-medium text-sm">Group</p>
                                                    <p className="text-xs text-gray-500">Linked to a group</p>
                                                </button>
                                            </div>
                                        </div>

                                        {formData.piggy_type === 'group' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Group *</label>
                                                <select
                                                    value={formData.payment_group || ''}
                                                    onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                                    required={formData.piggy_type === 'group'}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                >
                                                    <option value="">Choose a group...</option>
                                                    {groups.map(group => (
                                                        <option key={group.id} value={group.id}>{group.name}</option>
                                                    ))}
                                                </select>
                                                {groups.length === 0 && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        No groups available. <button type="button" onClick={() => navigate('/payments/create-group')} className="text-primary-600 underline">Create a group first</button>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {createStep === 2 && (
                                    <>
                                        <Input
                                            label="Target Amount *"
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                            required
                                            placeholder="e.g., 1000.00"
                                        />

                                        <Input
                                            label="Target Date"
                                            type="date"
                                            value={formData.maturity_date}
                                            onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Lock Status</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, locking_status: 'unlocked' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${formData.locking_status === 'unlocked'
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200'
                                                        }`}
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                    <span className="font-medium text-sm">Unlocked</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, locking_status: 'locked' })}
                                                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${formData.locking_status === 'locked'
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200'
                                                        }`}
                                                >
                                                    <Lock className="w-4 h-4" />
                                                    <span className="font-medium text-sm">Locked</span>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formData.locking_status === 'locked'
                                                    ? 'Funds cannot be withdrawn until the target date'
                                                    : 'You can withdraw funds at any time'}
                                            </p>
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
                                        type="button"
                                        variant="outline"
                                        className={createStep === 1 ? "flex-1" : ""}
                                        onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={createLoading || (createStep === 1 && !formData.name) || (createStep === 1 && formData.piggy_type === 'group' && !formData.payment_group)}
                                    >
                                        {createLoading ? 'Creating...' : createStep === 1 ? 'Next' : 'Create Piggy Bank'}
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
                                <h3 className="text-xl font-bold text-gray-900">Contribute to {showContributeModal.name}</h3>
                                <button onClick={() => setShowContributeModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleContribute} className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Current</span>
                                        <span className="font-medium">${parseFloat(showContributeModal.current_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Target</span>
                                        <span className="font-medium">${parseFloat(showContributeModal.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <Input
                                    label="Amount"
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
                                        Contribute ${contributionAmount || '0.00'}
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

const PiggyBankCard = ({ piggy, progress, onContribute }) => {
    const isAchieved = progress >= 100;

    return (
        <Card className="group hover:shadow-lg transition-shadow duration-300">
            <CardBody className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`p-3 rounded-xl ${isAchieved ? 'bg-green-100' : 'bg-rose-100'}`}>
                            <PiggyBank className={`w-6 h-6 ${isAchieved ? 'text-green-600' : 'text-rose-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{piggy.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{piggy.description || 'No description'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {piggy.payment_group && (
                            <div className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                <Users className="w-3 h-3 mr-1" />
                                Group
                            </div>
                        )}
                        {piggy.locking_status === 'locked' ? (
                            <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                            </div>
                        ) : (
                            <div className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                <Unlock className="w-3 h-3 mr-1" />
                                Unlocked
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-700">${parseFloat(piggy.current_amount || 0).toFixed(2)}</span>
                        <span className="text-gray-400">Target: ${parseFloat(piggy.target_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isAchieved
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500'
                                }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                    <div className="text-right text-xs text-gray-500">{progress.toFixed(1)}% complete</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {piggy.maturity_date ? formatDate(piggy.maturity_date) : 'No deadline'}
                    </div>
                    <Button
                        size="sm"
                        variant={isAchieved ? "outline" : "primary"}
                        onClick={onContribute}
                        disabled={isAchieved}
                    >
                        {isAchieved ? 'Goal Reached!' : 'Contribute'}
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default PiggyBanks;
