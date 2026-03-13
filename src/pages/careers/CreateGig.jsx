import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Briefcase, MapPin, CheckCircle, ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import { gigsService } from '../../services/careers.service';
import institutionsService from '../../services/institutions.service';
import organizationsService from '../../services/organizations.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Careers.css';

const STEPS = [
    { number: 1, title: 'Gig Info' },
    { number: 2, title: 'Payment & Location' },
    { number: 3, title: 'Review' }
];

const CreateGig = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Affiliations
    const [affiliations, setAffiliations] = useState([]);
    const [selectedAffiliation, setSelectedAffiliation] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        pay_amount: '',
        pay_timing: 'after',
        industry: 'tech',
        deadline: '',
        location: '',
        is_remote: true,
        company_name: '',
        institution_id: null,
        organization_id: null,
    });

    // Load affiliations
    useEffect(() => {
        const loadAffiliations = async () => {
            const items = [];
            try {
                const insts = await institutionsService.getMyInstitutions();
                const instList = Array.isArray(insts) ? insts : insts?.results || [];
                instList.forEach(inst => items.push({ id: inst.id, name: inst.name, type: 'institution' }));
            } catch (e) {}
            try {
                const orgs = await organizationsService.getMyOrganizations();
                const orgList = Array.isArray(orgs) ? orgs : orgs?.results || [];
                orgList.forEach(org => items.push({ id: org.id, name: org.name, type: 'organization' }));
            } catch (e) {}
            setAffiliations(items);

            const instParam = searchParams.get('institution');
            const orgParam = searchParams.get('organization');
            const nameParam = searchParams.get('name');

            if (instParam) {
                setSelectedAffiliation(`institution-${instParam}`);
                setFormData(prev => ({ ...prev, company_name: nameParam || '', institution_id: instParam }));
            } else if (orgParam) {
                setSelectedAffiliation(`organization-${orgParam}`);
                setFormData(prev => ({ ...prev, company_name: nameParam || '', organization_id: orgParam }));
            } else if (items.length === 1) {
                const aff = items[0];
                setSelectedAffiliation(`${aff.type}-${aff.id}`);
                setFormData(prev => ({
                    ...prev, company_name: aff.name,
                    institution_id: aff.type === 'institution' ? aff.id : null,
                    organization_id: aff.type === 'organization' ? aff.id : null,
                }));
            }
        };
        loadAffiliations();
    }, []);

    const handleAffiliationChange = (value) => {
        setSelectedAffiliation(value);
        if (!value || value === 'none') {
            setFormData(prev => ({ ...prev, institution_id: null, organization_id: null }));
            return;
        }
        const [type, id] = value.split('-');
        const aff = affiliations.find(a => a.type === type && String(a.id) === id);
        if (aff) {
            setFormData(prev => ({
                ...prev, company_name: aff.name,
                institution_id: type === 'institution' ? aff.id : null,
                organization_id: type === 'organization' ? aff.id : null,
            }));
        }
    };

    const industries = [
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'writing', label: 'Writing & Content' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Finance & Accounting' },
        { value: 'education', label: 'Education & Training' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'other', label: 'Other' },
    ];

    const payTimings = [
        { value: 'before', label: 'Payment Before Work' },
        { value: 'after', label: 'Payment After Completion' },
        { value: 'milestone', label: 'Milestone-based Payment' },
        { value: 'negotiable', label: 'Negotiable' },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                pay_amount: parseFloat(formData.pay_amount),
                deadline: formData.deadline || null
            };

            await gigsService.create(payload);
            setSuccess(true);

            setTimeout(() => {
                navigate('/gigs');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create gig. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="flex justify-center mb-4">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Gig Posted Successfully!</h2>
                    <p className="text-secondary">Redirecting to your gigs...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <Briefcase className="text-primary" />
                        Post a New Gig
                    </h1>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-theme -z-10 -translate-y-1/2"></div>
                            {STEPS.map((step, index) => (
                                <div key={step.number} className="flex flex-col items-center bg-elevated relative z-10 px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${currentStep >= step.number ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-primary' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-8">
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Gig Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Gig Title *</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Build a React Dashboard"
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            />
                                        </div>
                                        {/* On-behalf-of Selector */}
                                        {affiliations.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Post on behalf of</label>
                                                <select
                                                    value={selectedAffiliation}
                                                    onChange={(e) => handleAffiliationChange(e.target.value)}
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                >
                                                    <option value="none">-- Personal / None --</option>
                                                    {affiliations.map(aff => (
                                                        <option key={`${aff.type}-${aff.id}`} value={`${aff.type}-${aff.id}`}>
                                                            {aff.name} ({aff.type === 'institution' ? '🏛️ Institution' : '🏢 Organization'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Industry *</label>
                                            <select
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            >
                                                {industries.map(ind => (
                                                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Description *</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                placeholder="Describe the work in detail..."
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Requirements *</label>
                                            <textarea
                                                name="requirements"
                                                value={formData.requirements}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="List skills needed..."
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Payment & Location</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Payment Amount (USD) *</label>
                                                <input
                                                    type="number"
                                                    name="pay_amount"
                                                    value={formData.pay_amount}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 500"
                                                    min="1"
                                                    required
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Payment Timing</label>
                                                <select
                                                    name="pay_timing"
                                                    value={formData.pay_timing}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                >
                                                    {payTimings.map(pt => (
                                                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-background border border-theme rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="is_remote"
                                                    checked={formData.is_remote}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300"
                                                />
                                                <div className="flex items-center gap-2 text-primary font-medium">
                                                    <MapPin size={18} />
                                                    This is a remote gig
                                                </div>
                                            </label>
                                        </div>

                                        {!formData.is_remote && (
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    placeholder="e.g. New York, NY"
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Deadline (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>
                                    <div className="bg-background border border-theme rounded-xl p-6">
                                        <h4 className="text-2xl font-bold text-primary mb-4">{formData.title}</h4>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{formData.industry}</span>
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">${formData.pay_amount}</span>
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{formData.is_remote ? 'Remote' : formData.location}</span>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <h5 className="text-sm font-medium text-secondary uppercase tracking-wider mb-1">Description</h5>
                                                <p className="text-primary whitespace-pre-wrap">{formData.description}</p>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-medium text-secondary uppercase tracking-wider mb-1">Requirements</h5>
                                                <p className="text-primary whitespace-pre-wrap">{formData.requirements}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-6 pt-6 border-t border-theme">
                                            <div>
                                                <strong className="text-primary block">Payment</strong>
                                                <span className="text-secondary">{payTimings.find(t => t.value === formData.pay_timing)?.label}</span>
                                            </div>
                                            {formData.deadline && (
                                                <div>
                                                    <strong className="text-primary block">Due</strong>
                                                    <span className="text-secondary">{new Date(formData.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                                <Button variant="secondary" onClick={() => currentStep === 1 ? navigate('/gigs') : prevStep()}>
                                    <ChevronLeft size={18} className="mr-1" />
                                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                                </Button>

                                <div className="ml-auto">
                                    {currentStep < STEPS.length ? (
                                        <Button variant="primary" onClick={nextStep}>
                                            Next <ChevronRight size={18} className="ml-1" />
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : 'Post Gig'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateGig;
