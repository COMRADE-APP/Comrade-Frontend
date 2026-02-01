import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Building2, ArrowLeft, ArrowRight, Check, MapPin, Mail, Globe, Phone } from 'lucide-react';
import organizationsService from '../../services/organizations.service';

const CreateOrganization = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        abbreviation: '',
        org_type: 'business',
        industry: '',
        description: '',
        
        // Contact Info
        email: '',
        website: '',
        phone: '',
        
        // Location
        origin: 'Kenya',
        address: '',
        city: '',
        town: '',
        postal_code: '',
    });

    const orgTypes = [
        { value: 'business', label: 'Business Enterprise' },
        { value: 'ngo', label: 'Non-Governmental Organization (NGO)' },
        { value: 'learning_inst', label: 'Learning Institution' },
        { value: 'go', label: 'Governmental Organization' },
        { value: 'ministry', label: 'Ministry' },
        { value: 'other', label: 'Other' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateStep = (stepNum) => {
        switch (stepNum) {
            case 1:
                if (!formData.name.trim()) {
                    setError('Organization name is required');
                    return false;
                }
                return true;
            case 2:
                // Contact info is optional
                return true;
            case 3:
                // Location is optional
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await organizationsService.create(formData);
            navigate(`/organizations/${response.id || response.pk}`);
        } catch (err) {
            console.error('Failed to create organization:', err);
            setError(err.response?.data?.detail || 'Failed to create organization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Basic Info', icon: Building2 },
        { num: 2, title: 'Contact', icon: Mail },
        { num: 3, title: 'Location', icon: MapPin },
        { num: 4, title: 'Review', icon: Check },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/organizations')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
                        <p className="text-gray-600">Register your organization on the platform</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((s, idx) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step >= s.num 
                                        ? 'bg-primary-600 text-white' 
                                        : 'bg-gray-200 text-gray-500'
                                }`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs mt-1 ${step >= s.num ? 'text-primary-600' : 'text-gray-500'}`}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${
                                    step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <Card>
                    <CardBody className="p-6">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                                    
                                    <Input
                                        label="Organization Name *"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter organization name"
                                        required
                                    />

                                    <Input
                                        label="Abbreviation"
                                        name="abbreviation"
                                        value={formData.abbreviation}
                                        onChange={handleChange}
                                        placeholder="e.g., UNKE"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization Type
                                        </label>
                                        <select
                                            name="org_type"
                                            value={formData.org_type}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            {orgTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <Input
                                        label="Industry"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        placeholder="e.g., Technology, Healthcare, Education"
                                    />
                                </div>
                            )}

                            {/* Step 2: Contact Info */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                                    
                                    <Input
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contact@organization.com"
                                    />

                                    <Input
                                        label="Website"
                                        name="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://www.organization.com"
                                    />

                                    <Input
                                        label="Phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+254 700 000 000"
                                    />
                                </div>
                            )}

                            {/* Step 3: Location */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Country"
                                            name="origin"
                                            value={formData.origin}
                                            onChange={handleChange}
                                            placeholder="Kenya"
                                        />

                                        <Input
                                            label="City"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="Nairobi"
                                        />
                                    </div>

                                    <Input
                                        label="Town"
                                        name="town"
                                        value={formData.town}
                                        onChange={handleChange}
                                        placeholder="Westlands"
                                    />

                                    <Input
                                        label="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="123 Main Street"
                                    />

                                    <Input
                                        label="Postal Code"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        placeholder="00100"
                                    />
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-gray-500">Name:</div>
                                                <div className="text-gray-900">{formData.name || '-'}</div>
                                                <div className="text-gray-500">Abbreviation:</div>
                                                <div className="text-gray-900">{formData.abbreviation || '-'}</div>
                                                <div className="text-gray-500">Type:</div>
                                                <div className="text-gray-900">
                                                    {orgTypes.find(t => t.value === formData.org_type)?.label || '-'}
                                                </div>
                                                <div className="text-gray-500">Industry:</div>
                                                <div className="text-gray-900">{formData.industry || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-gray-900 mb-2">Contact</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-gray-500">Email:</div>
                                                <div className="text-gray-900">{formData.email || '-'}</div>
                                                <div className="text-gray-500">Website:</div>
                                                <div className="text-gray-900">{formData.website || '-'}</div>
                                                <div className="text-gray-500">Phone:</div>
                                                <div className="text-gray-900">{formData.phone || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-gray-500">Country:</div>
                                                <div className="text-gray-900">{formData.origin || '-'}</div>
                                                <div className="text-gray-500">City:</div>
                                                <div className="text-gray-900">{formData.city || '-'}</div>
                                                <div className="text-gray-500">Address:</div>
                                                <div className="text-gray-900">{formData.address || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8 pt-4 border-t">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" onClick={() => navigate('/organizations')}>
                                        Cancel
                                    </Button>
                                )}

                                {step < 4 ? (
                                    <Button type="button" variant="primary" onClick={handleNext}>
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Organization'}
                                        <Check className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateOrganization;
