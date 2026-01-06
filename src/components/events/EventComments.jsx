/**
 * EventComments Component
 * Threaded comment system with replies
 */
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, MoreVertical, Trash2, Edit2, Pin } from 'lucide-react';
import eventsService from '../../services/events.service';
import { formatDistanceToNow } from 'date-fns';

const EventComments = ({ eventId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    {replyTo && (
                        <div className="absolute -top-8 left-0 text-sm text-gray-600 flex items-center gap-2">
                            <span>Replying to comment</span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="text-red-600 hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Post</span>
                </button>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            onReply={setReplyTo}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Comment = ({ comment, onReply, onDelete, depth = 0 }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {comment.user_name?.[0]?.toUpperCase() || 'U'}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="font-semibold text-gray-900">{comment.user_name}</span>
                                {comment.is_pinned && (
                                    <Pin className="w-3 h-3 inline ml-1 text-primary-600" />
                                )}
                                <span className="text-xs text-gray-500 ml-2">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    {comment.is_edited && ' (edited)'}
                                </span>
                            </div>

                            {/* Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                        <button
                                            onClick={() => {
                                                onDelete(comment.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => onReply(comment.id)}
                        className="text-sm text-gray-600 hover:text-primary-600 mt-1 font-medium"
                    >
                        Reply
                    </button>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                                <Comment
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
            </div>
        </div>
    );
};

export default EventComments;
