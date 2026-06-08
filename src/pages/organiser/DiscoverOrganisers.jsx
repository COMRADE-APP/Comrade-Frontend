import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import {
    Search, MapPin, UserPlus, UserCheck, Briefcase,
    X, ChevronLeft, ChevronRight
} from 'lucide-react';

const DiscoverOrganisers = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [following, setFollowing] = useState(new Set());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrganizers();
    }, [page, search]);

    const fetchOrganizers = async () => {
        setLoading(true);
        try {
            const params = { page };
            if (search) params.search = search;
            const res = await api.get('/api/events/organizer_profiles/discover/', { params });
            const data = res.data;
            if (data.results) {
                setOrganizers(data.results);
                setTotalPages(Math.ceil(data.count / (data.results.length || 1)));
            } else {
                setOrganizers(Array.isArray(data) ? data : []);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Failed to fetch organizers', err);
            setOrganizers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        const fetchFollowing = async () => {
            try {
                const res = await api.get('/api/events/organizer_follows/following/');
                const ids = new Set(res.data.map(f => f.organizer));
                setFollowing(ids);
            } catch (err) {
                console.error('Failed to fetch following', err);
            }
        };
        fetchFollowing();
    }, [user]);

    const toggleFollow = async (organizerId) => {
        try {
            const res = await api.post(`/api/events/organizer_profiles/${organizerId}/follow/`);
            if (res.data.following) {
                setFollowing(prev => new Set(prev).add(organizerId));
            } else {
                setFollowing(prev => {
                    const next = new Set(prev);
                    next.delete(organizerId);
                    return next;
                });
            }
        } catch (err) {
            console.error('Failed to toggle follow', err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrganizers();
    };

    return (
        <div className="min-h-screen bg-base p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Discover Organisers</h1>
                    <p className="text-secondary mt-1">Find and connect with event organisers for partnerships</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or location..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setPage(1); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" variant="primary">Search</Button>
                </form>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                    </div>
                ) : organizers.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-tertiary" />
                        <h3 className="text-lg font-semibold text-primary mb-2">No organisers found</h3>
                        <p className="text-secondary">Try adjusting your search criteria</p>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {organizers.map((org) => (
                                <Card
                                    key={org.id}
                                    className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/organiser/${org.id}`)}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mb-3 overflow-hidden">
                                            {org.avatar ? (
                                                <img src={org.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Briefcase className="w-8 h-8 text-primary-500" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-primary text-lg">
                                            {org.business_name || 'Unnamed Organiser'}
                                        </h3>
                                        {org.location && (
                                            <p className="text-sm text-secondary flex items-center gap-1 mt-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {org.location}
                                            </p>
                                        )}
                                        {org.is_open_for_partnership && (
                                            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/30">
                                                Open for Partnership
                                            </span>
                                        )}
                                        <Button
                                            variant={following.has(org.id) ? 'secondary' : 'primary'}
                                            size="sm"
                                            className="mt-4 w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFollow(org.id);
                                            }}
                                        >
                                            {following.has(org.id) ? (
                                                <><UserCheck className="w-4 h-4" /> Following</>
                                            ) : (
                                                <><UserPlus className="w-4 h-4" /> Follow</>
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pt-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </Button>
                                <span className="text-sm text-secondary">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DiscoverOrganisers;
