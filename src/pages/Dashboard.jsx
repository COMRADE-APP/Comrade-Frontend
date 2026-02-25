import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import FeedItem from '../components/feed/FeedItem';
import OpinionComposer from '../components/feed/OpinionComposer';
import {
    ClipboardList, Megaphone, Calendar, MapPin, ThumbsUp, MessageSquare,
    Share2, Users, ArrowRight, RefreshCw, Filter, ShoppingBag, FileText,
    TrendingUp, Bell
} from 'lucide-react';
import api from '../services/api';
import announcementsService from '../services/announcements.service';
import eventsService from '../services/events.service';
import tasksService from '../services/tasks.service';
import roomsService from '../services/rooms.service';
import opinionsService from '../services/opinions.service';
import researchService from '../services/research.service';
import shopService from '../services/shop.service';
import { formatTimeAgo, formatDate } from '../utils/dateFormatter';
import PaymentGroupsFeed from '../components/payments/PaymentGroupsFeed';
import PiggyBankFeed from '../components/payments/PiggyBankFeed';
import StoriesBar from '../components/stories/StoriesBar';

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [stats, setStats] = useState({
        pendingTasks: 0,
        upcomingEvents: 0,
        newMessages: 0,
    });
    const [feedItems, setFeedItems] = useState([]);
    const [recommendedRooms, setRecommendedRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newContentAvailable, setNewContentAvailable] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [activeTab]);

    // Poll for new content every 30 seconds
    useEffect(() => {
        const interval = setInterval(checkForNewContent, 30000);
        return () => clearInterval(interval);
    }, [lastFetchTime]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [tasks, events, rooms, feedData] = await Promise.all([
                tasksService.getAll().catch(() => []),
                eventsService.getAll().catch(() => []),
                roomsService.getAll().catch(() => []),
                fetchUnifiedFeed(),
            ]);

            setStats({
                pendingTasks: Array.isArray(tasks) ? tasks.length : 0,
                upcomingEvents: Array.isArray(events) ? events.length : 0,
                newMessages: 5,
            });

            const roomsList = Array.isArray(rooms) ? rooms : rooms?.results || [];
            setRecommendedRooms(roomsList.slice(0, 3));
            setFeedItems(feedData);
            setLastFetchTime(new Date().toISOString());
            setNewContentAvailable(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnifiedFeed = async () => {
        try {
            let data = [];

            if (activeTab === 'all' || activeTab === 'opinions') {
                const response = await api.get('/api/opinions/feed/', {
                    params: { type: 'opinions', limit: 30 }
                });
                const opinions = response.data.results || response.data || [];
                data = data.concat(opinions.map(o => ({ ...o, content_type: 'opinion' })));
            }

            if (activeTab === 'research') {
                const researchData = await researchService.getAllProjects({ page_size: activeTab === 'all' ? 10 : 30 }).catch(() => ({ results: [] }));
                const projects = researchData?.results || researchData || [];
                data = data.concat(projects.map(r => ({
                    ...r,
                    content_type: 'research',
                    text: r.description || r.abstract || '',
                    author: r.principal_investigator || r.created_by || null,
                })));
            }

            if (activeTab === 'announcements') {
                const announcementsData = await announcementsService.getAll({ page_size: activeTab === 'all' ? 10 : 30 }).catch(() => []);
                const announcements = Array.isArray(announcementsData) ? announcementsData : announcementsData?.results || [];
                data = data.concat(announcements.map(a => ({
                    ...a,
                    content_type: 'announcement',
                    text: a.content || a.description || '',
                })));
            }

            if (activeTab === 'products') {
                const productsData = await shopService.getProducts().catch(() => ({ results: [] }));
                const products = productsData?.results || productsData || [];
                data = data.concat(products.map(p => ({
                    ...p,
                    content_type: 'product',
                    text: p.description || '',
                    author: p.seller || p.vendor || null,
                })));
            }

            // Sort by created_at descending
            data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            return data;
        } catch (error) {
            console.error('Failed to fetch feed:', error);
            return [];
        }
    };

    const checkForNewContent = async () => {
        if (!lastFetchTime) return;
        try {
            const response = await api.get('/api/opinions/feed/check-new/', {
                params: { since: lastFetchTime }
            });
            if (response.data.has_new) {
                setNewContentAvailable(true);
            }
        } catch (error) {
            console.error('Failed to check for new content:', error);
        }
    };

    const handleRefresh = () => {
        loadDashboardData();
    };

    const handlePostOpinion = async (formData) => {
        try {
            await api.post('/api/opinions/opinions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            loadDashboardData();
        } catch (error) {
            console.error('Failed to post:', error);
            throw error;
        }
    };

    const handleLike = async (id) => {
        try {
            const response = await api.post(`/api/opinions/opinions/${id}/like/`);
            return response.data;
        } catch (error) {
            console.error('Failed to like:', error);
        }
    };

    const handleRepost = async (id) => {
        try {
            const response = await api.post(`/api/opinions/opinions/${id}/repost/`);
            return response.data;
        } catch (error) {
            console.error('Failed to repost:', error);
        }
    };

    const handleShare = async (id) => {
        try {
            await api.post(`/api/opinions/opinions/${id}/share/`);
        } catch (error) {
            console.error('Failed to track share:', error);
        }
    };

    const handleBookmark = async (id) => {
        try {
            const response = await api.post(`/api/opinions/opinions/${id}/bookmark/`);
            return response.data;
        } catch (error) {
            console.error('Failed to bookmark:', error);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await api.post('/api/opinions/follow/toggle/', { user_id: userId });
            loadDashboardData();
        } catch (error) {
            console.error('Failed to follow:', error);
        }
    };

    const handleHide = async (id) => {
        try {
            await api.post(`/api/opinions/opinions/${id}/hide/`);
            setFeedItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to hide:', error);
        }
    };

    const handleReport = async (id) => {
        const reason = prompt('Why are you reporting this content?');
        if (reason) {
            try {
                await api.post(`/api/opinions/opinions/${id}/report/`, { reason: 'other', description: reason });
                alert('Thank you for your report. We will review it.');
            } catch (error) {
                console.error('Failed to report:', error);
            }
        }
    };

    const handleBlock = async (userId) => {
        if (confirm('Are you sure you want to block this user?')) {
            try {
                await api.post('/api/opinions/block/toggle/', { user_id: userId });
                loadDashboardData();
            } catch (error) {
                console.error('Failed to block:', error);
            }
        }
    };

    const feedTabs = [
        { id: 'all', label: 'For You', icon: TrendingUp },
        { id: 'opinions', label: 'Opinions', icon: MessageSquare },
        { id: 'research', label: 'Research', icon: FileText },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'products', label: 'Products', icon: ShoppingBag },
    ];

    const StatCard = ({ label, value, sublabel, color = 'gray' }) => (
        <Card>
            <CardBody className="p-4">
                <p className="text-xs font-medium text-secondary uppercase">{label}</p>
                <p className="text-2xl font-bold text-primary mt-1">{value}</p>
                {sublabel && (
                    <span className={`text-xs font-medium mt-1 text-${color}-600 dark:text-${color}-400`}>{sublabel}</span>
                )}
            </CardBody>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                    Welcome back, {user?.first_name}! 👋
                </h1>
                <p className="text-secondary">Here's what's happening in your community today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Pending Tasks"
                    value={stats.pendingTasks}
                    sublabel="2 Due Today"
                    color="red"
                />
                <StatCard
                    label="Upcoming Events"
                    value={stats.upcomingEvents}
                    sublabel="Next: Coding Bootcamp"
                    color="green"
                />
                <StatCard
                    label="New Messages"
                    value={stats.newMessages}
                    sublabel="3 Unread"
                    color="blue"
                />
                <StatCard
                    label="Following"
                    value={user?.following_count || 0}
                    sublabel="Active creators"
                    color="purple"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Feed Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Stories Bar */}
                    <StoriesBar />

                    {/* Opinion Composer */}
                    <OpinionComposer
                        onSubmit={handlePostOpinion}
                        isPremium={user?.tier === 'premium' || user?.tier === 'gold'}
                    />

                    {/* New Content Banner */}
                    {newContentAvailable && (
                        <button
                            onClick={handleRefresh}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <RefreshCw size={18} />
                            New posts available - tap to refresh
                        </button>
                    )}

                    {/* Feed Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-theme">
                        {feedTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'text-secondary hover:bg-secondary'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Feed Items */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-elevated rounded-xl border border-theme p-4 animate-pulse">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-secondary rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-secondary rounded w-1/4" />
                                            <div className="h-3 bg-secondary rounded w-3/4" />
                                            <div className="h-3 bg-secondary rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : feedItems.length === 0 ? (
                        <div className="bg-elevated rounded-xl border border-theme p-8 text-center">
                            <MessageSquare size={48} className="mx-auto text-tertiary mb-4" />
                            <h3 className="font-semibold text-primary mb-2">No posts yet</h3>
                            <p className="text-secondary text-sm">Be the first to share something!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedItems.map(item => (
                                <FeedItem
                                    key={`${item.content_type || 'opinion'}-${item.id}`}
                                    item={item}
                                    onLike={handleLike}
                                    onComment={(item) => console.log('Comment on:', item)}
                                    onRepost={handleRepost}
                                    onShare={handleShare}
                                    onBookmark={handleBookmark}
                                    onFollow={handleFollow}
                                    onHide={handleHide}
                                    onReport={handleReport}
                                    onBlock={handleBlock}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-purple-600" />
                                <h3 className="font-semibold text-primary">Upcoming Events</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            {stats.upcomingEvents === 0 ? (
                                <p className="text-secondary text-sm">No upcoming events</p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-secondary">{stats.upcomingEvents} events coming up</p>
                                </div>
                            )}
                        </CardBody>
                        <CardFooter className="border-t border-theme p-3">
                            <Link to="/events" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                View all events <ArrowRight size={14} />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Tasks */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ClipboardList size={18} className="text-purple-600" />
                                <h3 className="font-semibold text-primary">Your Tasks</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            {stats.pendingTasks === 0 ? (
                                <p className="text-secondary text-sm">No pending tasks</p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-secondary">{stats.pendingTasks} tasks pending</p>
                                </div>
                            )}
                        </CardBody>
                        <CardFooter className="border-t border-theme p-3">
                            <Link to="/tasks" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                View all tasks <ArrowRight size={14} />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Recommended Rooms */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-purple-600" />
                                <h3 className="font-semibold text-primary">Suggested Communities</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            {recommendedRooms.length === 0 ? (
                                <p className="text-secondary text-sm">No communities to show</p>
                            ) : (
                                <div className="space-y-3">
                                    {recommendedRooms.map(room => (
                                        <Link
                                            key={room.id}
                                            to={`/rooms/${room.id}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium">
                                                {room.name?.[0]?.toUpperCase() || 'R'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-primary truncate">{room.name}</p>
                                                <p className="text-xs text-secondary">{room.members_count || 0} members</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* My Payment Groups */}
                    <PaymentGroupsFeed limit={3} />

                    {/* Savings Goals / Piggy Banks */}
                    <PiggyBankFeed limit={3} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
