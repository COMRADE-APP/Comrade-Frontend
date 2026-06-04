/**
 * Detects the best currency to use for a user based on their browser location.
 * Uses the Intl.DateTimeFormat timezone mapping.
 * 
 * Default fallback is 'USD'.
 */

export const detectLocalCurrency = () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Comprehensive mapping for African & global zones prioritizing Flutterwave support
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
 * Helper to get either an explicit currency or detect local currency
 */
export const detectCurrency = (explicitCurrency) => {
    // If it's explicitly KES for M-Pesa, use it. Otherwise use the local currency.
    if (explicitCurrency && explicitCurrency !== 'USD') {
        return explicitCurrency;
    }
    return detectLocalCurrency();
};

/**
 * Validates if the given currency is supported by Flutterwave natively
 */
export const isFlutterwaveSupportedCurrency = (currency) => {
    const supported = ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF', 'ZMW', 'USD', 'GBP', 'EUR'];
    return supported.includes(currency?.toUpperCase());
};
