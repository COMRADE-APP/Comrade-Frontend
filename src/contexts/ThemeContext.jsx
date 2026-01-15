import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const THEME_KEY = 'comrade_theme';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem(THEME_KEY);
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved;
        }
        return 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState('light');

    // Resolve system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolvedTheme = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        // Listen for system theme changes
        const handler = (e) => {
            if (theme === 'system') {
                setResolvedTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
    }, [resolvedTheme]);

    // Save theme preference
    const changeTheme = (newTheme) => {
        if (['light', 'dark', 'system'].includes(newTheme)) {
            setTheme(newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
        }
    };

    const toggleTheme = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        changeTheme(newTheme);
    };

    const value = {
        theme,           // The user's preference: 'light', 'dark', or 'system'
        resolvedTheme,   // The actual theme being used: 'light' or 'dark'
        setTheme: changeTheme,
        toggleTheme,
        isDark: resolvedTheme === 'dark',
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
