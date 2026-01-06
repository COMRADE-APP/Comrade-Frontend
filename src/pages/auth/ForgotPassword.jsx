import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, validateRequired } from '../../utils/validators';
import authService from '../../services/auth.service';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateRequired(email)) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email');
            return;
        }

        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            setSuccess(true);
        } catch (error) {
            // Even if failed, we often don't want to reveal it, but here we can show error if 429 etc
            const msg = error.response?.data?.detail || 'An error occurred. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-8">
                        We've sent a verification code to {email}
                    </p>

                    <Link to={`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}`}>
                        <Button variant="primary" className="w-full">
                            Enter Reset Code
                        </Button>
                    </Link>

                    <div className="mt-4">
                        <Link to={ROUTES.LOGIN} className="text-sm text-gray-500 hover:text-gray-700">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h2>
                    <p className="text-gray-600">No worries, we'll send you reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        error={error}
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Sending...' : 'Send Reset Code'}
                    </Button>
                </form>

                <Link to={ROUTES.LOGIN} className="block mt-6 text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                    ← Back to login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
