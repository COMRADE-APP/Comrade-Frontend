import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, ArrowLeft, Search, Building2, FileText, CreditCard, 
    Shield, AlertCircle, CheckCircle, Loader2, Send 
} from 'lucide-react';
import providerService from '../../services/provider.service';
import Button from '../../components/common/Button';

const QUERY_TYPES = [
    { value: 'application', label: 'Application Status', icon: FileText },
    { value: 'transaction', label: 'Transaction Issue', icon: CreditCard },
    { value: 'claim', label: 'Claim Inquiry', icon: Shield },
    { value: 'document', label: 'Document Query', icon: FileText },
    { value: 'technical', label: 'Technical Support', icon: AlertCircle },
    { value: 'general', label: 'General Inquiry', icon: MessageSquare },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', description: 'General question, no urgency' },
    { value: 'medium', label: 'Medium', description: 'Needs response within a few days' },
    { value: 'high', label: 'High', description: 'Urgent matter, needs quick response' },
    { value: 'urgent', label: 'Urgent', description: 'Critical issue, immediate attention needed' },
];

const SubmitQuery = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedProvider = searchParams.get('provider');
    const preSelectedType = searchParams.get('type');

    const [step, setStep] = useState(1);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [providers, setProviders] = useState([]);
    const [searchProvider, setSearchProvider] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        provider: preSelectedProvider || '',
        query_type: preSelectedType || 'general',
        subject: '',
        description: '',
        priority: 'medium',
        reference_id: '',
    });

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoadingProviders(true);
        try {
            const res = await providerService.getActiveProviders();
            const allProviders = res.results || res || [];
            setProviders(allProviders);
        } catch (e) {
            console.error('Failed to load providers:', e);
        } finally {
            setLoadingProviders(false);
        }
    };

    const filteredProviders = providers.filter(p => 
        p.business_name?.toLowerCase().includes(searchProvider.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchProvider.toLowerCase())
    );

    const selectedProvider = providers.find(p => p.id === form.provider);

    const handleSubmit = async () => {
        if (!form.provider || !form.subject.trim() || !form.description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await providerService.submitQuery({
                provider: form.provider,
                query_type: form.query_type,
                subject: form.subject,
                description: form.description,
                priority: form.priority,
                reference_id: form.reference_id || undefined,
            });
            navigate('/payments/queries', { 
                state: { success: 'Query submitted successfully! The provider will respond soon.' } 
            });
        } catch (e) {
            console.error('Failed to submit query:', e);
            setError(e.response?.data?.error || 'Failed to submit query. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            <div className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-theme">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Submit Query</h1>
                            <p className="text-secondary text-sm">Contact a service provider</p>
                        </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-4">
                        {[1, 2].map(s => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                    step >= s ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'
                                }`}>
                                    {s}
                                </div>
                                {s < 2 && (
                                    <div className={`flex-1 h-1 rounded ${step > s ? 'bg-primary' : 'bg-secondary/20'}`} />
                                )}
                            </React.Fragment>
                        ))}
                        <span className="ml-2 text-sm text-secondary">
                            {step === 1 ? 'Select Provider' : 'Query Details'}
                        </span>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Content */}
                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Search Providers
                                </label>
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        type="text"
                                        value={searchProvider}
                                        onChange={e => setSearchProvider(e.target.value)}
                                        placeholder="Search by name or service type..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-3">
                                    Select Provider {!form.provider && <span className="text-red-500">*</span>}
                                </label>
                                {loadingProviders ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredProviders.length === 0 ? (
                                    <div className="text-center py-8 bg-secondary/5 rounded-xl">
                                        <Building2 className="w-10 h-10 text-tertiary mx-auto mb-2" />
                                        <p className="text-secondary">No providers found</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 max-h-80 overflow-y-auto">
                                        {filteredProviders.map(provider => (
                                            <button
                                                key={provider.id}
                                                onClick={() => setForm({ ...form, provider: provider.id })}
                                                className={`p-4 rounded-xl border text-left transition-all ${
                                                    form.provider === provider.id
                                                        ? 'border-primary bg-primary-5'
                                                        : 'border-theme hover:bg-secondary/5'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        form.provider === provider.id 
                                                            ? 'bg-primary text-white' 
                                                            : 'bg-secondary/10 text-secondary'
                                                    }`}>
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-primary">{provider.business_name}</h4>
                                                        <p className="text-sm text-secondary line-clamp-2">
                                                            {provider.description || 'Financial services provider'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-tertiary">
                                                            <span className="capitalize">{provider.provider_type?.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>
                                                    {form.provider === provider.id && (
                                                        <CheckCircle className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Selected Provider Display */}
                            {selectedProvider && (
                                <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-secondary" />
                                        <div>
                                            <p className="text-xs text-secondary">Submitting to</p>
                                            <p className="font-bold text-primary">{selectedProvider.business_name}</p>
                                        </div>
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="ml-auto text-sm text-primary hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Query Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.query_type}
                                    onChange={e => setForm({ ...form, query_type: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {QUERY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    placeholder="Brief summary of your inquiry"
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={5}
                                    placeholder="Provide details about your inquiry. Include any relevant reference numbers, transaction IDs, or application IDs if applicable."
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Priority
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setForm({ ...form, priority: opt.value })}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                form.priority === opt.value
                                                    ? 'border-primary bg-primary-5'
                                                    : 'border-theme hover:bg-secondary/5'
                                            }`}
                                        >
                                            <p className={`font-medium text-sm ${
                                                form.priority === opt.value ? 'text-primary' : 'text-primary'
                                            }`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-xs text-secondary mt-1">{opt.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Reference ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={form.reference_id}
                                    onChange={e => setForm({ ...form, reference_id: e.target.value })}
                                    placeholder="Transaction ID, Application ID, Claim Number, etc."
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <p className="text-xs text-secondary mt-1">
                                    If your query is about a specific transaction or application, include the reference ID here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-theme bg-secondary/5 flex justify-between">
                    {step === 1 ? (
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                if (form.provider) setStep(2);
                                else setError('Please select a provider first');
                            }}
                            disabled={!form.provider}
                            className="flex items-center gap-2"
                        >
                            Next
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                    ) : (
                        <>
                            <Button 
                                variant="outline" 
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                Submit Query
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmitQuery;