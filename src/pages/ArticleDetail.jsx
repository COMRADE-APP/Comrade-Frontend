import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Heart, MessageCircle, Bookmark, Share, Send, Flag, DollarSign, Shield, Crown, Lock } from 'lucide-react';
import Button from '../components/common/Button';
import articlesService from '../services/articles.service';
import toast from 'react-hot-toast';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [articleData, commentsData] = await Promise.all([
                    articlesService.getById(id),
                    articlesService.getComments(id)
                ]);
                setArticle(articleData);
                setComments(commentsData.results || commentsData || []);
            } catch (error) {
                console.error('Error fetching article details:', error);
                toast.error('Failed to load article');
                navigate('/articles');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }

        let readTimer = null;
        if (id && article && !article.has_read) {
            readTimer = setTimeout(() => {
                articlesService.recordRead(id).then(() => {
                    setArticle(prev => ({ ...prev, has_read: true }));
                }).catch(console.error);
            }, 5000); // 5 seconds to count as read
        }

        return () => {
            if (readTimer) clearTimeout(readTimer);
        };
    }, [id, navigate, article?.has_read]);

    const handleLike = async () => {
        try {
            await articlesService.toggleLike(id);
            setArticle(prev => ({
                ...prev,
                is_liked: !prev.is_liked,
                likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1
            }));
        } catch (error) {
            toast.error('Failed to like article');
        }
    };

    const handleBookmark = async () => {
        try {
            await articlesService.toggleBookmark(id);
            setArticle(prev => ({
                ...prev,
                is_bookmarked: !prev.is_bookmarked
            }));
            toast.success(article.is_bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
        } catch (error) {
            toast.error('Failed to bookmark article');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const newComment = await articlesService.addComment(id, commentText);
            setComments(prev => [newComment, ...prev]);
            setCommentText('');
            setArticle(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 bg-secondary rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-secondary rounded w-1/4 mb-8"></div>
                <div className="h-64 bg-secondary rounded-xl mb-8"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-secondary rounded w-full"></div>
                    <div className="h-4 bg-secondary rounded w-full"></div>
                    <div className="h-4 bg-secondary rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!article) return null;

    const tierConfig = {
        free: { label: 'Free', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: null },
        standard: { label: 'Standard', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Shield },
        premium: { label: 'Premium', color: 'bg-primary-600/10 text-primary-600 border-primary-600/20', icon: Crown },
        gold: { label: 'Gold', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Crown },
    };
    const accessTier = article.access_tier || 'free';
    const tier = tierConfig[accessTier] || tierConfig.free;
    const TierIcon = tier.icon;

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Navigation Header */}
            <div className="bg-elevated border-b border-theme sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/articles')}
                        className="flex items-center text-secondary hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Articles
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBookmark}
                            className={`p-2 rounded-full transition-colors ${article.is_bookmarked ? 'text-primary bg-primary/10' : 'text-secondary hover:text-primary hover:bg-primary/10'}`}
                            title="Bookmark"
                        >
                            <Bookmark className={`w-5 h-5 ${article.is_bookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="Share"
                        >
                            <Share className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 py-8">
                {/* Article Header */}
                <header className="mb-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                            {article.category}
                        </span>
                        {/* Access Tier Badge */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${tier.color}`}>
                            {TierIcon && <TierIcon size={14} />}
                            {tier.label}
                        </span>
                        {article.tags?.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-secondary text-secondary rounded-full text-sm">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y border-theme">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
                                {article.author?.avatar ? (
                                    <img src={article.author.avatar} alt={article.author?.name} className="w-full h-full object-cover" />
                                ) : (
                                    article.author?.name?.[0] || 'U'
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-primary text-lg">{article.author?.name}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mt-1">
                                    <span className="flex items-center gap-1" title="Posted">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                    {article.updated_at && article.updated_at !== article.created_at && (
                                        <span className="flex items-center gap-1 text-tertiary" title="Updated">
                                            • Updated {new Date(article.updated_at).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {article.read_time || Math.ceil(article.content.split(' ').length / 200)} min read
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Cover Image */}
                {article.cover_image && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
                        <img
                            src={article.cover_image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Article Content */}
                <div
                    className="prose prose-lg prose-headings:font-bold prose-headings:text-primary prose-a:text-primary prose-p:text-secondary prose-strong:text-primary prose-li:text-secondary max-w-none mb-12"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Attachments */}
                {article.attachments && article.attachments.length > 0 && (
                    <div className="mb-12 p-6 bg-tertiary/5 rounded-xl border border-theme">
                        <h3 className="text-lg font-semibold mb-4 text-primary">Attachments</h3>
                        <div className="space-y-2">
                            {article.attachments.map((file) => (
                                <a
                                    key={file.id}
                                    href={file.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-elevated rounded-lg border border-theme hover:border-primary transition-all group"
                                >
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Share className="w-5 h-5 rotate-90" />
                                    </div>
                                    <span className="font-medium text-primary group-hover:text-primary transition-colors">
                                        Download attachment
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Engagement Bar */}
                <div className="flex items-center justify-between py-6 border-t border-theme mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${article.likes_count > 0 ? 'bg-red-500/10 text-red-600' : 'bg-secondary text-secondary hover:bg-secondary/80'}`}
                        >
                            <Heart className={`w-5 h-5 ${article.is_liked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{article.likes_count} Likes</span>
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary rounded-full">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">{article.comments_count} Comments</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <section className="bg-elevated rounded-2xl shadow-sm border border-theme p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-primary mb-8">Comments ({comments.length})</h3>

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mb-10">
                        <div className="relative">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full p-4 pr-12 bg-secondary border border-theme rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[120px] resize-none text-primary"
                            />
                            <div className="absolute bottom-4 right-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={!commentText.trim() || submittingComment}
                                >
                                    {submittingComment ? 'Posting...' : 'Post Comment'}
                                    <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-8">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-secondary italic">
                                Be the first to start the conversation!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary font-bold overflow-hidden">
                                            {comment.author_details?.avatar ? (
                                                <img src={comment.author_details.avatar} alt={comment.author_name} className="w-full h-full object-cover" />
                                            ) : (
                                                comment.author_name?.[0] || 'U'
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-secondary p-4 rounded-2xl rounded-tl-none">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-primary">{comment.author_name}</h4>
                                                <span className="text-xs text-secondary">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-secondary whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Support Creator + Report */}
                <div className="mt-8 flex flex-col md:flex-row gap-4">
                    {article.support_enabled && (
                        <div className="flex-1 bg-gradient-to-br from-amber-500/5 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-center gap-4">
                            <DollarSign className="w-10 h-10 text-amber-500" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-primary">Support the Author</h3>
                                <p className="text-sm text-secondary">Show appreciation for this article</p>
                            </div>
                            <Button
                                variant="primary"
                                className="bg-amber-500 hover:bg-amber-600"
                                onClick={() => navigate(`/payments/send?to=${article.author}&reason=article_support&ref=${id}`)}
                            >
                                <Heart size={16} className="mr-2" /> Support
                            </Button>
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`/report?type=article&id=${id}&title=${encodeURIComponent(article.title || '')}`)}
                        className="flex items-center gap-2 p-3 text-sm text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                    >
                        <Flag size={16} />
                        Report this article
                    </button>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetail;
