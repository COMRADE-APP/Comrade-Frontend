import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart, MessageCircle, Repeat2, Share, Bookmark, Quote, Send,
    MoreHorizontal, UserPlus, Flag, EyeOff, HelpCircle,
    Ban, ExternalLink, Image, FileText, Play, X
} from 'lucide-react';
import opinionsService from '../../services/opinions.service';
import { renderContentWithMentions } from '../../utils/textFormatters';

/**
 * FeedItem - Unified feed item component for opinions, research, articles, announcements, products
 */
const FeedItem = ({
    item,
    onLike,
    onComment,
    onRepost,
    onShare,
    onBookmark,
    onFollow,
    onHide,
    onReport,
    onBlock,
}) => {
    const navigate = useNavigate();
    const [showOptions, setShowOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(item.is_liked || false);
    const [isReposted, setIsReposted] = useState(item.is_reposted || false);
    const [isBookmarked, setIsBookmarked] = useState(item.is_bookmarked || false);
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [repostsCount, setRepostsCount] = useState(item.reposts_count || 0);
    const [showRepostersModal, setShowRepostersModal] = useState(false);
    const [reposters, setReposters] = useState([]);
    const [loadingReposters, setLoadingReposters] = useState(false);
    const [goldenLikeAnim, setGoldenLikeAnim] = useState(false);
    const lastTapRef = useRef(0);

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

    const openRepostersModal = async () => {
        setShowRepostersModal(true);
        if (reposters.length === 0) {
            setLoadingReposters(true);
            try {
                // Try to fetch reposters; fall back gracefully
                const res = await opinionsService.getAll({ repost_of: item.id });
                const results = Array.isArray(res) ? res : res?.results || [];
                setReposters(results.map(r => r.user || r.reposted_by_user).filter(Boolean));
            } catch { setReposters([]); }
            finally { setLoadingReposters(false); }
        }
    };

    const handleLike = async () => {
        if (onLike) {
            const result = await onLike(item.id);
            if (result) {
                setIsLiked(result.liked);
                setLikesCount(result.likes_count);
            }
        }
    };

    const handleRepost = async () => {
        if (onRepost) {
            const result = await onRepost(item.id);
            if (result) {
                setIsReposted(result.reposted);
                setRepostsCount(result.reposts_count);
            }
        }
    };

    const handleShare = async () => {
        // Native share or copy link
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title || 'Check this out',
                    text: item.content?.substring(0, 100),
                    url: window.location.origin + (item.action_url || `/opinions/${item.id}`)
                });
                if (onShare) onShare(item.id);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Copy to clipboard
            navigator.clipboard.writeText(
                window.location.origin + (item.action_url || `/opinions/${item.id}`)
            );
            if (onShare) onShare(item.id);
        }
    };

    const handleBookmark = async () => {
        if (onBookmark) {
            const result = await onBookmark(item.id);
            if (result) {
                setIsBookmarked(result.bookmarked);
            }
        }
    };

    // Category badge color mapping
    const categoryColors = {
        opinion: 'bg-blue-100 text-blue-800',
        research: 'bg-purple-100 text-purple-800',
        article: 'bg-indigo-100 text-indigo-800',
        announcement: 'bg-yellow-100 text-yellow-800',
        product: 'bg-green-100 text-green-800',
    };

    const contentType = item.content_type || 'opinion';
    const categoryLabel = item.category_label || contentType.charAt(0).toUpperCase() + contentType.slice(1);

    const isRepostItem = item.is_repost && item.reposted_by_user;

    return (
        <div
            className={`relative rounded-xl transition-shadow hover:shadow-md overflow-hidden ${isRepostItem
                ? 'border-2 border-amber-400/60 bg-gradient-to-b from-amber-50/40 to-transparent dark:from-amber-900/10 dark:to-transparent'
                : 'bg-elevated border border-theme'
            } p-4`}
            onDoubleClick={handleDoubleClick}
            onTouchEnd={handleTouchEnd}
        >
            {/* Golden Like burst animation */}
            {goldenLikeAnim && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <Heart className="text-yellow-400 fill-yellow-400 drop-shadow-lg" style={{ width: 80, height: 80, animation: 'goldenLikeBurst 0.8s ease-out forwards' }} />
                </div>
            )}
            {/* Faint double-click heart hint (bottom-right) */}
            <div className="absolute right-4 bottom-4 pointer-events-none select-none opacity-[0.04] z-0">
                <Heart className="w-16 h-16 text-red-400" />
            </div>
            {/* Repost header – gold accent */}
            {isRepostItem && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-3 -mt-1">
                    <Repeat2 size={14} />
                    <Link to={`/profile/${item.reposted_by_user.id}`} className="flex items-center gap-1.5 hover:underline font-medium">
                        {item.reposted_by_user.avatar_url && (
                            <img src={item.reposted_by_user.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        {item.reposted_by_user.name || item.reposted_by_user.first_name || 'Someone'} reposted
                    </Link>
                </div>
            )}

            {/* Header: Avatar, Name, Category Badge, Options */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    {/* Avatar – use entity avatar when available */}
                    <Link to={item.entity_author ? `/${item.entity_author.type}s/${item.entity_author.id}` : `/profile/${item.user?.id || item.creator?.id}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium overflow-hidden">
                            {item.entity_author?.avatar ? (
                                <img
                                    src={item.entity_author.avatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : item.user?.avatar_url || item.creator?.avatar_url ? (
                                <img
                                    src={item.user?.avatar_url || item.creator?.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (item.entity_author?.name?.[0] || item.user?.first_name?.[0] || item.creator?.name?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                    </Link>

                    {/* Name, handle, time */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {item.entity_author ? (
                                <>
                                    <Link
                                        to={`/${item.entity_author.type}s/${item.entity_author.id}`}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        {item.entity_author.name}
                                    </Link>
                                    {item.entity_author.poster_role_display && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                            {item.entity_author.poster_role_display.icon} {item.entity_author.poster_role_display.label}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col">
                                    <Link
                                        to={`/profile/${item.user?.id || item.creator?.id}`}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        {item.user?.full_name || item.user?.first_name || item.creator?.name || 'User'}
                                    </Link>
                                    {(item.user?.username || item.creator?.username) && (
                                        <span className="text-secondary text-sm">@{item.user?.username || item.creator?.username}</span>
                                    )}
                                </div>
                            )}

                            {/* Follow button */}
                            {item.user?.is_following === false && onFollow && (
                                <button
                                    onClick={() => onFollow(item.user?.id)}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                    <UserPlus size={12} />
                                    Follow
                                </button>
                            )}

                            {/* Category Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[contentType] || 'bg-secondary text-primary'}`}>
                                {categoryLabel}
                            </span>

                            <span className="text-tertiary text-sm">·</span>
                            <span className="text-secondary text-sm">{item.time_ago || 'now'}</span>
                        </div>

                        {/* Show personal author below entity name */}
                        {item.entity_author && item.user && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-secondary">
                                <span>by</span>
                                <Link to={`/profile/${item.user.id}`} className="hover:underline font-medium text-secondary">
                                    {item.user.full_name || item.user.first_name || 'User'}
                                </Link>
                            </div>
                        )}

                        {/* Title for articles/research/products */}
                        {item.title && (
                            <h3 className="font-semibold text-primary mt-1">{item.title}</h3>
                        )}
                    </div>
                </div>

                {/* Options menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 rounded-full hover:bg-secondary text-tertiary hover:text-primary"
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {showOptions && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                            <div className="absolute right-0 top-8 z-20 bg-elevated rounded-lg shadow-lg border border-theme py-1 w-52">
                                <button
                                    onClick={() => { onHide?.(item.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                >
                                    <EyeOff size={16} />
                                    I don't like this
                                </button>
                                <button
                                    onClick={() => { onBlock?.(item.user?.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                >
                                    <Ban size={16} />
                                    Block {item.user?.first_name}
                                </button>
                                <button
                                    onClick={() => { onReport?.(item.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-secondary flex items-center gap-3"
                                >
                                    <Flag size={16} />
                                    Report
                                </button>
                                <hr className="my-1 border-theme" />
                                <button
                                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                >
                                    <HelpCircle size={16} />
                                    Help
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mt-3">
                <p className="text-primary whitespace-pre-wrap leading-relaxed">
                    {renderContentWithMentions(item.content, navigate)}
                </p>

                {/* Media files */}
                {item.media_files?.length > 0 && (
                    <div className={`mt-3 grid gap-2 ${item.media_files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {item.media_files.map((media, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden bg-secondary relative">
                                {media.media_type === 'video' ? (
                                    <div className="relative">
                                        <video
                                            src={media.url}
                                            className="w-full max-h-96 object-cover"
                                            controls
                                        />
                                    </div>
                                ) : media.media_type === 'file' ? (
                                    <a
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-secondary hover:bg-tertiary"
                                    >
                                        <FileText size={24} className="text-secondary" />
                                        <span className="text-sm text-primary">{media.file_name}</span>
                                        <ExternalLink size={14} className="text-tertiary ml-auto" />
                                    </a>
                                ) : (
                                    <img
                                        src={media.url}
                                        alt={media.caption || ''}
                                        className="w-full max-h-96 object-cover"
                                    />
                                )}
                                {media.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                        {media.caption}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Legacy single media */}
                {!item.media_files?.length && item.media_url && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                        {item.media_type === 'video' ? (
                            <video src={item.media_url} className="w-full max-h-96 object-cover" controls />
                        ) : (
                            <img src={item.media_url} alt="" className="w-full max-h-96 object-cover" />
                        )}
                    </div>
                )}

                {/* Price for products */}
                {item.price && (
                    <div className="mt-2 text-lg font-bold text-green-600">
                        ${item.price}
                    </div>
                )}
            </div>

            {/* Action buttons — Like → Comment → Repost → Quote → Save → Share */}
            {contentType === 'opinion' && (
                <div className="mt-4 flex items-center justify-between text-secondary">
                    {/* Like */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}
                    >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                        <span className="text-sm">{likesCount || ''}</span>
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => onComment?.(item)}
                        className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle size={18} />
                        <span className="text-sm">{commentsCount || ''}</span>
                    </button>

                    {/* Repost */}
                    <button
                        onClick={handleRepost}
                        className={`flex items-center gap-1.5 hover:text-green-500 transition-colors ${isReposted ? 'text-green-500' : ''}`}
                    >
                        <Repeat2 size={18} />
                        {repostsCount > 0 ? (
                            <span
                                className="text-sm cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); openRepostersModal(); }}
                            >
                                {repostsCount}
                            </span>
                        ) : null}
                    </button>

                    {/* Quote */}
                    <button className="hover:text-purple-500 transition-colors">
                        <Quote size={18} />
                    </button>

                    {/* Save */}
                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-1.5 hover:text-yellow-500 transition-colors ${isBookmarked ? 'text-yellow-500' : ''}`}
                    >
                        <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="hover:text-primary-500 transition-colors"
                    >
                        <Send size={18} className="-rotate-12" />
                    </button>
                </div>
            )}

            {/* View button for other content types */}
            {contentType !== 'opinion' && item.action_url && (
                <div className="mt-4">
                    <Link
                        to={item.action_url}
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                        View {categoryLabel}
                        <ExternalLink size={14} />
                    </Link>
                </div>
            )}
            {/* Reposters Modal */}
            {showRepostersModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowRepostersModal(false)} />
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-elevated rounded-xl border border-theme shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-theme flex items-center justify-between">
                            <h3 className="font-bold text-primary">Reposted by</h3>
                            <button onClick={() => setShowRepostersModal(false)} className="p-1 hover:bg-secondary rounded-full text-secondary"><X size={18} /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                            {loadingReposters ? (
                                <div className="p-6 text-center text-secondary text-sm">Loading...</div>
                            ) : reposters.length === 0 ? (
                                <div className="p-6 text-center text-secondary text-sm">No reposters found</div>
                            ) : (
                                reposters.map(u => (
                                    <Link
                                        key={u.id}
                                        to={`/profile/${u.id}`}
                                        onClick={() => setShowRepostersModal(false)}
                                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                                            {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.first_name?.[0] || 'U').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">{u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User'}</p>
                                            <p className="text-xs text-secondary truncate">@{u.username || u.email?.split('@')[0]}</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
            {/* Golden Like keyframes */}
            <style>{`
                @keyframes goldenLikeBurst {
                    0% { transform: scale(0.3); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default FeedItem;
