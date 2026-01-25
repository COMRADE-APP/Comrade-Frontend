import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, MessageCircle, Repeat2, Share, Bookmark,
    MoreHorizontal, UserPlus, Flag, EyeOff, HelpCircle,
    Ban, ExternalLink, Image, FileText, Play
} from 'lucide-react';

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
    const [showOptions, setShowOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(item.is_liked || false);
    const [isReposted, setIsReposted] = useState(item.is_reposted || false);
    const [isBookmarked, setIsBookmarked] = useState(item.is_bookmarked || false);
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [repostsCount, setRepostsCount] = useState(item.reposts_count || 0);

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

    return (
        <div className="relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Repost indicator */}
            {item.is_repost && item.reposted_by_user && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 -mt-1">
                    <Repeat2 size={14} />
                    <span>{item.reposted_by_user.name} reposted</span>
                </div>
            )}

            {/* Header: Avatar, Name, Category Badge, Options */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Link to={`/profile/${item.user?.id || item.creator?.id}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium overflow-hidden">
                            {item.user?.avatar_url || item.creator?.avatar_url ? (
                                <img
                                    src={item.user?.avatar_url || item.creator?.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (item.user?.first_name?.[0] || item.creator?.name?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                    </Link>

                    {/* Name, handle, time */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                to={`/profile/${item.user?.id || item.creator?.id}`}
                                className="font-semibold text-gray-900 hover:underline"
                            >
                                {item.user?.full_name || item.user?.first_name || item.creator?.name || 'User'}
                            </Link>

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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[contentType] || 'bg-gray-100 text-gray-800'}`}>
                                {categoryLabel}
                            </span>

                            <span className="text-gray-400 text-sm">·</span>
                            <span className="text-gray-500 text-sm">{item.time_ago || 'now'}</span>
                        </div>

                        {/* Title for articles/research/products */}
                        {item.title && (
                            <h3 className="font-semibold text-gray-900 mt-1">{item.title}</h3>
                        )}
                    </div>
                </div>

                {/* Options menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {showOptions && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-52">
                                <button
                                    onClick={() => { onHide?.(item.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <EyeOff size={16} />
                                    I don't like this
                                </button>
                                <button
                                    onClick={() => { onBlock?.(item.user?.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <Ban size={16} />
                                    Block {item.user?.first_name}
                                </button>
                                <button
                                    onClick={() => { onReport?.(item.id); setShowOptions(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <Flag size={16} />
                                    Report
                                </button>
                                <hr className="my-1" />
                                <button
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
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
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                </p>

                {/* Media files */}
                {item.media_files?.length > 0 && (
                    <div className={`mt-3 grid gap-2 ${item.media_files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {item.media_files.map((media, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden bg-gray-100 relative">
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
                                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <FileText size={24} className="text-gray-500" />
                                        <span className="text-sm text-gray-700">{media.file_name}</span>
                                        <ExternalLink size={14} className="text-gray-400 ml-auto" />
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

            {/* Action buttons */}
            {contentType === 'opinion' && (
                <div className="mt-4 flex items-center justify-between text-gray-500">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}
                    >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                        <span className="text-sm">{likesCount || ''}</span>
                    </button>

                    <button
                        onClick={() => onComment?.(item)}
                        className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle size={18} />
                        <span className="text-sm">{commentsCount || ''}</span>
                    </button>

                    <button
                        onClick={handleRepost}
                        className={`flex items-center gap-1.5 hover:text-green-500 transition-colors ${isReposted ? 'text-green-500' : ''}`}
                    >
                        <Repeat2 size={18} />
                        <span className="text-sm">{repostsCount || ''}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 hover:text-purple-500 transition-colors"
                    >
                        <Share size={18} />
                    </button>

                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-1.5 hover:text-yellow-500 transition-colors ${isBookmarked ? 'text-yellow-500' : ''}`}
                    >
                        <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
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
        </div>
    );
};

export default FeedItem;
