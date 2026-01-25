import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Truck, Book, User, Package, Store, Factory, Users, Megaphone, Upload, Check } from 'lucide-react';
import api from '../../services/api';

const PARTNER_TYPES = [
    { value: 'distributor', label: 'Distributor', icon: Truck, description: 'Distribute products to retailers and end users' },
    { value: 'supplier', label: 'Supplier', icon: Package, description: 'Supply products or materials' },
    { value: 'publisher', label: 'Publisher', icon: Book, description: 'Publish educational content and resources' },
    { value: 'author', label: 'Author', icon: User, description: 'Create and sell educational content' },
    { value: 'retailer', label: 'Retailer', icon: Store, description: 'Sell products to end consumers' },
    { value: 'manufacturer', label: 'Manufacturer', icon: Factory, description: 'Manufacture products' },
    { value: 'affiliate', label: 'Affiliate', icon: Users, description: 'Promote products and earn commissions' },
    { value: 'content_creator', label: 'Content Creator', icon: Megaphone, description: 'Create educational videos and materials' },
];

const BecomePartner = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        partner_type: '',
        business_name: '',
        business_registration: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        address: '',
        city: '',
        country: '',
        description: '',
        products_services: '',
    });
    const [documents, setDocuments] = useState({
        business_license: null,
        supporting_document: null,
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) submitData.append(key, formData[key]);
            });
            if (documents.business_license) {
                submitData.append('business_license', documents.business_license);
            }
            if (documents.supporting_document) {
                submitData.append('supporting_document', documents.supporting_document);
            }

            await api.post('/api/payments/partner-applications/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
        } catch (error) {
            console.error('Failed to submit application:', error);
            alert(error.response?.data?.detail || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for applying to become a partner. We'll review your application and get back to you within 3-5 business days.
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Become a Partner</h1>
                        <p className="text-gray-600">Join our platform as a partner</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* Step 1: Partner Type */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Select Partner Type</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PARTNER_TYPES.map(type => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => setFormData({ ...formData, partner_type: type.value })}
                                            className={`p-4 border-2 rounded-xl text-left transition-all ${formData.partner_type === type.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Icon className={`w-6 h-6 ${formData.partner_type === type.value ? 'text-primary-600' : 'text-gray-500'}`} />
                                                <span className="font-semibold">{type.label}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{type.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.partner_type}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business Info */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Business Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                                    <input type="text" value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Your business name" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Registration #</label>
                                    <input type="text" value={formData.business_registration} onChange={e => setFormData({ ...formData, business_registration: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <input type="url" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                                    <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@business.com" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input type="tel" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1 234 567 8900" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between">
                                <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button>
                                <button onClick={() => setStep(3)} disabled={!formData.business_name || !formData.contact_email} className="px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Description & Documents */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Tell Us About Your Business</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description *</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Describe your business and why you want to partner with us..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Products/Services You'll Offer *</label>
                                    <textarea value={formData.products_services} onChange={e => setFormData({ ...formData, products_services: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="What products or services will you offer on our platform?" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Business License (Optional)</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            {documents.business_license ? (
                                                <span className="text-sm text-green-600">{documents.business_license.name}</span>
                                            ) : (
                                                <label className="cursor-pointer text-primary-600">
                                                    <Upload className="w-6 h-6 mx-auto mb-1" />
                                                    <span>Upload file</span>
                                                    <input type="file" className="hidden" onChange={e => setDocuments({ ...documents, business_license: e.target.files?.[0] })} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Document (Optional)</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            {documents.supporting_document ? (
                                                <span className="text-sm text-green-600">{documents.supporting_document.name}</span>
                                            ) : (
                                                <label className="cursor-pointer text-primary-600">
                                                    <Upload className="w-6 h-6 mx-auto mb-1" />
                                                    <span>Upload file</span>
                                                    <input type="file" className="hidden" onChange={e => setDocuments({ ...documents, supporting_document: e.target.files?.[0] })} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between">
                                <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button>
                                <button onClick={handleSubmit} disabled={loading || !formData.description || !formData.products_services} className="px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BecomePartner;
