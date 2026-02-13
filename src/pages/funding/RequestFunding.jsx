import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, DollarSign, FileText,
    Building2, Send, AlertTriangle, Target, PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';

const STEPS = [
    { id: 1, label: 'Select Venture', icon: Target },
    { id: 2, label: 'Funding Details', icon: DollarSign },
    { id: 3, label: 'Proposal', icon: FileText },
    { id: 4, label: 'Cover Letter', icon: PenLine },
    { id: 5, label: 'Review & Submit', icon: Send },
];

const RequestFunding = () => {
    const { businessId } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [ventures, setVentures] = useState([]);
    const [business, setBusiness] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        business: businessId || '',
        target_venture: '',
        amount_needed: '',
        equity_offered: '',
        min_investment: '',
        use_of_funds: '',
        cover_letter: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [venturesData, businesses] = await Promise.all([
                fundingService.getVentures(),
                fundingService.getMyBusinesses()
            ]);
            setVentures(venturesData);
            if (businessId) {
                const biz = businesses.find(b => b.id === businessId);
                setBusiness(biz);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateStep = () => {
        switch (step) {
            case 1: return !!formData.target_venture;
            case 2: return formData.amount_needed && formData.equity_offered;
            case 3: return formData.use_of_funds.length >= 50;
            case 4: return true; // Cover letter optional
            case 5: return true;
            default: return true;
        }
    };

    const nextStep = () => {
        if (!validateStep()) {
            setError(step === 3
                ? 'Please write a detailed proposal (at least 50 characters)'
                : 'Please fill in all required fields');
            return;
        }
        setError('');
        setStep(s => Math.min(s + 1, 5));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                business: formData.business,
                target_venture: formData.target_venture || null,
                amount_needed: parseFloat(formData.amount_needed),
                equity_offered: parseFloat(formData.equity_offered),
                min_investment: parseFloat(formData.min_investment) || 0,
                use_of_funds: formData.use_of_funds + (formData.cover_letter
                    ? `\n\n--- Cover Letter ---\n${formData.cover_letter}` : ''),
                status: 'submitted',
            };
            await fundingService.createRequest(payload);
            setSubmitted(true);
        } catch (err) {
            console.error('Submission failed:', err);
            setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-elevated rounded-2xl shadow-xl p-10 text-center max-w-md w-full"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
                    <p className="text-secondary mb-6">
                        Your funding request has been sent for review. Track your application status under the "My Applications" tab.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => navigate('/funding')} className="flex-1 bg-primary text-white">
                            Back to Hub
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const selectedVenture = ventures.find(v => v.id === formData.target_venture);

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back button */}
                <button onClick={() => navigate(-1)} className="flex items-center text-secondary hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary">Request Funding</h1>
                    <p className="text-secondary mt-1">
                        {business ? `For ${business.name}` : 'Submit a comprehensive funding application'}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="flex items-center mb-8 bg-elevated rounded-xl p-4 border border-theme">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const isActive = step === s.id;
                        const isDone = step > s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-tertiary'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDone ? 'bg-green-100 text-green-600' : isActive ? 'bg-primary/10 text-primary' : 'bg-secondary/10'
                                        }`}>
                                        {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className="text-xs font-medium hidden md:block">{s.label}</span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-green-400' : 'bg-secondary/20'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* Form content */}
                <div className="bg-elevated rounded-2xl shadow-sm border border-theme p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Step 1: Select Venture */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary mb-1">Select Target Venture</h2>
                                        <p className="text-sm text-secondary">Choose a funding organization to submit your application to, or leave open for all.</p>
                                    </div>
                                    <div className="grid gap-3">
                                        <div
                                            onClick={() => setFormData({ ...formData, target_venture: '' })}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${!formData.target_venture ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Target className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-primary">Open Application</h3>
                                                    <p className="text-xs text-secondary">Available to all funding organizations</p>
                                                </div>
                                            </div>
                                        </div>
                                        {ventures.map(v => (
                                            <div
                                                key={v.id}
                                                onClick={() => setFormData({ ...formData, target_venture: v.id })}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.target_venture === v.id ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-primary">{v.name}</h3>
                                                        <p className="text-xs text-secondary">{v.investment_focus || 'General Investment'}</p>
                                                    </div>
                                                    <div className="text-right text-xs text-secondary">
                                                        <div>Fund: KES {Number(v.available_fund).toLocaleString()}</div>
                                                        <div>{v.min_investment ? `Min: KES ${Number(v.min_investment).toLocaleString()}` : ''}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Funding Details */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary mb-1">Funding Details</h2>
                                        <p className="text-sm text-secondary">Specify the financial terms of your request.</p>
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Amount Needed (KES) *</label>
                                            <input
                                                type="number"
                                                name="amount_needed"
                                                value={formData.amount_needed}
                                                onChange={handleChange}
                                                placeholder="e.g. 5000000"
                                                required
                                                className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Equity Offered (%) *</label>
                                            <input
                                                type="number"
                                                name="equity_offered"
                                                value={formData.equity_offered}
                                                onChange={handleChange}
                                                placeholder="e.g. 10"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                required
                                                className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-primary mb-1">Minimum Investment (KES)</label>
                                            <input
                                                type="number"
                                                name="min_investment"
                                                value={formData.min_investment}
                                                onChange={handleChange}
                                                placeholder="Optional minimum investment amount"
                                                className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    {selectedVenture && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                                            <strong>{selectedVenture.name}</strong> accepts investments between
                                            KES {Number(selectedVenture.min_investment).toLocaleString()} –
                                            KES {Number(selectedVenture.max_investment).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Proposal */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary mb-1">Funding Proposal</h2>
                                        <p className="text-sm text-secondary">Explain how you plan to use the funding and what milestones you aim to achieve.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Use of Funds *</label>
                                        <textarea
                                            name="use_of_funds"
                                            value={formData.use_of_funds}
                                            onChange={handleChange}
                                            rows={8}
                                            placeholder="Describe in detail how you plan to allocate the funds. Include specific areas such as product development, marketing, hiring, operations, and any other key areas.

Example:
- 40% Product Development: Feature enhancements and infrastructure
- 25% Marketing & Sales: Customer acquisition campaigns
- 20% Hiring: Engineering and sales team expansion
- 15% Operations: Legal, compliance, and office costs"
                                            className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none resize-none"
                                        />
                                        <p className="text-xs text-tertiary mt-1">{formData.use_of_funds.length} characters (min 50)</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Cover Letter */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary mb-1">Cover Letter / Essay</h2>
                                        <p className="text-sm text-secondary">Optional but recommended — share your vision, story, and why this fund should invest in you.</p>
                                    </div>
                                    <textarea
                                        name="cover_letter"
                                        value={formData.cover_letter}
                                        onChange={handleChange}
                                        rows={10}
                                        placeholder="Share your entrepreneurial journey, the problem you're solving, team strengths, and your vision for the future. This is your chance to connect personally with the reviewers..."
                                        className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none resize-none"
                                    />
                                    <p className="text-xs text-tertiary">This section is optional but highly encouraged for competitive applications.</p>
                                </div>
                            )}

                            {/* Step 5: Review */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary mb-1">Review Your Application</h2>
                                        <p className="text-sm text-secondary">Double-check everything before submitting.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                            <h4 className="text-sm font-medium text-tertiary mb-1">Target Venture</h4>
                                            <p className="text-primary font-semibold">{selectedVenture?.name || 'Open Application'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                                <h4 className="text-sm font-medium text-tertiary mb-1">Amount Requested</h4>
                                                <p className="text-primary font-semibold text-lg">KES {Number(formData.amount_needed).toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                                <h4 className="text-sm font-medium text-tertiary mb-1">Equity Offered</h4>
                                                <p className="text-primary font-semibold text-lg">{formData.equity_offered}%</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                            <h4 className="text-sm font-medium text-tertiary mb-1">Use of Funds</h4>
                                            <p className="text-primary text-sm whitespace-pre-line">{formData.use_of_funds}</p>
                                        </div>
                                        {formData.cover_letter && (
                                            <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                                <h4 className="text-sm font-medium text-tertiary mb-1">Cover Letter</h4>
                                                <p className="text-primary text-sm whitespace-pre-line">{formData.cover_letter}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-700 text-sm">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>By submitting this application, you confirm that all information provided is accurate and truthful. Misrepresentation may result in application rejection.</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                        <Button
                            variant="outline"
                            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> {step > 1 ? 'Previous' : 'Cancel'}
                        </Button>
                        {step < 5 ? (
                            <Button onClick={nextStep} className="bg-primary text-white flex items-center gap-2">
                                Next <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                                {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Application</>}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestFunding;
