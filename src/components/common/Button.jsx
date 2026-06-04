import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    onClick,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const variants = {
        // Filled primary — green fill, gold on hover with black text (logo palette)
        primary: 'bg-primary-600 text-white hover:bg-amber-500 hover:text-black active:bg-amber-600 active:text-black shadow-sm',
        // Outline — green border at rest, gold tint + gold border on hover (matches logo palette)
        secondary: 'border border-primary-600/60 text-primary hover:bg-amber-500/10 hover:border-amber-500 hover:text-amber-500 active:bg-amber-500/20',
        outline:   'border border-primary-600/60 text-primary hover:bg-amber-500/10 hover:border-amber-500 hover:text-amber-500 active:bg-amber-500/20',
        // Danger
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    };

    const classes = `${baseClasses} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-disabled={disabled}
            className={classes}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
