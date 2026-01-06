import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionPlans.css';

const API_BASE_URL = 'http://localhost:8000/api/payments';

const SubscriptionPlans = () => {
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const plans = [
        {
            type: 'BASIC',
            name: 'Basic',
            price: 0,
            features: [
                'Up to 3 payment groups',
                'Basic transaction history',
                '10 transactions per month',
                'Email support'
            ]
        },
        {
            type: 'PREMIUM',
            name: 'Premium',
            price: 9.99,
            features: [
                'Unlimited payment groups',
                'Advanced transaction history',
                'Unlimited transactions',
                'Priority support',
                'Standing orders',
                'Group targets (piggy banks)'
            ],
            popular: true
        },
        {
            type: 'ENTERPRISE',
            name: 'Enterprise',
            price: 29.99,
            features: [
                'Everything in Premium',
                'Dedicated account manager',
                'Custom integrations',
                'API access',
                'Advanced analytics',
                'White-label option'
            ]
        }
    ];

    useEffect(() => {
        fetchCurrentSubscription();
    }, []);

    const fetchCurrentSubscription = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/subscriptions/my_subscription/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentSubscription(response.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planType) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(`${API_BASE_URL}/subscriptions/`, {
                subscription_type: planType,
                status: 'ACTIVE',
                auto_renew: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentSubscription(response.data);
            alert('Subscription updated successfully!');
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            alert('Failed to upgrade subscription');
        }
    };

    const PlanCard = ({ plan }) => {
        const isCurrent = currentSubscription?.subscription_type === plan.type;

        return (
            <div className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                {isCurrent && <div className="current-badge">Current Plan</div>}

                <h2>{plan.name}</h2>
                <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/month</span>
                </div>

                <ul className="features">
                    {plan.features.map((feature, idx) => (
                        <li key={idx}>
                            <span className="check">✓</span>
                            {feature}
                        </li>
                    ))}
                </ul>

                <button
                    className="btn-subscribe"
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan.type)}
                >
                    {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
                </button>
            </div>
        );
    };

    if (loading) {
        return <div className="loading">Loading subscription plans...</div>;
    }

    return (
        <div className="subscription-plans">
            <div className="plans-header">
                <h1>Choose Your Plan</h1>
                <p>Select the perfect plan for your payment needs</p>
            </div>

            <div className="plans-grid">
                {plans.map(plan => (
                    <PlanCard key={plan.type} plan={plan} />
                ))}
            </div>

            {currentSubscription && (
                <div className="current-subscription-info">
                    <h3>Your Current Subscription</h3>
                    <p>Plan: <strong>{currentSubscription.subscription_type}</strong></p>
                    <p>Status: <strong>{currentSubscription.status}</strong></p>
                    <p>Auto-renew: <strong>{currentSubscription.auto_renew ? 'Yes' : 'No'}</strong></p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlans;
