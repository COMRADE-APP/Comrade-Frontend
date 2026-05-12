/**
 * Currency utility functions for the frontend.
 * Uses platform currency (USD) by default with automatic user currency detection.
 */

import api from '../services/api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const CURRENCY_INFO = {
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
    NGN: { symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
    ZAR: { symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
    UGX: { symbol: 'USh', name: 'Ugandan Shilling', locale: 'en-UG' },
    TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', locale: 'sw-TZ' },
    RWF: { symbol: 'FRw', name: 'Rwandan Franc', locale: 'en-RW' },
    ETB: { symbol: 'Br', name: 'Ethiopian Birr', locale: 'am-ET' },
    EGP: { symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
    MAD: { symbol: 'MAD', name: 'Moroccan Dirham', locale: 'ar-MA' },
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    CNY: { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    KRW: { symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
    BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
    MXN: { symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
    SEK: { symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
    NOK: { symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
    DKK: { symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
    CHF: { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    PLN: { symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
    RUB: { symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
    AED: { symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
    SAR: { symbol: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
    PHP: { symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
    THB: { symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
    PKR: { symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK' },
};

let _platformCurrency = 'USD';
let _userCurrency = 'USD';
let _exchangeRates = {};
let _currenciesCache = null;

export const getCurrencySymbol = (code = 'USD') => {
    return CURRENCY_INFO[code]?.symbol || code;
};

export const getCurrencyName = (code = 'USD') => {
    return CURRENCY_INFO[code]?.name || code;
};

export const formatCurrency = (amount, currencyCode = null, options = {}) => {
    const targetCurrency = currencyCode || _userCurrency;
    const info = CURRENCY_INFO[targetCurrency];

    if (!info) {
        return `${targetCurrency} ${Number(amount).toFixed(2)}`;
    }

    try {
        const formatted = new Intl.NumberFormat(info.locale, {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: ['JPY', 'KRW'].includes(targetCurrency) ? 0 : 2,
            maximumFractionDigits: ['JPY', 'KRW'].includes(targetCurrency) ? 0 : 2,
        }).format(amount);

        return formatted;
    } catch {
        const fixed = Number(amount).toFixed(2);
        return `${info.symbol}${fixed}`;
    }
};

export const getSupportedCurrencies = () => {
    return Object.entries(CURRENCY_INFO).map(([code, info]) => ({
        code,
        symbol: info.symbol,
        name: info.name,
    }));
};

export const getBrowserLocale = () => {
    return navigator.language || navigator.userLanguage || 'en-US';
};

export const initializeCurrency = async () => {
    try {
        const [supportedData, detectData, ratesData] = await Promise.all([
            api.get(API_ENDPOINTS.SUPPORTED_CURRENCIES).catch(() => null),
            api.get(API_ENDPOINTS.DETECT_CURRENCY).catch(() => null),
            api.get(API_ENDPOINTS.ALL_RATES, { params: { base: 'USD' } }).catch(() => null),
        ]);

        if (supportedData?.platform_currency) {
            _platformCurrency = supportedData.platform_currency;
        }

        if (supportedData?.currency_codes) {
            _currenciesCache = supportedData.currency_codes;
        }

        if (detectData?.detected_currency) {
            _userCurrency = detectData.detected_currency;
        }

        if (ratesData?.rates) {
            _exchangeRates = ratesData.rates;
        }

        return {
            platformCurrency: _platformCurrency,
            userCurrency: _userCurrency,
            exchangeRates: _exchangeRates,
        };
    } catch (error) {
        console.error('Failed to initialize currency:', error);
        return {
            platformCurrency: 'USD',
            userCurrency: 'USD',
            exchangeRates: {},
        };
    }
};

export const setUserCurrency = (currency) => {
    _userCurrency = currency;
};

export const getUserCurrency = () => _userCurrency;

export const getPlatformCurrency = () => _platformCurrency;

export const getExchangeRate = (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1;
    if (fromCurrency === 'USD' && _exchangeRates[toCurrency]) {
        return _exchangeRates[toCurrency];
    }
    if (toCurrency === 'USD' && _exchangeRates[fromCurrency]) {
        return 1 / _exchangeRates[fromCurrency];
    }
    const fromRate = _exchangeRates[fromCurrency] || 1;
    const toRate = _exchangeRates[toCurrency] || 1;
    return toRate / fromRate;
};

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return {
        original: amount,
        converted: amount * rate,
        rate,
        from: fromCurrency,
        to: toCurrency,
    };
};

export const formatAmount = (amount, currencyCode = null) => {
    return formatCurrency(amount, currencyCode || _userCurrency);
};

export default {
    getCurrencySymbol,
    getCurrencyName,
    formatCurrency,
    getSupportedCurrencies,
    getBrowserLocale,
    initializeCurrency,
    setUserCurrency,
    getUserCurrency,
    getPlatformCurrency,
    getExchangeRate,
    convertCurrency,
    formatAmount,
    CURRENCY_INFO,
};
