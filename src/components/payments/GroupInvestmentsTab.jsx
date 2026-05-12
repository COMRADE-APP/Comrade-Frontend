import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Activity, PieChart, ArrowUpRight, X, Info, Briefcase, BarChart3 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupInvestmentsTab = ({ groupId }) => {
    const toast = useToast();
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const [createLoading, setCreateLoading] = useState(false);

    const [formData, setFormData] = useState({
        investment_name: '',
        type: 'Commercial Venture',
        amount_invested: '',
        current_value: '',
        status: 'active',
        description: '',
    });

    useEffect(() => {
        loadInvestments();
    }, [groupId]);

    const loadInvestments = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupInvestmentsByGroupId(groupId);
            setInvestments(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading investments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        try {
            const payload = {
                ...formData,
                amount_invested: parseFloat(formData.amount_invested),
                current_value: parseFloat(formData.current_value) || parseFloat(formData.amount_invested),
                payment_group: groupId,
            };
            await paymentsService.createGroupInvestment(payload);
            setShowCreateModal(false);
            resetForm();
            loadInvestments();
            toast.success('Investment recorded successfully!');
        } catch (error) {
            console.error('Failed to create investment:', error);
            toast.error('Failed to record investment. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            investment_name: '',
            type: 'Commercial Venture',
            amount_invested: '',
            current_value: '',
            status: 'active',
            description: '',
        });
        setStep(1);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Investments</h3>
                    <p className="text-sm text-secondary">Manage and track your group's investment portfolio.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-emerald-600 shadow-lg shadow-emerald-600/20" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> New Investment
                </Button>
            </div>

            {investments.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Investments Found</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Start growing your group's wealth by exploring our curated investment opportunities or recording manual entries.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Record First Investment
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investments.map(inv => {
                        const invested = parseFloat(inv.amount_invested) || 0;
                        const current = parseFloat(inv.current_value) || invested;
                        const roi = invested > 0 
                            ? ((current - invested) / invested) * 100 
                            : 0;

                        return (
                            <Card key={inv.id} className="border-theme hover:border-emerald-300 transition-all hover:shadow-md">
                                <CardBody className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Net ROI</div>
                                            <div className={`text-sm font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-primary truncate">{inv.investment_name}</h4>
                                        <p className="text-[10px] text-secondary font-bold uppercase tracking-tight">{inv.type || 'Commercial Venture'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-theme bg-secondary/5 -mx-4 px-4 shadow-inner">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-tertiary mb-0.5">Invested</p>
                                            <p className="text-sm font-bold text-primary">{formatMoneySimple(invested)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-tertiary mb-0.5">Current</p>
                                            <p className="text-sm font-bold text-emerald-600">{formatMoneySimple(current)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 text-tertiary font-bold uppercase text-[10px]"><Activity className="w-3 h-3" /> Status</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                            inv.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-secondary/10 text-secondary border-transparent'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </div>

                                    <Button variant="outline" size="sm" className="w-full gap-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold transition-all group">
                                        Portfolio Analytics <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border-theme">
                        <CardBody className="p-0 overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-emerald-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            Record Investment
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Track asset performance and group wealth growth.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Asset' },
                                        { id: 2, label: 'Capital' },
                                        { id: 3, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-emerald-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {step === 1 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <Input label="Asset Name *" value={formData.investment_name}
                                            onChange={(e) => setFormData({ ...formData, investment_name: e.target.value })}
                                            required placeholder="e.g., Prime Real Estate Plot A" icon={Briefcase}
                                        />
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Asset Category</label>
                                                <select value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="Commercial Venture">Commercial Venture</option>
                                                    <option value="Stock/Equity">Stock/Equity</option>
                                                    <option value="Real Estate">Real Estate</option>
                                                    <option value="Crypto/Web3">Crypto/Web3</option>
                                                    <option value="Agribusiness">Agribusiness</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Initial Status</label>
                                                <select value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="active">Active Portfolio</option>
                                                    <option value="pending">Awaiting Closing</option>
                                                    <option value="closed">Exited/Closed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Investment Description</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4} placeholder="What is the strategy for this asset?"
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Amount Invested (USD) *" type="number" min="1" step="0.01"
                                                    value={formData.amount_invested}
                                                    onChange={(e) => setFormData({ ...formData, amount_invested: e.target.value })}
                                                    required placeholder="0.00" icon={DollarSign}
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <div className="relative">
                                                <Input label="Current Market Value" type="number" min="0" step="0.01"
                                                    value={formData.current_value}
                                                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                                    placeholder="0.00" icon={TrendingUp}
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl flex gap-3">
                                            <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
                                                Accurate reporting of current market value allows the system to calculate the group's net worth and ROI accurately. We recommend updating this quarterly.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl border border-theme overflow-hidden shadow-inner p-6 space-y-6">
                                            <div className="flex justify-between items-start border-b border-theme pb-4">
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">Asset Name</p>
                                                    <h3 className="text-xl font-bold text-primary">{formData.investment_name}</h3>
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider mt-1 inline-block">
                                                        {formData.type}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">Net Investment</p>
                                                    <p className="text-2xl font-black text-emerald-600">{formatMoneySimple(formData.amount_invested || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1">Valuation</p>
                                                    <p className="text-lg font-bold text-primary">
                                                        {formatMoneySimple(formData.current_value || formData.amount_invested || 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1">Portfolio Status</p>
                                                    <p className="text-lg font-bold text-primary capitalize">
                                                        {formData.status}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-theme">
                                                <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-2">Strategy Overview</p>
                                                <p className="text-secondary text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme italic shadow-sm min-h-[80px]">
                                                    "{formData.description || 'No strategy description provided.'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-theme bg-secondary/5 flex gap-3">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
                                ) : (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                )}
                                
                                {step < totalSteps ? (
                                    <Button type="button" variant="primary" className="flex-1 !bg-emerald-600 shadow-lg shadow-emerald-600/20" onClick={() => setStep(step + 1)} disabled={step === 1 && !formData.investment_name}>
                                        Continue
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-emerald-600 shadow-lg shadow-emerald-600/30" onClick={handleCreate} disabled={createLoading || !formData.amount_invested}>
                                        {createLoading ? 'Recording...' : 'Finalize Record'}
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupInvestmentsTab;
