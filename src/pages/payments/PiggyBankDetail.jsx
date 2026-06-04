import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, ArrowLeft, Calendar, DollarSign, Check, Users, AlertCircle, PiggyBank, Briefcase, Lock, Unlock, TrendingUp,
    Activity, ArrowRightCircle, ShieldCheck, Clock, CheckCircle2, History, Crown, X, Info, Split, Vote, Settings, Zap, ShoppingCart, GraduationCap, UsersRound, Heart,
    ArrowDownCircle, UserCheck, UserMinus, BarChart2, TrendingDown, ChevronDown, ChevronRight, User, ArrowRightLeft, GitMerge, CalendarDays, Smile
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { renderContentWithEmojis } from '../../utils/emoji';
import { emojiData, Picker } from '../../utils/emojiData';

const PiggyBankDetail = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const [piggy, setPiggy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [contributeAmount, setContributeAmount] = useState('');
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [memberStats, setMemberStats] = useState(null);
    const [conversionStatus, setConversionStatus] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'analytics'
    const [claimLoading, setClaimLoading] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawStep, setWithdrawStep] = useState('input'); // 'input' | 'confirm'
    const [actionRequests, setActionRequests] = useState([]);
    const [votingLoading, setVotingLoading] = useState(false);
    const [expandedReqId, setExpandedReqId] = useState(null);

    // Lock state
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockType, setLockType] = useState('locked');
    const [lockMaturityDate, setLockMaturityDate] = useState('');
    const [lockLoading, setLockLoading] = useState(false);

    // Merge state
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [availableForMerge, setAvailableForMerge] = useState([]);
    const [mergeForm, setMergeForm] = useState({ source_ids: [], reason: '' });
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeRequests, setMergeRequests] = useState([]);
    const [mergeRequestsLoading, setMergeRequestsLoading] = useState(false);
    
    // Conversion form state
    const [conversionForm, setConversionForm] = useState({
        conversion_type: 'full',
        approval_mode: 'unanimous',
        reason: '',
        new_group_name: '',
        new_piggy_name: '',
        new_piggy_target: ''
    });
    
    // Settings/Automation state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaveReason, setLeaveReason] = useState('');
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        description: '',
        visibility: 'group',
        automation_trigger: 'manual',
        automation_action: 'wallet',
        automation_target_type: '',
        automation_target_id: '',
        automation_target_name: '',
        automation_amount: '',
        automation_date: '',
        // Withdrawal constraints
        min_withdrawal_amount: '',
        max_withdrawal_amount: '',
        max_withdrawals_per_day: '',
        require_min_balance: '',
        require_min_savings_period_days: '',
        require_min_member_age_days: '',
        require_min_contribution_amount: '',
        leave_requires_vote: false,
        leave_inconvenience_fee_percentage: '0',
        leave_vote_waives_penalty: true
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [emojiPickerField, setEmojiPickerField] = useState(null);
    
    // Search state for automation targets
    const [targetSearchQuery, setTargetSearchQuery] = useState('');
    const [targetSearchResults, setTargetSearchResults] = useState({ products: [], services: [], courses: [], groups: [], investments: [], donations: [] });
    const [targetSearchLoading, setTargetSearchLoading] = useState(false);
    const [showTargetSearch, setShowTargetSearch] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        let piggyData = null;
        try {
            piggyData = await paymentsService.getPiggyBankById(id);
            setPiggy(piggyData);
            
            // Parallel fetch analytics, member stats, and status — isolate errors so one doesn't block others
            const safeFetch = (p) => p.catch(e => { console.warn('Fetch warning:', e); return null; });
            const [analyticsData, memberStatsData, statusData] = await Promise.all([
                piggyData.is_member ? safeFetch(paymentsService.getPiggyAnalytics(id)) : Promise.resolve(null),
                (piggyData.type === 'group' && !piggyData.is_member)
                    ? safeFetch(paymentsService.getPiggyMemberStats(id))
                    : Promise.resolve(null),
                (piggyData.payment_group && piggyData.is_member) ? safeFetch(paymentsService.getPiggyConversionStatus(id)) : Promise.resolve(null),
            ]);
            setAnalytics(analyticsData);
            setMemberStats(memberStatsData);
            setConversionStatus(statusData);
        } catch (err) {
            console.error('Error loading Piggy Bank details:', err);
            setError('Failed to load Piggy Bank details.');
        } finally {
            setLoading(false);
        }

        if (!piggyData) return;

        // Load pending action requests for group piggy banks
        try {
            const requests = await paymentsService.getPiggyBankActionRequests(id);
            setActionRequests(Array.isArray(requests) ? requests : []);
        } catch {
            // Non-critical — silently ignore
        }

        // Load merge-related data for group piggy banks (members only)
        try {
            if (piggyData.payment_group && piggyData.is_member) {
                const [available, requests] = await Promise.all([
                    paymentsService.getAvailableForMerge(id),
                    paymentsService.getMyMergeRequests(id)
                ]);
                setAvailableForMerge(Array.isArray(available) ? available : []);
                setMergeRequests(Array.isArray(requests) ? requests : []);
            }
        } catch {
            // Non-critical — silently ignore
        }
    };

    const handleRequestConversion = async (e) => {
        if (e) e.preventDefault();
        setIsConverting(true);
        try {
            const payload = {
                conversion_type: conversionForm.conversion_type,
                approval_mode: conversionForm.approval_mode,
                reason: conversionForm.reason,
                new_group_name: conversionForm.new_group_name,
                new_piggy_name: conversionForm.new_piggy_name,
                new_piggy_target: conversionForm.new_piggy_target ? parseFloat(conversionForm.new_piggy_target) : null
            };
            const res = await paymentsService.requestPiggyConversion(id, payload);
            setShowConversionModal(false);
            toast.success('Conversion request submitted');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to request conversion');
        } finally {
            setIsConverting(false);
        }
    };
    
    const handleVoteConversion = async (requestId, vote) => {
        setIsConverting(true);
        try {
            const res = await paymentsService.votePiggyConversion(id, requestId, vote);
            toast.success(vote === 'approve' ? 'Vote recorded: Approved' : 'Vote recorded: Rejected');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to record vote');
        } finally {
            setIsConverting(false);
        }
    };

    const openSettings = () => {
        if (!piggy) return;
        setSettingsForm({
            name: piggy.name || '',
            description: piggy.description || '',
            visibility: piggy.visibility || 'group',
            automation_trigger: piggy.automation_trigger || 'manual',
            automation_action: piggy.automation_action || 'wallet',
            automation_target_type: piggy.automation_target_type || '',
            automation_target_id: piggy.automation_target_id || '',
            automation_target_name: piggy.automation_target_name || '',
            automation_amount: piggy.automation_amount ? String(piggy.automation_amount) : '',
            min_withdrawal_amount: piggy.min_withdrawal_amount ? String(piggy.min_withdrawal_amount) : '',
            max_withdrawal_amount: piggy.max_withdrawal_amount ? String(piggy.max_withdrawal_amount) : '',
            max_withdrawals_per_day: piggy.max_withdrawals_per_day ? String(piggy.max_withdrawals_per_day) : '',
            require_min_balance: piggy.require_min_balance ? String(piggy.require_min_balance) : '',
            require_min_savings_period_days: piggy.require_min_savings_period_days ? String(piggy.require_min_savings_period_days) : '',
            require_min_member_age_days: piggy.require_min_member_age_days ? String(piggy.require_min_member_age_days) : '',
            require_min_contribution_amount: piggy.require_min_contribution_amount ? String(piggy.require_min_contribution_amount) : '',
            leave_requires_vote: piggy.leave_requires_vote ?? false,
            leave_inconvenience_fee_percentage: piggy.leave_inconvenience_fee_percentage ? String(piggy.leave_inconvenience_fee_percentage) : '0',
            leave_vote_waives_penalty: piggy.leave_vote_waives_penalty ?? true
        });
        setShowSettingsModal(true);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        try {
            const payload = {
                name: settingsForm.name,
                description: settingsForm.description,
                visibility: settingsForm.visibility,
                automation_trigger: settingsForm.automation_trigger,
                automation_action: settingsForm.automation_action,
                automation_target_type: settingsForm.automation_target_type || null,
                automation_target_id: settingsForm.automation_target_id || null,
                automation_target_name: settingsForm.automation_target_name || null,
                automation_amount: settingsForm.automation_amount ? parseFloat(settingsForm.automation_amount) : null,
                min_withdrawal_amount: settingsForm.min_withdrawal_amount ? parseFloat(settingsForm.min_withdrawal_amount) : null,
                max_withdrawal_amount: settingsForm.max_withdrawal_amount ? parseFloat(settingsForm.max_withdrawal_amount) : null,
                max_withdrawals_per_day: settingsForm.max_withdrawals_per_day ? parseInt(settingsForm.max_withdrawals_per_day) : null,
                require_min_balance: settingsForm.require_min_balance ? parseFloat(settingsForm.require_min_balance) : null,
                require_min_savings_period_days: settingsForm.require_min_savings_period_days ? parseInt(settingsForm.require_min_savings_period_days) : null,
                require_min_member_age_days: settingsForm.require_min_member_age_days ? parseInt(settingsForm.require_min_member_age_days) : null,
                require_min_contribution_amount: settingsForm.require_min_contribution_amount ? parseFloat(settingsForm.require_min_contribution_amount) : null,
                leave_requires_vote: settingsForm.leave_requires_vote,
                leave_inconvenience_fee_percentage: settingsForm.leave_inconvenience_fee_percentage ? parseFloat(settingsForm.leave_inconvenience_fee_percentage) : 0,
                leave_vote_waives_penalty: settingsForm.leave_vote_waives_penalty
            };
            await paymentsService.updatePiggySettings(id, payload);
            toast.success('Settings updated successfully');
            setShowSettingsModal(false);
            // Optimistically update local state so changes reflect immediately
            setPiggy(prev => prev ? { ...prev, name: settingsForm.name, description: settingsForm.description } : prev);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleTargetSearch = async (query) => {
        if (!query || query.length < 2) {
            setTargetSearchResults({ products: [], services: [], courses: [], groups: [], investments: [], donations: [] });
            return;
        }
        setTargetSearchLoading(true);
        try {
            const results = await paymentsService.searchAutomationTargets(query, 'all');
            setTargetSearchResults(results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setTargetSearchLoading(false);
        }
    };

    const handleSelectTarget = (target) => {
        setSettingsForm({
            ...settingsForm,
            automation_target_type: target.type,
            automation_target_id: target.id,
            automation_target_name: target.name,
            automation_date: settingsForm.automation_date || ''
        });
        setShowTargetSearch(false);
        setTargetSearchQuery('');
    };

    const handleLock = async () => {
        setLockLoading(true);
        try {
            const maturityDate = lockType === 'locked_time' ? lockMaturityDate : null;
            await paymentsService.lockPiggyBank(id, lockType, maturityDate);
            toast.success('Piggy bank locked successfully');
            setShowLockModal(false);
            setLockType('locked');
            setLockMaturityDate('');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to lock piggy bank');
        } finally {
            setLockLoading(false);
        }
    };

    const handleUnlock = async () => {
        setLockLoading(true);
        try {
            await paymentsService.unlockPiggyBank(id);
            toast.success('Piggy bank unlocked successfully');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to unlock piggy bank');
        } finally {
            setLockLoading(false);
        }
    };

    const handleExecuteAutomation = async () => {
        if (!piggy || piggy.automation_executed) return;
        
        setSettingsLoading(true);
        try {
            const result = await paymentsService.executePiggyAutomation(id);
            if (result.next_step) {
                toast.success(result.message);
                if (result.next_step === 'redirect_to_product') {
                    navigate(`/shop/products/${result.product_id}`);
                } else if (result.next_step === 'redirect_to_service') {
                    navigate(`/services/${result.service_id}`);
                } else if (result.next_step === 'redirect_to_course') {
                    navigate(`/courses/${result.course_id}`);
                } else if (result.next_step === 'redirect_to_group') {
                    navigate(`/payments/groups/${result.group_id}`);
                }
            } else {
                toast.success('Automation executed successfully');
            }
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to execute automation');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleApproveConversion = async () => {
        const pendingReq = conversionStatus?.find(r => r.status === 'pending');
        if (!pendingReq) return;

        setIsConverting(true);
        try {
            await paymentsService.approvePiggyConversion(id, pendingReq.id);
            toast.success('Piggy bank converted to group funds successfully');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to approve conversion');
        } finally {
            setIsConverting(false);
        }
    };

    const handleContribute = (e) => {
        e.preventDefault();
        if (!contributeAmount || isNaN(contributeAmount)) return;

        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: piggy.id,
                    type: 'piggy_bank_contribution',
                    name: `Contribution to ${piggy.name}`,
                    price: parseFloat(contributeAmount),
                    qty: 1,
                    image: null
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(contributeAmount)
            }
        });
    };

    // Step 1 → Step 2: validate then show confirmation
    const handleWithdrawSubmit = (e) => {
        e.preventDefault();
        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) return;
        setWithdrawStep('confirm');
    };

    // Step 2 → API: user confirmed, now actually withdraw
    const handleWithdrawConfirm = async () => {
        if (!withdrawAmount || isNaN(withdrawAmount)) return;
        setClaimLoading(true);
        try {
            const res = await paymentsService.withdrawPiggyBank(id, withdrawAmount);

            // Group piggy bank → creates approval request, no immediate accounting
            if (res?.request_id) {
                toast.success('Withdrawal request submitted — awaiting group approval.');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setWithdrawStep('input');
                loadData();
                return;
            }

            // Individual piggy bank → executed immediately
            toast.success(
                res?.status === 'Withdrawal successful'
                    ? `$${parseFloat(withdrawAmount).toFixed(2)} withdrawn successfully to your wallet.`
                    : res?.status || 'Withdrawal successful!'
            );
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setWithdrawStep('input');
            loadData();
        } catch (error) {
            console.error('Withdraw failed:', error);
            toast.error(error.response?.data?.error || 'Failed to withdraw. Please try again.');
        } finally {
            setClaimLoading(false);
        }
    };

    const handleClaimFunds = async () => {
        setClaimLoading(true);
        try {
            const res = await paymentsService.withdrawPiggyBank(id, piggy.current_amount);
            toast.success(res?.message || 'Funds successfully claimed to your wallet!');
            loadData();
        } catch (error) {
            console.error('Claim failed:', error);
            toast.error(error.response?.data?.error || 'Failed to claim funds. Please try again.');
        } finally {
            setClaimLoading(false);
        }
    };

    const handleMergeSubmit = async (e) => {
        e.preventDefault();
        if (mergeForm.source_ids.length === 0) return;
        setMergeLoading(true);
        try {
            const res = await paymentsService.requestMerge(id, mergeForm.source_ids, mergeForm.reason);
            setShowMergeModal(false);
            setMergeForm({ source_ids: [], reason: '' });
            toast.success('Merge request submitted for group approval');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit merge request');
        } finally {
            setMergeLoading(false);
        }
    };

    const handleToggleMergeSource = (sourceId) => {
        setMergeForm(prev => {
            const source_ids = prev.source_ids.includes(sourceId)
                ? prev.source_ids.filter(sid => sid !== sourceId)
                : [...prev.source_ids, sourceId];
            return { ...prev, source_ids };
        });
    };

    const handleVoteAction = async (requestId, vote) => {
        setVotingLoading(requestId + vote);
        try {
            const res = await paymentsService.votePiggyBankAction(id, requestId, vote);
            if (res?.executed === false && res?.error) {
                toast.error(`Approved, but execution failed: ${res.error}`);
            } else if (res?.status?.includes('executed') || res?.executed === true) {
                toast.success('Withdrawal approved and executed — funds have been moved.');
            } else if (res?.status?.includes('rejected')) {
                toast.error('Withdrawal request rejected by the group.');
            } else {
                toast.success(res?.status || 'Vote recorded.');
            }
            loadData(); // refresh piggy balance + action requests
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to record vote.');
        } finally {
            setVotingLoading(false);
        }
    };

    const handleJoinPiggyBank = async () => {
        try {
            await paymentsService.joinPiggyBank(id);
            toast.success('Successfully joined this Piggy Bank!');
            loadData();
        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Failed to join piggy bank.';
            console.error('Join failed:', msg);
            toast.error(msg);
        }
    };

    const handleLeavePiggyBank = async () => {
        try {
            const res = await paymentsService.leavePiggyBank(id, { reason: leaveReason });
            if (res.request_id) {
                toast.success('Leave request created, pending group approval.');
            } else {
                toast.success('Successfully left the piggy bank');
            }
            setShowLeaveConfirm(false);
            loadData();
        } catch (error) {
            console.error('Leave failed:', error);
            toast.error(error.response?.data?.error || 'Failed to leave piggy bank.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !piggy) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{error || 'Piggy Bank not found'}</h3>
                <Button variant="primary" onClick={() => navigate(ROUTES.PIGGY_BANKS)}>
                    Return to Piggy Banks
                </Button>
            </div>
        );
    }

    const progress = piggy.target_amount > 0 
        ? Math.min(100, (parseFloat(piggy.current_amount || 0) / parseFloat(piggy.target_amount)) * 100) 
        : 0;
    const isAchieved = progress >= 100;

    return (
        <div className="max-w-5xl mx-auto space-y-6 lg:p-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(ROUTES.PIGGY_BANKS)}
                        className="p-2 rounded-xl bg-white shadow-sm border border-theme hover:bg-secondary/5 text-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                                {renderContentWithEmojis(piggy.name)}
                            </h1>
                            {piggy.status === 'inactive' ? (
                                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    Inactive
                                </span>
                            ) : isAchieved ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    <Check className="w-3 h-3" /> Goal Achieved
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    <TrendingUp className="w-3 h-3" /> Saving Active
                                </span>
                            )}
                        </div>
                        <p className="text-secondary mt-1 max-w-2xl text-sm md:text-base">{renderContentWithEmojis(piggy.description)}</p>
                        {analytics && (
                            <>
                                {analytics.merged_into_target && (
                                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                                        <GitMerge className="w-4 h-4 text-purple-500 shrink-0" />
                                        <p className="text-xs text-purple-700">
                                            This piggy bank was merged into{' '}
                                            <Link to={`/payments/piggy-banks/${analytics.merged_into_target.target_id}`}
                                                className="font-semibold underline hover:text-purple-900">
                                                {analytics.merged_into_target.target_name}
                                            </Link>
                                            {' '}— ${analytics.merged_into_target.amount?.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {analytics.merged_sources?.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                        <GitMerge className="w-4 h-4 text-blue-500 shrink-0" />
                                        <p className="text-xs text-blue-700">
                                            Merged from{' '}
                                            {analytics.merged_sources.map((src, idx) => (
                                                <span key={src.source_id}>
                                                    {idx > 0 && <span>, </span>}
                                                    <Link to={`/payments/piggy-banks/${src.source_id}`}
                                                        className="font-semibold underline hover:text-blue-900">
                                                        {src.source_name}
                                                    </Link>
                                                </span>
                                            ))}
                                            {' '}— ${analytics.total_merged_amount?.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-theme mb-2">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-bold text-sm transition-all relative ${
                        activeTab === 'overview' ? 'text-primary' : 'text-secondary hover:text-primary'
                    }`}
                >
                    Overview
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
                {piggy.is_member && (
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-3 font-bold text-sm transition-all relative ${
                            activeTab === 'analytics' ? 'text-primary' : 'text-secondary hover:text-primary'
                        }`}
                    >
                        Analytics & Trends
                        {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                    </button>
                )}

            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Main Progress Board */}
                <Card className="md:col-span-8 border-theme shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500"></div>
                    <CardBody className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-200 shadow-inner">
                                    <PiggyBank className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-secondary uppercase tracking-widest">Total Saved</p>
                                    <h2 className="text-4xl md:text-5xl font-black text-primary">
                                        ${parseFloat(piggy.current_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-right mt-4 md:mt-0 bg-secondary/5 px-6 py-3 rounded-2xl border border-theme">
                                <p className="text-sm font-semibold text-secondary uppercase tracking-widest">Target</p>
                                <h3 className="text-2xl font-bold text-primary opacity-80 mt-1">
                                    ${parseFloat(piggy.target_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                        </div>

                        {/* Rich Progress Bar */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end text-sm font-bold">
                                <span className={isAchieved ? "text-green-600" : "text-emerald-600"}>
                                    {progress.toFixed(1)}% Funded
                                </span>
                                <span className="text-secondary">
                                    ${Math.max(0, parseFloat(piggy.target_amount) - parseFloat(piggy.current_amount)).toLocaleString()} remaining
                                </span>
                            </div>
                            <div className="h-4 bg-secondary/20 rounded-full overflow-hidden shadow-inner p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden
                                        ${isAchieved ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}
                                    `}
                                    style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full skeleton-shimmer"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            {piggy.status === 'inactive' ? (
                                <Button variant="outline" disabled
                                    className="flex-1 text-lg !text-gray-400 !border-gray-200 !bg-gray-50 cursor-not-allowed">
                                    Dissolved
                                </Button>
                            ) : !isAchieved ? (
                                !piggy.is_member ? (
                                    <>
                                        <div className="flex gap-4 w-full">
                                            <Button variant="outline" disabled className="flex-1 text-lg !text-gray-400 !border-gray-200 !bg-gray-50 cursor-not-allowed">
                                                <DollarSign className="w-5 h-5" />
                                                Add Savings
                                            </Button>
                                            <Button variant="outline" disabled className="flex-1 text-lg !text-gray-400 !border-gray-200 !bg-gray-50 cursor-not-allowed">
                                                <DollarSign className="w-5 h-5" />
                                                Withdraw
                                            </Button>
                                        </div>
                                        <Button
                                            variant="primary"
                                            onClick={handleJoinPiggyBank}
                                            className="w-full text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            <Users className="w-5 h-5 mr-2" />
                                            Join to Start Saving
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowContributeModal(true)}
                                            className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            <DollarSign className="w-5 h-5" />
                                            Add Savings
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setWithdrawAmount(piggy.current_amount); setShowWithdrawModal(true); }}
                                            disabled={claimLoading || piggy.current_amount <= 0}
                                            className="flex-1 text-lg hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            <DollarSign className="w-5 h-5" />
                                            {claimLoading ? 'Withdrawing...' : 'Withdraw'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowLeaveConfirm(true)}
                                            className="text-lg !text-red-500 !border-red-200 hover:!bg-red-50 transition-transform hover:-translate-y-0.5"
                                        >
                                            Leave
                                        </Button>
                                    </>
                                )
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleClaimFunds}
                                    className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 !bg-green-600 hover:!bg-green-700"
                                    disabled={claimLoading || piggy.current_amount <= 0}
                                >
                                    <DollarSign className="w-5 h-5" />
                                    {claimLoading ? 'Claiming...' : 'Claim Funds'}
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Info Dashboard Area */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    <Card className="border-theme shadow-md flex-1">
                        <CardBody className="p-6 flex flex-col justify-between h-full">
                            <div>
                                <h4 className="font-bold text-primary mb-4 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-2 text-secondary" />
                                    Account Details
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-theme pb-3">
                                        <span className="text-sm text-secondary">Savings Type</span>
                                        <span className="font-semibold text-primary capitalize bg-primary/5 px-2 py-1 rounded">
                                            {piggy.savings_type ? piggy.savings_type.replace('_', ' ') : 'Normal'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-theme pb-3">
                                        <span className="text-sm text-secondary">Target Date</span>
                                        <span className="font-semibold text-primary flex items-center">
                                            {piggy.target_date ? (
                                                <>
                                                    <Calendar className="w-4 h-4 mr-1 text-secondary" />
                                                    {formatDate(piggy.target_date)}
                                                </>
                                            ) : 'No deadline'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-theme pb-3">
                                        <span className="text-sm text-secondary">Locking</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold flex items-center ${piggy.locking_status === 'locked' ? 'text-amber-600' : 'text-green-600'}`}>
                                                {piggy.locking_status === 'locked' ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                                                {piggy.locking_status === 'locked' ? 'Locked' : 'Flexible'}
                                            </span>
                                            {piggy.locking_status === 'locked' ? (
                                                <button
                                                    onClick={handleUnlock}
                                                    className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
                                                >
                                                    Unlock
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowLockModal(true)}
                                                    className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium"
                                                >
                                                    Lock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {piggy.visibility && (
                                        <div className="flex justify-between items-center border-b border-theme pb-3">
                                            <span className="text-sm text-secondary">Visibility</span>
                                            <span className="font-semibold text-primary capitalize bg-primary/5 px-2 py-1 rounded text-xs">
                                                {piggy.visibility}
                                            </span>
                                        </div>
                                    )}
                                                                    </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-theme">
                                <Button variant="outline" size="sm" className="w-full" onClick={openSettings}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                            </div>

                            {piggy.payment_group && (
                                <div className="mt-6 pt-4 border-t border-theme">
                                    <p className="text-xs text-secondary mb-2 font-bold uppercase tracking-wider">Linked Group</p>
                                    {!piggy.group_is_public && !piggy.is_member ? (
                                        <div className="p-3 bg-secondary/5 rounded-xl border border-theme flex flex-col items-center justify-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-secondary" />
                                                <span className="text-sm text-secondary font-medium">Private Group</span>
                                            </div>
                                            <p className="text-xs text-tertiary text-center px-2">Group details are hidden from non-members.</p>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/payments/groups/${piggy.payment_group}?tab=overview`)}
                                            className="w-full justify-center"
                                        >
                                            <Users className="w-4 h-4 mr-2 text-emerald-600" />
                                            View {piggy.group_name || 'Payment Group'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Discovery Card — member stats for non-members */}
                {memberStats && !piggy.is_member && (
                    <div className="md:col-span-8">
                        <Card className="border-theme shadow-md">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary text-sm flex items-center gap-2 mb-4">
                                    <PiggyBank className="w-4 h-4 text-primary" />
                                    {piggy.group_name || 'Group'} Piggy Bank
                                </h4>

                                {/* Mini progress bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-end text-xs font-semibold mb-1">
                                        <span className="text-primary">${parseFloat(piggy.current_amount || 0).toLocaleString()} saved</span>
                                        <span className="text-secondary">of ${parseFloat(piggy.target_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                            style={{ width: `${Math.min(100, (parseFloat(piggy.current_amount || 0) / parseFloat(piggy.target_amount || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                    <div>
                                        <span className="text-secondary">Members</span>
                                        <p className="font-semibold text-primary">{memberStats.member_count}</p>
                                    </div>
                                    <div>
                                        <span className="text-secondary">Avg contribution</span>
                                        <p className="font-semibold text-primary">${memberStats.average_contribution?.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-secondary">Total contributions</span>
                                        <p className="font-semibold text-primary">
                                            {memberStats.contribution_count != null ? memberStats.contribution_count : '-'}
                                            {memberStats.total_contributions != null && memberStats.total_contributions > 0
                                                ? ` · $${memberStats.total_contributions.toFixed(0)}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-secondary">Active for</span>
                                        <p className="font-semibold text-primary">
                                            {memberStats.created_days_ago != null
                                                ? `${memberStats.created_days_ago} day${memberStats.created_days_ago !== 1 ? 's' : ''}`
                                                : '-'}
                                        </p>
                                    </div>
                                    {memberStats.last_contribution_date && (
                                        <div>
                                            <span className="text-secondary">Last activity</span>
                                            <p className="font-semibold text-primary">{formatDate(memberStats.last_contribution_date)}</p>
                                        </div>
                                    )}
                                    {memberStats.member_nationalities?.length > 0 && (
                                        <div>
                                            <span className="text-secondary">Nationalities</span>
                                            <p className="font-semibold text-primary">
                                                {memberStats.member_nationalities.map((code, i) => (
                                                    <span key={code} className="inline-flex items-center gap-1 mr-1">
                                                        <span className={`fi fi-${code.toLowerCase()}`}></span>
                                                        {code}{i < memberStats.member_nationalities.length - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    )}
                                    {memberStats.top_contributor && (
                                        <div>
                                            <span className="text-secondary">Top contributor</span>
                                            <p className="font-semibold text-primary truncate">
                                                {memberStats.top_contributor.name} — ${memberStats.top_contributor.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                    {memberStats.bottom_contributor && memberStats.bottom_contributor.amount > 0 && (
                                        <div>
                                            <span className="text-secondary">Bottom contributor</span>
                                            <p className="font-semibold text-primary truncate">
                                                {memberStats.bottom_contributor.name} — ${memberStats.bottom_contributor.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                    {memberStats.group_conversion_status && (
                                        <div>
                                            <span className="text-secondary">Group conversion</span>
                                            <p className={`font-semibold capitalize ${memberStats.group_conversion_status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {memberStats.group_conversion_status}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* ── Additional Actions (members only) ── */}
                {piggy.payment_group && piggy.is_member && (
                    <div className="md:col-span-12">
                        <Card className="border-theme shadow-md">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-secondary" />
                                    Piggy Bank Actions
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowMergeModal(true)}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <GitMerge className="w-4 h-4" />
                                        Request Merge
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setWithdrawAmount(''); setShowWithdrawModal(true); }}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <CalendarDays className="w-4 h-4" />
                                        Extend Maturity
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setWithdrawAmount(''); setShowWithdrawModal(true); }}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Dissolve
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* ── Merge Requests ── */}
                {piggy.payment_group && piggy.is_member && mergeRequests.length > 0 && (
                    <div className="md:col-span-12">
                        <Card className="border-blue-500/30 shadow-md bg-blue-500/5">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                    <GitMerge className="w-5 h-5 text-blue-500" />
                                    Merge Requests
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-600 rounded-full">
                                        {mergeRequests.length}
                                    </span>
                                </h4>
                                <div className="space-y-3">
                                    {mergeRequests.map(req => (
                                        <div key={req.id} className="flex flex-col p-4 rounded-xl bg-secondary/5 border border-theme">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-primary">
                                                            {req.action_type === "merge" ? `Merge into ${req.piggy_bank_name || "this kitty"}` : req.action_type || "Merge"}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-blue-500/15 text-blue-600 rounded-full font-medium">
                                                            {req.status || "Pending"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-secondary">
                                                        Requested by <span className="font-semibold text-primary">{req.requested_by_name || "Member"}</span>
                                                        {req.reason && <span> “{req.reason}”</span>}
                                                    </p>
                                                    <p className="text-xs text-secondary">
                                                        {req.target_piggy_banks?.length || 0} source(s) selected · {req.voter_details?.length || 0} voted
                                                    </p>
                                                    {req.current_user_vote && (
                                                        <p className="text-xs font-semibold text-primary">
                                                            ✓ You voted: <span className={req.current_user_vote === "approve" ? "text-green-600" : "text-red-500"}>{req.current_user_vote}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {req.created_at && (
                                                <p className="text-[10px] text-tertiary mt-2">Created {new Date(req.created_at).toLocaleString()}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* ── Pending Action Requests (group piggy only) ── */}
                {piggy.payment_group && actionRequests.filter(r => r.status === "pending").length > 0 && (
                    <div className="md:col-span-12">
                        <Card className="border-amber-500/30 shadow-md bg-amber-500/5">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                    <Vote className="w-5 h-5 text-amber-500" />
                                    Pending Action Requests
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-600 rounded-full">
                                        {actionRequests.filter(r => r.status === "pending").length}
                                    </span>
                                </h4>
                                <div className="space-y-3">
                                    {actionRequests.filter(r => r.status === "pending").map(req => (
                                        <div key={req.id} className="flex flex-col p-4 rounded-xl bg-secondary/5 border border-theme">
                                            {/* Header row always visible */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-primary">
                                                            {req.action_type === "withdraw" ? `${parseFloat(req.amount).toFixed(2)} withdrawal` :
                                                             req.action_type === "extend_maturity" ? `Extend maturity${req.new_maturity_date ? " to " + new Date(req.new_maturity_date).toLocaleDateString() : ""}` :
                                                             req.action_type === "merge" ? `Merge into ${req.piggy_bank_name || "this kitty"}` :
                                                             req.action_type === "dissolve" ? "Dissolve piggy bank" :
                                                             req.action_type || "Action"}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-600 rounded-full font-medium">
                                                            {req.action_type?.replace(/_/g, " ") || "Pending"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-secondary">
                                                        Requested by <span className="font-semibold text-primary">{req.requested_by_name || "Member"}</span>
                                                        {req.reason && <span> “{req.reason}”</span>}
                                                    </p>
                                                    <p className="text-xs text-secondary">
                                                        {req.voter_details?.length || 0} voted ·{" "}
                                                        {req.votes?.filter(v => v.vote === "approve").length || 0} approved ·{" "}
                                                        {req.votes?.filter(v => v.vote === "reject").length || 0} rejected ·{" "}
                                                        Needs 100% consensus
                                                    </p>
                                                    {req.current_user_vote && (
                                                        <p className="text-xs font-semibold text-primary">
                                                            ✓ You voted: <span className={req.current_user_vote === "approve" ? "text-green-600" : "text-red-500"}>{req.current_user_vote}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {!req.current_user_vote && (
                                                        <>
                                                            <Button variant="primary" size="sm" onClick={() => handleVoteAction(req.id, "approve")} disabled={votingLoading === req.id + "approve"}>
                                                                <Check className="w-4 h-4" />
                                                                {votingLoading === req.id + "approve" ? "Voting..." : "Approve"}
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleVoteAction(req.id, "reject")} disabled={votingLoading === req.id + "reject"} className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500">
                                                                <X className="w-4 h-4" />
                                                                {votingLoading === req.id + "reject" ? "Voting..." : "Reject"}
                                                            </Button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)}
                                                        className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                                                        title={expandedReqId === req.id ? "Collapse" : "Expand details"}
                                                    >
                                                        {expandedReqId === req.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded voter details */}
                                            {expandedReqId === req.id && (
                                                <div className="mt-4 pt-4 border-t border-theme space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {/* Voters */}
                                                    {req.voter_details && req.voter_details.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Voters</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {req.voter_details.map(voter => (
                                                                    <div key={voter.member_id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-theme bg-elevated">
                                                                        {voter.profile_picture ? (
                                                                            <img src={voter.profile_picture} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                                        ) : (
                                                                            <User className="w-5 h-5 text-secondary" />
                                                                        )}
                                                                        <span className="font-medium text-primary">{voter.member_name}</span>
                                                                        <span className={voter.vote === "approve" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                                                            {voter.vote}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Pending voters */}
                                                    {req.pending_voter_details && req.pending_voter_details.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                                                                Awaiting vote ({req.pending_voter_details.length})
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {req.pending_voter_details.map(voter => (
                                                                    <div key={voter.member_id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-dashed border-theme bg-secondary/5">
                                                                        {voter.profile_picture ? (
                                                                            <img src={voter.profile_picture} alt="" className="w-5 h-5 rounded-full object-cover opacity-60" />
                                                                        ) : (
                                                                            <User className="w-5 h-5 text-secondary opacity-60" />
                                                                        )}
                                                                        <span className="font-medium text-secondary">{voter.member_name}</span>
                                                                        <span className="text-amber-500 text-[10px]">pending</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Show created timestamp */}
                                                    {req.created_at && (
                                                        <p className="text-[10px] text-tertiary">Created {new Date(req.created_at).toLocaleString()}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
                </div>
            )}

            {activeTab === 'analytics' && analytics && piggy.is_member && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* ── Row 1: Key KPIs ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardBody className="p-4">
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Growth (30d)</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <h3 className="text-xl font-black text-primary">+${analytics.growth_30d?.toFixed(2)}</h3>
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="p-4">
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Withdrawn</p>
                                <div className="flex items-center gap-2">
                                    <ArrowDownCircle className="w-5 h-5 text-red-400" />
                                    <h3 className="text-xl font-black text-primary">${(analytics.total_withdrawn ?? 0).toFixed(2)}</h3>
                                </div>
                                <p className="text-xs text-secondary mt-1">{analytics.withdrawal_count ?? 0} transaction{analytics.withdrawal_count !== 1 ? 's' : ''}</p>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="p-4">
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Contributors</p>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-xl font-black text-primary">{analytics.total_contributors}</h3>
                                </div>
                                {analytics.members_joined > 0 && (
                                    <p className="text-xs text-secondary mt-1">{analytics.members_left ?? 0} inactive</p>
                                )}
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="p-4">
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Maturity Status</p>
                                <div className="flex items-center gap-2">
                                    {analytics.is_mature ? (
                                        <ShieldCheck className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    )}
                                    <h3 className="text-xl font-black text-primary">{analytics.is_mature ? 'Mature' : 'Immature'}</h3>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* ── Row 2: Monthly averages ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-emerald-500/5 border-emerald-500/20">
                            <CardBody className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Avg. Monthly Contribution</p>
                                    <p className="text-2xl font-black text-primary">${(analytics.avg_monthly_contribution ?? 0).toFixed(2)}</p>
                                    <p className="text-xs text-secondary">across active months</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="bg-red-500/5 border-red-500/20">
                            <CardBody className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Avg. Monthly Withdrawal</p>
                                    <p className="text-2xl font-black text-primary">${(analytics.avg_monthly_withdrawal ?? 0).toFixed(2)}</p>
                                    <p className="text-xs text-secondary">across active months</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* ── Row 3: Monthly trends + Top Stakers ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-theme">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" /> Monthly Activity
                                </h4>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                                        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Contributions
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                                        <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Withdrawals
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {analytics.monthly_trends?.map((item, idx) => {
                                        const maxVal = Math.max(analytics.max_monthly || 1, ...(analytics.monthly_trends?.map(m => m.withdrawals) || [0]));
                                        return (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs text-secondary mb-1">
                                                    <span className="font-semibold">{item.month}</span>
                                                    <span>
                                                        <span className="text-emerald-600 font-bold">${item.amount.toFixed(2)}</span>
                                                        {item.withdrawals > 0 && (
                                                            <span className="text-red-400 font-bold ml-2">-${item.withdrawals.toFixed(2)}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-secondary/10 rounded-full overflow-hidden mb-1">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${(item.amount / maxVal) * 100}%` }}
                                                    />
                                                </div>
                                                {item.withdrawals > 0 && (
                                                    <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-red-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${(item.withdrawals / maxVal) * 100}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="border-theme">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-amber-500" /> Top Stakers
                                </h4>
                                {analytics.top_stakers?.length > 0 ? (
                                    <div className="divide-y divide-theme">
                                        {analytics.top_stakers?.map((staker, idx) => (
                                            <div key={idx} className="py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {staker.profile_picture ? (
                                                        <img src={staker.profile_picture} alt={staker.user_name}
                                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-theme"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                    ) : null}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                        staker.profile_picture ? 'hidden' : ''
                                                    } ${
                                                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                                                        idx === 1 ? 'bg-slate-100 text-slate-600' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-600' :
                                                        'bg-secondary/10 text-secondary'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-sm font-medium text-primary">{staker.user_name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-600">${staker.total_contributed.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-secondary text-center py-6">No contributions yet</p>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* ── Row 4: Approvals + Member Activity ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analytics.total_approval_requests > 0 && (
                            <Card className="border-amber-500/20 bg-amber-500/5">
                                <CardBody className="p-6">
                                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <Vote className="w-5 h-5 text-amber-500" /> Approval Requests
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/10">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-primary">Approved</span>
                                            </div>
                                            <span className="text-sm font-black text-green-600">{analytics.approvals_approved}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-red-500/10">
                                            <div className="flex items-center gap-2">
                                                <X className="w-4 h-4 text-red-500" />
                                                <span className="text-sm font-medium text-primary">Rejected</span>
                                            </div>
                                            <span className="text-sm font-black text-red-500">{analytics.approvals_rejected}</span>
                                        </div>
                                        {analytics.approvals_pending > 0 && (
                                            <div className="flex justify-between items-center p-3 rounded-xl bg-amber-500/10">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-500" />
                                                    <span className="text-sm font-medium text-primary">Pending</span>
                                                </div>
                                                <span className="text-sm font-black text-amber-600">{analytics.approvals_pending}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-theme text-xs text-secondary text-center">
                                            {analytics.total_approval_requests} total request{analytics.total_approval_requests !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {analytics.total_merged_sources > 0 && (
                            <Card className="border-blue-500/20 bg-blue-500/5">
                                <CardBody className="p-6">
                                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <GitMerge className="w-5 h-5 text-blue-500" /> Merge History
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-blue-500/10 text-center">
                                            <p className="text-2xl font-black text-blue-600">{analytics.total_merged_sources}</p>
                                            <p className="text-xs text-secondary font-medium">Sources Merged</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-green-500/10 text-center">
                                            <p className="text-2xl font-black text-green-600">${analytics.total_merged_amount?.toFixed(2)}</p>
                                            <p className="text-xs text-secondary font-medium">Total Amount</p>
                                        </div>
                                    </div>
                                    {analytics.merged_sources?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Source Piggy Banks</p>
                                            {analytics.merged_sources.map((src, idx) => (
                                                <div key={src.source_id || idx} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{src.source_name}</p>
                                                        <p className="text-xs text-secondary">{src.member_count} member{src.member_count !== 1 ? 's' : ''} · ${src.total_contributions?.toFixed(2)} contributed · ${src.total_withdrawals?.toFixed(2)} withdrawn</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-blue-600">${src.amount_transferred?.toFixed(2)}</p>
                                                        <p className="text-[10px] text-secondary">transferred</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        {analytics.merged_into_target && (
                            <Card className="border-purple-500/20 bg-purple-500/5">
                                <CardBody className="p-6">
                                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <GitMerge className="w-5 h-5 text-purple-500" /> Merged Into
                                    </h4>
                                    <div className="p-3 rounded-xl bg-purple-500/10 text-center mb-2">
                                        <p className="text-sm text-secondary font-medium">This piggy bank was merged into</p>
                                        <p className="text-lg font-bold text-purple-600 mt-1">{analytics.merged_into_target.target_name}</p>
                                        <p className="text-sm text-secondary mt-1">${analytics.merged_into_target.amount?.toFixed(2)}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {analytics.members_joined > 0 && (
                            <Card className="border-theme">
                                <CardBody className="p-6">
                                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-emerald-500" /> Member Activity
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
                                            <UserCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                            <p className="text-2xl font-black text-emerald-600">{analytics.members_joined}</p>
                                            <p className="text-xs text-secondary font-medium">Joined</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-red-500/10 text-center">
                                            <UserMinus className="w-5 h-5 text-red-400 mx-auto mb-1" />
                                            <p className="text-2xl font-black text-red-400">{analytics.members_left}</p>
                                            <p className="text-xs text-secondary font-medium">Inactive</p>
                                        </div>
                                    </div>
                                    {analytics.member_join_trend?.some(m => m.joined > 0) && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Monthly Joins</p>
                                            {analytics.member_join_trend?.map((item, idx) => (
                                                item.joined > 0 && (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <span className="text-xs text-secondary w-8">{item.month}</span>
                                                        <div className="flex-1 h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${(item.joined / analytics.members_joined) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-primary w-4">{item.joined}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Conversion UI - Only if linked to a group, member, and not converted */}
            {piggy.payment_group && piggy.is_member && !piggy.is_converted && (
                <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                    <CardBody className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <ArrowRightCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary">Convert to Group Funds</h3>
                                    <p className="text-sm text-secondary">Move all savings to the parent group's main balance or form a new subgroup.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const pendingRequest = conversionStatus?.find(r => r.status === 'pending');
                                    if (pendingRequest) {
                                        const hasVoted = pendingRequest.current_user_approved || pendingRequest.current_user_rejected;
                                        return (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-bold flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> 
                                                        {pendingRequest.approval_mode === 'unanimous' ? 'Awaiting All' : 'Pending Votes'}
                                                    </span>
                                                    <span className="text-xs text-secondary">
                                                        {pendingRequest.approving_members_details?.length || 0}/{pendingRequest.total_members || 0} approved
                                                    </span>
                                                </div>
                                                {!hasVoted ? (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm"
                                                            onClick={() => handleVoteConversion(pendingRequest.id, 'approve')}
                                                            disabled={isConverting}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleVoteConversion(pendingRequest.id, 'reject')}
                                                            disabled={isConverting}
                                                        >
                                                            <X className="w-4 h-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Your vote recorded
                                                    </div>
                                                )}
                                                {pendingRequest.approving_members_details?.length > 0 && (
                                                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                                        <p className="text-xs font-bold text-green-700">Approved by:</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {pendingRequest.approving_members_details.map((m, i) => (
                                                                <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                    {m.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {pendingRequest.rejecting_members_details?.length > 0 && (
                                                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                                        <p className="text-xs font-bold text-red-700">Rejected by:</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {pendingRequest.rejecting_members_details.map((m, i) => (
                                                                <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                                    {m.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <Button 
                                            variant="outline" 
                                            className="border-primary text-primary hover:bg-primary hover:text-white"
                                            onClick={() => setShowConversionModal(true)}
                                            disabled={isConverting}
                                        >
                                            <ArrowRightCircle className="w-4 h-4 mr-2" />
                                            Request Conversion
                                        </Button>
                                    );
                                })()}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {piggy.is_converted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">This piggy bank has been converted to group funds.</p>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 border-theme">
                        <CardBody className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <DollarSign className="w-6 h-6 text-primary" />
                                    {withdrawStep === 'input' ? 'Withdraw Funds' : 'Confirm Withdrawal'}
                                </h3>
                                <button
                                    onClick={() => { setShowWithdrawModal(false); setWithdrawStep('input'); setWithdrawAmount(''); }}
                                    className="p-2 rounded-full hover:bg-secondary/10 text-secondary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Step indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    withdrawStep === 'input' ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary'
                                }`}>1</div>
                                <div className="flex-1 h-0.5 bg-theme" />
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    withdrawStep === 'confirm' ? 'bg-primary-600 text-white' : 'bg-secondary/20 text-secondary'
                                }`}>2</div>
                            </div>

                            {/* ── Step 1: Amount Input ── */}
                            {withdrawStep === 'input' && (
                                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-2">
                                            Amount to Withdraw
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-secondary font-semibold">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 bg-secondary/5 border-2 border-theme rounded-xl focus:outline-none focus:border-primary transition-colors text-primary font-bold text-lg"
                                                placeholder="0.00"
                                                min="0.01"
                                                max={piggy.current_amount}
                                                step="0.01"
                                                autoFocus
                                                required
                                            />
                                        </div>
                                        <p className="text-sm text-secondary mt-2">
                                            Available balance: <span className="font-bold text-primary">${parseFloat(piggy.current_amount).toFixed(2)}</span>
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(piggy.current_amount)}
                                        className="w-full py-4 text-lg font-bold"
                                    >
                                        Continue to Confirm
                                    </Button>
                                </form>
                            )}

                            {/* ── Step 2: Confirmation ── */}
                            {withdrawStep === 'confirm' && (
                                <div className="space-y-6">
                                    {/* Summary card */}
                                    <div className="rounded-2xl border border-theme bg-secondary/5 p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-secondary">From</span>
                                            <span className="font-semibold text-primary">{renderContentWithEmojis(piggy.name)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-secondary">To</span>
                                            <span className="font-semibold text-primary">Your Wallet</span>
                                        </div>
                                        <div className="border-t border-theme pt-3 flex justify-between items-center">
                                            <span className="text-sm text-secondary">Amount</span>
                                            <span className="text-2xl font-black text-primary">${parseFloat(withdrawAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-secondary">Balance after</span>
                                            <span className="font-semibold text-secondary">
                                                ${(parseFloat(piggy.current_amount) - parseFloat(withdrawAmount)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Note: group piggy → approval required; individual → instant */}
                                    {piggy.payment_group ? (
                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                            <span className="text-amber-500 mt-0.5">⚠</span>
                                            <p className="text-xs text-amber-600 font-medium">
                                                This is a group piggy bank. Your withdrawal request will be sent to the group for approval before any funds are moved.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-secondary text-center">
                                            Funds will be moved to your Comrade wallet immediately.
                                        </p>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setWithdrawStep('input')}
                                            className="flex-1 py-3"
                                            disabled={claimLoading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleWithdrawConfirm}
                                            disabled={claimLoading}
                                            className="flex-1 py-3 font-bold"
                                        >
                                            {claimLoading ? 'Processing...' : 'Confirm Withdrawal'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Merge Modal */}
            {showMergeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl scale-in-center">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-blue-600" />
                                    Request Merge
                                </h3>
                                <button onClick={() => { setShowMergeModal(false); setMergeForm({ source_ids: [], reason: '' }); }} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <form onSubmit={handleMergeSubmit} className="space-y-4">
                                {/* Available source piggy banks */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-3">
                                        Select piggy banks to merge into <strong className="text-primary">{piggy?.name}</strong>:
                                    </label>
                                    {availableForMerge.length === 0 ? (
                                        <div className="p-4 bg-secondary/5 rounded-xl border border-dashed border-theme text-center">
                                            <p className="text-sm text-secondary">No other piggy banks available for merge in this group.</p>
                                            <p className="text-xs text-tertiary mt-1">Piggy banks must be unlocked and active to be eligible.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {availableForMerge.map(pb => {
                                                const isSelected = mergeForm.source_ids.includes(pb.id);
                                                return (
                                                    <label
                                                        key={pb.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                            isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-theme hover:bg-secondary/5'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleMergeSource(pb.id)}
                                                            className="w-4 h-4 rounded accent-blue-600"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-primary truncate">{pb.name}</p>
                                                            <p className="text-xs text-secondary">
                                                                Balance: <span className="font-bold text-emerald-600">${parseFloat(pb.current_amount || 0).toFixed(2)}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs text-secondary">{pb.savings_type || 'normal'}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Reason for Merge</label>
                                    <textarea
                                        value={mergeForm.reason}
                                        onChange={(e) => setMergeForm(prev => ({ ...prev, reason: e.target.value }))}
                                        rows={3}
                                        placeholder="Why are these piggy banks being merged..."
                                        className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-blue-500 outline-none text-sm"
                                    />
                                </div>

                                {/* Info note */}
                                <div className="p-3 bg-amber-50 rounded-lg flex gap-2 items-start">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700">
                                        A merge request will be sent for group approval. Once approved, the selected piggy banks will be merged into <strong>{piggy?.name}</strong> and their funds combined.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setShowMergeModal(false); setMergeForm({ source_ids: [], reason: '' }); }}
                                        className="flex-1 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={mergeLoading || mergeForm.source_ids.length === 0 || availableForMerge.length === 0}
                                        className="flex-1 py-3 shadow-md"
                                    >
                                        {mergeLoading ? 'Submitting...' : `Submit Merge Request (${mergeForm.source_ids.length} selected)`}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl scale-in-center">
                        <CardBody className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <PiggyBank className="w-8 h-8 text-emerald-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-center text-primary mb-2">Fund your Piggy Bank</h3>
                            <p className="text-center text-secondary mb-6 text-sm">You are contributing to <strong className="text-primary">{renderContentWithEmojis(piggy.name)}</strong></p>
                            
                            <form onSubmit={handleContribute} className="space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <DollarSign className="h-6 w-6 text-tertiary" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={contributeAmount}
                                        onChange={(e) => setContributeAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-emerald-500 text-2xl font-bold transition-colors shadow-inner"
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowContributeModal(false)}
                                        className="flex-1 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={!contributeAmount}
                                        className="flex-1 py-3 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Conversion Request Modal */}
            {showConversionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl scale-in-center">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                                    <ArrowRightCircle className="w-5 h-5 text-primary" />
                                    Request Conversion
                                </h3>
                                <button onClick={() => setShowConversionModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleRequestConversion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Conversion Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setConversionForm({...conversionForm, conversion_type: 'full'})}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                conversionForm.conversion_type === 'full'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-theme text-secondary hover:bg-secondary/5'
                                            }`}
                                        >
                                            <ArrowRightCircle className="w-5 h-5" />
                                            <span className="text-xs font-bold">Full Conversion</span>
                                            <span className="text-[10px] text-center">All funds to parent group</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConversionForm({...conversionForm, conversion_type: 'split'})}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                conversionForm.conversion_type === 'split'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-theme text-secondary hover:bg-secondary/5'
                                            }`}
                                        >
                                            <Split className="w-5 h-5" />
                                            <span className="text-xs font-bold">Split Group</span>
                                            <span className="text-[10px] text-center">Form new subgroup</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Approval Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'unanimous', label: 'Unanimous', desc: 'All must approve' },
                                            { id: 'majority', label: 'Majority', desc: 'More than half' },
                                            { id: 'any', label: 'Any', desc: 'One can trigger' }
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                type="button"
                                                onClick={() => setConversionForm({...conversionForm, approval_mode: mode.id})}
                                                className={`p-2 rounded-lg border-2 text-center transition-all ${
                                                    conversionForm.approval_mode === mode.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-theme text-secondary hover:bg-secondary/5'
                                                }`}
                                            >
                                                <div className="text-xs font-bold">{mode.label}</div>
                                                <div className="text-[10px]">{mode.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {conversionForm.conversion_type === 'split' && (
                                    <>
                                        <Input
                                            label="New Group Name *"
                                            value={conversionForm.new_group_name}
                                            onChange={(e) => setConversionForm({...conversionForm, new_group_name: e.target.value})}
                                            required
                                            placeholder="e.g., Vacation Savings Group"
                                        />
                                        <Input
                                            label="New Piggy Bank Name"
                                            value={conversionForm.new_piggy_name}
                                            onChange={(e) => setConversionForm({...conversionForm, new_piggy_name: e.target.value})}
                                            placeholder="e.g., Our Vacation Fund"
                                        />
                                        <Input
                                            label="New Piggy Target Amount"
                                            type="number"
                                            value={conversionForm.new_piggy_target}
                                            onChange={(e) => setConversionForm({...conversionForm, new_piggy_target: e.target.value})}
                                            placeholder="0.00"
                                        />
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Reason for Conversion</label>
                                    <textarea
                                        value={conversionForm.reason}
                                        onChange={(e) => setConversionForm({...conversionForm, reason: e.target.value})}
                                        rows={3}
                                        placeholder="Why are you requesting this conversion..."
                                        className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-primary outline-none text-sm"
                                    />
                                </div>

                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex gap-2">
                                    <Info className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        Based on the approval mode, members who approve will either transfer to the new group (split) or funds will move to parent group. Those who reject will receive their savings back.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowConversionModal(false)}
                                        className="flex-1 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isConverting || (conversionForm.conversion_type === 'split' && !conversionForm.new_group_name)}
                                        className="flex-1 py-3 shadow-md"
                                    >
                                        {isConverting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl scale-in-center max-h-[90vh] overflow-y-auto">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-primary" />
                                    Settings
                                </h3>
                                <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div className="relative">
                                    <Input
                                        label="Piggy Bank Name"
                                        value={settingsForm.name}
                                        onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                                        placeholder="Enter new name"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEmojiPickerField(prev => prev === 'name' ? false : 'name')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary transition-colors"
                                        title="Add emoji"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </button>
                                    {emojiPickerField === 'name' && (
                                        <div className="absolute top-full left-0 mt-1 z-[9999]">
                                            <div className="fixed inset-0" onClick={() => setEmojiPickerField(false)} />
                                            <div className="relative shadow-2xl rounded-xl overflow-hidden border border-theme">
                                                <Picker
                                                    data={emojiData}
                                                    onEmojiSelect={(emoji) => {
                                                        setSettingsForm(prev => ({ ...prev, name: prev.name + emoji.native }));
                                                    }}
                                                    set="apple"
                                                    theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                                    previewPosition="none"
                                                    skinTonePosition="none"
                                                    autoFocus={false}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {settingsForm.name && (
                                        <p className="text-xs text-secondary mt-1.5">{renderContentWithEmojis(settingsForm.name)}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Description</label>
                                    <div className="relative">
                                        <textarea
                                            value={settingsForm.description}
                                            onChange={(e) => setSettingsForm({...settingsForm, description: e.target.value})}
                                            placeholder="Describe your savings goal..."
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-lg border border-theme bg-transparent text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setEmojiPickerField(prev => prev === 'description' ? false : 'description')}
                                            className="absolute right-2 top-2.5 p-1.5 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary transition-colors"
                                            title="Add emoji"
                                        >
                                            <Smile className="w-4 h-4" />
                                        </button>
                                        {emojiPickerField === 'description' && (
                                            <div className="absolute top-full left-0 mt-1 z-[9999]">
                                                <div className="fixed inset-0" onClick={() => setEmojiPickerField(false)} />
                                                <div className="relative shadow-2xl rounded-xl overflow-hidden border border-theme">
                                                    <Picker
                                                        data={emojiData}
                                                        onEmojiSelect={(emoji) => {
                                                            setSettingsForm(prev => ({ ...prev, description: prev.description + emoji.native }));
                                                        }}
                                                        set="apple"
                                                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                                        previewPosition="none"
                                                        skinTonePosition="none"
                                                        autoFocus={false}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {settingsForm.description && (
                                            <p className="text-xs text-secondary mt-1.5">{renderContentWithEmojis(settingsForm.description)}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Visibility</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'public', label: 'Public' },
                                            { id: 'group', label: 'Group' },
                                            { id: 'private', label: 'Private' }
                                        ].map(v => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => setSettingsForm({...settingsForm, visibility: v.id})}
                                                className={`p-2 rounded-lg border-2 text-center transition-all ${
                                                    settingsForm.visibility === v.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-theme text-secondary hover:bg-secondary/5'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-theme">
                                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                                        Withdrawal Constraints
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Min Withdrawal ($)"
                                            type="number"
                                            value={settingsForm.min_withdrawal_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, min_withdrawal_amount: e.target.value})}
                                            placeholder="Min amount"
                                        />
                                        <Input
                                            label="Max Withdrawal ($)"
                                            type="number"
                                            value={settingsForm.max_withdrawal_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, max_withdrawal_amount: e.target.value})}
                                            placeholder="Max amount"
                                        />
                                        <Input
                                            label="Min Balance ($)"
                                            type="number"
                                            value={settingsForm.require_min_balance}
                                            onChange={(e) => setSettingsForm({...settingsForm, require_min_balance: e.target.value})}
                                            placeholder="Must keep"
                                        />
                                        <Input
                                            label="Max/Day"
                                            type="number"
                                            value={settingsForm.max_withdrawals_per_day}
                                            onChange={(e) => setSettingsForm({...settingsForm, max_withdrawals_per_day: e.target.value})}
                                            placeholder="Count limit"
                                        />
                                        <Input
                                            label="Save Days First"
                                            type="number"
                                            value={settingsForm.require_min_savings_period_days}
                                            onChange={(e) => setSettingsForm({...settingsForm, require_min_savings_period_days: e.target.value})}
                                            placeholder="Min days"
                                        />
                                        <Input
                                            label="Member Age (days)"
                                            type="number"
                                            value={settingsForm.require_min_member_age_days}
                                            onChange={(e) => setSettingsForm({...settingsForm, require_min_member_age_days: e.target.value})}
                                            placeholder="Days in group"
                                        />
                                        <Input
                                            label="Min Contribution ($)"
                                            type="number"
                                            className="col-span-2"
                                            value={settingsForm.require_min_contribution_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, require_min_contribution_amount: e.target.value})}
                                            placeholder="Must have contributed this much"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-theme">
                                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-red-400" />
                                        Leave Rules
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.leave_requires_vote}
                                                onChange={(e) => setSettingsForm({...settingsForm, leave_requires_vote: e.target.checked})}
                                                className="w-4 h-4 rounded border-theme text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-primary">Leave requires group approval (vote waives penalty)</span>
                                        </label>
                                        {!settingsForm.leave_requires_vote && (
                                            <Input
                                                label="Inconvenience Fee (%)"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={settingsForm.leave_inconvenience_fee_percentage}
                                                onChange={(e) => setSettingsForm({...settingsForm, leave_inconvenience_fee_percentage: e.target.value})}
                                                placeholder="Fee charged on immediate leave (stays in piggy bank)"
                                            />
                                        )}
                                        {settingsForm.leave_requires_vote && (
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settingsForm.leave_vote_waives_penalty}
                                                    onChange={(e) => setSettingsForm({...settingsForm, leave_vote_waives_penalty: e.target.checked})}
                                                    className="w-4 h-4 rounded border-theme text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm text-primary">Approved vote waives early withdrawal penalty</span>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="flex-1 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={settingsLoading}
                                        className="flex-1 py-3 shadow-md"
                                    >
                                        {settingsLoading ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                </div>
                            </form>
                            
                            {piggy && piggy.automation_trigger && piggy.automation_trigger !== 'none' && (
                                <div className="mt-4 pt-4 border-t border-theme">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-primary">Automation Status</p>
                                            <p className="text-xs text-secondary">
                                                {piggy.automation_executed 
                                                    ? 'Already executed' 
                                                    : `Ready to ${piggy.automation_trigger === 'manual' ? 'run manually' : 'trigger on ' + piggy.automation_trigger}`}
                                            </p>
                                        </div>
                                        {!piggy.automation_executed && piggy.automation_trigger === 'manual' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleExecuteAutomation}
                                                disabled={settingsLoading || parseFloat(piggy.current_amount || 0) <= 0}
                                            >
                                                <Zap className="w-4 h-4 mr-1" />
                                                Run Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Lock Modal */}
            {showLockModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-amber-500" />
                                    Lock Piggy Bank
                                </h3>
                                <button onClick={() => { setShowLockModal(false); setLockType('locked'); setLockMaturityDate(''); }} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">Lock Type</label>
                                    <select
                                        value={lockType}
                                        onChange={(e) => setLockType(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                                    >
                                        <option value="locked">Locked (indefinite)</option>
                                        <option value="locked_time">Locked until Date</option>
                                        <option value="locked_goal">Locked until Goal Reached</option>
                                    </select>
                                </div>
                                {lockType === 'locked_time' && (
                                    <div>
                                        <label className="block text-sm font-bold text-secondary mb-2">Maturity Date</label>
                                        <input
                                            type="datetime-local"
                                            value={lockMaturityDate}
                                            onChange={(e) => setLockMaturityDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                )}
                                {lockType === 'locked_goal' && (
                                    <p className="text-sm text-secondary bg-secondary/5 p-3 rounded-lg">
                                        The piggy bank will remain locked until your savings reach the target amount of ${parseFloat(piggy?.target_amount || 0).toFixed(2)}.
                                    </p>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => { setShowLockModal(false); setLockType('locked'); setLockMaturityDate(''); }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleLock}
                                        disabled={lockLoading || (lockType === 'locked_time' && !lockMaturityDate)}
                                    >
                                        {lockLoading ? 'Locking...' : 'Confirm Lock'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl scale-in-center">
                        <CardBody className="p-6">
                            <h3 className="text-xl font-black text-primary mb-2 flex items-center gap-2">
                                Leave Piggy Bank
                            </h3>
                            <p className="text-sm text-secondary mb-4">
                                You will withdraw your total contributed amount minus any applicable penalties, fees, or lock-period restrictions.
                                {piggy.leave_requires_vote && ' Group approval will be required.'}
                            </p>
                            {piggy.leave_inconvenience_fee_percentage > 0 && !piggy.leave_requires_vote && (
                                <p className="text-sm text-amber-600 mb-4 font-medium">
                                    A {piggy.leave_inconvenience_fee_percentage}% inconvenience fee will be deducted and stay in the piggy bank.
                                </p>
                            )}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-secondary mb-2">Reason (optional)</label>
                                <textarea
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    placeholder="Why are you leaving?"
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-theme bg-transparent text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowLeaveConfirm(false); setLeaveReason(''); }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleLeavePiggyBank}
                                    className="flex-1 !bg-red-500 hover:!bg-red-600"
                                >
                                    Confirm Leave
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PiggyBankDetail;
