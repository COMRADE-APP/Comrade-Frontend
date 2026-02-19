import React, { useState } from 'react';
import { X } from 'lucide-react';
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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

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

        if (!agreedToTerms) {
            newErrors.terms = 'You must accept the Terms of Service';
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
                    <h1 className="text-4xl font-bold mb-4">Welcome to Qomrade</h1>
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to Qomrade</h2>
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

                        {/* Terms of Service Checkbox */}
                        <div>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => {
                                        setAgreedToTerms(e.target.checked);
                                        if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                                />
                                <span className="text-sm text-gray-700">
                                    I agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(true)}
                                        className="text-primary-600 hover:text-primary-700 font-medium underline"
                                    >
                                        Terms of Service
                                    </button>
                                    {' '}and{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(true)}
                                        className="text-primary-600 hover:text-primary-700 font-medium underline"
                                    >
                                        Terms &amp; Conditions
                                    </button>
                                </span>
                            </label>
                            {errors.terms && (
                                <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !agreedToTerms}
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

            {/* Terms of Service Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Terms of Service &amp; Conditions</h2>
                            <button onClick={() => setShowTermsModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 space-y-4">
                            <p className="text-xs text-gray-500">Last updated: February 19, 2026</p>

                            <h3 className="font-semibold text-gray-900 text-base">1. Acceptance of Terms</h3>
                            <p>By accessing or using Qomrade ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this Platform.</p>

                            <h3 className="font-semibold text-gray-900 text-base">2. User Accounts</h3>
                            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You must notify us immediately of any unauthorized use of your account.</p>

                            <h3 className="font-semibold text-gray-900 text-base">3. Acceptable Use</h3>
                            <p>You agree not to use the Platform to:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Infringe on the rights of others</li>
                                <li>Transmit harmful, offensive, or disruptive content</li>
                                <li>Attempt to gain unauthorized access to any systems or networks</li>
                                <li>Engage in academic dishonesty or plagiarism</li>
                                <li>Harass, bully, or intimidate other users</li>
                            </ul>

                            <h3 className="font-semibold text-gray-900 text-base">4. Content &amp; Intellectual Property</h3>
                            <p>You retain ownership of content you create on the Platform. By posting content, you grant Qomrade a non-exclusive, royalty-free license to use, display, and distribute your content within the Platform. You may not reproduce, distribute, or create derivative works from any Platform content without permission.</p>

                            <h3 className="font-semibold text-gray-900 text-base">5. Payment Terms</h3>
                            <p>Certain features may require payment. All payments are processed securely through our payment partners (M-Pesa, Stripe, PayPal). You agree to pay all charges at the prices listed. All transactions are final unless otherwise stated. Qomrade reserves the right to modify pricing with reasonable notice.</p>

                            <h3 className="font-semibold text-gray-900 text-base">6. Privacy &amp; Data Protection</h3>
                            <p>We are committed to protecting your personal information. Data is collected, stored, and processed in accordance with applicable data-protection laws. We use encryption (AES-256-GCM) to protect sensitive data. We do not sell your personal information to third parties.</p>

                            <h3 className="font-semibold text-gray-900 text-base">7. Disclaimers &amp; Limitation of Liability</h3>
                            <p>The Platform is provided "as is" without warranties of any kind. Qomrade shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount paid by you in the preceding 12 months.</p>

                            <h3 className="font-semibold text-gray-900 text-base">8. Account Termination</h3>
                            <p>We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time through the Settings page. Upon termination, your right to use the Platform will immediately cease.</p>

                            <h3 className="font-semibold text-gray-900 text-base">9. Changes to Terms</h3>
                            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. We will notify users of material changes via email or Platform notification.</p>

                            <h3 className="font-semibold text-gray-900 text-base">10. Contact</h3>
                            <p>For questions about these Terms, contact us at <span className="text-primary-600 font-medium">support@qomradeapp.com</span>.</p>
                        </div>
                        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setAgreedToTerms(true);
                                    setShowTermsModal(false);
                                    if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                                }}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium text-sm"
                            >
                                I Accept
                            </button>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
