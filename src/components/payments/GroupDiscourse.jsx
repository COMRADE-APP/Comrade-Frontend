import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { MessageCircle, Pin, Heart, ThumbsUp, Smile, Reply, Megaphone, Check, Share2, Forward, ArrowUpCircle, Plus, X, Search } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import data from '@emoji-mart/data/sets/15/apple.json';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';
import { AppleEmoji, renderContentWithEmojis, insertHTMLAtCursor, QUICK_EMOJIS } from '../../utils/emoji';

init({ data });

// ── Quick Reaction Bar (inline under posts/replies) ──────────
const QuickReactionBar = ({ onReact, className = '' }) => {
    const [showFull, setShowFull] = useState(false);
    const handleClose = useCallback(() => setShowFull(false), []);
    
    // Listen for clicks outside the picker
    const containerRef = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setShowFull(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={`relative inline-flex flex-col items-start ${className}`} ref={containerRef}>
            <div className="flex items-center gap-0.5 bg-elevated border border-theme p-1 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                {QUICK_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => { onReact(emoji); setShowFull(false); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/10 transition-all hover:scale-125 active:scale-90">
                        <AppleEmoji native={emoji} size="20px" />
                    </button>
                ))}
                <div className="w-px h-5 bg-theme mx-0.5" />
                <button onClick={() => setShowFull(!showFull)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-secondary hover:text-emerald-600 transition-all">
                    <Plus size={16} />
                </button>
            </div>
            {showFull && (
                <div className="absolute top-full mt-3 left-0 z-[9999] shadow-2xl rounded-xl overflow-hidden border border-theme animate-in fade-in zoom-in-95 duration-200" style={{ maxWidth: 'calc(100vw - 32px)' }}>
                    <Picker 
                        data={data} 
                        onEmojiSelect={(emoji) => { onReact(emoji.native); setShowFull(false); }} 
                        set="apple" 
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                        previewPosition="none"
                        skinTonePosition="none"
                        backgroundImageFn={(set, sheetSize) => `${window.location.origin}/apple-sheets-64.png`}
                    />
                </div>
            )}
        </div>
    );
};

// ── Reaction Bubble (shown under posts/replies) ──────────────
const ReactionBubble = ({ emoji, count, hasReacted, onClick }) => (
    <button onClick={onClick}
        className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-xs transition-all active:scale-90 hover:shadow-sm
            ${hasReacted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-200/50'
                : 'bg-secondary/5 border-theme hover:bg-secondary/10'}`}>
        <AppleEmoji native={emoji || '👍'} size="16px" />
        <span className={`text-[11px] font-semibold tabular-nums ${hasReacted ? 'text-emerald-700 dark:text-emerald-400' : 'text-secondary'}`}>{count}</span>
    </button>
);

// ── Avatar Component ─────────────────────────────────────────
const Avatar = ({ src, name, size = 'md' }) => {
    const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-sm', lg: 'w-11 h-11 text-sm' };
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    
    // Ensure relative URLs are prefixed with the API base URL
    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    };
    
    const fullSrc = getFullImageUrl(src);

    return (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-emerald-200/30 shadow-sm`}>
            {fullSrc ? <img src={fullSrc} alt={name} className="w-full h-full object-cover rounded-full" onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                : null}
            <span className={`font-bold text-white ${fullSrc ? 'hidden' : 'flex'}`} style={fullSrc ? {display:'none'} : {}}>{initial}</span>
        </div>
    );
};

