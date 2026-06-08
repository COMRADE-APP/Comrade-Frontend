import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import {
    MapPin, Globe, Mail, Phone, DollarSign, Building2, Users,
    UserPlus, UserCheck, Bell, BellOff, ArrowLeft, ExternalLink,
    Calendar, Tag
} from 'lucide-react';

const SponsorDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followData, setFollowData] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    useEffect(() => {
        if (user && profile) {
            fetchFollowStatus();
        }
    }, [user, profile]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/events/sponsor_profiles/${id}/`);
            setProfile(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('not_found');
            } else {
                setError('error');
                console.error('Failed to load sponsor profile', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowStatus = async () => {
        try {
            const res = await api.get('/api/events/sponsor_follows/following/');
            const items = res.data || [];
            const follow = items.find(f => f.sponsor === profile.id);
            if (follow) {
                setIsFollowing(true);
                setFollowData({ follow_id: follow.id, notifications_enabled: follow.notifications_enabled });
            }
        } catch (err) {
            console.error('Failed to load follow status', err);
        }
    };

    const toggleFollow = async () => {
        try {
            const res = await api.post(`/api/events/sponsor_profiles/${id}/follow/`);
            if (res.data.following) {
                setIsFollowing(true);
                fetchFollowStatus();
            } else {
                setIsFollowing(false);
                setFollowData(null);
            }
        } catch (err) {
            console.error('Failed to toggle follow', err);
        }
    };

    const toggleNotifications = async () => {
        if (!followData?.follow_id) return;
        const newEnabled = !followData.notifications_enabled;
        try {
            await api.patch(`/api/events/sponsor_follows/${followData.follow_id}/toggle_notifications/`, {
                notifications_enabled: newEnabled
            });
            setFollowData(prev => ({ ...prev, notifications_enabled: newEnabled }));
        } catch (err) {
            console.error('Failed to toggle notifications', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error === 'not_found') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Card className="max-w-md w-full p-8 text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-tertiary" />
                    <h2 className="text-2xl font-bold text-primary mb-2">Sponsor Not Found</h2>
                    <p className="text-secondary mb-6">This sponsor profile doesn't exist or has been removed.</p>
                    <Button variant="primary" onClick={() => navigate('/events')}>Browse Events</Button>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Card className="max-w-md w-full p-8 text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Something went wrong</h2>
                    <p className="text-secondary mb-6">Failed to load sponsor profile.</p>
                    <Button variant="primary" onClick={fetchProfile}>Try Again</Button>
                </Card>
            </div>
        );
    }

    const hasSocialLinks = profile.social_links && Object.keys(profile.social_links).some(k => profile.social_links[k]);

    return (
        <div className="min-h-screen bg-base">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 pb-16">
                <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>

                <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg">
                            {profile.logo ? (
                                <img src={profile.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
                            )}
                        </div>
                        <div className="text-center sm:text-left pb-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{profile.company_name}</h1>
                            {profile.industry && (
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                                    <Tag className="w-4 h-4 text-white/60" />
                                    <span className="text-white/80 text-sm">{profile.industry}</span>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                                    <MapPin className="w-4 h-4 text-white/60" />
                                    <span className="text-white/80 text-sm">{profile.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 -mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {profile.description && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-primary mb-3">About</h3>
                                <p className="text-secondary whitespace-pre-wrap">{profile.description}</p>
                            </Card>
                        )}

                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profile.website && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Globe className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-secondary">Website</p>
                                            <a
                                                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary-600 text-sm font-medium flex items-center gap-1 truncate"
                                            >
                                                {profile.website}
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {profile.contact_email && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-secondary">Email</p>
                                            <a
                                                href={`mailto:${profile.contact_email}`}
                                                className="text-primary hover:text-primary-600 text-sm font-medium truncate"
                                            >
                                                {profile.contact_email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-secondary">Phone</p>
                                            <a
                                                href={`tel:${profile.phone}`}
                                                className="text-primary hover:text-primary-600 text-sm font-medium"
                                            >
                                                {profile.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {profile.budget_range && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-secondary">Budget Range</p>
                                            <p className="text-primary text-sm font-medium">{profile.budget_range}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {hasSocialLinks && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-primary mb-4">Social Links</h3>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(profile.social_links).map(([platform, url]) =>
                                        url ? (
                                            <a
                                                key={platform}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-primary hover:bg-tertiary/20 text-sm font-medium transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                            </a>
                                        ) : null
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary-500" />
                                    <span className="text-primary font-semibold">
                                        {profile.follower_count ?? 0} subscriber{(profile.follower_count ?? 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {user ? (
                                <div className="space-y-2">
                                    <Button
                                        variant={isFollowing ? 'secondary' : 'primary'}
                                        className="w-full justify-center"
                                        onClick={toggleFollow}
                                    >
                                        {isFollowing ? (
                                            <><UserCheck className="w-4 h-4 mr-2" /> Subscribed</>
                                        ) : (
                                            <><UserPlus className="w-4 h-4 mr-2" /> Subscribe</>
                                        )}
                                    </Button>
                                    {isFollowing && (
                                        <button
                                            onClick={toggleNotifications}
                                            className="w-full flex items-center justify-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors py-1.5"
                                        >
                                            {followData?.notifications_enabled ? (
                                                <><Bell className="w-3.5 h-3.5 text-primary-500" /> Notifications on</>
                                            ) : (
                                                <><BellOff className="w-3.5 h-3.5" /> Notifications off</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-tertiary text-center">Sign in to subscribe</p>
                            )}
                        </Card>

                        <Card className="p-5">
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => navigate('/events')}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Browse Events
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorDetail;
