/**
 * Enhanced Events page — compact cards with cover images, booking fee, smart filters
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import {
    Calendar, MapPin, Users, Clock, Ticket, Bell,
    X, ChevronRight, Plus, Search, BarChart3, UserPlus, Play
} from 'lucide-react';
import eventsService from '../services/events.service';

// ─── helpers ───────────────────────────────────────────────────

const shortDate = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
};

const displayTime = (val) => {
    if (!val) return '';
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return val.slice(0, 5);
    try {
        const d = new Date(val);
        if (isNaN(d)) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

const getTemporalStatus = (event) => {
    if (!event.event_date) return 'upcoming';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let eventDate = new Date(event.event_date);
    if (isNaN(eventDate)) return 'upcoming';
    eventDate.setHours(0, 0, 0, 0);

    let startDT = new Date(event.event_date);
    let endDT = new Date(event.event_date);
    if (event.start_time && /^\d{2}:\d{2}/.test(event.start_time)) {
        const [h, m] = event.start_time.split(':');
        startDT.setHours(parseInt(h, 10), parseInt(m, 10), 0);
    } else { startDT.setHours(0, 0, 0); }
    if (event.end_time && /^\d{2}:\d{2}/.test(event.end_time)) {
        const [h, m] = event.end_time.split(':');
        endDT.setHours(parseInt(h, 10), parseInt(m, 10), 0);
    } else { endDT.setHours(23, 59, 59); }

    const now = new Date();
    if (endDT < now) return 'past';
    if (startDT <= now && endDT >= now) return 'happening_now';
    return 'upcoming';
};

// Resolve the best available media for an event
const getEventMedia = (event) => {
    const img = event.cover_image || event.image_url || event.image || event.banner;
    if (!img) return null;
    // Detect video by extension
    const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(img);
    return { src: img, isVideo };
};

// ─── filters ───────────────────────────────────────────────────

const FILTERS = [
    { value: 'all',            label: 'All' },
    { value: 'upcoming',       label: 'Upcoming' },
    { value: 'happening_now',  label: 'Happening Now' },
    { value: 'past',           label: 'Past' },
    { value: 'interested',     label: 'Interested' },
];

// ─── page component ────────────────────────────────────────────

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => { loadEvents(); }, [filter]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter === 'interested') {
                params.interested = 'true';
            } else if (filter !== 'all' && filter !== 'happening_now' && filter !== 'past') {
                params.status = filter;
            }
            const response = await eventsService.getAllEvents(params);
            let data = [];
            if (response?.data?.results) data = response.data.results;
            else if (Array.isArray(response?.data)) data = response.data;
            else if (response?.results) data = response.results;
            else if (Array.isArray(response)) data = response;
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events
        .filter(e =>
            e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(e => {
            if (filter === 'past') return getTemporalStatus(e) === 'past';
            if (filter === 'happening_now') return getTemporalStatus(e) === 'happening_now';
            return true;
        })
        .sort((a, b) => {
            const order = { upcoming: 0, happening_now: 1, past: 2 };
            const diff = (order[getTemporalStatus(a)] ?? 1) - (order[getTemporalStatus(b)] ?? 1);
            if (diff !== 0) return diff;
            return new Date(a.event_date || 0) - new Date(b.event_date || 0);
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Events</h1>
                    <p className="text-secondary mt-1">Discover and join upcoming events</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => navigate('/funding/create-business?category=event_organizer')}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register as Organiser
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/events/analytics')}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/events/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search events by name, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary text-secondary hover:bg-tertiary/20 hover:text-primary'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Calendar className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No events found{filter !== 'all' ? ' for this filter' : ''}. Create your first event!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onOpenDetails={() => navigate(`/events/${event.id}`)}
                            onUpdate={loadEvents}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── compact event card with cover image ───────────────────────

const EventCard = ({ event, onOpenDetails, onUpdate }) => {
    const navigate = useNavigate();
    const temporal = getTemporalStatus(event);
    const isPast = temporal === 'past';
    const isFree = !event.price || event.price <= 0;
    const organizerName = event.created_by_name || event.event_organizer_name || event.organisation?.name || event.institution?.name || 'Independent Organizer';
    const media = getEventMedia(event);

    const handleBookSlot = (e) => {
        e.stopPropagation();
        navigate(`/events/${event.id}?action=book`);
    };

    const locationType = (() => {
        const val = event.event_location?.toLowerCase();
        const txt = event.location?.toLowerCase() || '';
        if (val === 'online' || txt.includes('virtual') || txt.includes('online') || txt.includes('zoom')) return 'Virtual';
        if (val === 'hybrid' || txt.includes('hybrid')) return 'Hybrid';
        return 'In-Person';
    })();

    const temporalBadge = {
        past:           { bg: 'bg-gray-500/15 text-gray-400', label: 'Past' },
        happening_now:  { bg: 'bg-red-500/20 text-red-400 animate-pulse', label: 'Live' },
        upcoming:       { bg: 'bg-emerald-500/20 text-emerald-400', label: 'Upcoming' },
    }[temporal];

    const timeLine = (() => {
        const s = displayTime(event.start_time);
        const e = displayTime(event.end_time);
        if (s && e) return `${s} – ${e}`;
        if (s) return `From ${s}`;
        if (e) return `Until ${e}`;
        return '';
    })();

    const spotsLeft = Math.max(0, (event.capacity || 0) - (event.attendees?.length || event.attendee_count || 0));

    return (
        <Card
            className={`overflow-hidden flex flex-col transition-all duration-300 group ${isPast ? 'opacity-60 grayscale-[40%]' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
            style={{ minHeight: 0 }}
        >
            {/* Cover media — compact */}
            <div className="relative h-28 sm:h-32 w-full bg-gradient-to-br from-primary/10 to-indigo-500/10 overflow-hidden shrink-0">
                {media ? (
                    media.isVideo ? (
                        <video
                            src={media.src}
                            className="w-full h-full object-cover"
                            muted autoPlay loop playsInline
                        />
                    ) : (
                        <img
                            src={media.src}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-primary/30" />
                    </div>
                )}
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Badges over image */}
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
                    <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-wider backdrop-blur-sm ${temporalBadge.bg}`}>
                        {temporalBadge.label}
                    </span>
                    <span className={`text-[0.6rem] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                        locationType === 'Virtual'
                            ? 'bg-green-500/20 text-green-300'
                            : locationType === 'Hybrid'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                    }`}>
                        {locationType}
                    </span>
                </div>

                {/* Price badge on cover */}
                <div className="absolute bottom-2 right-2 z-10">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-md backdrop-blur-sm ${
                        isFree
                            ? 'bg-green-500/80 text-white'
                            : 'bg-yellow-500/90 text-yellow-900'
                    }`}>
                        {isFree ? 'Free' : `$${event.price}`}
                    </span>
                </div>
            </div>

            <CardBody className="flex-1 py-3 px-3 space-y-2">
                {/* Title */}
                <h3
                    className="font-semibold text-sm text-primary line-clamp-2 cursor-pointer hover:text-primary-600 leading-snug"
                    onClick={onOpenDetails}
                >
                    {event.name}
                </h3>

                {/* Organizer */}
                <p className="text-xs text-secondary truncate">By {organizerName}</p>

                {/* Info rows */}
                <div className="space-y-1 text-xs text-secondary">
                    {event.event_date && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            <span>{shortDate(event.event_date)}</span>
                            {timeLine && <span className="text-tertiary ml-auto">{timeLine}</span>}
                        </div>
                    )}
                    {event.location && locationType !== 'Virtual' && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span>{isPast ? 'Event ended' : `${spotsLeft} spots left`}</span>
                    </div>
                    {!isFree && (
                        <div className="flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            <span className="font-medium text-primary">Booking: ${event.price}</span>
                        </div>
                    )}
                </div>

                <EventActions event={event} onUpdate={onUpdate} compact />
            </CardBody>

            {/* Footer buttons */}
            <div className="px-3 pb-3 pt-1 mt-auto flex gap-2">
                <Button variant="outline" className="flex-1 justify-center text-xs py-1.5" onClick={onOpenDetails}>
                    Details
                </Button>
                {!isPast && (
                    <Button variant="primary" className="flex-1 justify-center text-xs py-1.5" onClick={handleBookSlot}>
                        <Ticket className="w-3.5 h-3.5 mr-1" />
                        Book
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default Events;
