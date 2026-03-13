import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Download, ExternalLink, Calendar, User, Plus, Search, Users, Banknote, Briefcase, Shield } from 'lucide-react';
import researchService from '../services/research.service';
import api from '../services/api';

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'seeking_participants', label: 'Seeking Participants' },
    { value: 'completed', label: 'Completed' },
];

const TABS = [
    { id: 'projects', label: 'Research Projects', icon: BookOpen },
    { id: 'participants', label: 'Participant Outreach', icon: Users },
    { id: 'funding', label: 'Funding Requests', icon: Banknote },
    { id: 'partners', label: 'Partners & Sponsors', icon: Briefcase },
];

const Research = () => {
    const navigate = useNavigate();
    const [research, setResearch] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('projects');

    useEffect(() => {
        if (activeTab === 'projects') {
            loadProjects();
        } else {
            loadPosts();
        }
    }, [filter, activeTab]);

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

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await api.get('/research/recruitment_posts/');
            setPosts(data.data.results || data.data);
        } catch (error) {
            console.error('Error loading recruitment posts:', error);
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

    const getTabPostType = (tab) => {
        if (tab === 'participants') return 'participant_recruitment';
        if (tab === 'funding') return 'funding_requests';
        if (tab === 'partners') return 'partners_sponsors';
        return '';
    };

    const filteredPosts = posts
        .filter(post => post.post_type === getTabPostType(activeTab))
        .filter(post => {
            const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content?.toLowerCase().includes(searchQuery.toLowerCase());
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
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/research/apply')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Apply to be a Researcher
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/research/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Research
                    </Button>
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex border-b border-theme overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setFilter('all');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary hover:border-primary/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Header Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-elevated p-4 rounded-xl border border-theme">
                <div className="relative flex-1 md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder={activeTab === 'projects' ? "Search papers, abstracts..." : "Search posts..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>

                {activeTab === 'projects' && (
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-secondary text-secondary hover:bg-tertiary/20 hover:text-primary'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Research List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-tertiary/10 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : activeTab === 'projects' ? (
                filteredResearch.length === 0 ? (
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
                                        {item.image_url && (
                                            <div className="w-full md:w-48 h-48 shrink-0 rounded-lg overflow-hidden relative border border-theme">
                                                <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
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
                )
            ) : (
                filteredPosts.length === 0 ? (
                    <div className="text-center py-16 bg-elevated rounded-xl border border-theme">
                        <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'participants' ? <Users className="w-8 h-8 text-tertiary" /> :
                                activeTab === 'funding' ? <Banknote className="w-8 h-8 text-tertiary" /> :
                                    <Briefcase className="w-8 h-8 text-tertiary" />}
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2">No posts found</h3>
                        <p className="text-secondary">There are currently no active {TABS.find(t => t.id === activeTab)?.label?.toLowerCase()} posts.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPosts.map((post) => (
                            <Card key={post.id} className="hover:shadow-lg transition-shadow border border-theme">
                                <CardBody className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{post.title}</h3>
                                            <p className="text-secondary text-sm mt-1">Research: {post.research_title || `Project #${post.research}`}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.status === 'urgent' ? 'bg-red-100 text-red-700' :
                                            post.status === 'featured' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {post.status?.toUpperCase() || 'ACTIVE'}
                                        </span>
                                    </div>
                                    <p className="text-secondary text-sm mb-4 line-clamp-3">
                                        {post.content}
                                    </p>
                                    <div className="pt-4 border-t border-theme flex items-center justify-between">
                                        <span className="text-xs text-tertiary">
                                            Posted {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                        <Button size="sm" variant="outline" onClick={() => navigate(`/research/${post.research}`)}>
                                            View Details
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default Research;
