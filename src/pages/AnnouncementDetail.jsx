/**
 * Announcement Detail Page
 * View announcement details with comments, reactions, and sharing
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ArrowLeft, Send, Bookmark, FileText, Bell, BellOff,
    Clock, Users, MessageSquare, Smile, Calendar, Heart,
    CheckCircle, AlertTriangle, Megaphone, Eye, Paperclip, Pin, Star,
    MoreHorizontal, ThumbsUp, ThumbsDown, CornerDownRight, X
} from 'lucide-react';
import { announcementsService } from '../services/announcements.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀'];

const AnnouncementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Comments state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [replyingToTarget, setReplyingToTarget] = useState(null);
    const commentInputRef = useRef(null);

    // Reactions state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userReaction, setUserReaction] = useState(null);

    useEffect(() => {
        loadAnnouncement();
    }, [id]);

    useEffect(() => {
        if (announcement) {
            loadComments();
        }
    }, [announcement]);

    const loadAnnouncement = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await announcementsService.getAnnouncement(id);
            setAnnouncement(data);
            setIsSubscribed(data.is_subscribed || false);
        } catch (err) {
            console.error('Failed to load announcement:', err);
            setError('Failed to load announcement details');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setCommentsLoading(true);
            const data = await announcementsService.getComments(id);
            setComments(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await announcementsService.addComment(id, {
                content: newComment,
                parent_id: replyTo
            });
            setNewComment('');
            cancelReply();
            loadComments();
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleCommentReact = async (commentId, action) => {
        try {
            await announcementsService.reactComment(id, commentId, action);
            loadComments(); // Refresh comments to update likes/dislikes
        } catch (err) {
            console.error('Failed to react to comment:', err);
        }
    };

    const handleReply = (comment) => {
        setReplyTo(comment.id);
        setReplyingToTarget(comment.user_name || comment.user?.username || 'User');
        setActiveTab('discussion');
        if (commentInputRef.current) {
            commentInputRef.current.focus();
        }
    };

    const cancelReply = () => {
        setReplyTo(null);
        setReplyingToTarget(null);
        setNewComment('');
    };

    const handleReaction = async (emoji) => {
        try {
            await announcementsService.addReaction(id, emoji === '❤️' ? 'like' : emoji);
            setUserReaction(emoji);
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Failed to add reaction:', err);
        }
    };

    const handleHighlightSelect = async (commentId, order) => {
        try {
            await announcementsService.highlightComment(commentId, order);
            loadComments(); // Refresh to see updated orders
        } catch (err) {
            console.error('Failed to highlight comment:', err);
            alert(err.response?.data?.error || 'Failed to highlight comment');
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: announcement?.title,
                    text: announcement?.content?.substring(0, 100),
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handleToggleSubscription = async () => {
        try {
            if (isSubscribed) {
                await announcementsService.unsubscribe(id);
            } else {
                await announcementsService.subscribe(id);
            }
            setIsSubscribed(!isSubscribed);
        } catch (err) {
            console.error('Subscription toggle failed:', err);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: { color: 'text-green-600 bg-green-500/10', icon: CheckCircle, label: 'Active' },
            draft: { color: 'text-gray-600 bg-gray-500/10', icon: FileText, label: 'Draft' },
            scheduled: { color: 'text-blue-600 bg-blue-500/10', icon: Clock, label: 'Scheduled' },
            expired: { color: 'text-red-600 bg-red-500/10', icon: AlertTriangle, label: 'Expired' },
            deactivated: { color: 'text-gray-600 bg-gray-500/10', icon: BellOff, label: 'Deactivated' },
        };
        return configs[status] || configs.active;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'discussion', label: 'Discussion', icon: MessageSquare, count: comments.length },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !announcement) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-red-500 mb-4">{error || 'Announcement not found'}</p>
                        <Button onClick={() => navigate('/announcements')}>Back to Announcements</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const statusConfig = getStatusConfig(announcement.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/announcements')}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">{announcement.title}</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleToggleSubscription}>
                        {isSubscribed ? <BellOff size={18} /> : <Bell size={18} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare}>
                        <Send size={18} className="-rotate-12" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Bookmark size={18} />
                    </Button>
                </div>
            </div>

            {/* Announcement Hero */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/20 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                            <Megaphone className="w-7 h-7 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
                                    <StatusIcon size={14} />
                                    {statusConfig.label}
                                </span>
                                {announcement.priority && (
                                    <span className="px-3 py-1 bg-primary-600/10 text-primary-700 rounded-full text-sm font-medium">
                                        {announcement.priority}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Published</p>
                                <p className="font-semibold text-primary">{announcement.created_at ? formatTimeAgo(announcement.created_at) : 'N/A'}</p>
                            </div>
                        </div>
                        {announcement.expires_at && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Expires</p>
                                    <p className="font-semibold text-primary">{new Date(announcement.expires_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Eye className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Views</p>
                                <p className="font-semibold text-primary">{announcement.views_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reaction Bar */}
                <CardBody className="flex items-center gap-6 border-t border-theme py-3">
                    <button
                        onClick={() => handleReaction('❤️')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${userReaction ? 'bg-red-500/10 text-red-500' : 'hover:bg-red-500/10 text-secondary hover:text-red-500'
                            }`}
                    >
                        <Heart size={18} fill={userReaction ? 'currentColor' : 'none'} />
                        <span>{announcement.likes_count || announcement.reactions_count || ''}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('discussion'); commentInputRef.current?.focus(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-secondary hover:bg-secondary transition-colors"
                    >
                        <MessageSquare size={18} />
                        <span>{comments.length || ''}</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-secondary hover:bg-secondary transition-colors"
                    >
                        <Send size={18} className="-rotate-12" />
                        Share
                    </button>
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="border-b border-theme overflow-x-auto">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-3 text-primary">Announcement Content</h3>
                                    <div className="text-secondary whitespace-pre-wrap leading-relaxed">
                                        {announcement.content || announcement.message || 'No content provided.'}
                                    </div>

                                    {/* Render attached files if they exist */}
                                    {(announcement.files && announcement.files.length > 0) && (
                                        <div className="mt-6 pt-4 border-t border-theme">
                                            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                                                <Paperclip className="w-4 h-4" /> Attached Files
                                            </h4>
                                            <div className="flex flex-col gap-2">
                                                {announcement.files.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={file.url || file.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-theme hover:bg-secondary transition-colors group"
                                                    >
                                                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 truncate">
                                                            <p className="text-sm font-medium text-primary truncate">{file.name || `Attachment ${idx + 1}`}</p>
                                                            <p className="text-xs text-tertiary">Document</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Published by</h3>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shrink-0 overflow-hidden cursor-pointer"
                                            onClick={() => {
                                                if (announcement.user?.id) navigate(`/profile/${announcement.user.id}`);
                                            }}
                                            title="View Publisher Profile"
                                        >
                                            {announcement.user?.avatar_url || announcement.created_by_avatar ? (
                                                <img src={announcement.user?.avatar_url || announcement.created_by_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-semibold text-lg">
                                                    {announcement.user?.first_name?.[0] || announcement.user?.username?.[0] || 'A'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p
                                                className="font-medium text-primary hover:text-primary-600 hover:underline cursor-pointer transition-colors"
                                                onClick={() => {
                                                    if (announcement.user?.id) navigate(`/profile/${announcement.user.id}`);
                                                }}
                                            >
                                                {announcement.user?.first_name || announcement.user?.username || announcement.created_by_name || 'Publisher'}
                                            </p>
                                            <p className="text-sm text-secondary">Author</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Status</span>
                                            <span className="font-medium text-primary">{announcement.status || 'Active'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Comments</span>
                                            <span className="font-medium text-primary">{comments.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Subscribed</span>
                                            <span className={`font-medium ${isSubscribed ? 'text-green-600' : 'text-secondary'}`}>
                                                {isSubscribed ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <div className="mt-6">
                                <Button
                                    variant={isSubscribed ? 'outline' : 'primary'}
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={handleToggleSubscription}
                                >
                                    {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
                                    {isSubscribed ? 'Unsubscribe' : 'Subscribe for Updates'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary">Discussion ({comments.length})</h3>

                            {/* Comment input */}
                            <div className="flex gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    {replyingToTarget && (
                                        <div className="flex items-center justify-between bg-secondary/50 px-3 py-1.5 rounded-md text-sm text-secondary">
                                            <span>Replying to <strong>{replyingToTarget}</strong></span>
                                            <button onClick={cancelReply} className="hover:text-red-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            ref={commentInputRef}
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            placeholder={replyingToTarget ? "Write a reply..." : "Add a comment..."}
                                            className="flex-1 bg-secondary border border-theme rounded-lg px-4 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="rounded-lg px-4"
                                        >
                                            <Send size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments list */}
                            {commentsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Highlighted Comments Section */}
                                    {comments.filter(c => c.highlight_order).length > 0 && (
                                        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                                            <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                                                <Star className="w-4 h-4 fill-current" /> Highlighted Responses
                                            </h4>
                                            {comments.filter(c => c.highlight_order)
                                                .sort((a, b) => a.highlight_order - b.highlight_order)
                                                .map(comment => (
                                                    <div key={`high-${comment.id}`} className="flex gap-3 bg-elevated p-3 rounded-lg shadow-sm border border-theme">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <Users className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm text-primary">{comment.user_name || comment.user?.username || 'User'}</span>
                                                                <span className="text-xs text-amber-600 font-medium">#{comment.highlight_order}</span>
                                                            </div>
                                                            <p className="text-secondary text-sm">{comment.content || comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    {/* All Comments */}
                                    <div className="space-y-4">
                                        {comments.map((comment, idx) => {
                                            const isCreator = user?.id === announcement?.user;
                                            
                                            // Helper to render a comment or reply
                                            const renderComment = (c, isReply = false) => (
                                                <div key={c.id || idx} className={`flex gap-3 ${isReply ? 'mt-4 ml-8 relative before:content-[""] before:absolute before:-left-5 before:top-4 before:w-4 before:h-px before:bg-theme before:rounded-bl-xl border-l-2 border-theme pl-2' : ''}`}>
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        {c.user_avatar ? (
                                                            <img src={c.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 group/comment">
                                                        <div className="border border-theme/40 rounded-xl p-3 bg-secondary hover:bg-elevated hover:border-theme transition-colors relative">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-sm text-primary">{c.user_name || c.user?.username || 'User'}</span>
                                                                <span className="text-xs text-tertiary">{c.created_at || c.time_stamp ? formatTimeAgo(c.created_at || c.time_stamp) : ''}</span>
                                                                {c.highlight_order && !isReply && (
                                                                    <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium flex items-center gap-1">
                                                                        <Star className="w-3 h-3 fill-current" /> #{c.highlight_order}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-secondary text-sm leading-relaxed">{c.content || c.text}</p>
                                                            
                                                            {/* Creator Options Menu */}
                                                            {isCreator && !isReply && (
                                                                <div className="absolute top-2 right-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const menu = document.getElementById(`comment-menu-${c.id}`);
                                                                            if (menu) menu.classList.toggle('hidden');
                                                                        }}
                                                                        className="p-1 text-tertiary hover:text-primary hover:bg-theme rounded-full opacity-0 group-hover/comment:opacity-100 transition-all"
                                                                    >
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </button>
                                                                    <div id={`comment-menu-${c.id}`} className="hidden absolute right-0 top-6 z-20 bg-elevated rounded-xl shadow-lg border border-theme py-1 w-48">
                                                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                                                            <button
                                                                                key={num}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleHighlightSelect(c.id, c.highlight_order === num ? null : num);
                                                                                    document.getElementById(`comment-menu-${c.id}`)?.classList.add('hidden');
                                                                                }}
                                                                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary transition-colors ${c.highlight_order === num ? 'text-amber-600 font-medium' : 'text-primary'}`}
                                                                            >
                                                                                <Pin className="w-4 h-4" />
                                                                                {c.highlight_order === num ? `Unpin #${num}` : `Pin as #${num}`}
                                                                            </button>
                                                                        ))}
                                                                        {c.highlight_order && (
                                                                            <>
                                                                                <hr className="my-1 border-theme" />
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleHighlightSelect(c.id, null);
                                                                                        document.getElementById(`comment-menu-${c.id}`)?.classList.add('hidden');
                                                                                    }}
                                                                                    className="w-full px-4 py-2 text-left text-sm text-red-500 flex items-center gap-2 hover:bg-secondary transition-colors"
                                                                                >
                                                                                    <Star className="w-4 h-4" />
                                                                                    Remove Highlight
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Comment Actions (Like, Dislike, Reply) */}
                                                        <div className="flex items-center gap-4 mt-1.5 ml-1">
                                                            <button 
                                                                onClick={() => handleCommentReact(c.id, 'like')}
                                                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${c.is_liked ? 'text-primary-600' : 'text-tertiary hover:text-primary'}`}
                                                            >
                                                                <ThumbsUp className={`w-3.5 h-3.5 ${c.is_liked ? 'fill-current' : ''}`} />
                                                                {c.likes_count > 0 && <span>{c.likes_count}</span>}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCommentReact(c.id, 'dislike')}
                                                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${c.is_disliked ? 'text-red-600' : 'text-tertiary hover:text-red-500'}`}
                                                            >
                                                                <ThumbsDown className={`w-3.5 h-3.5 ${c.is_disliked ? 'fill-current' : ''}`} />
                                                                {c.dislikes_count > 0 && <span>{c.dislikes_count}</span>}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReply(c)}
                                                                className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary font-medium transition-colors"
                                                            >
                                                                <CornerDownRight className="w-3.5 h-3.5" />
                                                                Reply
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div key={comment.id} className="pt-2">
                                                    {renderComment(comment)}
                                                    {/* Render Replies */}
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-2">
                                                            {comment.replies.map(reply => renderComment(reply, true))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-secondary text-center py-8">No comments yet. Start the discussion!</p>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AnnouncementDetail;
