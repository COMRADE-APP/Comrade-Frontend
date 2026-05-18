import React, { useState, useEffect } from 'react';
import {
    Plus, HeartHandshake, TrendingUp, Calendar, ArrowRight, X, Info, Target, Building2
} from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupDonationsTab = ({ groupId }) => {
    const toast = useToast();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        goal_amount: '',
        end_date: '',
        cover_image: null,
        organization_name: '',
        organization_type: '',
        organization_address: '',
        organization_reg_number: '',
    });

    useEffect(() => {
        loadDonations();
    }, [groupId]);

    const loadDonations = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupDonations(groupId);
            setDonations(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('description', formData.description);
            payload.append('goal_amount', formData.goal_amount);
            
            if (formData.end_date) {
                payload.append('deadline', new Date(formData.end_date).toISOString());
            }
            payload.append('payment_group', groupId);
            payload.append('donor_type', 'group');
            if (formData.cover_image) {
                payload.append('cover_image', formData.cover_image);
            }

            if (formData.organization_name) {
                const orgDetails = {
                    name: formData.organization_name,
                    type: formData.organization_type || 'hospital',
                    address: formData.organization_address || '',
                    registration_number: formData.organization_reg_number || '',
                };
                payload.append('organization_details', JSON.stringify(orgDetails));
            }

            await paymentsService.createDonation(payload);
            setShowCreateModal(false);
            resetForm();
            loadDonations();
            toast.success('Donation drive started successfully!');
        } catch (error) {
            console.error('Failed to create donation:', error.response?.data || error);
            const errorMsg = error.response?.data?.deadline?.[0] || error.response?.data?.error || 'Failed to start donation drive. Please try again.';
            toast.error(errorMsg);
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            goal_amount: '',
            end_date: '',
            cover_image: null,
            organization_name: '',
            organization_type: 'hospital',
            organization_address: '',
            organization_reg_number: '',
        });
        setImagePreview(null);
        setStep(1);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Donations & Charity</h3>
                    <p className="text-sm text-secondary">Organize and track charitable drives for your group cause.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-rose-600" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> Start Donation Drive
                </Button>
            </div>

            {donations.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
                        <HeartHandshake className="w-8 h-8 text-rose-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Donations</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Start a donation drive to support a cause, a member in need, or a community project.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Create Donation Drive
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {donations.map(donation => {
                        const progress = parseFloat(donation.goal_amount) > 0 
                            ? Math.min(100, (parseFloat(donation.amount_collected || donation.current_amount || 0) / parseFloat(donation.goal_amount)) * 100) 
                            : 0;

                        return (
                            <Card key={donation.id} className="border-theme overflow-hidden flex flex-col h-full hover:shadow-md transition-all hover:border-rose-300">
                                <div className="h-40 bg-secondary/5 overflow-hidden relative shrink-0">
                                    {donation.cover_image_url ? (
                                        <img src={donation.cover_image_url} alt={donation.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-tertiary">
                                            <HeartHandshake className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm border ${
                                            donation.status === 'collecting' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/90 border-theme text-secondary'
                                        }`}>
                                            {donation.status}
                                        </span>
                                    </div>
                                </div>
                                <CardBody className="p-5 flex flex-col flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 dark:border-rose-800 shadow-sm">
                                                <HeartHandshake className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-primary leading-tight line-clamp-1">{donation.name}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-tertiary mt-1 font-medium">
                                                    <Calendar className="w-3 h-3" /> {donation.deadline ? `Ends: ${formatDate(donation.deadline)}` : 'No deadline'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-tertiary font-bold uppercase">Collected</span>
                                                <span className="text-rose-600 font-bold">{formatMoneySimple(donation.amount_collected || donation.current_amount || 0)}</span>
                                            </div>
                                            <span className="text-primary font-bold">{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700 shadow-[0_0_8px_rgba(244,63,94,0.4)]" 
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-right text-tertiary font-bold">
                                            GOAL: {formatMoneySimple(donation.goal_amount)}
                                        </div>
                                    </div>

                                    <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{donation.description}</p>
                                    
                                    <div className="mt-auto pt-2">
                                        <Button variant="outline" className="w-full gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition-all font-bold" onClick={() => window.location.href = `/payments/donations/${donation.id}/`}>
                                            Contribute & Support <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
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
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-rose-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-rose-500 rounded-lg text-white shadow-lg shadow-rose-500/20">
                                                <HeartHandshake className="w-5 h-5" />
                                            </div>
                                            Launch Donation Drive
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Raise funds for social causes, medical needs, or group projects.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Mission' },
                                        { id: 2, label: 'Beneficiary' },
                                        { id: 3, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-rose-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {step === 1 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <Input label="Campaign Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Support Jane's Medical Fund" icon={Target}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">The Story / Purpose *</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={5} required placeholder="Share the context and importance of this drive. Why should members contribute?"
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Goal Amount (USD) *" type="number" min="1" step="0.01"
                                                    value={formData.goal_amount}
                                                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                                    required placeholder="0.00"
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <Input label="Deadline *" type="date"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                required icon={Calendar}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-2">Campaign Cover Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 h-24 rounded-2xl bg-secondary/5 border-2 border-dashed border-theme flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shrink-0">
                                                    {imagePreview ? (
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Plus className="w-6 h-6 text-tertiary group-hover:text-rose-500 transition-colors" />
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            setFormData({ ...formData, cover_image: file });
                                                            setImagePreview(file ? URL.createObjectURL(file) : null);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-secondary leading-relaxed">A compelling image helps people connect with your cause. Max 5MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                                            <Building2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Verified Beneficiary</p>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">Adding organization details increases trust and transparency for the drive.</p>
                                            </div>
                                        </div>

                                        <Input label="Beneficiary Organization" value={formData.organization_name}
                                            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                            placeholder="e.g., Avenue Hospital, Little Angels Orphanage"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Organization Type</label>
                                                <select value={formData.organization_type}
                                                    onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="hospital">Hospital / Medical</option>
                                                    <option value="school">Educational Institution</option>
                                                    <option value="ngo">NGO / Foundation</option>
                                                    <option value="community">Community Group</option>
                                                    <option value="other">Other Entity</option>
                                                </select>
                                            </div>
                                            <Input label="Registration Number" value={formData.organization_reg_number}
                                                onChange={(e) => setFormData({ ...formData, organization_reg_number: e.target.value })}
                                                placeholder="License/Reg ID"
                                            />
                                        </div>
                                        <Input label="Physical Address" value={formData.organization_address}
                                            onChange={(e) => setFormData({ ...formData, organization_address: e.target.value })}
                                            placeholder="e.g., Waiyaki Way, Nairobi"
                                        />
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl overflow-hidden border border-theme shadow-inner">
                                            <div className="h-32 bg-secondary/10 relative">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-tertiary">
                                                        <HeartHandshake className="w-12 h-12 opacity-10" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 left-6">
                                                    <h3 className="text-xl font-bold text-primary bg-white/90 dark:bg-black/80 px-3 py-1 rounded-lg backdrop-blur-sm">{formData.name}</h3>
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-theme">
                                                        <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Target Goal</p>
                                                        <p className="text-lg font-bold text-rose-600">{formatMoneySimple(formData.goal_amount || 0)}</p>
                                                    </div>
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-theme">
                                                        <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Ends On</p>
                                                        <p className="text-lg font-bold text-primary">{formData.end_date || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                {formData.organization_name && (
                                                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                                        <Building2 className="w-5 h-5 text-blue-500" />
                                                        <div>
                                                            <p className="text-xs font-bold text-blue-900 dark:text-blue-100">{formData.organization_name}</p>
                                                            <p className="text-[10px] text-blue-700 dark:text-blue-300 capitalize">{formData.organization_type} • {formData.organization_reg_number || 'No Reg ID'}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-2">
                                                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1.5">Campaign Summary</p>
                                                    <p className="text-secondary text-xs leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme italic">
                                                        "{formData.description}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800 flex gap-3">
                                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                                                Funds will be collected into the group's secure escrow. Disbursements will follow the group's predefined voting and transparency rules.
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
                                    <Button type="button" variant="primary" className="flex-1 !bg-rose-600" onClick={() => setStep(step + 1)} disabled={step === 1 && (!formData.name || !formData.description || !formData.goal_amount)}>
                                        Next Phase
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-rose-600 shadow-lg shadow-rose-500/30" onClick={handleCreate} disabled={createLoading}>
                                        {createLoading ? 'Initializing...' : 'Confirm & Launch Drive'}
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

export default GroupDonationsTab;
