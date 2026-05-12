import React, { useState, useEffect } from 'react';
import { Plus, Briefcase, Building2, ExternalLink, ShieldCheck, MapPin, X, Info, Globe, Building } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupBusinessesTab = ({ groupId }) => {
    const toast = useToast();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [logo, setLogo] = useState(null);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        name: '',
        industry: 'tech',
        description: '',
        stage: 'idea',
        website: '',
        city: '',
        country: 'Kenya',
    });

    useEffect(() => {
        loadBusinesses();
    }, [groupId]);

    const loadBusinesses = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupBusinesses(groupId);
            setBusinesses(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    data.append(key, value);
                }
            });
            data.append('payment_group', groupId);
            if (logo) data.append('logo', logo);

            await paymentsService.registerBusiness(data);
            setShowCreateModal(false);
            resetForm();
            loadBusinesses();
            toast.success('Business registered successfully!');
        } catch (error) {
            console.error('Failed to register business:', error);
            toast.error(error.response?.data?.error || 'Failed to register business. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            industry: 'tech',
            description: '',
            stage: 'idea',
            website: '',
            city: '',
            country: 'Kenya',
            contact_email: '',
            phone_number: '',
            country_code: '+254',
            valuation: '',
            is_charity: false,
        });
        setLogo(null);
        setStep(1);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Businesses</h3>
                    <p className="text-sm text-secondary">Venture capital and businesses owned or funded by the group.</p>
                </div>
                <Button variant="primary" className="gap-2" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> Register Business
                </Button>
            </div>

            {businesses.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Businesses Registered</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Incorporate a group business or register an existing venture to track equity and funding rounds.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Start Group Venture
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businesses.map(biz => (
                        <Card key={biz.id} className="border-theme hover:border-blue-300 transition-colors">
                            <CardBody className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                            {biz.logo ? <img src={biz.logo} alt="" className="w-full h-full object-cover rounded-lg" /> : <Building2 className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary text-base">{biz.name}</h4>
                                            <div className="flex items-center gap-3 text-xs text-secondary mt-0.5">
                                                <span className="flex items-center gap-1 font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded capitalize">{biz.industry}</span>
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {biz.city || 'Remote'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {biz.is_verified && (
                                        <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full" title="Verified Business">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{biz.description}</p>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-secondary/5 p-2 rounded-lg text-center border border-theme/50">
                                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Stage</p>
                                        <p className="text-xs font-bold text-primary capitalize truncate">{biz.stage.replace('_', ' ')}</p>
                                    </div>
                                    <div className="bg-secondary/5 p-2 rounded-lg text-center border border-theme/50">
                                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Valuation</p>
                                        <p className="text-xs font-bold text-primary truncate">{formatMoneySimple(biz.valuation || 0)}</p>
                                    </div>
                                    <div className="bg-secondary/5 p-2 rounded-lg text-center border border-theme/50">
                                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Investors</p>
                                        <p className="text-xs font-bold text-primary">{biz.investors_count || 0}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="primary" size="sm" className="flex-1 text-xs !bg-blue-600">Manage Venture</Button>
                                    {biz.website && (
                                        <Button variant="outline" size="sm" className="aspect-square p-0" onClick={() => window.open(biz.website, '_blank')}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border-theme">
                        <CardBody className="p-0 overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-blue-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-blue-500 rounded-lg text-white">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            Register Group Business
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Configure your group-owned venture details.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Identity' },
                                        { id: 2, label: 'Contact' },
                                        { id: 3, label: 'Scale' },
                                        { id: 4, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-blue-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {step === 1 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shrink-0">
                                                {logo ? (
                                                    <img src={URL.createObjectURL(logo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Plus className="w-5 h-5 text-blue-500" />
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase">Logo</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setLogo(e.target.files[0])} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-primary">Venture Branding</h4>
                                                <p className="text-xs text-secondary leading-relaxed">Upload a clear logo or brand mark for this business.</p>
                                            </div>
                                        </div>

                                        <Input label="Business Name *" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="e.g., Qomrade Logistics Ltd"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Industry *</label>
                                                <select value={formData.industry}
                                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="tech">Technology</option>
                                                    <option value="agri">Agriculture</option>
                                                    <option value="fin">Finance</option>
                                                    <option value="retail">Retail</option>
                                                    <option value="health">Healthcare</option>
                                                    <option value="educ">Education</option>
                                                    <option value="energy">Energy</option>
                                                    <option value="events">Events</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary mb-1.5">Current Stage *</label>
                                                <select value={formData.stage}
                                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                                >
                                                    <option value="idea">Idea Phase</option>
                                                    <option value="mvp">MVP (Prototype)</option>
                                                    <option value="pre_seed">Pre-Seed</option>
                                                    <option value="seed">Seed</option>
                                                    <option value="series_a">Series A</option>
                                                    <option value="growth">Growth</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <Input label="Business Website" value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com" icon={Globe}
                                        />
                                        <Input label="Contact Email" type="email" value={formData.contact_email}
                                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                            placeholder="hello@business.com"
                                        />
                                        <div className="grid grid-cols-3 gap-4">
                                            <Input label="Code" value={formData.country_code}
                                                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                                placeholder="+254"
                                            />
                                            <div className="col-span-2">
                                                <Input label="Phone Number" value={formData.phone_number}
                                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                    placeholder="700 000 000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="City" value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="Nairobi"
                                            />
                                            <Input label="Country" value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                placeholder="Kenya"
                                            />
                                        </div>
                                        
                                        <div className="relative">
                                            <Input label="Current Valuation (USD)" type="number" value={formData.valuation}
                                                onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Elevator Pitch / Description *</label>
                                            <textarea value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4} required placeholder="What problem does this business solve? What is the value proposition?"
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>

                                        <label className="flex items-center gap-3 p-4 bg-secondary/5 rounded-xl border border-theme cursor-pointer hover:bg-secondary/10 transition-colors">
                                            <input type="checkbox" checked={formData.is_charity} onChange={(e) => setFormData({ ...formData, is_charity: e.target.checked })} className="w-5 h-5 rounded border-theme text-blue-600 focus:ring-blue-500" />
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-primary">Is this a Charity / Non-Profit?</div>
                                                <p className="text-xs text-secondary mt-0.5">Check this if the business operates as a social enterprise or foundation.</p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-5 pb-6 border-b border-theme">
                                            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
                                                {logo ? (
                                                    <img src={URL.createObjectURL(logo)} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <Building2 className="w-10 h-10 text-blue-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-primary">{formData.name}</h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">{formData.industry}</span>
                                                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded-md tracking-wider">{formData.stage.replace('_', ' ')}</span>
                                                    {formData.is_charity && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">Charity</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                            <div>
                                                <p className="text-tertiary text-xs font-bold uppercase mb-1">Contact</p>
                                                <p className="text-primary font-medium">{formData.contact_email || 'No email'}</p>
                                                <p className="text-secondary text-xs">{formData.country_code} {formData.phone_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-tertiary text-xs font-bold uppercase mb-1">Location</p>
                                                <p className="text-primary font-medium">{formData.city}, {formData.country}</p>
                                                <p className="text-secondary text-xs">{formData.website || 'No website'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-tertiary text-xs font-bold uppercase mb-1">Valuation</p>
                                                <p className="text-primary font-bold text-lg">{formatMoneySimple(formData.valuation || 0)}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-tertiary text-xs font-bold uppercase mb-1">Description</p>
                                                <p className="text-secondary leading-relaxed bg-secondary/5 p-4 rounded-xl border border-theme text-xs">{formData.description}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                                            <div className="p-1.5 bg-blue-500 rounded-full text-white shrink-0 h-fit">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                                By proceeding, you verify that this venture is authorized to be managed within the <span className="font-bold text-blue-900 dark:text-blue-100">Group Portal</span>. All group members will have visibility into its funding and metrics.
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
                                    <Button type="button" variant="primary" className="flex-1 !bg-blue-600" onClick={() => setStep(step + 1)} disabled={step === 1 && !formData.name}>
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-blue-600 shadow-lg shadow-blue-500/30" onClick={handleCreate} disabled={createLoading}>
                                        {createLoading ? 'Finalizing...' : 'Register Business'}
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

export default GroupBusinessesTab;
