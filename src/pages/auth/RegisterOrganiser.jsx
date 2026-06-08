import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, validatePassword, validateRequired, getErrorMessage } from '../../utils/validators';
import { getBrowserLocale } from '../../utils/currency';
import countries from '../../data/countries.json';
import { ChevronLeft, ChevronRight, Check, Building2, User, Globe } from 'lucide-react';
import authService from '../../services/auth.service';

const NEW_USER_STEPS = [
    { title: 'Account', icon: User },
    { title: 'Profile', icon: Building2 },
    { title: 'Details', icon: Globe },
];

const EXISTING_USER_STEPS = [
    { title: 'Profile', icon: Building2 },
    { title: 'Details', icon: Globe },
];

const RegisterOrganiser = () => {
    const { user, register } = useAuth();
    const navigate = useNavigate();
    const isLoggedIn = !!user;
    const steps = isLoggedIn ? EXISTING_USER_STEPS : NEW_USER_STEPS;

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        firstName: user?.first_name || '', lastName: user?.last_name || '',
        email: user?.email || '', phoneNumber: '',
        password: '', confirmPassword: '', country: '', dateOfBirth: '',
        businessName: '', bio: '', website: '', location: '', gender: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (!isLoggedIn && step === 0) {
            if (!validateRequired(formData.firstName)) newErrors.firstName = 'Required';
            if (!validateRequired(formData.lastName)) newErrors.lastName = 'Required';
            if (!validateRequired(formData.email)) newErrors.email = 'Required';
            else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email';
            if (!validateRequired(formData.country)) newErrors.country = 'Required';
            if (!validateRequired(formData.phoneNumber)) newErrors.phoneNumber = 'Required';
            else if (formData.phoneNumber.replace(/\s/g, '').length < 4) newErrors.phoneNumber = 'Invalid';
            if (!validateRequired(formData.password)) newErrors.password = 'Required';
            else if (!validatePassword(formData.password)) newErrors.password = '8+ chars, upper, lower, number & special';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        if ((!isLoggedIn && step === 1) || (isLoggedIn && step === 0)) {
            if (!validateRequired(formData.businessName)) newErrors.businessName = 'Required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setStep(s => Math.min(s + 1, steps.length - 1));
    };

    const handleSubmit = async () => {
        setGeneralError('');
        if (!validateStep()) return;
        setLoading(true);
        try {
            const payload = {
                email: formData.email,
                business_name: formData.businessName, bio: formData.bio,
                website: formData.website, location: formData.location,
                gender: formData.gender || undefined,
            };
            if (formData.dateOfBirth) payload.date_of_birth = formData.dateOfBirth;

            if (isLoggedIn) {
                payload.email = user?.email || formData.email;
                console.log('[RegisterOrganiser] Logged-in payload:', JSON.stringify(payload, null, 2));
                const data = await authService.registerOrganiser(payload);
                navigate(ROUTES.ORGANISER_DASHBOARD);
            } else {
                Object.assign(payload, {
                    first_name: formData.firstName, last_name: formData.lastName,
                    phone_number: formData.phoneNumber,
                    password: formData.password, confirm_password: formData.confirmPassword,
                    country_of_origin: formData.country, browser_locale: getBrowserLocale(),
                });
                await register(payload, 'organiser');
                navigate(ROUTES.VERIFY_REGISTRATION, {
                    state: { email: formData.email, message: 'Registration successful. Please verify your email.' }
                });
            }
        } catch (error) {
            console.error('[RegisterOrganiser] Submit error:', error?.response?.data || error.message);
            setGeneralError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const GENDER_OPTIONS = [
        { value: '', label: 'Prefer not to say' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];

    const isLastStep = step === steps.length - 1;

    return (
        <div className="h-[100svh] w-full flex overflow-hidden bg-base">
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-700/90 via-primary-800/90 to-primary-900" />
                <img src="/qomrade_growth_emblem.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-110" />
                <div className="relative z-10 p-12 xl:p-16 flex flex-col h-full text-white w-full">
                    <div className="flex flex-col gap-3">
                        <img src="/qomrade_svg.svg" alt="Qomrade Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
                        <h1 className="text-4xl xl:text-5xl font-extrabold mt-4 tracking-tight">Become an<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Organiser</span></h1>
                        <p className="text-lg opacity-90 max-w-md font-medium mt-2">Create and manage events, find sponsors, and grow your reach on Qomrade.</p>
                    </div>
                    <div className="mt-auto text-xs text-primary-200/60 font-medium">
                        &copy; {new Date().getFullYear()} Qomrade. All rights reserved.
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-base w-full lg:w-1/2 relative">
                <div className="min-h-full flex flex-col p-4 sm:p-8">
                    <div className="w-full max-w-md mx-auto my-auto py-4">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-primary mb-2">
                                {isLoggedIn ? 'Set Up Organiser Profile' : 'Register as Organiser'}
                            </h2>
                            <p className="text-secondary font-medium text-sm">
                                {isLoggedIn ? 'Add your organiser details to start hosting events' : 'Set up your organiser profile to start hosting events'}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-8">
                            {steps.map((s, i) => (
                                <React.Fragment key={i}>
                                    <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-tertiary'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                            i < step ? 'bg-primary-600 text-white border-primary-600' :
                                            i === step ? 'border-primary-600 text-primary-600' :
                                            'border-tertiary text-tertiary'
                                        }`}>
                                            {i < step ? <Check className="w-4 h-4" /> : i + 1}
                                        </div>
                                        <span className="text-sm font-medium hidden sm:block">{s.title}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-primary-600' : 'bg-tertiary/30'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {generalError && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 font-medium text-sm">{generalError}</div>
                        )}

                        <form onSubmit={e => { e.preventDefault(); isLastStep ? handleSubmit() : handleNext(); }} className="space-y-4">
                            {!isLoggedIn && step === 0 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="First Name" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" error={errors.firstName} required />
                                        <Input label="Last Name" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" error={errors.lastName} required />
                                    </div>
                                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" error={errors.email} required />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Country <span className="text-red-500">*</span></label>
                                            <select name="country" value={formData.country} onChange={e => {
                                                const c = countries.find(c => c.code === e.target.value);
                                                setFormData(prev => ({ ...prev, country: e.target.value, phoneNumber: c ? c.phone_code : prev.phoneNumber }));
                                            }} className={`w-full px-3 py-2 bg-elevated border ${errors.country ? 'border-red-500' : 'border-theme'} text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm`}>
                                                <option value="">Select</option>
                                                {countries.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                            </select>
                                            {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <Input label="Phone Number" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+254700000000" error={errors.phoneNumber} required />
                                        </div>
                                    </div>
                                    <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" error={errors.password} required />
                                    <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" error={errors.confirmPassword} required />
                                </>
                            )}

                            {((!isLoggedIn && step === 1) || (isLoggedIn && step === 0)) && (
                                <>
                                    <Input label="Business / Organisation Name" type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="My Events Co." error={errors.businessName} required />
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Bio</label>
                                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself and your events..." className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" />
                                    </div>
                                    <Input label="Website" type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://myevents.com" />
                                    <Input label="Location" type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Nairobi, Kenya" />
                                </>
                            )}

                            {((!isLoggedIn && step === 2) || (isLoggedIn && step === 1)) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Gender <span className="text-tertiary text-xs">(for analytics)</span></label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Date of Birth <span className="text-tertiary text-xs">(for demographics)</span></label>
                                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                {step > 0 && (
                                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                )}
                                <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                                    {loading ? 'Creating...' : isLastStep ? (
                                        isLoggedIn ? <>Create Organiser Profile <Check className="w-4 h-4 ml-2" /></> : <>Create Organiser Account <Check className="w-4 h-4 ml-2" /></>
                                    ) : (
                                        <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {!isLoggedIn && (
                            <p className="mt-6 text-center text-sm font-medium text-secondary">
                                Already have an account?{' '}
                                <Link to={ROUTES.LOGIN} className="text-primary-600 font-bold hover:text-primary-700">Sign in</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterOrganiser;
