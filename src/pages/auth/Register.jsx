import React, { useState } from 'react';
import { ShoppingBag, CreditCard, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, validatePassword, validateRequired, getErrorMessage } from '../../utils/validators';
import { getBrowserLocale } from '../../utils/currency';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        userType: 'student',
        dateOfBirth: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!validateRequired(formData.firstName)) {
            newErrors.firstName = 'First name is required';
        }

        if (!validateRequired(formData.lastName)) {
            newErrors.lastName = 'Last name is required';
        }

        if (!validateRequired(formData.email)) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!validateRequired(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (formData.phoneNumber.length < 10) {
            newErrors.phoneNumber = 'Phone number must be at least 10 digits';
        }

        if (!validateRequired(formData.password)) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Validate birthday if provided (optional field)
        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            if (dob > new Date()) {
                newErrors.dateOfBirth = 'Date of birth cannot be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');

        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                user_type: formData.userType,
                browser_locale: getBrowserLocale(),
            };

            // Only include date_of_birth if the user provided one
            if (formData.dateOfBirth) {
                payload.date_of_birth = formData.dateOfBirth;
            }

            const response = await register(payload);

            // Navigate to OTP verification page
            navigate(ROUTES.VERIFY_REGISTRATION, {
                state: {
                    email: formData.email,
                    message: response.message
                }
            });
        } catch (error) {
            setGeneralError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[100svh] w-full flex overflow-hidden bg-base">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-700/90 via-primary-800/90 to-primary-900 flex flex-col justify-between" />
                <img src="/qomrade_growth_emblem.png" alt="Platform" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-110" />
                
                <div className="relative z-10 p-12 xl:p-16 flex flex-col h-full text-white w-full">
                    <div className="flex flex-col gap-3">
                        <img src="/qomrade_svg.svg" alt="Qomrade Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
                        <h1 className="text-4xl xl:text-5xl font-extrabold mt-4 tracking-tight">Join <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Qomrade</span> Today</h1>
                        <p className="text-lg opacity-90 max-w-md font-medium mt-2">Become part of the most comprehensive platform for finance, marketplace, and community.</p>
                    </div>
                    <div className="space-y-8 mt-16 mb-auto">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/20 shrink-0"><ShoppingBag size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Unified Marketplace</h3>
                                <p className="text-sm text-primary-100 max-w-sm leading-relaxed">Shop globally, order from local restaurants, and book professional services seamlessly.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/20 shrink-0"><CreditCard size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Group Financial Services</h3>
                                <p className="text-sm text-primary-100 max-w-sm leading-relaxed">Pool funds, manage group kitties, split bills, and handle escrow transactions seamlessly.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/20 shrink-0"><Users size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Thriving Community</h3>
                                <p className="text-sm text-primary-100 max-w-sm leading-relaxed">Connect with peers, organize events, find opportunities, and grow your network.</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-primary-200/60 font-medium">
                        &copy; {new Date().getFullYear()} Qomrade. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="flex-1 overflow-y-auto bg-base w-full lg:w-1/2 relative">
                <div className="min-h-full flex flex-col p-4 sm:p-8">
                    <div className="w-full max-w-md mx-auto my-auto py-4">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-primary mb-2">Create your account</h2>
                            <p className="text-secondary font-medium text-sm">Join Qomrade and start connecting</p>
                        </div>

                        {generalError && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 font-medium text-sm">
                                {generalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            error={errors.firstName}
                            required
                        />

                        <Input
                            label="Last Name"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            error={errors.lastName}
                            required
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        error={errors.email}
                        required
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+254700000000"
                        error={errors.phoneNumber}
                        required
                    />

                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary mb-1">
                            Date of Birth <span className="text-tertiary text-xs">(Optional)</span>
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                        {errors.dateOfBirth && (
                            <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="userType" className="block text-sm font-medium text-secondary mb-1">
                            I am a <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="userType"
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                            <option value="student">Student</option>
                            <option value="normal_user">Normal User (Non-Student)</option>
                            <option value="lecturer">Lecturer</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        error={errors.password}
                        required
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        error={errors.confirmPassword}
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="w-full text-base py-3 mt-2"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm font-medium text-secondary">
                    Already have an account?{' '}
                    <Link to={ROUTES.LOGIN} className="text-primary-600 font-bold hover:text-primary-700">
                        Sign in
                    </Link>
                </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
