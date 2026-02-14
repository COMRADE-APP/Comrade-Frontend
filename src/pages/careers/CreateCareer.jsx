import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, CheckCircle, ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import { careersService } from '../../services/careers.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Careers.css';

const STEPS = [
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Details & Requirements' },
    { number: 3, title: 'Salary & Location' },
    { number: 4, title: 'Review' }
];

const CreateCareer = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        job_type: 'full_time',
        experience_level: 'mid',
        industry: 'tech',
        description: '',
        requirements: '',
        responsibilities: '',
        salary_min: '',
        salary_max: '',
        salary_currency: 'USD',
        is_remote: false,
        location: '',
        application_deadline: ''
    });

    const industries = [
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'writing', label: 'Writing & Content' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Finance & Accounting' },
        { value: 'education', label: 'Education' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'other', label: 'Other' },
    ];

    const jobTypes = [
        { value: 'full_time', label: 'Full-time' },
        { value: 'part_time', label: 'Part-time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' },
        { value: 'freelance', label: 'Freelance' },
    ];

    const experienceLevels = [
        { value: 'entry', label: 'Entry Level' },
        { value: 'mid', label: 'Mid Level' },
        { value: 'senior', label: 'Senior Level' },
        { value: 'lead', label: 'Lead/Manager' },
        { value: 'executive', label: 'Executive' },
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
                salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
                application_deadline: formData.application_deadline || null
            };

            await careersService.create(payload);
            setSuccess(true);
            setTimeout(() => {
                navigate('/careers');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to post job. Please try again.');
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
                    <h2 className="text-2xl font-bold text-primary mb-2">Job Posted Successfully!</h2>
                    <p className="text-secondary">Redirecting to careers...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <Building2 className="text-primary" />
                        Post a Career Opportunity
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
                                    <h3 className="text-xl font-semibold text-primary mb-4">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Job Title *</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Senior Frontend Engineer"
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Company Name *</label>
                                            <input
                                                type="text"
                                                name="company_name"
                                                value={formData.company_name}
                                                onChange={handleChange}
                                                placeholder="e.g. Acme Corp"
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Job Type</label>
                                                <select
                                                    name="job_type"
                                                    value={formData.job_type}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                >
                                                    {jobTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Industry</label>
                                                <select
                                                    name="industry"
                                                    value={formData.industry}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                >
                                                    {industries.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Details & Requirements</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Description *</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                placeholder="Describe the role..."
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
                                                placeholder="List key skills and qualifications..."
                                                required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Responsibilities (Optional)</label>
                                            <textarea
                                                name="responsibilities"
                                                value={formData.responsibilities}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="What will the candidate do day-to-day?"
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Experience Level</label>
                                            <select
                                                name="experience_level"
                                                value={formData.experience_level}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            >
                                                {experienceLevels.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Salary & Location</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Min Salary</label>
                                                <input
                                                    type="number"
                                                    name="salary_min"
                                                    value={formData.salary_min}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 50000"
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Max Salary</label>
                                                <input
                                                    type="number"
                                                    name="salary_max"
                                                    value={formData.salary_max}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 80000"
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                />
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
                                                    This is a remote position
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
                                            <label className="block text-sm font-medium text-primary mb-1">Application Deadline (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                name="application_deadline"
                                                value={formData.application_deadline}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>
                                    <div className="bg-background border border-theme rounded-xl p-6">
                                        <h4 className="text-2xl font-bold text-primary mb-1">{formData.title}</h4>
                                        <p className="text-secondary mb-4">{formData.company_name}</p>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{formData.job_type}</span>
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{formData.industry}</span>
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{formData.experience_level}</span>
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
                                                <strong className="text-primary block">Salary</strong>
                                                <span className="text-secondary">{formData.salary_min ? `${formData.salary_min} - ${formData.salary_max}` : 'Negotiable'}</span>
                                            </div>
                                            <div>
                                                <strong className="text-primary block">Location</strong>
                                                <span className="text-secondary">{formData.is_remote ? 'Remote' : formData.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                                <Button variant="secondary" onClick={() => currentStep === 1 ? navigate('/careers') : prevStep()}>
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
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : 'Post Opportunity'}
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

export default CreateCareer;
