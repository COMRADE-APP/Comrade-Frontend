import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Clock, User, Heart, MessageCircle, Bookmark, Share, Search, Plus } from 'lucide-react';
import articlesService from '../services/articles.service';
import toast from 'react-hot-toast';

const Articles = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchArticles();
    }, [searchQuery, selectedCategory]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (selectedCategory !== 'all') params.category = selectedCategory;

            const response = await articlesService.getAll(params);
            // Handle both pagination results (response.results) or direct array
            setArticles(response.results || response || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
            toast.error('Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (e, id) => {
        e.preventDefault(); // Prevent navigation if clicking card
        e.stopPropagation();
        try {
            await articlesService.toggleLike(id);
            // Optimistic update or refetch
            setArticles(prev => prev.map(art =>
                art.id === id
                    ? { ...art, is_liked: !art.is_liked, likes_count: art.is_liked ? art.likes_count - 1 : art.likes_count + 1 }
                    : art
            ));
        } catch (error) {
            toast.error('Failed to like article');
        }
    };

    const handleBookmark = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await articlesService.toggleBookmark(id);
            setArticles(prev => prev.map(art =>
                art.id === id
                    ? { ...art, is_bookmarked: !art.is_bookmarked }
                    : art
            ));
            toast.success('Bookmark updated');
        } catch (error) {
            toast.error('Failed to bookmark article');
        }
    };

    const categories = ['all', 'Technology', 'Business', 'Wellness', 'Education', 'Science'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Articles</h1>
                    <p className="text-secondary mt-1">Discover insights and stories from our community</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/articles/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Write Article
                </Button>
            </div>

            {/* Search and Categories */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-elevated border border-theme text-primary rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-primary text-white'
                                : 'bg-elevated text-secondary hover:bg-secondary'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 bg-tertiary/10 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">No articles found</h3>
                    <p className="text-secondary">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => (
                        <Link to={`/articles/${article.id}`} key={article.id}>
                            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full">
                                {/* Cover Image */}
                                <div className="relative h-48 overflow-hidden bg-secondary">
                                    {article.cover_image ? (
                                        <img
                                            src={article.cover_image}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-tertiary">
                                            <BookOpen className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-3 py-1 bg-elevated/90 backdrop-blur-sm rounded-full text-xs font-semibold text-primary">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>

                                <CardBody className="p-5 flex flex-col h-full">
                                    <h3 className="font-bold text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-secondary text-sm mb-4 line-clamp-2">
                                        {article.excerpt || article.content.substring(0, 100) + '...'}
                                    </p>

                                    {/* Author and Meta */}
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                                    {article.author_details?.avatar ? (
                                                        <img src={article.author_details.avatar} alt={article.author_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        article.author_name?.[0] || 'U'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-primary">{article.author_name}</p>
                                                    <p className="text-xs text-secondary flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(article.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-theme">
                                            <div className="flex items-center gap-4 text-secondary text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Heart className={`w-4 h-4 ${article.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                                    {article.likes_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-4 h-4" />
                                                    {article.comments_count || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleBookmark(e, article.id)}
                                                    className={`p-2 rounded-full transition-colors ${article.is_bookmarked ? 'text-primary bg-primary/10' : 'text-secondary hover:text-primary hover:bg-primary/10'}`}
                                                >
                                                    <Bookmark className={`w-4 h-4 ${article.is_bookmarked ? 'fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigator.share?.({ title: article.title, url: window.location.href + '/' + article.id });
                                                    }}
                                                    className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                >
                                                    <Share className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Articles;
