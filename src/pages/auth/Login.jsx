import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import { validateEmail, validateRequired, getErrorMessage } from '../../utils/validators';
import API_ENDPOINTS from '../../constants/apiEndpoints';

const Login = () => {
    const { login } = useAuth();
    const location = useLocation();
    const successMessage = location.state?.message;
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!validateRequired(formData.email)) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!validateRequired(formData.password)) {
            newErrors.password = 'Password is required';
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
            await login(formData.email, formData.password);
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
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-8">
                            <span className="text-2xl font-bold">C</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-6">Connect with your Academic Hub</h1>
                        <p className="text-lg text-primary-100">
                            Comrade is the all-in-one platform for students and educators to collaborate, share resources, and grow together.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { icon: '🚀', title: 'Accelerate Learning', desc: 'Access curated resources and study materials.' },
                            { icon: '🤝', title: 'Seamless Collaboration', desc: 'Work together on projects and assignments.' },
                            { icon: '📅', title: 'Stay Organized', desc: 'Never miss a deadline with our smart task manager.' }
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold mb-1">{feature.title}</h3>
                                    <p className="text-sm text-primary-100">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 p-8 lg:p-12 bg-white">
                    <div className="max-w-sm mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Please enter your credentials to continue.</p>
                        </div>

                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {generalError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {generalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                error={errors.password}
                                required
                            />

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="w-full py-3"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-8">
                            <SocialLoginButtons />
                        </div>

                        <p className="mt-10 text-center text-gray-600">
                            New to Comrade?{' '}
                            <Link to={ROUTES.REGISTER} className="text-primary-600 font-bold hover:text-primary-700">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
