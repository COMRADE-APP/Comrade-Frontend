import React from 'react';

const Badge = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const variants = {
        primary: 'bg-primary-100 text-primary-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        danger: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
    };

    const variantClasses = variants[variant] || variants.primary;

    return (
        <span
            className={`${baseClasses} ${variantClasses} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
