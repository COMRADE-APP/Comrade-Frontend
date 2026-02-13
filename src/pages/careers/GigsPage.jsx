import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, DollarSign, Clock, MapPin, Filter, Plus,
    ChevronRight, Star, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import { gigsService } from '../../services/careers.service';

const GigsPage = () => {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState([]);
    const [recommendedGigs, setRecommendedGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [filters, setFilters] = useState({
        industry: '',
        status: 'open',
        is_remote: null
    });

    const industries = [
        { value: '', label: 'All Industries' },
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'writing', label: 'Writing & Content' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Finance & Accounting' },
        { value: 'education', label: 'Education' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'other', label: 'Other' },
    ];

    useEffect(() => {
        fetchGigs();
        fetchRecommended();
    }, [filters]);

    const fetchGigs = async () => {
        try {
            setLoading(true);
            const params = { ...filters };
            if (!params.industry) delete params.industry;
            if (params.is_remote === null) delete params.is_remote;

            const response = await gigsService.getAll(params);
            const data = response.data;
            setGigs(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError('Failed to load gigs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommended = async () => {
        try {
            const response = await gigsService.getRecommended();
            const data = response.data;
            setRecommendedGigs(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load recommendations:', err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getPayTimingLabel = (timing) => {
        const labels = {
            before: 'Payment Upfront',
            after: 'Payment on Completion',
            milestone: 'Milestone-based',
            negotiable: 'Negotiable'
        };
        return labels[timing] || timing;
    };

    const GigCard = ({ gig, isRecommended = false }) => (
        <div
            className={`bg-elevated border border-theme rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer relative ${isRecommended ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => navigate(`/gigs/${gig.id}`)}
        >
            {isRecommended && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Sparkles size={14} />
                    <span>Recommended</span>
                </div>
            )}
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-primary">{gig.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${gig.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-secondary/10 text-secondary'
                    }`}>
                    {gig.status}
                </span>
            </div>

            <p className="text-secondary text-sm mb-4 line-clamp-3">{gig.description.substring(0, 150)}...</p>

            <div className="flex flex-wrap gap-4 mb-4 text-sm text-secondary">
                <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-tertiary" />
                    <span>{formatCurrency(gig.pay_amount)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={16} className="text-tertiary" />
                    <span>{getPayTimingLabel(gig.pay_timing)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-tertiary" />
                    <span>{gig.is_remote ? 'Remote' : gig.location}</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-xs text-secondary">
                <span className="bg-secondary/10 px-2 py-1 rounded">{gig.industry}</span>
                <span className="text-tertiary">Due: {formatDate(gig.deadline)}</span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-theme">
                <span className="text-xs text-tertiary">
                    {gig.applications_count || 0} applications
                </span>
                <button className="flex items-center gap-1 text-primary hover:text-primary-light font-medium text-sm">
                    View Details <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary"><Briefcase /> Gigs Marketplace</h1>
                    <p className="text-secondary mt-1">Find freelance work or post your own gig</p>
                </div>
                <button
                    className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors"
                    onClick={() => navigate('/gigs/create')}
                >
                    <Plus size={20} />
                    Post a Gig
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-theme mb-8 overflow-x-auto">
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'all' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Gigs
                </button>
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'recommended' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('recommended')}
                >
                    <Sparkles size={16} />
                    For You
                </button>
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'my-gigs' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('my-gigs')}
                >
                    My Gigs
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-elevated p-4 rounded-xl border border-theme">
                <div className="flex items-center gap-2 bg-background border border-theme rounded-lg px-3 py-2 flex-grow md:flex-grow-0">
                    <Filter size={18} className="text-secondary" />
                    <select
                        value={filters.industry}
                        onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                        className="bg-transparent border-none outline-none text-primary text-sm min-w-[150px]"
                    >
                        {industries.map(ind => (
                            <option key={ind.value} value={ind.value}>{ind.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.is_remote === true}
                            onChange={(e) => setFilters({ ...filters, is_remote: e.target.checked ? true : null })}
                            className="rounded border-theme text-primary focus:ring-primary"
                        />
                        Remote Only
                    </label>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {loading ? (
                    <div className="text-center py-20 text-secondary">
                        <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-primary" />
                        <p>Loading gigs...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-100 p-8">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <p className="mb-4">{error}</p>
                        <button onClick={fetchGigs} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">Retry</button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'recommended' && recommendedGigs.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary"><Sparkles size={20} className="text-primary" /> Recommended for You</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendedGigs.map(gig => (
                                        <GigCard key={gig.id} gig={gig} isRecommended />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(activeTab === 'all' ? gigs : activeTab === 'recommended' ? recommendedGigs : gigs)
                                .map(gig => (
                                    <GigCard key={gig.id} gig={gig} />
                                ))
                            }
                        </div>

                        {gigs.length === 0 && (
                            <div className="text-center py-20 flex flex-col items-center justify-center text-secondary">
                                <Briefcase size={64} className="text-tertiary mb-4" />
                                <h3 className="text-lg font-medium text-primary mb-2">No gigs found</h3>
                                <p>Try adjusting your filters or check back later</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GigsPage;
