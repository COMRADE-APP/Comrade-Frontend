import React, { useState, useEffect } from 'react';
import { Shield, Percent, Clock, CheckCircle, Info, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupBenefitRulesTab = ({ groupId, isAdmin }) => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRule, setNewRule] = useState({
        distribution_criteria: 'contribution_proportional',
        payout_frequency: 'immediate',
        minimum_payout: 0,
        wallet_percentage: 100,
        group_retain_percentage: 0
    });

    useEffect(() => {
        loadRules();
    }, [groupId]);

    const loadRules = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupBenefitRules(groupId);
            setRules(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading benefit rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async (e) => {
        e.preventDefault();
        try {
            await paymentsService.createBenefitRule(groupId, newRule);
            setShowAddModal(false);
            loadRules();
        } catch (error) {
            console.error('Error adding rule:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Benefit Distribution Rules</h3>
                    <p className="text-sm text-secondary">Define how profits and returns are split among members.</p>
                </div>
                {isAdmin && (
                    <Button variant="primary" className="gap-2" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4" /> Add Rule
                    </Button>
                )}
            </div>

            {rules.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <Percent className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">Default Distribution active</h4>
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
                        <Card key={rule.id} className={`border-theme ${rule.is_active ? 'ring-1 ring-primary/20' : 'opacity-60'}`}>
                            <CardBody className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary capitalize">{rule.distribution_criteria.replace('_', ' ')}</h4>
                                            <p className="text-xs text-secondary">Payout: <span className="font-semibold text-primary capitalize">{rule.payout_frequency}</span></p>
                                        </div>
                                    </div>
                                    {rule.is_active && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Active</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-theme">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">To Wallets</p>
                                        <div className="text-lg font-bold text-indigo-600">{rule.wallet_percentage}%</div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">Retained</p>
                                        <div className="text-lg font-bold text-primary">{rule.group_retain_percentage}%</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[10px] text-secondary">
                                        <Clock className="w-3 h-3" /> Min Payout: {formatMoneySimple(rule.minimum_payout)}
                                    </div>
                                    {isAdmin && (
                                        <button className="text-rose-500 hover:text-rose-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 leading-relaxed">
                    Benefit distribution rules govern how the system automatically handles returns from investments or surpluses in the group pool. Rules can be toggled or updated by admins at any time.
                </p>
            </div>

            {/* Add Rule Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-theme shadow-2xl">
                        <CardBody className="p-6">
                            <h3 className="text-xl font-bold text-primary mb-4">New Distribution Rule</h3>
                            <form onSubmit={handleAddRule} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Criteria</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={newRule.distribution_criteria}
                                        onChange={(e) => setNewRule({...newRule, distribution_criteria: e.target.value})}
                                    >
                                        <option value="equal">Equal split</option>
                                        <option value="contribution_proportional">Proportional to contributions</option>
                                        <option value="ownership_proportional">Proportional to ownership</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Wallet Percentage (%)</label>
                                    <input 
                                        type="number" 
                                        max="100"
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={newRule.wallet_percentage}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setNewRule({...newRule, wallet_percentage: val, group_retain_percentage: 100 - val});
                                        }}
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1" type="submit">Create Rule</Button>
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
