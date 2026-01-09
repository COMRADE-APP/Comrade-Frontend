import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [countdown, setCountdown] = useState(3);

    const firstName = location.state?.firstName || 'User';
    const userType = location.state?.userType || 'student';

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(ROUTES.DASHBOARD, { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Success Animation */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h2>
                <p className="text-gray-600 mb-4">
                    Welcome back, <span className="font-semibold text-primary-600">{firstName}</span>!
                </p>

                <div className="mb-6 py-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Redirecting to dashboard in</p>
                    <p className="text-3xl font-bold text-primary-600">{countdown}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                <button
                    onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
                    className="mt-6 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Go to Dashboard now →
                </button>
            </div>
        </div>
    );
};

export default LoginSuccess;
