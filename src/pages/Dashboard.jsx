import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import { ClipboardList, Megaphone, Calendar, MapPin, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import announcementsService from '../services/announcements.service';
import eventsService from '../services/events.service';
import tasksService from '../services/tasks.service';
import { formatTimeAgo, formatDate } from '../utils/dateFormatter';

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('feed');
    const [stats, setStats] = useState({
        pendingTasks: 0,
        upcomingEvents: 0,
        newMessages: 0,
    });
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [tasks, events, announcements] = await Promise.all([
                tasksService.getAll().catch(() => []),
                eventsService.getAll().catch(() => []),
                announcementsService.getAll().catch(() => []),
            ]);

            setStats({
                pendingTasks: Array.isArray(tasks) ? tasks.length : 0,
                upcomingEvents: Array.isArray(events) ? events.length : 0,
                newMessages: 5,
            });

            // Combine and sort feed items
            const combined = [
                ...(Array.isArray(tasks) ? tasks.map(t => ({ ...t, type: 'task' })) : []),
                ...(Array.isArray(events) ? events.map(e => ({ ...e, type: 'event' })) : []),
                ...(Array.isArray(announcements) ? announcements.map(a => ({ ...a, type: 'announcement' })) : []),
            ];
            setFeedItems(combined);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ label, value, sublabel, color = 'gray' }) => (
        <Card>
            <CardBody className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {sublabel && (
                    <span className={`text-xs font-medium mt-1 text-${color}-600`}>{sublabel}</span>
                )}
            </CardBody>
        </Card>
    );

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Welcome back, {user?.first_name}! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening in your community today.</p>
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
                />
                <StatCard
                    label="Polls Active"
                    value="1"
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['Feed', 'Events', 'Tasks'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.toLowerCase()
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                            {tab === 'Events' && (
                                <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {stats.upcomingEvents}
                                </span>
                            )}
                            {tab === 'Tasks' && (
                                <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                    {stats.pendingTasks}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : feedItems.length === 0 ? (
                        <Card>
                            <CardBody className="text-center py-12">
                                <p className="text-gray-500">No items to display yet. Check back later!</p>
                            </CardBody>
                        </Card>
                    ) : (
                        feedItems.slice(0, 5).map((item, idx) => (
                            <FeedItemCard key={idx} item={item} />
                        ))
                    )}
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Events Widget */}
                    <Card>
                        <CardHeader className="p-4 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                            <a href="/events" className="text-sm text-primary-600 font-medium">View all</a>
                        </CardHeader>
                        <CardBody className="p-4 space-y-4">
                            <EventWidget
                                month="Oct"
                                day="24"
                                title="Annual Tech Meetup 2024"
                                location="Main Auditorium"
                            />
                            <EventWidget
                                month="Nov"
                                day="02"
                                title="Career Fair: Engineering"
                                location="Virtual"
                                variant="secondary"
                            />
                        </CardBody>
                    </Card>

                    {/* Suggested People */}
                    <Card>
                        <CardHeader className="p-4">
                            <h3 className="font-semibold text-gray-900">Suggested People</h3>
                        </CardHeader>
                        <CardBody className="p-4 space-y-3">
                            <SuggestedPerson name="Sarah Connor" role="Student Rep" />
                            <SuggestedPerson name="Dr. Smith" role="Lecturer" />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const FeedItemCard = ({ item }) => {
    if (item.type === 'task') {
        return (
            <Card>
                <CardBody>
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{item.heading || item.name}</h3>
                                <p className="text-sm text-gray-500">Assignment • Due {formatDate(item.due_date)}</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            Pending
                        </span>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                        {item.description}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status: <span className="font-medium text-orange-600">Pending</span></span>
                        <Button variant="primary">Submit Work</Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (item.type === 'announcement') {
        return (
            <Card>
                <CardBody>
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{item.heading}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Admin</span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(item.time_stamp)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600">{item.content}</p>
                </CardBody>
                <CardFooter className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                            +5
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="text-gray-500 hover:text-primary-600"><ThumbsUp className="w-5 h-5" /></button>
                        <button className="text-gray-500 hover:text-primary-600"><MessageSquare className="w-5 h-5" /></button>
                        <button className="text-gray-500 hover:text-primary-600"><Share2 className="w-5 h-5" /></button>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    return null;
};

const EventWidget = ({ month, day, title, location, variant = 'primary' }) => (
    <div className="flex gap-3 items-start">
        <div className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 ${variant === 'primary' ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-700'
            }`}>
            <span className="text-xs font-medium uppercase">{month}</span>
            <span className="text-lg font-bold">{day}</span>
        </div>
        <div className="flex-1">
            <h4 className="font-medium text-gray-900 line-clamp-1">{title}</h4>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
            </p>
            <Button variant={variant === 'primary' ? 'primary' : 'outline'} className="mt-2 text-xs w-full py-1.5">
                {variant === 'primary' ? 'Get Ticket' : 'Details'}
            </Button>
        </div>
    </div>
);

const SuggestedPerson = ({ name, role }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-gray-500">{role}</p>
            </div>
        </div>
        <button className="text-primary-600 hover:bg-primary-50 p-1 rounded">
            <span className="text-sm">+</span>
        </button>
    </div>
);

export default Dashboard;
