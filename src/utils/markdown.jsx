import React from 'react';

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const renderInline = (text) => {
    if (!text) return text;
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|\[([^\]]+)\]\(([^)]+)\)/g;
    const result = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }
        if (match[1]) {
            result.push(<strong key={nextKey()} className="font-bold">{match[2]}</strong>);
        } else if (match[3]) {
            result.push(<em key={nextKey()} className="italic">{match[4]}</em>);
        } else if (match[5]) {
            result.push(
                <a key={nextKey()} href={match[6]} target="_blank" rel="noopener noreferrer"
                    className="underline text-blue-400 hover:text-blue-300"
                    onClick={e => e.stopPropagation()}>
                    {match[5]}
                </a>
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }
    return result.length > 0 ? result : text;
};

export const renderMarkdown = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let listOrdered = false;

    const flushList = () => {
        if (listItems.length === 0) return;
        elements.push(
            <div key={nextKey()} className={`mb-1 space-y-0.5 ${listOrdered ? '' : ''}`}>
                {listItems.map((item, i) => (
                    <div key={i} className="flex gap-1.5 items-baseline">
                        <span className="shrink-0">{listOrdered ? `${i + 1}.` : '👉'}</span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        );
        listItems = [];
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' };
            elements.push(
                <p key={`h-${idx}`} className={`${sizes[level] || 'text-lg'} font-bold leading-tight`}>
                    {renderInline(headingMatch[2])}
                </p>
            );
            return;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            if (listItems.length === 0) listOrdered = false;
            listItems.push(renderInline(bulletMatch[1]));
            return;
        }

        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (numberedMatch) {
            if (listItems.length === 0) listOrdered = true;
            listItems.push(renderInline(numberedMatch[1]));
            return;
        }

        flushList();

        if (trimmed === '') {
            elements.push(<br key={`br-${idx}`} />);
        } else {
            elements.push(
                <p key={`p-${idx}`} className="mb-0.5 leading-relaxed">
                    {renderInline(trimmed)}
                </p>
            );
        }
    });

    flushList();
    return elements;
};
