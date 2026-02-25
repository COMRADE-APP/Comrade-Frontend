import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Download, ExternalLink, Calendar, User, Plus, Search } from 'lucide-react';
import researchService from '../services/research.service';

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'seeking_participants', label: 'Seeking Participants' },
    { value: 'completed', label: 'Completed' },
];

const Research = () => {
    const navigate = useNavigate();
    const [research, setResearch] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadProjects();
    }, [filter]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== 'all') params.status = filter;

            const data = await researchService.getAllProjects(params);
            setResearch(data.results || data);
        } catch (error) {
            console.error('Error loading research projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResearch = research
        .filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.abstract?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search research papers, abstracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Pill Filters */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary text-secondary hover:bg-tertiary/20 hover:text-primary'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
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
                        <Card
                            key={item.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => navigate(`/research/${item.id}`)}
                        >
                            <CardBody className="p-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'published' ? 'bg-green-100 text-green-700' :
                                                item.status === 'seeking_participants' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {item.status?.replace('_', ' ').toUpperCase()}
                                            </span>

                                            {item.publication && (
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${Number(item.publication.fee) > 0
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-teal-100 text-teal-800'
                                                    }`}>
                                                    {Number(item.publication.fee) > 0
                                                        ? `${item.publication.currency} ${item.publication.fee}`
                                                        : 'FREE ACCESS'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-primary mb-2 group-hover:text-primary-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-secondary text-sm mb-3 line-clamp-2">
                                            {item.abstract}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {item.principal_investigator?.full_name || 'Unknown'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            <span>{item.views || 0} views</span>
                                        </div>
                                    </div>
                                    <div className="flex md:flex-col gap-2">
                                        {item.publication?.full_paper ? (
                                            <Button
                                                variant={Number(item.publication.fee) > 0 ? "secondary" : "primary"}
                                                className="flex-1 md:flex-none z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (Number(item.publication.fee) > 0) {
                                                        navigate(`/research/${item.id}?tab=publication`);
                                                    } else {
                                                        window.open(item.publication.full_paper, '_blank');
                                                    }
                                                }}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                {Number(item.publication.fee) > 0 ? 'Purchase' : 'Download'}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="flex-1 md:flex-none opacity-50 cursor-not-allowed"
                                                disabled
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                No Paper
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            className="flex-1 md:flex-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/research/${item.id}`);
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Details
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
