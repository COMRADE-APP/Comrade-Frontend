import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Heart, MessageCircle, Bookmark, Share, Send } from 'lucide-react';
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
    }, [id, navigate]);

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

    const renderMarkdown = (text) => {
        if (!text) return '';
        // Simple markdown replacement (same as CreateArticle for consistency)
        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-6 text-gray-900">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-primary-600">$1</code>')
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary-500 pl-4 italic text-gray-600 my-6 bg-gray-50 p-4 rounded-r-lg">$1</blockquote>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc marker:text-primary-500 mb-1">$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal marker:text-primary-500 mb-1">$1</li>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, '<br/>');
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Navigation Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/articles')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Articles
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBookmark}
                            className={`p-2 rounded-full transition-colors ${article.is_bookmarked ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50'}`}
                            title="Bookmark"
                        >
                            <Bookmark className={`w-5 h-5 ${article.is_bookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
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
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                            {article.category}
                        </span>
                        {article.tags?.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                                {article.author_details?.avatar ? (
                                    <img src={article.author_details.avatar} alt={article.author_name} className="w-full h-full object-cover" />
                                ) : (
                                    article.author_name?.[0] || 'U'
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 text-lg">{article.author_name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
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
                    className="prose prose-lg prose-headings:font-bold prose-a:text-primary-600 max-w-none mb-12"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
                />

                {/* Attachments */}
                {article.attachments && article.attachments.length > 0 && (
                    <div className="mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                        <div className="space-y-2">
                            {article.attachments.map((file) => (
                                <a
                                    key={file.id}
                                    href={file.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-100 transition-colors">
                                        <Share className="w-5 h-5 rotate-90" />
                                    </div>
                                    <span className="font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
                                        Download attachment
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Engagement Bar */}
                <div className="flex items-center justify-between py-6 border-t border-gray-200 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${article.is_liked
                                ? 'bg-red-50 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${article.is_liked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{article.likes_count} Likes</span>
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">{article.comments_count} Comments</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Comments ({comments.length})</h3>

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mb-10">
                        <div className="relative">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none min-h-[120px] resize-none"
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
                            <div className="text-center py-8 text-gray-500 italic">
                                Be the first to start the conversation!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                            {comment.author_details?.avatar ? (
                                                <img src={comment.author_details.avatar} alt={comment.author_name} className="w-full h-full object-cover" />
                                            ) : (
                                                comment.author_name?.[0] || 'U'
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-900">{comment.author_name}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </article>
        </div>
    );
};

export default ArticleDetail;
