import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { Search, BookOpen, Filter, Download, ExternalLink, Calendar, User, Tag, Plus } from 'lucide-react';

const Research = () => {
    const navigate = useNavigate();
    const [research, setResearch] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // Simulated data - replace with actual API call
        setTimeout(() => {
            setResearch([
                {
                    id: 1,
                    title: 'The Impact of AI on Modern Education',
                    abstract: 'This study explores how artificial intelligence is transforming educational methodologies and student outcomes in higher education institutions.',
                    authors: ['Dr. Jane Smith', 'Prof. John Doe'],
                    category: 'Education Technology',
                    publishDate: '2024-01-15',
                    citations: 45,
                    downloads: 234,
                },
                {
                    id: 2,
                    title: 'Sustainable Development Goals: Progress and Challenges',
                    abstract: 'A comprehensive analysis of global progress towards achieving the 2030 Sustainable Development Goals, with focus on developing nations.',
                    authors: ['Dr. Michael Brown'],
                    category: 'Sustainability',
                    publishDate: '2024-02-20',
                    citations: 32,
                    downloads: 189,
                },
                {
                    id: 3,
                    title: 'Machine Learning in Healthcare Diagnostics',
                    abstract: 'Examining the efficacy of machine learning algorithms in early disease detection and diagnostic accuracy improvement.',
                    authors: ['Dr. Sarah Wilson', 'Dr. David Lee'],
                    category: 'Healthcare',
                    publishDate: '2024-03-10',
                    citations: 78,
                    downloads: 456,
                },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const categories = ['all', 'Education Technology', 'Sustainability', 'Healthcare', 'Engineering', 'Social Sciences'];

    const filteredResearch = research.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.abstract.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || item.category === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Research</h1>
                    <p className="text-secondary mt-1">Explore academic research and publications</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/research/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Research
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search research papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-elevated border border-theme text-primary rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat
                                ? 'bg-primary text-white'
                                : 'bg-elevated text-secondary hover:bg-secondary'
                                }`}
                        >
                            {cat === 'all' ? 'All Categories' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Research List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-tertiary/10 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredResearch.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">No research found</h3>
                    <p className="text-secondary">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredResearch.map((item) => (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-primary mb-2 hover:text-primary cursor-pointer">
                                            {item.title}
                                        </h3>
                                        <p className="text-secondary text-sm mb-3 line-clamp-2">
                                            {item.abstract}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {item.authors.join(', ')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(item.publishDate).toLocaleDateString()}
                                            </span>
                                            <span>{item.citations} citations</span>
                                            <span>{item.downloads} downloads</span>
                                        </div>
                                    </div>
                                    <div className="flex md:flex-col gap-2">
                                        <Button variant="primary" className="flex-1 md:flex-none">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button variant="outline" className="flex-1 md:flex-none">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
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

export default Research;
