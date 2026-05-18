import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const ProviderRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        provider_type: 'bill_provider',
        business_name: '',
        business_email: '',
        business_phone: '',
        business_address: '',
        business_registration_number: '',
        tax_id: '',
        category: 'other',
        description: '',
        auto_create_kitty: true,
        kitty_name: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/payments/provider-registrations/', formData);
            if (response.data) {
                // Submit immediately for review
                await api.post(`/payments/provider-registrations/${response.data.id}/submit/`);
                navigate('/providers/dashboard');
            }
        } catch (err) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.error || 'Registration failed. Please check your details and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-3xl w-full bg-elevated border border-theme rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-primary/5 p-8 border-b border-theme text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Provider Registration</h2>
                    <p className="text-secondary">Join our fintech network and scale your business.</p>
                    
                    <div className="flex justify-center items-center mt-8 gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'}`}>1</div>
                        <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-secondary/20'}`} />
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'}`}>2</div>
                        <div className={`h-1 w-16 ${step >= 3 ? 'bg-primary' : 'bg-secondary/20'}`} />
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'}`}>3</div>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Provider Type</label>
                                    <select
                                        name="provider_type"
                                        value={formData.provider_type}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="bill_provider">Bill Provider</option>
                                        <option value="insurance_provider">Insurance Provider</option>
                                        <option value="loan_provider">Loan Provider</option>
                                        <option value="utility_provider">Utility Provider</option>
                                        <option value="financial_service">Financial Service</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            name="business_name"
                                            required
                                            value={formData.business_name}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Acme Corp"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Business Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="utilities">Utilities</option>
                                            <option value="internet">Internet</option>
                                            <option value="insurance">Insurance</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Briefly describe your services..."
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Business Email</label>
                                        <input
                                            type="email"
                                            name="business_email"
                                            required
                                            value={formData.business_email}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Business Phone</label>
                                        <input
                                            type="tel"
                                            name="business_phone"
                                            required
                                            value={formData.business_phone}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Business Address</label>
                                    <textarea
                                        name="business_address"
                                        required
                                        rows={2}
                                        value={formData.business_address}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Registration Number</label>
                                        <input
                                            type="text"
                                            name="business_registration_number"
                                            value={formData.business_registration_number}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Tax ID</label>
                                        <input
                                            type="text"
                                            name="tax_id"
                                            value={formData.tax_id}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-primary/5 p-6 rounded-2xl border border-theme">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Building2 className="text-primary" />
                                        <h3 className="font-bold text-primary">Operations Kitty Setup</h3>
                                    </div>
                                    <p className="text-sm text-secondary mb-4">
                                        We will automatically create a dedicated payment group (Kitty) for your operations. All customer payments will be routed here.
                                    </p>
                                    <div className="flex items-center gap-3 mb-4">
                                        <input
                                            type="checkbox"
                                            id="auto_create_kitty"
                                            name="auto_create_kitty"
                                            checked={formData.auto_create_kitty}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded border-theme text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="auto_create_kitty" className="text-sm font-medium text-primary">
                                            Auto-create Operations Kitty
                                        </label>
                                    </div>
                                    {formData.auto_create_kitty && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Kitty Name</label>
                                            <input
                                                type="text"
                                                name="kitty_name"
                                                value={formData.kitty_name}
                                                onChange={handleChange}
                                                placeholder={`${formData.business_name || 'My Business'} Operations`}
                                                className="w-full rounded-xl border border-theme bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText className="text-blue-600" />
                                        <h3 className="font-bold text-blue-900">Review & Submit</h3>
                                    </div>
                                    <p className="text-sm text-blue-800">
                                        By submitting this form, your application will be sent to the Qomrade admin team for review. You will be able to upload verifying documents from your dashboard.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-theme">
                            {step > 1 ? (
                                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                                    <ArrowLeft size={18} className="mr-2" /> Back
                                </Button>
                            ) : <div></div>}
                            
                            <Button type="submit" variant="primary" isLoading={loading} className="px-8">
                                {step === 3 ? (
                                    <>Submit Application <CheckCircle size={18} className="ml-2" /></>
                                ) : (
                                    <>Next Step <ArrowRight size={18} className="ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProviderRegistration;
