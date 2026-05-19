import React, { useState, useEffect } from 'react';
import { ShieldCheck, Vote, Clock, Check, X, AlertCircle, Info, ChevronRight, Settings, DollarSign, Layers } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody, CardHeader } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';

const CHANGE_TYPES = [
    { id: 'contribution_amount', label: 'Contribution Amount', icon: DollarSign, desc: 'Change the regular required payment' },
    { id: 'contribution_frequency', label: 'Contribution Frequency', icon: Clock, desc: 'Change how often payments are due' },
    { id: 'late_fee', label: 'Late Fee Policy', icon: AlertCircle, desc: 'Update penalties for missed payments' },
    { id: 'hierarchy_mode', label: 'Hierarchy Mode', icon: Layers, desc: 'Change group voting and admin structure' },
    { id: 'other', label: 'Other Rule', icon: Settings, desc: 'Propose a custom policy change' }
];

const GroupGovernanceTab = ({ groupId }) => {
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposeLoading, setProposeLoading] = useState(false);
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        change_type: 'contribution_amount',
        change_description: '',
        dynamic_values: {}
    });

    useEffect(() => {
        loadRequests();
    }, [groupId]);

    const loadRequests = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupSettingsChanges(groupId);
            setRequests(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading governance requests:', error);
            toast.error('Failed to load governance proposals');
        } finally {
            setLoading(false);
        }
    };

    const handlePropose = async (e) => {
        e.preventDefault();
        setProposeLoading(true);
        try {
            // Build the JSON payload for new_values
            let finalValues = {};
            if (formData.change_type === 'contribution_amount') {
                finalValues = { amount: parseFloat(formData.dynamic_values.amount || 0) };
            } else if (formData.change_type === 'contribution_frequency') {
                finalValues = { frequency: formData.dynamic_values.frequency };
            } else if (formData.change_type === 'late_fee') {
                finalValues = { 
                    fee_amount: parseFloat(formData.dynamic_values.fee_amount || 0),
                    grace_period_days: parseInt(formData.dynamic_values.grace_period_days || 0)
                };
            } else if (formData.change_type === 'hierarchy_mode') {
                finalValues = { mode: formData.dynamic_values.mode };
            } else {
                try {
                    finalValues = JSON.parse(formData.dynamic_values.custom_json || '{}');
                } catch {
                    finalValues = { custom_rule: formData.dynamic_values.custom_text };
                }
            }

            await paymentsService.proposeSettingsChange(groupId, {
                change_type: formData.change_type,
                change_description: formData.change_description,
                new_values: finalValues,
            });
            
            setShowProposeModal(false);
            resetForm();
            loadRequests();
            toast.success('Proposal submitted for voting!');
        } catch (error) {
            console.error('Error proposing change:', error);
            toast.error('Failed to submit proposal');
        } finally {
            setProposeLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setFormData({
            change_type: 'contribution_amount',
            change_description: '',
            dynamic_values: {}
        });
    };

    const handleVote = async (requestId, vote) => {
        try {
            await paymentsService.voteOnSettingsChange(requestId, vote);
            toast.success('Vote recorded!');
            loadRequests();
        } catch (error) {
            console.error('Error voting:', error);
            toast.error('Failed to record vote');
        }
    };

    const updateDynamicValue = (key, value) => {
        setFormData(prev => ({
            ...prev,
            dynamic_values: { ...prev.dynamic_values, [key]: value }
        }));
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Vote className="w-5 h-5 text-amber-500" />
                        Governance & Voting
                    </h3>
                    <p className="text-sm text-secondary">Propose and vote on changes to group rules and financial policies.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-amber-600 shadow-lg shadow-amber-500/20" onClick={() => setShowProposeModal(true)}>
                    <ShieldCheck className="w-4 h-4" /> Propose Change
                </Button>
            </div>

            {requests.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-800">
                        <Vote className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Proposals</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        All group settings are stable. Members can propose changes to contribution amounts, frequencies, or rules.
                    </p>
                    <Button variant="outline" onClick={() => setShowProposeModal(true)}>
                        Start a Proposal
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests.map((req) => (
                        <Card key={req.id} className={`border-theme transition-colors ${req.status === 'pending' ? 'ring-1 ring-amber-500/30' : ''}`}>
                            <CardBody className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            <Vote className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary capitalize text-sm">{req.change_type.replace('_', ' ')}</h4>
                                            <p className="text-xs text-secondary mt-0.5 line-clamp-2">{req.change_description}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/5 rounded-xl mb-4 border border-theme relative overflow-hidden">
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-theme flex items-center justify-center z-10">
                                        <ChevronRight className="w-3 h-3 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">Current</p>
                                        <div className="text-xs font-medium text-secondary opacity-70">
                                            {Object.keys(req.old_values || {}).length > 0 
                                                ? Object.entries(req.old_values).map(([k,v]) => <div key={k}>{k}: {v}</div>)
                                                : 'Not set'}
                                        </div>
                                    </div>
                                    <div className="pl-2">
                                        <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Proposed</p>
                                        <div className="text-xs font-bold text-primary">
                                            {Object.keys(req.new_values || {}).length > 0 
                                                ? Object.entries(req.new_values).map(([k,v]) => <div key={k}>{k}: {v}</div>)
                                                : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            <Check className="w-3.5 h-3.5" /> {req.votes_for}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                            <X className="w-3.5 h-3.5" /> {req.votes_against}
                                        </div>
                                    </div>
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="!text-rose-500 hover:bg-rose-50 border-rose-200 hover:border-rose-300 transition-colors" onClick={() => handleVote(req.id, 'against')}>No</Button>
                                            <Button variant="primary" size="sm" className="!bg-emerald-600 hover:!bg-emerald-700 shadow-sm" onClick={() => handleVote(req.id, 'for')}>Yes</Button>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
            
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    Governance actions require a majority vote based on the group's hierarchy mode. Changes to financial policies may require a higher threshold of approval.
                </p>
            </div>

            {/* Propose Change Modal - Multi-step Wizard */}
            {showProposeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-xl shadow-2xl border-theme flex flex-col max-h-[90vh]">
                        <CardHeader className="flex justify-between items-center p-6 border-b border-theme bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div>
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-500/20">
                                        <Vote className="w-4 h-4" />
                                    </div>
                                    Propose Rule Change
                                </h3>
                                <p className="text-xs text-secondary mt-1">Submit a formal policy change for group voting.</p>
                            </div>
                            <button onClick={() => { setShowProposeModal(false); resetForm(); }} className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-secondary/10">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 px-6 pt-4">
                            {[
                                { id: 1, label: 'Category' },
                                { id: 2, label: 'Policy Details' },
                                { id: 3, label: 'Rationale & Review' }
                            ].map((s) => (
                                <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-amber-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-secondary/10'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-amber-500' : 'text-tertiary'}`}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <CardBody className="p-6 overflow-y-auto flex-1">
                            <form id="proposal-form" onSubmit={handlePropose} className="space-y-6">
                                {/* Step 1: Selection */}
                                {step === 1 && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <h4 className="text-sm font-bold text-primary mb-3">What kind of change are you proposing?</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {CHANGE_TYPES.map(type => (
                                                <label 
                                                    key={type.id} 
                                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        formData.change_type === type.id 
                                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' 
                                                        : 'border-theme hover:bg-secondary/5 hover:border-amber-200'
                                                    }`}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name="change_type" 
                                                        className="mt-1"
                                                        checked={formData.change_type === type.id}
                                                        onChange={() => setFormData({...formData, change_type: type.id, dynamic_values: {}})}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <type.icon className={`w-4 h-4 ${formData.change_type === type.id ? 'text-amber-600' : 'text-secondary'}`} />
                                                            <span className="font-bold text-primary text-sm">{type.label}</span>
                                                        </div>
                                                        <span className="text-xs text-secondary">{type.desc}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Dynamic Fields */}
                                {step === 2 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <h4 className="text-sm font-bold text-primary mb-1">Configure New {CHANGE_TYPES.find(t => t.id === formData.change_type)?.label}</h4>
                                        <p className="text-xs text-secondary mb-4">Set the new rules that will apply if this proposal passes.</p>
                                        
                                        <div className="p-5 bg-secondary/5 rounded-xl border border-theme space-y-4">
                                            {formData.change_type === 'contribution_amount' && (
                                                <div>
                                                    <Input 
                                                        label="New Target Amount *" 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="e.g. 5000"
                                                        value={formData.dynamic_values.amount || ''}
                                                        onChange={(e) => updateDynamicValue('amount', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {formData.change_type === 'contribution_frequency' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary mb-1.5">New Frequency *</label>
                                                    <select 
                                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm"
                                                        value={formData.dynamic_values.frequency || ''}
                                                        onChange={(e) => updateDynamicValue('frequency', e.target.value)}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Frequency</option>
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="quarterly">Quarterly</option>
                                                        <option value="annually">Annually</option>
                                                    </select>
                                                </div>
                                            )}

                                            {formData.change_type === 'late_fee' && (
                                                <div className="space-y-4">
                                                    <Input 
                                                        label="Late Fee Amount *" 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="e.g. 500"
                                                        value={formData.dynamic_values.fee_amount || ''}
                                                        onChange={(e) => updateDynamicValue('fee_amount', e.target.value)}
                                                        required
                                                    />
                                                    <Input 
                                                        label="Grace Period (Days) *" 
                                                        type="number" 
                                                        min="0"
                                                        placeholder="e.g. 3"
                                                        value={formData.dynamic_values.grace_period_days || ''}
                                                        onChange={(e) => updateDynamicValue('grace_period_days', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {formData.change_type === 'hierarchy_mode' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary mb-1.5">New Governance Structure *</label>
                                                    <select 
                                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm"
                                                        value={formData.dynamic_values.mode || ''}
                                                        onChange={(e) => updateDynamicValue('mode', e.target.value)}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Hierarchy</option>
                                                        <option value="democratic">Democratic (1 person = 1 vote)</option>
                                                        <option value="capital_weighted">Capital Weighted (More shares = more votes)</option>
                                                        <option value="admin_dictatorship">Admin Directed (Admins make rules)</option>
                                                    </select>
                                                </div>
                                            )}

                                            {formData.change_type === 'other' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-secondary mb-1.5">Rule Key / Identifier</label>
                                                        <input 
                                                            type="text"
                                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm"
                                                            placeholder="e.g. maximum_loans"
                                                            value={formData.dynamic_values.custom_text || ''}
                                                            onChange={(e) => updateDynamicValue('custom_text', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-secondary mb-1.5">Rule JSON (Advanced)</label>
                                                        <textarea 
                                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm h-20 shadow-sm"
                                                            placeholder='{"max_amount": 50000}'
                                                            value={formData.dynamic_values.custom_json || ''}
                                                            onChange={(e) => updateDynamicValue('custom_json', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Rationale & Review */}
                                {step === 3 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800">
                                            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">Proposal Summary</h4>
                                            <p className="font-bold text-primary text-sm mb-1">
                                                Change {CHANGE_TYPES.find(t => t.id === formData.change_type)?.label}
                                            </p>
                                            <div className="text-xs text-secondary font-mono bg-white dark:bg-gray-800 p-2 rounded border border-theme mt-2">
                                                {JSON.stringify(formData.dynamic_values, null, 2)}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Why is this change necessary? *</label>
                                            <textarea 
                                                className="w-full px-4 py-3 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm h-32 resize-none"
                                                placeholder="Provide context and rationale for group members to read before voting..."
                                                value={formData.change_description}
                                                onChange={(e) => setFormData({...formData, change_description: e.target.value})}
                                                required
                                            />
                                            <p className="text-[10px] text-tertiary mt-1.5">This will be visible to all members on the voting dashboard.</p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </CardBody>
                        
                        <div className="p-6 border-t border-theme bg-secondary/5 flex gap-3">
                            {step > 1 ? (
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
                            ) : (
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowProposeModal(false); resetForm(); }}>Cancel</Button>
                            )}
                            
                            {step < 3 ? (
                                <Button type="button" variant="primary" className="flex-1 !bg-amber-600" onClick={() => setStep(step + 1)}>
                                    Continue
                                </Button>
                            ) : (
                                <Button type="submit" form="proposal-form" variant="primary" className="flex-1 !bg-amber-600 shadow-lg shadow-amber-500/30" disabled={proposeLoading}>
                                    {proposeLoading ? 'Submitting...' : 'Launch Vote'}
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupGovernanceTab;
