/**
 * Currency utility functions for the frontend.
 * Maps currency codes to symbols and provides formatting helpers.
 */

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

/**
 * Get currency symbol for a given currency code.
 * @param {string} code - ISO 4217 currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (code = 'USD') => {
    return CURRENCY_INFO[code]?.symbol || code;
};

/**
 * Get currency display name.
 * @param {string} code - ISO 4217 currency code
 * @returns {string} Currency name
 */
export const getCurrencyName = (code = 'USD') => {
    return CURRENCY_INFO[code]?.name || code;
};

/**
 * Format an amount with the correct currency symbol.
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO 4217 currency code
 * @param {object} options - Additional options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', options = {}) => {
    const { showCode = false, decimals } = options;
    const info = CURRENCY_INFO[currencyCode];

    if (!info) {
        return `${currencyCode} ${Number(amount).toFixed(2)}`;
    }

    // Use Intl.NumberFormat for proper locale-aware formatting
    try {
        const formatted = new Intl.NumberFormat(info.locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals ?? (currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2),
            maximumFractionDigits: decimals ?? (currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2),
        }).format(amount);

        return showCode ? `${formatted} ${currencyCode}` : formatted;
    } catch {
        // Fallback if Intl doesn't support this currency
        const fixed = Number(amount).toFixed(decimals ?? 2);
        return `${info.symbol}${fixed}`;
    }
};

/**
 * Get all supported currencies as an array for dropdowns.
 * @returns {Array<{code: string, symbol: string, name: string}>}
 */
export const getSupportedCurrencies = () => {
    return Object.entries(CURRENCY_INFO).map(([code, info]) => ({
        code,
        symbol: info.symbol,
        name: info.name,
    }));
};

/**
 * Detect the browser's locale.
 * @returns {string} Browser locale string (e.g. 'en-US')
 */
export const getBrowserLocale = () => {
    return navigator.language || navigator.userLanguage || 'en-US';
};

export default CURRENCY_INFO;
