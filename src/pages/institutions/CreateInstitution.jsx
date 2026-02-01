import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Building2, ArrowLeft, ArrowRight, Check, MapPin, Mail, Globe, Phone, FileText } from 'lucide-react';
import institutionsService from '../../services/institutions.service';

const CreateInstitution = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Identity
        name: '',
        institution_type: 'university',
        description: '',

        // Contact
        email: '',
        website: '',
        phone: '',

        // Location
        country: '',
        state_province: '',
        city: '',
        address: '',
        postal_code: '',

        // Legal (Optional)
        registration_number: '',
        tax_id: '',
    });

    const institutionTypes = [
        { value: 'university', label: 'University' },
        { value: 'college', label: 'College' },
        { value: 'school', label: 'School' },
        { value: 'company', label: 'Company' },
        { value: 'ngo', label: 'NGO' },
        { value: 'government', label: 'Government Agency' },
        { value: 'research', label: 'Research Institution' },
        { value: 'hospital', label: 'Hospital/Medical' },
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
                    setError('Institution name is required');
                    return false;
                }
                return true;
            case 2:
                if (!formData.email.trim()) {
                    setError('Email is required');
                    return false;
                }
                return true;
            case 3:
                if (!formData.country.trim()) {
                    setError('Country is required');
                    return false;
                }
                if (!formData.city.trim()) {
                    setError('City is required');
                    return false;
                }
                if (!formData.address.trim()) {
                    setError('Address is required');
                    return false;
                }
                return true;
            case 4:
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
            const response = await institutionsService.create(formData);
            navigate(`/institutions/${response.id || response.pk}`);
        } catch (err) {
            console.error('Failed to create institution:', err);
            const resData = err.response?.data;
            let errorMessage = 'Failed to create institution. Please try again.';

            if (resData) {
                if (resData.detail) {
                    errorMessage = resData.detail;
                } else if (resData.message) {
                    errorMessage = resData.message;
                } else {
                    // Extract first field error or join them
                    const fieldErrors = Object.entries(resData)
                        .map(([key, msg]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(msg) ? msg[0] : msg}`);

                    if (fieldErrors.length > 0) {
                        errorMessage = fieldErrors[0]; // Show the first error
                        // Or show all: errorMessage = fieldErrors.join('. ');
                    }
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Identity', icon: Building2 },
        { num: 2, title: 'Contact', icon: Mail },
        { num: 3, title: 'Location', icon: MapPin },
        { num: 4, title: 'Legal', icon: FileText },
        { num: 5, title: 'Review', icon: Check },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/institutions')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Institution</h1>
                        <p className="text-gray-600">Register a new institution on the platform</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                    {steps.map((s, idx) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center min-w-[60px]">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${step >= s.num
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs mt-1 font-medium ${step >= s.num ? 'text-primary-600' : 'text-gray-500'}`}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                <Card>
                    <CardBody className="p-6">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Identity */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Identity</h2>

                                    <Input
                                        label="Institution Name *"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. University of Nairobi"
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Institution Type
                                        </label>
                                        <select
                                            name="institution_type"
                                            value={formData.institution_type}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                                        >
                                            {institutionTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Brief description of the institution..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Contact Info */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

                                    <Input
                                        label="Email Address *"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="admin@institution.edu"
                                        required
                                    />

                                    <Input
                                        label="Website URL"
                                        name="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://www.institution.edu"
                                    />

                                    <Input
                                        label="Phone Number"
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

                                    <Input
                                        label="Country *"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="e.g. Kenya"
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="State / Province"
                                            name="state_province"
                                            value={formData.state_province}
                                            onChange={handleChange}
                                            placeholder="e.g. Nairobi"
                                        />
                                        <Input
                                            label="City *"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="e.g. Nairobi"
                                            required
                                        />
                                    </div>

                                    <Input
                                        label="Physical Address *"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Building, Street Name"
                                        required
                                    />

                                    <Input
                                        label="Postal Code"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        placeholder="e.g. 00100"
                                    />
                                </div>
                            )}

                            {/* Step 4: Legal */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Legal Registration (Optional)</h2>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Providing these details helps speed up the verification process.
                                    </p>

                                    <Input
                                        label="Registration Number"
                                        name="registration_number"
                                        value={formData.registration_number}
                                        onChange={handleChange}
                                        placeholder="Official Government Registration Number"
                                    />

                                    <Input
                                        label="Tax ID / PIN"
                                        name="tax_id"
                                        value={formData.tax_id}
                                        onChange={handleChange}
                                        placeholder="Tax Identification Number"
                                    />
                                </div>
                            )}

                            {/* Step 5: Review */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-500" />
                                                Identity
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                                <div className="text-gray-500">Name:</div>
                                                <div className="text-gray-900 font-medium">{formData.name || '-'}</div>
                                                <div className="text-gray-500">Type:</div>
                                                <div className="text-gray-900">
                                                    {institutionTypes.find(t => t.value === formData.institution_type)?.label || '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                Contact
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                                <div className="text-gray-500">Email:</div>
                                                <div className="text-gray-900 font-medium">{formData.email || '-'}</div>
                                                <div className="text-gray-500">Phone:</div>
                                                <div className="text-gray-900">{formData.phone || '-'}</div>
                                                <div className="text-gray-500">Website:</div>
                                                <div className="text-gray-900 truncate">{formData.website || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                Location
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                                <div className="text-gray-500">Location:</div>
                                                <div className="text-gray-900">
                                                    {[formData.city, formData.country].filter(Boolean).join(', ')}
                                                </div>
                                                <div className="text-gray-500">Address:</div>
                                                <div className="text-gray-900">{formData.address || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" onClick={() => navigate('/institutions')}>
                                        Cancel
                                    </Button>
                                )}

                                {step < 5 ? (
                                    <Button type="button" variant="primary" onClick={handleNext}>
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Institution'}
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

export default CreateInstitution;
