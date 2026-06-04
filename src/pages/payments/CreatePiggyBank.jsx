import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { CheckCircle, User, Users, Info, ArrowLeft } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';

const CreatePiggyBank = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [groups, setGroups] = useState([]);
    const [createStep, setCreateStep] = useState(1);
    const [createLoading, setCreateLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', description: '', target_amount: '', maturity_date: '',
        locking_status: 'unlocked', piggy_type: 'individual',
        payment_group: null, savings_type: 'normal', contribution_mode: 'equal',
    });

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const groupsData = await paymentsService.getMyGroups();
                setGroups(Array.isArray(groupsData) ? groupsData : (groupsData.results || []));
            } catch (error) {
                console.error('Error loading groups:', error);
            }
        };
        loadGroups();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (createStep < 3) { setCreateStep(createStep + 1); return; }
        setCreateLoading(true);
        try {
            const payload = {
                name: formData.name, description: formData.description,
                target_amount: parseFloat(formData.target_amount) || 0,
                maturity_date: formData.maturity_date || null,
                locking_status: formData.locking_status,
                savings_type: formData.savings_type,
                contribution_mode: formData.piggy_type === 'group' ? formData.contribution_mode : 'equal',
            };
            if (formData.piggy_type === 'group' && formData.payment_group) {
                payload.payment_group = formData.payment_group;
            }
            const res = await paymentsService.createPiggyBank(payload);
            toast.success('Piggy bank created successfully!');
            navigate(ROUTES.PIGGY_BANKS);
        } catch (error) {
            console.error('Failed to create piggy bank:', error.response?.data || error);
            let errMsg = 'Failed to create piggy bank. Please try again.';
            if (error.response?.data) {
                if (typeof error.response.data === 'object') {
                    errMsg = Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(' | ');
                } else {
                    errMsg = String(error.response.data);
                }
            }
            toast.error(errMsg);
        } finally { setCreateLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(ROUTES.PIGGY_BANKS)} className="p-2 bg-elevated hover:bg-secondary/10 rounded-lg transition-colors border border-theme shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Create Piggy Bank</h1>
                    <p className="text-secondary mt-0.5 text-sm">Start saving towards a new goal</p>
                </div>
            </div>

            <Card className="w-full shadow-lg">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-primary">
                            {createStep === 1 ? 'Basic Details' : createStep === 2 ? 'Configure Target & Savings Type' : 'Review & Confirm'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        {[1, 2, 3].map(s => (
                            <React.Fragment key={s}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    s < createStep ? 'bg-green-500 text-white' : s === createStep ? 'bg-emerald-600 text-white' : 'bg-secondary/10 text-secondary'
                                }`}>
                                    {s < createStep ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && <div className={`flex-1 h-1 rounded-full ${s < createStep ? 'bg-green-500' : 'bg-secondary/10'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                        {createStep === 1 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Input label="Piggy Bank Name *" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required placeholder="e.g., Vacation Fund, Emergency Savings"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Description (Optional)</label>
                                    <textarea value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3} placeholder="What are you saving for?"
                                        className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none text-sm transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Ownership Type</label>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setFormData({ ...formData, piggy_type: 'individual', payment_group: null })}
                                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                                formData.piggy_type === 'individual' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-theme hover:border-emerald-200 bg-elevated'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${formData.piggy_type === 'individual' ? 'bg-emerald-100' : 'bg-secondary/10'}`}>
                                                <User className={`w-5 h-5 ${formData.piggy_type === 'individual' ? 'text-emerald-600' : 'text-tertiary'}`} />
                                            </div>
                                            <p className="font-bold text-sm text-primary">Personal</p>
                                            <p className="text-xs text-secondary mt-1 hidden sm:block">Managed only by you</p>
                                        </button>
                                        <button type="button" onClick={() => setFormData({ ...formData, piggy_type: 'group' })}
                                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                                formData.piggy_type === 'group' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-theme hover:border-emerald-200 bg-elevated'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${formData.piggy_type === 'group' ? 'bg-emerald-100' : 'bg-secondary/10'}`}>
                                                <Users className={`w-5 h-5 ${formData.piggy_type === 'group' ? 'text-emerald-600' : 'text-tertiary'}`} />
                                            </div>
                                            <p className="font-bold text-sm text-primary">Group</p>
                                            <p className="text-xs text-secondary mt-1 hidden sm:block">Managed with friends</p>
                                        </button>
                                    </div>
                                </div>
                                {formData.piggy_type === 'group' && (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <label className="block text-sm font-medium text-secondary mb-1.5">Link to Payment Group *</label>
                                        <select value={formData.payment_group || ''} required={formData.piggy_type === 'group'}
                                            onChange={(e) => setFormData({ ...formData, payment_group: e.target.value })}
                                            className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-shadow">
                                            <option value="">Choose a group...</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        {groups.length === 0 && (
                                            <p className="text-sm text-amber-600 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>You are not a member of any groups. <button type="button" onClick={() => navigate('/payments/create-group')} className="font-bold hover:underline">Create one first</button> to make a group piggy bank.</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {createStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
                                    <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5" /> Almost there!
                                    </h3>
                                    <p className="text-emerald-800 text-sm">Review your piggy bank details below before creating it.</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-elevated border border-theme p-4 rounded-xl">
                                        <span className="text-secondary font-medium text-sm">Name</span>
                                        <span className="text-primary font-bold">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-elevated border border-theme p-4 rounded-xl">
                                        <span className="text-secondary font-medium text-sm">Type</span>
                                        <span className="text-primary font-bold capitalize">{formData.piggy_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-elevated border border-theme p-4 rounded-xl">
                                        <span className="text-secondary font-medium text-sm">Target Amount</span>
                                        <span className="text-primary font-bold">${parseFloat(formData.target_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-elevated border border-theme p-4 rounded-xl">
                                        <span className="text-secondary font-medium text-sm">Savings Policy</span>
                                        <span className="text-primary font-bold capitalize">{formData.savings_type.replace('_', ' ')}</span>
                                    </div>
                                    {formData.maturity_date && (
                                        <div className="flex justify-between items-center bg-elevated border border-theme p-4 rounded-xl">
                                            <span className="text-secondary font-medium text-sm">Target Date</span>
                                            <span className="text-primary font-bold">{new Date(formData.maturity_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {createStep === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Target Amount *" type="number" min="1" step="0.01"
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        required placeholder="e.g., 1000.00"
                                    />
                                    <Input label="Target Date (Optional)" type="date" value={formData.maturity_date}
                                        onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Savings Policy</label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'normal', title: 'Standard Flexible Savings', desc: 'Can deposit and withdraw at any time without restrictions.' },
                                            { value: 'locked', title: 'Strictly Locked', desc: 'Funds cannot be withdrawn until the target date or amount is reached.' },
                                            { value: 'fixed_deposit', title: 'Fixed Deposit (Yield)', desc: 'Earn interest over time, but face a 2% penalty for early withdrawal.' },
                                        ].map(opt => (
                                            <label key={opt.value} className="flex items-start gap-3 p-4 rounded-xl border-2 border-theme hover:bg-secondary/5 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50 transition-all">
                                                <input type="radio" name="savings_type" value={opt.value}
                                                    checked={formData.savings_type === opt.value}
                                                    onChange={(e) => setFormData({ ...formData, savings_type: e.target.value, locking_status: e.target.value !== 'normal' ? 'locked' : formData.locking_status })}
                                                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-primary mb-0.5">{opt.title}</p>
                                                    <p className="text-sm text-secondary leading-snug">{opt.desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                {formData.piggy_type === 'group' && (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <label className="block text-sm font-medium text-secondary mb-2">Contribution Mode</label>
                                        <div className="flex gap-3">
                                            {['equal', 'proportional'].map(m => (
                                                <button key={m} type="button" onClick={() => setFormData({ ...formData, contribution_mode: m })}
                                                    className={`flex-1 p-3 rounded-xl border-2 text-center text-sm font-bold capitalize transition-all ${
                                                        formData.contribution_mode === m ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-theme text-secondary hover:bg-secondary/5'
                                                    }`}>
                                                    {m === 'equal' ? 'Equal Split (Everyone pays same)' : 'Custom Proportions'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`p-4 rounded-xl border ${formData.piggy_type === 'group' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-start gap-3">
                                        <Info className={`w-5 h-5 mt-0.5 shrink-0 ${formData.piggy_type === 'group' ? 'text-amber-600' : 'text-emerald-600'}`} />
                                        <p className={`text-sm font-medium leading-snug ${formData.piggy_type === 'group' ? 'text-amber-800' : 'text-emerald-800'}`}>
                                            {formData.piggy_type === 'group' 
                                                ? 'As a Group Piggy Bank, important actions like extending maturity, dissolving, or withdrawing will require 100% consensus voting from all group members to execute.'
                                                : 'As a Personal Piggy Bank, you maintain full control and all actions will take effect immediately without requiring any approvals.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 mt-8 border-t border-theme">
                            {createStep > 1 && (
                                <Button type="button" variant="outline" className="flex-1 py-3" onClick={() => setCreateStep(createStep - 1)}>Back</Button>
                            )}
                            <Button type="button" variant="outline" className={createStep === 1 ? "flex-1 py-3" : "py-3 px-6"} onClick={() => navigate(ROUTES.PIGGY_BANKS)}>Cancel</Button>
                            <Button type="submit" variant="primary" className="flex-[2] py-3 shadow-md"
                                disabled={createLoading || (createStep === 1 && !formData.name) || (createStep === 1 && formData.piggy_type === 'group' && !formData.payment_group) || (createStep === 2 && !formData.target_amount)}>
                                {createLoading ? 'Creating...' : createStep < 3 ? 'Next Step' : 'Confirm & Create'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default CreatePiggyBank;
