import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';
import Button from '../../components/common/Button';
import { 
    Globe, 
    Users, 
    ShoppingCart, 
    BarChart2, 
    CreditCard 
} from 'lucide-react';

const ONBOARDING_STEPS = [
    {
        title: "Welcome to Comrade",
        description: "The all-in-one platform for your community, business, and financial needs. Let's take a quick tour of what you can do.",
        icon: Globe,
        color: "text-blue-500",
        bgColor: "bg-blue-100"
    },
    {
        title: "Rooms & Collaboration",
        description: "Create dedicated spaces for your teams, classes, or social groups. Share resources, manage tasks, and communicate effortlessly.",
        icon: Users,
        color: "text-indigo-500",
        bgColor: "bg-indigo-100"
    },
    {
        title: "Shop & Services",
        description: "Browse the marketplace for products, book specialized services, and manage your own establishment's offerings all in one place.",
        icon: ShoppingCart,
        color: "text-emerald-500",
        bgColor: "bg-emerald-100"
    },
    {
        title: "Funding & Investments",
        description: "Discover opportunities, invest in growing businesses, support donation campaigns, and track your ventures.",
        icon: BarChart2,
        color: "text-amber-500",
        bgColor: "bg-amber-100"
    },
    {
        title: "Payments & Groups",
        description: "Handle individual and group payments seamlessly. Create payment groups, manage kitties, and track multi-user transactions.",
        icon: CreditCard,
        color: "text-primary-600",
        bgColor: "bg-primary-200"
    }
];

const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);
    const navigate = useNavigate();
    const { updateUser } = useAuth(); // ensure updateUser is available in AuthContext

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleSkip = () => {
        finishOnboarding();
    };

    const finishOnboarding = async () => {
        setIsFinishing(true);
        try {
            // Update profile on backend
            await authService.updateProfile({ onboarding_completed: true });
            
            // Update local context and storage
            updateUser({ onboarding_completed: true });
            
            // Navigate to dashboard
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            // Even if backend fails, let them proceed (or show error)
            updateUser({ onboarding_completed: true });
            navigate(ROUTES.DASHBOARD);
        }
    };

    const step = ONBOARDING_STEPS[currentStep];
    const Icon = step.icon;

    return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl bg-elevated rounded-2xl shadow-xl overflow-hidden flex flex-col">
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-1 flex">
                    {ONBOARDING_STEPS.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-full flex-1 transition-all duration-300 ${idx <= currentStep ? 'bg-primary-600' : 'bg-transparent'}`}
                        />
                    ))}
                </div>

                <div className="p-8 sm:p-12 flex-1 flex flex-col items-center text-center">
                    
                    {/* Icon with smooth transition */}
                    <div className={`w-24 h-24 rounded-full ${step.bgColor} text-white flex items-center justify-center mb-8 transform transition-transform duration-500 hover:scale-105`}>
                        <Icon className={`w-12 h-12 ${step.color}`} />
                    </div>

                    <h2 className="text-3xl font-bold text-primary mb-4 transition-opacity duration-300">
                        {step.title}
                    </h2>
                    
                    <p className="text-secondary text-lg mb-8 max-w-lg transition-opacity duration-300">
                        {step.description}
                    </p>

                    <div className="mt-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button 
                            onClick={handleSkip}
                            className="text-secondary hover:text-primary transition-colors focus:outline-none font-medium px-4 py-2"
                            disabled={isFinishing}
                        >
                            Skip Tour
                        </button>
                        
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    disabled={isFinishing}
                                >
                                    Back
                                </Button>
                            )}
                            <Button 
                                variant="primary" 
                                onClick={handleNext}
                                disabled={isFinishing}
                                className="min-w-[120px]"
                            >
                                {isFinishing ? 'Finishing...' : (currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Dots indicator */}
            <div className="flex gap-2 mt-8">
                {ONBOARDING_STEPS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentStep ? 'bg-primary-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to step ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Onboarding;
