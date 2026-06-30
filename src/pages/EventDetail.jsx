/**
 * Event Detail Page
 * Comprehensive view with reactions (love/excited/remind-me), schedule, speakers, materials, analytics
 */
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import EventComments from '../components/events/EventComments';
import EventAnalyticsDashboard from '../components/events/EventAnalyticsDashboard';
import EventCheckIn from '../components/events/EventCheckIn';
import EventSurvey from '../components/events/EventSurvey';
import LogisticsSection from '../components/events/EventLogistics';
import { useToast } from '../contexts/ToastContext';
import {
    Calendar, MapPin, Users, Clock, Ticket, MessageSquare,
    ArrowLeft, Share2, Bookmark, MoreVertical, Globe, Building,
    FileText, DollarSign, Settings, ChevronRight, Star,
    BellRing, CalendarDays, Mic2, Paperclip, BarChart3, Download,
    Plus, Trash2, X, Check, AlertCircle, Loader, CheckCircle, XCircle, Send, Eye,
    Copy, ExternalLink, LifeBuoy, HelpCircle, ClipboardList
} from 'lucide-react';
import eventsService from '../services/events.service';
import organizationsService from '../services/organizations.service';
import { formatDate, formatTime, getTemporalStatus } from '../utils/dateFormatter';
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



