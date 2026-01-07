import React, { useState } from 'react';
import institutionService from '../../services/institutions.service';
import organizationsService from '../../services/organizations.service';
import './EntityCreationPortal.css';

const INSTITUTION_TYPES = [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
    { value: 'school', label: 'School' },
    { value: 'training_center', label: 'Training Center' },
    { value: 'research_institute', label: 'Research Institute' },
];

const ORGANIZATION_TYPES = [
    { value: 'business', label: 'Business Enterprise' },
    { value: 'ngo', label: 'Non-Governmental Organisation (NGO)' },
    { value: 'go', label: 'Governmental Organisation' },
    { value: 'ministry', label: 'Ministry Organisation' },
    { value: 'other', label: 'Other' },
];

const EntityCreationPortal = ({ entityType = 'institution', onSuccess, onCancel }) => {
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Contact Details, 3: Verification
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [entity, setEntity] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: entityType === 'institution' ? 'university' : 'business',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        description: '',
    });

    const isInstitution = entityType === 'institution';
    const service = isInstitution ? institutionService : organizationsService;
    const typeOptions = isInstitution ? INSTITUTION_TYPES : ORGANIZATION_TYPES;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (formData.name.length < 3) {
            setError('Name must be at least 3 characters');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email format');
            return false;
        }
        if (!formData.phone.trim()) {
            setError('Phone number is required');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(prev => prev + 3);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
        setError('');
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) return;

        setLoading(true);
        setError('');

        try {
            const payload = isInstitution
                ? {
                    name: formData.name,
                    institution_type: formData.type,
                    email: formData.email,
                    phone: formData.phone,
                    website: formData.website,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    postal_code: formData.postal_code,
                    description: formData.description,
                }
                : {
                    name: formData.name,
                    organization_type: formData.type,
                    email: formData.email,
                    phone: formData.phone,
                    website: formData.website,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    postal_code: formData.postal_code,
                    description: formData.description,
                };

            const response = isInstitution
                ? await institutionService.createInstitution(payload)
                : await organizationsService.create(payload);

            setEntity(response);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to create ${entityType}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendVerification = async () => {
        if (!entity) return;

        setLoading(true);
        setError('');

        try {
            await service.sendEmailVerification(entity.id);
            alert('Verification email sent! Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send verification email');
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'complete' : ''}`}>
                <div className="step-circle">1</div>
                <div className="step-label">Basic Info</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'complete' : ''}`}>
                <div className="step-circle">2</div>
                <div className="step-label">Contact Details</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Verification</div>
            </div>
        </div>
    );

    return (
        <div className="entity-creation-portal">
            <div className="portal-header">
                <h1>Create {isInstitution ? 'Institution' : 'Organization'}</h1>
                <button className="close-btn" onClick={onCancel}>×</button>
            </div>

            {renderProgressBar()}

            {error && <div className="error-message">{error}</div>}

            {step === 1 && (
                <div className="form-step">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder={`Enter ${entityType} name`}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="form-select"
                        >
                            {typeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Brief description"
                            className="form-textarea"
                            rows="4"
                        />
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleNext}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="form-step">
                    <h2>Contact Details</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="contact@example.com"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+254 700 000 000"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://example.com"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Address *</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Street address"
                            className="form-input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>State/Region</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Postal Code</label>
                            <input
                                type="text"
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={handleBack}>
                            Back
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : `Create ${isInstitution ? 'Institution' : 'Organization'}`}
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && entity && (
                <div className="form-step verification-step">
                    <div className="success-icon">✓</div>
                    <h2>{isInstitution ? 'Institution' : 'Organization'} Created Successfully!</h2>
                    <p className="success-message">
                        Your {entityType} "{entity.name}" has been created.
                    </p>

                    <div className="next-steps">
                        <h3>Next Steps:</h3>
                        <ol>
                            <li>Verify your email address</li>
                            <li>Upload required documents</li>
                            <li>Submit for verification review</li>
                        </ol>
                    </div>

                    <div className="verification-actions">
                        <button
                            className="btn-primary"
                            onClick={handleSendVerification}
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Verification Email'}
                        </button>
                        <button className="btn-secondary" onClick={() => onSuccess(entity)}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityCreationPortal;
