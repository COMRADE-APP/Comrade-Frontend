/**
 * StripeProvider — App-level wrapper that loads Stripe.js
 * and provides Elements context to payment components.
 * 
 * Fetches the publishable key from the backend gateway-config endpoint
 * so it's never hardcoded in the frontend bundle.
 */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import paymentProcessingService from '../services/paymentProcessing.service';

const StripeContext = createContext({
    stripePromise: null,
    gatewayConfig: null,
    loading: true,
});

export const useStripeContext = () => useContext(StripeContext);

const StripeProvider = ({ children }) => {
    const [stripePromise, setStripePromise] = useState(null);
    const [gatewayConfig, setGatewayConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const config = await paymentProcessingService.getGatewayConfig();
                setGatewayConfig(config);

                // Initialize Stripe if available
                const stripeConfig = config?.gateways?.stripe;
                if (stripeConfig?.available && stripeConfig?.public_key) {
                    const promise = loadStripe(stripeConfig.public_key);
                    setStripePromise(promise);
                }
            } catch (err) {
                console.warn('Failed to load gateway config:', err);
                // Fallback: try loading from env
                const envKey = import.meta.env?.VITE_STRIPE_PUBLIC_KEY;
                if (envKey) {
                    setStripePromise(loadStripe(envKey));
                }
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const elementsOptions = {
        appearance: {
            theme: 'night',
            variables: {
                colorPrimary: '#6366f1',
                colorBackground: '#1a1a2e',
                colorText: '#e2e8f0',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '12px',
                spacingUnit: '4px',
            },
            rules: {
                '.Input': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px 16px',
                },
                '.Input:focus': {
                    border: '1px solid #6366f1',
                    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
                },
                '.Label': {
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: '500',
                },
            },
        },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <StripeContext.Provider value={{ stripePromise, gatewayConfig, loading }}>
            {stripePromise ? (
                <Elements stripe={stripePromise} options={elementsOptions}>
                    {children}
                </Elements>
            ) : (
                children
            )}
        </StripeContext.Provider>
    );
};

export default StripeProvider;
