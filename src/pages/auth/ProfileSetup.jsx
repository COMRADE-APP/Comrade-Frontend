import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ProfileSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const userType = location.state?.userType || 'student';

    const [formData, setFormData] = useState({
        bio: '',
        location: '',
        profilePicture: null,
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkip = () => {
        navigate(ROUTES.LOGIN, {
            state: { message: 'Profile setup skipped. Please login to continue.' }
        });
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Profile will be completed after login, just redirect to login
            navigate(ROUTES.LOGIN, {
                state: { message: 'Account ready! Please login to access your dashboard.' }
            });
        } catch (error) {
            console.error('Profile setup error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 to-purple-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Profile</h2>
                    <p className="text-gray-600">
                        Help others get to know you better
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`w-8 h-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                </div>

                {/* User Type Badge */}
                <div className="flex justify-center mb-6">
                    <span className="px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                        {userType}
                    </span>
                </div>

                <div className="space-y-4">
                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us a bit about yourself..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Location */}
                    <Input
                        label="Location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, Country"
                    />

                    {/* Profile Picture Upload Placeholder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Picture
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-3">
                    <Button
                        onClick={handleComplete}
                        variant="primary"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Complete Setup'}
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Skip for now
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        You can always complete your profile later in Settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
