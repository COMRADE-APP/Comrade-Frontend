import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`bg-elevated rounded-2xl border border-theme shadow-sm overflow-hidden ${className}`} {...props}>
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
    return <div className={`px-6 py-3 bg-secondary border-t border-theme ${className}`}>{children}</div>;
};

export default Card;
