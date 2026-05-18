import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Activity, PieChart, ArrowUpRight, X, Info, Briefcase, BarChart3 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupVenturesTab = ({ groupId }) => {
    const toast = useToast();
    const [ventures, setVentures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [formData, setFormData] = useState({
        venture_name: '',
        description: '',
        total_fund: '',
        available_fund: '',
        investment_focus: '',
        min_investment: '',
        max_investment: '',
    });

    useEffect(() => {
        loadVentures();
    }, [groupId]);

    const loadVentures = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupVentures(groupId);
            setVentures(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading ventures:', error);
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
                total_fund: parseFloat(formData.total_fund) || 0,
                available_fund: parseFloat(formData.available_fund) || 0,
                min_investment: parseFloat(formData.min_investment) || 0,
                max_investment: parseFloat(formData.max_investment) || 0,
                payment_group: groupId,
            };
            await paymentsService.createGroupVenture(payload);
            setShowCreateModal(false);
            resetForm();
            loadVentures();
            toast.success('Venture created successfully!');
        } catch (error) {
            console.error('Failed to create venture:', error);
            toast.error(error.response?.data?.error || 'Failed to create venture. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            venture_name: '',
            description: '',
            total_fund: '',
            available_fund: '',
            investment_focus: '',
            min_investment: '',
            max_investment: '',
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
                    <h3 className="text-lg font-bold text-primary">Group Ventures</h3>
                    <p className="text-sm text-secondary">Investment funds managed by the group for collective investing.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-emerald-600" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> New Venture
                </Button>
            </div>

            {ventures.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Ventures Found</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Start growing your group's wealth by creating investment funds that members can collectively invest in.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Create First Venture
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ventures.map(venture => {
                        const roi = venture.available_fund > 0 
                            ? ((parseFloat(venture.available_fund) - parseFloat(venture.total_fund)) / parseFloat(venture.total_fund)) * 100 
                            : 0;

                        return (
                            <Card key={venture.id} className="border-theme hover:shadow-lg transition-all hover:border-emerald-300">
                                <CardBody className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Net Change</div>
                                            <div className={`text-sm font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-primary truncate">{venture.venture_name}</h4>
                                        <p className="text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">{venture.description || 'No description provided'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-theme">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-tertiary mb-0.5 tracking-tight">Total Fund</p>
                                            <p className="text-sm font-bold text-primary truncate">{formatMoneySimple(venture.total_fund)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-tertiary mb-0.5 tracking-tight">Available</p>
                                            <p className="text-sm font-bold text-emerald-600 truncate">{formatMoneySimple(venture.available_fund)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 text-secondary font-medium"><Activity className="w-3 h-3" /> Status</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                            venture.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                            {venture.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <Button variant="outline" size="sm" className="w-full gap-2 group hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                        View Portfolio <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
                                            Create Investment Venture
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Pool resources and manage collective group investments.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Purpose' },
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
                                        <Input label="Venture Name *" value={formData.venture_name}
                                            onChange={(e) => setFormData({ ...formData, venture_name: e.target.value })}
                                            required placeholder="e.g., Qomrade Real Estate Fund" icon={Briefcase}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Venture Mission / Description *</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={5} required placeholder="Describe what this venture aims to achieve and the strategy it will use..."
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                        <Input label="Investment Focus" value={formData.investment_focus}
                                            onChange={(e) => setFormData({ ...formData, investment_focus: e.target.value })}
                                            placeholder="e.g., Blue-chip Stocks, Local Agri-tech, Property" icon={PieChart}
                                        />
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl flex gap-3">
                                            <DollarSign className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                                Define the total capital needed and set limits for individual participation.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Total Target Capital *" type="number" min="0" step="0.01"
                                                    value={formData.total_fund}
                                                    onChange={(e) => setFormData({ ...formData, total_fund: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <div className="relative">
                                                <Input label="Available For Deployment" type="number" min="0" step="0.01"
                                                    value={formData.available_fund}
                                                    onChange={(e) => setFormData({ ...formData, available_fund: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Min Individual Buy-in" type="number" min="0" step="0.01"
                                                    value={formData.min_investment}
                                                    onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <div className="relative">
                                                <Input label="Max Individual Buy-in" type="number" min="0" step="0.01"
                                                    value={formData.max_investment}
                                                    onChange={(e) => setFormData({ ...formData, max_investment: e.target.value })}
                                                    placeholder="No limit"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl p-6 border border-theme space-y-4 shadow-inner">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-primary">{formData.venture_name}</h3>
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider mt-1 inline-block">
                                                        {formData.investment_focus || 'General Investment'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-tertiary font-bold uppercase">Target Pool</p>
                                                    <p className="text-lg font-bold text-emerald-600">{formatMoneySimple(formData.total_fund || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-theme">
                                                <div>
                                                    <p className="text-tertiary text-[10px] font-bold uppercase mb-1">Buy-in Limits</p>
                                                    <p className="text-primary font-medium text-sm">
                                                        {formatMoneySimple(formData.min_investment || 0)} — {formData.max_investment ? formatMoneySimple(formData.max_investment) : 'Unlimited'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-tertiary text-[10px] font-bold uppercase mb-1">Deployment</p>
                                                    <p className="text-primary font-medium text-sm">{formatMoneySimple(formData.available_fund || 0)}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-tertiary text-[10px] font-bold uppercase mb-1">Strategy</p>
                                                <p className="text-secondary text-xs leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme">
                                                    {formData.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                                By finalizing, you launch this venture for group participation. Members will be able to contribute funds based on the defined buy-in limits.
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
                                    <Button type="button" variant="primary" className="flex-1 !bg-emerald-600" onClick={() => setStep(step + 1)} disabled={step === 1 ? !formData.venture_name || !formData.description : !formData.total_fund}>
                                        Continue
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-emerald-600 shadow-lg shadow-emerald-500/30" onClick={handleCreate} disabled={createLoading}>
                                        {createLoading ? 'Launching...' : 'Launch Venture'}
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

export default GroupVenturesTab;