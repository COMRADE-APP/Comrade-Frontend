/**
 * i18n (Internationalization) System
 * 
 * Simple translation system with React Context.
 * Translations are organized by language code (BCP 47).
 * Uses the user's preferred_language from their profile,
 * falling back to browser locale, then 'en'.
 */
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Import all translation bundles
import en from '../i18n/en';
import sw from '../i18n/sw';
import fr from '../i18n/fr';
import es from '../i18n/es';

const TRANSLATIONS = { en, sw, fr, es };

const SUPPORTED_LANGUAGES = {
    en: 'English',
    sw: 'Kiswahili',
    fr: 'Français',
    es: 'Español',
};

const I18nContext = createContext(null);

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

/**
 * Resolve a nested key like 'nav.home' from a translation object.
 */
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const I18nProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        // Initial language: stored preference > browser locale > 'en'
        const stored = localStorage.getItem('preferredLanguage');
        if (stored && TRANSLATIONS[stored]) return stored;

        const browserLang = (navigator.language || 'en').split('-')[0];
        if (TRANSLATIONS[browserLang]) return browserLang;

        return 'en';
    });

    // Sync with user's saved preference when auth loads
    let auth = null;
    try {
        auth = useAuth();
    } catch {
        // I18nProvider may be rendered outside AuthProvider during initial load
    }

    useEffect(() => {
        if (auth?.user?.preferred_language && TRANSLATIONS[auth.user.preferred_language]) {
            setLanguageState(auth.user.preferred_language);
            localStorage.setItem('preferredLanguage', auth.user.preferred_language);
        }
    }, [auth?.user?.preferred_language]);

    /**
     * Translate a key, with optional interpolation.
     * Usage: t('auth.login') or t('greeting', { name: 'John' })
     */
    const t = useCallback((key, params = {}) => {
        const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
        let value = getNestedValue(translations, key);

        // Fallback to English if key not found in current language
        if (value === undefined) {
            value = getNestedValue(TRANSLATIONS.en, key);
        }

        // If still not found, return the key itself
        if (value === undefined) return key;

        // Interpolate {{param}} placeholders
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
                return params[paramKey] !== undefined ? params[paramKey] : `{{${paramKey}}}`;
            });
        }

        return value;
    }, [language]);

    const setLanguage = useCallback((lang) => {
        if (TRANSLATIONS[lang]) {
            setLanguageState(lang);
            localStorage.setItem('preferredLanguage', lang);
        }
    }, []);

    const value = {
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export default I18nContext;
