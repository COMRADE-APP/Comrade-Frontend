import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, ArrowLeft, Calendar, DollarSign, Check, Users, AlertCircle, PiggyBank, Briefcase, Lock, Unlock, TrendingUp,
    Activity, ArrowRightCircle, ShieldCheck, Clock, CheckCircle2, History, Crown
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
    const [contributeAmount, setContributeAmount] = useState('');
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [conversionStatus, setConversionStatus] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'analytics'
    const [claimLoading, setClaimLoading] = useState(false);

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

    const handleRequestConversion = async () => {
        setIsConverting(true);
        try {
            const res = await paymentsService.requestPiggyConversion(id);
            setConversionStatus(res);
            toast.success('Conversion request submitted');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to request conversion');
        } finally {
            setIsConverting(false);
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
                                </div>
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
                                    <p className="text-sm text-secondary">Move all savings to the parent group's main balance.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const pendingRequest = conversionStatus?.find(r => r.status === 'pending');
                                    if (pendingRequest) {
                                        return (
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-bold flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Awaiting Approval
                                                </span>
                                                {pendingRequest.can_approve && (
                                                    <Button 
                                                        variant="primary" 
                                                        size="sm" 
                                                        onClick={handleApproveConversion}
                                                        disabled={isConverting}
                                                    >
                                                        {isConverting ? 'Processing...' : 'Approve Conversion'}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <Button 
                                            variant="outline" 
                                            className="border-primary text-primary hover:bg-primary hover:text-white"
                                            onClick={handleRequestConversion}
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
        </div>
    );
};

export default PiggyBankDetail;
