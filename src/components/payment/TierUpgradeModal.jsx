import React, { useState } from 'react';
import { X, Check, Zap, Crown, Star, Sparkles } from 'lucide-react';
import paymentsService, { TIER_LIMITS } from '../../services/payments.service';
import Button from '../common/Button';

const TierUpgradeModal = ({ isOpen, onClose, currentTier = 'free', onUpgradeSuccess }) => {
    const [selectedTier, setSelectedTier] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const tiers = [
        {
            id: 'free',
            name: 'Free',
            icon: Star,
            color: 'gray',
            gradient: 'from-gray-400 to-gray-500',
            price: 0,
            priceAnnual: 0,
        },
        {
            id: 'standard',
            name: 'Standard',
            icon: Zap,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            price: 9.99,
            priceAnnual: 99.99,
            popular: false,
        },
        {
            id: 'premium',
            name: 'Premium',
            icon: Sparkles,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            price: 19.99,
            priceAnnual: 199.99,
            popular: true,
        },
        {
            id: 'gold',
            name: 'Gold',
            icon: Crown,
            color: 'amber',
            gradient: 'from-amber-500 to-orange-500',
            price: 49.99,
            priceAnnual: 499.99,
        },
    ];

    const handleUpgrade = async () => {
        if (!selectedTier || selectedTier === currentTier) return;

        setLoading(true);
        setError('');

        try {
            await paymentService.upgradeTier(selectedTier, billingCycle);
            onUpgradeSuccess?.(selectedTier);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upgrade. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tierOrder = ['free', 'standard', 'premium', 'gold'];
    const currentTierIndex = tierOrder.indexOf(currentTier);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white rounded-t-3xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">Upgrade Your Plan</h2>
                        <p className="text-purple-100">Unlock more features and grow without limits</p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center mt-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex gap-1">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                                    ? 'bg-white text-purple-600 shadow-lg'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('annual')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'annual'
                                    ? 'bg-white text-purple-600 shadow-lg'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                Annual
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Save 17%</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tier Cards */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tiers.map((tier, index) => {
                            const Icon = tier.icon;
                            const isCurrentTier = tier.id === currentTier;
                            const isDowngrade = index < currentTierIndex;
                            const isSelected = selectedTier === tier.id;
                            const limits = TIER_LIMITS[tier.id];

                            return (
                                <div
                                    key={tier.id}
                                    onClick={() => !isCurrentTier && !isDowngrade && setSelectedTier(tier.id)}
                                    className={`relative rounded-2xl border-2 p-6 transition-all cursor-pointer ${isSelected
                                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                                        : isCurrentTier
                                            ? 'border-green-500 bg-green-50'
                                            : isDowngrade
                                                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                                        }`}
                                >
                                    {tier.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                MOST POPULAR
                                            </span>
                                        </div>
                                    )}

                                    {isCurrentTier && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                CURRENT PLAN
                                            </span>
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>

                                    <div className="mb-4">
                                        <span className="text-3xl font-bold text-gray-900">
                                            ${billingCycle === 'monthly' ? tier.price : tier.priceAnnual}
                                        </span>
                                        <span className="text-gray-500">
                                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    </div>

                                    <ul className="space-y-2 text-sm">
                                        {limits?.features?.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-purple-500' : 'text-green-500'}`} />
                                                <span className="text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Button */}
                    <div className="mt-8 flex justify-center">
                        <Button
                            variant="primary"
                            size="lg"
                            disabled={!selectedTier || selectedTier === currentTier || loading}
                            onClick={handleUpgrade}
                            className="px-12 py-4 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500"
                        >
                            {loading ? 'Processing...' : selectedTier ? `Upgrade to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}` : 'Select a Plan'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TierUpgradeModal;
