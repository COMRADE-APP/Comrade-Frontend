import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Users, ArrowLeft, Target, DollarSign, UserPlus, Settings,
    Calendar, TrendingUp, Mail, X, Plus, Check, AlertCircle,
    PiggyBank, History, Crown, MoreVertical
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const PaymentGroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [contributeAmount, setContributeAmount] = useState('');
    const [contributeNotes, setContributeNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const loadGroupData = async () => {
        setLoading(true);
        try {
            const [groupData, membersData, contributionsData] = await Promise.all([
                paymentsService.getPaymentGroupById(groupId),
                paymentsService.getGroupMembers(groupId).catch(() => []),
                paymentsService.getGroupContributions(groupId).catch(() => []),
            ]);
            setGroup(groupData);
            setMembers(Array.isArray(membersData) ? membersData : []);
            setContributions(Array.isArray(contributionsData) ? contributionsData : []);
        } catch (error) {
            console.error('Error loading group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setActionLoading(true);
        try {
            await paymentsService.inviteToGroup(groupId, inviteEmail);
            alert('Invitation sent successfully!');
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (error) {
            alert('Failed to send invitation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleContribute = async () => {
        if (!contributeAmount) return;
        setActionLoading(true);
        try {
            await paymentsService.contributeToGroup(groupId, parseFloat(contributeAmount), contributeNotes);
            alert('Contribution successful!');
            setShowContributeModal(false);
            setContributeAmount('');
            setContributeNotes('');
            loadGroupData();
        } catch (error) {
            alert('Failed to make contribution');
        } finally {
            setActionLoading(false);
        }
    };

    const getProgress = () => {
        if (!group?.target_amount || group.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(group.current_amount || 0) / parseFloat(group.target_amount)) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading group...</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Group not found</h3>
                <Button variant="primary" onClick={() => navigate('/payments/groups')}>
                    Back to Groups
                </Button>
            </div>
        );
    }

    const progress = getProgress();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/payments/groups')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{group.name}</h1>
                        <p className="text-gray-600 mt-1">{group.description || 'No description'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                    </Button>
                    <Button variant="primary" onClick={() => setShowContributeModal(true)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Contribute
                    </Button>
                </div>
            </div>

            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-primary-100 text-sm mb-2">Group Balance</p>
                            <h2 className="text-4xl font-bold">
                                ${parseFloat(group.current_amount || 0).toFixed(2)}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-primary-100 text-sm mb-2">Target</p>
                            <h3 className="text-2xl font-bold">
                                ${parseFloat(group.target_amount || 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                    <div className="h-3 bg-primary-400/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-primary-100">
                        <span>{progress.toFixed(1)}% complete</span>
                        <span>{members.length} members</span>
                    </div>
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'contributions', label: 'Contributions', icon: History },
                    { id: 'piggybanks', label: 'Piggy Banks', icon: PiggyBank },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="p-4 border-b">
                            <h3 className="font-semibold text-gray-900">Group Details</h3>
                        </CardHeader>
                        <CardBody className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {group.is_active ? 'Active' : 'Completed'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Members</span>
                                <span className="font-medium">{members.length} / {group.max_capacity || '∞'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium">{formatDate(group.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tier</span>
                                <span className="font-medium capitalize">{group.tier || 'Free'}</span>
                            </div>
                            {group.expiry_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Deadline</span>
                                    <span className="font-medium">{formatDate(group.expiry_date)}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader className="p-4 border-b">
                            <h3 className="font-semibold text-gray-900">Recent Contributions</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            {contributions.slice(0, 5).length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No contributions yet
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {contributions.slice(0, 5).map((contribution, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        ${parseFloat(contribution.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(contribution.contributed_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {activeTab === 'members' && (
                <Card>
                    <CardHeader className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Members ({members.length})</h3>
                        <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {members.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No members yet. Invite some friends!</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {members.map((member, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                                                {member.payment_profile?.user?.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">
                                                        {member.payment_profile?.user?.username || 'Unknown User'}
                                                    </p>
                                                    {member.is_admin && (
                                                        <Crown className="w-4 h-4 text-yellow-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Joined {formatDate(member.joined_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                ${parseFloat(member.total_contributed || 0).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">contributed</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {activeTab === 'contributions' && (
                <Card>
                    <CardHeader className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">All Contributions</h3>
                        <Button variant="primary" size="sm" onClick={() => setShowContributeModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contribution
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {contributions.length === 0 ? (
                            <div className="p-8 text-center">
                                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No contributions yet. Be the first to contribute!</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {contributions.map((contribution, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    ${parseFloat(contribution.amount).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(contribution.contributed_at)}
                                                </p>
                                                {contribution.notes && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        "{contribution.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {activeTab === 'piggybanks' && (
                <Card>
                    <CardHeader className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Group Piggy Banks</h3>
                        <Button variant="primary" size="sm" onClick={() => navigate('/piggy-banks')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Piggy Bank
                        </Button>
                    </CardHeader>
                    <CardBody className="p-8 text-center">
                        <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 mb-2">No piggy banks yet</h4>
                        <p className="text-gray-500 mb-4">
                            Create savings goals for specific items or targets within this group.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/piggy-banks')}>
                            View All Piggy Banks
                        </Button>
                    </CardBody>
                </Card>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Invite Member</h2>
                                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                                <p className="text-sm text-gray-500">
                                    An invitation email will be sent to this address.
                                </p>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleInvite}
                                        disabled={!inviteEmail || actionLoading}
                                    >
                                        {actionLoading ? 'Sending...' : 'Send Invitation'}
                                    </Button>
                                </div>
                            </div>
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
                                <h2 className="text-xl font-bold text-gray-900">Make Contribution</h2>
                                <button onClick={() => setShowContributeModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={contributeAmount}
                                    onChange={(e) => setContributeAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                    <textarea
                                        value={contributeNotes}
                                        onChange={(e) => setContributeNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Add a note..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowContributeModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleContribute}
                                        disabled={!contributeAmount || actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : `Contribute $${contributeAmount || '0.00'}`}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PaymentGroupDetail;
