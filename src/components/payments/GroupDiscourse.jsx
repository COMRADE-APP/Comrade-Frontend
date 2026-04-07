import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { MessageCircle, Pin, Heart, ThumbsUp, Smile, Reply, Megaphone, Check } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../contexts/AuthContext';

const GroupDiscourse = ({ groupId, isAdmin }) => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [groupId]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const res = await paymentsService.getGroupPosts(groupId);
            setPosts(Array.isArray(res) ? res : res?.results || []);
        } catch (error) {
            console.error('Failed to list group posts:', error);
        } finally {
            setLoading(false);
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
            alert('Failed to post');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReply = async (e, postId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setActionLoading(true);
        try {
            await paymentsService.createGroupPostReply({
                post: postId,
                content: replyContent
            });
            setReplyContent('');
            setReplyingTo(null);
            loadPosts();
        } catch (error) {
            alert('Failed to reply');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReact = async (postId, emoji) => {
        try {
            await paymentsService.reactToGroupPost(postId, emoji);
            loadPosts();
        } catch (error) {
            console.error("Failed to react", error);
        }
    };

    const handlePin = async (postId) => {
        try {
            await paymentsService.pinGroupPost(postId);
            loadPosts();
        } catch (error) {
            alert('Failed to pin post');
        }
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;

    const pinnedPosts = posts.filter(p => p.is_pinned);
    const regularPosts = posts.filter(p => !p.is_pinned);

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

                        <div className="mt-4 flex items-center gap-4 text-sm">
                            <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
                                <Reply className="w-4 h-4" /> {post.replies?.length || 0} Replies
                            </button>
                            <div className="flex items-center gap-1 bg-secondary/5 rounded-full border border-theme px-1.5 py-0.5">
                                <button onClick={() => handleReact(post.id, '👍')} className="p-1 hover:bg-secondary/20 rounded-full text-lg">👍</button>
                                <button onClick={() => handleReact(post.id, '🔥')} className="p-1 hover:bg-secondary/20 rounded-full text-lg">🔥</button>
                                <span className="text-xs font-semibold px-2 text-primary">{Object.keys(post.reactions || {}).length > 0 ? Object.values(post.reactions).reduce((a, b) => a + b, 0) : 0}</span>
                            </div>
                        </div>

                        {/* Replies Section */}
                        {post.replies && post.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-theme space-y-3">
                                {post.replies.map(reply => (
                                    <div key={reply.id} className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary mt-1">
                                            {reply.author_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 bg-elevated border border-theme rounded-xl p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-primary">{reply.author_name}</span>
                                                <span className="text-[10px] text-secondary">{formatDate(reply.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-secondary">{reply.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reply Input */}
                        {replyingTo === post.id && (
                            <form onSubmit={(e) => handleReply(e, post.id)} className="mt-4 pl-8 flex gap-2">
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
