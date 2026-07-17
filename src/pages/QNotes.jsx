import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, MessageCircle, Share2, Bookmark, RefreshCw,
    ChevronDown, ChevronUp, X, Send, ArrowLeft, Settings,
    Globe, Link, Download, FileText, StickyNote,
    Plus, Loader2, Palette
} from 'lucide-react';
import qnotesService from '../services/qnotes.service';
import { useAuth } from '../contexts/AuthContext';
import { renderMarkdown } from '../utils/markdown';

const NOTE_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

const heartPopKeyframes = `
@keyframes heartPop {
    0% { transform: scale(0); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0; }
}`;

const QNotes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const commentInputRef = useRef(null);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const lastTap = useRef(0);

    // State
    const [notes, setNotes] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [showComment, setShowComment] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [showHeart, setShowHeart] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showShare, setShowShare] = useState(null);
    const [actionsLeft, setActionsLeft] = useState(() => {
        try { return localStorage.getItem('qnotes_actions_left') === 'true'; }
        catch { return false; }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[0]);

    // Load notes
    const loadNotes = useCallback(async (pageNum = 1) => {
        try {
            setIsLoading(true);
            const data = await qnotesService.getRandom({ page: pageNum, page_size: 10 });
            if (pageNum === 1) {
                setNotes(data.results || []);
            } else {
                setNotes(prev => [...prev, ...(data.results || [])]);
            }
            setHasMore(data.has_next !== false);
            setPage(pageNum);
        } catch (err) { console.error('Failed to load notes:', err); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadNotes(); }, [loadNotes]);

    // Navigation
    const goNext = useCallback(() => {
        if (currentIndex < notes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (hasMore && !isLoading) {
            loadNotes(page + 1).then(() => {
                setCurrentIndex(prev => prev + 1);
            });
        }
    }, [currentIndex, notes.length, hasMore, isLoading, loadNotes, page]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (showComment) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [goNext, goPrev, showComment]);

    // Wheel navigation (desktop)
    useEffect(() => {
        const container = containerRef.current;
        if (!container || showComment) return;
        let ticking = false;
        const handleWheel = (e) => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                if (e.deltaY > 0) goNext();
                else goPrev();
                ticking = false;
            });
        };
        container.addEventListener('wheel', handleWheel, { passive: true });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [goNext, goPrev, showComment]);

    const handleTouchStart = (e) => {
        if (showComment) return;
        const touch = e.touches[0];
        touchStartY.current = touch.clientY;
        touchStartX.current = touch.clientX;
    };
    const handleTouchEnd = (e) => {
        if (showComment) return;
        const touch = e.changedTouches[0];
        const dY = touchStartY.current - touch.clientY;
        const dX = touchStartX.current - touch.clientX;
        const edgeThreshold = 40;
        const isEdgeSwipe = touchStartX.current < edgeThreshold ||
            touchStartX.current > (window.innerWidth - edgeThreshold);

        // Inward edge swipe (from left or right edge) → previous note
        if (isEdgeSwipe && Math.abs(dX) > 30 && Math.abs(dX) > Math.abs(dY)) {
            goPrev();
            return;
        }

        // Vertical swipe (up/down) for next/previous
        if (Math.abs(dY) > 50) {
            if (dY > 0) goNext();
            else goPrev();
        }
    };

    // Toggle actions left/right
    const toggleActionsSide = () => {
        const newVal = !actionsLeft;
        setActionsLeft(newVal);
        localStorage.setItem('qnotes_actions_left', String(newVal));
        setShowSettings(false);
    };

    // Handle like
    const handleLike = async (note, e) => {
        e.stopPropagation();
        try {
            const result = await qnotesService.toggleLike(note.id);
            setNotes(prev => prev.map(n =>
                n.id === note.id ? { ...n, is_liked: result.liked, like_count: result.like_count } : n
            ));
        } catch (err) { console.error(err); }
    };

    // Handle repost
    const handleRepost = async (note, e) => {
        e.stopPropagation();
        try {
            const result = await qnotesService.toggleRepost(note.id);
            setNotes(prev => prev.map(n =>
                n.id === note.id ? { ...n, is_reposted: result.reposted, repost_count: result.repost_count } : n
            ));
        } catch (err) { console.error(err); }
    };

    // Handle save
    const handleSave = async (note, e) => {
        e.stopPropagation();
        try {
            const result = await qnotesService.toggleSave(note.id);
            setNotes(prev => prev.map(n =>
                n.id === note.id ? { ...n, is_saved: result.saved, save_count: result.save_count } : n
            ));
        } catch (err) { console.error(err); }
    };

    // Open comments
    const openComments = async (note, e) => {
        e.stopPropagation();
        setShowComment(note);
        try {
            const data = await qnotesService.getComments(note.id);
            setComments(data || []);
        } catch (err) {
            setComments([]);
        }
        setTimeout(() => commentInputRef.current?.focus(), 300);
    };

    // Submit comment
    const submitComment = async () => {
        if (!commentText.trim() || !showComment) return;
        try {
            const newComment = await qnotesService.addComment(showComment.id, commentText.trim());
            setComments(prev => [...prev, newComment]);
            setCommentText('');
            setNotes(prev => prev.map(n =>
                n.id === showComment.id ? { ...n, comment_count: n.comment_count + 1 } : n
            ));
        } catch (err) { console.error(err); }
    };

    // Like a comment
    const handleCommentLike = async (commentId) => {
        if (!showComment) return;
        try {
            const result = await qnotesService.toggleCommentLike(showComment.id, commentId);
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, is_liked: result.liked, like_count: result.like_count } : c
            ));
        } catch (err) { console.error(err); }
    };

    // Submit reply to a comment
    const submitReply = async (parentId) => {
        if (!replyText.trim() || !showComment) return;
        try {
            const newReply = await qnotesService.addComment(showComment.id, replyText.trim(), parentId);
            setComments(prev => prev.map(c =>
                c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
            ));
            setReplyText('');
            setReplyTo(null);
        } catch (err) { console.error(err); }
    };

    // Share
    const openShare = async (note, e) => {
        e.stopPropagation();
        try {
            const data = await qnotesService.getShareInfo(note.id);
            setShowShare({ ...data, note });
        } catch (err) {
            setShowShare({ note, share_url: window.location.origin + '/qnotes/' + note.id });
        }
    };

    const shareTo = (platform) => {
        if (!showShare) return;
        const url = encodeURIComponent(showShare.share_url);
        const text = encodeURIComponent(showShare.content?.slice(0, 100));
        let shareUrl = '';
        switch (platform) {
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'whatsapp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
            case 'copy':
                navigator.clipboard.writeText(showShare.share_url);
                return;
            default: return;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const clipToOpinion = () => {
        if (!showShare) return;
        navigate('/opinions', { state: { prefilled: showShare.content } });
        setShowShare(null);
    };

    const downloadNote = () => {
        if (!showShare) return;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = showShare.note?.color || '#FFD700';
        ctx.fillRect(0, 0, 400, 400);

        // Watermark: logo
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.globalAlpha = 0.12;
            ctx.drawImage(img, 280, 310, 60, 60);
            ctx.globalAlpha = 1;

            // Watermark: "QNotes" text
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('QNotes', 370, 390);
            ctx.restore();

            // Note content
            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate(-2 * Math.PI / 180);
            ctx.fillStyle = '#333';
            ctx.font = '24px Caveat, cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const words = (showShare.content || '').split(' ');
            const lines = [];
            let line = '';
            for (const word of words) {
                const test = line + word + ' ';
                if (test.length > 25) { lines.push(line.trim()); line = word + ' '; }
                else line = test;
            }
            lines.push(line.trim());
            const startY = -((lines.length - 1) * 30) / 2;
            lines.forEach((l, i) => ctx.fillText(l, 0, startY + i * 30));
            ctx.restore();

            // Trigger download after image loads
            const link = document.createElement('a');
            link.download = `qnote-${showShare.note?.id || 'note'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        img.onerror = () => {
            // Still render without logo if image fails to load
            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate(-2 * Math.PI / 180);
            ctx.fillStyle = '#333';
            ctx.font = '24px Caveat, cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const words = (showShare.content || '').split(' ');
            const lines = [];
            let line = '';
            for (const word of words) {
                const test = line + word + ' ';
                if (test.length > 25) { lines.push(line.trim()); line = word + ' '; }
                else line = test;
            }
            lines.push(line.trim());
            const startY = -((lines.length - 1) * 30) / 2;
            lines.forEach((l, i) => ctx.fillText(l, 0, startY + i * 30));
            ctx.restore();
            const link = document.createElement('a');
            link.download = `qnote-${showShare.note?.id || 'note'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        img.src = '/qomrade_svg.svg';
    };

    // Double-tap to like
    const handleCardTap = (note) => {
        if (!note) return;
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (!note.is_liked) {
                handleLike(note, { stopPropagation: () => {} });
            }
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 800);
        }
        lastTap.current = now;
    };

    // Create note
    const handleCreateNote = async () => {
        if (!newNoteContent.trim()) return;
        try {
            const note = await qnotesService.create({ content: newNoteContent.trim(), color: newNoteColor });
            setNotes(prev => [note, ...prev]);
            setShowCreate(false);
            setNewNoteContent('');
        } catch (err) { console.error(err); }
    };

    const currentNote = notes[currentIndex];

    return (
        <div className="h-screen bg-black overflow-hidden relative select-none">
            <style>{heartPopKeyframes}</style>
            {/* Top bar (hidden on mobile, keep site navbar only) */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                    <StickyNote className="w-6 h-6 text-white" />
                    <span className="text-white font-bold text-lg">QNotes</span>
                    <span className="text-white/50 text-sm">Anonymous</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowCreate(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Settings className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Settings dropdown */}
            {showSettings && (
                <div className="absolute top-14 right-4 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-4 min-w-[200px]">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span className="text-sm text-white">Actions on left side</span>
                        <button
                            onClick={toggleActionsSide}
                            className={`w-10 h-5 rounded-full transition-colors ${actionsLeft ? 'bg-blue-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${actionsLeft ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </label>
                </div>
            )}

            {/* Main content area */}
            <div
                ref={containerRef}
                className="h-full w-full relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {isLoading && notes.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/50 gap-4">
                        <StickyNote className="w-16 h-16" />
                        <p className="text-lg">No notes yet. Create the first one!</p>
                    </div>
                ) : currentNote ? (
                    <div className="h-full flex items-center justify-center px-6 sm:px-12">
                        {/* Sticky note card */}
                        <div
                            className="relative w-full max-w-lg aspect-[3/4] rounded-2xl shadow-2xl flex items-center justify-center p-8 transition-all duration-300 cursor-pointer"
                            style={{
                                backgroundColor: currentNote.color,
                                transform: 'rotate(-1deg)',
                                boxShadow: '8px 8px 0px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.3)',
                            }}
                            onClick={() => handleCardTap(currentNote)}
                        >
                            {/* Pin icon */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-400 rounded-full shadow-md border-2 border-gray-300" />

                            {/* Content */}
                            <div className="text-gray-900 text-xl leading-relaxed text-center font-['Caveat',cursive] font-medium break-words max-w-full"
                                style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                                {renderMarkdown(currentNote.content)}
                            </div>

                            {/* Timestamp */}
                            <div className="absolute bottom-4 right-4 text-xs text-gray-600/60">
                                {new Date(currentNote.created_at).toLocaleDateString()}
                            </div>

                            {/* Double-tap heart animation */}
                            {showHeart && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ animation: 'heartPop 0.8s ease-out forwards' }}>
                                    <Heart className="w-16 h-16 text-red-500 fill-red-500" />
                                </div>
                            )}
                        </div>

                        {/* Navigation arrows */}
                        <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10">
                            <ChevronUp className="w-6 h-6" />
                        </button>
                        <button onClick={goNext} className="absolute left-2 top-1/2 -translate-y-1/2 mt-16 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10">
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Action buttons */}
            {currentNote && (
                <div className={`absolute bottom-24 ${actionsLeft ? 'left-4' : 'right-4'} z-20 flex flex-col items-center gap-5`}>
                    {/* Like */}
                    <button onClick={(e) => handleLike(currentNote, e)} className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all ${currentNote.is_liked ? 'bg-red-500 text-white scale-110' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>
                            <Heart className={`w-6 h-6 ${currentNote.is_liked ? 'fill-current' : ''}`} />
                        </div>
                        <span className="text-xs text-white/70">{currentNote.like_count || ''}</span>
                    </button>

                    {/* Comment */}
                    <button onClick={(e) => openComments(currentNote, e)} className="flex flex-col items-center gap-1 group">
                        <div className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-white/70">{currentNote.comment_count || ''}</span>
                    </button>

                    {/* Repost */}
                    <button onClick={(e) => handleRepost(currentNote, e)} className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all ${currentNote.is_reposted ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-white/70">{currentNote.repost_count || ''}</span>
                    </button>

                    {/* Save */}
                    <button onClick={(e) => handleSave(currentNote, e)} className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all ${currentNote.is_saved ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>
                            <Bookmark className={`w-6 h-6 ${currentNote.is_saved ? 'fill-current' : ''}`} />
                        </div>
                    </button>

                    {/* Share */}
                    <button onClick={(e) => openShare(currentNote, e)} className="flex flex-col items-center gap-1 group">
                        <div className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
                            <Share2 className="w-6 h-6" />
                        </div>
                    </button>
                </div>
            )}

            {/* Comment panel (TikTok-style) */}
            {showComment && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowComment(null)}>
                    <div className="absolute bottom-0 inset-x-0 bg-gray-900 rounded-t-2xl max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowComment(null)}>
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </button>
                                <span className="text-white font-semibold">Comments</span>
                                <span className="text-gray-400 text-sm">{showComment.comment_count}</span>
                            </div>
                            <button onClick={() => setShowComment(null)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Note preview (zoomed in at top) */}
                        <div className="px-4 py-3 bg-gray-800/50 flex justify-center">
                            <div className="w-48 h-36 rounded-xl flex items-center justify-center p-4 shadow-lg"
                                style={{ backgroundColor: showComment.color, transform: 'rotate(-1deg)' }}>
                                <p className="text-gray-900 text-sm text-center font-['Caveat',cursive] font-medium line-clamp-4">
                                    {showComment.content}
                                </p>
                            </div>
                        </div>

                        {/* Comments list */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 text-sm">No comments yet. Be the first!</p>
                            ) : comments.map((comment, idx) => (
                                <div key={comment.id || idx} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-gray-400 font-bold">A</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-white">Anonymous</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{comment.content}</p>

                                        {/* Like & Reply buttons */}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <button onClick={() => handleCommentLike(comment.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
                                                <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-red-400 text-red-400' : ''}`} />
                                                {comment.like_count > 0 && <span>{comment.like_count}</span>}
                                            </button>
                                            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                <span>Reply</span>
                                            </button>
                                        </div>

                                        {/* Inline reply input */}
                                        {replyTo === comment.id && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(comment.id); } }}
                                                    placeholder="Write a reply..."
                                                    className="flex-1 bg-gray-800 text-white rounded-full px-3 py-1.5 text-xs border border-gray-700 focus:outline-none focus:border-blue-500"
                                                    autoFocus
                                                />
                                                <button onClick={() => submitReply(comment.id)}
                                                    className={`p-1.5 rounded-full ${replyText.trim() ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}
                                                    disabled={!replyText.trim()}>
                                                    <Send className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        {comment.replies?.length > 0 && (
                                            <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-700 pl-3">
                                                {comment.replies.map((reply, ri) => (
                                                    <div key={ri} className="flex gap-2">
                                                        <span className="text-xs text-gray-400 font-bold">A</span>
                                                        <div className="flex-1">
                                                            <span className="text-xs text-gray-500">Anonymous</span>
                                                            <p className="text-sm text-gray-300">{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment input */}
                        <div className="px-4 py-3 border-t border-gray-800">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                                    placeholder="Add a comment as Anonymous..."
                                    className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                                />
                                <button onClick={submitComment}
                                    className={`p-2 rounded-full ${commentText.trim() ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}
                                    disabled={!commentText.trim()}>
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share sheet */}
            {showShare && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowShare(null)}>
                    <div className="bg-gray-900 rounded-t-2xl w-full max-w-md px-6 py-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-semibold text-lg">Share Note</h3>
                            <button onClick={() => setShowShare(null)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Note preview */}
                        <div className="flex justify-center mb-6">
                            <div className="w-40 h-28 rounded-xl flex items-center justify-center p-3 shadow-lg"
                                style={{ backgroundColor: showShare.note?.color || '#FFD700', transform: 'rotate(-1deg)' }}>
                                <p className="text-gray-900 text-xs text-center font-['Caveat',cursive] line-clamp-3">
                                    {showShare.content}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <button onClick={() => shareTo('twitter')} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                                    <X className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs text-gray-400">X</span>
                            </button>
                            <button onClick={() => shareTo('facebook')} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-[#4267B2] flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs text-gray-400">Facebook</span>
                            </button>
                            <button onClick={() => shareTo('whatsapp')} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                                <span className="text-xs text-gray-400">WhatsApp</span>
                            </button>
                            <button onClick={() => shareTo('copy')} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                    <Link className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs text-gray-400">Copy Link</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <button onClick={downloadNote} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                                <Download className="w-5 h-5 text-white" />
                                <span className="text-sm text-white">Download as Image</span>
                            </button>
                            <button onClick={clipToOpinion} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                                <FileText className="w-5 h-5 text-white" />
                                <span className="text-sm text-white">Clip to Opinion</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create note modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">Create a Note</h3>
                            <button onClick={() => setShowCreate(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-1">Share a random thought anonymously. No one will know it's you.</p>
                        <p className="text-gray-500 text-xs mb-4">Supports **bold**, *italic*, [links](url), - lists, # headings</p>

                        <textarea
                            value={newNoteContent}
                            onChange={e => setNewNoteContent(e.target.value)}
                            placeholder="What's on your mind?"
                            maxLength={500}
                            rows={4}
                            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none mb-4"
                        />

                        <div className="mb-4">
                            <label className="text-sm text-gray-400 mb-2 block">Pick a color</label>
                            <div className="flex gap-2 flex-wrap">
                                {NOTE_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewNoteColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${newNoteColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm text-gray-400 mb-3 block">Preview</label>
                            <div
                                className="relative w-full aspect-[4/3] rounded-xl flex items-center justify-center p-6"
                                style={{
                                    backgroundColor: newNoteColor,
                                    transform: 'rotate(-0.5deg)',
                                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.2)',
                                }}
                            >
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full shadow-md border-2 border-gray-300" />
                                {newNoteContent.trim() ? (
                                    <div className="text-gray-900 text-lg text-center font-['Caveat',cursive] font-medium break-words max-w-full leading-relaxed">
                                        {renderMarkdown(newNoteContent)}
                                    </div>
                                ) : (
                                    <p className="text-gray-600/60 text-lg text-center font-['Caveat',cursive] italic">
                                        Your note will appear here...
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateNote}
                            disabled={!newNoteContent.trim()}
                            className="w-full py-3 rounded-xl font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500"
                        >
                            Post Note
                        </button>
                    </div>
                </div>
            )}

            {/* Counter indicator */}
            {notes.length > 0 && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex gap-1">
                    {notes.slice(0, Math.min(notes.length, 10)).map((_, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full transition-all ${idx === currentIndex % 10 ? 'bg-white w-3' : 'bg-white/30'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default QNotes;
