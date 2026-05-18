import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { MessageCircle, Pin, Heart, ThumbsUp, Smile, Reply, Megaphone, Check, Share2, Forward, ArrowUpCircle } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const GroupDiscourse = ({ groupId, isAdmin }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [posts, setPosts] = useState([]);
    
    const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯'];
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [activePicker, setActivePicker] = useState(null); // ID of post/reply showing emoji picker

    useEffect(() => {
        loadPosts();
    }, [groupId]);

    const loadPosts = async (silent = false) => {
        if (!groupId) return;
        if (!silent) setLoading(true);
        try {
            const res = await paymentsService.getGroupPosts(groupId);
            setPosts(Array.isArray(res) ? res : res?.results || []);
        } catch (error) {
            console.error('Failed to list group posts:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        setActionLoading(true);
        try {
            await paymentsService.createGroupPost({
                group: groupId,
                content: newPostContent
            });
            setNewPostContent('');
            loadPosts();
        } catch (error) {
            toast.error('Failed to post');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReply = async (e, postId, parentReplyId = null) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setActionLoading(true);
        try {
            await paymentsService.createGroupPostReply({
                post: postId,
                parent_reply: parentReplyId,
                content: replyContent
            });
            setReplyContent('');
            setReplyingTo(null);
            loadPosts();
        } catch (error) {
            toast.error('Failed to reply');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReplyReact = async (replyId, emoji) => {
        try {
            const updatedReply = await paymentsService.reactToGroupPostReply(replyId, emoji);
            // Deep update for nested replies
            setPosts(prev => prev.map(post => {
                const updateReplyInTree = (r) => {
                    if (r.id === replyId) return updatedReply;
                    if (r.child_replies) {
                        return { ...r, child_replies: r.child_replies.map(updateReplyInTree) };
                    }
                    return r;
                };
                return { ...post, replies: post.replies?.map(updateReplyInTree) };
            }));
        } catch (error) {
            console.error("Failed to react to reply", error);
        }
    };

    const handleReplyUpvote = async (replyId) => {
        try {
            const updatedReply = await paymentsService.upvoteGroupPostReply(replyId);
            setPosts(prev => prev.map(post => {
                const updateReplyInTree = (r) => {
                    if (r.id === replyId) return updatedReply;
                    if (r.child_replies) {
                        return { ...r, child_replies: r.child_replies.map(updateReplyInTree) };
                    }
                    return r;
                };
                return { ...post, replies: post.replies?.map(updateReplyInTree) };
            }));
        } catch (error) {
            toast.error('Failed to upvote reply');
        }
    };

    const handleReact = async (postId, emoji) => {
        try {
            const updatedPost = await paymentsService.reactToGroupPost(postId, emoji);
            setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p));
        } catch (error) {
            console.error("Failed to react", error);
        }
    };

    const handlePin = async (postId) => {
        try {
            const updatedPost = await paymentsService.pinGroupPost(postId);
            setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p));
        } catch (error) {
            toast.error('Failed to pin post');
        }
    };

    const handleUpvote = async (postId) => {
        try {
            const updatedPost = await paymentsService.upvoteGroupPost(postId);
            // Preserve replies locally to avoid flicker
            setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p));
        } catch (error) {
            toast.error('Failed to upvote post');
        }
    };

    const handleToggleShare = async (postId) => {
        try {
            const updatedPost = await paymentsService.toggleGroupPostShareability(postId);
            setPosts(prev => prev.map(p => p.id === postId ? { ...updatedPost, replies: p.replies } : p));
            toast.success('Post sharing settings updated');
        } catch (error) {
            toast.error('Failed to update sharing settings');
        }
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;

    const pinnedPosts = posts.filter(p => p.is_pinned);
    const regularPosts = posts.filter(p => !p.is_pinned);

    const renderReply = (reply, postId, depth = 0) => (
        <div key={reply.id} className="flex gap-2 mb-3 relative">
            {depth > 0 && (
                <div className="absolute -left-3 top-4 w-4 h-4 border-l-2 border-b-2 border-theme rounded-bl-xl opacity-30" />
            )}
            <div className="w-6 h-6 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary mt-1 z-10 relative">
                {reply.author_avatar ? (
                    <img src={reply.author_avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                    reply.author_name?.charAt(0) || 'U'
                )}
            </div>
            <div className="flex-1 bg-elevated border border-theme rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{reply.author_name}</span>
                        <span className="text-[10px] text-secondary">{formatDate(reply.created_at)}</span>
                    </div>
                </div>
                <p className="text-sm text-secondary mb-3">{reply.content}</p>

                <div className="flex items-center gap-4 text-xs">
                    <button onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)} className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
                        <Reply className="w-3.5 h-3.5" /> Reply
                    </button>
                    
                    <button 
                        onClick={() => handleReplyUpvote(reply.id)} 
                        className={`flex items-center gap-1.5 transition-all duration-300 ${reply.has_upvoted ? 'text-blue-500 font-bold scale-110' : 'text-secondary hover:text-blue-400'}`}
                        title={reply.has_upvoted ? 'Remove upvote' : 'Upvote'}
                    >
                        <ArrowUpCircle className={`w-4 h-4 ${reply.has_upvoted ? 'fill-blue-500 text-white' : ''}`} /> 
                        {reply.upvote_count || 0}
                    </button>

                    <div className="flex items-center gap-1.5">
                        {/* Reaction Summary Bubbles */}
                        {reply.reaction_summary?.map(s => (
                            <button 
                                key={s.emoji}
                                onClick={() => handleReplyReact(reply.id, s.emoji)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition-all active:scale-95
                                    ${s.has_reacted 
                                        ? 'bg-primary/20 border-primary/50 text-primary font-bold shadow-sm' 
                                        : 'bg-secondary/5 border-theme text-secondary hover:bg-secondary/10'}`}
                            >
                                <span className="text-xs">{s.emoji || '👍'}</span>
                                {s.count > 1 && <span>{s.count}</span>}
                            </button>
                        ))}

                        {/* Add Reaction Button */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setActivePicker(reply.id)}
                            onMouseLeave={() => setActivePicker(null)}
                        >
                            <button className="p-1 hover:bg-secondary/10 rounded-full text-secondary hover:text-primary transition-colors">
                                <Smile className="w-3.5 h-3.5" />
                            </button>
                            
                            {activePicker === reply.id && (
                                <div className="absolute bottom-full left-0 pb-3 z-50">
                                    <div className="flex items-center gap-1 bg-elevated border border-theme p-1.5 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                        {COMMON_EMOJIS.map(emoji => (
                                            <button 
                                                key={emoji}
                                                onClick={() => {
                                                    handleReplyReact(reply.id, emoji);
                                                    setActivePicker(null);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-secondary/10 rounded-lg text-lg transition-transform hover:scale-125"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {replyingTo === reply.id && (
                    <form onSubmit={(e) => handleReply(e, postId, reply.id)} className="mt-3 flex gap-2">
                        <Input
                            className="flex-1 text-xs bg-secondary/10 border-theme"
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit" variant="primary" disabled={actionLoading || !replyContent.trim()} size="sm" className="h-8 px-3 text-xs whitespace-nowrap">
                            {actionLoading ? '...' : 'Reply'}
                        </Button>
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
        <Card key={post.id} className={`mb-4 border-l-4 ${isPinned ? 'border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-l-primary'}`}>
            <CardBody className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="font-bold text-primary">{post.author_name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <span className="font-semibold text-primary">{post.author_name || 'Group Member'}</span>
                                <span className="text-xs text-secondary ml-2">{formatDate(post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Pin className="w-3 h-3" /> Pinned</span>}
                                {isAdmin && !isPinned && (
                                    <button onClick={() => handlePin(post.id)} className="p-1 hover:bg-secondary/10 rounded-full text-secondary hover:text-amber-500" title="Pin post">
                                        <Pin className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-secondary whitespace-pre-wrap">{post.content}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                            <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-2 text-secondary hover:text-primary transition-all active:scale-95">
                                <div className="p-2 bg-secondary/5 rounded-lg group-hover:bg-primary/10">
                                    <Reply className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{post.reply_count || 0} Replies</span>
                            </button>
                            
                            <button 
                                onClick={() => handleUpvote(post.id)} 
                                className={`flex items-center gap-2 transition-all duration-300 active:scale-95 ${post.has_upvoted ? 'text-blue-500 font-bold scale-105' : 'text-secondary hover:text-blue-400'}`}
                            >
                                <div className={`p-2 rounded-lg ${post.has_upvoted ? 'bg-blue-500/10' : 'bg-secondary/5'}`}>
                                    <ArrowUpCircle className={`w-4 h-4 ${post.has_upvoted ? 'fill-blue-500 text-white' : ''}`} /> 
                                </div>
                                <span>{post.upvote_count || 0} Upvotes</span>
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Reaction Summary Bubbles */}
                                <div className="flex flex-wrap gap-1.5">
                                    {post.reaction_summary?.map(s => (
                                        <button 
                                            key={s.emoji}
                                            onClick={() => handleReact(post.id, s.emoji)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all active:scale-90
                                                ${s.has_reacted 
                                                    ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-sm' 
                                                    : 'bg-secondary/5 border-theme text-secondary hover:bg-secondary/10'}`}
                                        >
                                            <span className="text-base">{s.emoji || '👍'}</span>
                                            {s.count > 1 && <span className="text-[10px]">{s.count}</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Add Reaction Button */}
                                <div 
                                    className="relative"
                                    onMouseEnter={() => setActivePicker(post.id)}
                                    onMouseLeave={() => setActivePicker(null)}
                                >
                                    <button className="p-2 hover:bg-secondary/10 rounded-lg text-secondary hover:text-primary transition-all">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    
                                    {activePicker === post.id && (
                                        <div className="absolute bottom-full left-0 pb-4 z-50">
                                            <div className="flex items-center gap-1.5 bg-elevated border border-theme p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3">
                                                {COMMON_EMOJIS.map(emoji => (
                                                    <button 
                                                        key={emoji}
                                                        onClick={() => {
                                                            handleReact(post.id, emoji);
                                                            setActivePicker(null);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center hover:bg-secondary/10 rounded-xl text-xl transition-transform hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                {post.is_shareable && (
                                    <button className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                )}
                                {post.is_forwardable && (
                                    <button className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
                                        <Forward className="w-4 h-4" /> Forward
                                    </button>
                                )}
                                {(isAdmin || post.author === user?.id) && (
                                    <button 
                                        onClick={() => handleToggleShare(post.id)}
                                        className="text-[10px] uppercase font-bold text-secondary hover:text-primary underline ml-2"
                                    >
                                        Toggle Share
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Replies Section */}
                        {post.replies && post.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-theme space-y-3">
                                {post.replies.map(reply => renderReply(reply, post.id))}
                            </div>
                        )}

                        {/* Reply Input for Post */}
                        {replyingTo === post.id && (
                            <form onSubmit={(e) => handleReply(e, post.id)} className="mt-4 flex gap-2">
                                <Input
                                    className="flex-1 text-sm bg-elevated border-theme"
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    autoFocus
                                />
                                <Button type="submit" variant="primary" disabled={actionLoading || !replyContent.trim()} size="sm" className="h-10 px-4 whitespace-nowrap">
                                    {actionLoading ? '...' : 'Reply'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardBody className="p-4">
                    <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Share an update, ask a question, or start a discussion..."
                            className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none min-h-[100px] text-primary"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Visible to all members</span>
                            <Button type="submit" variant="primary" disabled={!newPostContent.trim() || actionLoading} className="px-6 rounded-full font-bold">
                                {actionLoading ? 'Posting...' : 'Post Options'}
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
