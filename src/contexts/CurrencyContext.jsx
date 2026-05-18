import React, { createContext, useContext, useState, useEffect } from 'react';
import paymentsService from '../services/payments.service';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        return {
            platformCurrency: 'USD',
            userCurrency: 'USD',
            displayAmount: (amount) => `$${parseFloat(amount).toFixed(2)}`,
            formatAmount: (amount, currency = 'USD') => `$${parseFloat(amount).toFixed(2)}`,
            getCurrencySymbol: (code) => '$',
            isLoading: false,
        };
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [platformCurrency, setPlatformCurrency] = useState('USD');
    const [userCurrency, setUserCurrency] = useState('USD');
    const [currencies, setCurrencies] = useState({});
    const [exchangeRates, setExchangeRates] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeCurrency();
    }, []);

    const initializeCurrency = async () => {
        try {
            setIsLoading(true);
            const [supportedData, detectData, ratesData] = await Promise.all([
                paymentsService.getSupportedCurrencies().catch(() => null),
                paymentsService.detectCurrency().catch(() => null),
                paymentsService.getAllRates('USD').catch(() => null),
            ]);

            if (supportedData) {
                setPlatformCurrency(supportedData.platform_currency || 'USD');
                setCurrencies(supportedData.currencies || {});
            }

            if (detectData) {
                setUserCurrency(detectData.detected_currency || 'USD');
            }

            if (ratesData && ratesData.rates) {
                setExchangeRates(ratesData.rates);
            }
        } catch (error) {
            console.error('Failed to initialize currency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const convertToUserCurrency = (amount, fromCurrency = 'USD') => {
        if (!fromCurrency || fromCurrency === userCurrency) {
            return parseFloat(amount);
        }
        const rate = exchangeRates[userCurrency] || 1;
        return parseFloat(amount) * rate;
    };

    const convertFromPlatform = (amount) => {
        return convertToUserCurrency(amount, platformCurrency);
    };

    const formatAmount = (amount, currency = null) => {
        const targetCurrency = currency || userCurrency;
        const info = getCurrencyInfo(targetCurrency);
        const symbol = info?.symbol || targetCurrency;

        if (targetCurrency === 'USD' || !info) {
            return `${symbol}${parseFloat(amount).toFixed(2)}`;
        }

        const converted = targetCurrency !== platformCurrency
            ? convertToUserCurrency(amount, platformCurrency)
            : parseFloat(amount);

        const locale = info?.locale || 'en-US';
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: targetCurrency,
                minimumFractionDigits: ['JPY', 'KRW'].includes(targetCurrency) ? 0 : 2,
            }).format(converted);
        } catch {
            return `${symbol}${converted.toFixed(2)}`;
        }
    };

    const displayAmount = (amount, currency = null) => {
        return formatAmount(amount, currency);
    };

    const getCurrencySymbol = (code) => {
        const info = getCurrencyInfo(code);
        return info?.symbol || code || '$';
    };

    const getCurrencyInfo = (code) => {
        if (currencies && currencies[code]) {
            return currencies[code];
        }
        return { symbol: code, name: code };
    };

    const setPreferredCurrency = async (currency) => {
        try {
            await paymentsService.setPreferredCurrency(currency);
            setUserCurrency(currency);
            return true;
        } catch (error) {
            console.error('Failed to set preferred currency:', error);
            return false;
        }
    };

    const value = {
        platformCurrency,
        userCurrency,
        setUserCurrency,
        displayAmount,
        formatAmount,
        getCurrencySymbol,
        getCurrencyInfo,
        convertToUserCurrency,
        convertFromPlatform,
        exchangeRates,
        setPreferredCurrency,
        isLoading,
        refreshCurrency: initializeCurrency,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export default CurrencyContext;
