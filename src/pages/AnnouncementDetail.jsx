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
    ArrowLeft, Share2, Bookmark, FileText, Bell, BellOff,
    Clock, Users, MessageSquare, Send, Smile, Calendar,
    CheckCircle, AlertTriangle, Megaphone, Eye
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
            await announcementsService.addComment(id, { content: newComment });
            setNewComment('');
            loadComments();
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleReaction = async (emoji) => {
        try {
            await announcementsService.addReaction(id, emoji);
            setUserReaction(emoji);
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Failed to add reaction:', err);
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
                        <Share2 size={18} />
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
                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-sm font-medium">
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
                <CardBody className="flex items-center gap-4 border-t border-theme py-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${userReaction ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-secondary'
                                }`}
                        >
                            {userReaction || <Smile size={18} />}
                            <span className="ml-1">React</span>
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute top-full left-0 mt-2 p-3 bg-elevated rounded-xl shadow-lg border border-theme z-50 grid grid-cols-8 gap-1.5 w-72">
                                {COMMON_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-xl hover:bg-secondary rounded-lg p-1.5 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setActiveTab('discussion'); commentInputRef.current?.focus(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-secondary hover:bg-secondary transition-colors"
                    >
                        <MessageSquare size={18} />
                        Comment
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-secondary hover:bg-secondary transition-colors"
                    >
                        <Share2 size={18} />
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
                                </CardBody>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Published by</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                            <Megaphone className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-primary">{announcement.created_by_name || 'Publisher'}</p>
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
                                <div className="flex-1 flex gap-2">
                                    <input
                                        ref={commentInputRef}
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-secondary border border-theme rounded-full px-4 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="rounded-full px-4"
                                    >
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* Comments list */}
                            {commentsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-4">
                                    {comments.map((comment, idx) => (
                                        <div key={comment.id || idx} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-primary">{comment.user_name || comment.user?.username || 'User'}</span>
                                                    <span className="text-xs text-tertiary">{comment.created_at ? formatTimeAgo(comment.created_at) : ''}</span>
                                                </div>
                                                <p className="text-secondary text-sm">{comment.content || comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
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
