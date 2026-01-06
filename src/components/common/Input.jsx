import React from 'react';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    className = '',
    ...props
}) => {
    const inputClasses = `w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200 ${error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
            : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
        } ${className}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={inputClasses}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