const GroupDiscourse = ({ groupId, isAdmin }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [activePicker, setActivePicker] = useState(null);
    const [showPostEmojiPicker, setShowPostEmojiPicker] = useState(false);
    const composerRef = useRef(null);

    useEffect(() => { loadPosts(); }, [groupId]);

    const loadPosts = async (silent = false) => {
        if (!groupId) return;
        if (!silent) setLoading(true);
        try {
            const res = await paymentsService.getGroupPosts(groupId);
            setPosts(Array.isArray(res) ? res : res?.results || []);
        } catch (error) { console.error('Failed to list group posts:', error); }
        finally { if (!silent) setLoading(false); }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        setActionLoading(true);
        try { 
            await paymentsService.createGroupPost({ group: groupId, content: newPostContent }); 
            setNewPostContent(''); 
            if (composerRef.current) composerRef.current.innerHTML = '';
            loadPosts(); 
        }
        catch (error) { toast.error('Failed to post'); }
        finally { setActionLoading(false); }
    };

    const handleReply = async (e, postId, parentReplyId = null) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setActionLoading(true);
        try { await paymentsService.createGroupPostReply({ post: postId, parent_reply: parentReplyId, content: replyContent }); setReplyContent(''); setReplyingTo(null); loadPosts(); }
        catch (error) { toast.error('Failed to reply'); }
        finally { setActionLoading(false); }
    };

    const handleReplyReact = async (replyId, emoji) => {
        try {
            const updatedReply = await paymentsService.reactToGroupPostReply(replyId, emoji);
            setPosts(prev => prev.map(post => {
                const updateReplyInTree = (r) => {
                    if (r.id === replyId) return updatedReply;
                    if (r.child_replies) return { ...r, child_replies: r.child_replies.map(updateReplyInTree) };
                    return r;
                };
                return { ...post, replies: post.replies?.map(updateReplyInTree) };
            }));
        } catch (error) { console.error("Failed to react to reply", error); }
    };

    const handleReplyUpvote = async (replyId) => {
        try {
            const updatedReply = await paymentsService.upvoteGroupPostReply(replyId);
            setPosts(prev => prev.map(post => {
                const updateReplyInTree = (r) => {
                    if (r.id === replyId) return updatedReply;
                    if (r.child_replies) return { ...r, child_replies: r.child_replies.map(updateReplyInTree) };
                    return r;
                };
                return { ...post, replies: post.replies?.map(updateReplyInTree) };
            }));
        } catch (error) { toast.error('Failed to upvote reply'); }
    };

    const handleReact = async (postId, emoji) => {
        setActivePicker(null);
        try {
            const updatedPost = await paymentsService.reactToGroupPost(postId, emoji);
            setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p));
        } catch (error) { console.error("Failed to react", error); }
    };

    const handlePin = async (postId) => {
        try { const updatedPost = await paymentsService.pinGroupPost(postId); setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p)); }
        catch (error) { toast.error('Failed to pin post'); }
    };

    const handleUpvote = async (postId) => {
        try { const updatedPost = await paymentsService.upvoteGroupPost(postId); setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p)); }
        catch (error) { toast.error('Failed to upvote post'); }
    };

    const handleToggleShare = async (postId) => {
        try { const updatedPost = await paymentsService.toggleGroupPostShareability(postId); setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p)); toast.success('Post sharing settings updated'); }
        catch (error) { toast.error('Failed to update sharing settings'); }
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;

    const pinnedPosts = posts.filter(p => p.is_pinned);
    const regularPosts = posts.filter(p => !p.is_pinned);

    const renderReply = (reply, postId, depth = 0) => (
        <div key={reply.id} className="flex gap-2 mb-3 relative">
            {depth > 0 && <div className="absolute -left-3 top-4 w-4 h-4 border-l-2 border-b-2 border-theme rounded-bl-xl opacity-30" />}
            <div className="flex-1 bg-elevated border border-theme rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 relative z-10">
                        <Avatar src={reply.author_avatar} name={reply.author_name} size="sm" />
                        <span className="text-xs font-bold text-primary">{reply.author_name}</span>
                        <span className="text-[10px] text-secondary ml-1">{formatDate(reply.created_at)}</span>
                    </div>
                </div>
                <p className="text-sm text-secondary mb-3">{renderContentWithEmojis(reply.content)}</p>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                    <button onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)} className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
                        <Reply className="w-3.5 h-3.5" /> Reply
                    </button>
                    <button onClick={() => handleReplyUpvote(reply.id)}
                        className={`flex items-center gap-1.5 transition-all duration-300 ${reply.has_upvoted ? 'text-emerald-500 font-bold scale-110' : 'text-secondary hover:text-emerald-400'}`}>
                        <ArrowUpCircle className={`w-4 h-4 ${reply.has_upvoted ? 'fill-emerald-500 text-white' : ''}`} /> {reply.upvote_count || 0}
                    </button>
                    <div className="flex items-center gap-1 flex-wrap">
                        {reply.reaction_summary?.map(s => (
                            <ReactionBubble key={s.emoji} emoji={s.emoji} count={s.count} hasReacted={s.has_reacted} onClick={() => handleReplyReact(reply.id, s.emoji)} />
                        ))}
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setActivePicker(activePicker === `reply-${reply.id}` ? null : `reply-${reply.id}`)}
                            className="p-1 hover:bg-secondary/10 rounded-full text-secondary hover:text-primary transition-colors"
                        >
                            <Smile className="w-3.5 h-3.5" />
                        </button>
                        {activePicker === `reply-${reply.id}` && (
                            <div className="absolute bottom-full left-0 pb-3 z-50">
                                <QuickReactionBar onReact={(emoji) => { handleReplyReact(reply.id, emoji); setActivePicker(null); }} />
                            </div>
                        )}
                    </div>
                </div>
                {replyingTo === reply.id && (
                    <form onSubmit={(e) => handleReply(e, postId, reply.id)} className="mt-3 flex gap-2">
                        <Input className="flex-1 text-xs bg-secondary/10 border-theme" placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} autoFocus />
                        <Button type="submit" variant="primary" disabled={actionLoading || !replyContent.trim()} size="sm" className="h-8 px-3 text-xs whitespace-nowrap">{actionLoading ? '...' : 'Reply'}</Button>
                    </form>
                )}
                {reply.child_replies && reply.child_replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-3 ml-2 border-l-2 border-theme relative">
                        {reply.child_replies.map(child => renderReply(child, postId, depth + 1))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderPost = (post, isPinned) => (
        <Card key={post.id} className={`mb-4 border-l-4 overflow-visible ${isPinned ? 'border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-l-primary'}`}>
            <CardBody className="p-4">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <Avatar src={post.author_avatar} name={post.author_name} size="lg" />
                            <div>
                                <span className="font-semibold text-primary">{post.author_name || 'Group Member'}</span>
                                <span className="text-xs text-secondary ml-2">{formatDate(post.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Pin className="w-3 h-3" /> Pinned</span>}
                            {isAdmin && !isPinned && (
                                <button onClick={() => handlePin(post.id)} className="p-1 hover:bg-secondary/10 rounded-full text-secondary hover:text-amber-500" title="Pin post"><Pin className="w-4 h-4" /></button>
                            )}
                        </div>
                    </div>
                    <p className="text-secondary whitespace-pre-wrap">{renderContentWithEmojis(post.content)}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                        <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-2 text-secondary hover:text-primary transition-all active:scale-95">
                            <div className="p-2 bg-secondary/5 rounded-lg"><Reply className="w-4 h-4" /></div>
                            <span className="font-medium">{post.reply_count || 0} Replies</span>
                        </button>
                        <button onClick={() => handleUpvote(post.id)}
                            className={`flex items-center gap-2 transition-all duration-300 active:scale-95 ${post.has_upvoted ? 'text-emerald-500 font-bold scale-105' : 'text-secondary hover:text-emerald-400'}`}>
                            <div className={`p-2 rounded-lg ${post.has_upvoted ? 'bg-emerald-500/10' : 'bg-secondary/5'}`}>
                                <ArrowUpCircle className={`w-4 h-4 ${post.has_upvoted ? 'fill-emerald-500 text-white' : ''}`} />
                            </div>
                            <span>{post.upvote_count || 0} Upvotes</span>
                        </button>

                        {/* Reactions */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {post.reaction_summary?.map(s => (
                                <ReactionBubble key={s.emoji} emoji={s.emoji} count={s.count} hasReacted={s.has_reacted} onClick={() => handleReact(post.id, s.emoji)} />
                            ))}
                            <div className="relative">
                                <button 
                                    onClick={() => setActivePicker(activePicker === post.id ? null : post.id)}
                                    className="p-2 hover:bg-secondary/10 rounded-lg text-secondary hover:text-primary transition-all"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                {activePicker === post.id && (
                                    <div className="absolute bottom-full left-0 pb-4 z-50">
                                        <QuickReactionBar onReact={(emoji) => handleReact(post.id, emoji)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {post.is_shareable && <button className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors"><Share2 className="w-4 h-4" /> Share</button>}
                            {post.is_forwardable && <button className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors"><Forward className="w-4 h-4" /> Forward</button>}
                            {(isAdmin || post.author === user?.id) && (
                                <button onClick={() => handleToggleShare(post.id)} className="text-[10px] uppercase font-bold text-secondary hover:text-primary underline ml-2">Toggle Share</button>
                            )}
                        </div>
                    </div>

                    {post.replies && post.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-theme space-y-3">
                            {post.replies.map(reply => renderReply(reply, post.id))}
                        </div>
                    )}

                    {replyingTo === post.id && (
                        <form onSubmit={(e) => handleReply(e, post.id)} className="mt-4 flex gap-2">
                            <Input className="flex-1 text-sm bg-elevated border-theme" placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} autoFocus />
                            <Button type="submit" variant="primary" disabled={actionLoading || !replyContent.trim()} size="sm" className="h-10 px-4 whitespace-nowrap">{actionLoading ? '...' : 'Reply'}</Button>
                        </form>
                    )}
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-theme bg-elevated shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-visible">
                <CardBody className="p-4">
                    <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                        <div className="relative">
                            <div
                                ref={composerRef}
                                contentEditable
                                className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none min-h-[100px] text-primary"
                                onInput={(e) => setNewPostContent(e.target.innerHTML)}
                                data-placeholder="Share an update, ask a question, or start a discussion..."
                            ></div>
                            <div className="absolute bottom-3 right-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPostEmojiPicker(!showPostEmojiPicker)}
                                    className="p-1.5 hover:bg-secondary/10 rounded-full text-secondary hover:text-primary transition-colors"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                {showPostEmojiPicker && (
                                    <div className="absolute top-full right-0 mt-2 z-[9999] shadow-2xl rounded-xl overflow-hidden border border-theme">
                                        <Picker 
                                            data={data} 
                                            onEmojiSelect={(emoji) => { 
                                                composerRef.current.focus();
                                                insertHTMLAtCursor(`<em-emoji native="${emoji.native}" set="apple" size="18px"></em-emoji>`);
                                                setNewPostContent(composerRef.current.innerHTML);
                                                setShowPostEmojiPicker(false); 
                                            }} 
                                            set="apple" 
                                            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                            previewPosition="none"
                                            skinTonePosition="none"
                                            backgroundImageFn={(set, sheetSize) => `${window.location.origin}/apple-sheets-64.png`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Visible to all members</span>
                            <Button type="submit" variant="primary" disabled={!newPostContent.trim() || actionLoading} className="px-6 rounded-full font-bold">
                                {actionLoading ? 'Posting...' : 'Post'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            <div className="space-y-4">
                {pinnedPosts.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2"><Pin className="w-4 h-4"/> Pinned Announcements</h3>
                        {pinnedPosts.map(p => renderPost(p, true))}
                    </div>
                )}
                {regularPosts.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Recent Discussions</h3>
                        {regularPosts.map(p => renderPost(p, false))}
                    </div>
                )}
                {posts.length === 0 && (
                    <div className="py-12 text-center text-secondary border-2 border-dashed border-theme rounded-2xl">
                        <MessageCircle className="w-12 h-12 text-tertiary mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-primary mb-1">No discussions yet</h3>
                        <p>Be the first to start a conversation in this group!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupDiscourse;
