import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send, Heart, Repeat2, Bookmark, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import opinionsService from '../services/opinions.service';
import FeedItem from '../components/feed/FeedItem';
import OpinionComment from '../components/feed/OpinionComment';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../utils/dateFormatter';

// Emoji picker data
const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀'];

const OpinionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const commentInputRef = useRef(null);

    const [opinion, setOpinion] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [commentMedia, setCommentMedia] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchOpinionDetails();
    }, [id]);

    // Auto-focus comment input if navigated with focus=comment
    useEffect(() => {
        if (searchParams.get('focus') === 'comment' && commentInputRef.current && !loading) {
            setTimeout(() => {
                commentInputRef.current.focus();
                commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [searchParams, loading]);

    const fetchOpinionDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const opinionData = await opinionsService.getById(id);
            setOpinion(opinionData);
            
            // Fetch comments separately so a comment failure doesn't block the opinion
            try {
                const commentsData = await opinionsService.getComments(id);
                setComments(Array.isArray(commentsData) ? commentsData : commentsData.results || []);
            } catch (commentErr) {
                console.error('Error fetching comments:', commentErr);
                setComments([]);
            }
        } catch (err) {
            console.error('Error fetching opinion details:', err);
            const status = err.response?.status;
            const detail = err.response?.data?.detail || err.response?.data?.error;
            if (status === 404) {
                setError("This opinion doesn't exist or has been removed.");
            } else if (status === 403) {
                setError("You don't have permission to view this opinion.");
            } else {
                setError(detail || `Failed to load opinion (${status || 'network error'})`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (parentCommentId = null) => {
        if (!newComment.trim() || postingComment) return;

        setPostingComment(true);
        try {
            const options = { parentCommentId };
            
            // Add entity authorship if active
            if (user?.activeEntity) {
                if (user.activeEntity.type === 'organisation') {
                    options.organisation = user.activeEntity.id;
                } else if (user.activeEntity.type === 'institution') {
                    options.institution = user.activeEntity.id;
                } else if (user.activeEntity.type === 'establishment') {
                    options.establishment = user.activeEntity.id;
                }
                options.poster_role = user.activeEntity.role || 'owner';
            }

            await opinionsService.addComment(id, newComment.trim(), commentMedia, options);
            setNewComment('');
            setCommentMedia(null);
            // Refresh comments
            const commentsData = await opinionsService.getComments(id);
            setComments(Array.isArray(commentsData) ? commentsData : commentsData.results || []);

            // Update local opinion comment count
            setOpinion(prev => ({
                ...prev,
                comments_count: (prev.comments_count || 0) + 1
            }));
        } catch (err) {
            console.error('Error posting comment:', err);
            alert(err.response?.data?.detail || 'Failed to post comment');
        } finally {
            setPostingComment(false);
        }
    };

    // Handle nested reply
    const handleReply = async (parentCommentId, content) => {
        try {
            const options = { parentCommentId };
            
            // Add entity authorship if active
            if (user?.activeEntity) {
                if (user.activeEntity.type === 'organisation') {
                    options.organisation = user.activeEntity.id;
                } else if (user.activeEntity.type === 'institution') {
                    options.institution = user.activeEntity.id;
                } else if (user.activeEntity.type === 'establishment') {
                    options.establishment = user.activeEntity.id;
                }
                options.poster_role = user.activeEntity.role || 'owner';
            }

            await opinionsService.addComment(id, content, null, options);
            // Refresh comments
            const commentsData = await opinionsService.getComments(id);
            setComments(Array.isArray(commentsData) ? commentsData : commentsData.results || []);
            // Update local opinion comment count
            setOpinion(prev => ({
                ...prev,
                comments_count: (prev.comments_count || 0) + 1
            }));
        } catch (err) {
            console.error('Error posting reply:', err);
            throw err;
        }
    };

    // Handle comment like
    const handleCommentLike = async (commentId) => {
        try {
            // TODO: Implement comment like when backend supports it
            return { liked: true, likes_count: 1 };
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleLike = async (opinionId) => {
        try {
            const response = await opinionsService.toggleLike(opinionId);
            setOpinion(prev => ({
                ...prev,
                is_liked: response.liked,
                likes_count: response.likes_count
            }));
            return response;
        } catch (error) {
            console.error('Error liking:', error);
        }
    };

    const handleRepost = async (opinionId) => {
        try {
            const response = await opinionsService.toggleRepost(opinionId);
            setOpinion(prev => ({
                ...prev,
                is_reposted: response.reposted,
                reposts_count: response.reposts_count
            }));
            return response;
        } catch (error) {
            console.error('Error reposting:', error);
        }
    };

    const handleBookmark = async (opinionId) => {
        try {
            const response = await opinionsService.toggleBookmark(opinionId);
            setOpinion(prev => ({
                ...prev,
                is_bookmarked: response.bookmarked
            }));
            return response;
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await opinionsService.toggleFollow(userId);
            setOpinion(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    is_following: !prev.user.is_following
                }
            }));
        } catch (error) {
            console.error('Error following:', error);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Opinion by ${opinion.user?.full_name || opinion.user?.first_name || 'User'}`,
                    text: opinion.content?.substring(0, 100),
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !opinion) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <button
                    onClick={() => navigate('/opinions')}
                    className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Opinions
                </button>
                <div className="text-center py-12 bg-elevated rounded-xl border border-theme">
                    <h3 className="text-xl font-bold text-primary mb-2">Opinion not found</h3>
                    <p className="text-secondary">{error || "The opinion you're looking for doesn't exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-primary/80 backdrop-blur-md border-b border-theme px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-primary">Opinion</h1>
            </div>

            <div className="p-4 space-y-4">
                <FeedItem
                    item={opinion}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onBookmark={handleBookmark}
                    onFollow={handleFollow}
                />

                {/* Share & Bookmark Bar */}
                <div className="flex items-center gap-4 px-2 py-3 border-b border-theme">
                    <button
                        onClick={() => handleLike(opinion.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_liked ? 'text-red-500 hover:bg-red-500/10' : 'text-secondary hover:text-red-500 hover:bg-red-500/10'}`}
                    >
                        <Heart className={`w-5 h-5 ${opinion.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{opinion.likes_count || ''}</span>
                    </button>
                    <button
                        onClick={() => handleRepost(opinion.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_reposted ? 'text-green-500 hover:bg-green-500/10' : 'text-secondary hover:text-green-500 hover:bg-green-500/10'}`}
                    >
                        <Repeat2 className="w-5 h-5" />
                        <span className="text-sm">{opinion.reposts_count || ''}</span>
                    </button>
                    <button
                        onClick={() => handleBookmark(opinion.id)}
                        className={`p-2 rounded-full transition-colors ${opinion.is_bookmarked ? 'text-primary-500 hover:bg-primary-500/10' : 'text-secondary hover:text-primary-500 hover:bg-primary-500/10'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${opinion.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 text-secondary hover:text-primary-500 hover:bg-secondary rounded-full transition-colors ml-auto"
                    >
                        <Send className="w-5 h-5 -rotate-12" />
                    </button>
                </div>

                {/* Quoted Opinion */}
                {opinion.quoted_opinion && (
                    <Link
                        to={`/opinions/${opinion.quoted_opinion.id}`}
                        className="block p-4 bg-elevated rounded-xl border border-theme hover:bg-secondary/30 transition-colors"
                    >
                        <div className="text-xs font-semibold text-primary-500 mb-2 flex items-center gap-1">
                            <MessageCircle size={12} />
                            Quoted Opinion
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                                {opinion.quoted_opinion.user?.avatar_url ? (
                                    <img src={opinion.quoted_opinion.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    opinion.quoted_opinion.user?.first_name?.[0] || 'U'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-primary">
                                        {opinion.quoted_opinion.user?.full_name || opinion.quoted_opinion.user?.first_name}
                                    </span>
                                    <span className="text-tertiary text-xs">·</span>
                                    <span className="text-secondary text-xs">
                                        {opinion.quoted_opinion.time_ago || formatTimeAgo(opinion.quoted_opinion.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary mt-1">
                                    {opinion.quoted_opinion.content}
                                </p>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Comments Section */}
                <div className="bg-elevated rounded-xl border border-theme overflow-hidden">
                    <div className="p-4 border-b border-theme">
                        <h3 className="font-bold text-primary">Comments ({comments.length})</h3>
                    </div>

                    <div className="p-4 space-y-4">
                        {comments.length === 0 ? (
                            <div className="p-8 text-center text-secondary">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-tertiary" />
                                <p>No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        ) : (
                            comments.map(comment => (
                                <OpinionComment
                                    key={comment.id}
                                    comment={comment}
                                    onLike={handleCommentLike}
                                    onReply={handleReply}
                                    currentUser={user}
                                    depth={0}
                                    maxDepth={3}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            {isAuthenticated && (
                <div className="fixed bottom-0 left-0 right-0 bg-primary border-t border-theme p-4 z-20">
                    <div className="max-w-2xl mx-auto">
                        {/* Media preview */}
                        {commentMedia && (
                            <div className="mb-2 relative inline-block">
                                {commentMedia.type?.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(commentMedia)} alt="" className="h-16 rounded-lg" />
                                ) : (
                                    <div className="px-3 py-1.5 bg-secondary rounded-lg text-sm text-primary">
                                        📎 {commentMedia.name}
                                    </div>
                                )}
                                <button
                                    onClick={() => setCommentMedia(null)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs hover:bg-black/80"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user?.first_name?.[0] || 'U'
                                )}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*,application/pdf"
                                    onChange={(e) => setCommentMedia(e.target.files?.[0] || null)}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-full transition-colors"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-full transition-colors"
                                    >
                                        <Smile size={18} />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full mb-2 left-0 bg-elevated border border-theme rounded-lg shadow-lg p-2 grid grid-cols-8 gap-1 z-30">
                                            {COMMON_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => {
                                                        setNewComment(prev => prev + emoji);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    className="p-1 hover:bg-secondary rounded text-lg"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-4 py-2 bg-secondary border border-theme rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary"
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                />
                                <button
                                    onClick={handlePostComment}
                                    disabled={(!newComment.trim() && !commentMedia) || postingComment}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {postingComment ? '...' : <Send size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpinionDetail;
