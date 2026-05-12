import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, ArrowRight, Activity, TrendingUp, Target, X, CheckCircle, Info } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupKittiesTab = ({ groupId }) => {
    const toast = useToast();
    const navigate = useNavigate();
    const [kitties, setKitties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const [createLoading, setCreateLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        contribution_type: 'flexible',
        contribution_amount: '',
        frequency: 'one_time',
    });

    useEffect(() => {
        loadKitties();
    }, [groupId]);

    const loadKitties = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupKitties(groupId);
            setKitties(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading kitties:', error);
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
                target_amount: parseFloat(formData.target_amount) || 0,
                contribution_amount: parseFloat(formData.contribution_amount) || 0,
                parent_group: groupId,
                is_kitty: true,
                group_type: 'kitty',
            };
            await paymentsService.createPaymentGroup(payload);
            setShowCreateModal(false);
            resetForm();
            loadKitties();
            toast.success('Kitty created successfully!');
        } catch (error) {
            console.error('Failed to create kitty:', error);
            toast.error('Failed to create kitty. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            target_amount: '',
            contribution_type: 'flexible',
            contribution_amount: '',
            frequency: 'one_time',
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
                    <h3 className="text-lg font-bold text-primary">Group Kitties</h3>
                    <p className="text-sm text-secondary">Manage sub-funds and specialized pools for the group.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-indigo-600" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> New Kitty
                </Button>
            </div>

            {kitties.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Kitties Yet</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Create a dedicated kitty to collect funds for specific events, emergencies, or shared goals.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Start First Kitty
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kitties.map(kitty => {
                        const progress = kitty.target_amount > 0 
                            ? Math.min(100, (parseFloat(kitty.current_amount || 0) / parseFloat(kitty.target_amount)) * 100) 
                            : 0;
                        
                        return (
                            <Card key={kitty.id} className="border-theme hover:border-indigo-300 transition-all hover:shadow-md">
                                <CardBody className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Balance</div>
                                            <div className="text-lg font-bold text-primary">{formatMoneySimple(kitty.current_amount)}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold text-primary truncate">{kitty.name}</h4>
                                        <p className="text-xs text-secondary line-clamp-1 mt-0.5">{kitty.description || 'Dedicated sub-pool'}</p>
                                    </div>

                                    {kitty.target_amount > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-secondary uppercase">Progress</span>
                                                <span className="text-primary">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500 transition-all duration-700 shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-right text-tertiary font-bold">
                                                GOAL: {formatMoneySimple(kitty.target_amount)}
                                            </div>
                                        </div>
                                    )}

                                    <Button variant="outline" size="sm" className="w-full gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold transition-all group" onClick={() => navigate(`/payments/groups/${kitty.id}?tab=overview`)}>
                                        Open Kitty <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-indigo-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            Create New Kitty
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Dedicated sub-pools for specific group needs.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Purpose' },
                                        { id: 2, label: 'Structure' },
                                        { id: 3, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-indigo-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {step === 1 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <Input label="Kitty Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Emergency Medical Fund" icon={Activity}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Description / Purpose</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4} placeholder="What is this fund for?"
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Target Goal" type="number" min="0" step="0.01"
                                                    value={formData.target_amount}
                                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Frequency</label>
                                                <select value={formData.frequency}
                                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="one_time">One Time Pool</option>
                                                    <option value="daily">Daily Contributions</option>
                                                    <option value="weekly">Weekly Contributions</option>
                                                    <option value="monthly">Monthly Contributions</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl flex gap-3">
                                            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                                                Kitties inherit the group's existing member base. All members will be able to see and contribute to this kitty immediately upon creation.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl border border-theme overflow-hidden shadow-inner">
                                            <div className="p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary">{formData.name}</h3>
                                                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider mt-1 inline-block">
                                                            {formData.frequency.replace('_', ' ')} KITTY
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-tertiary font-bold uppercase">Target Goal</p>
                                                        <p className="text-lg font-bold text-indigo-600">
                                                            {formData.target_amount ? formatMoneySimple(formData.target_amount, 'USD') : 'Flexible Pool'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-theme">
                                                    <p className="text-tertiary text-[10px] font-bold uppercase mb-1.5">Goal Description</p>
                                                    <p className="text-secondary text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme italic shadow-sm">
                                                        "{formData.description || 'Dedicated kitty for group priorities.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
                                                By launching, this kitty becomes active. Members can start contributing funds immediately through their dashboard.
                                            </p>
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
                                    <Button type="button" variant="primary" className="flex-1 !bg-indigo-600" onClick={() => setStep(step + 1)} disabled={step === 1 && !formData.name}>
                                        Continue
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-indigo-600 shadow-lg shadow-indigo-500/30" onClick={handleCreate} disabled={createLoading}>
                                        {createLoading ? 'Creating...' : 'Confirm & Launch Kitty'}
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

export default GroupKittiesTab;
