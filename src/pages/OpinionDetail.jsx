import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send, Heart, Repeat2, Bookmark, Share2, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import opinionsService from '../services/opinions.service';
import FeedItem from '../components/feed/FeedItem';
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
        try {
            const [opinionData, commentsData] = await Promise.all([
                opinionsService.getById(id),
                opinionsService.getComments(id)
            ]);
            setOpinion(opinionData);
            setComments(Array.isArray(commentsData) ? commentsData : commentsData.results || []);
        } catch (err) {
            console.error('Error fetching opinion details:', err);
            setError('Failed to load opinion');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || postingComment) return;

        setPostingComment(true);
        try {
            await opinionsService.addComment(id, newComment.trim(), commentMedia);
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
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    Back to Opinions
                </button>
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Opinion not found</h3>
                    <p className="text-gray-500">{error || "The opinion you're looking for doesn't exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Opinion</h1>
            </div>

            <div className="p-4 space-y-4">
                <FeedItem
                    item={opinion}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onBookmark={handleBookmark}
                    onFollow={handleFollow}
                />

                {/* Comments Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Comments ({comments.length})</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {comments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="p-4 flex gap-3">
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
                                            <Link to={`/profile/${comment.user?.id}`} className="font-bold text-gray-900 hover:underline">
                                                {comment.user?.first_name} {comment.user?.last_name}
                                            </Link>
                                            <span className="text-sm text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                                        </div>
                                        <p className="text-gray-800 mt-1">{comment.content}</p>

                                        <div className="flex items-center gap-4 mt-2">
                                            <button className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
                                                <Heart size={14} />
                                                {comment.likes_count || ''}
                                            </button>
                                            <button className="text-sm text-gray-500 hover:text-primary-500">Reply</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            {isAuthenticated && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
                    <div className="max-w-2xl mx-auto">
                        {/* Media preview */}
                        {commentMedia && (
                            <div className="mb-2 relative inline-block">
                                {commentMedia.type?.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(commentMedia)} alt="" className="h-16 rounded-lg" />
                                ) : (
                                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                                        📎 {commentMedia.name}
                                    </div>
                                )}
                                <button
                                    onClick={() => setCommentMedia(null)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                                {user?.avatar_url ? (
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
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                                    >
                                        <Smile size={18} />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-8 gap-1 z-30">
                                            {COMMON_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => {
                                                        setNewComment(prev => prev + emoji);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded text-lg"
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
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
