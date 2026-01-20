import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, validatePassword, validateRequired, getErrorMessage } from '../../utils/validators';

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
        if (!validateRequired(formData.firstName)) newErrors.firstName = 'First name is required';
        if (!validateRequired(formData.lastName)) newErrors.lastName = 'Last name is required';
        if (!validateRequired(formData.email)) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!validateRequired(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number is required';
        }
        if (!validateRequired(formData.password)) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            await register({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                user_type: formData.userType,
            });
        } catch (error) {
            setGeneralError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-4xl flex bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between text-white">
                    <div>
                        <Link to={ROUTES.LOGIN} className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-8">
                            <span className="text-2xl font-bold">C</span>
                        </Link>
                        <h1 className="text-4xl font-bold mb-6">Start your Journey Today</h1>
                        <p className="text-lg text-primary-100">
                            Join thousands of students and educators who are already using Comrade to excel in their academic lives.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-white/10 rounded-2xl border border-white/10">
                            <p className="italic mb-4">"Comrade has completely transformed how I manage my studies and collaborate with my peers. It's a game-changer!"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold">JD</div>
                                <div>
                                    <p className="text-sm font-bold">Jane Doe</p>
                                    <p className="text-xs text-primary-100">Computer Science Student</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Register Form */}
                <div className="flex-1 p-8 lg:p-12 bg-white overflow-y-auto max-h-[90vh]">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                            <p className="text-gray-600">Join the community and start collaborating.</p>
                        </div>

                        {generalError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {generalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                label="Email Address"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@university.edu"
                                error={errors.email}
                                required
                            />

                            <Input
                                label="Phone Number"
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="+254..."
                                error={errors.phoneNumber}
                                required
                            />

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">I am a</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['student', 'lecturer', 'staff'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                                            className={`py-2 rounded-lg border-2 transition-all capitalize font-medium ${formData.userType === type
                                                    ? 'bg-primary-50 border-primary-600 text-primary-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    error={errors.password}
                                    required
                                />
                                <Input
                                    label="Confirm"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    error={errors.confirmPassword}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="w-full py-3 mt-4"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-gray-600">
                            Already have an account?{' '}
                            <Link to={ROUTES.LOGIN} className="text-primary-600 font-bold hover:text-primary-700">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
