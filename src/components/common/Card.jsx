import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => {
    return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardBody = ({ children, className = '' }) => {
    return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
    return <div className={`px-6 py-3 bg-gray-50 border-t border-gray-200 ${className}`}>{children}</div>;
};

export default Card;
