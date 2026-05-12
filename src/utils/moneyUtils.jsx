import React from 'react';
import {
    formatCurrency as formatCurrencyUtil,
    getCurrencySymbol,
    getUserCurrency,
    getPlatformCurrency,
} from '../utils/currency';

/**
 * Format a monetary amount with the user's preferred currency.
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Optional: force specific currency
 * @param {object} options - Additional formatting options
 * @returns {string} Formatted currency string
 */
export const formatMoney = (amount, currencyCode = null, options = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return getCurrencySymbol(currencyCode) + '0.00';
    }
    return formatCurrencyUtil(amount, currencyCode || getUserCurrency(), options);
};

/**
 * Format amount with just the symbol and number (no locale)
 * @param {number} amount
 * @param {string} currencyCode
 * @returns {string}
 */
export const formatMoneySimple = (amount, currencyCode = null) => {
    const currency = currencyCode || getUserCurrency();
    const symbol = getCurrencySymbol(currency);
    const num = parseFloat(amount || 0);

    if (currency === 'USD') {
        return `${symbol}${num.toFixed(2)}`;
    }

    const info = {
        KES: { locale: 'en-KE' },
        NGN: { locale: 'en-NG' },
        GHS: { locale: 'en-GH' },
        ZAR: { locale: 'en-ZA' },
        GBP: { locale: 'en-GB' },
        EUR: { locale: 'de-DE' },
    };

    const locale = info[currency]?.locale || 'en-US';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2,
        }).format(num);
    } catch {
        return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
};

/**
 * Get the appropriate currency for display based on user's location.
 * @returns {string} Currency code
 */
export const getDisplayCurrency = () => {
    return getUserCurrency();
};

/**
 * Component to display a monetary value with proper currency formatting.
 * Automatically uses user's preferred currency.
 */
export const MoneyDisplay = ({ amount, currency, className = '', showCode = false }) => {
    const formatted = formatMoney(amount, currency);

    return (
        <span className={className}>
            {formatted}
            {showCode && ` (${getDisplayCurrency()})`}
        </span>
    );
};

/**
 * Parse amount to number safely
 * @param {any} value
 * @returns {number}
 */
export const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get currency suffix text (e.g., "KES" or "USD")
 * @param {string} currencyCode
 * @returns {string}
 */
export const getCurrencyLabel = (currencyCode = null) => {
    return currencyCode || getUserCurrency();
};

/**
 * Display currency picker options
 * @returns {Array}
 */
export const getCurrencyOptions = () => [
    { value: 'USD', label: 'USD - US Dollar ($)' },
    { value: 'EUR', label: 'EUR - Euro (€)' },
    { value: 'GBP', label: 'GBP - British Pound (£)' },
    { value: 'KES', label: 'KES - Kenyan Shilling (KSh)' },
    { value: 'NGN', label: 'NGN - Nigerian Naira (₦)' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi (GH₵)' },
    { value: 'ZAR', label: 'ZAR - South African Rand (R)' },
    { value: 'UGX', label: 'UGX - Ugandan Shilling (USh)' },
    { value: 'TZS', label: 'TZS - Tanzanian Shilling (TSh)' },
    { value: 'INR', label: 'INR - Indian Rupee (₹)' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
    { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
    { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
    { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
    { value: 'CHF', label: 'CHF - Swiss Franc (CHF)' },
    { value: 'BRL', label: 'BRL - Brazilian Real (R$)' },
    { value: 'AED', label: 'AED - UAE Dirham (AED)' },
    { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
];

export default {
    formatMoney,
    formatMoneySimple,
    getDisplayCurrency,
    MoneyDisplay,
    parseAmount,
    getCurrencyLabel,
    getCurrencyOptions,
};
