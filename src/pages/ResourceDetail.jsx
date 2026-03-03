/**
 * Resource Detail Page
 * View resource details with comments, reactions, sharing, and download
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ArrowLeft, Share2, Bookmark, FileText, Download, Eye,
    Clock, Users, MessageSquare, Send, Smile, File,
    Image, Film, Music, Archive, Globe, Lock,
    Star, Heart, Tag, Flag, DollarSign
} from 'lucide-react';
import { resourcesService } from '../services/resources.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀'];

const FILE_ICONS = {
    pdf: FileText,
    doc: FileText, docx: FileText,
    xls: FileText, xlsx: FileText,
    ppt: FileText, pptx: FileText,
    jpg: Image, jpeg: Image, png: Image, gif: Image, svg: Image, webp: Image,
    mp4: Film, mov: Film, avi: Film, mkv: Film,
    mp3: Music, wav: Music, flac: Music,
    zip: Archive, rar: Archive, '7z': Archive, tar: Archive,
};

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);

    // Comments state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const commentInputRef = useRef(null);

    // Reactions state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userReaction, setUserReaction] = useState(null);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, content: '' });
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        loadResource();
    }, [id]);

    useEffect(() => {
        if (resource) {
            loadComments();
        }
    }, [resource]);

    const loadResource = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await resourcesService.getById(id);
            setResource(data);
        } catch (err) {
            console.error('Failed to load resource:', err);
            setError('Failed to load resource details');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setCommentsLoading(true);
            const data = await resourcesService.getComments(id);
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
            await resourcesService.addComment(id, { content: newComment });
            setNewComment('');
            loadComments();
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleReaction = async (emoji) => {
        try {
            await resourcesService.addReaction(id, emoji);
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
                    title: resource?.title,
                    text: resource?.description?.substring(0, 100),
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

    const handleDownload = async () => {
        try {
            await resourcesService.download(id);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const getFileIcon = () => {
        if (!resource?.file_type && !resource?.file_name) return File;
        const ext = (resource.file_type || resource.file_name?.split('.').pop() || '').toLowerCase();
        return FILE_ICONS[ext] || File;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'discussion', label: 'Discussion', icon: MessageSquare, count: comments.length },
        { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-red-500 mb-4">{error || 'Resource not found'}</p>
                        <Button onClick={() => navigate('/resources')}>Back to Resources</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const FileIcon = getFileIcon();

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/resources')}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">{resource.title || resource.name}</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleShare}>
                        <Share2 size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Bookmark size={18} />
                    </Button>
                </div>
            </div>

            {/* Resource Hero */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/20 p-6 md:p-8 flex items-center gap-6">
                    <div className="w-20 h-20 bg-elevated rounded-2xl flex items-center justify-center shadow-sm border border-theme">
                        <FileIcon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-primary truncate">{resource.title || resource.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-secondary">
                            {resource.file_type && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase">
                                    {resource.file_type}
                                </span>
                            )}
                            <span>{formatFileSize(resource.file_size || resource.size)}</span>
                            <span className="flex items-center gap-1">
                                {resource.visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />}
                                {resource.visibility || 'Public'}
                            </span>
                        </div>
                    </div>
                    <Button variant="primary" onClick={handleDownload} className="flex items-center gap-2 flex-shrink-0">
                        <Download size={18} />
                        Download
                    </Button>
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
                                    <h3 className="font-semibold text-lg mb-3 text-primary">Description</h3>
                                    <p className="text-secondary whitespace-pre-wrap">{resource.description || 'No description provided.'}</p>
                                </CardBody>
                            </Card>

                            {/* Tags */}
                            {resource.tags && resource.tags.length > 0 && (
                                <Card>
                                    <CardBody>
                                        <h3 className="font-semibold mb-3 text-primary flex items-center gap-2">
                                            <Tag size={16} /> Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(resource.tags) ? resource.tags : resource.tags.split(',')).map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                    #{typeof tag === 'string' ? tag.trim() : tag}
                                                </span>
                                            ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Uploaded by</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-primary">{resource.uploaded_by_name || resource.created_by_name || 'Unknown'}</p>
                                            <p className="text-sm text-secondary">Uploader</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Resource Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Type</span>
                                            <span className="font-medium text-primary uppercase">{resource.file_type || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Size</span>
                                            <span className="font-medium text-primary">{formatFileSize(resource.file_size || resource.size)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Visibility</span>
                                            <span className="font-medium text-primary">{resource.visibility || 'Public'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Uploaded</span>
                                            <span className="font-medium text-primary">{resource.created_at ? formatTimeAgo(resource.created_at) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Support Creator */}
                            {resource.support_enabled && (
                                <Card className="bg-gradient-to-br from-yellow-500/5 to-amber-500/10 border-amber-500/20">
                                    <CardBody className="text-center space-y-3">
                                        <DollarSign className="w-8 h-8 text-amber-500 mx-auto" />
                                        <h3 className="font-semibold text-primary">Support the Creator</h3>
                                        <p className="text-sm text-secondary">Show appreciation for this resource</p>
                                        <Button
                                            variant="primary"
                                            className="w-full bg-amber-500 hover:bg-amber-600"
                                            onClick={() => navigate(`/payments/send?to=${resource.user || resource.uploaded_by}&reason=resource_support&ref=${id}`)}
                                        >
                                            <Heart size={16} className="mr-2" /> Support
                                        </Button>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Report */}
                            <button
                                onClick={() => navigate(`/report?type=resource&id=${id}&title=${encodeURIComponent(resource.title || resource.name || '')}`)}
                                className="w-full flex items-center gap-2 p-3 text-sm text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                            >
                                <Flag size={16} />
                                Report this resource
                            </button>
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

                {activeTab === 'reviews' && (
                    <Card>
                        <CardBody className="space-y-6">
                            <h3 className="font-semibold text-lg text-primary">Reviews ({reviews.length})</h3>

                            {/* Review Form */}
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setNewReview(p => ({ ...p, rating: s }))}
                                            onMouseEnter={() => setHoverRating(s)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-colors"
                                        >
                                            <Star
                                                size={24}
                                                className={s <= (hoverRating || newReview.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-secondary'}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm text-secondary">{newReview.rating > 0 ? `${newReview.rating}/5` : 'Rate this resource'}</span>
                                </div>
                                <textarea
                                    value={newReview.content}
                                    onChange={(e) => setNewReview(p => ({ ...p, content: e.target.value }))}
                                    placeholder="Write your review..."
                                    rows={3}
                                    className="w-full bg-secondary border border-theme rounded-lg px-4 py-2 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                                />
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={!newReview.rating || !newReview.content.trim()}
                                    onClick={async () => {
                                        try {
                                            await resourcesService.addReview?.(id, newReview);
                                            setNewReview({ rating: 0, content: '' });
                                        } catch (e) { console.error(e); }
                                    }}
                                >
                                    <Send size={14} className="mr-1" /> Submit Review
                                </Button>
                            </div>

                            {/* Reviews List */}
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review, idx) => (
                                        <div key={review.id || idx} className="border border-theme/30 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-primary">{(review.user_name || 'U')[0]}</span>
                                                </div>
                                                <span className="font-medium text-sm text-primary">{review.user_name || 'User'}</span>
                                                <div className="flex gap-0.5 ml-auto">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-secondary'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-secondary text-sm">{review.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary text-center py-8">No reviews yet. Be the first to review!</p>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ResourceDetail;
