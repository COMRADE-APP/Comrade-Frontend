import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Users, ArrowLeft, Target, DollarSign, UserPlus, Settings,
    Calendar, TrendingUp, Mail, X, Plus, Check, AlertCircle,
    PiggyBank, History, Crown, MoreVertical, Share2, MessageCircle, FileText, Calendar as CalendarIcon, Megaphone, BookOpen, EyeOff,
    Clock, Wallet, Smartphone, CreditCard, AlertTriangle, ShieldCheck, Trash2
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const PaymentGroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // New Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [pendingInviteEmail, setPendingInviteEmail] = useState('');

    const [inviteEmail, setInviteEmail] = useState('');
    const [contributeAmount, setContributeAmount] = useState('');
    const [contributeNotes, setContributeNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [joinAnonymousLoading, setJoinAnonymousLoading] = useState(false);

    // Group lifecycle state
    const [groupStatus, setGroupStatus] = useState(null);
    const [pendingInvitation, setPendingInvitation] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');

    useEffect(() => {
        loadGroupData();
        loadGroupStatus();
        checkPendingInvitation();
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

    const loadGroupStatus = async () => {
        try {
            const status = await paymentsService.getGroupStatus(groupId);
            setGroupStatus(status);
        } catch (error) {
            console.error('Error loading group status:', error);
        }
    };

    const checkPendingInvitation = async () => {
        try {
            const invitations = await paymentsService.getInvitations();
            if (Array.isArray(invitations)) {
                const matching = invitations.find(inv =>
                    inv.payment_group === groupId || inv.payment_group?.id === groupId
                );
                if (matching) setPendingInvitation(matching);
            }
        } catch (error) {
            console.error('Error checking invitations:', error);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setActionLoading(true);
        try {
            await paymentsService.inviteToGroup(groupId, inviteEmail);
            setModalMessage('Invitation sent successfully!');
            setShowSuccessModal(true);
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (error) {
            console.error('Invite Error:', error);
            if (error.response && error.response.status === 404 && error.response.data.requires_confirmation) {
                // User not found, show custom confirmation modal
                setModalMessage(error.response.data.message);
                setPendingInviteEmail(inviteEmail);
                setShowConfirmModal(true);
                setShowInviteModal(false); // Close the initial invite modal
            } else {
                alert('Failed to send invitation: ' + (error.response?.data?.error || 'Unknown error'));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmInvite = async () => {
        if (!pendingInviteEmail) return;
        setActionLoading(true);
        try {
            await paymentsService.inviteToGroup(groupId, pendingInviteEmail, true); // true for force_external
            setModalMessage('Invitation sent to external email successfully!');
            setShowSuccessModal(true);
            setShowConfirmModal(false);
            setPendingInviteEmail('');
            setInviteEmail('');
        } catch (retryError) {
            console.error('Retry Invite Error:', retryError);
            alert('Failed to send external invitation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleContribute = async () => {
        if (!contributeAmount) return;
        setActionLoading(true);
        try {
            const result = await paymentsService.contributeToGroup(
                groupId, parseFloat(contributeAmount), contributeNotes, paymentMethod, mpesaPhone
            );
            if (result.requires_action) {
                if (result.payment_method === 'stripe') {
                    setModalMessage('Stripe payment initiated. Complete in your browser.');
                } else if (result.payment_method === 'mpesa') {
                    setModalMessage(result.message || 'Check your phone to complete M-Pesa payment.');
                }
                setShowSuccessModal(true);
            } else {
                setModalMessage('Contribution successful!');
                setShowSuccessModal(true);
            }
            setShowContributeModal(false);
            setContributeAmount('');
            setContributeNotes('');
            setPaymentMethod('wallet');
            setMpesaPhone('');
            loadGroupData();
            loadGroupStatus();
        } catch (error) {
            alert('Failed to make contribution: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptInvitation = async () => {
        if (!pendingInvitation) return;
        setActionLoading(true);
        try {
            await paymentsService.acceptInvitation(pendingInvitation.id);
            setPendingInvitation(null);
            setModalMessage('You have joined the group!');
            setShowSuccessModal(true);
            loadGroupData();
            loadGroupStatus();
        } catch (error) {
            alert('Failed to accept invitation: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineInvitation = async () => {
        if (!pendingInvitation) return;
        setActionLoading(true);
        try {
            await paymentsService.rejectInvitation(pendingInvitation.id);
            setPendingInvitation(null);
            navigate('/payments/groups');
        } catch (error) {
            alert('Failed to decline invitation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExtendDeadline = async () => {
        if (!newDeadline) return;
        setActionLoading(true);
        try {
            await paymentsService.extendGroupDeadline(groupId, new Date(newDeadline).toISOString());
            setModalMessage('Deadline extended successfully!');
            setShowSuccessModal(true);
            setShowDeadlineModal(false);
            setNewDeadline('');
            loadGroupData();
            loadGroupStatus();
        } catch (error) {
            alert('Failed to extend deadline: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestTermination = async () => {
        setActionLoading(true);
        try {
            const result = await paymentsService.requestGroupTermination(groupId);
            setModalMessage(result.message);
            setShowSuccessModal(true);
            loadGroupStatus();
        } catch (error) {
            alert('Failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinAnonymously = async () => {
        setJoinAnonymousLoading(true);
        try {
            await paymentsService.joinGroupAnonymously(groupId);
            setModalMessage('You joined anonymously!');
            setShowSuccessModal(true);
            loadGroupData();
        } catch (error) {
            alert('Failed to join anonymously: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setJoinAnonymousLoading(false);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-secondary">Loading group...</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">Group not found</h3>
                <Button variant="primary" onClick={() => navigate('/payments/groups')}>
                    Back to Groups
                </Button>
            </div>
        );
    }

    const progress = getProgress();

    return (
        <div className="space-y-6">
            {/* Pending Invitation Banner */}
            {pendingInvitation && (
                <Card className="border-2 border-blue-500/30 bg-blue-500/5">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary">You've been invited!</h3>
                                    <p className="text-sm text-secondary">You have a pending invitation to join this group.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDeclineInvitation} disabled={actionLoading}>
                                    <X className="w-4 h-4 mr-1" /> Decline
                                </Button>
                                <Button variant="primary" onClick={handleAcceptInvitation} disabled={actionLoading}>
                                    <Check className="w-4 h-4 mr-1" /> {actionLoading ? 'Joining...' : 'Accept & Join'}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Maturation / Termination Status Banner */}
            {groupStatus?.is_matured && !groupStatus?.is_terminated && (
                <Card className="border-2 border-amber-500/30 bg-amber-500/5">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-amber-800">Group Matured</h3>
                                    <p className="text-sm text-amber-700">
                                        The deadline has passed. {groupStatus.termination_agreed}/{groupStatus.termination_total} members agreed to terminate.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowDeadlineModal(true)}>
                                    <Clock className="w-4 h-4 mr-1" /> Extend Deadline
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleRequestTermination}
                                    disabled={actionLoading}
                                    className="!bg-amber-600 hover:!bg-amber-700"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-1" /> Request Termination
                                </Button>
                            </div>
                        </div>
                        {/* Termination progress bar */}
                        {groupStatus.termination_total > 0 && (
                            <div className="mt-3">
                                <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${(groupStatus.termination_agreed / groupStatus.termination_total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {groupStatus?.is_terminated && (
                <Card className="border-2 border-red-500/30 bg-red-500/5">
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-800">Group Terminated</h3>
                                <p className="text-sm text-red-700">All members agreed to terminate this group.</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/payments/groups')}
                        className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary">{group.name}</h1>
                            {groupStatus?.is_matured && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Matured</span>
                            )}
                        </div>
                        <p className="text-secondary mt-1">{group.description || 'No description'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowShareModal(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                    </Button>
                    {group.allow_anonymous && (
                        <Button
                            variant="outline"
                            onClick={handleJoinAnonymously}
                            disabled={joinAnonymousLoading}
                        >
                            <EyeOff className="w-4 h-4 mr-2" />
                            {joinAnonymousLoading ? 'Joining...' : 'Join Anonymously'}
                        </Button>
                    )}
                    <Button variant="primary" onClick={() => setShowContributeModal(true)} disabled={groupStatus?.is_terminated}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Contribute
                    </Button>
                </div>
            </div>

            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-white/80 text-sm mb-2">Group Balance</p>
                            <h2 className="text-4xl font-bold">
                                ${parseFloat(group.current_amount || 0).toFixed(2)}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-sm mb-2">Target</p>
                            <h3 className="text-2xl font-bold">
                                ${parseFloat(group.target_amount || 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-white/80">
                        <span>{progress.toFixed(1)}% complete</span>
                        <span>{members.length} members</span>
                    </div>
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-theme overflow-x-auto">
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
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary'
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
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary">Group Details</h3>
                        </CardHeader>
                        <CardBody className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-secondary">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.is_active ? 'bg-green-500/10 text-green-700' : 'bg-secondary/10 text-secondary'
                                    }`}>
                                    {group.is_active ? 'Active' : 'Completed'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Members</span>
                                <span className="font-medium text-primary">{members.length} / {group.max_capacity || '∞'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Created</span>
                                <span className="font-medium text-primary">{formatDate(group.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Tier</span>
                                <span className="font-medium text-primary capitalize">{group.tier || 'Free'}</span>
                            </div>
                            {group.expiry_date && (
                                <div className="flex justify-between">
                                    <span className="text-secondary">Deadline</span>
                                    <span className="font-medium text-primary">{formatDate(group.expiry_date)}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary">Recent Contributions</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            {contributions.slice(0, 5).length === 0 ? (
                                <div className="p-4 text-center text-secondary">
                                    No contributions yet
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {contributions.slice(0, 5).map((contribution, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary">
                                                        ${parseFloat(contribution.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-secondary">
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
                    <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                        <h3 className="font-semibold text-primary">Members ({members.length})</h3>
                        <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {members.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No members yet. Invite some friends!</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {members.map((member, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${member.is_anonymous
                                                ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                                                : 'bg-gradient-to-br from-primary to-primary/80'
                                                }`}>
                                                {member.is_anonymous
                                                    ? <EyeOff className="w-5 h-5" />
                                                    : (member.user_name?.[0]?.toUpperCase() || member.payment_profile?.user?.username?.[0]?.toUpperCase() || 'U')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-primary">
                                                        {member.user_name || member.payment_profile?.user?.username || 'Unknown User'}
                                                    </p>
                                                    {member.is_admin && (
                                                        <Crown className="w-4 h-4 text-yellow-500" />
                                                    )}
                                                    {member.is_anonymous && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/10 text-gray-600 font-medium">
                                                            Anonymous
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-secondary">
                                                    {member.is_anonymous ? 'Identity hidden' : `Joined ${formatDate(member.joined_at)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-primary">
                                                ${parseFloat(member.total_contributed || 0).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-secondary">contributed</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )
            }

            {
                activeTab === 'contributions' && (
                    <Card>
                        <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                            <h3 className="font-semibold text-primary">All Contributions</h3>
                            <Button variant="primary" size="sm" onClick={() => setShowContributeModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contribution
                            </Button>
                        </CardHeader>
                        <CardBody className="p-0">
                            {contributions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <History className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                    <p className="text-secondary">No contributions yet. Be the first to contribute!</p>
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
                                                    <p className="font-medium text-primary">
                                                        ${parseFloat(contribution.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-secondary">
                                                        {formatDate(contribution.contributed_at)}
                                                    </p>
                                                    {contribution.notes && (
                                                        <p className="text-xs text-tertiary mt-1">
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
                )
            }

            {
                activeTab === 'piggybanks' && (
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
                )
            }

            {/* Invite Modal */}
            {
                showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Invite Member</h2>
                                    <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
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
                                    <p className="text-sm text-secondary">
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
                )
            }

            {/* Contribute Modal */}
            {
                showContributeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Make Contribution</h2>
                                    <button onClick={() => setShowContributeModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {/* Payment Method Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">Payment Method</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'blue' },
                                                { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'green' },
                                                { id: 'stripe', label: 'Card', icon: CreditCard, color: 'purple' },
                                            ].map((method) => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === method.id
                                                            ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                                                            : 'border-theme bg-elevated text-secondary hover:border-primary/30'
                                                        }`}
                                                >
                                                    <method.icon className="w-5 h-5" />
                                                    <span className="text-xs font-medium">{method.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Input
                                        label="Amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={contributeAmount}
                                        onChange={(e) => setContributeAmount(e.target.value)}
                                        placeholder="0.00"
                                    />

                                    {paymentMethod === 'mpesa' && (
                                        <Input
                                            label="M-Pesa Phone Number"
                                            type="tel"
                                            value={mpesaPhone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            placeholder="254712345678"
                                        />
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Notes (optional)</label>
                                        <textarea
                                            value={contributeNotes}
                                            onChange={(e) => setContributeNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Add a note..."
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
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
                                            disabled={!contributeAmount || actionLoading || (paymentMethod === 'mpesa' && !mpesaPhone)}
                                        >
                                            {actionLoading ? 'Processing...' : `Contribute $${contributeAmount || '0.00'}`}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                showConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Confirm Invitation</h2>
                                    <button onClick={() => setShowConfirmModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-secondary">{modalMessage}</p>
                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleConfirmInvite}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Sending...' : 'Send Anyway'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody className="text-center p-6">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-primary mb-2">Success</h2>
                                <p className="text-secondary mb-6">{modalMessage}</p>
                                <Button variant="primary" className="w-full" onClick={() => setShowSuccessModal(false)}>
                                    Done
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                )
            }
            {/* Share Modal */}
            {
                showShareModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Share Group</h2>
                                    <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            setModalMessage('Link copied to clipboard!');
                                            setShowSuccessModal(true);
                                            setShowShareModal(false);
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Copy Link</span>
                                    </button>

                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => navigate('/messages', { state: { shareContent: `Check out this payment group: ${window.location.href}` } })}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Forward to Chat</span>
                                    </button>

                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => navigate('/opinions', { state: { attachment: { type: 'payment_group', id: groupId, name: group?.name, link: window.location.href } } })}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Megaphone className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Attach to Opinion</span>
                                    </button>

                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => navigate('/events/create', { state: { attachment: { type: 'payment_group', id: groupId, name: group?.name, link: window.location.href } } })}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Add to Event</span>
                                    </button>

                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => navigate('/articles/create', { state: { attachment: { type: 'payment_group', id: groupId, name: group?.name, link: window.location.href } } })}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Use in Article</span>
                                    </button>

                                    <button className="p-4 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center gap-2 text-center"
                                        onClick={() => navigate('/research/create', { state: { attachment: { type: 'payment_group', id: groupId, name: group?.name, link: window.location.href } } })}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">Attach to Research</span>
                                    </button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }
            {/* Deadline Extension Modal */}
            {
                showDeadlineModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Extend Deadline</h2>
                                    <button onClick={() => setShowDeadlineModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <Input
                                        label="New Deadline"
                                        type="datetime-local"
                                        value={newDeadline}
                                        onChange={(e) => setNewDeadline(e.target.value)}
                                    />
                                    <p className="text-sm text-secondary">
                                        The new deadline must be in the future. This will reset the maturation status.
                                    </p>
                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowDeadlineModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleExtendDeadline}
                                            disabled={!newDeadline || actionLoading}
                                        >
                                            {actionLoading ? 'Saving...' : 'Extend Deadline'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

        </div >
    );
};

export default PaymentGroupDetail;
