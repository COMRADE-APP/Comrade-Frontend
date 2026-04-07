/**
 * OpinionComment Component
 * X/Twitter-style comment cards with reply-to user tag links,
 * nested reply threading, full interaction icons, three-dot menu,
 * and double-click golden like.
 *
 * Icon order: Like → Reply → Repost → Quote → Save → Share
 */
import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart, MessageCircle, Repeat2, Bookmark, Quote,
    MoreHorizontal, ChevronDown, ChevronUp, Send,
    EyeOff, Ban, Flag, HelpCircle
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateFormatter';
import { renderContentWithMentions } from '../../utils/textFormatters';

const OpinionComment = ({
    comment,
    onLike,
    onReply,
    onRepost,
    onHide,
    onBlock,
    onReport,
    opinionId,
    depth = 0,
    maxDepth = 3,
    currentUser,
    parentUser = null
}) => {
    const navigate = useNavigate();
    const [showReplies, setShowReplies] = useState(depth < 2);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isLiked, setIsLiked] = useState(comment.is_liked || false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [goldenLikeAnim, setGoldenLikeAnim] = useState(false);
    const lastTapRef = useRef(0);

    const hasReplies = comment.replies && comment.replies.length > 0;
    const canReply = depth < maxDepth;
    const commentUser = comment.user || {};
    
    const isEntityAuthor = !!comment.entity_author;
    const entityInfo = comment.entity_author;
    
    const userName = isEntityAuthor 
        ? entityInfo.name 
        : (`${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || 'User');
    
    const userHandle = isEntityAuthor
        ? (entityInfo.name.replace(/\s+/g, '').toLowerCase())
        : (commentUser.username || commentUser.email?.split('@')[0] || 'user');
        
    const avatarUrl = isEntityAuthor ? entityInfo.avatar : commentUser.avatar_url;
    
    const roleBadge = isEntityAuthor && entityInfo.poster_role_display ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-primary border border-theme ml-1">
            {entityInfo.poster_role_display.icon && <span>{entityInfo.poster_role_display.icon}</span>}
            {entityInfo.poster_role_display.label}
        </span>
    ) : null;

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

    const handleCommentClick = () => {
        if (opinionId) {
            navigate(`/opinions/${opinionId}/comments/${comment.id}`);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/opinions/${opinionId || ''}/comments/${comment.id}`;
        if (navigator.share) {
            navigator.share({ title: 'Comment', text: comment.content?.substring(0, 100), url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    // Double-click golden like
    const handleDoubleClick = useCallback(() => {
        if (!isLiked) handleLike();
        setGoldenLikeAnim(true);
        setTimeout(() => setGoldenLikeAnim(false), 800);
    }, [isLiked]);

    const handleTouchEnd = useCallback(() => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) handleDoubleClick();
        lastTapRef.current = now;
    }, [handleDoubleClick]);

    return (
        <div className={depth > 0 ? 'ml-6 sm:ml-10' : ''}>
            <div className={`relative ${depth > 0 ? 'border-l-2 border-primary-100 dark:border-primary-800 pl-4' : ''}`}>
                <article
                    className="bg-elevated rounded-xl border border-theme p-4 hover:bg-secondary/30 transition-colors relative overflow-hidden"
                    onDoubleClick={handleDoubleClick}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Golden Like burst animation */}
                    {goldenLikeAnim && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                            <Heart className="text-yellow-400 fill-yellow-400 drop-shadow-lg" style={{ width: 60, height: 60, animation: 'goldenLikeBurst 0.8s ease-out forwards' }} />
                        </div>
                    )}
                    {/* Faint double-click heart hint (bottom-right) */}
                    <div className="absolute right-3 bottom-3 pointer-events-none select-none opacity-[0.04] z-0">
                        <Heart className="w-12 h-12 text-red-400" />
                    </div>

                    {/* Reply-to tag */}
                    {parentUser && depth > 0 && (
                        <div className="mb-2 text-sm text-secondary">
                            Replying to{' '}
                            <Link to={`/profile/${parentUser.id}`} className="text-primary-600 hover:underline font-medium">
                                @{parentUser.username || parentUser.first_name || 'user'}
                            </Link>
                        </div>
                    )}

                    {/* Header row */}
                    <div className="flex items-start gap-3 relative z-[1]">
                        <Link to={`/profile/${commentUser.id}`} className="shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    (isEntityAuthor ? entityInfo.name[0] : (commentUser.first_name?.[0] || 'U')).toUpperCase()
                                )}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            {/* Name + three-dot menu */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link to={`/profile/${commentUser.id}`} className="font-semibold text-primary hover:underline text-sm flex items-center">
                                        {userName}
                                        {roleBadge}
                                    </Link>
                                    <span className="text-secondary text-sm">@{userHandle}</span>
                                    <span className="text-secondary">·</span>
                                    <span className="text-secondary text-sm">{formatTimeAgo(comment.created_at)}</span>
                                </div>

                                {/* Three-dot options menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1.5 text-tertiary hover:text-primary hover:bg-secondary rounded-full"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                            <div className="absolute right-0 top-7 z-20 bg-elevated rounded-xl shadow-lg border border-theme py-1 w-48">
                                                <button
                                                    onClick={() => { onHide?.(comment.id); setShowMenu(false); }}
                                                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                                >
                                                    <EyeOff size={14} />
                                                    I don't like this
                                                </button>
                                                {commentUser.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => { onBlock?.(commentUser.id); setShowMenu(false); }}
                                                        className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                                    >
                                                        <Ban size={14} />
                                                        Block {commentUser.first_name}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { onReport?.(comment.id); setShowMenu(false); }}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-secondary flex items-center gap-3"
                                                >
                                                    <Flag size={14} />
                                                    Report
                                                </button>
                                                <hr className="my-1 border-theme" />
                                                <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3">
                                                    <HelpCircle size={14} />
                                                    Help
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Clickable content → Comment Detail */}
                            <div onClick={handleCommentClick} className="cursor-pointer">
                                <p className="text-primary mt-1.5 whitespace-pre-wrap leading-relaxed text-[15px]">
                                    {renderContentWithMentions(comment.content, navigate)}
                                </p>
                            </div>

                            {/* Media */}
                            {comment.media_url && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-theme max-w-md">
                                    <img src={comment.media_url} alt="" className="w-full max-h-64 object-cover" />
                                </div>
                            )}

                            {/* ── Action bar: Like → Reply → Repost → Quote → Save → Share ── */}
                            <div className="mt-4 flex items-center justify-between text-secondary">
                                {/* Like */}
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}
                                >
                                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                                    {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
                                </button>

                                {/* Reply */}
                                {canReply && (
                                    <button
                                        onClick={() => setShowReplyInput(!showReplyInput)}
                                        className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                        {hasReplies && <span className="text-sm">{comment.replies.length}</span>}
                                    </button>
                                )}

                                {/* Repost */}
                                <button
                                    className="flex items-center gap-1.5 hover:text-green-500 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRepost && onRepost(comment.id);
                                    }}
                                >
                                    <Repeat2 size={18} />
                                </button>

                                {/* Quote */}
                                <button
                                    className="hover:text-primary-600 transition-colors"
                                    title="Quote this comment"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuote && onQuote(comment);
                                    }}
                                >
                                    <Quote size={18} />
                                </button>

                                {/* Save (Bookmark) */}
                                <button
                                    className={`hover:text-yellow-500 transition-colors ${isBookmarked ? 'text-yellow-500' : ''}`}
                                    onClick={() => setIsBookmarked(!isBookmarked)}
                                >
                                    <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                                </button>

                                {/* Share */}
                                <button
                                    className="hover:text-primary-500 transition-colors"
                                    onClick={handleShare}
                                >
                                    <Send size={18} className="-rotate-12" />
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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
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

                    {/* Golden Like keyframes */}
                    <style>{`
                        @keyframes goldenLikeBurst {
                            0% { transform: scale(0.3); opacity: 1; }
                            50% { transform: scale(1.2); opacity: 0.9; }
                            100% { transform: scale(1.6); opacity: 0; }
                        }
                    `}</style>
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
                            onHide={onHide}
                            onBlock={onBlock}
                            onReport={onReport}
                            opinionId={opinionId}
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
