import React from 'react';

const TypingIndicator = ({ isOwn = false }) => {
    const bubbleClass = isOwn
        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-sm ml-auto'
        : 'bg-white dark:bg-gray-800 border border-theme text-primary rounded-bl-sm mr-auto';

    return (
        <div className={`p-3 rounded-2xl w-fit ${bubbleClass} flex items-center gap-1 min-h-[36px] min-w-[50px]`}>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s] opacity-70"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s] opacity-70"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-70"></div>
        </div>
    );
};

export default TypingIndicator;
