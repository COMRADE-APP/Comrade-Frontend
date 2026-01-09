import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';

const RegistrationSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const userType = location.state?.userType || 'student';

    const handleSetupProfile = () => {
        navigate(ROUTES.PROFILE_SETUP, { state: { email, userType } });
    };

    const handleSkip = () => {
        navigate(ROUTES.LOGIN, {
            state: { message: 'Account verified! Please login to continue.' }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                <p className="text-gray-600 mb-8">
                    Your email has been verified successfully.<br />
                    Welcome to <span className="font-semibold text-primary-600">Comrade</span>!
                </p>

                {email && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Registered as</p>
                        <p className="font-medium text-gray-900">{email}</p>
                        <p className="text-sm text-primary-600 capitalize mt-1">{userType}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Button
                        onClick={handleSetupProfile}
                        variant="primary"
                        className="w-full"
                    >
                        Set Up Your Profile
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Skip for now → Login
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Complete your profile to unlock all features and connect with your community.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
