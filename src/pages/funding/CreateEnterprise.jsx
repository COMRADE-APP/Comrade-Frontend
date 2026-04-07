/**
 * Create Enterprise Page
 * Multi-step form for creating enterprises supporting investment opportunities.
 * Only staff or institution-behalf can create. Covers:
 *  - Basic info, category, documents, email, website, verifications
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Building2, FileText, Mail, Globe, Shield, ChevronRight, ChevronLeft,
    Upload, CheckCircle, AlertCircle, Plus, Trash2, Users, Briefcase,
    DollarSign, Heart, BarChart2, PieChart, Landmark, TrendingUp, X
} from 'lucide-react';

const ENTERPRISE_CATEGORIES = [
    { id: 'charity', label: 'Charity & Giving', icon: Heart, color: 'from-pink-500 to-rose-600', description: 'Charitable organisations and giving initiatives' },
    { id: 'mmf', label: 'Money Market Funds', icon: DollarSign, color: 'from-blue-500 to-cyan-600', description: 'Money market fund management and operations' },
    { id: 'stock', label: 'Stocks & Equities', icon: TrendingUp, color: 'from-green-500 to-emerald-600', description: 'Stock brokerages and equity trading firms' },
    { id: 'bond_domestic', label: 'Domestic Bonds', icon: Landmark, color: 'from-orange-500 to-amber-600', description: 'Domestic bond issuance and management' },
    { id: 'bond_foreign', label: 'Foreign Bonds', icon: Globe, color: 'from-primary-600 to-primary-600', description: 'Foreign bond and international fixed income' },
    { id: 'agency', label: 'Investment Agency', icon: Shield, color: 'from-slate-500 to-gray-600', description: 'Licensed investment agencies and wealth managers' },
    { id: 'venture_capital', label: 'Venture Capital', icon: Briefcase, color: 'from-indigo-500 to-blue-600', description: 'Venture capital and startup funding' },
    { id: 'private_equity', label: 'Private Equity', icon: BarChart2, color: 'from-teal-500 to-cyan-600', description: 'Private equity and buyout firms' },
    { id: 'real_estate', label: 'Real Estate Investment', icon: Building2, color: 'from-amber-500 to-yellow-600', description: 'Real estate investment trusts and property firms' },
    { id: 'hedge_fund', label: 'Hedge Fund', icon: PieChart, color: 'from-red-500 to-pink-600', description: 'Hedge funds and alternative investments' },
    { id: 'microfinance', label: 'Microfinance', icon: Users, color: 'from-lime-500 to-green-600', description: 'Microfinance institutions and lending' },
    { id: 'insurance', label: 'Insurance', icon: Shield, color: 'from-cyan-500 to-sky-600', description: 'Insurance providers and underwriters' },
];

const STEPS = [
    { id: 1, label: 'Enterprise Info', icon: Building2 },
    { id: 2, label: 'Category', icon: Briefcase },
    { id: 3, label: 'Contact & Web', icon: Globe },
    { id: 4, label: 'Documents', icon: FileText },
    { id: 5, label: 'Verification', icon: Shield },
    { id: 6, label: 'Review', icon: CheckCircle },
];

const CreateEnterprise = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mission: '',
        founded_year: '',
        registration_number: '',
        country: '',
        city: '',
        category: '',
        subcategories: [],
        // Contact & Web
        email: '',
        phone: '',
        website: '',
        linkedin: '',
        twitter: '',
        // Documents
        documents: [],
        // Verification
        verification_type: 'business',
        tax_id: '',
        license_number: '',
        regulatory_body: '',
        // Institution
        on_behalf_institution: '',
    });

    const [documentFiles, setDocumentFiles] = useState([]);

    // Only staff or institution users can create
    const canCreate = user?.is_staff || user?.role === 'staff' || user?.institution_id;

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const addDocument = () => {
        setDocumentFiles(prev => [...prev, { name: '', type: 'registration', file: null }]);
    };

    const removeDocument = (index) => {
        setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateDocument = (index, field, value) => {
        setDocumentFiles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.name.trim()) newErrors.name = 'Enterprise name is required';
            if (!formData.description.trim()) newErrors.description = 'Description is required';
            if (!formData.country.trim()) newErrors.country = 'Country is required';
        } else if (step === 2) {
            if (!formData.category) newErrors.category = 'Select at least one category';
        } else if (step === 3) {
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
            if (!formData.website.trim()) newErrors.website = 'Website URL is required';
        } else if (step === 4) {
            if (documentFiles.length === 0) newErrors.documents = 'At least one document is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        setSaving(true);
        try {
            // Build FormData for file uploads
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'documents' && key !== 'subcategories') {
                    submitData.append(key, value);
                }
            });
            formData.subcategories.forEach(sub => submitData.append('subcategories', sub));
            documentFiles.forEach((doc, i) => {
                if (doc.file) {
                    submitData.append(`document_${i}`, doc.file);
                    submitData.append(`document_${i}_name`, doc.name);
                    submitData.append(`document_${i}_type`, doc.type);
                }
            });

            // Use funding service to create venture
            const { default: fundingService } = await import('../../services/funding.service');
            await fundingService.createVenture(submitData);
            navigate('/funding', { state: { tab: 'ventures' } });
        } catch (error) {
            console.error('Error creating enterprise:', error);
            setErrors({ submit: error?.response?.data?.detail || 'Failed to create enterprise. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (!canCreate) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardBody className="text-center py-16">
                        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-primary mb-2">Access Restricted</h2>
                        <p className="text-secondary mb-6">Only staff members or users acting on behalf of an institution can create enterprises.</p>
                        <Button onClick={() => navigate('/funding')}>Back to Funding Hub</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/funding')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Create Enterprise</h1>
                    <p className="text-secondary text-sm mt-1">Set up a new investment enterprise or funding organisation</p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between bg-elevated rounded-xl border border-theme p-4 overflow-x-auto">
                {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => isCompleted && setCurrentStep(step.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${isActive ? 'bg-primary text-white' :
                                        isCompleted ? 'bg-green-500/10 text-green-600 cursor-pointer hover:bg-green-500/20' :
                                            'text-tertiary'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                                <span className="text-sm font-medium hidden md:inline">{step.label}</span>
                            </button>
                            {idx < STEPS.length - 1 && (
                                <ChevronRight size={16} className="text-tertiary shrink-0 mx-1" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Error Banner */}
            {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
            )}

            {/* Step Content */}
            <Card>
                <CardBody className="p-6 md:p-8">
                    {/* Step 1: Enterprise Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Enterprise Information</h2>
                                <p className="text-secondary text-sm">Basic details about the enterprise</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-1.5">Enterprise Name *</label>
                                    <Input value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g., Acme Capital Partners" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-1.5">Description *</label>
                                    <textarea className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" rows={4} value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Describe the enterprise and its investment focus..." />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-1.5">Mission Statement</label>
                                    <textarea className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" rows={3} value={formData.mission} onChange={e => updateField('mission', e.target.value)} placeholder="What is the mission of this enterprise?" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Country *</label>
                                    <Input value={formData.country} onChange={e => updateField('country', e.target.value)} placeholder="e.g., Kenya" />
                                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">City</label>
                                    <Input value={formData.city} onChange={e => updateField('city', e.target.value)} placeholder="e.g., Nairobi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Founded Year</label>
                                    <Input type="number" value={formData.founded_year} onChange={e => updateField('founded_year', e.target.value)} placeholder="2020" min="1900" max="2030" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Registration Number</label>
                                    <Input value={formData.registration_number} onChange={e => updateField('registration_number', e.target.value)} placeholder="Business registration number" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Category Selection */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Enterprise Category</h2>
                                <p className="text-secondary text-sm">Select the type of investment opportunity this enterprise supports</p>
                            </div>
                            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {ENTERPRISE_CATEGORIES.map(cat => {
                                    const CatIcon = cat.icon;
                                    const isSelected = formData.category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => updateField('category', cat.id)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-theme hover:border-primary/40 hover:bg-secondary/30'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-3`}>
                                                <CatIcon size={20} />
                                            </div>
                                            <h3 className="font-semibold text-primary text-sm">{cat.label}</h3>
                                            <p className="text-xs text-secondary mt-0.5">{cat.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Contact & Web */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Contact & Website</h2>
                                <p className="text-secondary text-sm">How stakeholders and investors can reach the enterprise</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">
                                        <Mail className="inline w-4 h-4 mr-1" /> Official Email *
                                    </label>
                                    <Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="contact@enterprise.com" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Phone</label>
                                    <Input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+254 700 000 000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">
                                        <Globe className="inline w-4 h-4 mr-1" /> Website *
                                    </label>
                                    <Input value={formData.website} onChange={e => updateField('website', e.target.value)} placeholder="https://www.enterprise.com" />
                                    {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">LinkedIn</label>
                                    <Input value={formData.linkedin} onChange={e => updateField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">X (Twitter)</label>
                                    <Input value={formData.twitter} onChange={e => updateField('twitter', e.target.value)} placeholder="@handle" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Documents */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Documents</h2>
                                <p className="text-secondary text-sm">Upload required documents for verification</p>
                            </div>
                            {errors.documents && <p className="text-red-500 text-sm">{errors.documents}</p>}

                            <div className="space-y-4">
                                {documentFiles.map((doc, index) => (
                                    <div key={index} className="bg-secondary/30 rounded-xl p-4 border border-theme">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-sm font-medium text-primary">Document {index + 1}</span>
                                            <button onClick={() => removeDocument(index)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input value={doc.name} onChange={e => updateDocument(index, 'name', e.target.value)} placeholder="Document name" />
                                            <select
                                                className="px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary-500"
                                                value={doc.type}
                                                onChange={e => updateDocument(index, 'type', e.target.value)}
                                            >
                                                <option value="registration">Business Registration</option>
                                                <option value="license">License / Permit</option>
                                                <option value="tax">Tax Certificate</option>
                                                <option value="financial">Financial Statement</option>
                                                <option value="compliance">Compliance Document</option>
                                                <option value="insurance">Insurance Certificate</option>
                                                <option value="memorandum">Memorandum of Association</option>
                                                <option value="articles">Articles of Incorporation</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="file"
                                                    onChange={e => updateDocument(index, 'file', e.target.files[0])}
                                                    className="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={addDocument} className="w-full py-4 border-2 border-dashed border-theme rounded-xl text-secondary hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={20} />
                                    Add Document
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Verification */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Verification Details</h2>
                                <p className="text-secondary text-sm">Provide verification and regulatory information</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Verification Type</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary-500"
                                        value={formData.verification_type}
                                        onChange={e => updateField('verification_type', e.target.value)}
                                    >
                                        <option value="business">Business Registration</option>
                                        <option value="government">Government License</option>
                                        <option value="ngo">NGO / Non-Profit</option>
                                        <option value="institutional">Institutional</option>
                                        <option value="international">International Organisation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Tax Identification Number</label>
                                    <Input value={formData.tax_id} onChange={e => updateField('tax_id', e.target.value)} placeholder="Tax ID / PIN" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">License Number</label>
                                    <Input value={formData.license_number} onChange={e => updateField('license_number', e.target.value)} placeholder="Operating license number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Regulatory Body</label>
                                    <Input value={formData.regulatory_body} onChange={e => updateField('regulatory_body', e.target.value)} placeholder="e.g., CMA, CBK, IRA" />
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-primary text-sm">Verification Process</p>
                                        <p className="text-secondary text-xs mt-1">After submission, our team will verify the documents within 3–5 business days. You will receive a notification once verified.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Review */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Review & Submit</h2>
                                <p className="text-secondary text-sm">Review all details before creating the enterprise</p>
                            </div>

                            <div className="grid gap-6">
                                {/* Summary Cards */}
                                <div className="bg-secondary/30 rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><Building2 size={18} /> Enterprise Info</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between"><span className="text-secondary">Name</span><span className="text-primary font-medium">{formData.name}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Country</span><span className="text-primary">{formData.country}, {formData.city}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Founded</span><span className="text-primary">{formData.founded_year || 'N/A'}</span></div>
                                    </div>
                                </div>

                                <div className="bg-secondary/30 rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><Briefcase size={18} /> Category</h3>
                                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                        {ENTERPRISE_CATEGORIES.find(c => c.id === formData.category)?.label || 'None selected'}
                                    </span>
                                </div>

                                <div className="bg-secondary/30 rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><Mail size={18} /> Contact</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between"><span className="text-secondary">Email</span><span className="text-primary">{formData.email}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Website</span><span className="text-primary">{formData.website}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Phone</span><span className="text-primary">{formData.phone || 'N/A'}</span></div>
                                    </div>
                                </div>

                                <div className="bg-secondary/30 rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><FileText size={18} /> Documents</h3>
                                    <p className="text-sm text-primary">{documentFiles.length} document(s) uploaded</p>
                                    {documentFiles.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-2 mt-2 text-sm">
                                            <CheckCircle size={14} className="text-green-500" />
                                            <span className="text-primary">{doc.name || `Document ${i + 1}`}</span>
                                            <span className="text-tertiary">({doc.type})</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-secondary/30 rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><Shield size={18} /> Verification</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between"><span className="text-secondary">Type</span><span className="text-primary capitalize">{formData.verification_type}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Tax ID</span><span className="text-primary">{formData.tax_id || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">License</span><span className="text-primary">{formData.license_number || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-secondary">Regulatory Body</span><span className="text-primary">{formData.regulatory_body || 'N/A'}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button variant="ghost" onClick={currentStep === 1 ? () => navigate('/funding') : prevStep}>
                    <ChevronLeft size={18} className="mr-1" />
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                </Button>
                {currentStep < 6 ? (
                    <Button onClick={nextStep}>
                        Next <ChevronRight size={18} className="ml-1" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                        {saving ? 'Creating...' : 'Create Enterprise'}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CreateEnterprise;
