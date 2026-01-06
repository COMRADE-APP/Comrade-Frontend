import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import { validateEmail, validateRequired, getErrorMessage } from '../../utils/validators';
import API_ENDPOINTS from '../../constants/apiEndpoints';

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otpMethod: 'email', // 'email' or 'sms'
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
        // Clear error for this field
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
            const response = await login(formData.email, formData.password, formData.otpMethod);

            // Check if verification is required
            if (response.verification_required) {
                // Redirect to email verification page
                // The 'login' function in AuthContext usually navigates to dashboard
                // We need to modify AuthContext or handle navigation here
                // Note: AuthContext might already navigate. We should check AuthContext.
            }
        } catch (error) {
            setGeneralError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = API_ENDPOINTS.GOOGLE_LOGIN;
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-700 p-12 flex-col justify-between text-white">
                <div>
                    <h1 className="text-4xl font-bold mb-4">Welcome to Comrade</h1>
                    <p className="text-lg opacity-90">Connect, learn, and collaborate with your academic community</p>
                </div>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">📚</div>
                        <div>
                            <h3 className="font-semibold mb-1">Manage Your Tasks</h3>
                            <p className="text-sm opacity-80">Stay on top of assignments and deadlines</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🎉</div>
                        <div>
                            <h3 className="font-semibold mb-1">Discover Events</h3>
                            <p className="text-sm opacity-80">Join exciting campus events and activities</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">👥</div>
                        <div>
                            <h3 className="font-semibold mb-1">Build Community</h3>
                            <p className="text-sm opacity-80">Connect with peers and engage in discussions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to Comrade</h2>
                        <p className="text-gray-600">Welcome back! Please enter your details.</p>
                    </div>

                    {generalError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {generalError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            error={errors.password}
                            required
                        />

                        {/* OTP Method Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Verify Identity via:</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="otpMethod"
                                        value="email"
                                        checked={formData.otpMethod === 'email'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Email</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="otpMethod"
                                        value="sms"
                                        checked={formData.otpMethod === 'sms'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">SMS (Phone)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Remember me</span>
                            </label>
                            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary-600 hover:text-primary-700">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    {/* Social Login Buttons */}
                    <SocialLoginButtons />

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to={ROUTES.REGISTER} className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
