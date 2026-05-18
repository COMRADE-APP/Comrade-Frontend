import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, ArrowLeft, Calendar, DollarSign, Check, Users, AlertCircle, PiggyBank, Briefcase, Lock, Unlock, TrendingUp,
    Activity, ArrowRightCircle, ShieldCheck, Clock, CheckCircle2, History, Crown, X, Info, Split, Vote, Settings, Zap, ShoppingCart, GraduationCap, UsersRound, Heart
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

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
    const [conversionStatus, setConversionStatus] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'analytics'
    const [claimLoading, setClaimLoading] = useState(false);
    
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
    const [settingsForm, setSettingsForm] = useState({
        name: '',
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
        require_min_contribution_amount: ''
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    
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
        try {
            const data = await paymentsService.getPiggyBankById(id);
            setPiggy(data);
            
            // Parallel fetch analytics and status, but don't fail the whole page if they fail
            try {
                const [analyticsData, statusData] = await Promise.all([
                    paymentsService.getPiggyAnalytics(id),
                    data.payment_group ? paymentsService.getPiggyConversionStatus(id) : Promise.resolve(null)
                ]);
                setAnalytics(analyticsData);
                setConversionStatus(statusData);
            } catch (innerErr) {
                console.error('Error loading analytics/status:', innerErr);
            }
        } catch (err) {
            console.error('Error loading Piggy Bank details:', err);
            setError('Failed to load Piggy Bank details.');
        } finally {
            setLoading(false);
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
            require_min_contribution_amount: piggy.require_min_contribution_amount ? String(piggy.require_min_contribution_amount) : ''
        });
        setShowSettingsModal(true);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        try {
            const payload = {
                name: settingsForm.name,
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
                require_min_contribution_amount: settingsForm.require_min_contribution_amount ? parseFloat(settingsForm.require_min_contribution_amount) : null
            };
            await paymentsService.updatePiggySettings(id, payload);
            toast.success('Settings updated successfully');
            setShowSettingsModal(false);
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

    const handleClaimFunds = async () => {
        setClaimLoading(true);
        try {
            await paymentsService.withdrawPiggyBank(id, piggy.current_amount);
            toast.success('Funds successfully claimed to your wallet!');
            loadData();
        } catch (error) {
            console.error('Claim failed:', error);
            toast.error(error.response?.data?.error || 'Failed to claim funds. Please try again.');
        } finally {
            setClaimLoading(false);
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
                                {piggy.name}
                            </h1>
                            {isAchieved ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    <Check className="w-3 h-3" /> Goal Achieved
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    <TrendingUp className="w-3 h-3" /> Saving Active
                                </span>
                            )}
                        </div>
                        <p className="text-secondary mt-1 max-w-2xl text-sm md:text-base">{piggy.description}</p>
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
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-6 py-3 font-bold text-sm transition-all relative ${
                        activeTab === 'analytics' ? 'text-primary' : 'text-secondary hover:text-primary'
                    }`}
                >
                    Analytics & Trends
                    {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Main Progress Board */}
                <Card className="md:col-span-8 border-theme shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-teal-400 to-green-500"></div>
                    <CardBody className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200 shadow-inner">
                                    <PiggyBank className="w-8 h-8 text-blue-600" />
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
                                <span className={isAchieved ? "text-green-600" : "text-blue-600"}>
                                    {progress.toFixed(1)}% Funded
                                </span>
                                <span className="text-secondary">
                                    ${Math.max(0, parseFloat(piggy.target_amount) - parseFloat(piggy.current_amount)).toLocaleString()} remaining
                                </span>
                            </div>
                            <div className="h-4 bg-secondary/20 rounded-full overflow-hidden shadow-inner p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden
                                        ${isAchieved ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-500 to-teal-400'}
                                    `}
                                    style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full skeleton-shimmer"></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            {!isAchieved ? (
                                <Button
                                    variant="primary"
                                    onClick={() => setShowContributeModal(true)}
                                    className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Add Savings
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleClaimFunds}
                                    className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 !bg-green-600 hover:!bg-green-700"
                                    disabled={claimLoading || piggy.current_amount <= 0}
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
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
                                        <span className={`font-semibold flex items-center ${piggy.locking_status === 'locked' ? 'text-amber-600' : 'text-green-600'}`}>
                                            {piggy.locking_status === 'locked' ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                                            {piggy.locking_status === 'locked' ? 'Locked' : 'Flexible'}
                                        </span>
                                    </div>
                                    {piggy.visibility && (
                                        <div className="flex justify-between items-center border-b border-theme pb-3">
                                            <span className="text-sm text-secondary">Visibility</span>
                                            <span className="font-semibold text-primary capitalize bg-primary/5 px-2 py-1 rounded text-xs">
                                                {piggy.visibility}
                                            </span>
                                        </div>
                                    )}
                                    {piggy.automation_trigger && piggy.automation_trigger !== 'none' && (
                                        <div className="flex justify-between items-center border-b border-theme pb-3">
                                            <span className="text-sm text-secondary">Automation</span>
                                            <span className="font-semibold text-primary capitalize bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                                {piggy.automation_trigger === 'manual' ? 'Manual' : piggy.automation_trigger}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-theme">
                                <Button variant="outline" size="sm" className="w-full" onClick={openSettings}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings & Automation
                                </Button>
                            </div>

                            {piggy.payment_group && (
                                <div className="mt-6 pt-4 border-t border-theme">
                                    <p className="text-xs text-secondary mb-2 font-bold uppercase tracking-wider">Linked Group</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/payments/groups/${piggy.payment_group}?tab=overview`)}
                                        className="w-full justify-center"
                                    >
                                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                                        View Payment Group
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
            )}

            {activeTab === 'analytics' && analytics && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Contributors</p>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-xl font-black text-primary">{analytics.total_contributors}</h3>
                                </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-theme">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" /> Contribution Trends
                                </h4>
                                <div className="space-y-4">
                                    {analytics.monthly_trends?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-sm text-secondary">{item.month}</span>
                                            <div className="flex-1 mx-4 h-2 bg-secondary/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary" 
                                                    style={{ width: `${(item.amount / (analytics.max_monthly || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-primary">${item.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="border-theme">
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-amber-500" /> Top Stakers
                                </h4>
                                <div className="divide-y divide-theme">
                                    {analytics.top_stakers?.map((staker, idx) => (
                                        <div key={idx} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-bold">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-medium text-primary">{staker.user_name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">${staker.total_contributed.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            )}

            {/* Conversion UI - Only if linked to a group and not converted */}
            {piggy.payment_group && !piggy.is_converted && (
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

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl scale-in-center">
                        <CardBody className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <PiggyBank className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-center text-primary mb-2">Fund your Piggy Bank</h3>
                            <p className="text-center text-secondary mb-6 text-sm">You are contributing to <strong className="text-primary">{piggy.name}</strong></p>
                            
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
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-blue-500 text-2xl font-bold transition-colors shadow-inner"
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
                                        className="flex-1 py-3 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
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

                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
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

            {/* Settings & Automation Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl scale-in-center max-h-[90vh] overflow-y-auto">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-primary" />
                                    Settings & Automation
                                </h3>
                                <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-secondary/10 rounded">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <Input
                                    label="Piggy Bank Name"
                                    value={settingsForm.name}
                                    onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                                    placeholder="Enter new name"
                                />
                                
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
                                        <Zap className="w-4 h-4 text-purple-500" />
                                        Automation
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-secondary mb-1">When to Trigger</label>
                                            <select
                                                value={settingsForm.automation_trigger}
                                                onChange={(e) => setSettingsForm({...settingsForm, automation_trigger: e.target.value})}
                                                className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm"
                                            >
                                                <option value="none">No Automation</option>
                                                <option value="manual">Manual Trigger</option>
                                                <option value="maturity">On Maturity Date</option>
                                                <option value="withdrawal">On Withdrawal</option>
                                                <option value="goal_achieved">When Goal Achieved</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-secondary mb-1">What to Do</label>
                                            <select
                                                value={settingsForm.automation_action}
                                                onChange={(e) => setSettingsForm({...settingsForm, automation_action: e.target.value})}
                                                className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg text-sm"
                                            >
                                                <option value="none">Do Nothing</option>
                                                <option value="wallet">Transfer to My Wallet</option>
                                                <option value="group_fund">Add to Group Fund</option>
                                                <option value="product">Purchase a Product</option>
                                                <option value="service">Purchase a Service</option>
                                                <option value="investment">Invest in Opportunity</option>
                                                <option value="course">Buy Course/Masterclass</option>
                                                <option value="group_join">Join Group (Pay Fee)</option>
                                                <option value="donation">Make Donation</option>
                                            </select>
                                        </div>
                                        
                                        {['product', 'service', 'investment', 'course', 'group_join', 'donation'].includes(settingsForm.automation_action) && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    label="Target ID"
                                                    value={settingsForm.automation_target_id}
                                                    onChange={(e) => setSettingsForm({...settingsForm, automation_target_id: e.target.value})}
                                                    placeholder="ID of item"
                                                />
                                                <Input
                                                    label="Target Name"
                                                    value={settingsForm.automation_target_name}
                                                    onChange={(e) => setSettingsForm({...settingsForm, automation_target_name: e.target.value})}
                                                    placeholder="Name to display"
                                                />
                                            </div>
                                        )}
                                        
                                        <Input
                                            label="Automation Amount (optional)"
                                            type="number"
                                            value={settingsForm.automation_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, automation_amount: e.target.value})}
                                            placeholder="Full balance if empty"
                                        />
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
        </div>
    );
};

export default PiggyBankDetail;
