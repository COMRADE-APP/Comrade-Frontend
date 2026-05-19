import React from 'react';

// ── Apple Emoji Renderer ──────────────────────────────────────
export const AppleEmoji = ({ native, size = '22px' }) => {
    return <em-emoji native={native} set="apple" size={size}></em-emoji>;
};

export const renderContentWithEmojis = (content) => {
    if (!content) return '';
    const emojiRegex = /(\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/g;
    return content.split(emojiRegex).map((part, index) => {
        if (part && part.match(emojiRegex)) {
            return <AppleEmoji key={index} native={part} size="18px" />;
        }
        return part;
    });
};

export const insertHTMLAtCursor = (html) => {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
            range.setStartAfter(lastNode);
            range.setEndAfter(lastNode);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
};

export const convertHTMLToTextWithEmojis = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Find all em-emoji elements
    const emojis = div.querySelectorAll('em-emoji');
    emojis.forEach(emoji => {
        const native = emoji.getAttribute('native');
        if (native) {
            // Replace the element with its native text
            emoji.parentNode.replaceChild(document.createTextNode(native), emoji);
        }
    });
    
    return div.textContent.replace(/\u200B/g, '');
};

export const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','😡','🙏','🔥','💯','🎉','💀','🤔'];