const skipFontsFilter = (node) => !(node.nodeType === 1 && node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis'));

const silentCapture = async (fn, ...args) => {
    const orig = console.error;
    console.error = (...msgs) => {
        if (msgs.some(m => typeof m === 'string' && m.includes('fonts.googleapis'))) return;
        orig.apply(console, msgs);
    };
    try {
        return await fn(...args);
    } finally {
        console.error = orig;
    }
};

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
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

    // Organizer tools
    const [showOrganizerMenu, setShowOrganizerMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [retainEvent, setRetainEvent] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const menuRef = useRef(null);

    // Help request
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpSubject, setHelpSubject] = useState('');
    const [helpMessage, setHelpMessage] = useState('');
    const [helpPriority, setHelpPriority] = useState('medium');

    // Schedule editing
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [newScheduleItem, setNewScheduleItem] = useState({ activity_name: '', start_time: '', end_time: '' });

    // Speaker editing
    const [showAddSpeaker, setShowAddSpeaker] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState({ speaker_name: '', speaker_bio: '' });

    // Slot Booking
    const [availability, setAvailability] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);
    const [bookingStep, setBookingStep] = useState('check'); // check, info, confirm, done
    const [attendeeRows, setAttendeeRows] = useState([{ name: '', email: '', phone: '' }]);
    const [bookingQuantity, setBookingQuantity] = useState(1);
    const [groupName, setGroupName] = useState('');
    const [expandedBooking, setExpandedBooking] = useState(null);
    const [sharingTicketId, setSharingTicketId] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [viewingTicketUuid, setViewingTicketUuid] = useState(null);

    // Sponsorship
    const [sponsorshipData, setSponsorshipData] = useState(null);
    const [sponsorshipLoading, setSponsorshipLoading] = useState(false);
    const [showSponsorForm, setShowSponsorForm] = useState(false);
    const [userOrganizations, setUserOrganizations] = useState([]);
    const [sponsorForm, setSponsorForm] = useState({ applicant_name: '', applicant_contact: '', application_details: '', organisation: '' });
    const [sponsorMessage, setSponsorMessage] = useState(null);
    const [userApplication, setUserApplication] = useState(null);

    // Sponsor Requests
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [orgSearchQuery, setOrgSearchQuery] = useState('');
    const [orgSearchResults, setOrgSearchResults] = useState([]);
    const [selectedOrgs, setSelectedOrgs] = useState([]);
    const [requestMessage, setRequestMessage] = useState('');
    const [sponsorRequests, setSponsorRequests] = useState([]);
    const [sendingRequest, setSendingRequest] = useState(false);

    useEffect(() => {
        loadEvent();
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'book') setActiveTab('tickets');
        if (params.get('action') === 'remind') setShowReminderModal(true);
    }, [id]);

    useEffect(() => {
        if (event?.id) {
            eventsService.logInteraction(event.id, 'view');
        }
    }, [event?.id]);

    useEffect(() => {
        if (activeTab === 'sponsorship' && event?.id) {
            setSponsorshipLoading(true);
            organizationsService.getMyOrganizations().then(setUserOrganizations).catch(() => {});
            Promise.all([
                eventsService.getSponsorshipDashboard(event.id),
                eventsService.getMySponsorshipApplications(),
            ])
                .then(([dashRes, appsRes]) => {
                    const dash = dashRes?.data || dashRes;
                    setSponsorshipData(dash || {});
                    const apps = appsRes?.data || appsRes || [];
                    const myApp = Array.isArray(apps) ? apps.find(a => Number(a.event) === Number(event.id)) : null;
                    setUserApplication(myApp);
                })
                .catch(() => {
                    setSponsorshipData({});
                    setUserApplication(null);
                })
                .finally(() => setSponsorshipLoading(false));
        }
    }, [activeTab, event?.id]);

    const loadSponsorRequests = async () => {
        try {
            const res = await eventsService.getSponsorRequests(event.id);
            const data = res?.data || res || [];
            setSponsorRequests(Array.isArray(data) ? data : []);
        } catch {
            setSponsorRequests([]);
        }
    };

    const handleOrgSearch = async (query) => {
        setOrgSearchQuery(query);
        if (query.length < 2) {
            setOrgSearchResults([]);
            return;
        }
        try {
            const results = await organizationsService.searchOrganizations(query);
            setOrgSearchResults(Array.isArray(results) ? results : []);
        } catch {
            setOrgSearchResults([]);
        }
    };

    const toggleOrg = (org) => {
        setSelectedOrgs(prev =>
            prev.some(o => o.id === org.id) ? prev.filter(o => o.id !== org.id) : [...prev, org]
        );
    };

    const handleSendRequests = async () => {
        if (selectedOrgs.length === 0 && !requestMessage.trim()) return;
        setSendingRequest(true);
        try {
            await eventsService.sendSponsorRequest(event.id, {
                organization_ids: selectedOrgs.map(o => o.id),
                message: requestMessage.trim(),
            });
            toast.success('Sponsor requests sent');
            setShowRequestModal(false);
            setSelectedOrgs([]);
            setRequestMessage('');
            setOrgSearchQuery('');
            setOrgSearchResults([]);
            loadSponsorRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send requests');
        } finally {
            setSendingRequest(false);
        }
    };

    const loadMyBookings = async () => {
        try {
            const res = await eventsService.getMyBookings();
            const all = Array.isArray(res?.data) ? res.data : [];
            const eventBookings = all.filter(b => {
                const eid = b.event || b.event_id;
                return String(eid) === String(id) || String(eid) === String(event?.id);
            });
            setMyBookings(eventBookings);
        } catch { /* ignore */ }
    };

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
                    eventsService.getEventReviews(id).catch(() => ({ data: [] }))
                ]);
                setTickets(Array.isArray(ticketsRes?.data) ? ticketsRes.data : []);
                const reviewData = reviewsRes?.data;
                setReviews(Array.isArray(reviewData) ? reviewData : []);
            } catch (err) {
                console.error('Failed to load aux data:', err);
            }

            loadMyBookings();
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
            toast.error(err.response?.data?.error || 'Failed to set reminder');
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
            toast.error('Failed to add schedule item');
        }
    };

    const handleAddSpeaker = async () => {
        try {
            await eventsService.addSpeaker(event.id, newSpeaker);
            setNewSpeaker({ speaker_name: '', speaker_bio: '' });
            setShowAddSpeaker(false);
            loadEvent();
        } catch (err) {
            toast.error('Failed to add speaker');
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowOrganizerMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteEvent = async () => {
        setActionLoading(true);
        try {
            await eventsService.deleteEvent(event.id);
            toast.success('Event deleted successfully');
            navigate('/events');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete event');
        } finally {
            setActionLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDuplicateEvent = async () => {
        setActionLoading(true);
        try {
            await eventsService.duplicateEvent(event.id);
            toast.success('Event duplicated successfully');
            loadEvent();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to duplicate event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToAnnouncement = async () => {
        setActionLoading(true);
        try {
            await eventsService.convertToAnnouncement(event.id, retainEvent);
            toast.success('Event converted to announcement successfully');
            setShowConvertModal(false);
            loadEvent();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to convert event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestHelp = async () => {
        if (!helpSubject.trim() || !helpMessage.trim()) return;
        setActionLoading(true);
        try {
            await eventsService.requestHelp(event.id, {
                subject: helpSubject,
                message: helpMessage,
                priority: helpPriority
            });
            toast.success('Help request sent to organizers');
            setShowHelpModal(false);
            setHelpSubject('');
            setHelpMessage('');
            setHelpPriority('medium');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send help request');
        } finally {
            setActionLoading(false);
        }
    };

    const isOrganizer = event?.created_by === user?.id || user?.is_staff;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'schedule', label: 'Schedule', icon: CalendarDays },
        { id: 'tickets', label: 'Tickets & Booking', icon: Ticket },
        { id: 'sponsorship', label: 'Sponsors', icon: DollarSign },
        { id: 'attendees', label: 'Attendees', icon: Users },
        { id: 'room', label: 'Discussion', icon: MessageSquare },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'surveys', label: 'Surveys', icon: ClipboardList },
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
        <><div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/events')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">{event.name}</h1>
                <div className="flex gap-2">
                    {!isOrganizer && (
                        <Button variant="outline" size="sm" onClick={() => setShowHelpModal(true)}>
                            <HelpCircle size={18} className="mr-2" /> Help
                        </Button>
                    )}
                    {isOrganizer && (
                        <div className="relative" ref={menuRef}>
                            <Button variant="outline" size="sm" onClick={() => setShowOrganizerMenu(!showOrganizerMenu)}>
                                <Settings size={18} className="mr-2" /> Manage
                            </Button>
                            {showOrganizerMenu && (
                                <div className="absolute right-0 top-full mt-1 w-56 bg-elevated border border-theme rounded-xl shadow-2xl z-50 py-2">
                                    <button onClick={() => { navigate(`/events/edit/${event.id}`); setShowOrganizerMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-secondary transition-colors">
                                        <Settings size={16} /> Edit Event
                                    </button>
                                    <button onClick={() => { handleDuplicateEvent(); setShowOrganizerMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-secondary transition-colors">
                                        <Copy size={16} /> Duplicate Event
                                    </button>
                                    <button onClick={() => { setShowConvertModal(true); setShowOrganizerMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-secondary transition-colors">
                                        <ExternalLink size={16} /> Convert to Announcement
                                    </button>
                                    <div className="border-t border-theme my-1" />
                                    <button onClick={() => { setShowDeleteConfirm(true); setShowOrganizerMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={16} /> Delete Event
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Event Hero */}
            <Card>
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
                                                const params = new URLSearchParams(window.location.search);
                                                params.set('tab', tab.id);
                                                setSearchParams(params);
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
                                    {event.event_organizer_detail?.avatar ? (
                                        <img
                                            src={event.event_organizer_detail.avatar}
                                            alt={event.event_organizer_detail.business_name || 'Organizer'}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-theme"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {(event.event_organizer_detail?.business_name || event.created_by_name || event.organisation?.name || event.institution?.name || 'O')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-primary">{event.event_organizer_detail?.business_name || event.created_by_name || event.organisation?.name || event.institution?.name || 'Event Organizer'}</p>
                                        <p className="text-sm text-secondary">
                                            {event.event_organizer_detail?.business_name ? 'Organizer' : event.organisation ? 'Organisation' : event.institution ? 'Institution' : 'Independent Organizer'}
                                        </p>
                                    </div>
                                </div>
                                {event.event_organizer_detail?.cover_photo && (
                                    <div className="mt-3 rounded-lg overflow-hidden h-20">
                                        <img src={event.event_organizer_detail.cover_photo} alt="Cover" className="w-full h-full object-cover" />
                                    </div>
                                )}
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
                                    <div className="flex justify-between"><span className="text-secondary flex items-center gap-1">❤️ Love</span><span className="font-medium text-primary">{reactionsBreakdown?.love || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary flex items-center gap-1">⭐ Interested</span><span className="font-medium text-primary">{reactionsBreakdown?.excited || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary text-xs mt-1">Total Reactions</span><span className="font-medium text-primary text-xs">{event.reactions_count || 0}</span></div>
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
                    <div className="space-y-6">
                        {isOrganizer && (
                            <Card className="border-primary-500/30">
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                                        <Settings size={20} /> Ticket Management
                                    </h3>
                                    {event.ticket_tiers?.length > 0 ? (
                                        <div className="space-y-3 mb-4">
                                            {event.ticket_tiers.map((tier, i) => {
                                                const booked = tier.booked_count ?? 0;
                                                const capacity = tier.capacity ?? 0;
                                                const pct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
                                                return (
                                                    <div key={tier.id || i} className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-primary text-sm">{tier.name || `Tier ${i + 1}`}</span>
                                                                {tier.price > 0 && <span className="text-xs text-yellow-600 font-medium">${tier.price}</span>}
                                                                {tier.price <= 0 && <span className="text-xs text-green-600 font-medium">Free</span>}
                                                            </div>
                                                            <div className="mt-1 w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                                <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                                                            </div>
                                                            <p className="text-xs text-secondary mt-1">{booked} / {capacity} booked ({pct}%)</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-secondary text-sm mb-4">No ticket tiers configured yet.</p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="primary" size="sm" onClick={() => navigate(`/events/edit/${event.id}`)}>
                                            <Settings size={16} className="mr-1" /> Edit Tiers
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={loadEvent}>
                                            Refresh
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                        {/* My Tickets Section */}
                        {myBookings.length > 0 && (
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                                    <Ticket size={20} /> My Tickets
                                </h3>
                                <div className="space-y-3">
                                    {myBookings.map(b => {
                                        const isGroupOrCouple = b.attendees?.length > 1;
                                        const isExpanded = expandedBooking === b.uuid;
                                        return (
                                            <div key={b.uuid} className="bg-secondary/20 rounded-xl border border-theme/50 overflow-hidden">
                                                <div className="p-4 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {b.ticket_tier && (
                                                                <>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-600/10 text-primary-600 border border-primary-600/20 capitalize">{b.ticket_tier.category}</span>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">{b.ticket_tier.tier}</span>
                                                                </>
                                                            )}
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${b.booking_status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{b.booking_status}</span>
                                                        </div>
                                                        <p className="font-medium text-primary text-sm">{b.attendee_name || b.user_name}</p>
                                                        <p className="text-xs text-secondary">#{b.ticket_number}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="secondary" size="sm" onClick={() => setViewingTicketUuid(b.uuid)}>
                                                            <Eye size={14} className="mr-1" /> View
                                                        </Button>
                                                        <Button variant="secondary" size="sm" onClick={async () => {
                                                            const el = document.getElementById(`ticket-card-${b.uuid}`);
                                                            if (!el) return;
                                                            try {
                                                                         const dataUrl = await silentCapture(toPng, el, { backgroundColor: '#111827', pixelRatio: 2, filter: skipFontsFilter });
                                                                const link = document.createElement('a');
                                                                link.download = `ticket-${b.ticket_number}-${(b.attendee_name || 'holder').replace(/\s+/g, '_')}.png`;
                                                                link.href = dataUrl;
                                                                link.click();
                                                            } catch (err) {
                                                                console.error('Ticket download failed:', err);
                                                                toast.error('Download failed');
                                                            }
                                                        }}><Download size={14} className="mr-1" /> Download</Button>
                                                        <Button variant="secondary" size="sm" onClick={() => setSharingTicketId(sharingTicketId === b.uuid ? null : b.uuid)}>
                                                            <Share2 size={14} />
                                                        </Button>
                                                        {isGroupOrCouple && (
                                                            <button onClick={() => setExpandedBooking(isExpanded ? null : b.uuid)}
                                                                className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                                                                <ChevronRight size={16} className={`text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {isExpanded && isGroupOrCouple && (
                                                    <div className="border-t border-theme/50 px-4 py-3 space-y-2">
                                                        {(b.attendees || []).map((att, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-1">
                                                                <div>
                                                                    <p className="text-sm text-primary">{att.name || 'Attendee ' + (idx + 1)}</p>
                                                                    {att.email && <p className="text-xs text-secondary">{att.email}</p>}
                                                                </div>
                                                                <Button variant="secondary" size="sm" onClick={async () => {
                                                                    const el = document.getElementById(`ticket-card-${b.uuid}`);
                                                                    if (!el) return;
                                                                    try {
                                                                         const dataUrl = await silentCapture(toPng, el, { backgroundColor: '#111827', pixelRatio: 2, filter: skipFontsFilter });
                                                                        const link = document.createElement('a');
                                                                        link.download = `ticket-${b.ticket_number}-${(att.name || 'member' + (idx + 1)).replace(/\s+/g, '_')}.png`;
                                                                        link.href = dataUrl;
                                                                        link.click();
                                                                    } catch (err) {
                                                                        console.error('Attendee ticket download failed:', err);
                                                                        toast.error('Download failed');
                                                                    }
                                                                }}><Download size={12} className="mr-1" /> Ticket</Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {sharingTicketId === b.uuid && (
                                                    <div className="border-t border-theme/50 px-4 py-3 bg-secondary/20">
                                                        <div className="flex items-center gap-2">
                                                            <input type="email" placeholder="User email to share with..."
                                                                value={shareEmail} onChange={e => setShareEmail(e.target.value)}
                                                                className="flex-1 px-3 py-1.5 bg-secondary border border-theme rounded-lg text-primary text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                                                            <Button variant="primary" size="sm" disabled={!shareEmail.trim()}
                                                                onClick={async () => {
                                                                    try {
                                                                        await eventsService.shareTicket(b.uuid, shareEmail.trim());
                                                                        toast.success('Ticket shared!');
                                                                        setSharingTicketId(null);
                                                                        setShareEmail('');
                                                                    } catch (err) {
                                                                        toast.error(err.response?.data?.error || 'Share failed');
                                                                    }
                                                                }}>Share</Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {myBookings.length > 1 && (
                                        <Button variant="secondary" size="sm" onClick={async () => {
                                            const zip = new JSZip();
                                            for (const b of myBookings) {
                                                const names = b.attendees?.length > 1
                                                    ? b.attendees.map(a => a.name || 'member')
                                                    : [b.attendee_name || 'holder'];
                                                for (const name of names) {
                                                    const el = document.getElementById(`ticket-card-${b.uuid}`);
                                                    if (!el) continue;
                                                    try {
                                                          const blob = await silentCapture(toBlob, el, { backgroundColor: '#111827', pixelRatio: 2, filter: skipFontsFilter });
                                                        if (blob) zip.file(`ticket-${b.ticket_number}-${name.replace(/\s+/g, '_')}.png`, blob);
                                                    } catch (e) { /* skip */ }
                                                }
                                            }
                                            const content = await zip.generateAsync({ type: 'blob' });
                                            const link = document.createElement('a');
                                            link.download = `tickets-${event.name?.replace(/\s+/g, '_')}.zip`;
                                            link.href = URL.createObjectURL(content);
                                            link.click();
                                            URL.revokeObjectURL(link.href);
                                            toast.success('Tickets downloaded as ZIP');
                                        }}>
                                            <Download size={14} className="mr-1" /> Download All ({myBookings.length} tickets)
                                        </Button>
                                    )}
                                </div>
                            </CardBody></Card>
                        )}

                        {/* Book a Slot */}
                        <Card><CardBody>
                            <h3 className="font-semibold text-lg mb-6 text-primary flex items-center gap-2">
                                <Ticket size={20} /> Book a Slot
                            </h3>

                            {bookingStep === 'done' && myBookings.length > 0 ? (
                                <div className="py-4 space-y-6">
                                    {myBookings.filter(b => b.booking_status !== 'cancelled').map(b => (
                                        <div key={b.uuid} className="max-w-md mx-auto bg-elevated rounded-2xl overflow-hidden shadow-lg border border-theme">
                                            <div className="bg-gradient-to-r from-primary-600 to-amber-500 px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white/70 text-xs font-medium tracking-widest uppercase">Event Ticket</p>
                                                        <h4 className="text-white text-lg font-bold mt-1">{event.name || event.title}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white/70 text-xs">Ticket #</p>
                                                        <p className="text-white font-mono font-bold text-sm">{b.ticket_number}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-6 py-5">
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Date</p>
                                                        <p className="text-primary font-medium mt-0.5">{formatDate(event.event_date || event.start_date)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Time</p>
                                                        <p className="text-primary font-medium mt-0.5">{event.start_time ? formatTime(event.start_time) : 'TBA'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Location</p>
                                                        <p className="text-primary font-medium mt-0.5 truncate">{event.location || event.venue || 'Online'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Status</p>
                                                        <p className="text-green-500 font-semibold mt-0.5 capitalize">{b.booking_status}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm mb-5">
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Attendee</p>
                                                        <p className="text-primary font-medium mt-0.5">{b.attendee_name || b.user_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">Qty</p>
                                                        <p className="text-primary font-medium mt-0.5">{b.quantity || 1}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-tertiary text-xs uppercase tracking-wider">{b.amount_paid > 0 ? 'Amount Paid' : 'Price'}</p>
                                                        <p className="text-primary font-medium mt-0.5">{b.amount_paid > 0 ? `$${b.amount_paid}` : 'Free'}</p>
                                                    </div>
                                                </div>
                                                {b.attendee_email && (
                                                    <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                                                        <div>
                                                            <p className="text-tertiary text-xs uppercase tracking-wider">Email</p>
                                                            <p className="text-primary font-medium mt-0.5">{b.attendee_email}</p>
                                                        </div>
                                                        {b.attendee_phone && (
                                                            <div>
                                                                <p className="text-tertiary text-xs uppercase tracking-wider">Phone</p>
                                                                <p className="text-primary font-medium mt-0.5">{b.attendee_phone}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="border-t-2 border-dashed border-theme my-4 relative">
                                                    <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                                                    <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-white p-3 rounded-xl">
                                                        <QRCodeSVG
                                                            value={typeof b.qr_code_data === 'string' ? b.qr_code_data : JSON.stringify(b.qr_code_data || { ticket: b.ticket_number, event_uuid: event.uuid })}
                                                            size={160} level="H" includeMargin={false}
                                                        />
                                                    </div>
                                                    <p className="text-tertiary text-xs mt-3">Scan to verify ticket</p>
                                                </div>
                                            </div>
                                            <div className="px-6 py-3 bg-secondary border-t border-theme flex items-center justify-between">
                                                <span className="text-tertiary text-xs">Qomrade Events</span>
                                                <span className="text-tertiary text-xs">© {new Date().getFullYear()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="secondary" onClick={() => { setBookingStep('check'); loadMyBookings(); }}>Book Another</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
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
                                            <p className="text-2xl font-bold text-primary-500 mt-1">{event.ticket_tiers?.length || event.tickets?.length || 'Auto'}</p>
                                        </div>
                                    </div>

                                    {/* Tier Picker */}
                                    {event.ticket_tiers?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-primary mb-3">Select Ticket Type</h4>
                                            {['individual', 'couple', 'group'].map(cat => {
                                                const catTiers = event.ticket_tiers.filter(t => t.category === cat && t.is_active !== false);
                                                if (!catTiers.length) return null;
                                                return (
                                                    <div key={cat} className="mb-4">
                                                        <p className="text-xs text-secondary uppercase tracking-wider mb-2 font-medium">{cat} Tickets</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {catTiers.map(tier => (
                                                                <button key={tier.id} onClick={() => setSelectedTier(tier)}
                                                                    className={`p-4 rounded-xl border text-left transition-all ${selectedTier?.id === tier.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-theme hover:border-primary/40'}`}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 capitalize font-medium">{tier.tier}</span>
                                                                        {tier.group_size > 1 && <span className="text-[10px] text-secondary">Admits {tier.group_size}</span>}
                                                                    </div>
                                                                    <p className="font-medium text-primary">{tier.name}</p>
                                                                    <p className="text-lg font-bold text-primary mt-1">{Number(tier.price) === 0 ? 'Free' : `$${tier.price}`}</p>
                                                                    {tier.description && <p className="text-xs text-secondary mt-1">{tier.description}</p>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex justify-center">
                                        <Button variant="primary" size="lg"
                                            disabled={bookingLoading || (event.ticket_tiers?.length > 0 && !selectedTier)}
                                            onClick={() => {
                                                const totalSlots = selectedTier ? (bookingQuantity * selectedTier.group_size) : 1;
                                                setAttendeeRows(Array.from({ length: totalSlots }, () => ({ name: '', email: '', phone: '' })));
                                                setGroupName('');
                                                setBookingQuantity(1);
                                                setBookingStep('info');
                                            }}
                                            className="px-12"
                                        >
                                            <><Ticket size={18} className="mr-2" /> Book My Slot</>
                                        </Button>
                                    </div>

                                    {bookingStep === 'info' && (() => {
                                        const activeTier = selectedTier || { category: 'individual', group_size: 1, price: 0, name: 'Free Entry', tier: 'regular', id: null };
                                        return (
                                        <div className="mt-6 p-6 bg-secondary/20 rounded-xl border border-theme/50">
                                            <h4 className="font-semibold text-primary mb-4">
                                                {activeTier.category === 'group' ? 'Group Information' : 'Attendee Information'}
                                            </h4>
                                            <div className="space-y-4">
                                                {activeTier.category === 'group' && (
                                                    <div>
                                                        <label className="block text-sm text-secondary mb-1">Group Name *</label>
                                                        <input type="text" value={groupName}
                                                            onChange={e => setGroupName(e.target.value)}
                                                            className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                                            placeholder="Team Alpha" />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm text-secondary mb-1">Number of Tickets</label>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => {
                                                            const q = Math.max(1, bookingQuantity - 1);
                                                            setBookingQuantity(q);
                                                            setAttendeeRows(Array.from({ length: q * activeTier.group_size }, () => ({ name: '', email: '', phone: '' })));
                                                        }}
                                                            className="w-10 h-10 rounded-lg bg-secondary border border-theme flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                                            disabled={bookingQuantity <= 1}>
                                                            −
                                                        </button>
                                                        <span className="text-xl font-bold text-primary w-8 text-center">{bookingQuantity}</span>
                                                        <button type="button" onClick={() => {
                                                            const max = Number(activeTier.price) > 0 ? 5 : 1;
                                                            const q = Math.min(max, bookingQuantity + 1);
                                                            setBookingQuantity(q);
                                                            setAttendeeRows(Array.from({ length: q * activeTier.group_size }, () => ({ name: '', email: '', phone: '' })));
                                                        }}
                                                            className="w-10 h-10 rounded-lg bg-secondary border border-theme flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                                            disabled={(() => { const max = Number(activeTier.price) > 0 ? 5 : 1; return bookingQuantity >= max; })()}>
                                                            +
                                                        </button>
                                                        <span className="text-xs text-secondary ml-2">
                                                            {activeTier.group_size > 1
                                                                ? `Admits ${bookingQuantity * activeTier.group_size} people`
                                                                : `Max ${Number(activeTier.price) > 0 ? 5 : 1}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-secondary border-t border-theme/50 pt-3">
                                                    {activeTier.category === 'group' ? 'Group Members' : 'Attendee Details'}
                                                    <span className="text-xs ml-1">({attendeeRows.length} {attendeeRows.length === 1 ? 'person' : 'people'})</span>
                                                </p>

                                                {attendeeRows.map((row, idx) => (
                                                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-theme/30">
                                                        <p className="text-xs text-secondary mb-2 font-medium">Person {idx + 1}</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                            <input type="text" placeholder="Full Name *" value={row.name}
                                                                onChange={e => {
                                                                    const rows = [...attendeeRows];
                                                                    rows[idx] = { ...rows[idx], name: e.target.value };
                                                                    setAttendeeRows(rows);
                                                                }}
                                                                className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                            <input type="email" placeholder="Email *" value={row.email}
                                                                onChange={e => {
                                                                    const rows = [...attendeeRows];
                                                                    rows[idx] = { ...rows[idx], email: e.target.value };
                                                                    setAttendeeRows(rows);
                                                                }}
                                                                className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                            <input type="tel" placeholder="Phone" value={row.phone}
                                                                onChange={e => {
                                                                    const rows = [...attendeeRows];
                                                                    rows[idx] = { ...rows[idx], phone: e.target.value };
                                                                    setAttendeeRows(rows);
                                                                }}
                                                                className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                        </div>
                                                    </div>
                                                ))}

                                                {Number(activeTier.price) > 0 && (
                                                    <p className="text-sm text-secondary text-right">
                                                        Total: <strong className="text-primary">${(Number(activeTier.price) * bookingQuantity).toFixed(2)}</strong>
                                                        {activeTier.group_size > 1 && <span className="text-xs ml-1">(${Number(activeTier.price).toFixed(2)} per {activeTier.category})</span>}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <Button variant="primary" size="lg" className="flex-1"
                                                    disabled={attendeeRows.some(r => !r.name.trim() || !r.email.trim()) || (activeTier.category === 'group' && !groupName.trim())}
                                                    onClick={async () => {
                                                        setBookingLoading(true);
                                                        try {
                                                            const res = await eventsService.bookSlot(
                                                                event.uuid,
                                                                selectedTier?.id ?? null,
                                                                attendeeRows,
                                                                groupName,
                                                                bookingQuantity
                                                            );
                                                            const purchases = res?.data?.purchases || [];
                                                            const merged = [...myBookings, ...purchases];
                                                            setMyBookings(merged);
                                                            setEvent(prev => ({
                                                                ...prev,
                                                                slots_remaining: Math.max(0, (prev.slots_remaining ?? (prev.capacity - (prev.attendees?.length || 0))) - attendeeRows.length)
                                                            }));
                                                            const requiresPayment = res?.data?.requires_payment;
                                                            setBookingStep(requiresPayment ? 'confirm' : 'done');
                                                            loadEvent();
                                                        } catch (err) {
                                                            toast.error(err.response?.data?.error || 'Booking failed');
                                                        } finally { setBookingLoading(false); }
                                                    }}
                                                >
                                                    {bookingLoading ? (
                                                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></span> Processing...</>
                                                    ) : (
                                                        <>{Number(activeTier.price) > 0 ? 'Continue to Payment' : 'Book Now'}</>
                                                    )}
                                                </Button>
                                                <Button variant="secondary" onClick={() => setBookingStep('check')}>Back</Button>
                                            </div>
                                        </div>
                                        );
                                    })()}

                                    {bookingStep === 'confirm' && myBookings.length > 0 && (
                                        <Card>
                                            <CardBody className="text-center">
                                                <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
                                                <h4 className="text-lg font-bold text-primary mb-2">Payment Required</h4>
                                                <p className="text-secondary mb-4">
                                                    Total: <strong className="text-primary">${myBookings.filter(b => b.booking_status === 'pending').reduce((s, b) => s + Number(b.amount_paid), 0).toFixed(2)}</strong>
                                                </p>
                                                <div className="flex gap-3 justify-center">
                                                    <Button variant="primary" onClick={async () => {
                                                        try {
                                                            await Promise.all(myBookings.filter(b => b.booking_status === 'pending').map(b => eventsService.confirmPayment(b.uuid)));
                                                            setMyBookings(prev => prev.map(b => b.booking_status === 'pending' ? { ...b, booking_status: 'confirmed' } : b));
                                                            setBookingStep('done');
                                                        } catch (err) {
                                                            toast.error('Payment confirmation failed');
                                                        }
                                                    }}><Check size={16} className="mr-1" /> Confirm Payment</Button>
                                                    <Button variant="secondary" onClick={async () => {
                                                        try {
                                                            await Promise.all(myBookings.map(b => eventsService.cancelBooking(b.uuid)));
                                                            setMyBookings([]);
                                                            setBookingStep('check');
                                                        } catch (err) {
                                                            toast.error('Cancel failed');
                                                        }
                                                    }}>Cancel</Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </CardBody></Card>
                    </div>
                )}

                {activeTab === 'attendees' && (
                    <div className="space-y-6">
                        {isOrganizer && (
                            <EventCheckIn event={event} onUpdate={loadEvent} />
                        )}
                        <Card><CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary">Attendees ({event.attendees?.length || 0})</h3>
                            {event.attendees_viewable ? (
                                event.attendees?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {event.attendees.map((attendee, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                    {attendee.avatar ? (
                                                        <img src={attendee.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-sm font-medium text-primary block truncate">
                                                        {attendee.first_name && attendee.last_name
                                                            ? `${attendee.first_name} ${attendee.last_name}`
                                                            : attendee.email || attendee.username || `Attendee ${idx + 1}`}
                                                    </span>
                                                    {attendee.email && (
                                                        <span className="text-xs text-secondary block truncate">{attendee.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-secondary text-center py-8">No attendees yet. Be the first to RSVP!</p>
                            ) : <p className="text-secondary text-center py-8">Attendee list is private</p>}
                        </CardBody></Card>
                    </div>
                )}

                {activeTab === 'room' && (
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg mb-4 text-primary flex items-center gap-2">
                            <MessageSquare size={20} /> Event Discussion Room
                        </h3>
                        {event.room ? (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="flex items-center gap-2 text-sm text-secondary">
                                    <Users size={16} />
                                    <span>{event.room.participant_count || 0} participant{(event.room.participant_count || 0) !== 1 ? 's' : ''} joined</span>
                                </div>
                                <Button onClick={() => navigate(`/rooms/${event.room.room}`)}>
                                    Enter Discussion Room <ChevronRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        ) : <p className="text-secondary text-center py-8">No associated discussion rooms.</p>}
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
                                        toast.success("Review submitted");
                                    } catch (err) {
                                        toast.error(err.response?.data?.error || "Failed");
                                    }
                                }}>Submit Review</Button>
                            </div>
                        )}
                        <div className="space-y-4">
                            {reviews.length > 0 ? reviews.map((review, idx) => (
                                <ReviewItem key={review.id || idx} review={review} isOrganizer={isOrganizer} eventId={event.id} onUpdate={loadEvent} />
                            )) : <p className="text-secondary text-center py-6">No reviews yet.</p>}
                                </div>
                            </CardBody></Card>
                )}

                {activeTab === 'surveys' && (
                    <EventSurvey event={event} isOrganizer={isOrganizer} />
                )}

                {activeTab === 'logistics' && isOrganizer && (
                    <LogisticsSection event={event} onUpdate={loadEvent} />
                )}

                {activeTab === 'analytics' && isOrganizer && (
                    <EventAnalyticsDashboard event={event} />
                )}

                {activeTab === 'sponsorship' && (
                    <div className="space-y-6">
                        {sponsorshipLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader size={24} className="animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {!event?.seeking_sponsors && !isOrganizer && (
                                    <Card><CardBody>
                                        <div className="flex items-center gap-3 text-secondary">
                                            <AlertCircle size={20} />
                                            <p>This event is not currently seeking sponsors.</p>
                                        </div>
                                    </CardBody></Card>
                                )}

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
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">
                                                        Approved
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardBody></Card>
                                )}

                                {/* Application status for non-organizers */}
                                {userApplication && !isOrganizer && (
                                    <Card><CardBody>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {userApplication.status === 'approved' ? (
                                                    <CheckCircle size={24} className="text-green-500" />
                                                ) : userApplication.status === 'rejected' ? (
                                                    <XCircle size={24} className="text-red-500" />
                                                ) : (
                                                    <Clock size={24} className="text-amber-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-primary">Your Application</p>
                                                    <p className="text-sm text-secondary">
                                                        {userApplication.status === 'approved'
                                                            ? 'Congratulations! Your sponsorship application has been approved.'
                                                            : userApplication.status === 'rejected'
                                                            ? 'Your sponsorship application was not approved at this time.'
                                                            : 'Your application is under review.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                userApplication.status === 'approved'
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                    : userApplication.status === 'rejected'
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {userApplication.status === 'approved' ? 'Approved'
                                                    : userApplication.status === 'rejected' ? 'Rejected'
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                    </CardBody></Card>
                                )}

                                {/* Sponsor message banner */}
                                {sponsorMessage && (
                                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                                        sponsorMessage.type === 'success'
                                            ? 'bg-green-500/10 border border-green-500/20'
                                            : 'bg-red-500/10 border border-red-500/20'
                                    }`}>
                                        {sponsorMessage.type === 'success' ? (
                                            <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${
                                                sponsorMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                                            }`}>{sponsorMessage.text}</p>
                                        </div>
                                        <button onClick={() => setSponsorMessage(null)} className="text-secondary hover:text-primary">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {/* Apply for Sponsorship */}
                                {!userApplication && event?.seeking_sponsors !== false && (
                                    <Card><CardBody>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-lg text-primary">Apply for Sponsorship</h3>
                                            <Button variant="primary" size="sm" onClick={() => setShowSponsorForm(!showSponsorForm)}>
                                                <Plus size={16} className="mr-1" /> Apply
                                            </Button>
                                        </div>

                                        {showSponsorForm && (
                                            <div className="mb-6 p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                                                {userOrganizations.length > 0 && (
                                                    <select value={sponsorForm.organisation}
                                                        onChange={e => setSponsorForm({ ...sponsorForm, organisation: e.target.value })}
                                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                                    >
                                                        <option value="">Select your organization (optional)</option>
                                                        {userOrganizations.map(org => (
                                                            <option key={org.id} value={org.id}>{org.name}</option>
                                                        ))}
                                                    </select>
                                                )}
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
                                                            setSponsorMessage(null);
                                                            await eventsService.applySponsorshipApplication({
                                                                event: event.id,
                                                                applicant_name: sponsorForm.applicant_name,
                                                                applicant_contact: sponsorForm.applicant_contact,
                                                                application_details: sponsorForm.application_details,
                                                                organisation: sponsorForm.organisation || null,
                                                            });
                                                            setUserApplication({ event: event.id, status: 'pending' });
                                                            setSponsorForm({ applicant_name: '', applicant_contact: '', application_details: '', organisation: '' });
                                                            setShowSponsorForm(false);
                                                            setSponsorMessage({ type: 'success', text: 'Application submitted! The organizer will review it.' });
                                                            eventsService.getSponsorshipDashboard(event.id).then(r => {
                                                                const data = r?.data || r;
                                                                if (data) setSponsorshipData(data);
                                                            }).catch(() => {});
                                                        } catch (err) {
                                                            const data = err.response?.data;
                                                            if (data && typeof data === 'object') {
                                                                const msgs = Object.entries(data)
                                                                    .filter(([, v]) => Array.isArray(v))
                                                                    .map(([k, v]) => `${k}: ${v.join(', ')}`)
                                                                    .join('; ');
                                                                setSponsorMessage({ type: 'error', text: msgs || data.detail || 'Failed to submit application' });
                                                            } else {
                                                                setSponsorMessage({ type: 'error', text: 'Failed to submit application' });
                                                            }
                                                        }
                                                    }}>Submit</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => setShowSponsorForm(false)}>Cancel</Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardBody></Card>
                                )}

                                {/* Stats & Management for organizer */}
                                {isOrganizer && sponsorshipData && (
                                    <Card><CardBody>
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
                                        <div className="flex gap-2">
                                            <Button variant="primary" onClick={() => navigate(`/events/${event.id}/sponsorship`)}>
                                                <Settings size={16} className="mr-1" /> Manage Sponsors
                                            </Button>
                                            <Button variant="outline" onClick={() => { setShowRequestModal(true); loadSponsorRequests(); }}>
                                                <Send size={16} className="mr-1" /> Request Sponsors
                                            </Button>
                                        </div>
                                    </CardBody></Card>
                                )}

                                {/* Request Sponsors Modal */}
                                {showRequestModal && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                        <div className="bg-background rounded-xl border border-theme shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
                                            <div className="flex items-center justify-between p-4 border-b border-theme">
                                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                                    <Send size={18} /> Request Sponsors
                                                </h3>
                                                <button onClick={() => setShowRequestModal(false)} className="text-secondary hover:text-primary">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-primary mb-2">Search Organizations</label>
                                                    <input type="text" value={orgSearchQuery}
                                                        onChange={e => handleOrgSearch(e.target.value)}
                                                        placeholder="Type at least 2 characters to search..."
                                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                                    {orgSearchResults.length > 0 && (
                                                        <div className="mt-2 max-h-40 overflow-y-auto border border-theme rounded-lg divide-y divide-theme">
                                                            {orgSearchResults.map(org => {
                                                                const isSelected = selectedOrgs.some(o => o.id === org.id);
                                                                return (
                                                                    <button key={org.id} onClick={() => toggleOrg(org)}
                                                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-secondary/20'}`}>
                                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-theme'}`}>
                                                                            {isSelected && <Check size={12} />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium">{org.name}</p>
                                                                            {org.city && <p className="text-xs text-tertiary">{org.city}</p>}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedOrgs.length > 0 && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-primary mb-2">Selected ({selectedOrgs.length})</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedOrgs.map(org => (
                                                                <span key={org.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                                    {org.name}
                                                                    <button onClick={() => toggleOrg(org)} className="hover:text-red-500"><X size={12} /></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-medium text-primary mb-2">Message</label>
                                                    <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)}
                                                        placeholder="Enter a message to accompany your sponsorship request..."
                                                        className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                                        rows={4} />
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button variant="primary" disabled={selectedOrgs.length === 0 || sendingRequest} onClick={handleSendRequests}>
                                                        {sendingRequest ? <Loader size={16} className="animate-spin" /> : <Send size={16} className="mr-1" />}
                                                        Send Requests
                                                    </Button>
                                                    <Button variant="secondary" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                                                </div>

                                                {sponsorRequests.length > 0 && (
                                                    <div className="pt-4 border-t border-theme">
                                                        <h4 className="text-sm font-medium text-primary mb-2">Previously Sent ({sponsorRequests.length})</h4>
                                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                                            {sponsorRequests.map(req => (
                                                                <div key={req.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg border border-theme/30">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-primary truncate">{req.organization_name || req.recipient_email || 'Unknown'}</p>
                                                                        <p className="text-xs text-tertiary truncate">{req.message}</p>
                                                                    </div>
                                                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                                                                        req.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                                                                        req.status === 'declined' ? 'bg-red-500/10 text-red-500' :
                                                                        'bg-amber-500/10 text-amber-500'
                                                                    }`}>{req.status}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
        {/* Hidden ticket cards for download capture */}
        <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, opacity: 0.01, pointerEvents: 'none' }}>
            {myBookings.map(b => (
                <div key={`capture-${b.uuid}`} id={`ticket-card-${b.uuid}`} className="max-w-md bg-elevated rounded-2xl overflow-hidden shadow-lg border border-theme">
                    <div className="bg-gradient-to-r from-primary-600 to-amber-500 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-xs font-medium tracking-widest uppercase">Event Ticket</p>
                                <h4 className="text-white text-lg font-bold mt-1">{event.name || event.title}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-white/70 text-xs">Ticket #</p>
                                <p className="text-white font-mono font-bold text-sm">{b.ticket_number}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Date</p><p className="text-primary font-medium mt-0.5">{formatDate(event.event_date || event.start_date)}</p></div>
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Time</p><p className="text-primary font-medium mt-0.5">{event.start_time ? formatTime(event.start_time) : 'TBA'}</p></div>
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Location</p><p className="text-primary font-medium mt-0.5 truncate">{event.location || event.venue || 'Online'}</p></div>
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Status</p><p className="text-green-500 font-semibold mt-0.5 capitalize">{b.booking_status}</p></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-5">
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Attendee</p><p className="text-primary font-medium mt-0.5">{b.attendee_name || b.user_name}</p></div>
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">Qty</p><p className="text-primary font-medium mt-0.5">{b.quantity || 1}</p></div>
                            <div><p className="text-tertiary text-xs uppercase tracking-wider">{b.amount_paid > 0 ? 'Amount Paid' : 'Price'}</p><p className="text-primary font-medium mt-0.5">{b.amount_paid > 0 ? `$${b.amount_paid}` : 'Free'}</p></div>
                        </div>
                        <div className="border-t-2 border-dashed border-theme my-4 relative">
                            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-3 rounded-xl">
                                <QRCodeSVG value={typeof b.qr_code_data === 'string' ? b.qr_code_data : JSON.stringify(b.qr_code_data || { ticket: b.ticket_number, event_uuid: event.uuid })} size={160} level="H" includeMargin={false} />
                            </div>
                            <p className="text-tertiary text-xs mt-3">Scan to verify ticket</p>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-secondary border-t border-theme flex items-center justify-between">
                        <span className="text-tertiary text-xs">Qomrade Events</span>
                        <span className="text-tertiary text-xs">© {new Date().getFullYear()}</span>
                    </div>
                </div>
            ))}
        </div>
        {/* Ticket Preview Modal */}
        {viewingTicketUuid && (() => {
            const booking = myBookings.find(b => b.uuid === viewingTicketUuid);
            if (!booking) return null;
            return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingTicketUuid(null)}>
                    <div className="bg-elevated rounded-2xl overflow-hidden shadow-2xl border border-theme max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-3 bg-secondary border-b border-theme">
                            <h3 className="font-semibold text-primary">Ticket Preview</h3>
                            <button onClick={() => setViewingTicketUuid(null)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                                <X size={20} className="text-secondary" />
                            </button>
                        </div>
                        <div id={`ticket-card-${booking.uuid}`} className="bg-elevated">
                            <div className="bg-gradient-to-r from-primary-600 to-amber-500 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/70 text-xs font-medium tracking-widest uppercase">Event Ticket</p>
                                        <h4 className="text-white text-lg font-bold mt-1">{event.name || event.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/70 text-xs">Ticket #</p>
                                        <p className="text-white font-mono font-bold text-sm">{booking.ticket_number}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Date</p>
                                        <p className="text-primary font-medium mt-0.5">{formatDate(event.event_date || event.start_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Time</p>
                                        <p className="text-primary font-medium mt-0.5">{event.start_time ? formatTime(event.start_time) : 'TBA'}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Location</p>
                                        <p className="text-primary font-medium mt-0.5 truncate">{event.location || event.venue || 'Online'}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Status</p>
                                        <p className="text-green-500 font-semibold mt-0.5 capitalize">{booking.booking_status}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-5">
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Attendee</p>
                                        <p className="text-primary font-medium mt-0.5">{booking.attendee_name || booking.user_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">Qty</p>
                                        <p className="text-primary font-medium mt-0.5">{booking.quantity || 1}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary text-xs uppercase tracking-wider">{booking.amount_paid > 0 ? 'Amount Paid' : 'Price'}</p>
                                        <p className="text-primary font-medium mt-0.5">{booking.amount_paid > 0 ? `$${booking.amount_paid}` : 'Free'}</p>
                                    </div>
                                </div>
                                <div className="border-t-2 border-dashed border-theme my-4 relative">
                                    <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                                    <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-elevated"></div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-3 rounded-xl">
                                        <QRCodeSVG
                                            value={typeof booking.qr_code_data === 'string' ? booking.qr_code_data : JSON.stringify(booking.qr_code_data || { ticket: booking.ticket_number, event_uuid: event.uuid })}
                                            size={200} level="H" includeMargin={false}
                                        />
                                    </div>
                                    <p className="text-tertiary text-xs mt-3">Scan to verify ticket</p>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-secondary border-t border-theme flex items-center justify-between">
                                <span className="text-tertiary text-xs">Qomrade Events</span>
                                <Button variant="primary" size="sm" onClick={async () => {
                                    const el = document.getElementById(`ticket-card-${booking.uuid}`);
                                    if (!el) return;
                                    try {
                                        const dataUrl = await silentCapture(toPng, el, { backgroundColor: '#111827', pixelRatio: 2, filter: skipFontsFilter });
                                        const link = document.createElement('a');
                                        link.download = `ticket-${booking.ticket_number}-${(booking.attendee_name || 'holder').replace(/\s+/g, '_')}.png`;
                                        link.href = dataUrl;
                                        link.click();
                                    } catch (err) {
                                        console.error('Modal download failed:', err);
                                        toast.error('Download failed');
                                    }
                                }}>
                                    <Download size={14} className="mr-1" /> Download
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })()}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="w-full max-w-md mx-4">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-full"><Trash2 size={24} className="text-red-400" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">Delete Event</h3>
                                <p className="text-sm text-secondary">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-secondary mb-6">
                            Are you sure you want to delete <strong className="text-primary">{event.name}</strong>? 
                            All associated data including tickets, bookings, and analytics will be permanently removed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleDeleteEvent} disabled={actionLoading} className="bg-red-500 hover:bg-red-600">
                                {actionLoading ? <Loader size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
                                Delete Event
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        )}

        {/* Convert to Announcement Modal */}
        {showConvertModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="w-full max-w-md mx-4">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/20 rounded-full"><ExternalLink size={24} className="text-primary" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">Convert to Announcement</h3>
                                <p className="text-sm text-secondary">Create an announcement from this event</p>
                            </div>
                        </div>
                        <p className="text-sm text-secondary mb-4">
                            An announcement will be created with the event name and description. 
                            {!retainEvent && ' The event will be archived.'}
                        </p>
                        <label className="flex items-center gap-3 mb-6 p-3 bg-elevated rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                checked={retainEvent}
                                onChange={e => setRetainEvent(e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            <div>
                                <p className="text-sm font-medium text-primary">Keep event active</p>
                                <p className="text-xs text-secondary">Uncheck to archive the event after conversion</p>
                            </div>
                        </label>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setShowConvertModal(false)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConvertToAnnouncement} disabled={actionLoading}>
                                {actionLoading ? <Loader size={16} className="animate-spin mr-2" /> : <ExternalLink size={16} className="mr-2" />}
                                Convert
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        )}

        {/* Help Request Modal */}
        {showHelpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="w-full max-w-md mx-4">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-full"><LifeBuoy size={24} className="text-amber-400" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">Request Help</h3>
                                <p className="text-sm text-secondary">Send a help request to event organizers</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={helpSubject}
                                    onChange={e => setHelpSubject(e.target.value)}
                                    placeholder="What do you need help with?"
                                    className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Message</label>
                                <textarea
                                    value={helpMessage}
                                    onChange={e => setHelpMessage(e.target.value)}
                                    placeholder="Describe your issue..."
                                    rows={4}
                                    className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-primary resize-y"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Priority</label>
                                <select
                                    value={helpPriority}
                                    onChange={e => setHelpPriority(e.target.value)}
                                    className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <Button variant="secondary" onClick={() => setShowHelpModal(false)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleRequestHelp} disabled={actionLoading || !helpSubject.trim() || !helpMessage.trim()}>
                                {actionLoading ? <Loader size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                Send Request
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        )}
        </>
    );
};

const ReviewItem = ({ review, isOrganizer, eventId, onUpdate }) => {
    const toast = useToast();
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleRespond = async () => {
        if (!replyText.trim()) return;
        try {
            await eventsService.respondToReview(eventId, review.id, replyText.trim());
            toast.success('Response posted');
            setReplyText('');
            setShowReply(false);
            onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to respond');
        }
    };

    return (
        <div className="p-4 bg-secondary rounded-lg border border-theme/30">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary-600">
                        {(review.user_name || 'U')[0]}
                    </div>
                    <div>
                        <p className="font-medium text-primary text-sm">{review.user_name || 'Anonymous'}</p>
                        <div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={review.rating >= s ? 'text-yellow-500 fill-current' : 'text-tertiary'} />)}</div>
                    </div>
                </div>
                <span className="text-xs text-tertiary">{formatDate(review.submitted_on || new Date().toISOString())}</span>
            </div>
            <p className="text-secondary text-sm">{review.feedback}</p>

            {review.response && (
                <div className="mt-3 ml-6 pl-3 border-l-2 border-primary/30">
                    <p className="text-xs font-medium text-primary">Organizer Response</p>
                    <p className="text-sm text-secondary mt-1">{review.response.response_message}</p>
                    <p className="text-xs text-tertiary mt-1">{formatDate(review.response.response_date)}</p>
                </div>
            )}

            {isOrganizer && (
                <div className="mt-3">
                    {showReply ? (
                        <div className="space-y-2">
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                placeholder="Write your response..."
                                className="w-full bg-primary/5 border border-theme rounded-lg p-2 text-sm text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 outline-none"
                                rows={2} />
                            <div className="flex gap-2">
                                <Button variant="primary" size="sm" disabled={!replyText.trim()} onClick={handleRespond}>
                                    <Send size={14} className="mr-1" /> Post Response
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => { setShowReply(false); setReplyText(''); }}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowReply(true)} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                            <MessageSquare size={12} /> {review.response ? 'Edit Response' : 'Respond'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetail;
