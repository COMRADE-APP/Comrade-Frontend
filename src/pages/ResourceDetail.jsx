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
    Star, Heart, Tag, Flag, DollarSign, ExternalLink
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
    const [replyTo, setReplyTo] = useState(null); // Parent comment ID
    const [replyingToTarget, setReplyingToTarget] = useState(null); // Full comment object
    const commentInputRef = useRef(null);

    // Reactions state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userReaction, setUserReaction] = useState(null);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, content: '' });
    const [hoverRating, setHoverRating] = useState(0);

    // File viewer state
    const [viewerFile, setViewerFile] = useState(null);
    const [savingOffline, setSavingOffline] = useState({});

    useEffect(() => {
        loadResource();
    }, [id]);

    useEffect(() => {
        if (resource) {
            loadComments();
            loadReviews();
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

    const loadReviews = async () => {
        try {
            const data = await resourcesService.getReviews(id);
            setReviews(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error('Failed to load reviews:', err);
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
            await resourcesService.addComment(id, {
                content: newComment,
                parent_id: replyTo
            });
            setNewComment('');
            setReplyTo(null);
            setReplyingToTarget(null);
            loadComments();
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleCommentReact = async (commentId, action) => {
        try {
            await resourcesService.reactComment?.(id, commentId, action);
            loadComments();
        } catch (err) {
            console.error(`Failed to ${action} comment:`, err);
        }
    };

    const handleReply = (comment) => {
        setReplyTo(comment.id);
        setReplyingToTarget(comment);
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

    const handleDownload = async (fileUrl, fileName) => {
        const url = fileUrl || resource?.file;
        const name = fileName || resource?.title || 'resource';
        if (!url) return;

        const key = url;
        setSavingOffline(prev => ({ ...prev, [key]: true }));
        try {
            // Cache for offline access
            if ('caches' in window) {
                const cache = await caches.open('qomrade-resources-offline');
                await cache.add(url);
            }
            // Also trigger local file save as fallback
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = name;
            link.click();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Save offline failed:', err);
            // Fallback: just open the file
            window.open(url, '_blank');
        } finally {
            setSavingOffline(prev => ({ ...prev, [key]: false }));
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
                    <div className="flex gap-2 flex-shrink-0">
                        {resource.file && (
                            <button
                                onClick={() => setViewerFile({ url: resource.file, name: resource.title || resource.name, type: resource.file_type })}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-elevated border border-theme text-primary rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                            >
                                <Eye size={18} />
                                View
                            </button>
                        )}
                        <Button variant="primary" onClick={() => handleDownload(resource.file, resource.title || resource.name)} className="flex items-center gap-2">
                            <Download size={18} />
                            Save Offline
                        </Button>
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

            {/* File Preview Section */}
            {resource.file && (() => {
                let parsedExt = '';
                try {
                    const urlObj = new URL(resource.file, window.location.origin);
                    parsedExt = urlObj.pathname.split('.').pop();
                } catch(e) {}
                const ext = (parsedExt || resource.file_name?.split('.').pop() || resource.file_type || '').toLowerCase();
                const fileUrl = resource.file;
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                const isPdf = ext === 'pdf';
                const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext);
                const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
                const hasPreview = isImage || isPdf || isVideo || isAudio || isDoc;

                if (!hasPreview) return null;

                return (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                                <Eye size={18} /> File Preview
                            </h3>
                            <div className="rounded-xl overflow-hidden border border-theme bg-secondary/20">
                                {isImage && (
                                    <img
                                        src={fileUrl}
                                        alt={resource.title || 'Resource preview'}
                                        className="w-full max-h-[600px] object-contain bg-black/5"
                                        loading="lazy"
                                    />
                                )}
                                {isPdf && (
                                    <iframe
                                        src={fileUrl}
                                        title="PDF Preview"
                                        className="w-full h-[700px] border-0"
                                        loading="lazy"
                                    />
                                )}
                                {isVideo && (
                                    <video
                                        controls
                                        preload="metadata"
                                        className="w-full max-h-[600px]"
                                    >
                                        <source src={fileUrl} type={`video/${ext === 'mkv' ? 'x-matroska' : ext}`} />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                                {isAudio && (
                                    <div className="p-6 flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                                            <Music className="w-12 h-12 text-primary" />
                                        </div>
                                        <p className="text-sm text-secondary">{resource.title || resource.name}</p>
                                        <audio controls preload="metadata" className="w-full max-w-lg">
                                            <source src={fileUrl} type={`audio/${ext}`} />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                                {isDoc && (
                                    <iframe
                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                                        title="Document Preview"
                                        className="w-full h-[700px] border-0"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        </CardBody>
                    </Card>
                );
            })()}

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
                                    <p className="text-secondary whitespace-pre-wrap mb-4">{resource.description || resource.desc || 'No description provided.'}</p>

                                    {/* Resource Files Section with Previews */}
                                    {(() => {
                                        const files = [];
                                        if (resource.file) {
                                            let parsedExt = '';
                                            try {
                                                const urlObj = new URL(resource.file, window.location.origin);
                                                parsedExt = urlObj.pathname.split('.').pop();
                                            } catch(e) {}
                                            files.push({ url: resource.file, name: resource.title || resource.file.split('/').pop(), type: parsedExt || resource.file_type || 'Unknown' });
                                        }
                                        if (files.length === 0 && !resource.res_link) return null;

                                        const getPreview = (f) => {
                                            const ext = (f.type || '').toLowerCase();
                                            const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                                            const isVid = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                                            const isAud = ['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext);
                                            const isPdf = ext === 'pdf';
                                            const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
                                            return { isImg, isVid, isAud, isPdf, isDoc };
                                        };

                                        return (
                                            <div className="pt-4 border-t border-theme space-y-3">
                                                <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                                                    <File size={16} /> Resource Files ({files.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {files.map((f, idx) => {
                                                        const { isImg, isVid, isAud, isPdf, isDoc } = getPreview(f);
                                                        const FIcon = FILE_ICONS[(f.type || '').toLowerCase()] || File;
                                                        return (
                                                            <div key={idx} className="rounded-xl border border-theme overflow-hidden bg-secondary/5">
                                                                {isImg && (
                                                                    <div className="h-40 bg-black/10 flex items-center justify-center cursor-pointer" onClick={() => setViewerFile(f)}>
                                                                        <img src={f.url} alt={f.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                                                                    </div>
                                                                )}
                                                                {isVid && (
                                                                    <div className="h-40 bg-black/20 flex items-center justify-center">
                                                                        <video src={f.url} preload="metadata" className="max-h-full max-w-full" />
                                                                        <button onClick={() => setViewerFile(f)} className="absolute inset-0 flex items-center justify-center">
                                                                            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center"><Film size={20} className="text-white" /></div>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {isAud && (
                                                                    <div className="p-3 bg-indigo-500/5">
                                                                        <audio controls preload="metadata" className="w-full h-8"><source src={f.url} /></audio>
                                                                    </div>
                                                                )}
                                                                {(isPdf || isDoc) && (
                                                                    <div className="h-40 bg-secondary/5 border-b border-theme flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/10 transition-colors" onClick={() => setViewerFile(f)}>
                                                                        <FileText className="w-12 h-12 text-primary/40 mb-2" />
                                                                        <span className="text-sm font-medium text-primary bg-background px-3 py-1 rounded-full shadow-sm border border-theme">Click to Preview</span>
                                                                    </div>
                                                                )}
                                                                {/* File info bar */}
                                                                <div className="flex items-center gap-3 px-4 py-3">
                                                                    <FIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-primary truncate">{f.name}</p>
                                                                        <p className="text-xs text-secondary uppercase">{f.type}</p>
                                                                    </div>
                                                                    <div className="flex gap-2 shrink-0">
                                                                        <button
                                                                            onClick={() => setViewerFile(f)}
                                                                            className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold rounded-lg transition-colors"
                                                                        >
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDownload(f.url, f.name)}
                                                                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                                                        >
                                                                            {savingOffline[f.url] ? (
                                                                                <span className="animate-spin inline-block w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full"></span>
                                                                            ) : (
                                                                                <Download size={12} />
                                                                            )}
                                                                            Save Offline
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {resource.res_link && (
                                                        <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl border border-theme">
                                                            <ExternalLink className="w-5 h-5 text-indigo-500 shrink-0" />
                                                            <span className="text-sm font-medium text-primary truncate flex-1">{resource.res_link}</span>
                                                            <a href={resource.res_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-xs font-semibold rounded-lg shrink-0 transition-colors">
                                                                Open Link
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                                            <span className="font-medium text-primary">{resource.file_size ? formatFileSize(resource.file_size) : 'Unknown size'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Visibility</span>
                                            <span className="font-medium text-primary">{resource.visibility || 'Public'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Uploaded</span>
                                            <span className="font-medium text-primary">{resource.created_on ? formatTimeAgo(resource.created_on) : 'N/A'}</span>
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
                            {replyingToTarget && (
                                <div className="flex items-center justify-between bg-primary/5 p-2 rounded-t-lg -mb-2 z-10 relative text-sm border-x border-t border-theme">
                                    <span className="text-secondary text-xs">
                                        Replying to <span className="font-semibold">{replyingToTarget.user_name || 'User'}</span>
                                    </span>
                                    <button onClick={cancelReply} className="text-tertiary hover:text-primary text-xs">Cancel</button>
                                </div>
                            )}
                            <div className={`flex gap-3 mb-6 ${replyingToTarget ? 'relative z-20' : ''}`}>
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
                                        placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                                        className={`flex-1 bg-secondary border border-theme px-4 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 ${replyingToTarget ? 'rounded-b-lg rounded-tr-lg rounded-tl-none border-t-0' : 'rounded-full'}`}
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
                                <div className="space-y-6">
                                    {comments.map((comment, idx) => (
                                        <div key={comment.id || idx} className="flex gap-3">
                                            {/* Avatar */}
                                            {comment.user_avatar ? (
                                                <img src={comment.user_avatar} alt="User" className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-theme" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-theme">
                                                    <span className="text-sm font-bold text-primary">{(comment.user_name || 'U')[0]}</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-primary">{comment.user_name || comment.user?.username || 'User'}</span>
                                                    <span className="text-xs text-tertiary">{comment.created_at ? formatTimeAgo(comment.created_at) : ''}</span>
                                                </div>
                                                <p className="text-secondary text-sm mb-2 leading-relaxed">{comment.content || comment.text}</p>
                                                
                                                {/* Interaction Bar */}
                                                <div className="flex items-center gap-4 text-xs font-semibold text-tertiary mb-3">
                                                    <button 
                                                        onClick={() => handleCommentReact(comment.id, 'like')}
                                                        className={`flex items-center gap-1.5 transition-colors ${comment.is_liked ? 'text-primary' : 'hover:text-primary'}`}
                                                    >
                                                        <Heart size={14} className={comment.is_liked ? "fill-primary" : ""} />
                                                        {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCommentReact(comment.id, 'dislike')}
                                                        className={`flex items-center gap-1.5 transition-colors ${comment.is_disliked ? 'text-red-500' : 'hover:text-primary'}`}
                                                    >
                                                        <Flag size={14} className={comment.is_disliked ? "fill-red-500 stroke-red-500" : ""} />
                                                        {comment.dislikes_count > 0 && <span>{comment.dislikes_count}</span>}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReply(comment)}
                                                        className="hover:text-primary transition-colors flex items-center gap-1.5"
                                                    >
                                                        <MessageSquare size={14} /> Reply
                                                    </button>
                                                </div>

                                                {/* Replies */}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-theme/50">
                                                        {comment.replies.map(reply => (
                                                            <div key={reply.id} className="flex gap-3">
                                                                {reply.user_avatar ? (
                                                                    <img src={reply.user_avatar} alt="User" className="w-6 h-6 rounded-full flex-shrink-0 object-cover border border-theme" />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-theme">
                                                                        <span className="text-xs font-bold text-primary">{(reply.user_name || 'U')[0]}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium text-xs text-primary">{reply.user_name || 'User'}</span>
                                                                        <span className="text-[10px] text-tertiary">{reply.created_at ? formatTimeAgo(reply.created_at) : ''}</span>
                                                                    </div>
                                                                    <p className="text-secondary text-sm mb-1">{reply.content}</p>
                                                                    <div className="flex items-center gap-3 text-[11px] font-semibold text-tertiary">
                                                                        <button 
                                                                            onClick={() => handleCommentReact(reply.id, 'like')}
                                                                            className={`flex items-center gap-1 hover:text-primary ${reply.is_liked ? 'text-primary' : ''}`}
                                                                        >
                                                                            <Heart size={12} className={reply.is_liked ? "fill-primary" : ""} />
                                                                            {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleCommentReact(reply.id, 'dislike')}
                                                                            className={`flex items-center gap-1 hover:text-primary ${reply.is_disliked ? 'text-red-500' : ''}`}
                                                                        >
                                                                            <Flag size={12} className={reply.is_disliked ? "fill-red-500 stroke-red-500" : ""} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
                                            await resourcesService.addReview(id, newReview);
                                            setNewReview({ rating: 0, content: '' });
                                            loadReviews();
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

            {/* File Viewer Overlay */}
            {viewerFile && (() => {
                let parsedExt = '';
                try {
                    const urlObj = new URL(viewerFile.url, window.location.origin);
                    parsedExt = urlObj.pathname.split('.').pop();
                } catch(e) {}
                const ext = (parsedExt || viewerFile.type || viewerFile.url?.split('.').pop() || '').toLowerCase();
                const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                const isPdf = ext === 'pdf';
                const isVid = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                const isAud = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext);
                const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);

                return (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
                        {/* Viewer header */}
                        <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <File className="w-5 h-5 text-gray-400 shrink-0" />
                                <span className="text-white font-medium text-sm truncate">{viewerFile.name}</span>
                                <span className="text-gray-500 text-xs uppercase">{ext}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
                                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Download size={14} /> Save Offline
                                </button>
                                <button
                                    onClick={() => setViewerFile(null)}
                                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                                >
                                    <span className="text-white text-lg">&times;</span>
                                </button>
                            </div>
                        </div>

                        {/* Viewer content */}
                        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                            {isImg && (
                                <img src={viewerFile.url} alt={viewerFile.name} className="max-w-full max-h-full object-contain rounded-lg" />
                            )}
                            {isPdf && (
                                <iframe src={viewerFile.url} title="PDF Viewer" className="w-full h-full rounded-lg border-0" />
                            )}
                            {isVid && (
                                <video controls autoPlay className="max-w-full max-h-full rounded-lg">
                                    <source src={viewerFile.url} />
                                </video>
                            )}
                            {isAud && (
                                <div className="text-center">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-primary-600/20 flex items-center justify-center mx-auto mb-6">
                                        <Music className="w-16 h-16 text-indigo-400" />
                                    </div>
                                    <p className="text-white font-medium mb-4">{viewerFile.name}</p>
                                    <audio controls autoPlay className="w-80">
                                        <source src={viewerFile.url} />
                                    </audio>
                                </div>
                            )}
                            {isDoc && (
                                <iframe
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(viewerFile.url)}&embedded=true`}
                                    title="Document Viewer"
                                    className="w-full h-full rounded-lg border-0"
                                />
                            )}
                            {!isImg && !isPdf && !isVid && !isAud && !isDoc && (
                                <div className="text-center text-gray-400">
                                    <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p>Preview not available for this file type.</p>
                                    <button
                                        onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
                                        className="mt-4 px-6 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Save Offline Instead
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default ResourceDetail;
