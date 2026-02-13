import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import OpinionComposer from '../components/feed/OpinionComposer';
import {
    Heart, MessageCircle, Repeat2, Share2, MoreHorizontal,
    Users, Bookmark, Sparkles, TrendingUp,
    X, FileText, ExternalLink, UserPlus, Ban, Flag, EyeOff, HelpCircle,
    RefreshCw, User
} from 'lucide-react';
import opinionsService from '../services/opinions.service';
import api from '../services/api';
import { formatTimeAgo } from '../utils/dateFormatter';

// Simple emoji picker data
const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀'];



const Opinions = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('for_you');
    const [opinions, setOpinions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newContentAvailable, setNewContentAvailable] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    // Character limits based on user tier
    const isPremium = user?.tier === 'premium' || user?.tier === 'gold';

    useEffect(() => {
        loadOpinions();
    }, [activeTab]);

    // Poll for new content
    useEffect(() => {
        const interval = setInterval(checkNewContent, 30000);
        return () => clearInterval(interval);
    }, [lastFetchTime]);

    const loadOpinions = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === 'following' && isAuthenticated) {
                data = await opinionsService.getFeed();
            } else if (activeTab === 'trending') {
                data = await opinionsService.getTrending();
            } else {
                data = await opinionsService.getAll();
            }
            const opinionsList = Array.isArray(data) ? data : (data?.results || []);
            setOpinions(opinionsList);
            setLastFetchTime(new Date().toISOString());
            setNewContentAvailable(false);
        } catch (error) {
            console.error('Error loading opinions:', error);
            setOpinions([]);
        } finally {
            setLoading(false);
        }
    };

    const checkNewContent = async () => {
        if (!lastFetchTime) return;
        try {
            const response = await api.get('/api/opinions/feed/check-new/', {
                params: { since: lastFetchTime }
            });
            if (response.data.has_new) {
                setNewContentAvailable(true);
            }
        } catch (error) {
            console.error('Failed to check for new content:', error);
        }
    };

    const handlePostOpinion = async (formData) => {
        try {
            const response = await api.post('/api/opinions/opinions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setOpinions([response.data, ...opinions]);
        } catch (error) {
            console.error('Error posting opinion:', error);
            throw error;
        }
    };

    const handleLike = async (opinionId) => {
        // Optimistic update for faster response
        setOpinions(opinions.map(op =>
            op.id === opinionId
                ? { ...op, is_liked: !op.is_liked, likes_count: op.is_liked ? (op.likes_count || 1) - 1 : (op.likes_count || 0) + 1 }
                : op
        ));

        try {
            const response = await opinionsService.toggleLike(opinionId);
            // Sync with server response
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_liked: response.liked, likes_count: response.likes_count }
                    : op
            ));
        } catch (error) {
            console.error('Error liking:', error);
            // Revert on error
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_liked: !op.is_liked, likes_count: op.is_liked ? (op.likes_count || 0) + 1 : (op.likes_count || 1) - 1 }
                    : op
            ));
        }
    };

    const handleRepost = async (opinionId, isCurrentlyReposted) => {
        // If already reposted, ask for confirmation to unrepost
        if (isCurrentlyReposted) {
            const confirmed = window.confirm('Undo repost? This post will be removed from your profile.');
            if (!confirmed) return;
        }

        try {
            const response = await opinionsService.toggleRepost(opinionId);
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_reposted: response.reposted, reposts_count: response.reposts_count }
                    : op
            ));
        } catch (error) {
            console.error('Error reposting:', error);
        }
    };

    const [showComments, setShowComments] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);

    const navigate = useNavigate();

    const handleOpenComments = (opinionId) => {
        // Navigate to opinion detail with focus on comment input
        navigate(`/opinions/${opinionId}?focus=comment`);
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !showComments || postingComment) return;
        setPostingComment(true);
        try {
            await opinionsService.addComment(showComments, newComment.trim());
            // Reload comments
            const response = await opinionsService.getComments(showComments);
            setComments(Array.isArray(response) ? response : response?.results || []);
            setNewComment('');
            // Update comment count
            setOpinions(opinions.map(op =>
                op.id === showComments
                    ? { ...op, comments_count: (op.comments_count || 0) + 1 }
                    : op
            ));
        } catch (error) {
            console.error('Error posting comment:', error);
            alert(error.response?.data?.detail || 'Failed to post comment');
        } finally {
            setPostingComment(false);
        }
    };

    const handleBookmark = async (opinionId) => {
        try {
            const response = await opinionsService.toggleBookmark(opinionId);
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_bookmarked: response.bookmarked }
                    : op
            ));
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await api.post('/api/opinions/follow/toggle/', { user_id: userId });
            setOpinions(opinions.map(op =>
                op.user?.id === userId
                    ? { ...op, user: { ...op.user, is_following: !op.user.is_following } }
                    : op
            ));
        } catch (error) {
            console.error('Error following:', error);
        }
    };

    const handleShare = async (opinion) => {
        const url = `${window.location.origin}/opinions/${opinion.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check this out',
                    text: opinion.content?.substring(0, 100),
                    url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
        // Track share
        try {
            await api.post(`/api/opinions/opinions/${opinion.id}/share/`);
        } catch (err) { }
    };

    const handleHide = async (opinionId) => {
        try {
            await api.post(`/api/opinions/opinions/${opinionId}/hide/`);
            setOpinions(opinions.filter(op => op.id !== opinionId));
        } catch (error) {
            console.error('Error hiding:', error);
        }
    };

    const handleReport = async (opinionId) => {
        const reason = prompt('Why are you reporting this content?');
        if (reason) {
            try {
                await api.post(`/api/opinions/opinions/${opinionId}/report/`, {
                    reason: 'other',
                    description: reason
                });
                alert('Thank you for your report. We will review it.');
            } catch (error) {
                console.error('Error reporting:', error);
            }
        }
    };

    const handleBlock = async (userId) => {
        if (!confirm('Are you sure you want to block this user?')) return;
        try {
            await api.post('/api/opinions/block/toggle/', { user_id: userId });
            setOpinions(opinions.filter(op => op.user?.id !== userId));
            alert('User blocked successfully');
        } catch (error) {
            console.error('Error blocking:', error);
        }
    };


    return (
        <>
            <div className="max-w-2xl mx-auto space-y-0">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-primary/80 backdrop-blur-md border-b border-theme">
                    <div className="flex">
                        {[
                            { id: 'for_you', label: 'For You', icon: Sparkles },
                            { id: 'following', label: 'Following', icon: Users },
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (

                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-4 text-sm font-medium relative transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-secondary hover:text-primary hover:bg-secondary'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary-500 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>


                {/* New Content Banner */}
                {newContentAvailable && (
                    <button
                        onClick={loadOpinions}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw size={18} />
                        New posts available - tap to refresh
                    </button>
                )}

                {/* Composer */}
                {isAuthenticated && (
                    <div className="border-b border-theme p-4">
                        <OpinionComposer
                            onSubmit={handlePostOpinion}
                            isPremium={isPremium}
                        />
                    </div>
                )}

                {/* Opinions Feed */}
                <div className="divide-y divide-theme">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : opinions.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <MessageCircle className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-primary mb-2">No opinions yet</h3>
                            <p className="text-secondary">
                                {activeTab === 'following'
                                    ? "Follow people to see their opinions here"
                                    : "Be the first to share your thoughts!"
                                }
                            </p>
                        </div>
                    ) : (
                        opinions.map((opinion) => (
                            <OpinionCard
                                key={opinion.id}
                                opinion={opinion}
                                currentUser={user}
                                onLike={handleLike}
                                onRepost={handleRepost}
                                onBookmark={handleBookmark}
                                onFollow={handleFollow}
                                onShare={handleShare}
                                onHide={handleHide}
                                onReport={handleReport}
                                onBlock={handleBlock}
                                onOpenComments={handleOpenComments}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Comments Modal */}
            {
                showComments && (

                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-elevated rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-theme">
                            <div className="p-4 border-b border-theme flex items-center justify-between">
                                <h3 className="text-lg font-bold text-primary">Comments</h3>
                                <button
                                    onClick={() => { setShowComments(null); setComments([]); setNewComment(''); }}
                                    className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loadingComments ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-8 text-secondary">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-tertiary" />
                                        <p>No comments yet. Be the first!</p>
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Link to={`/profile/${comment.user?.id}`} className="shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                                    {comment.user?.avatar_url ? (
                                                        <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        comment.user?.first_name?.[0] || 'U'
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Link to={`/profile/${comment.user?.id}`} className="font-bold text-primary hover:underline">
                                                        {comment.user?.first_name} {comment.user?.last_name}
                                                    </Link>
                                                    <span className="text-sm text-secondary">{formatTimeAgo(comment.created_at)}</span>
                                                </div>
                                                <p className="text-primary mt-0.5">{comment.content}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button className="text-sm text-tertiary hover:text-red-500 flex items-center gap-1 transition-colors">
                                                        <Heart size={14} />
                                                        {comment.likes_count || ''}
                                                    </button>
                                                    <button className="text-sm text-tertiary hover:text-primary-500 transition-colors">Reply</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {isAuthenticated && (
                                <div className="p-4 border-t border-theme">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                                            {user?.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.first_name?.[0] || 'U'
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="flex-1 px-4 py-2 bg-secondary border border-theme rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary"
                                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                            />
                                            <button
                                                onClick={handlePostComment}
                                                disabled={!newComment.trim() || postingComment}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                            >
                                                {postingComment ? '...' : <Send size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
};

const OpinionCard = ({ opinion, currentUser, onLike, onRepost, onBookmark, onFollow, onShare, onHide, onReport, onBlock, onOpenComments }) => {
    const [showMenu, setShowMenu] = useState(false);

    const canFollow = opinion.user?.id !== currentUser?.id && opinion.user?.is_following === false && !opinion.is_anonymous;

    // Check if this is an entity-authored opinion
    const entityAuthor = opinion.entity_author;
    const isAnonymous = opinion.is_anonymous;

    // User type badge styles
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

    return (
        <>
            <article className="bg-elevated hover:bg-secondary/50 transition-colors px-4 py-4">
                {/* Enhanced Repost indicator with avatar */}
                {opinion.is_repost && opinion.reposted_by_user && (
                    <div className="flex items-center gap-2 text-secondary text-sm mb-3 ml-1">
                        <Repeat2 size={14} className="text-green-500" />
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center overflow-hidden">
                                {opinion.reposted_by_user.avatar_url ? (
                                    <img src={opinion.reposted_by_user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-[8px] font-bold">
                                        {opinion.reposted_by_user.name?.[0] || 'U'}
                                    </span>
                                )}
                            </div>
                            <Link to={`/profile/${opinion.reposted_by_user.id}`} className="font-medium hover:underline">
                                {opinion.reposted_by_user.name}
                            </Link>
                            <span>reposted</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    {/* Avatar - changes based on anonymous/entity */}
                    {isAnonymous ? (
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
                                {/* Name - changes based on anonymous/entity */}
                                {isAnonymous ? (
                                    <span className="font-bold text-gray-500 italic">Anonymous</span>
                                ) : entityAuthor ? (
                                    <>
                                        <Link to={`/${entityAuthor.type === 'organisation' ? 'organizations' : 'institutions'}/${entityAuthor.id}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                                            {entityAuthor.name}
                                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        </Link>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${entityAuthor.type === 'organisation' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {entityAuthor.type === 'organisation' ? 'Organization' : 'Institution'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Link to={`/profile/${opinion.user?.id}`} className="font-bold text-primary hover:underline">
                                            {opinion.user?.full_name || opinion.user?.first_name || 'User'}
                                        </Link>

                                        {/* User type badge */}
                                        {opinion.user_type && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getUserTypeBadge(opinion.user_type).color}`}>
                                                {getUserTypeBadge(opinion.user_type).label}
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Follow button - only for regular users */}
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

                                {/* Anonymous indicator */}
                                {isAnonymous && (
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
                        <Link to={`/opinions/${opinion.id}`}>
                            <p className="text-primary mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                {opinion.content}
                            </p>
                        </Link>

                        {/* Media files (new multi-media support) */}
                        {opinion.media_files?.length > 0 && (
                            <div className={`mt-3 grid gap-2 ${opinion.media_files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {opinion.media_files.map((media, idx) => (
                                    <div key={idx} className="rounded-2xl overflow-hidden border border-theme bg-secondary relative">
                                        {media.media_type === 'video' ? (
                                            <video
                                                src={media.url}
                                                className="w-full max-h-80 object-cover"
                                                controls
                                            />
                                        ) : media.media_type === 'file' ? (
                                            <a
                                                href={media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-secondary hover:bg-tertiary"
                                            >
                                                <FileText size={24} className="text-secondary" />
                                                <span className="text-sm text-primary truncate">{media.file_name}</span>
                                                <ExternalLink size={14} className="text-tertiary ml-auto" />
                                            </a>
                                        ) : (
                                            <img
                                                src={media.url}
                                                alt={media.caption || ''}
                                                className="w-full max-h-80 object-cover"
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

                        {/* Legacy single media field */}
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
                            <div className="mt-3 p-3 border border-theme rounded-xl">
                                <p className="text-sm text-secondary">
                                    <span className="font-medium text-primary">{opinion.quoted_opinion.user?.first_name}</span>
                                    {' · '}
                                    {opinion.quoted_opinion.content}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 -ml-2 max-w-md">
                            <button
                                onClick={() => onOpenComments(opinion.id)}
                                className="flex items-center gap-1.5 text-secondary hover:text-primary-500 group p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{opinion.comments_count || ''}</span>
                            </button>
                            <button
                                onClick={() => onRepost(opinion.id, opinion.is_reposted)}
                                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_reposted
                                    ? 'text-green-500 hover:bg-green-500/10'
                                    : 'text-secondary hover:text-green-500 hover:bg-green-500/10'
                                    }`}
                            >
                                <Repeat2 className="w-5 h-5" />
                                <span className="text-sm">{opinion.reposts_count || ''}</span>
                            </button>
                            <button
                                onClick={() => onLike(opinion.id)}
                                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_liked
                                    ? 'text-red-500 hover:bg-red-500/10'
                                    : 'text-secondary hover:text-red-500 hover:bg-red-500/10'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${opinion.is_liked ? 'fill-current' : ''}`} />
                                <span className="text-sm">{opinion.likes_count || ''}</span>
                            </button>
                            <button
                                onClick={() => onBookmark(opinion.id)}
                                className={`p-2 rounded-full transition-colors ${opinion.is_bookmarked
                                    ? 'text-primary-500 hover:bg-primary-500/10'
                                    : 'text-secondary hover:text-primary-500 hover:bg-primary-500/10'
                                    }`}
                            >
                                <Bookmark className={`w-5 h-5 ${opinion.is_bookmarked ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={() => onShare(opinion)}
                                className="p-2 text-secondary hover:text-primary-500 hover:bg-secondary rounded-full transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </>
    );
};

export default Opinions;
