import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PiggyBank, Lock, Unlock, Users, ChevronRight, X, CheckCircle, User, DollarSign } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupPiggyBanksTab = ({ groupId }) => {
    const toast = useToast();
    const navigate = useNavigate();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const totalSteps = 3;
    const [createLoading, setCreateLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        maturity_date: '',
        locking_status: 'unlocked',
        savings_type: 'normal',
        contribution_mode: 'equal',
    });

    useEffect(() => {
        loadPiggyBanks();
    }, [groupId]);

    const loadPiggyBanks = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupPiggyBanks(groupId);
            setPiggyBanks(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading group piggy banks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                target_amount: parseFloat(formData.target_amount) || 0,
                maturity_date: formData.maturity_date || null,
                locking_status: formData.locking_status,
                savings_type: formData.savings_type,
                payment_group: groupId,
                contribution_mode: formData.contribution_mode,
            };
            await paymentsService.createPiggyBank(payload);
            setShowCreateModal(false);
            resetForm();
            loadPiggyBanks();
            toast.success('Group Piggy Bank created successfully!');
        } catch (error) {
            console.error('Failed to create piggy bank:', error.response?.data || error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to create piggy bank. Please try again.';
            toast.error(errorMsg);
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            target_amount: '',
            maturity_date: '',
            locking_status: 'unlocked',
            savings_type: 'normal',
            contribution_mode: 'equal',
        });
        setCreateStep(1);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Piggy Banks</h3>
                    <p className="text-sm text-secondary">Create savings goals for specific items or targets within this group.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-pink-600" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> New Piggy Bank
                </Button>
            </div>

            {piggyBanks.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-4">
                        <PiggyBank className="w-8 h-8 text-pink-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Piggy Banks Yet</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Start saving for specific group needs or future projects.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Start First Piggy Bank
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {piggyBanks.map(pb => {
                        const progress = pb.target_amount > 0 
                            ? Math.min(100, (parseFloat(pb.current_amount || 0) / parseFloat(pb.target_amount)) * 100) 
                            : 0;
                        
                        return (
                            <Card key={pb.id} className="border-theme hover:border-pink-300 transition-all hover:shadow-md">
                                <CardBody className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600 border border-pink-100 dark:border-pink-800 shadow-sm">
                                            <PiggyBank className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Balance</div>
                                            <div className="text-lg font-bold text-primary">{formatMoneySimple(pb.current_amount || 0)}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold text-primary truncate">{pb.name}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {pb.locking_status === 'locked' ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800">
                                                    <Lock className="w-3 h-3" /> Locked
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                                                    <Unlock className="w-3 h-3" /> Flexible
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800 capitalize">
                                                {pb.savings_type?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {pb.target_amount > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-secondary uppercase">Progress</span>
                                                <span className="text-primary">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-pink-500 transition-all duration-700 shadow-[0_0_8px_rgba(236,72,153,0.4)]" 
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-right text-tertiary font-bold">
                                                GOAL: {formatMoneySimple(pb.target_amount)}
                                            </div>
                                        </div>
                                    )}

                                    <Button variant="outline" size="sm" className="w-full gap-2 border-pink-100 text-pink-600 hover:bg-pink-50 font-bold transition-all group" onClick={() => navigate(`/payments/piggy-banks/${pb.id}`)}>
                                        Open Piggy Bank <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-pink-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-pink-500 rounded-lg text-white shadow-lg shadow-pink-500/20">
                                                <PiggyBank className="w-5 h-5" />
                                            </div>
                                            New Group Piggy Bank
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Set clear savings targets for shared group goals.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Mission' },
                                        { id: 2, label: 'Terms' },
                                        { id: 3, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${createStep >= s.id ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${createStep === s.id ? 'text-pink-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {createStep === 1 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <Input label="Goal Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Annual Group Trip 2024" icon={Target}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Description</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4} placeholder="Describe the goal for this piggy bank..."
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Contribution Split Mode</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'equal', title: 'Equal Share', icon: Users },
                                                    { id: 'proportional', title: 'Custom Share', icon: User }
                                                ].map(m => (
                                                    <button key={m.id} type="button" onClick={() => setFormData({ ...formData, contribution_mode: m.id })}
                                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                            formData.contribution_mode === m.id 
                                                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 text-pink-700 dark:text-pink-300' 
                                                            : 'border-theme text-secondary hover:bg-secondary/5'
                                                        }`}>
                                                        <m.icon className="w-5 h-5" />
                                                        <span className="text-xs font-bold">{m.title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {createStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Target Goal (USD) *" type="number" min="1" step="0.01"
                                                    value={formData.target_amount}
                                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                                    required placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <Input label="Maturity Date" type="date" value={formData.maturity_date}
                                                onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                                icon={CalendarIcon}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-3">Savings Strategy</label>
                                            <div className="space-y-3">
                                                {[
                                                    { value: 'normal', title: 'Flexible Savings', desc: 'No withdrawal limits or penalties.', icon: Unlock },
                                                    { value: 'locked', title: 'Goal-Locked', desc: 'Strictly no withdrawals until goal/date.', icon: Lock },
                                                    { value: 'fixed_deposit', title: 'Fixed Performance', desc: 'Higher yields with early withdrawal penalties.', icon: TrendingUp },
                                                ].map(opt => (
                                                    <label key={opt.value} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-theme hover:bg-secondary/5 cursor-pointer transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50 dark:has-[:checked]:bg-pink-900/10">
                                                        <input type="radio" name="savings_type" value={opt.value}
                                                            checked={formData.savings_type === opt.value}
                                                            onChange={(e) => setFormData({ ...formData, savings_type: e.target.value, locking_status: e.target.value !== 'normal' ? 'locked' : formData.locking_status })}
                                                            className="sr-only"
                                                        />
                                                        <div className={`p-2 rounded-lg ${formData.savings_type === opt.value ? 'bg-pink-500 text-white shadow-lg' : 'bg-secondary/10 text-secondary'}`}>
                                                            <opt.icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm text-primary">{opt.title}</p>
                                                            <p className="text-xs text-secondary">{opt.desc}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.savings_type === opt.value ? 'border-pink-500 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'border-theme'}`}>
                                                            {formData.savings_type === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {createStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl border border-theme overflow-hidden shadow-inner">
                                            <div className="p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary">{formData.name}</h3>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">
                                                                {formData.savings_type.replace('_', ' ')}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded-md tracking-wider">
                                                                {formData.contribution_mode} Split
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-tertiary font-bold uppercase">Target</p>
                                                        <p className="text-lg font-bold text-pink-600">{formatMoneySimple(formData.target_amount || 0)}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-theme">
                                                    <p className="text-tertiary text-[10px] font-bold uppercase mb-1.5">Goal Intent</p>
                                                    <p className="text-secondary text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme italic shadow-sm">
                                                        "{formData.description || 'Saving for a shared group priority.'}"
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-800">
                                                    <CalendarIcon className="w-4 h-4 text-pink-500" />
                                                    <p className="text-xs font-bold text-pink-900 dark:text-pink-100">
                                                        Maturity Date: {formData.maturity_date || 'Ongoing (No Date Set)'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                                Group piggy banks are shared accounts. Contributions will be visible to all members to ensure transparency and accountability.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-theme bg-secondary/5 flex gap-3">
                                {createStep > 1 ? (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateStep(createStep - 1)}>Back</Button>
                                ) : (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                )}
                                
                                {createStep < totalSteps ? (
                                    <Button type="button" variant="primary" className="flex-1 !bg-pink-600" onClick={() => setCreateStep(createStep + 1)} disabled={createStep === 1 && !formData.name}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-pink-600 shadow-lg shadow-pink-500/30" onClick={handleCreate} disabled={createLoading}>
                                        {createLoading ? 'Initializing...' : 'Launch Piggy Bank'}
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

export default GroupPiggyBanksTab;
