import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Card, { CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import FeedItem from '../components/feed/FeedItem';
import OpinionComposer from '../components/feed/OpinionComposer';
import {
    ClipboardList, Megaphone, Calendar, MapPin, ThumbsUp, MessageSquare,
    Share2, Users, ArrowRight, RefreshCw, Filter, ShoppingBag, FileText,
    TrendingUp, Bell, Eye, ShoppingCart, Star, Tag, Check, Plus, Clock, User
} from 'lucide-react';
import api from '../services/api';
import announcementsService from '../services/announcements.service';
import eventsService from '../services/events.service';
import tasksService from '../services/tasks.service';
import roomsService from '../services/rooms.service';
import opinionsService from '../services/opinions.service';
import researchService from '../services/research.service';
import shopService from '../services/shop.service';
import API_ENDPOINTS from '../constants/apiEndpoints';
import { formatTimeAgo, formatDate } from '../utils/dateFormatter';
import PaymentGroupsFeed from '../components/payments/PaymentGroupsFeed';
import PiggyBankFeed from '../components/payments/PiggyBankFeed';
import StoriesBar from '../components/stories/StoriesBar';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const TAB_MAP = { all: 'for-you', opinions: 'opinions', research: 'research', announcements: 'announcements', products: 'shop' };
const REVERSE_TAB_MAP = Object.fromEntries(Object.entries(TAB_MAP).map(([k, v]) => [v, k]));

const ShopProductCard = ({ item }) => {
    const nav = useNavigate();
    const cart = useCart();
    const price = item.price ? parseFloat(item.price) : null;
    const [justAdded, setJustAdded] = React.useState(false);

    const handleAddToCart = (e) => {
        e.stopPropagation();
        cart.addItem({
            id: item.id,
            name: item.title || item.name || 'Product',
            price: price || 0,
            type: item.product_type === 'service' ? 'service' : 'product',
            image: getImageUrl(item.image_url) || getImageUrl(item.media_url),
            is_sharable: item.is_sharable,
            allow_group_purchase: item.allow_group_purchase
        });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
    };

    const resolvedImage = getImageUrl(item.image_url) || getImageUrl(item.media_url) || null;
    const typeBadgeColors = {
        physical: 'bg-emerald-500/90 text-white',
        digital: 'bg-primary-600/90 text-white',
        service: 'bg-indigo-500/90 text-white',
        subscription: 'bg-amber-500/90 text-white',
        recommendation: 'bg-rose-500/90 text-white',
    };

    return (
        <div 
            className="group bg-elevated rounded-2xl border border-theme overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary-400 dark:hover:border-primary-800 flex flex-col h-full" 
            onClick={() => nav(item.action_url || `/shop/item/${item.id}`)}
        >
            {/* Image Box */}
            <div className="relative h-36 sm:h-40 lg:h-44 w-full bg-secondary/5 overflow-hidden shrink-0">
                {resolvedImage ? (
                    <img src={resolvedImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-900/20 via-secondary/5 to-indigo-900/20 flex items-center justify-center">
                        <ShoppingBag size={36} className="text-tertiary opacity-40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${typeBadgeColors[item.product_type] || typeBadgeColors.physical || 'bg-emerald-500/90 text-white'}`}>
                        {item.category_label || item.product_type || 'Product'}
                    </span>
                </div>
                {/* Quick view overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-1 shadow">
                        <Eye size={14} /> Quick View
                    </span>
                </div>
                {/* Added-to-cart overlay animation */}
                {justAdded && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center z-20 animate-in fade-in duration-200">
                        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg animate-in zoom-in duration-300">
                            <Check size={28} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                <div className="flex-1">
                    <h3 className="font-semibold text-primary text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-primary-700 transition-colors mb-1">
                        {item.title}
                    </h3>
                    {(item.duration_minutes || item.service_mode_display) && (
                        <div className="flex items-center gap-2 text-xs text-secondary mb-1">
                            {item.duration_minutes && <span className="flex items-center gap-1"><Clock size={12} /> {item.duration_minutes} min</span>}
                            {item.service_mode_display && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-tertiary" />
                                    <span>{item.service_mode_display}</span>
                                </>
                            )}
                        </div>
                    )}
                    <p className="text-secondary text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1">
                        {item.content || "Discover more details about this item."}
                    </p>
                </div>
                {/* Price + Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-theme mt-auto">
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                        {price !== null ? `$${price.toFixed(2)}` : 'Pricing info'}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddToCart}
                            className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm ${
                                justAdded
                                    ? 'bg-green-500 text-white scale-110'
                                    : 'bg-primary-200 dark:bg-primary-900/30 text-primary-700 hover:bg-primary-300 dark:hover:bg-primary-900/40'
                            }`}
                            title={justAdded ? 'Added!' : 'Add to Cart'}
                        >
                            {justAdded ? <Check size={16} strokeWidth={3} /> : (
                                <div className="relative flex items-center justify-center">
                                    <ShoppingCart size={16} />
                                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-700 text-white rounded-full flex items-center justify-center border-2 border-primary-200 dark:border-primary-900">
                                        <Plus size={8} strokeWidth={4} />
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const cart = useCart();
    const navigate = useNavigate();
    const { tab: urlTab } = useParams();
    const [activeTab, setActiveTab] = useState(() => REVERSE_TAB_MAP[urlTab] || 'all');
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

    // Sync tab with URL
    useEffect(() => {
        const tabFromUrl = REVERSE_TAB_MAP[urlTab] || 'all';
        if (tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
    }, [urlTab]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const slug = TAB_MAP[tabId] || 'for-you';
        navigate(`/dashboard/${slug}`, { replace: true });
    };

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
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            console.warn("DASHBOARD STARTING FETCH. Token exists?", !!token, "Token start:", token ? token.substring(0, 15) : 'None');

            const [tasks, events, rooms, feedData] = await Promise.all([
                tasksService.getAll().catch((e) => { console.error("Tasks Error:", e); return []; }),
                eventsService.getAllEvents().catch((e) => { console.error("Events Error:", e); return []; }),
                roomsService.getAll().catch((e) => { console.error("Rooms Error:", e); return []; }),
                fetchUnifiedFeed(),
            ]);

            const tasksList = Array.isArray(tasks) ? tasks : tasks?.results || Object.values(tasks || {}).flat().filter(Boolean) || [];
            const eventsList = Array.isArray(events) ? events : events?.results || Object.values(events || {}).flat().filter(Boolean) || [];
            const roomsList = Array.isArray(rooms) ? rooms : rooms?.results || Object.values(rooms || {}).flat().filter(Boolean) || [];

            console.warn("DASHBOARD DATA EXTRACTED:", { tasksCount: tasksList.length, eventsCount: eventsList.length, roomsCount: roomsList.length, feedCount: feedData?.length });

            setStats({
                pendingTasks: tasksList.length,
                upcomingEvents: eventsList.length,
                newMessages: 5,
            });

            setRecommendedRooms(roomsList.slice(0, 3));
            setFeedItems(feedData);
            setLastFetchTime(new Date().toISOString());
            setNewContentAvailable(false);
        } catch (error) {
            console.error('Error loading dashboard main try/catch:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnifiedFeed = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.OPINIONS_FEED, {
                params: { type: activeTab, limit: activeTab === 'all' ? 30 : 50 }
            });
            console.warn("Unified Feed Raw Response:", response.data);
            return response.data.results || response.data || [];
        } catch (error) {
            console.error('Failed to fetch feed:', error);
            return [];
        }
    };

    const checkForNewContent = async () => {
        if (!lastFetchTime) return;
        try {
            const response = await api.get(`${API_ENDPOINTS.OPINIONS_FEED.replace(/\/$/, '')}/check-new/`, {
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
        { id: 'products', label: 'Shop', icon: ShoppingBag },
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
            <div className="flex justify-between items-start md:items-center">
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">
                        Welcome back, {user?.first_name}! 👋
                    </h1>
                    <p className="text-secondary">Here's what's happening in your community today.</p>
                </div>
                <div className="hidden md:block">
                    <Button variant="outline" size="sm" onClick={() => cart.setCartOpen(true)} className="relative">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                        {cart.count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.count}</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Profile Completion Prompt */}
            {!user?.profile_completed && (
                <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/40 dark:to-indigo-900/40 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 p-2 rounded-full mt-0.5 shadow-sm">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-primary-800 dark:text-primary-200 font-bold mb-0.5">
                                Complete Your Profile
                            </h3>
                            <p className="text-sm text-primary-700/80 dark:text-primary-300/80">
                                Finishing your profile helps you connect better with the community. Add your bio, location, and interests today.
                            </p>
                        </div>
                    </div>
                    <Link to="/profile-setup" className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-transparent shadow shadow-primary-500/20">
                        Complete Setup
                    </Link>
                </div>
            )}

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
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
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
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'bg-primary-200 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
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
                        activeTab === 'products' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-elevated rounded-2xl border border-theme overflow-hidden animate-pulse">
                                        <div className="h-36 sm:h-40 bg-secondary" />
                                        <div className="p-3 sm:p-4 space-y-2">
                                            <div className="h-4 bg-secondary rounded w-3/4" />
                                            <div className="h-3 bg-secondary rounded w-full" />
                                            <div className="h-3 bg-secondary rounded w-1/2" />
                                            <div className="flex justify-between pt-2">
                                                <div className="h-5 bg-secondary rounded w-16" />
                                                <div className="h-7 bg-secondary rounded w-16" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
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
                        )
                    ) : feedItems.length === 0 ? (
                        <div className="bg-elevated rounded-xl border border-theme p-8 text-center">
                            {activeTab === 'products' ? (
                                <>
                                    <ShoppingBag size={48} className="mx-auto text-primary-400 mb-4" />
                                    <h3 className="font-semibold text-primary mb-2">No products yet</h3>
                                    <p className="text-secondary text-sm">Check back later for new products!</p>
                                </>
                            ) : (
                                <>
                                    <MessageSquare size={48} className="mx-auto text-tertiary mb-4" />
                                    <h3 className="font-semibold text-primary mb-2">No posts yet</h3>
                                    <p className="text-secondary text-sm">Be the first to share something!</p>
                                </>
                            )}
                        </div>
                    ) : activeTab === 'products' ? (
                        /* ====== SHOP GRID VIEW ====== */
                        <div className="space-y-8">
                            {Object.entries(
                                feedItems.reduce((acc, item) => {
                                    const cat = item.category_label || item.product_type || 'Other';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(item);
                                    return acc;
                                }, {})
                            ).map(([category, items]) => (
                                <div key={category} className="space-y-4">
                                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider text-sm border-b border-theme pb-2">
                                        {category}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                        {items.map(item => (
                                            <ShopProductCard
                                                key={`product-${item.id}`}
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* ====== STANDARD FEED LIST VIEW ====== */
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
                                <Calendar size={18} className="text-primary-700" />
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
                            <Link to="/events" className="text-sm text-primary-700 hover:text-primary-800 flex items-center gap-1">
                                View all events <ArrowRight size={14} />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Tasks */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ClipboardList size={18} className="text-primary-700" />
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
                            <Link to="/tasks" className="text-sm text-primary-700 hover:text-primary-800 flex items-center gap-1">
                                View all tasks <ArrowRight size={14} />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Recommended Rooms */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-primary-700" />
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
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-medium">
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
