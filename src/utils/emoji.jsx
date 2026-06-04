import React, { useState, useEffect } from 'react';

// ── Emoji mart preload + readiness tracking ───────────────────
// emoji-mart defines the <em-emoji> custom element inside the lazy
// 'emoji' chunk.  Until that chunk loads, <em-emoji> is inert.
// We preload the chunk early and fall back to native text while
// it is loading.  Once the chunk arrives the Apple-style images
// replace the fallback automatically on the next render.

let _emojiReady = typeof customElements !== 'undefined' && !!customElements.get('em-emoji');
const _listeners = new Set();

export function onEmojiReady(cb) {
    if (_emojiReady) { cb(); return () => {}; }
    _listeners.add(cb);
    return () => _listeners.delete(cb);
}

export function triggerEmojiReady() {
    if (_emojiReady) return;
    _emojiReady = true;
    const cbs = Array.from(_listeners);
    _listeners.clear();
    cbs.forEach(cb => cb());
}

export function preloadEmojiMart() {
    if (_emojiReady) return Promise.resolve();
    return Promise.all([
        import('emoji-mart'),
        import('@emoji-mart/data/sets/15/apple.json')
    ])
    .then(([{ init }, { default: emojiData }]) => {
        init({ data: emojiData });
        triggerEmojiReady();
    })
    .catch(() => {});
}

// Kick off emoji chunk loading immediately — not waiting for a React effect.
// The module-level <em-emoji> fallback keeps emojis visible while loading.
if (typeof window !== 'undefined') preloadEmojiMart();

export function useEmojiReady() {
    const [ready, setReady] = useState(_emojiReady);
    useEffect(() => {
        const off = onEmojiReady(() => setReady(true));
        return off;
    }, []);
    return ready;
}

// ── Apple Emoji Renderer ──────────────────────────────────────
export const AppleEmoji = ({ native, size = '22px' }) => {
    const ready = useEmojiReady();
    if (ready) {
        return <em-emoji native={native} set="apple" size={size}></em-emoji>;
    }
    return <span style={{ fontSize: size }}>{native}</span>;
};

export const renderContentWithEmojis = (content) => {
    if (!content) return '';
    const emojiRegex = /(\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]|[\u2600-\u27BF])\uFE0F?/g;
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
            // Replace the element with its native text plus any inner text/children
            const textContent = emoji.textContent || '';
            emoji.parentNode.replaceChild(document.createTextNode(native + textContent), emoji);
        }
    });
    
    return div.textContent.replace(/\u200B/g, '');
};

export const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','😡','🙏','🔥','💯','🎉','💀','🤔'];
