import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import {
    Calendar, Users, DollarSign, TrendingUp, Percent,
    ArrowRight, Plus, Settings, Edit3, Eye, BarChart3,
    Heart, ExternalLink, ToggleLeft, ToggleRight
} from 'lucide-react';

const OrganiserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.allSettled([
                api.get('/api/events/organizer_profiles/my_profile/'),
                api.get('/api/events/organizer_dashboard/dashboard/').catch(() => null),
            ]);
            if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
            if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value.data);
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePartnership = async () => {
        if (!profile) return;
        try {
            const res = await api.patch(`/api/events/organizer_profiles/${profile.id}/`, {
                is_open_for_partnership: !profile.is_open_for_partnership
            });
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to toggle partnership', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Card className="max-w-md w-full p-8 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-primary-600" />
                    <h2 className="text-2xl font-bold text-primary mb-2">No Organiser Profile</h2>
                    <p className="text-secondary mb-6">You haven't set up your organiser profile yet.</p>
                    <Button variant="primary" onClick={() => navigate('/register/organiser')}>
                        Create Organiser Profile
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Organiser Dashboard</h1>
                        <p className="text-secondary mt-1">{profile.business_name || 'Your Organiser Profile'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePartnership}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                profile.is_open_for_partnership
                                    ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                    : 'bg-gray-500/10 text-gray-500 border border-gray-500/30'
                            }`}
                        >
                            {profile.is_open_for_partnership ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {profile.is_open_for_partnership ? 'Open for Partnership' : 'Partnerships Off'}
                        </button>
                        <Button variant="primary" onClick={() => navigate('/events/create')}>
                            <Plus className="w-4 h-4 mr-2" /> Create Event
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/organiser/profile/settings')}>
                            <Settings className="w-4 h-4 mr-2" /> Profile Settings
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Total Events</p>
                                <p className="text-3xl font-bold text-primary mt-1">{stats?.overview?.total_events || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Total Attendees</p>
                                <p className="text-3xl font-bold text-primary mt-1">{stats?.overview?.total_attendees || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold text-primary mt-1">{stats?.overview?.total_revenue?.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) || '$0'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-yellow-500" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Avg Rating</p>
                                <p className="text-3xl font-bold text-primary mt-1">{stats?.overview?.avg_rating != null ? `${stats.overview.avg_rating} / 5` : 'N/A'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/events')}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">My Events</p>
                                <p className="text-sm text-secondary">View and manage your events</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto text-tertiary" />
                        </div>
                    </Card>
                    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/events/analytics')}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">Analytics</p>
                                <p className="text-sm text-secondary">Event performance metrics</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto text-tertiary" />
                        </div>
                    </Card>
                    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/events')}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">Sponsors</p>
                                <p className="text-sm text-secondary">Manage sponsors & partnerships</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto text-tertiary" />
                        </div>
                    </Card>
                </div>

                {/* Profile Card */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">Organiser Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-secondary">Business Name</p>
                            <p className="text-primary font-medium">{profile.business_name || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Location</p>
                            <p className="text-primary font-medium">{profile.location || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Website</p>
                            <p className="text-primary font-medium">{profile.website || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Partnership Status</p>
                            <p className={`font-medium ${profile.is_open_for_partnership ? 'text-green-600' : 'text-gray-500'}`}>
                                {profile.is_open_for_partnership ? 'Open for Partnership' : 'Closed'}
                            </p>
                        </div>
                    </div>
                    {profile.bio && (
                        <div className="mt-4">
                            <p className="text-sm text-secondary">Bio</p>
                            <p className="text-primary mt-1">{profile.bio}</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default OrganiserDashboard;
