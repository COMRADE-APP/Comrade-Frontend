import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Clock, User, Heart, MessageCircle, Bookmark, Share, Search } from 'lucide-react';

const Articles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        // Simulated data - replace with actual API call
        setTimeout(() => {
            setArticles([
                {
                    id: 1,
                    title: 'Getting Started with React Hooks: A Comprehensive Guide',
                    excerpt: 'Learn how to use React Hooks effectively in your projects. This guide covers useState, useEffect, useContext, and custom hooks.',
                    author: { name: 'Jane Smith', avatar: null },
                    category: 'Technology',
                    readTime: 8,
                    publishDate: '2024-01-10',
                    likes: 234,
                    comments: 45,
                    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
                },
                {
                    id: 2,
                    title: 'The Future of Remote Work: Trends and Predictions',
                    excerpt: 'Explore how remote work is evolving and what it means for businesses and employees in the coming years.',
                    author: { name: 'John Doe', avatar: null },
                    category: 'Business',
                    readTime: 6,
                    publishDate: '2024-01-15',
                    likes: 189,
                    comments: 32,
                    coverImage: 'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=800',
                },
                {
                    id: 3,
                    title: 'Mindfulness in the Digital Age',
                    excerpt: 'Discover practical strategies for maintaining mental wellness in an increasingly connected world.',
                    author: { name: 'Sarah Wilson', avatar: null },
                    category: 'Wellness',
                    readTime: 5,
                    publishDate: '2024-01-20',
                    likes: 312,
                    comments: 67,
                    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
                },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const categories = ['all', 'Technology', 'Business', 'Wellness', 'Education', 'Science'];

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Articles</h1>
                    <p className="text-gray-600 mt-1">Discover insights and stories from our community</p>
                </div>
                <Button variant="primary">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Write Article
                </Button>
            </div>

            {/* Search and Categories */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        <div key={i} className="h-96 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                        <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            {/* Cover Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={article.coverImage}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                                        {article.category}
                                    </span>
                                </div>
                            </div>

                            <CardBody className="p-5">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                    {article.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {article.excerpt}
                                </p>

                                {/* Author and Meta */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                            {article.author.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{article.author.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {article.readTime} min read
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-4 h-4" />
                                            {article.likes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4" />
                                            {article.comments}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors">
                                            <Bookmark className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors">
                                            <Share className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Articles;
