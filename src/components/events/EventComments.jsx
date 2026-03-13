/**
 * EventComments Component
 * Threaded comment system with reactions, replies, and card boundaries
 */
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, MoreVertical, Trash2, Heart, Reply, Pin } from 'lucide-react';
import eventsService from '../../services/events.service';
import { formatDistanceToNow } from 'date-fns';

const EventComments = ({ eventId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const inputRef = React.useRef(null);

    useEffect(() => {
        loadComments();
    }, [eventId]);

    const loadComments = async () => {
        try {
            const response = await eventsService.getComments(eventId);
            setComments(response.data || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await eventsService.addComment(eventId, {
                content: newComment,
                parent_id: replyTo
            });
            setNewComment('');
            setReplyTo(null);
            loadComments();
        } catch (error) {
            alert('Failed to post comment');
        }
    };

    const handleDelete = async (commentId) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            try {
                await eventsService.deleteComment(commentId);
                loadComments();
            } catch (error) {
                alert('Failed to delete comment');
            }
        }
    };

    const handleReply = (commentId) => {
        setReplyTo(commentId);
        // Focus the input and scroll to it
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
                {replyTo && (
                    <div className="text-sm text-secondary flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
                        <Reply className="w-3 h-3 text-primary-500" />
                        <span>Replying to comment</span>
                        <button
                            type="button"
                            onClick={() => setReplyTo(null)}
                            className="text-red-500 hover:underline ml-auto text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                        className="flex-1 px-4 py-2 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary placeholder-tertiary"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Post</span>
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-tertiary">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-tertiary" />
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={handleReply}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentItem = ({ comment, onReply, onDelete, depth = 0 }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes_count || 0);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
    };

    const safeDate = (dateStr) => {
        try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
        catch { return ''; }
    };

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-theme/50 pl-4' : ''}`}>
            {/* Card boundary */}
            <div className="border border-theme/30 rounded-xl p-3 mb-2 bg-elevated/50 hover:bg-elevated transition-colors">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {comment.user_name?.[0]?.toUpperCase() || 'U'}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="font-semibold text-primary text-sm">{comment.user_name}</span>
                                {comment.is_pinned && (
                                    <Pin className="w-3 h-3 inline ml-1 text-primary-600" />
                                )}
                                <span className="text-xs text-tertiary ml-2">
                                    {safeDate(comment.created_at)}
                                    {comment.is_edited && ' (edited)'}
                                </span>
                            </div>

                            {/* Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 hover:bg-secondary rounded transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4 text-tertiary" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-1 w-32 bg-elevated rounded-lg shadow-lg border border-theme py-1 z-10">
                                        <button
                                            onClick={() => {
                                                onDelete(comment.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-secondary flex items-center gap-2 text-red-500 text-sm"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-secondary text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>

                        {/* Actions Row — Heart + Reply */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-1 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-tertiary hover:text-red-500'}`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                                {likeCount > 0 && <span>{likeCount}</span>}
                            </button>
                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1 text-xs font-medium text-tertiary hover:text-primary-500 transition-colors"
                            >
                                <Reply className="w-3.5 h-3.5" />
                                Reply
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-1 space-y-1">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventComments;
