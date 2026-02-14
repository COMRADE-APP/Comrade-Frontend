/**
 * OpinionComment Component
 * X/Twitter-style comment cards with reply-to user tag links
 * and nested reply threading
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
    currentUser,
    parentUser = null
}) => {
    const [showReplies, setShowReplies] = useState(depth < 2);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isLiked, setIsLiked] = useState(comment.is_liked || false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasReplies = comment.replies && comment.replies.length > 0;
    const canReply = depth < maxDepth;
    const commentUser = comment.user || {};
    const userName = `${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || 'User';
    const userHandle = commentUser.username || commentUser.email?.split('@')[0] || 'user';

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

    return (
        <div className={depth > 0 ? 'ml-6 sm:ml-10' : ''}>
            {/* Connecting thread line for nested replies */}
            <div className={`relative ${depth > 0 ? 'border-l-2 border-primary-100 dark:border-primary-800 pl-4' : ''}`}>
                <article className="bg-elevated rounded-xl border border-theme p-4 hover:bg-secondary/30 transition-colors">
                    {/* Reply-to tag (X-style) */}
                    {parentUser && depth > 0 && (
                        <div className="mb-2 text-sm text-secondary">
                            Replying to{' '}
                            <Link
                                to={`/profile/${parentUser.id}`}
                                className="text-primary-600 hover:underline font-medium"
                            >
                                @{parentUser.username || parentUser.first_name || 'user'}
                            </Link>
                        </div>
                    )}

                    {/* Header row: avatar + name + handle + time */}
                    <div className="flex items-start gap-3">
                        <Link to={`/profile/${commentUser.id}`} className="shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                {commentUser.avatar_url ? (
                                    <img src={commentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    (commentUser.first_name?.[0] || 'U').toUpperCase()
                                )}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            {/* Name row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Link to={`/profile/${commentUser.id}`} className="font-semibold text-primary hover:underline text-sm">
                                    {userName}
                                </Link>
                                <span className="text-secondary text-sm">@{userHandle}</span>
                                <span className="text-secondary">·</span>
                                <span className="text-secondary text-sm">{formatTimeAgo(comment.created_at)}</span>
                            </div>

                            {/* Content */}
                            <p className="text-primary mt-1.5 whitespace-pre-wrap leading-relaxed text-[15px]">
                                {comment.content}
                            </p>

                            {/* Media */}
                            {comment.media_url && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-theme max-w-md">
                                    <img src={comment.media_url} alt="" className="w-full max-h-64 object-cover" />
                                </div>
                            )}

                            {/* Action bar — X-style icons row */}
                            <div className="mt-3 flex items-center justify-between max-w-xs">
                                {/* Reply */}
                                {canReply && (
                                    <button
                                        onClick={() => setShowReplyInput(!showReplyInput)}
                                        className="flex items-center gap-1.5 text-secondary hover:text-primary-500 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-full group-hover:bg-primary-500/10 transition-colors">
                                            <MessageCircle size={16} />
                                        </div>
                                        {hasReplies && (
                                            <span className="text-xs">{comment.replies.length}</span>
                                        )}
                                    </button>
                                )}

                                {/* Repost */}
                                <button className="flex items-center gap-1.5 text-secondary hover:text-green-500 transition-colors group">
                                    <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                                        <Repeat2 size={16} />
                                    </div>
                                </button>

                                {/* Like */}
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-red-500' : 'text-secondary hover:text-red-500'}`}
                                >
                                    <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                                        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                    </div>
                                    {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
                                </button>

                                {/* Share */}
                                <button className="flex items-center gap-1.5 text-secondary hover:text-primary-500 transition-colors group">
                                    <div className="p-1.5 rounded-full group-hover:bg-primary-500/10 transition-colors">
                                        <Share size={16} />
                                    </div>
                                </button>
                            </div>

                            {/* Show/hide replies toggle */}
                            {hasReplies && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="mt-2 flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium"
                                >
                                    {showReplies ? (
                                        <>
                                            <ChevronUp size={14} />
                                            Hide replies
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} />
                                            Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                        </>
                                    )}
                                </button>
                            )}

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
                                            placeholder={`Reply to @${userHandle}...`}
                                            className="flex-1 px-3 py-1.5 text-sm bg-secondary border border-theme rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                                            autoFocus
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
                </article>
            </div>

            {/* Nested replies */}
            {hasReplies && showReplies && (
                <div className="mt-2 space-y-2">
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
                            parentUser={commentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OpinionComment;
