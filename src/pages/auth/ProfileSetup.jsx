import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';
import { User, MapPin, Briefcase, Heart, Camera, Check, ArrowRight, ArrowLeft, Lock } from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Basic Info', icon: User },
    { id: 2, title: 'Location & Work', icon: Briefcase },
    { id: 3, title: 'Interests', icon: Heart },
    { id: 4, title: 'Photo', icon: Camera },
];

const INTEREST_OPTIONS = [
    'Technology', 'Education', 'Business', 'Health', 'Arts', 'Sports',
    'Music', 'Travel', 'Food', 'Science', 'Environment', 'Social Impact',
    'Finance', 'Marketing', 'Design', 'Engineering', 'Research', 'Writing',
];

const ProfileSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const email = location.state?.email || user?.email;
    const userType = location.state?.userType || user?.user_type || 'student';

    // Detect social login: check query params or location state
    const fromSocial = searchParams.get('fromSocial') === 'true' || location.state?.fromSocial;
    const hasPassword = searchParams.get('hasPassword') === 'true' || location.state?.hasPassword || user?.has_password;
    const needsPassword = fromSocial && !hasPassword;

    // Dynamic steps — insert password step for social users without a password
    const DYNAMIC_STEPS = needsPassword
        ? [{ id: 0, title: 'Set Password', icon: Lock }, ...STEPS]
        : STEPS;

    const [step, setStep] = useState(needsPassword ? 0 : 1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
        bio: '',
        location: '',
        occupation: '',
        company: '',
        interests: [],
        profilePicture: null,
        profilePicturePreview: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                profilePicture: file,
                profilePicturePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleNext = () => {
        const maxStep = DYNAMIC_STEPS[DYNAMIC_STEPS.length - 1].id;
        if (step < maxStep) setStep(step + 1);
    };

    const handlePrev = () => {
        const minStep = DYNAMIC_STEPS[0].id;
        if (step > minStep) setStep(step - 1);
    };

    const handleSkip = () => {
        navigate(ROUTES.DASHBOARD);
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Prepare profile data
            const profileData = {
                bio: formData.bio,
                location: formData.location,
                occupation: formData.occupation,
                interests: formData.interests,
                avatar: formData.profilePicture, // The actual file
            };

            // If a password was set during setup (social login users), include it
            if (formData.password) {
                profileData.password = formData.password;
            }

            // Call API to save profile
            const response = await authService.setupProfile(profileData);

            // Update stored user data with profile_completed flag
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.profile_completed = true;
            storedUser.avatar_url = response.profile?.avatar_url;
            localStorage.setItem('user', JSON.stringify(storedUser));

            // Redirect to dashboard
            navigate(ROUTES.DASHBOARD, {
                state: { message: 'Profile setup complete! Welcome to Qomrade.' },
                replace: true
            });
        } catch (error) {
            console.error('Profile setup error:', error);
            alert(error.response?.data?.detail || 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0: // Password step (social login)
                return formData.password.length >= 8 && formData.password === formData.confirmPassword;
            case 1:
                return formData.bio.length >= 10;
            case 2:
                return formData.location.length >= 2;
            case 3:
                return formData.interests.length >= 1;
            case 4:
                return true; // Photo is optional
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Header */}
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
                    <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-between">
                        {DYNAMIC_STEPS.map((s, index) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step > s.id
                                            ? 'bg-green-400'
                                            : step === s.id
                                                ? 'bg-white text-primary-600'
                                                : 'bg-white/30'
                                            }`}
                                    >
                                        {step > s.id ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <s.icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="text-xs mt-1 opacity-80">{s.title}</span>
                                </div>
                                {index < DYNAMIC_STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-green-400' : 'bg-white/30'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6">
                    {/* User Type Badge */}
                    <div className="flex justify-center mb-6">
                        <span className="px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                            {userType.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Step 0: Set Password (social login users only) */}
                    {step === 0 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900">Set your password</h3>
                            <p className="text-sm text-gray-600">Create a password so you can also sign in with your email.</p>
                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="At least 8 characters"
                                required
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                required
                            />
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-red-500">Passwords do not match</p>
                            )}
                            {formData.password && formData.password.length < 8 && (
                                <p className="text-xs text-amber-500">Password must be at least 8 characters</p>
                            )}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900">Tell us about yourself</h3>
                            <p className="text-sm text-gray-600">A short bio helps others get to know you.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="I'm a passionate learner who loves..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    rows={4}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.bio.length}/200 characters (min 10)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Work */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900">Where are you based?</h3>
                            <p className="text-sm text-gray-600">This helps us connect you with nearby opportunities.</p>
                            <Input
                                label="Location"
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Nairobi, Kenya"
                                required
                            />
                            <Input
                                label="Occupation / Role"
                                type="text"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                placeholder="Software Developer"
                            />
                            <Input
                                label="Company / Institution"
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="University of Nairobi"
                            />
                        </div>
                    )}

                    {/* Step 3: Interests */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900">What interests you?</h3>
                            <p className="text-sm text-gray-600">Select at least one topic you're passionate about.</p>
                            <div className="flex flex-wrap gap-2">
                                {INTEREST_OPTIONS.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => handleInterestToggle(interest)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.interests.includes(interest)
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">
                                Selected: {formData.interests.length} topic(s)
                            </p>
                        </div>
                    )}

                    {/* Step 4: Photo */}
                    {step === 4 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900">Add a profile photo</h3>
                            <p className="text-sm text-gray-600">A photo helps build trust in the community.</p>

                            <div className="flex justify-center">
                                <label className="cursor-pointer">
                                    <div className={`w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-colors ${formData.profilePicturePreview ? 'border-primary-600' : 'border-gray-300 hover:border-primary-400'
                                        }`}>
                                        {formData.profilePicturePreview ? (
                                            <img
                                                src={formData.profilePicturePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                                                <span className="text-xs text-gray-500 mt-2 block">Upload Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-gray-400 text-center">
                                PNG, JPG up to 5MB. This step is optional.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="flex gap-3">
                        {step > (needsPassword ? 0 : 1) && (
                            <Button variant="outline" onClick={handlePrev} className="flex-1">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="flex-1"
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleComplete}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? 'Saving...' : 'Complete Setup'}
                                <Check className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>

                    <button
                        onClick={handleSkip}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        You can always complete your profile later in Settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
