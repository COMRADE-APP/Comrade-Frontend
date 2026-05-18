/**
 * Event Detail Page
 * Comprehensive view with reactions (love/excited/remind-me), schedule, speakers, materials, analytics
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import EventComments from '../components/events/EventComments';
import EventTicketing from '../components/events/EventTicketing';
import EventAnalyticsDashboard from '../components/events/EventAnalyticsDashboard';
import LogisticsSection from '../components/events/EventLogistics';
import {
    Calendar, MapPin, Users, Clock, Ticket, Bell, MessageSquare,
    ArrowLeft, Share2, Heart, Bookmark, MoreVertical, Globe, Building,
    FileText, DollarSign, Settings, ChevronRight, Star, Sparkles,
    BellRing, CalendarDays, Mic2, Paperclip, BarChart3, Download,
    Plus, Trash2, X, Check, AlertCircle
} from 'lucide-react';
import eventsService from '../services/events.service';
import { formatDate, formatTime } from '../utils/dateFormatter';
const REMINDER_OPTIONS = [
    { value: '1h', label: '1 Hour Before' },
    { value: '2h', label: '2 Hours Before' },
    { value: '3h', label: '3 Hours Before' },
    { value: '6h', label: '6 Hours Before' },
    { value: '12h', label: '12 Hours Before' },
    { value: '1d', label: '1 Day Before' },
    { value: '2d', label: '2 Days Before' },
    { value: '1w', label: '1 Week Before' },
];

const getTemporalStatus = (event) => {
    if (!event.event_date) return null;
    
    let startDateTime = new Date(event.event_date);
    let endDateTime = new Date(event.event_date);
    
    if (event.start_time) {
        const [hours, minutes] = event.start_time.split(':');
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }
    if (event.end_time) {
        const [hours, minutes] = event.end_time.split(':');
        endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    const now = new Date();
    
    if (endDateTime < now) {
        return 'past';
    } else if (startDateTime <= now && endDateTime >= now) {
        return 'happening_now';
    } else {
        return 'upcoming';
    }
};

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, feedback_text: '' });

    // Reactions
    const [userReaction, setUserReaction] = useState(null);
    const [reactionsBreakdown, setReactionsBreakdown] = useState({});

    // Reminders
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [userReminders, setUserReminders] = useState([]);
    const [reminderLoading, setReminderLoading] = useState(false);

    // Schedule editing
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [newScheduleItem, setNewScheduleItem] = useState({ activity_name: '', start_time: '', end_time: '' });

    // Speaker editing
    const [showAddSpeaker, setShowAddSpeaker] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState({ speaker_name: '', speaker_bio: '' });

    // Slot Booking
    const [availability, setAvailability] = useState(null);
    const [myBooking, setMyBooking] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [bookingStep, setBookingStep] = useState('check'); // check, confirm, done

    // Sponsorship
    const [sponsorshipData, setSponsorshipData] = useState(null);
    const [showSponsorForm, setShowSponsorForm] = useState(false);
    const [sponsorForm, setSponsorForm] = useState({ applicant_name: '', applicant_contact: '', application_details: '' });

    useEffect(() => {
        loadEvent();
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('action') === 'book') setActiveTab('tickets');
        if (searchParams.get('action') === 'remind') setShowReminderModal(true);
    }, [id]);

    useEffect(() => {
        if (event?.id) {
            eventsService.logInteraction(event.id, 'view');
        }
    }, [event?.id]);

    useEffect(() => {
        if (activeTab === 'sponsorship' && event?.id && !sponsorshipData) {
            eventsService.getSponsorshipDashboard(event.id)
                .then(res => setSponsorshipData(res?.data || res))
                .catch(() => setSponsorshipData({}));
        }
    }, [activeTab, event?.id]);

    const loadEvent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await eventsService.getEvent(id);
            const eventData = response?.data || response;
            if (!eventData || (typeof eventData === 'object' && !eventData.id && !eventData.name)) {
                setError('Event not found');
                return;
            }
            setEvent(eventData);
            setUserReaction(eventData.user_reaction || null);
            setReactionsBreakdown(eventData.reactions_breakdown || {});
            setUserReminders(eventData.user_reminder || []);

            try {
                const [ticketsRes, reviewsRes] = await Promise.all([
                    eventsService.getEventTickets(id).catch(() => ({ data: [] })),
                    eventsService.getComments(id).catch(() => ({ data: [] }))
                ]);
                setTickets(Array.isArray(ticketsRes?.data) ? ticketsRes.data : []);
                const reviewData = reviewsRes?.data;
                setReviews(Array.isArray(reviewData?.results) ? reviewData.results : Array.isArray(reviewData) ? reviewData : []);
            } catch (err) {
                console.error('Failed to load aux data:', err);
            }
        } catch (err) {
            console.error('Failed to load event:', err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = async (type) => {
        try {
            if (userReaction === type) {
                await eventsService.removeReaction(event.id);
                setUserReaction(null);
                setReactionsBreakdown(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 1) - 1) }));
            } else {
                await eventsService.addReaction(event.id, type);
                if (userReaction) {
                    setReactionsBreakdown(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] || 1) - 1) }));
                }
                setUserReaction(type);
                setReactionsBreakdown(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
            }
        } catch (err) {
            console.error('Failed to toggle reaction:', err);
        }
    };

    const handleSetReminder = async (timeBefore) => {
        setReminderLoading(true);
        try {
            await eventsService.setUserReminder(event.id, timeBefore);
            setUserReminders(prev => prev.includes(timeBefore) ? prev : [...prev, timeBefore]);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to set reminder');
        } finally {
            setReminderLoading(false);
        }
    };

    const handleRemoveReminder = async (timeBefore) => {
        try {
            await eventsService.removeUserReminder(event.id, timeBefore);
            setUserReminders(prev => prev.filter(r => r !== timeBefore));
        } catch (err) {
            console.error('Failed to remove reminder:', err);
        }
    };

    const handleAddScheduleItem = async () => {
        try {
            await eventsService.addScheduleItem(event.id, newScheduleItem);
            setNewScheduleItem({ activity_name: '', start_time: '', end_time: '' });
            setShowAddSchedule(false);
            loadEvent();
        } catch (err) {
            alert('Failed to add schedule item');
        }
    };

    const handleAddSpeaker = async () => {
        try {
            await eventsService.addSpeaker(event.id, newSpeaker);
            setNewSpeaker({ speaker_name: '', speaker_bio: '' });
            setShowAddSpeaker(false);
            loadEvent();
        } catch (err) {
            alert('Failed to add speaker');
        }
    };

    const isOrganizer = event?.created_by === user?.id || user?.is_staff;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'schedule', label: 'Schedule', icon: CalendarDays },
        { id: 'booking', label: 'Book Slot', icon: Ticket },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
        { id: 'sponsorship', label: 'Sponsors', icon: DollarSign },
        { id: 'attendees', label: 'Attendees', icon: Users },
        { id: 'room', label: 'Discussion', icon: MessageSquare },
        { id: 'reviews', label: 'Reviews', icon: Star },
        ...(isOrganizer ? [
            { id: 'logistics', label: 'Logistics', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ] : []),
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-red-500 mb-4">{error || 'Event not found'}</p>
                        <Button onClick={() => navigate('/events')}>Back to Events</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/events')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">{event.name}</h1>
                <div className="flex gap-2">
                    {isOrganizer && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/events/edit/${event.id}`)}>
                            <Settings size={18} className="mr-2" /> Edit
                        </Button>
                    )}
                    <Button variant="ghost" size="sm"><Share2 size={18} /></Button>
                    <Button variant="ghost" size="sm"><Bookmark size={18} /></Button>
                </div>
            </div>

            {/* Event Hero */}
            <Card className="overflow-hidden">
                <div className="aspect-video md:aspect-[3/1] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center relative">
                    {(event.cover_image || event.image_url) ? (
                        <img
                            src={event.cover_image || event.image_url}
                            alt={event.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <Calendar className="w-20 h-20 text-primary" />
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {(() => {
                            const locType = event.event_location?.toLowerCase();
                            const locText = event.location?.toLowerCase() || '';
                            let badge = 'Physical';
                            let badgeClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                            if (locType === 'online' || locText.includes('virtual') || locText.includes('online') || locText.includes('zoom') || locText.includes('meet') || locText.includes('teams')) {
                                badge = 'Virtual'; badgeClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
                            } else if (locType === 'hybrid' || locText.includes('hybrid')) {
                                badge = 'Hybrid'; badgeClass = 'bg-primary-600/20 text-primary-500 border border-primary-600/30';
                            }
                            return <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm ${badgeClass}`}>{badge}</span>;
                        })()}
                        {(() => {
                            const temporalStatus = getTemporalStatus(event);
                            if (!temporalStatus) return null;
                            
                            const styles = {
                                past: 'bg-elevated/90 text-secondary border-theme',
                                happening_now: 'bg-red-500/20 text-red-500 border-red-500/30 animate-pulse',
                                upcoming: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                            };
                            
                            const labels = {
                                past: 'Past',
                                happening_now: 'Happening Now',
                                upcoming: 'Upcoming'
                            };

                            return (
                                <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs font-medium uppercase tracking-wider shadow-sm border ${styles[temporalStatus]}`}>
                                    {labels[temporalStatus]}
                                </span>
                            );
                        })()}
                        {event.status && (
                            <span className="px-3 py-1 bg-elevated/90 backdrop-blur-sm rounded-full text-xs font-medium text-secondary capitalize shadow-sm border border-theme">
                                {event.status}
                            </span>
                        )}
                    </div>
                </div>

                <CardBody className="p-6">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg"><Calendar className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-sm text-secondary">Date</p>
                                <p className="font-semibold text-primary">{formatDate(event.event_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg"><Clock className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-sm text-secondary">Time</p>
                                <p className="font-semibold text-primary">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {event.event_location === 'online' ? <Globe className="w-5 h-5 text-primary" /> : <MapPin className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Location</p>
                                <p className="font-semibold text-primary truncate max-w-[150px]">{event.location || 'Virtual'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-sm text-secondary">Capacity</p>
                                <p className="font-semibold text-primary">{event.attendees?.length || 0} / {event.capacity}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <button
                            onClick={() => handleReaction('love')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${userReaction === 'love'
                                ? 'bg-red-500/10 border-red-500/40 text-red-500'
                                : 'border-theme text-secondary hover:border-red-500/40 hover:text-red-500'
                                }`}
                        >
                            <Heart size={16} className={userReaction === 'love' ? 'fill-current' : ''} />
                            Love {reactionsBreakdown.love ? `(${reactionsBreakdown.love})` : ''}
                        </button>
                        <button
                            onClick={() => handleReaction('excited')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${userReaction === 'excited'
                                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500'
                                : 'border-theme text-secondary hover:border-yellow-500/40 hover:text-yellow-500'
                                }`}
                        >
                            <Sparkles size={16} />
                            Excited {reactionsBreakdown.excited ? `(${reactionsBreakdown.excited})` : ''}
                        </button>
                        <button
                            onClick={() => setShowReminderModal(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${userReminders.length > 0
                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                                : 'border-theme text-secondary hover:border-blue-500/40 hover:text-blue-500'
                                }`}
                        >
                            <BellRing size={16} />
                            Remind Me {userReminders.length > 0 ? `(${userReminders.length})` : ''}
                        </button>
                    </div>

                    {/* Actions */}
                    <EventActions
                        event={event}
                        onUpdate={loadEvent}
                        onOpenReminders={() => setShowReminderModal(true)}
                    />
                </CardBody>
            </Card>

            {/* Reminder Modal */}
            {showReminderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowReminderModal(false)}>
                    <div className="bg-elevated border border-theme rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <BellRing className="text-blue-500" size={20} /> Set Reminders
                            </h3>
                            <button onClick={() => setShowReminderModal(false)} className="text-secondary hover:text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-secondary mb-4">
                            You'll receive reminders via notification, email, and a system message from <strong className="text-blue-400">QomReminders</strong>.
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {REMINDER_OPTIONS.map(opt => {
                                const isSet = userReminders.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        disabled={reminderLoading}
                                        onClick={() => isSet ? handleRemoveReminder(opt.value) : handleSetReminder(opt.value)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${isSet
                                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                            : 'border-theme text-secondary hover:border-blue-500/20 hover:bg-blue-500/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} />
                                            <span className="font-medium">{opt.label}</span>
                                        </div>
                                        {isSet && <Check size={18} className="text-blue-400" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-theme">
                            <div className="flex items-start gap-2 text-xs text-secondary">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>Reminders are sent to your notifications, email, and as a message from QomReminders in your messages.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-theme overflow-x-auto">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-3 text-primary">About this Event</h3>
                                <p className="text-secondary whitespace-pre-wrap">{event.description}</p>
                            </CardBody></Card>

                            {/* Speakers section in overview */}
                            {event.speakers?.length > 0 && (
                                <Card><CardBody>
                                    <h3 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
                                        <Mic2 size={18} /> Speakers & Guests
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {event.speakers.map((spk, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-theme/30">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {(spk.speaker_name || spk.user_name || 'S')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary text-sm">{spk.speaker_name || spk.user_name}</p>
                                                    <p className="text-xs text-secondary line-clamp-2">{spk.speaker_bio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody></Card>
                            )}

                            {/* Materials section in overview */}
                            {event.materials?.length > 0 && (
                                <Card><CardBody>
                                    <h3 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
                                        <Paperclip size={18} /> Event Materials
                                    </h3>
                                    <div className="space-y-2">
                                        {event.materials.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-theme/30 group">
                                                <FileText size={18} className="text-blue-400 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-primary truncate">{file.description || file.file_type}</p>
                                                    <p className="text-xs text-secondary">{file.file_type}</p>
                                                </div>
                                                {file.file_url && (
                                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300">
                                                        <Download size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardBody></Card>
                            )}

                            {/* Map */}
                            {event.event_location !== 'online' && event.latitude && event.longitude && (
                                <Card><CardBody>
                                    <h3 className="font-semibold text-lg mb-3 text-primary">Location</h3>
                                    <div className="bg-secondary rounded-lg h-64 flex items-center justify-center">
                                        <p className="text-secondary">Map integration coming soon</p>
                                    </div>
                                    <p className="mt-2 text-secondary"><MapPin size={16} className="inline mr-1" />{event.location}</p>
                                </CardBody></Card>
                            )}

                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-4 text-primary">Discussion</h3>
                                <EventComments eventId={event.id} />
                            </CardBody></Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card><CardBody>
                                <h3 className="font-semibold mb-3 text-primary">Organized by</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                                        {(event.created_by_name || event.organisation?.name || event.institution?.name || 'O')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-primary">{event.created_by_name || event.organisation?.name || event.institution?.name || 'Event Organizer'}</p>
                                        <p className="text-sm text-secondary">
                                            {event.organisation ? 'Organisation' : event.institution ? 'Institution' : 'Independent Organizer'}
                                        </p>
                                    </div>
                                </div>
                                {event.event_url && (
                                    <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary-500 hover:underline">
                                        <Globe size={14} /> Event Link
                                    </a>
                                )}
                            </CardBody></Card>

                            <Card><CardBody>
                                <h3 className="font-semibold mb-3 text-primary">Event Stats</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-secondary">Interested</span><span className="font-medium text-primary">{event.interested_count || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">Reactions</span><span className="font-medium text-primary">{event.reactions_count || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">Comments</span><span className="font-medium text-primary">{event.comments_count || 0}</span></div>
                                </div>
                            </CardBody></Card>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                                    <CalendarDays size={20} /> Event Schedule
                                </h3>
                                {isOrganizer && (
                                    <Button variant="primary" size="sm" onClick={() => setShowAddSchedule(!showAddSchedule)}>
                                        <Plus size={16} className="mr-1" /> Add Item
                                    </Button>
                                )}
                            </div>

                            {showAddSchedule && isOrganizer && (
                                <div className="mb-6 p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                                    <input type="text" placeholder="Activity Name" value={newScheduleItem.activity_name}
                                        onChange={e => setNewScheduleItem({ ...newScheduleItem, activity_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="datetime-local" value={newScheduleItem.start_time}
                                            onChange={e => setNewScheduleItem({ ...newScheduleItem, start_time: e.target.value })}
                                            className="px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <input type="datetime-local" value={newScheduleItem.end_time}
                                            onChange={e => setNewScheduleItem({ ...newScheduleItem, end_time: e.target.value })}
                                            className="px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="primary" size="sm" onClick={handleAddScheduleItem}>Save</Button>
                                        <Button variant="secondary" size="sm" onClick={() => setShowAddSchedule(false)}>Cancel</Button>
                                    </div>
                                </div>
                            )}

                            {event.schedule_items?.length > 0 ? (
                                <div className="space-y-3">
                                    {event.schedule_items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 bg-secondary/20 rounded-lg border border-theme/30 group">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-primary">{item.activity_name}</h4>
                                                <p className="text-sm text-secondary mt-1">
                                                    {formatDate(item.start_time)} {formatTime(item.start_time)} — {formatTime(item.end_time)}
                                                </p>
                                            </div>
                                            {isOrganizer && (
                                                <button onClick={async () => { await eventsService.deleteScheduleItem(event.id, item.id); loadEvent(); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-secondary">
                                    <CalendarDays size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No schedule items yet.</p>
                                    {isOrganizer && <p className="text-sm mt-1">Click "Add Item" to create the event schedule.</p>}
                                </div>
                            )}

                            {/* Speakers within schedule tab */}
                            <div className="mt-8 pt-6 border-t border-theme">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                                        <Mic2 size={20} /> Speakers & Guests
                                    </h3>
                                    {isOrganizer && (
                                        <Button variant="secondary" size="sm" onClick={() => setShowAddSpeaker(!showAddSpeaker)}>
                                            <Plus size={16} className="mr-1" /> Add Speaker
                                        </Button>
                                    )}
                                </div>

                                {showAddSpeaker && isOrganizer && (
                                    <div className="mb-4 p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                                        <input type="text" placeholder="Speaker Name" value={newSpeaker.speaker_name}
                                            onChange={e => setNewSpeaker({ ...newSpeaker, speaker_name: e.target.value })}
                                            className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <textarea placeholder="Speaker Bio" value={newSpeaker.speaker_bio}
                                            onChange={e => setNewSpeaker({ ...newSpeaker, speaker_bio: e.target.value })}
                                            className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none resize-y focus:ring-2 focus:ring-primary/20" rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <Button variant="primary" size="sm" onClick={handleAddSpeaker}>Add Speaker</Button>
                                            <Button variant="secondary" size="sm" onClick={() => setShowAddSpeaker(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {event.speakers?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {event.speakers.map((spk, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-4 bg-secondary/20 rounded-lg border border-theme/30">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                                    {(spk.speaker_name || spk.user_name || 'S')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary">{spk.speaker_name || spk.user_name}</p>
                                                    <p className="text-sm text-secondary mt-1">{spk.speaker_bio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-secondary text-center py-6">No speakers added yet.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'tickets' && (
                    <Card><CardBody>
                        <EventTicketing event={event} tickets={tickets} isOrganizer={isOrganizer} />
                    </CardBody></Card>
                )}

                {activeTab === 'booking' && (
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg mb-6 text-primary flex items-center gap-2">
                            <Ticket size={20} /> Slot Booking
                        </h3>

                        {bookingStep === 'done' && myBooking ? (
                            <div className="py-4">
                                {/* Printable Ticket Card */}
                                <div id="ticket-download-card" className="max-w-md mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                                    {/* Ticket header */}
                                    <div className="bg-gradient-to-r from-primary-700 to-indigo-600 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-primary-300 text-xs font-medium tracking-widest uppercase">Event Ticket</p>
                                                <h4 className="text-white text-lg font-bold mt-1">{event.name || event.title}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary-300 text-xs">Ticket #</p>
                                                <p className="text-white font-mono font-bold text-sm">{myBooking.ticket_number}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket body */}
                                    <div className="px-6 py-5">
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">Date</p>
                                                <p className="text-white font-medium mt-0.5">{formatDate(event.event_date || event.start_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">Time</p>
                                                <p className="text-white font-medium mt-0.5">{event.start_time ? formatTime(event.start_time) : 'TBA'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">Location</p>
                                                <p className="text-white font-medium mt-0.5 truncate">{event.location || event.venue || 'Online'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">Status</p>
                                                <p className="text-green-400 font-semibold mt-0.5 capitalize">{myBooking.booking_status}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">Attendee</p>
                                                <p className="text-white font-medium mt-0.5">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-wider">{myBooking.amount_paid > 0 ? 'Amount Paid' : 'Price'}</p>
                                                <p className="text-white font-medium mt-0.5">{myBooking.amount_paid > 0 ? `$${myBooking.amount_paid}` : 'Free'}</p>
                                            </div>
                                        </div>

                                        {/* Dashed line separator */}
                                        <div className="border-t-2 border-dashed border-gray-700 my-4 relative">
                                            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[var(--bg-primary,#1a1a2e)]"></div>
                                            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[var(--bg-primary,#1a1a2e)]"></div>
                                        </div>

                                        {/* QR Code */}
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-3 rounded-xl">
                                                <QRCodeSVG
                                                    value={typeof myBooking.qr_code_data === 'string' ? myBooking.qr_code_data : JSON.stringify(myBooking.qr_code_data || { ticket: myBooking.ticket_number, event: event.id })}
                                                    size={160}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <p className="text-gray-500 text-xs mt-3">Scan to verify ticket</p>
                                        </div>
                                    </div>

                                    {/* Ticket footer */}
                                    <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                                        <span className="text-gray-500 text-xs">Qomrade Events</span>
                                        <span className="text-gray-500 text-xs">© {new Date().getFullYear()}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3 justify-center mt-6">
                                    <Button
                                        variant="primary"
                                        onClick={async () => {
                                            const el = document.getElementById('ticket-download-card');
                                            if (!el) return;
                                            try {
                                                const canvas = await html2canvas(el, {
                                                    backgroundColor: '#111827',
                                                    scale: 2,
                                                    useCORS: true,
                                                    logging: false,
                                                });
                                                const link = document.createElement('a');
                                                link.download = `ticket-${myBooking.ticket_number}.png`;
                                                link.href = canvas.toDataURL('image/png');
                                                link.click();
                                            } catch (err) {
                                                console.error('Ticket download failed:', err);
                                                alert('Failed to download ticket');
                                            }
                                        }}
                                    >
                                        <Download size={16} className="mr-2" /> Download Ticket
                                    </Button>
                                    <Button variant="secondary" onClick={() => setBookingStep('check')}>
                                        Book Another
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Availability Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-sm text-secondary">Total Capacity</p>
                                        <p className="text-2xl font-bold text-blue-400 mt-1">{event.capacity || '—'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <p className="text-sm text-secondary">Slots Remaining</p>
                                        <p className="text-2xl font-bold text-green-400 mt-1">{event.slots_remaining ?? (event.capacity - (event.attendees?.length || 0))}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary-600/10 border border-primary-600/20">
                                        <p className="text-sm text-secondary">Tickets Available</p>
                                        <p className="text-2xl font-bold text-primary-500 mt-1">{tickets.length || 'Auto'}</p>
                                    </div>
                                </div>

                                {/* Ticket Selection */}
                                {tickets.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-primary mb-3">Select Ticket Type</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {tickets.map(ticket => (
                                                <button
                                                    key={ticket.id}
                                                    onClick={() => setSelectedTicket(ticket.id)}
                                                    className={`p-4 rounded-xl border text-left transition-all ${selectedTicket === ticket.id
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'border-theme hover:border-primary/40'
                                                        }`}
                                                >
                                                    <p className="font-medium text-primary">{ticket.ticket_type || 'General'}</p>
                                                    <p className="text-lg font-bold text-primary mt-1">
                                                        {ticket.is_free || Number(ticket.price) === 0 ? 'Free' : `$${ticket.price}`}
                                                    </p>
                                                    {ticket.quantity_available && (
                                                        <p className="text-xs text-secondary mt-1">{ticket.quantity_available} available</p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Book Button */}
                                <div className="flex justify-center">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        disabled={bookingLoading}
                                        onClick={async () => {
                                            setBookingLoading(true);
                                            try {
                                                const res = await eventsService.bookSlot(event.id, selectedTicket);
                                                const booking = res?.data?.booking || res?.data;
                                                setMyBooking(booking);
                                                if (booking?.requires_payment) {
                                                    setBookingStep('confirm');
                                                } else {
                                                    setBookingStep('done');
                                                }
                                            } catch (err) {
                                                const msg = err.response?.data?.error || 'Booking failed';
                                                alert(msg);
                                                // If already booked, show existing
                                                if (err.response?.data?.booking) {
                                                    setMyBooking(err.response.data.booking);
                                                    setBookingStep('done');
                                                }
                                            } finally {
                                                setBookingLoading(false);
                                            }
                                        }}
                                        className="px-12"
                                    >
                                        {bookingLoading ? (
                                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></span> Booking...</>
                                        ) : (
                                            <><Ticket size={18} className="mr-2" /> Book My Slot</>
                                        )}
                                    </Button>
                                </div>

                                {/* Payment Confirmation Step */}
                                {bookingStep === 'confirm' && myBooking && (
                                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 text-center">
                                        <AlertCircle size={32} className="text-yellow-400 mx-auto mb-3" />
                                        <h4 className="text-lg font-bold text-primary mb-2">Payment Required</h4>
                                        <p className="text-secondary mb-4">Amount: <strong className="text-primary">${myBooking.amount_paid}</strong></p>
                                        <div className="flex gap-3 justify-center">
                                            <Button
                                                variant="primary"
                                                onClick={async () => {
                                                    try {
                                                        await eventsService.confirmPayment(myBooking.id);
                                                        setBookingStep('done');
                                                        setMyBooking(prev => ({ ...prev, booking_status: 'confirmed' }));
                                                    } catch (err) {
                                                        alert('Payment confirmation failed');
                                                    }
                                                }}
                                            >
                                                <Check size={16} className="mr-1" /> Confirm Payment
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={async () => {
                                                    try {
                                                        await eventsService.cancelBooking(myBooking.id);
                                                        setMyBooking(null);
                                                        setBookingStep('check');
                                                    } catch (err) {
                                                        alert('Cancel failed');
                                                    }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody></Card>
                )}

                {activeTab === 'attendees' && (
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg mb-4 text-primary">Attendees ({event.attendees?.length || 0})</h3>
                        {event.attendees_viewable ? (
                            event.attendees?.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {event.attendees.map((attendee, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium text-primary">Attendee {idx + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-secondary text-center py-8">No attendees yet. Be the first to RSVP!</p>
                        ) : <p className="text-secondary text-center py-8">Attendee list is private</p>}
                    </CardBody></Card>
                )}

                {activeTab === 'room' && (
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg mb-4 text-primary">Event Discussion Room</h3>
                        {event.room ? (
                            <div className="text-center py-8">
                                <Button onClick={() => navigate(`/rooms/${event.room.room}`)}>
                                    Enter Discussion Room <ChevronRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        ) : <p className="text-secondary text-center py-8">Discussion room will be available when the event starts.</p>}
                    </CardBody></Card>
                )}

                {activeTab === 'reviews' && (
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg mb-4 text-primary">Event Reviews</h3>
                        {!isOrganizer && (
                            <div className="mb-8 bg-secondary/30 p-4 rounded-lg border border-theme/50">
                                <h4 className="font-medium text-primary mb-3">Leave a Review</h4>
                                <div className="flex gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className={`p-1 rounded-full transition-colors ${newReview.rating >= star ? 'text-yellow-500' : 'text-tertiary hover:text-yellow-500/50'}`}>
                                            <Star className={newReview.rating >= star ? "fill-current" : ""} size={24} />
                                        </button>
                                    ))}
                                </div>
                                <textarea value={newReview.feedback_text} onChange={(e) => setNewReview({ ...newReview, feedback_text: e.target.value })}
                                    placeholder="Share your experience..." className="w-full bg-secondary border border-theme rounded-lg p-3 text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 outline-none mb-3 min-h-[100px]" />
                                <Button variant="primary" disabled={!newReview.feedback_text.trim()} onClick={async () => {
                                    try {
                                        await eventsService.submitFeedback(event.id, { rating: newReview.rating, feedback_text: newReview.feedback_text });
                                        setNewReview({ rating: 5, feedback_text: '' });
                                        loadEvent();
                                        alert("Review submitted");
                                    } catch (err) {
                                        alert(err.response?.data?.error || "Failed");
                                    }
                                }}>Submit Review</Button>
                            </div>
                        )}
                        <div className="space-y-4">
                            {reviews.length > 0 ? reviews.map((review, idx) => (
                                <div key={idx} className="p-4 bg-secondary rounded-lg border border-theme/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary-600">
                                                {(review.user?.first_name || review.user_name || 'U')[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary text-sm">{review.user?.first_name || review.user_name || 'Anonymous'}</p>
                                                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={review.rating >= s ? 'text-yellow-500 fill-current' : 'text-tertiary'} />)}</div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-tertiary">{formatDate(review.created_at || new Date().toISOString())}</span>
                                    </div>
                                    <p className="text-secondary text-sm">{review.feedback || review.feedback_text}</p>
                                </div>
                            )) : <p className="text-secondary text-center py-6">No reviews yet.</p>}
                        </div>
                    </CardBody></Card>
                )}

                {activeTab === 'logistics' && isOrganizer && (
                    <LogisticsSection event={event} onUpdate={loadEvent} />
                )}

                {activeTab === 'analytics' && isOrganizer && (
                    <EventAnalyticsDashboard event={event} />
                )}

                {activeTab === 'sponsorship' && (
                    <div className="space-y-6">
                        {/* Sponsorship Levels */}
                        <Card><CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                                <DollarSign size={20} /> Sponsorship Tiers
                            </h3>
                            {sponsorshipData?.levels?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sponsorshipData.levels.map((level) => (
                                        <div key={level.id} className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-primary">{level.name}</h4>
                                                <span className="text-primary-600 font-bold text-lg">${level.price}</span>
                                            </div>
                                            <p className="text-sm text-secondary line-clamp-3">{level.benefits}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary text-center py-6">No sponsorship levels defined yet.</p>
                            )}
                        </CardBody></Card>

                        {/* Current Sponsors */}
                        {sponsorshipData?.sponsors?.length > 0 && (
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                                    <Star size={20} /> Current Sponsors
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sponsorshipData.sponsors.map((sponsor, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-theme/30">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                                                {sponsor.name?.[0]?.toUpperCase() || 'S'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-primary text-sm">{sponsor.name}</p>
                                                <p className="text-xs text-secondary">{sponsor.level || 'Sponsor'} &middot; ${sponsor.amount}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody></Card>
                        )}

                        {/* Apply for Sponsorship */}
                        <Card><CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-primary">Apply for Sponsorship</h3>
                                <Button variant="primary" size="sm" onClick={() => setShowSponsorForm(!showSponsorForm)}>
                                    <Plus size={16} className="mr-1" /> Apply
                                </Button>
                            </div>

                            {showSponsorForm && (
                                <div className="mb-6 p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                                    <input type="text" placeholder="Your Name / Organization" value={sponsorForm.applicant_name}
                                        onChange={e => setSponsorForm({ ...sponsorForm, applicant_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                    <input type="text" placeholder="Contact Email / Phone" value={sponsorForm.applicant_contact}
                                        onChange={e => setSponsorForm({ ...sponsorForm, applicant_contact: e.target.value })}
                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                    <textarea placeholder="Why do you want to sponsor this event?" value={sponsorForm.application_details}
                                        onChange={e => setSponsorForm({ ...sponsorForm, application_details: e.target.value })}
                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none resize-y focus:ring-2 focus:ring-primary/20" rows={4} />
                                    <div className="flex gap-2">
                                        <Button variant="primary" size="sm" onClick={async () => {
                                            try {
                                                await eventsService.applySponsorshipApplication({
                                                    event: event.id,
                                                    ...sponsorForm,
                                                });
                                                setSponsorForm({ applicant_name: '', applicant_contact: '', application_details: '' });
                                                setShowSponsorForm(false);
                                                alert('Application submitted!');
                                            } catch (err) {
                                                alert(err.response?.data?.error || 'Failed to submit application');
                                            }
                                        }}>Submit</Button>
                                        <Button variant="secondary" size="sm" onClick={() => setShowSponsorForm(false)}>Cancel</Button>
                                    </div>
                                </div>
                            )}

                            {/* Stats for organizer */}
                            {isOrganizer && sponsorshipData && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-500">{sponsorshipData.total_applications || 0}</p>
                                        <p className="text-xs text-secondary">Applications</p>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-green-500">{sponsorshipData.approved || 0}</p>
                                        <p className="text-xs text-secondary">Approved</p>
                                    </div>
                                    <div className="p-3 bg-amber-500/10 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-amber-500">{sponsorshipData.pending || 0}</p>
                                        <p className="text-xs text-secondary">Pending</p>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-primary">${sponsorshipData.total_sponsorship_value || 0}</p>
                                        <p className="text-xs text-secondary">Total Value</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-secondary">
                                {isOrganizer 
                                    ? 'Manage sponsorship applications for your event below.'
                                    : 'Submit your sponsorship proposal and the organizer will review it.'}
                            </p>
                        </CardBody></Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetail;
