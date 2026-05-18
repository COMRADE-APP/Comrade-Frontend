import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Users, ArrowLeft, Target, DollarSign, UserPlus, Settings,
    TrendingUp, Mail, X, Plus, Check, AlertCircle,
    PiggyBank, History, Crown, MoreVertical, Share2, MessageCircle, FileText, Calendar as CalendarIcon, Megaphone, BookOpen, EyeOff,
    Clock, Wallet, Smartphone, CreditCard, AlertTriangle, ShieldCheck, Trash2, CheckCircle, XCircle, Edit2, Camera, Image as ImageIcon, Lock, BadgeCheck,
    Diamond, Shield, Circle as CircleIcon, Landmark, Globe, HeartHandshake, Download, Percent, Briefcase, Coins, Zap
} from 'lucide-react';

const TIER_ICONS = { Diamond, Shield, Circle: CircleIcon, Landmark, Globe };
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { getGroupTier } from '../../utils/groupUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import GroupDiscourse from '../../components/payments/GroupDiscourse';
import GroupKittiesTab from '../../components/payments/GroupKittiesTab';
import GroupDonationsTab from '../../components/payments/GroupDonationsTab';
import GroupInvestmentsTab from '../../components/payments/GroupInvestmentsTab';
import GroupBusinessesTab from '../../components/payments/GroupBusinessesTab';
import GroupLoansTab from '../../components/payments/GroupLoansTab';
import GroupAutomationsTab from '../../components/payments/GroupAutomationsTab';
import GroupRoundsTab from '../../components/payments/GroupRoundsTab';
import GroupGovernanceTab from '../../components/payments/GroupGovernanceTab';
import GroupWithdrawalsTab from '../../components/payments/GroupWithdrawalsTab';
import GroupSettingsTab from '../../components/payments/GroupSettingsTab';
import GroupBenefitRulesTab from '../../components/payments/GroupBenefitRulesTab';
import GroupVenturesTab from '../../components/payments/GroupVenturesTab';
import GroupPiggyBanksTab from '../../components/payments/GroupPiggyBanksTab';
import GroupInviteModal from '../../components/payments/GroupInviteModal';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const PaymentGroupDetail = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [checkoutRequests, setCheckoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync activeTab to URL when activeTab changes
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (activeTab !== currentTab) {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab]); // Only depend on activeTab

    // Sync URL to activeTab when URL changes (e.g. back button)
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab && currentTab !== activeTab) {
            setActiveTab(currentTab);
        }
    }, [searchParams.get('tab')]); // Only depend on the 'tab' value

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // New Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvingRequest, setApprovingRequest] = useState(null);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [deliveryAccount, setDeliveryAccount] = useState('');
    const [editGroupData, setEditGroupData] = useState({ 
        name: '', description: '', cover_photo: null,
        entry_fee_required: false, entry_fee_amount: 0, custom_application_questions: []
    });
    const [newQuestion, setNewQuestion] = useState('');
    const [editGroupLoading, setEditGroupLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
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

    // Sprint 4: Group Settings & Role Management
    const [groupSettings, setGroupSettings] = useState({
        requires_approval: false,
        allow_anonymous: false,
        transaction_trigger_role: 'any',
        approval_threshold: 100,
        hierarchy_mode: 'flat',
        accent_color: '#6366f1',
        joining_minimum: 0,
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [roleMenuMember, setRoleMenuMember] = useState(null);

    // Sprint 5: Analytics, Rules, Piggy Banks Isolation
    const [groupAnalytics, setGroupAnalytics] = useState(null);
    const [groupRules, setGroupRules] = useState('');
    const [groupPiggyBanks, setGroupPiggyBanks] = useState([]);
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [editRulesText, setEditRulesText] = useState('');

    useEffect(() => {
        if (!groupId) return;
        loadGroupData();
        loadGroupStatus();
        checkPendingInvitation();
    }, [groupId]);

    const loadGroupData = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const [groupData, membersData, contributionsData, requestsData, analyticsData, rulesData, piggyBanksData] = await Promise.all([
                paymentsService.getPaymentGroupById(groupId),
                paymentsService.getGroupMembers(groupId).catch(() => []),
                paymentsService.getGroupContributions(groupId).catch(() => []),
                paymentsService.getGroupCheckoutRequests(groupId).catch(() => []),
                paymentsService.getGroupAnalytics(groupId).catch(() => null),
                paymentsService.getGroupRules(groupId).catch(() => ({ rules_text: '' })),
                paymentsService.getGroupPiggyBanks(groupId).catch(() => [])
            ]);
            setGroup(groupData);
            setMembers(Array.isArray(membersData) ? membersData : (membersData?.results || []));
            setContributions(Array.isArray(contributionsData) ? contributionsData : (contributionsData?.results || []));
            setCheckoutRequests(Array.isArray(requestsData) ? requestsData : (requestsData?.results || []));
            setGroupAnalytics(analyticsData);
            setGroupRules(rulesData?.rules_text || '');
            setGroupPiggyBanks(piggyBanksData);
        } catch (error) {
            console.error('Error loading group:', error);
            setError('Failed to load group details. It might not exist or you might not have permission.');
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
            const invList = Array.isArray(invitations) ? invitations : (invitations?.results || []);
            const matching = invList.find(inv => 
                inv.payment_group === groupId || inv.payment_group?.id === groupId
            );
            if (matching) setPendingInvitation(matching);
        } catch (error) {
            console.error('Error checking invitations:', error);
        }
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        setEditGroupLoading(true);
        try {
            // Need to pass the custom questions as a stringified array if FormData is used, or structured if JSON
            const payload = { ...editGroupData };
            await paymentsService.updateGroup(groupId, payload);
            setModalMessage('Group updated successfully!');
            setShowSuccessModal(true);
            setShowEditModal(false);
            loadGroupData();
        } catch (error) {
            console.error('Update Group Error:', error);
            toast.error(error.response?.data?.error || 'Failed to update group');
        } finally {
            setEditGroupLoading(false);
        }
    };

    const handleApplyCertificate = async () => {
        setActionLoading(true);
        try {
            await paymentsService.applyCertificate(groupId);
            toast.success("Certificate application submitted!");
            loadGroupData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to apply for certificate");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        setSettingsLoading(true);
        try {
            await paymentsService.updateGroupSettings(groupId, groupSettings);
            toast.success('Group settings updated successfully');
            loadGroupData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleUpdateMemberRole = async (memberId, newRole) => {
        try {
            await paymentsService.updateMemberRole(groupId, memberId, newRole);
            toast.success(`Role updated to ${newRole}`);
            setRoleMenuMember(null);
            loadGroupData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update role');
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
            toast.error(error.response?.data?.error || 'Failed to make contribution');
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
            toast.error(error.response?.data?.error || 'Failed to accept invitation');
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
            toast.error('Failed to decline invitation');
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
            toast.error(error.response?.data?.error || 'Failed to extend deadline');
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
            toast.error(error.response?.data?.error || 'Request failed');
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
            toast.error(error.response?.data?.error || 'Failed to join anonymously');
        } finally {
            setJoinAnonymousLoading(false);
        }
    };

    const handleReviewRequest = async (requestId, actionType, payload = {}) => {
        setActionLoading(true);
        try {
            let res;
            if (actionType === 'approve') {
                res = await paymentsService.approveCheckoutRequest(groupId, requestId, payload);
            } else {
                res = await paymentsService.rejectCheckoutRequest(groupId, requestId);
            }
            setModalMessage(res.message || `Successfully ${actionType}d request.`);
            setShowSuccessModal(true);
            loadGroupData(); // Refresh UI
            loadGroupStatus(); // Refresh balance
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to ${actionType} request`);
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
            <div className="space-y-6 max-w-5xl mx-auto lg:p-4">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 skeleton-shimmer" />
                    <div className="w-48 h-8 rounded-lg bg-secondary/10 skeleton-shimmer" />
                </div>
                
                {/* Main Card Skeleton */}
                <Card className="border-theme overflow-hidden">
                    <div className="h-24 bg-secondary/5 skeleton-shimmer" />
                    <CardBody className="p-6 relative pt-12">
                        <div className="absolute -top-10 left-6 w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-secondary/10 skeleton-shimmer" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="w-64 h-6 rounded bg-secondary/10 skeleton-shimmer" />
                                <div className="w-32 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                            </div>
                            <div className="w-24 h-8 rounded-lg bg-secondary/10 skeleton-shimmer" />
                        </div>
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="w-16 h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-24 h-6 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Tabs Skeleton */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-theme">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-24 h-10 rounded-t-xl bg-secondary/10 skeleton-shimmer flex-shrink-0" />
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-theme">
                            <CardBody className="p-4 flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-secondary/10 skeleton-shimmer shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="w-1/3 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-full h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-primary mb-2">Error Loading Group</h1>
                <p className="text-secondary text-center mb-6 max-w-md">{error || 'Group not found'}</p>
                <Button variant="primary" onClick={() => navigate('/payments/groups')}>
                    Back to Groups
                </Button>
            </div>
        );
    }

    const progress = getProgress();

    const isAdmin = (members || []).some(m => 
        m && (m.user === user?.id || m.payment_profile?.user?.id === user?.id) && m.is_admin
    ) || group?.creator?.user?.id === user?.id;

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
            <div className="mb-6 relative">
                {group.cover_photo ? (
                    <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden relative shadow-sm border border-theme">
                        <img src={group.cover_photo} alt={group.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-3 z-10">
                            <button
                                onClick={() => navigate('/payments/groups')}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl md:text-3xl font-bold text-white shadow-sm dropdown-shadow">{group.name}</h1>
                            {(() => {
                                const tier = getGroupTier(members.length);
                                return (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tier.color} border border-white/20 backdrop-blur-md shadow-sm flex items-center gap-1`}>
                                        {(() => { const TierIcon = TIER_ICONS[tier.icon]; return TierIcon ? <TierIcon className="w-3.5 h-3.5" /> : null; })()}
                                        <span>{tier.label}</span>
                                    </span>
                                );
                            })()}
                            {groupStatus?.is_matured && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Matured</span>
                            )}
                            {group.certificate?.status === 'approved' && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 backdrop-blur-md shadow-sm flex items-center gap-1">
                                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                                    Certified
                                </span>
                            )}
                            {group.certificate?.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-100 border border-blue-500/30 backdrop-blur-md shadow-sm">
                                    Verification Pending
                                </span>
                            )}
                            {!group.certificate && isAdmin && (
                                <button 
                                    onClick={handleApplyCertificate}
                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-md transition-colors shadow-sm flex items-center gap-1"
                                    disabled={actionLoading}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Get Certified
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setEditGroupData({ 
                                        name: group.name, 
                                        description: group.description, 
                                        cover_photo: null,
                                        entry_fee_required: group.entry_fee_required || false,
                                        entry_fee_amount: group.entry_fee_amount || 0,
                                        custom_application_questions: group.custom_application_questions || []
                                    });
                                    setGroupSettings({
                                        requires_approval: group.requires_approval || false,
                                        allow_anonymous: group.allow_anonymous || false,
                                        transaction_trigger_role: group.transaction_trigger_role || 'any',
                                        approval_threshold: group.approval_threshold || 100,
                                        hierarchy_mode: group.hierarchy_mode || 'flat',
                                        accent_color: group.accent_color || '#6366f1',
                                        joining_minimum: group.joining_minimum || 0,
                                    });
                                    setNewQuestion('');
                                    setShowEditModal(true);
                                }}
                                className="p-1.5 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => navigate('/payments/groups')}
                            className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary">{group.name}</h1>
                            {(() => {
                                const tier = getGroupTier(members.length);
                                return (
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tier.color} flex items-center gap-1.5`}>
                                        <span>{tier.emoji}</span>
                                        <span>{tier.label}</span>
                                    </span>
                                );
                            })()}
                            {groupStatus?.is_matured && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Matured</span>
                            )}
                            {group.certificate?.status === 'approved' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                    <BadgeCheck className="w-4 h-4" />
                                    Certified
                                </span>
                            )}
                            {group.certificate?.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    Verification Pending
                                </span>
                            )}
                            {!group.certificate && isAdmin && (
                                <button 
                                    onClick={handleApplyCertificate}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1 border border-indigo-200"
                                    disabled={actionLoading}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Get Certified
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setEditGroupData({ 
                                        name: group.name, 
                                        description: group.description, 
                                        cover_photo: null,
                                        entry_fee_required: group.entry_fee_required || false,
                                        entry_fee_amount: group.entry_fee_amount || 0,
                                        custom_application_questions: group.custom_application_questions || []
                                    });
                                    setGroupSettings({
                                        requires_approval: group.requires_approval || false,
                                        allow_anonymous: group.allow_anonymous || false,
                                        transaction_trigger_role: group.transaction_trigger_role || 'any',
                                        approval_threshold: group.approval_threshold || 100,
                                        hierarchy_mode: group.hierarchy_mode || 'flat',
                                        accent_color: group.accent_color || '#6366f1',
                                        joining_minimum: group.joining_minimum || 0,
                                    });
                                    setNewQuestion('');
                                    setShowEditModal(true);
                                }}
                                className="p-1.5 rounded-full text-secondary hover:bg-secondary/10 hover:text-primary bg-secondary/5 border border-theme transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                <Card className={`relative z-20 border-theme shadow-md ${group.cover_photo ? '-mt-12 mx-4 md:mx-6' : 'mt-4'}`}>
                    <CardBody className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <p className="max-w-2xl text-sm md:text-base text-secondary">
                            {group.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                    </CardBody>
                </Card>
            </div>

            {/* Progress Card */}
            <Card className="border-theme shadow-sm mb-6">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-secondary text-sm mb-2">Group Balance</p>
                            <h2 className="text-4xl font-bold text-primary">
                                ${parseFloat(group.current_amount || 0).toFixed(2)}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-secondary text-sm mb-2">Target</p>
                            <h3 className="text-2xl font-bold text-primary">
                                ${parseFloat(group.target_amount || 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                    <div className="h-3 bg-secondary/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-secondary">
                        <span className="font-medium text-primary-600">{progress.toFixed(1)}% complete</span>
                        <span>{members.length} members</span>
                    </div>
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 border-b-2 border-emerald-100 dark:border-emerald-900/30 overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'contributions', label: 'Contributions', icon: History },
                    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
                    { id: 'withdrawals', label: 'Withdrawals', icon: Download },
                    { id: 'kitties', label: 'Kitties', icon: Wallet },
                    { id: 'piggybanks', label: 'Piggy Banks', icon: PiggyBank },
                    { id: 'donations', label: 'Donations', icon: HeartHandshake },
                    { id: 'discourse', label: 'Discourse', icon: MessageCircle },
                    { id: 'rounds', label: 'Rounds', icon: CalendarIcon },
                    { id: 'investments', label: 'Investments', icon: TrendingUp },
                    { id: 'ventures', label: 'Ventures', icon: Zap },
                    { id: 'businesses', label: 'Businesses', icon: BookOpen },
                    { id: 'loans', label: 'Loans', icon: CreditCard },
                    { id: 'automations', label: 'Automations', icon: Smartphone },
                    { id: 'benefits', label: 'Benefits', icon: Percent },
                    { id: 'governance', label: 'Governance', icon: ShieldCheck },
                    { id: 'rules', label: 'Rules', icon: Shield },
                    { id: 'settings', label: 'Settings', icon: Settings },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-[2px] transition-all duration-200 whitespace-nowrap rounded-t-lg ${activeTab === tab.id
                            ? 'border-amber-500 text-emerald-700 dark:text-amber-400 bg-gradient-to-t from-amber-50/80 to-transparent dark:from-amber-900/10'
                            : 'border-transparent text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                        {tab.label}
                        {tab.id === 'approvals' && checkoutRequests.filter(req => req.status === 'pending').length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {checkoutRequests.filter(req => req.status === 'pending').length}
                            </span>
                        )}
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
                                {(() => {
                                    const tier = getGroupTier(members.length);
                                    return (
                                        <span className="font-medium text-primary flex items-center gap-1.5">
                                            {(() => { const TierIcon = TIER_ICONS[tier.icon]; return TierIcon ? <TierIcon className="w-3.5 h-3.5" /> : null; })()}
                                            <span>{tier.label}</span>
                                        </span>
                                    );
                                })()}
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

                    {/* Pitches & Propositions */}
                    {(group.investment_pitch || group.loan_proposition) && (
                        <Card className="md:col-span-2">
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary">Propositions</h3>
                            </CardHeader>
                            <CardBody className="p-4 space-y-4 bg-tertiary/5">
                                {group.investment_pitch && (
                                    <div>
                                        <h4 className="text-sm font-bold text-secondary uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Target className="w-4 h-4"/> Investment/Donation Pitch
                                        </h4>
                                        <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{group.investment_pitch}</p>
                                    </div>
                                )}
                                {group.loan_proposition && (
                                    <div>
                                        <h4 className="text-sm font-bold text-secondary uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Target className="w-4 h-4"/> Loan Proposition
                                        </h4>
                                        <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{group.loan_proposition}</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* Group Phases */}
                    {group.phases && group.phases.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary">Contribution Phases</h3>
                            </CardHeader>
                            <CardBody className="p-4 space-y-4">
                                {group.phases.map((phase) => {
                                    const pProgress = parseFloat(phase.target_amount) > 0 
                                        ? Math.min(100, (parseFloat(group.current_amount || 0) / parseFloat(phase.target_amount)) * 100)
                                        : 0;
                                    return (
                                        <div key={phase.id} className="p-4 border border-theme rounded-xl bg-elevated">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-primary">{phase.name}</h4>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                                                    {phase.proportion}% of Total
                                                </span>
                                            </div>
                                            {phase.description && <p className="text-sm text-secondary mb-3">{phase.description}</p>}
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-lg font-bold text-primary">${parseFloat(phase.target_amount || 0).toFixed(2)} Target</span>
                                                <span className="text-sm font-medium text-primary-600">{pProgress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pProgress}%` }} />
                                            </div>
                                            <div className="flex justify-between mt-2 text-[10px] text-tertiary">
                                                <span>{phase.start_date ? formatDate(phase.start_date) : 'Start'}</span>
                                                <span>{phase.end_date ? formatDate(phase.end_date) : 'End'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardBody>
                        </Card>
                    )}
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
                                {members.map((member, idx) => {
                                    const isCurrentUserAdmin = members.some(m =>
                                        (m.user === user?.id || m.payment_profile?.user?.id === user?.id) && m.is_admin
                                    );
                                    return (
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
                                                    {member.role && member.role !== 'member' && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            member.role === 'admin' ? 'bg-yellow-100 text-yellow-700' :
                                                            member.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {member.role}
                                                        </span>
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
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-medium text-primary">
                                                    ${parseFloat(member.total_contributed || 0).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-secondary">contributed</p>
                                            </div>
                                            {isCurrentUserAdmin && !member.is_anonymous && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setRoleMenuMember(roleMenuMember === member.id ? null : member.id)}
                                                        className="p-1.5 rounded-lg hover:bg-secondary/10 transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-secondary" />
                                                    </button>
                                                    {roleMenuMember === member.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-40 bg-elevated border border-theme rounded-xl shadow-lg z-20 overflow-hidden">
                                                            {['admin', 'moderator', 'member'].map(role => (
                                                                <button
                                                                    key={role}
                                                                    onClick={() => handleUpdateMemberRole(member.id, role)}
                                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                                                        member.role === role
                                                                            ? 'bg-primary/10 text-primary font-medium'
                                                                            : 'text-secondary hover:bg-secondary/5'
                                                                    }`}
                                                                >
                                                                    {role === 'admin' && <Crown className="w-3.5 h-3.5" />}
                                                                    {role === 'moderator' && <ShieldCheck className="w-3.5 h-3.5" />}
                                                                    {role === 'member' && <Users className="w-3.5 h-3.5" />}
                                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                                    {member.role === role && <Check className="w-3 h-3 ml-auto" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
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
            {activeTab === 'piggybanks' && <GroupPiggyBanksTab groupId={groupId} />}

            {
                activeTab === 'analytics' && groupAnalytics && (
                    <div className="space-y-4">
                        <Card className="border-theme bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <CardBody className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                                        <TrendingUp className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary">Group Financial Analytics</h3>
                                        <p className="text-sm text-secondary mt-1">View charts, contribution trends, and member activity.</p>
                                    </div>
                                </div>
                                <Button variant="primary" onClick={() => navigate(`/payments/groups/${groupId}/analytics`)}>
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Open Full Analytics
                                </Button>
                            </CardBody>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardBody className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Total Raised</p>
                                        <h3 className="text-xl font-bold text-primary">{formatMoneySimple(groupAnalytics.total_contributed)}</h3>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Progress</p>
                                        <h3 className="text-xl font-bold text-primary">{groupAnalytics.progress}%</h3>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary">Members</p>
                                        <h3 className="text-xl font-bold text-primary">{groupAnalytics.total_members}</h3>
                                        <p className="text-xs text-secondary mt-1 capitalize">{groupAnalytics.capacity_category} Tier</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        
                        <Card>
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary">Top Contributors</h3>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="divide-y divide-theme">
                                    {groupAnalytics.top_contributors.map((user, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-primary font-bold">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium text-primary">{user.name}</span>
                                            </div>
                                            <span className="font-semibold text-emerald-600">{formatMoneySimple(user.contributed)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {
                activeTab === 'rules' && (
                    <Card>
                        <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Group Rules & Guidelines
                            </h3>
                            {isAdmin && !isEditingRules && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setEditRulesText(groupRules);
                                    setIsEditingRules(true);
                                }}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Rules
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody className="p-6">
                            {isEditingRules ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={editRulesText}
                                        onChange={(e) => setEditRulesText(e.target.value)}
                                        placeholder="Enter the rules and guidelines for this group..."
                                        className="w-full h-48 px-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsEditingRules(false)}>Cancel</Button>
                                        <Button variant="primary" onClick={async () => {
                                            try {
                                                const res = await paymentsService.updateGroupRules(groupId, editRulesText);
                                                setGroupRules(res.rules_text);
                                                setIsEditingRules(false);
                                                toast.success('Rules updated successfully');
                                            } catch (error) {
                                                toast.error('Failed to update rules');
                                            }
                                        }}>Save Rules</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none text-secondary whitespace-pre-wrap">
                                    {groupRules || "No rules have been set for this group yet."}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )
            }

            {activeTab === 'kitties' && <GroupKittiesTab groupId={groupId} />}
            {activeTab === 'rounds' && <GroupRoundsTab groupId={groupId} />}
            {activeTab === 'withdrawals' && <GroupWithdrawalsTab groupId={groupId} isAdmin={isAdmin} />}
            {activeTab === 'donations' && <GroupDonationsTab groupId={groupId} />}
            {activeTab === 'investments' && <GroupInvestmentsTab groupId={groupId} />}
            {activeTab === 'ventures' && <GroupVenturesTab groupId={groupId} />}
            {activeTab === 'businesses' && <GroupBusinessesTab groupId={groupId} />}
            {activeTab === 'loans' && <GroupLoansTab groupId={groupId} />}
            {activeTab === 'automations' && <GroupAutomationsTab groupId={groupId} />}
            {activeTab === 'settings' && <GroupSettingsTab groupId={groupId} isAdmin={isAdmin} groupData={group} onUpdate={loadGroupData} />}
            {activeTab === 'benefits' && <GroupBenefitRulesTab groupId={groupId} isAdmin={isAdmin} />}
            {activeTab === 'governance' && <GroupGovernanceTab groupId={groupId} />}

            {
                activeTab === 'approvals' && (
                    <Card>
                        <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                            <h3 className="font-semibold text-primary">Checkout Requests</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            {checkoutRequests.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                    <p className="text-secondary">No pending checkout requests.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {checkoutRequests.map((req, idx) => (
                                        <div key={idx} className="p-4 flex flex-col items-start md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                    req.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                    {req.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                                     req.status === 'approved' ? <CheckCircle className="w-5 h-5" /> :
                                                     <XCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-primary">
                                                            {formatMoneySimple(req.amount)}
                                                        </p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-secondary flex items-center gap-2 mt-2 flex-wrap">
                                                        <span>Requested by</span>
                                                        <div className="flex items-center gap-1.5 bg-secondary/5 pr-2 rounded-full border border-theme overflow-hidden">
                                                            {req.initiator_profile_picture ? (
                                                                <img src={req.initiator_profile_picture} alt="profile" className="w-6 h-6 object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                                    {req.initiator_name.charAt(0)}
                                                                </div>
                                                            )}
                                                            {req.initiator_username ? (
                                                                <Link to={`/profile/${req.initiator_username}`} className="font-medium text-primary hover:underline text-xs">
                                                                    {req.initiator_name}
                                                                </Link>
                                                            ) : (
                                                                <span className="font-medium text-primary text-xs">{req.initiator_name}</span>
                                                            )}
                                                        </div>
                                                        <span>on {formatDate(req.created_at)}</span>
                                                    </div>
                                                    {req.recipient_info && (
                                                        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-secondary/5 rounded-lg border border-theme inline-flex">
                                                            <span className="text-xs text-secondary font-medium">To:</span>
                                                            {req.recipient_info.profile_picture ? (
                                                                <img src={req.recipient_info.profile_picture} alt="recipient" className="w-5 h-5 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border border-theme bg-white flex items-center justify-center text-[10px] font-bold text-primary">
                                                                    {req.recipient_info.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                            {req.recipient_info.type === 'funding' && req.recipient_info.id ? (
                                                                <Link to={`/funding/business/${req.recipient_info.id}`} className="text-sm font-medium text-primary hover:underline hover:text-blue-600">
                                                                    {req.recipient_info.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-sm font-medium text-primary">{req.recipient_info.name}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-xs text-secondary">
                                                        {req.snapshots?.items_payload ? (
                                                            <div className="bg-secondary/10 px-3 py-2 rounded-lg inline-block">
                                                                <span className="text-[10px] uppercase font-bold text-secondary flex items-center gap-1 mb-1"><ShieldCheck className="w-3 h-3" /> Locked Snapshot</span>
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {req.snapshots.items_payload.map((item, i) => (
                                                                        <li key={i}>{item.name} (x{item.qty || 1}) - {formatMoneySimple(item.price || 0)}</li>
                                                                    ))}
                                                                </ul>
                                                                <div className="mt-1 font-bold text-primary">Snapshot Amount: {formatMoneySimple(req.snapshots.amount)}</div>
                                                            </div>
                                                        ) : req.items_payload && req.items_payload.length > 0 && (
                                                            <div className="bg-secondary/10 px-3 py-2 rounded-lg inline-block">
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {req.items_payload.map((item, i) => (
                                                                        <li key={i}>{item.name} (x{item.qty || 1})</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Notes Display */}
                                                    {(req.approval_notes || req.rejection_notes) && (
                                                        <div className="mt-3 space-y-2">
                                                            {req.approval_notes && (
                                                                <div className="p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 text-xs text-green-800 dark:text-green-200">
                                                                    <span className="font-bold">Approval Notes:</span>
                                                                    <pre className="whitespace-pre-wrap font-sans mt-1">{req.approval_notes}</pre>
                                                                </div>
                                                            )}
                                                            {req.rejection_notes && (
                                                                <div className="p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 text-xs text-red-800 dark:text-red-200">
                                                                    <span className="font-bold">Rejection Notes:</span>
                                                                    <pre className="whitespace-pre-wrap font-sans mt-1">{req.rejection_notes}</pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-xs font-medium text-primary">
                                                        Approvals: <span className="text-green-600">{req.approvals_count}</span>{' / '}
                                                        Rejections: <span className="text-red-600">{req.rejections_count}</span>{' / '}
                                                        Required: {req.total_members}
                                                    </div>
                                                </div>
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
                                                    <Button variant="outline" size="sm" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50" onClick={() => {
                                                        setRejectingRequest(req);
                                                        setRejectNotes('');
                                                        setShowRejectModal(true);
                                                    }} disabled={actionLoading}>
                                                        <X className="w-4 h-4 mr-1.5" /> Reject
                                                    </Button>
                                                    <Button variant="primary" size="sm" className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                                        setApprovingRequest(req);
                                                        setDeliveryAccount('');
                                                        setApprovalNotes('');
                                                        setShowApprovalModal(true);
                                                    }} disabled={actionLoading}>
                                                        <Check className="w-4 h-4 mr-1.5" /> Approve
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )
            }

            {/* Discourse Tab */}
            {activeTab === 'discourse' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GroupDiscourse 
                        groupId={groupId} 
                        isAdmin={isAdmin} 
                    />
                </div>
            )}

            {/* Invite Modal */}
            <GroupInviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                groupId={groupId}
                groupName={group?.name}
                onInviteSent={() => {
                    // Optionally refresh members list if needed, 
                    // though invitations are pending and won't show in members yet
                }}
            />

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

            {/* Edit Group Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Edit Group</h2>
                                    <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateGroup} className="space-y-4">
                                    <div className="flex flex-col items-center gap-4 mb-4">
                                        <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-theme flex flex-col items-center justify-center overflow-hidden bg-secondary/5 group transition-colors hover:border-primary/50 cursor-pointer">
                                            {editGroupData.cover_photo && typeof editGroupData.cover_photo !== 'string' ? (
                                                <img src={URL.createObjectURL(editGroupData.cover_photo)} alt="Cover preview" className="w-full h-full object-cover" />
                                            ) : group.cover_photo ? (
                                                <img src={group.cover_photo} alt="Current cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-secondary group-hover:text-primary transition-colors">
                                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                    <span className="text-sm font-medium">Click to upload cover</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                <Camera className="w-6 h-6 mb-1" />
                                                <span className="text-xs font-semibold">Change Photo</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setEditGroupData({ ...editGroupData, cover_photo: e.target.files[0] });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <Input
                                        label="Group Name"
                                        value={editGroupData.name}
                                        onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                        <textarea
                                            value={editGroupData.description}
                                            onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                        />
                                    </div>
                                    
                                    <div className="pt-2 border-t border-theme">
                                        <h3 className="text-sm font-semibold text-primary mb-3 text-indigo-500">Joining Requirements</h3>
                                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={editGroupData.entry_fee_required}
                                                onChange={(e) => setEditGroupData({ ...editGroupData, entry_fee_required: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-secondary/10 border-theme"
                                            />
                                            <span className="text-sm font-medium text-primary">Require Entry Fee</span>
                                        </label>
                                        
                                        {editGroupData.entry_fee_required && (
                                            <div className="mb-4 ml-6">
                                                <Input
                                                    label="Entry Fee Amount ($)"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={editGroupData.entry_fee_amount}
                                                    onChange={(e) => setEditGroupData({ ...editGroupData, entry_fee_amount: parseFloat(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-secondary mb-2">Custom Application Questions</label>
                                            <div className="space-y-2 mb-3">
                                                {editGroupData.custom_application_questions.map((question, index) => (
                                                    <div key={index} className="flex items-center gap-2 bg-secondary/5 px-3 py-2 rounded border border-theme">
                                                        <span className="text-sm text-primary flex-1">{question}</span>
                                                        <button 
                                                            type="button" 
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => {
                                                                const newQs = [...editGroupData.custom_application_questions];
                                                                newQs.splice(index, 1);
                                                                setEditGroupData({ ...editGroupData, custom_application_questions: newQs });
                                                            }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Add a custom question..."
                                                    value={newQuestion}
                                                    onChange={(e) => setNewQuestion(e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => {
                                                        if (newQuestion.trim()) {
                                                            setEditGroupData({
                                                                ...editGroupData,
                                                                custom_application_questions: [...editGroupData.custom_application_questions, newQuestion.trim()]
                                                            });
                                                            setNewQuestion('');
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction & Security Settings */}
                                    <div className="pt-2 border-t border-theme">
                                        <h3 className="text-sm font-semibold text-primary mb-3 text-emerald-500 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4" /> Transaction & Security
                                        </h3>
                                        
                                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={groupSettings.requires_approval}
                                                onChange={(e) => setGroupSettings({ ...groupSettings, requires_approval: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-secondary/10 border-theme"
                                            />
                                            <span className="text-sm font-medium text-primary">Require Checkout Approval</span>
                                        </label>

                                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={groupSettings.allow_anonymous}
                                                onChange={(e) => setGroupSettings({ ...groupSettings, allow_anonymous: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-secondary/10 border-theme"
                                            />
                                            <span className="text-sm font-medium text-primary">Allow Anonymous Members</span>
                                        </label>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-secondary mb-1">Trigger Role</label>
                                                <select
                                                    value={groupSettings.transaction_trigger_role}
                                                    onChange={(e) => setGroupSettings({ ...groupSettings, transaction_trigger_role: e.target.value })}
                                                    className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                >
                                                    <option value="any">Any Member</option>
                                                    <option value="admin">Admin Only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-secondary mb-1">Hierarchy Mode</label>
                                                <select
                                                    value={groupSettings.hierarchy_mode}
                                                    onChange={(e) => setGroupSettings({ ...groupSettings, hierarchy_mode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                >
                                                    <option value="flat">Flat</option>
                                                    <option value="tiered">Tiered</option>
                                                    <option value="democratic">Democratic</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <Input
                                                label="Approval Threshold (%)"
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={groupSettings.approval_threshold}
                                                onChange={(e) => setGroupSettings({ ...groupSettings, approval_threshold: parseInt(e.target.value) || 100 })}
                                            />
                                            <Input
                                                label="Joining Min ($)"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={groupSettings.joining_minimum}
                                                onChange={(e) => setGroupSettings({ ...groupSettings, joining_minimum: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <label className="block text-xs font-medium text-secondary">Accent Color</label>
                                            <input
                                                type="color"
                                                value={groupSettings.accent_color}
                                                onChange={(e) => setGroupSettings({ ...groupSettings, accent_color: e.target.value })}
                                                className="w-8 h-8 rounded cursor-pointer border border-theme"
                                            />
                                            <span className="text-xs text-tertiary">{groupSettings.accent_color}</span>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full mt-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                            onClick={handleUpdateSettings}
                                            disabled={settingsLoading}
                                        >
                                            {settingsLoading ? 'Saving Settings...' : 'Save Settings'}
                                        </Button>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="flex-1"
                                            disabled={!editGroupData.name || editGroupLoading}
                                        >
                                            {editGroupLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
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
                                        <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
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
            {/* Delivery Account Approval Modal */}
            {
                showApprovalModal && approvingRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary">Confirm Approval Details</h2>
                                    <button onClick={() => { setShowApprovalModal(false); setApprovingRequest(null); }} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-secondary">
                                        Please confirm your delivery account and amount share for this checkout.
                                    </p>
                                    
                                    <Input
                                        label="Delivery Account"
                                        type="text"
                                        value={deliveryAccount}
                                        onChange={(e) => setDeliveryAccount(e.target.value)}
                                        placeholder="Enter account/phone number"
                                        required
                                    />

                                    <Input
                                        label="Confirmation Amount"
                                        type="number"
                                        value={parseFloat(approvingRequest.amount / (approvingRequest.total_members || 1)).toFixed(2)}
                                        readOnly
                                    />
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Approval Notes (optional)</label>
                                        <textarea
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Add notes for this approval..."
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => { setShowApprovalModal(false); setApprovingRequest(null); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={() => {
                                                const memberAmount = parseFloat(approvingRequest.amount / (approvingRequest.total_members || 1));
                                                handleReviewRequest(approvingRequest.id, 'approve', { 
                                                    member_delivery_account: deliveryAccount,
                                                    member_amount: memberAmount,
                                                    notes: approvalNotes
                                                });
                                                setShowApprovalModal(false);
                                                setApprovingRequest(null);
                                                setApprovalNotes('');
                                            }}
                                            disabled={!deliveryAccount || actionLoading}
                                        >
                                            {actionLoading ? 'Approving...' : 'Confirm Approve'}
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Reject Modal */}
            {
                showRejectModal && rejectingRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                        <Card className="w-full max-w-md">
                            <CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-red-600">Reject Checkout Request</h2>
                                    <button onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }} className="p-1 hover:bg-secondary/10 rounded">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-secondary">
                                        Are you sure you want to reject this request for {formatMoneySimple(rejectingRequest.amount)}?
                                    </p>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Reason for rejection (optional)</label>
                                        <textarea
                                            value={rejectNotes}
                                            onChange={(e) => setRejectNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Explain why you are rejecting..."
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1 !bg-red-600 hover:!bg-red-700 text-white"
                                            onClick={() => {
                                                handleReviewRequest(rejectingRequest.id, 'reject', { notes: rejectNotes });
                                                setShowRejectModal(false);
                                                setRejectingRequest(null);
                                                setRejectNotes('');
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                                        </Button>
                                    </div>
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
