/**
 * GroupKittyDetail - Dedicated detail page for a group kitty.
 * Separate from the group detail page, showing kitty-specific analytics,
 * contributions, member activity, and management actions.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
    DollarSign, Users, Activity, Settings, RefreshCw,
    CheckCircle, Clock, XCircle, Download, Upload, Coins,
    PiggyBank, Target, ShieldCheck, BarChart3, Eye, EyeOff
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import paymentsService from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { formatDate } from '../../utils/dateFormatter';

// ========= STAT CARD =========
const StatCard = ({ icon: Icon, label, value, color = 'emerald', extra }) => (
    <div className={`p-4 rounded-xl border border-theme bg-elevated hover:shadow-md transition-shadow`}>
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-lg bg-${color}-100 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600`}>
                <Icon size={18} />
            </div>
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        {extra && <p className="text-xs text-secondary mt-1">{extra}</p>}
    </div>
);

// ========= CONTRIBUTION CARD =========
const ContributionItem = ({ contribution }) => (
    <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-xl border border-theme hover:bg-secondary/10 transition-colors">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            contribution.type === 'contribution' || contribution.type === 'deposit' 
                ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
            {contribution.type === 'contribution' || contribution.type === 'deposit'
                ? <ArrowDownCircle size={18} className="text-green-600" />
                : <ArrowUpCircle size={18} className="text-red-500" />
            }
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">
                {contribution.contributor_name || contribution.description || 'Transaction'}
            </p>
            <p className="text-xs text-secondary">
                {contribution.contributed_at ? formatDate(contribution.contributed_at) : formatDate(contribution.created_at)}
            </p>
        </div>
        <div className="text-right">
            <p className={`font-bold text-sm ${
                contribution.type === 'contribution' || contribution.type === 'deposit' ? 'text-green-600' : 'text-red-500'
            }`}>
                {contribution.type === 'contribution' || contribution.type === 'deposit' ? '+' : '-'}
                {formatMoneySimple(contribution.amount)}
            </p>
        </div>
    </div>
);

const GroupKittyDetail = () => {
    const { groupId, kittyId } = useParams();
    const navigate = useNavigate();
    
    const [kitty, setKitty] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showBalance, setShowBalance] = useState(true);

    useEffect(() => {
        loadKittyData();
    }, [groupId, kittyId]);

    const loadKittyData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all kitties for this group and find the specific one
            const kitties = await paymentsService.getGroupKitties(groupId);
            const kittyList = Array.isArray(kitties) ? kitties : (kitties?.results || []);
            const found = kittyList.find(k => String(k.id) === String(kittyId));
            
            if (!found) {
                setError('Kitty not found in this group.');
                setLoading(false);
                return;
            }
            setKitty(found);

            // Try to load contributions/transactions
            try {
                const contribs = await paymentsService.getGroupContributions(groupId);
                setContributions(Array.isArray(contribs) ? contribs : (contribs?.results || []));
            } catch (e) {
                console.warn('Could not load contributions:', e);
            }
        } catch (err) {
            console.error('Load kitty error:', err);
            setError(err.message || 'Failed to load kitty details.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'activity', label: 'Activity', icon: Activity },
        { key: 'members', label: 'Members', icon: Users },
        { key: 'settings', label: 'Settings', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-amber-500 animate-spin mb-4" />
                    <p className="text-secondary font-medium animate-pulse">Loading kitty details...</p>
                </div>
            </div>
        );
    }

    if (error || !kitty) {
        return (
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
                <div className="text-amber-500 mb-4">
                    <PiggyBank size={48} />
                </div>
                <h2 className="text-xl font-bold text-primary mb-2">Kitty Not Found</h2>
                <p className="text-secondary max-w-md text-center mb-6">{error || 'Could not load kitty details.'}</p>
                <div className="flex gap-3">
                    <Button onClick={() => navigate(`/payments/groups/${groupId}?tab=kitties`)} variant="outline">
                        <ArrowLeft size={16} className="mr-2" /> Back to Group
                    </Button>
                    <Button onClick={loadKittyData} variant="primary">
                        <RefreshCw size={16} className="mr-2" /> Retry
                    </Button>
                </div>
            </div>
        );
    }

    const balance = parseFloat(kitty.balance || kitty.current_amount || 0);
    const target = parseFloat(kitty.target_amount || 0);
    const progress = target > 0 ? Math.min(100, (balance / target) * 100) : 0;
    const memberCount = kitty.members?.length || kitty.member_count || 0;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-600 via-emerald-600 to-emerald-700 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => navigate(`/payments/groups/${groupId}?tab=kitties`)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">Group Kitty</p>
                            <h1 className="text-2xl font-bold leading-tight">{kitty.name}</h1>
                        </div>
                        <button 
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>

                    {kitty.description && (
                        <p className="text-white/80 text-sm mb-6 max-w-xl">{kitty.description}</p>
                    )}

                    {/* Balance Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs mb-1">Current Balance</p>
                            <p className="text-3xl font-bold">
                                {showBalance ? formatMoneySimple(balance) : '••••••'}
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs mb-1">Target</p>
                            <p className="text-xl font-bold text-amber-200">
                                {target > 0 ? formatMoneySimple(target) : 'No target set'}
                            </p>
                            {target > 0 && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                                            style={{ width: `${progress}%` }} 
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/60 mt-1">{progress.toFixed(1)}% achieved</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs mb-1">Members</p>
                            <p className="text-xl font-bold">{memberCount}</p>
                            <p className="text-xs text-white/50 mt-1">
                                Created {kitty.created_at ? formatDate(kitty.created_at) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-elevated border-b border-theme sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                                        activeTab === tab.key 
                                            ? 'text-primary' 
                                            : 'text-secondary hover:text-primary'
                                    }`}
                                >
                                    <TabIcon size={16} />
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* ===== OVERVIEW ===== */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard 
                                icon={DollarSign} 
                                label="Balance" 
                                value={showBalance ? formatMoneySimple(balance) : '••••'} 
                                color="emerald" 
                            />
                            <StatCard 
                                icon={Target} 
                                label="Target" 
                                value={target > 0 ? formatMoneySimple(target) : 'None'} 
                                color="amber" 
                                extra={target > 0 ? `${progress.toFixed(0)}% achieved` : null}
                            />
                            <StatCard 
                                icon={ArrowDownCircle} 
                                label="Total In" 
                                value={formatMoneySimple(kitty.total_inflow || kitty.total_contributed || 0)} 
                                color="green" 
                            />
                            <StatCard 
                                icon={ArrowUpCircle} 
                                label="Total Out" 
                                value={formatMoneySimple(kitty.total_outflow || kitty.total_withdrawn || 0)} 
                                color="rose" 
                            />
                        </div>

                        {/* Progress Section */}
                        {target > 0 && (
                            <Card className="border-theme">
                                <CardBody className="p-6">
                                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                        <Target size={20} className="text-amber-500" /> Goal Progress
                                    </h3>
                                    <div className="flex items-end justify-between mb-3">
                                        <span className="text-2xl font-bold text-emerald-600">{formatMoneySimple(balance)}</span>
                                        <span className="text-sm text-secondary">of {formatMoneySimple(target)}</span>
                                    </div>
                                    <div className="h-4 bg-secondary/10 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-700" 
                                            style={{ width: `${progress}%` }} 
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-secondary">
                                        <span>{progress.toFixed(1)}% complete</span>
                                        <span>{formatMoneySimple(Math.max(0, target - balance))} remaining</span>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Monthly Cash Flow (Analytics) */}
                        <Card className="border-theme">
                            <CardBody className="p-6">
                                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                    <BarChart3 size={20} className="text-emerald-500" /> Monthly Cash Flow
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-secondary">Nov</span>
                                            <div className="flex gap-4">
                                                <span className="text-emerald-500">520K</span>
                                                <span className="text-rose-500">338K</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                                            </div>
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '50%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-secondary">Dec</span>
                                            <div className="flex gap-4">
                                                <span className="text-emerald-500">600K</span>
                                                <span className="text-rose-500">390K</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                                            </div>
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '60%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Recent Activity Preview */}
                        <Card className="border-theme">
                            <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                                <h3 className="font-bold text-primary flex items-center gap-2">
                                    <Activity size={18} className="text-emerald-500" /> Recent Activity
                                </h3>
                                <button 
                                    onClick={() => setActiveTab('activity')} 
                                    className="text-xs text-emerald-600 font-bold hover:underline"
                                >
                                    View All →
                                </button>
                            </CardHeader>
                            <CardBody className="p-4 space-y-2">
                                {contributions.length === 0 ? (
                                    <div className="py-6 text-center text-secondary">
                                        <Coins size={32} className="text-tertiary mx-auto mb-3" />
                                        <p>No recent activity for this kitty.</p>
                                    </div>
                                ) : (
                                    contributions.slice(0, 5).map((c, i) => (
                                        <ContributionItem key={c.id || i} contribution={c} />
                                    ))
                                )}
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* ===== ACTIVITY ===== */}
                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <Activity size={20} className="text-emerald-500" /> All Activity
                            </h3>
                            <Button variant="outline" size="sm">
                                <Download size={14} className="mr-1.5" /> Export
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {contributions.length === 0 ? (
                                <Card className="border-theme">
                                    <CardBody className="p-8 text-center">
                                        <Coins size={40} className="text-tertiary mx-auto mb-3" />
                                        <h4 className="font-bold text-primary mb-1">No Transactions Yet</h4>
                                        <p className="text-secondary text-sm">Contributions and withdrawals will appear here.</p>
                                    </CardBody>
                                </Card>
                            ) : (
                                contributions.map((c, i) => (
                                    <ContributionItem key={c.id || i} contribution={c} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ===== MEMBERS ===== */}
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Users size={20} className="text-emerald-500" /> Kitty Members
                        </h3>
                        {kitty.members && kitty.members.length > 0 ? (
                            <Card className="border-theme">
                                <CardBody className="p-0 divide-y divide-theme">
                                    {kitty.members.map((member, idx) => (
                                        <div key={member.id || idx} className="p-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {member.user_name?.charAt(0)?.toUpperCase() || member.username?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary">{member.user_name || member.username || 'Member'}</p>
                                                    <p className="text-xs text-secondary">
                                                        Joined {member.joined_at ? formatDate(member.joined_at) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{formatMoneySimple(member.total_contributed || 0)}</p>
                                                <p className="text-[10px] text-secondary">contributed</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        ) : (
                            <Card className="border-theme">
                                <CardBody className="p-8 text-center">
                                    <Users size={40} className="text-tertiary mx-auto mb-3" />
                                    <h4 className="font-bold text-primary mb-1">Members Inherited from Group</h4>
                                    <p className="text-secondary text-sm max-w-md mx-auto">
                                        This kitty shares membership with the parent group. All group members can participate.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="mt-4"
                                        onClick={() => navigate(`/payments/groups/${groupId}?tab=members`)}
                                    >
                                        View Group Members
                                    </Button>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                )}

                {/* ===== SETTINGS ===== */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Settings size={20} className="text-emerald-500" /> Kitty Settings
                        </h3>
                        <Card className="border-theme">
                            <CardBody className="p-0 divide-y divide-theme">
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-primary">Kitty Name</p>
                                        <p className="text-sm text-secondary">{kitty.name}</p>
                                    </div>
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                </div>
                                {kitty.description && (
                                    <div className="p-5">
                                        <p className="font-medium text-primary mb-1">Description</p>
                                        <p className="text-sm text-secondary">{kitty.description}</p>
                                    </div>
                                )}
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-primary">Target Amount</p>
                                        <p className="text-sm text-secondary">{target > 0 ? formatMoneySimple(target) : 'No target set'}</p>
                                    </div>
                                    <Target size={18} className="text-amber-500" />
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-primary">Status</p>
                                        <p className="text-sm text-secondary capitalize">{kitty.status || 'active'}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        kitty.status === 'active' || !kitty.status 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                            : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {kitty.status || 'Active'}
                                    </span>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-primary">Created</p>
                                        <p className="text-sm text-secondary">{kitty.created_at ? formatDate(kitty.created_at) : 'N/A'}</p>
                                    </div>
                                    <Clock size={18} className="text-secondary" />
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupKittyDetail;
