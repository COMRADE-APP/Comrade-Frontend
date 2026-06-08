import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import {
    Briefcase, DollarSign, CheckCircle, Clock,
    ArrowRight, Plus, Search, MessageSquare, X, ThumbsUp, FileText
} from 'lucide-react';

const TAB_KEYS = ['applications', 'active', 'inbox'];

const SponsorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [sponsorships, setSponsorships] = useState([]);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('applications');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, appsRes, sponsorshipsRes] = await Promise.allSettled([
                api.get('/api/events/sponsor_profiles/my_profile/'),
                api.get('/api/events/sponsor_applications/my_applications/'),
                api.get('/api/events/sponsor_applications/incoming_requests/'),
            ]);
            if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
            if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data?.results || appsRes.value.data || []);
            if (sponsorshipsRes.status === 'fulfilled') setSponsorships(sponsorshipsRes.value.data?.results || sponsorshipsRes.value.data || []);
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, action) => {
        try {
            await api.post(`/api/events/sponsor_applications/${id}/${action}/`);
            fetchData();
        } catch (err) {
            console.error('Failed to respond', err);
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
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-primary-600" />
                    <h2 className="text-2xl font-bold text-primary mb-2">No Sponsor Profile</h2>
                    <p className="text-secondary mb-6">You haven't set up your sponsor profile yet.</p>
                    <Button variant="primary" onClick={() => navigate('/register/sponsor')}>
                        Create Sponsor Profile
                    </Button>
                </Card>
            </div>
        );
    }

    const renderApplications = () => (
        <div className="space-y-3">
            {applications.length === 0 ? (
                <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                    <p className="text-secondary">No sponsorship applications yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/events')}>
                        <Search className="w-4 h-4 mr-2" /> Browse Events
                    </Button>
                </Card>
            ) : (
                applications.map(app => (
                    <Card key={app.id} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-primary">{app.event?.name || 'Event'}</p>
                            <p className="text-sm text-secondary">Status: <span className="font-medium capitalize">{app.status || 'pending'}</span></p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            app.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                            app.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-yellow-500/10 text-yellow-600'
                        }`}>{app.status || 'pending'}</span>
                    </Card>
                ))
            )}
        </div>
    );

    const renderActive = () => (
        <div className="space-y-3">
            {sponsorships.length === 0 ? (
                <Card className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                    <p className="text-secondary">No active sponsorships.</p>
                </Card>
            ) : (
                sponsorships.map(s => (
                    <Card key={s.id} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-primary">{s.event?.name || 'Event'}</p>
                            <p className="text-sm text-secondary">{s.organisation?.name || 'Organisation'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">Active</span>
                    </Card>
                ))
            )}
        </div>
    );

    const renderInbox = () => (
        <div className="space-y-3">
            {requests.length === 0 ? (
                <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                    <p className="text-secondary">No incoming requests from organisers.</p>
                </Card>
            ) : (
                requests.map(req => (
                    <Card key={req.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-primary">{req.organiser?.business_name || 'Organiser'}</p>
                                <p className="text-sm text-secondary">{req.event?.name || 'Event'}</p>
                                {req.message && <p className="text-sm text-primary mt-2">{req.message}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button variant="primary" size="sm" onClick={() => handleRespond(req.id, 'approve')}>
                                <ThumbsUp className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRespond(req.id, 'reject')}>
                                <X className="w-4 h-4 mr-1" /> Decline
                            </Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );

    const tabContent = {
        applications: renderApplications,
        active: renderActive,
        inbox: renderInbox,
    };

    return (
        <div className="min-h-screen bg-base p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Sponsor Dashboard</h1>
                        <p className="text-secondary mt-1">{profile.company_name}</p>
                    </div>
                    <Button variant="primary" onClick={() => navigate('/events')}>
                        <Search className="w-4 h-4 mr-2" /> Find Events to Sponsor
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Applications</p>
                                <p className="text-3xl font-bold text-primary mt-1">{applications.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Active Sponsorships</p>
                                <p className="text-3xl font-bold text-primary mt-1">{sponsorships.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary font-medium">Inbox</p>
                                <p className="text-3xl font-bold text-primary mt-1">{requests.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-elevated rounded-lg p-1 w-fit">
                    {TAB_KEYS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                                activeTab === tab
                                    ? 'bg-primary-600 text-white'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {tabContent[activeTab]()}
            </div>
        </div>
    );
};

export default SponsorDashboard;
