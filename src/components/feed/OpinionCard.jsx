import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart, MessageCircle, Repeat2, Send, MoreHorizontal,
    Users, Bookmark, UserPlus, Ban, Flag, EyeOff, HelpCircle,
    FileText, ExternalLink, User, Lock, Quote
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateFormatter';
import { renderContentWithMentions } from '../../utils/textFormatters';

/**
 * Shared OpinionCard component — used by both Opinions page and Profile page.
 * Renders a single opinion with avatar, content, media, quoted opinions,
 * repost indicators, TikTok-style reposter avatars, and all interaction buttons.
 *
 * Icon order: Like → Comment → Repost → Quote → Save → Share
 */
const OpinionCard = ({
    opinion,
    currentUser,
    onLike,
    onRepost,
    onBookmark,
    onFollow,
    onShare,
    onHide,
    onReport,
    onBlock,
    onOpenComments,
    onOpenReposters,
    onQuote
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [goldenLikeAnim, setGoldenLikeAnim] = useState(false);
    const lastTapRef = useRef(0);
    const navigate = useNavigate();

    const canFollow = opinion.user?.id !== currentUser?.id && opinion.user?.is_following === false && !opinion.is_anonymous;

    const entityAuthor = opinion.entity_author;
    const isAnonymous = opinion.is_anonymous;

    const getUserTypeBadge = (userType) => {
        const badges = {
            student: { label: 'Student', color: 'bg-blue-100 text-blue-700' },
            staff: { label: 'Staff', color: 'bg-purple-100 text-purple-700' },
            org_staff: { label: 'Org Staff', color: 'bg-green-100 text-green-700' },
            org_admin: { label: 'Org Admin', color: 'bg-emerald-100 text-emerald-700' },
            inst_admin: { label: 'Inst Admin', color: 'bg-orange-100 text-orange-700' },
            inst_staff: { label: 'Inst Staff', color: 'bg-amber-100 text-amber-700' },
            lecturer: { label: 'Lecturer', color: 'bg-indigo-100 text-indigo-700' },
            default: { label: 'Member', color: 'bg-gray-100 text-gray-700' },
        };
        return badges[userType] || badges.default;
    };

    const isRepost = opinion.is_repost;
    const displayCounts = opinion;
    const interactionId = isRepost && opinion.original_content ? opinion.original_content.id : opinion.id;

    // Resolve tagged rooms — use original's if repost doesn't carry its own
    const taggedRooms = opinion.tagged_rooms?.length > 0
        ? opinion.tagged_rooms
        : (isRepost && opinion.original_content?.tagged_rooms) || [];

    // Resolve anonymity — carry forward from original
    const effectiveAnonymous = isAnonymous || (isRepost && opinion.original_content?.is_anonymous);

    // All reposters (merged by parent for dedup'd feed)
    const allReposters = opinion._reposters || (opinion.reposted_by_user ? [opinion.reposted_by_user] : []);
    // Reposters to show on any opinion that has been reposted (not just repost items)
    const repostersToShow = allReposters.length > 0 ? allReposters : [];

    // ── Double-click golden like ──
    const handleDoubleClick = useCallback(() => {
        if (!onLike) return;
        // Trigger like if not already liked
        if (!displayCounts.is_liked) {
            onLike(interactionId);
        }
        // Play golden heart animation
        setGoldenLikeAnim(true);
        setTimeout(() => setGoldenLikeAnim(false), 800);
    }, [onLike, interactionId, displayCounts.is_liked]);

    // Touch-based double tap fallback
    const handleTouchEnd = useCallback(() => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            handleDoubleClick();
        }
        lastTapRef.current = now;
    }, [handleDoubleClick]);

    return (
        <>
            <article
                className={`bg-elevated hover:bg-secondary/50 px-4 py-4 relative overflow-visible transition-colors duration-500 ease-in-out ${isRepost ? 'border-2 border-yellow-400/50 bg-yellow-50/5 rounded-xl mx-2 my-2' : 'border border-transparent'}`}
                onDoubleClick={handleDoubleClick}
                onTouchEnd={handleTouchEnd}
            >
                {/* ── Golden Like burst animation ── */}
                {goldenLikeAnim && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <Heart
                            className="text-yellow-400 fill-yellow-400 drop-shadow-lg"
                            style={{
                                width: 80,
                                height: 80,
                                animation: 'goldenLikeBurst 0.8s ease-out forwards',
                            }}
                        />
                    </div>
                )}

                {/* ── Faint double-click heart hint (bottom-right) ── */}
                <div className="absolute right-4 bottom-4 pointer-events-none select-none opacity-[0.08] dark:opacity-[0.04] z-0">
                    <Heart className="w-16 h-16 text-red-400" />
                </div>

                <div 
                    className={`absolute -top-3 left-4 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-200 shadow-sm z-10 transition-all duration-500 ease-in-out ${isRepost ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2 pointer-events-none'}`}
                >
                    <Repeat2 size={10} />
                    Repost
                </div>

                {/* ── TikTok-style repost header with overlapping avatars (shown on ALL reposted opinions) ── */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${repostersToShow.length > 0 ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
                    <div className="flex items-center gap-2 pb-3 border-b border-yellow-100/50">
                        {allReposters.length === 1 ? (
                            /* Single reposter — avatar + name */
                            <button
                                onClick={() => onOpenReposters && onOpenReposters(interactionId)}
                                className="flex items-center gap-2 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden ring-2 ring-yellow-200">
                                    {allReposters[0].avatar_url ? (
                                        <img src={allReposters[0].avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-xs font-bold">
                                            {(allReposters[0].name || allReposters[0].first_name || 'U')[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="font-bold text-sm text-primary group-hover:underline">
                                        {allReposters[0].name || allReposters[0].first_name || 'Someone'}
                                    </span>
                                    <span className="text-xs text-secondary flex items-center gap-1">
                                        <Repeat2 size={10} />
                                        reposted this
                                    </span>
                                </div>
                            </button>
                        ) : allReposters.length > 1 ? (
                            /* Multiple reposters — overlapping avatars */
                            <button
                                onClick={() => onOpenReposters && onOpenReposters(interactionId)}
                                className="flex items-center gap-2 group"
                            >
                                <div className="flex items-center -space-x-2">
                                    {allReposters.slice(0, 3).map((reposter, idx) => (
                                        <div
                                            key={reposter.id || idx}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden ring-2 ring-yellow-100 relative"
                                            style={{ zIndex: 3 - idx }}
                                        >
                                            {reposter.avatar_url ? (
                                                <img src={reposter.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-xs font-bold">
                                                    {(reposter.name || reposter.first_name || 'U')[0]}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {allReposters.length > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center text-xs font-bold ring-2 ring-yellow-100">
                                            +{allReposters.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-secondary group-hover:underline">
                                    <strong className="text-primary">{allReposters[0].name || allReposters[0].first_name}</strong>
                                    {allReposters.length === 2
                                        ? ` and ${allReposters[1].name || allReposters[1].first_name}`
                                        : ` and ${allReposters.length - 1} others`
                                    } reposted
                                </span>
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex gap-3 relative z-[1]">
                    {/* Avatar */}
                    {effectiveAnonymous ? (
                        <div className="shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-lg">
                                <User size={24} />
                            </div>
                        </div>
                    ) : entityAuthor ? (
                        <Link to={`/${entityAuthor.type === 'organisation' ? 'organizations' : 'institutions'}/${entityAuthor.id}`} className="shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden ring-2 ring-blue-200">
                                {entityAuthor.avatar ? (
                                    <img src={entityAuthor.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    entityAuthor.name?.[0] || 'O'
                                )}
                            </div>
                        </Link>
                    ) : (
                        <Link to={`/profile/${opinion.user?.id}`} className="shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                {opinion.user?.avatar_url ? (
                                    <img src={opinion.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    opinion.user?.first_name?.[0] || 'U'
                                )}
                            </div>
                        </Link>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                {effectiveAnonymous ? (
                                    <span className="font-bold text-gray-500 italic">Anonymous</span>
                                ) : entityAuthor ? (
                                    <>
                                        <Link to={`/${entityAuthor.type === 'organisation' ? 'organizations' : entityAuthor.type === 'establishment' ? 'shops' : 'institutions'}/${entityAuthor.id}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                                            {entityAuthor.name}
                                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        </Link>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${entityAuthor.type === 'organisation' ? 'bg-blue-100 text-blue-700' : entityAuthor.type === 'establishment' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {entityAuthor.type === 'organisation' ? 'Organization' : entityAuthor.type === 'establishment' ? 'Shop' : 'Institution'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Link to={`/profile/${opinion.user?.id}`} className="font-bold text-primary hover:underline">
                                            {opinion.user?.full_name || opinion.user?.first_name || 'User'}
                                        </Link>
                                        {opinion.user?.username && (
                                            <span className="text-secondary text-sm">@{opinion.user.username}</span>
                                        )}
                                        {opinion.user_type && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getUserTypeBadge(opinion.user_type).color}`}>
                                                {getUserTypeBadge(opinion.user_type).label}
                                            </span>
                                        )}
                                    </>
                                )}

                                {canFollow && (
                                    <button
                                        onClick={() => onFollow(opinion.user.id)}
                                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-primary-50"
                                    >
                                        <UserPlus size={12} />
                                        Follow
                                    </button>
                                )}

                                <span className="text-tertiary">·</span>
                                <span className="text-secondary text-sm">
                                    {opinion.time_ago || formatTimeAgo(opinion.created_at)}
                                </span>
                                {opinion.visibility !== 'public' && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary flex items-center gap-1">
                                        {opinion.visibility === 'followers' ? <Users className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                        {opinion.visibility}
                                    </span>
                                )}

                                {effectiveAnonymous && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        Anonymous
                                    </span>
                                )}
                            </div>

                            {/* Options menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-tertiary hover:text-primary hover:bg-secondary rounded-full"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-8 z-20 bg-elevated rounded-xl shadow-lg border border-theme py-1 w-52">
                                            <button
                                                onClick={() => { onHide(opinion.id); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                            >
                                                <EyeOff size={16} />
                                                I don't like this
                                            </button>
                                            {opinion.user?.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => { onBlock(opinion.user?.id); setShowMenu(false); }}
                                                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3"
                                                >
                                                    <Ban size={16} />
                                                    Block {opinion.user?.first_name}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { onReport(opinion.id); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-secondary flex items-center gap-3"
                                            >
                                                <Flag size={16} />
                                                Report
                                            </button>
                                            <hr className="my-1 border-theme" />
                                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-3">
                                                <HelpCircle size={16} />
                                                Help
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Opinion Content */}
                        <div onClick={(e) => { e.stopPropagation(); navigate(`/opinions/${opinion.id}`); }} className="block cursor-pointer">
                            <p className="text-primary mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                {renderContentWithMentions(opinion.content, navigate)}
                            </p>
                        </div>

                        {/* Tagged Rooms */}
                        {taggedRooms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {taggedRooms.map(room => (
                                    <Link key={room?.id || room} to={`/rooms/${room?.id || room}`} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 text-xs font-medium rounded-full transition-colors">
                                        <Users className="w-3 h-3" />
                                        {room?.name || 'View Room'}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Media files */}
                        {opinion.media_files?.length > 0 && (
                            <div className={`mt-3 grid gap-2 ${opinion.media_files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {opinion.media_files.map((media, idx) => (
                                    <div key={idx} className="rounded-2xl overflow-hidden border border-theme bg-secondary relative">
                                        {media.media_type === 'video' ? (
                                            <video src={media.url} className="w-full max-h-80 object-cover" controls />
                                        ) : media.media_type === 'file' ? (
                                            <a href={media.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-secondary hover:bg-tertiary">
                                                <FileText size={24} className="text-secondary" />
                                                <span className="text-sm text-primary truncate">{media.file_name}</span>
                                                <ExternalLink size={14} className="text-tertiary ml-auto" />
                                            </a>
                                        ) : (
                                            <img src={media.url} alt={media.caption || ''} className="w-full max-h-80 object-cover" />
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
                        {!opinion.media_files?.length && opinion.media_url && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-theme">
                                {opinion.media_type === 'video' ? (
                                    <video src={opinion.media_url} className="w-full max-h-80 object-cover" controls />
                                ) : (
                                    <img src={opinion.media_url} alt="" className="w-full max-h-80 object-cover" />
                                )}
                            </div>
                        )}

                        {/* Quoted Opinion */}
                        {opinion.quoted_opinion && (
                            <Link to={`/opinions/${opinion.quoted_opinion.id}`} className="block mt-3 p-3 border border-theme rounded-xl hover:bg-secondary/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                                        {opinion.quoted_opinion.user?.avatar_url ? (
                                            <img src={opinion.quoted_opinion.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            opinion.quoted_opinion.user?.first_name?.[0] || 'U'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-primary">
                                                {opinion.quoted_opinion.user?.full_name || opinion.quoted_opinion.user?.first_name}
                                            </span>
                                            <span className="text-tertiary text-xs">·</span>
                                            <span className="text-secondary text-xs">
                                                {opinion.quoted_opinion.time_ago || formatTimeAgo(opinion.quoted_opinion.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-secondary line-clamp-3 mt-0.5">
                                            {opinion.quoted_opinion.content}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* ── Actions: Like → Comment → Repost → Quote → Save → Share ── */}
                        <div className="flex items-center justify-between mt-3 -ml-2 max-w-md">
                            {/* Like */}
                            <button
                                onClick={() => onLike(interactionId)}
                                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${displayCounts.is_liked
                                    ? 'text-red-500 hover:bg-red-500/10'
                                    : 'text-secondary hover:text-red-500 hover:bg-red-500/10'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${displayCounts.is_liked ? 'fill-current' : ''}`} />
                                <span className="text-sm">{displayCounts.likes_count || ''}</span>
                            </button>

                            {/* Comment */}
                            <button
                                onClick={() => onOpenComments(interactionId)}
                                className="flex items-center gap-1.5 text-secondary hover:text-primary-500 group p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{displayCounts.comments_count || ''}</span>
                            </button>

                            {/* Repost */}
                            <button
                                onClick={() => onRepost(interactionId, displayCounts.is_reposted)}
                                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${displayCounts.is_reposted
                                    ? 'text-green-500 hover:bg-green-500/10'
                                    : 'text-secondary hover:text-green-500 hover:bg-green-500/10'
                                    }`}
                            >
                                <Repeat2 className="w-5 h-5" />
                                <span className="text-sm">{displayCounts.reposts_count || ''}</span>
                            </button>

                            {/* Quote */}
                            {onQuote && (
                                <button
                                    onClick={() => onQuote(opinion)}
                                    className="p-2 text-secondary hover:text-purple-500 hover:bg-purple-500/10 rounded-full transition-colors"
                                    title="Quote this opinion"
                                >
                                    <Quote className="w-5 h-5" />
                                </button>
                            )}

                            {/* Save (Bookmark) */}
                            <button
                                onClick={() => onBookmark(interactionId)}
                                className={`p-2 rounded-full transition-colors ${displayCounts.is_bookmarked
                                    ? 'text-primary-500 hover:bg-primary-500/10'
                                    : 'text-secondary hover:text-primary-500 hover:bg-primary-500/10'
                                    }`}
                            >
                                <Bookmark className={`w-5 h-5 ${displayCounts.is_bookmarked ? 'fill-current' : ''}`} />
                            </button>

                            {/* Share */}
                            <button
                                onClick={() => onShare(opinion)}
                                className="p-2 text-secondary hover:text-primary-500 hover:bg-secondary rounded-full transition-colors"
                            >
                                <Send className="w-5 h-5 -rotate-12" />
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Golden Like keyframes — injected once */}
            <style>{`
                @keyframes goldenLikeBurst {
                    0% { transform: scale(0.3); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </>
    );
};

export default OpinionCard;
