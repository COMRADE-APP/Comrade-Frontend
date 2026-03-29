/**
 * CommentDetail — X-style comment detail page
 * Shows the focused comment with the original opinion as context above it,
 * and nested replies below. All reaction icons are functional.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Quote, Bookmark, Send } from 'lucide-react';
import opinionsService from '../services/opinions.service';
import OpinionComment from '../components/feed/OpinionComment';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../utils/dateFormatter';

const CommentDetail = () => {
    const { id: opinionId, commentId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [opinion, setOpinion] = useState(null);
    const [comment, setComment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const replyInputRef = useRef(null);

    const [ancestors, setAncestors] = useState([]);

    useEffect(() => {
        fetchData();
    }, [opinionId, commentId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch opinion
            const opData = await opinionsService.getById(opinionId);
            setOpinion(opData);

            // Fetch all comments and find the path to the specific one
            const commentsData = await opinionsService.getComments(opinionId);
            const allComments = Array.isArray(commentsData) ? commentsData : commentsData?.results || [];
            
            const path = findCommentPath(allComments, parseInt(commentId));
            if (path.length > 0) {
                setComment(path[path.length - 1]);
                setAncestors(path.slice(0, -1));
            } else {
                setComment(null);
                setAncestors([]);
            }
        } catch (error) {
            console.error('Error loading comment detail:', error);
        } finally {
            setLoading(false);
        }
    };

    // Recursively find the path to a comment in a nested tree
    const findCommentPath = (comments, targetId, currentPath = []) => {
        for (const c of comments) {
            const newPath = [...currentPath, c];
            if (c.id === targetId) return newPath;
            if (c.replies?.length > 0) {
                const foundPath = findCommentPath(c.replies, targetId, newPath);
                if (foundPath) return foundPath;
            }
        }
        return null; // Ensure null is returned when not found
    };

    const handleLikeComment = async (cId) => {
        try {
            const response = await opinionsService.toggleLike(cId);
            return response;
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleReply = async (parentCommentId, content) => {
        try {
            await opinionsService.addComment(opinionId, content, null, { parentCommentId });
            fetchData(); // Refresh
        } catch (error) {
            console.error('Error posting reply:', error);
        }
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await opinionsService.addComment(opinionId, replyContent.trim(), null, {
                parentCommentId: commentId
            });
            setReplyContent('');
            fetchData(); // Refresh
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const commentUser = comment?.user || {};

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-primary/80 backdrop-blur-md border-b border-theme px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-primary">Comment</h1>
            </div>

            {/* Original Opinion — compact context card */}
            {opinion && (
                <Link
                    to={`/opinions/${opinionId}`}
                    className="block border-b border-theme px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                            {opinion.user?.avatar_url ? (
                                <img src={opinion.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                opinion.user?.first_name?.[0] || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary text-sm">
                                    {opinion.user?.full_name || opinion.user?.first_name || 'User'}
                                </span>
                                <span className="text-tertiary text-xs">·</span>
                                <span className="text-secondary text-xs">
                                    {opinion.time_ago || formatTimeAgo(opinion.created_at)}
                                </span>
                            </div>
                            <p className="text-secondary text-sm mt-0.5 line-clamp-2">{opinion.content}</p>
                        </div>
                    </div>
                    {/* Thread connector */}
                    <div className="ml-5 mt-1 mb-0 w-0.5 h-4 bg-primary-200 dark:bg-primary-800"></div>
                </Link>
            )}

            {/* Ancestor Comments in thread */}
            {ancestors.map((anc, idx) => (
                <div key={anc.id} className="relative border-b border-theme px-4 py-3 hover:bg-secondary/30 transition-colors">
                    {/* Thread connector going down if it's not the last item (or connects to focal comment) */}
                    <div className="absolute left-[34px] top-12 bottom-0 w-0.5 bg-primary-200 dark:bg-primary-800"></div>
                    
                    <Link to={`/opinions/${opinionId}/comments/${anc.id}`} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0 relative z-10 ring-4 ring-elevated">
                            {anc.user?.avatar_url ? (
                                <img src={anc.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                anc.user?.first_name?.[0] || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary text-sm hover:underline">
                                    {anc.user?.full_name || anc.user?.first_name || 'User'}
                                </span>
                                {(anc.user?.username || anc.user?.email) && (
                                    <span className="text-tertiary text-xs">@{anc.user?.username || anc.user?.email?.split('@')[0]}</span>
                                )}
                                <span className="text-tertiary text-xs">·</span>
                                <span className="text-secondary text-xs">
                                    {formatTimeAgo(anc.created_at)}
                                </span>
                            </div>
                            <p className="text-secondary text-sm mt-0.5 line-clamp-3">{anc.content}</p>
                        </div>
                    </Link>
                </div>
            ))}

            {/* Focused Comment */}
            {comment ? (
                <div className="border-b border-theme px-4 py-4">
                    <div className="flex items-start gap-3">
                        <Link to={`/profile/${commentUser.id}`} className="shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                {commentUser.avatar_url ? (
                                    <img src={commentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    commentUser.first_name?.[0] || 'U'
                                )}
                            </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Link to={`/profile/${commentUser.id}`} className="font-bold text-primary hover:underline">
                                    {commentUser.first_name} {commentUser.last_name}
                                </Link>
                                <span className="text-secondary text-sm">
                                    @{commentUser.username || commentUser.email?.split('@')[0] || 'user'}
                                </span>
                            </div>
                            <p className="text-primary mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                {comment.content}
                            </p>

                            {/* Media */}
                            {comment.media_url && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-theme max-w-md">
                                    <img src={comment.media_url} alt="" className="w-full max-h-64 object-cover" />
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="mt-3 text-sm text-secondary">
                                {formatTimeAgo(comment.created_at)}
                            </div>

                            {/* Stats bar */}
                            <div className="flex items-center gap-6 py-3 border-t border-b border-theme mt-3 text-sm text-secondary">
                                {comment.likes_count > 0 && (
                                    <span><strong className="text-primary">{comment.likes_count}</strong> {comment.likes_count === 1 ? 'Like' : 'Likes'}</span>
                                )}
                                {comment.replies?.length > 0 && (
                                    <span><strong className="text-primary">{comment.replies.length}</strong> {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                                )}
                            </div>

                            {/* Action bar: Like → Reply → Repost → Quote → Save → Share */}
                            <div className="flex items-center justify-between py-3 text-secondary max-w-sm">
                                <button className={`hover:text-red-500 transition-colors ${comment.is_liked ? 'text-red-500' : ''}`}>
                                    <Heart size={20} fill={comment.is_liked ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    className="hover:text-blue-500 transition-colors"
                                    onClick={() => replyInputRef.current?.focus()}
                                >
                                    <MessageCircle size={20} />
                                </button>
                                <button className="hover:text-green-500 transition-colors">
                                    <Repeat2 size={20} />
                                </button>
                                <button className="hover:text-purple-500 transition-colors">
                                    <Quote size={20} />
                                </button>
                                <button className="hover:text-yellow-500 transition-colors">
                                    <Bookmark size={20} />
                                </button>
                                <button className="hover:text-primary-500 transition-colors">
                                    <Send size={20} className="-rotate-12" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-secondary">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-tertiary" />
                    <p>Comment not found</p>
                </div>
            )}

            {/* Reply Input */}
            {isAuthenticated && comment && (
                <div className="px-4 py-3 border-b border-theme">
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
                                ref={replyInputRef}
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Reply to @${commentUser.username || commentUser.first_name || 'user'}...`}
                                className="flex-1 px-4 py-2 bg-secondary border border-theme rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary placeholder-tertiary"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                            />
                            <button
                                onClick={handleSubmitReply}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {comment?.replies?.length > 0 && (
                <div className="px-4 py-4 space-y-3">
                    <h3 className="text-sm font-semibold text-secondary mb-3">Replies</h3>
                    {comment.replies.map(reply => (
                        <OpinionComment
                            key={reply.id}
                            comment={reply}
                            onLike={handleLikeComment}
                            onReply={handleReply}
                            opinionId={opinionId}
                            depth={0}
                            maxDepth={3}
                            currentUser={user}
                            parentUser={commentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentDetail;
