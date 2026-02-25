import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import OpinionComposer from '../components/feed/OpinionComposer';
import OpinionCard from '../components/feed/OpinionCard';
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
    const [quotedOpinion, setQuotedOpinion] = useState(null);
    const composerRef = useRef(null);

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

    const [showReposters, setShowReposters] = useState(null);
    const [reposters, setReposters] = useState([]);
    const [loadingReposters, setLoadingReposters] = useState(false);

    const navigate = useNavigate();

    const handleOpenReposters = async (opinionId) => {
        setShowReposters(opinionId);
        setLoadingReposters(true);
        try {
            const data = await opinionsService.getReposters(opinionId);
            setReposters(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching reposters:', error);
            setReposters([]);
        } finally {
            setLoadingReposters(false);
        }
    };

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
                    <div ref={composerRef} className="border-b border-theme p-4">
                        <OpinionComposer
                            onSubmit={handlePostOpinion}
                            isPremium={isPremium}
                            quotedOpinion={quotedOpinion}
                            onClearQuote={() => setQuotedOpinion(null)}
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
                                onOpenReposters={handleOpenReposters}
                                onQuote={(opinion) => {
                                    setQuotedOpinion(opinion);
                                    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
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

            {/* Reposters Modal */}
            {
                showReposters && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-elevated rounded-2xl w-full max-w-sm max-h-[60vh] flex flex-col border border-theme">
                            <div className="p-4 border-b border-theme flex items-center justify-between">
                                <h3 className="text-lg font-bold text-primary">Reposted By</h3>
                                <button
                                    onClick={() => { setShowReposters(null); setReposters([]); }}
                                    className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loadingReposters ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    </div>
                                ) : reposters.length === 0 ? (
                                    <div className="text-center py-8 text-secondary">
                                        <p>No one you follow has reposted this yet.</p>
                                    </div>
                                ) : (
                                    reposters.map((user) => (
                                        <div key={user.id} className="flex items-center gap-3">
                                            <Link to={`/profile/${user.id}`} className="shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.first_name?.[0] || 'U'
                                                    )}
                                                </div>
                                            </Link>
                                            <Link to={`/profile/${user.id}`} className="font-bold text-primary hover:underline">
                                                {user.first_name} {user.last_name}
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Opinions;

