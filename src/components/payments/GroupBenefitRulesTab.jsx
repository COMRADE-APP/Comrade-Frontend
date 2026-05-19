import React, { useState, useEffect } from 'react';
import { 
    Shield, Percent, Clock, CheckCircle, Info, Plus, 
    Trash2, PieChart, TrendingUp, Wallet, ArrowRight, Activity, Zap
} from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody, CardHeader } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { useToast } from '../../contexts/ToastContext';

const GroupBenefitRulesTab = ({ groupId, isAdmin }) => {
    const toast = useToast();
    const [rules, setRules] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRule, setNewRule] = useState({
        distribution_criteria: 'contribution_proportional',
        payout_frequency: 'immediate',
        minimum_payout: 0,
        wallet_percentage: 80,
        group_retain_percentage: 20
    });

    useEffect(() => {
        loadData();
    }, [groupId]);

    const loadData = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const [rulesData, analyticsData] = await Promise.all([
                paymentsService.getGroupBenefitRules(groupId).catch(() => []),
                paymentsService.getGroupAnalytics(groupId).catch(() => null)
            ]);
            
            setRules(Array.isArray(rulesData) ? rulesData : (rulesData?.results || []));
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error loading benefit rules data:', error);
            toast.error('Failed to load rules');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async (e) => {
        e.preventDefault();
        try {
            await paymentsService.createBenefitRule(groupId, newRule);
            setShowAddModal(false);
            loadData();
            toast.success('Benefit rule created successfully!');
        } catch (error) {
            console.error('Error adding rule:', error);
            toast.error('Failed to create rule');
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto rounded-full"></div></div>;
    }

    const totalPool = analytics?.total_balance || 0;
    const activeRule = rules.find(r => r.is_active) || rules[0] || newRule;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-emerald-600" />
                        Benefit Distribution
                    </h3>
                    <p className="text-sm text-secondary">Automate how returns and surplus are distributed.</p>
                </div>
                {isAdmin && (
                    <Button variant="primary" className="gap-2 !bg-emerald-600 shadow-lg shadow-emerald-500/20" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" /> New Rule
                    </Button>
                )}
            </div>

            {/* Connected Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-background">
                    <CardBody className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <TrendingUp className="w-32 h-32 text-emerald-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Projected Distribution
                                </h4>
                                <p className="text-3xl font-bold text-primary mb-1">
                                    {formatMoneySimple(totalPool)}
                                </p>
                                <p className="text-sm text-secondary">Total distributable pool</p>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <ArrowRight className="hidden md:block w-6 h-6 text-emerald-300 mx-4" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-tertiary mb-1">
                                        <Wallet className="w-3 h-3 text-emerald-500" /> To Members
                                    </div>
                                    <div className="text-lg font-bold text-emerald-600">
                                        {formatMoneySimple(totalPool * (activeRule.wallet_percentage / 100))}
                                    </div>
                                    <div className="text-xs text-secondary mt-0.5 font-medium">{activeRule.wallet_percentage}% Share</div>
                                </div>
                                <div className="border-l border-theme pl-4">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-tertiary mb-1">
                                        <Shield className="w-3 h-3 text-amber-500" /> Retained
                                    </div>
                                    <div className="text-lg font-bold text-amber-600">
                                        {formatMoneySimple(totalPool * (activeRule.group_retain_percentage / 100))}
                                    </div>
                                    <div className="text-xs text-secondary mt-0.5 font-medium">{activeRule.group_retain_percentage}% Share</div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card className="border-theme bg-secondary/5">
                    <CardBody className="p-6 flex flex-col justify-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-primary text-sm mb-2">Current Strategy</h4>
                        <p className="text-xs text-secondary leading-relaxed mb-4">
                            Benefits are currently distributed <strong>{activeRule.distribution_criteria.replace('_', ' ')}</strong>, with payouts happening <strong>{activeRule.payout_frequency}</strong>.
                        </p>
                    </CardBody>
                </Card>
            </div>

            {rules.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                        <Percent className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">Default Distribution Active</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        By default, benefits are split proportionally based on member contributions. Add a specific rule to customize this.
                    </p>
                    {isAdmin && (
                        <Button variant="outline" onClick={() => setShowAddModal(true)}>
                            Create Custom Rule
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map((rule) => (
                        <Card key={rule.id} className={`border-theme hover:border-emerald-300 transition-colors ${rule.is_active ? 'ring-1 ring-emerald-500/30' : 'opacity-70'}`}>
                            <CardBody className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-secondary/10 text-secondary'}`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary capitalize text-sm">{rule.distribution_criteria.replace('_', ' ')}</h4>
                                            <p className="text-xs text-secondary mt-0.5">Frequency: <span className="font-semibold text-primary capitalize">{rule.payout_frequency}</span></p>
                                        </div>
                                    </div>
                                    {rule.is_active && (
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                            Active Rule
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-theme">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">Member Wallets</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-emerald-600">{rule.wallet_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary/10 h-1.5 rounded-full mt-2">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${rule.wallet_percentage}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">Group Retained</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-amber-500">{rule.group_retain_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary/10 h-1.5 rounded-full mt-2">
                                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${rule.group_retain_percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-secondary bg-secondary/5 px-2 py-1 rounded-md">
                                        <Clock className="w-3.5 h-3.5" /> Min Payout: {formatMoneySimple(rule.minimum_payout)}
                                    </div>
                                    {isAdmin && (
                                        <button className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Rule Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-theme shadow-2xl">
                        <CardHeader className="flex justify-between items-center p-6 border-b border-theme bg-secondary/5">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" /> New Rule
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-secondary hover:text-primary transition-colors">
                                <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer */}
                            </button>
                        </CardHeader>
                        <CardBody className="p-6">
                            <form onSubmit={handleAddRule} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Distribution Criteria *</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                                        value={newRule.distribution_criteria}
                                        onChange={(e) => setNewRule({...newRule, distribution_criteria: e.target.value})}
                                    >
                                        <option value="equal">Equal split</option>
                                        <option value="contribution_proportional">Proportional to contributions</option>
                                        <option value="ownership_proportional">Proportional to ownership</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">Wallet %</label>
                                        <input 
                                            type="number" 
                                            max="100"
                                            min="0"
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm font-bold text-emerald-600"
                                            value={newRule.wallet_percentage}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const clamped = Math.min(Math.max(val, 0), 100);
                                                setNewRule({...newRule, wallet_percentage: clamped, group_retain_percentage: 100 - clamped});
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1.5">Retained %</label>
                                        <div className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-amber-600 text-sm shadow-sm font-bold flex items-center">
                                            {newRule.group_retain_percentage}%
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Payout Frequency *</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                                        value={newRule.payout_frequency}
                                        onChange={(e) => setNewRule({...newRule, payout_frequency: e.target.value})}
                                    >
                                        <option value="immediate">Immediate (upon realization)</option>
                                        <option value="monthly">Monthly Accumulation</option>
                                        <option value="quarterly">Quarterly Dividend</option>
                                        <option value="annually">Annual Dividend</option>
                                    </select>
                                </div>

                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                    When this rule is activated, exactly <strong>{newRule.wallet_percentage}%</strong> of all returns will flow directly into members' wallets based on a <strong>{newRule.distribution_criteria.replace('_', ' ')}</strong> split. The remaining <strong>{newRule.group_retain_percentage}%</strong> will stay in the group's central pool.
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1 !bg-emerald-600" type="submit">Create Rule</Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupBenefitRulesTab;
