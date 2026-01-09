import React, { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles, Star, ArrowRight, Check } from 'lucide-react';
import paymentService, { TIER_LIMITS } from '../../services/payment.service';
import TierUpgradeModal from '../../components/payment/TierUpgradeModal';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const TierPlans = () => {
    const [currentTier, setCurrentTier] = useState('free');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await paymentService.getMyProfile();
            setProfile(response.data);
            setCurrentTier(response.data?.tier || 'free');
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const tiers = [
        {
            id: 'free',
            name: 'Free',
            description: 'Perfect for getting started',
            icon: Star,
            color: 'gray',
            gradient: 'from-gray-400 to-gray-500',
            bgGradient: 'from-gray-50 to-gray-100',
            price: 0,
            priceAnnual: 0,
        },
        {
            id: 'standard',
            name: 'Standard',
            description: 'For growing teams',
            icon: Zap,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100',
            price: 9.99,
            priceAnnual: 99.99,
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'For power users',
            icon: Sparkles,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            bgGradient: 'from-purple-50 to-purple-100',
            price: 19.99,
            priceAnnual: 199.99,
            popular: true,
        },
        {
            id: 'gold',
            name: 'Gold',
            description: 'Enterprise unlimited',
            icon: Crown,
            color: 'amber',
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-100',
            price: 49.99,
            priceAnnual: 499.99,
        },
    ];

    const handleUpgradeSuccess = (newTier) => {
        setCurrentTier(newTier);
        loadProfile();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
                <p className="text-lg text-gray-600">
                    Unlock premium features and grow without limits. Upgrade anytime.
                </p>
            </div>

            {/* Current Plan Banner */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                <CardBody className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-green-100 text-sm mb-1">Current Plan</p>
                        <h2 className="text-2xl font-bold capitalize">{currentTier}</h2>
                    </div>
                    {currentTier !== 'gold' && (
                        <Button
                            onClick={() => setShowUpgradeModal(true)}
                            className="bg-white text-green-600 hover:bg-green-50"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Upgrade Now
                        </Button>
                    )}
                </CardBody>
            </Card>

            {/* Tier Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isCurrent = tier.id === currentTier;
                    const limits = TIER_LIMITS[tier.id];

                    return (
                        <Card
                            key={tier.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isCurrent ? 'ring-2 ring-green-500' : ''
                                } ${tier.popular ? 'ring-2 ring-purple-500' : ''}`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    POPULAR
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                    CURRENT
                                </div>
                            )}

                            <CardBody className={`p-6 bg-gradient-to-br ${tier.bgGradient}`}>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                                <p className="text-gray-500 text-sm mb-4">{tier.description}</p>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                                    <span className="text-gray-500">/month</span>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {limits?.features?.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {!isCurrent && tier.id !== 'free' && (
                                    <Button
                                        variant="primary"
                                        className={`w-full bg-gradient-to-r ${tier.gradient} border-0`}
                                        onClick={() => setShowUpgradeModal(true)}
                                    >
                                        Upgrade to {tier.name}
                                    </Button>
                                )}
                                {isCurrent && (
                                    <div className="w-full py-3 text-center text-green-600 font-semibold bg-green-100 rounded-lg">
                                        ✓ Your Current Plan
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Features Comparison Table */}
            <Card>
                <CardBody className="p-8">
                    <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-4 px-6 text-left text-gray-500 font-medium">Feature</th>
                                    {tiers.map(tier => (
                                        <th key={tier.id} className="py-4 px-6 text-center">
                                            <span className={`font-bold ${tier.id === currentTier ? 'text-green-600' : 'text-gray-900'}`}>
                                                {tier.name}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 px-6 text-gray-700">Group Members</td>
                                    {tiers.map(tier => (
                                        <td key={tier.id} className="py-4 px-6 text-center font-medium">
                                            {TIER_LIMITS[tier.id]?.maxGroupMembers === Infinity ? '∞' : TIER_LIMITS[tier.id]?.maxGroupMembers}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 px-6 text-gray-700">Monthly Purchases</td>
                                    {tiers.map(tier => (
                                        <td key={tier.id} className="py-4 px-6 text-center font-medium">
                                            {TIER_LIMITS[tier.id]?.monthlyPurchases === Infinity ? '∞' : TIER_LIMITS[tier.id]?.monthlyPurchases}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 px-6 text-gray-700">Offline Notifications</td>
                                    {tiers.map(tier => (
                                        <td key={tier.id} className="py-4 px-6 text-center font-medium">
                                            {TIER_LIMITS[tier.id]?.offlineNotifications === Infinity ? '∞' : TIER_LIMITS[tier.id]?.offlineNotifications}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Upgrade Modal */}
            <TierUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentTier={currentTier}
                onUpgradeSuccess={handleUpgradeSuccess}
            />
        </div>
    );
};

export default TierPlans;
