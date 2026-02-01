/**
 * OpinionComment Component
 * FeedItem-like styling for opinion comments with nested reply support
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, MessageCircle, Repeat2, Share, Bookmark,
    MoreHorizontal, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateFormatter';

const OpinionComment = ({
    comment,
    onLike,
    onReply,
    onRepost,
    depth = 0,
    maxDepth = 3,
    currentUser
}) => {
    const [showReplies, setShowReplies] = useState(depth < 2);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isLiked, setIsLiked] = useState(comment.is_liked || false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasReplies = comment.replies && comment.replies.length > 0;
    const canReply = depth < maxDepth;

    const handleLike = async () => {
        if (onLike) {
            const result = await onLike(comment.id);
            if (result) {
                setIsLiked(result.liked);
                setLikesCount(result.likes_count);
            }
        }
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onReply(comment.id, replyContent.trim());
            setReplyContent('');
            setShowReplyInput(false);
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Indentation based on depth
    const indentClass = depth > 0 ? 'ml-10' : '';
    const borderClass = depth > 0 ? 'border-l-2 border-primary-100 pl-4' : '';

    return (
        <div className={`${indentClass}`}>
            <div className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow ${borderClass}`}>
                {/* Header: Avatar, Name, Time */}
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Link to={`/profile/${comment.user?.id}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                            {comment.user?.avatar_url ? (
                                <img
                                    src={comment.user.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (comment.user?.first_name?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                    </Link>

                    {/* Name and content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                to={`/profile/${comment.user?.id}`}
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                {comment.user?.first_name} {comment.user?.last_name}
                            </Link>

                            {/* Reply indicator */}
                            {depth > 0 && (
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                                    Reply
                                </span>
                            )}

                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500 text-sm">
                                {formatTimeAgo(comment.created_at)}
                            </span>
                        </div>

                        {/* Comment content */}
                        <p className="text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                        </p>

                        {/* Media if any */}
                        {comment.media_url && (
                            <div className="mt-3 rounded-xl overflow-hidden max-w-md">
                                <img
                                    src={comment.media_url}
                                    alt=""
                                    className="w-full max-h-64 object-cover"
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 flex items-center gap-4 text-gray-500">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}
                            >
                                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                <span className="text-sm">{likesCount || ''}</span>
                            </button>

                            {canReply && (
                                <button
                                    onClick={() => setShowReplyInput(!showReplyInput)}
                                    className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
                                >
                                    <MessageCircle size={16} />
                                    <span className="text-sm">Reply</span>
                                </button>
                            )}

                            {hasReplies && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium"
                                >
                                    {showReplies ? (
                                        <>
                                            <ChevronUp size={14} />
                                            Hide replies
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} />
                                            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Reply input */}
                        {showReplyInput && currentUser && (
                            <div className="mt-3 flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                    {currentUser?.avatar_url ? (
                                        <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser?.first_name?.[0] || 'U'
                                    )}
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                                    />
                                    <button
                                        onClick={handleSubmitReply}
                                        disabled={!replyContent.trim() || isSubmitting}
                                        className="px-3 py-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Nested replies */}
            {hasReplies && showReplies && (
                <div className="mt-3 space-y-3">
                    {comment.replies.map(reply => (
                        <OpinionComment
                            key={reply.id}
                            comment={reply}
                            onLike={onLike}
                            onReply={onReply}
                            onRepost={onRepost}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OpinionComment;
