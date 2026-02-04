import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    DARK_HC: 'dark-hc',      // Dark High Contrast
    AMBIENT: 'ambient',       // Matches QomAI/Institution portal
    SYSTEM: 'system'
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const THEME_KEY = 'comrade_theme';
const VALID_THEMES = Object.values(THEMES);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem(THEME_KEY);
        if (saved && VALID_THEMES.includes(saved)) {
            return saved;
        }
        return THEMES.SYSTEM;
    });

    const [resolvedTheme, setResolvedTheme] = useState(THEMES.LIGHT);

    // Resolve system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolvedTheme = () => {
            if (theme === THEMES.SYSTEM) {
                setResolvedTheme(mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT);
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        // Listen for system theme changes
        const handler = (e) => {
            if (theme === THEMES.SYSTEM) {
                setResolvedTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove('dark', 'dark-hc', 'ambient');

        // Apply the resolved theme
        switch (resolvedTheme) {
            case THEMES.DARK:
                root.classList.add('dark');
                root.style.colorScheme = 'dark';
                break;
            case THEMES.DARK_HC:
                root.classList.add('dark', 'dark-hc');
                root.style.colorScheme = 'dark';
                break;
            case THEMES.AMBIENT:
                root.classList.add('ambient');
                root.style.colorScheme = 'dark';
                break;
            default: // light
                root.style.colorScheme = 'light';
        }
    }, [resolvedTheme]);

    // Save theme preference
    const changeTheme = (newTheme) => {
        if (VALID_THEMES.includes(newTheme)) {
            setTheme(newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
        }
    };

    const toggleTheme = () => {
        // Cycle through: light -> dark -> dark-hc -> ambient -> light
        const cycle = [THEMES.LIGHT, THEMES.DARK, THEMES.DARK_HC, THEMES.AMBIENT];
        const currentIndex = cycle.indexOf(resolvedTheme);
        const nextIndex = (currentIndex + 1) % cycle.length;
        changeTheme(cycle[nextIndex]);
    };

    const value = {
        theme,           // The user's preference
        resolvedTheme,   // The actual theme being used
        setTheme: changeTheme,
        toggleTheme,
        isDark: [THEMES.DARK, THEMES.DARK_HC, THEMES.AMBIENT].includes(resolvedTheme),
        isAmbient: resolvedTheme === THEMES.AMBIENT,
        isHighContrast: resolvedTheme === THEMES.DARK_HC,
        THEMES,          // Export theme constants
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;

