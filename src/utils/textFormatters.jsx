import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Parses text and renders @username mentions as clickable spans that navigate to the user profile.
 * We use span with onClick rather than nested Link/a tags to avoid HTML validation errors
 * when the content itself is wrapped in a Link (like in OpinionCard).
 */
export const renderContentWithMentions = (text, navigate) => {
    if (!text || typeof text !== 'string') return text;

    // Split text by @username pattern (letters, numbers, underscores)
    const mentionRegex = /(@[\w]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, i) => {
        if (part.match(mentionRegex)) {
            const username = part.substring(1); // remove @
            return (
                <span
                    key={i}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Navigate to /profile/@username
                        navigate(`/profile/@${username}`);
                    }}
                    className="font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                >
                    {part}
                </span>
            );
        }
        return part;
    });
};
