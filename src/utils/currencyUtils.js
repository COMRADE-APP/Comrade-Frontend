/**
 * Detects the best currency and payment gateway for a user based on their
 * browser timezone. Uses Intl.DateTimeFormat timezone mapping.
 * 
 * Default fallback is 'USD' / 'stripe'.
 */

export const detectLocalCurrency = () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const tzToCurrency = {
            'Africa/Nairobi': 'KES',
            'Africa/Lagos': 'NGN',
            'Africa/Accra': 'GHS',
            'Africa/Johannesburg': 'ZAR',
            'Africa/Kampala': 'UGX',
            'Africa/Dar_es_Salaam': 'TZS',
            'Africa/Kigali': 'RWF',
            'Africa/Lusaka': 'ZMW',
            'Europe/London': 'GBP',
            'Europe/Paris': 'EUR',
            'Europe/Berlin': 'EUR',
            'America/New_York': 'USD',
            'America/Los_Angeles': 'USD',
            'America/Chicago': 'USD'
        };

        return tzToCurrency[timeZone] || 'USD';
    } catch (error) {
        console.warn('Could not detect timezone, defaulting to USD', error);
        return 'USD';
    }
};

/**
 * Detects the preferred payment gateway based on the user's timezone.
 * Returns the gateway ID key (paystack, stripe, flutterwave, mpesa, etc.).
 */
export const detectPreferredGateway = () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const tzToGateway = {
            // Kenya → Paystack (M-Pesa, cards, bank) as primary
            'Africa/Nairobi': 'paystack',
            // Nigeria, Ghana, South Africa → Paystack
            'Africa/Lagos': 'paystack',
            'Africa/Accra': 'paystack',
            'Africa/Johannesburg': 'paystack',
            // East Africa → Paystack
            'Africa/Kampala': 'paystack',
            'Africa/Dar_es_Salaam': 'paystack',
            'Africa/Kigali': 'paystack',
            'Africa/Lusaka': 'paystack',
            // Europe, North America → Stripe
            'Europe/London': 'stripe',
            'Europe/Paris': 'stripe',
            'Europe/Berlin': 'stripe',
            'America/New_York': 'stripe',
            'America/Los_Angeles': 'stripe',
            'America/Chicago': 'stripe',
        };

        return tzToGateway[timeZone] || 'stripe';
    } catch (error) {
        return 'stripe';
    }
};

/**
 * Detect the country code (ISO alpha-2) from the timezone.
 * Used to pass to the backend GatewayConfig endpoint.
 */
export const detectCountryCode = () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const tzToCountry = {
            'Africa/Nairobi': 'KE',
            'Africa/Lagos': 'NG',
            'Africa/Accra': 'GH',
            'Africa/Johannesburg': 'ZA',
            'Africa/Kampala': 'UG',
            'Africa/Dar_es_Salaam': 'TZ',
            'Africa/Kigali': 'RW',
            'Africa/Lusaka': 'ZM',
            'Europe/London': 'GB',
            'Europe/Paris': 'FR',
            'Europe/Berlin': 'DE',
            'America/New_York': 'US',
            'America/Los_Angeles': 'US',
            'America/Chicago': 'US',
        };

        return tzToCountry[timeZone] || null;
    } catch {
        return null;
    }
};

/**
 * Helper to get either an explicit currency or detect local currency
 */
export const detectCurrency = (explicitCurrency) => {
    if (explicitCurrency && explicitCurrency !== 'USD') {
        return explicitCurrency;
    }
    return detectLocalCurrency();
};

/**
 * Validates if the given currency is supported by Paystack.
 * Paystack supports: NGN, GHS, ZAR, KES, USD, and others.
 */
export const isPaystackSupportedCurrency = (currency) => {
    const supported = ['NGN', 'GHS', 'KES', 'ZAR', 'USD', 'GBP', 'EUR'];
    return supported.includes(currency?.toUpperCase());
};

/**
 * Detects the best payment method key for the given gateway.
 * e.g., 'paystack' → 'card'; 'mpesa' → 'mpesa'; 'stripe' → 'card'
 */
export const getDefaultMethodForGateway = (gateway) => {
    const map = {
        'paystack': 'paystack',
        'stripe': 'card',
        'mpesa': 'mpesa',
        'flutterwave': 'flutterwave',
        'pesapal': 'pesapal',
        'paypal': 'paypal',
    };
    return map[gateway] || 'card';
};
