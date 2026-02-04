import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Zap, Contrast, ChevronDown } from 'lucide-react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

const ThemeSwitcher = () => {
    const { theme, setTheme, THEMES } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const themeOptions = [
        { id: THEMES.LIGHT, label: 'Light', icon: Sun, description: 'Classic light mode' },
        { id: THEMES.DARK, label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
        { id: THEMES.DARK_HC, label: 'High Contrast', icon: Contrast, description: 'Maximum legibility' },
        { id: THEMES.AMBIENT, label: 'Ambient', icon: Zap, description: 'Immersive glow' },
        { id: THEMES.SYSTEM, label: 'System', icon: Monitor, description: 'Follows device settings' },
    ];

    const currentTheme = themeOptions.find(t => t.id === theme) || themeOptions.find(t => t.id === THEMES.SYSTEM);
    const CurrentIcon = currentTheme.icon;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-secondary hover:bg-elevated transition-colors text-primary w-full md:w-auto justify-between"
                aria-label="Select theme"
            >
                <div className="flex items-center gap-2">
                    <CurrentIcon className="w-5 h-5 text-accent-primary" />
                    <span className="font-medium">{currentTheme.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full text-left left-0 mt-2 w-64 p-2 rounded-xl shadow-lg border border-theme bg-elevated z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1">
                        {themeOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = theme === option.id;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setTheme(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                                        ${isActive
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'hover:bg-secondary text-primary'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-secondary'}`}>
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-tertiary'}`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{option.label}</p>
                                        <p className="text-xs text-tertiary">{option.description}</p>
                                    </div>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
