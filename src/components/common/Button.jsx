import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    type = 'button',
    onClick,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'px-4 py-2 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 font-bold',
        secondary: 'bg-secondary/10 text-primary hover:bg-primary-600 hover:text-white font-bold',
        outline: 'bg-transparent border-[1.5px] border-theme text-primary font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 font-bold',
    };

    const classes = `${baseClasses} ${variants[variant]} ${className}`;

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
