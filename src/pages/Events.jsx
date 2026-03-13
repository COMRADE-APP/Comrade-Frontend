/**
 * Enhanced Events page with pill filters
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import {
    Calendar, MapPin, Users, Clock, Ticket, Bell,
    X, ChevronRight, Plus, Search, BarChart3
} from 'lucide-react';
import eventsService from '../services/events.service';
import { formatDate } from '../utils/dateFormatter';

// Safe time display — handles both ISO dates and bare time strings like "09:00"
const displayTime = (val) => {
    if (!val) return '';
    // If it's a bare time string like "09:00" or "09:00:00"
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return val.slice(0, 5);
    try {
        return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return val; }
};

const getTemporalStatus = (event) => {
    if (!event.event_date) return null;
    
    let startDateTime = new Date(event.event_date);
    let endDateTime = new Date(event.event_date);
    
    // Parse times if available
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

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'past', label: 'Past' },
    { value: 'interested', label: 'Interested' },
];

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadEvents();
    }, [filter]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter === 'interested') {
                params.interested = 'true';
            } else if (filter !== 'all') {
                params.status = filter;
            }

            const response = await eventsService.getAllEvents(params);
            let data = [];
            if (response?.data?.results) {
                data = response.data.results;
            } else if (Array.isArray(response?.data)) {
                data = response.data;
            } else if (response?.results) {
                data = response.results;
            } else if (Array.isArray(response)) {
                data = response;
            }
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
        .sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Events</h1>
                    <p className="text-secondary mt-1">Discover and join upcoming events</p>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Pill Filters */}
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
                        <p className="text-secondary">No events found. Create your first event!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

const EventCard = ({ event, onOpenDetails, onUpdate }) => {
    const navigate = useNavigate();

    const handleBookSlot = (e) => {
        e.stopPropagation();
        navigate(`/events/${event.id}?action=book`);
    };

    const locationTypeDisplay = () => {
        const locationType = event.event_location?.toLowerCase();
        const locationText = event.location?.toLowerCase() || '';

        // Check the event_location enum first (canonical source)
        if (locationType === 'online') return 'Virtual';
        if (locationType === 'hybrid') return 'Hybrid';
        if (locationType === 'physical') return 'Physical';

        // Fallback: check the location text field for hints
        if (locationText.includes('online') || locationText.includes('virtual') || locationText.includes('zoom') || locationText.includes('teams') || locationText.includes('meet')) return 'Virtual';
        if (locationText.includes('hybrid')) return 'Hybrid';

        return 'Physical';
    };

    const organizerName = event.created_by_name || event.organisation?.name || event.institution?.name || 'Independent Organizer';
    const isFree = !event.price || event.price <= 0;
    const organizerInitial = organizerName.charAt(0).toUpperCase();

    return (
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
            <div>
                {/* Event Image */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 flex flex-col justify-between p-3 relative overflow-hidden">
                    {(event.cover_image || event.image_url) && (
                        <img
                            src={event.cover_image || event.image_url}
                            alt={event.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-500"
                        />
                    )}
                    <div className="flex justify-between items-start w-full gap-2 relative z-10">
                        {(() => {
                            const locLabel = locationTypeDisplay();
                            const badgeColors = locLabel === 'Virtual' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : locLabel === 'Hybrid' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                            return (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${badgeColors}`}>
                                    {locLabel}
                                </span>
                            );
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
                    </div>
                    <div className="flex justify-center flex-1 items-center">
                        <Calendar className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <CardBody className="pb-2">
                    <div className="space-y-3 mb-4">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-semibold text-lg text-primary line-clamp-2 hover:text-primary-600 cursor-pointer flex-1" onClick={onOpenDetails}>
                                    {event.name}
                                </h3>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold shrink-0 ${isFree ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-primary/10 text-primary-600'}`}>
                                    {isFree ? 'Free' : `$${event.price}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-600 overflow-hidden ring-1 ring-primary/30">
                                    {(event.created_by_avatar || event.organizer_avatar) ? (
                                        <img src={event.created_by_avatar || event.organizer_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        organizerInitial
                                    )}
                                </div>
                                <p className="text-sm font-medium text-primary-600 flex items-center gap-1">
                                    By {organizerName}
                                    {(event.is_verified || event.created_by_verified || event.organisation?.is_verified || event.institution?.is_verified) && (
                                        <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full flex-shrink-0" title="Verified">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </p>
                            </div>
                            <p className="text-sm text-secondary mt-1 line-clamp-2">{event.description}</p>
                        </div>

                        <div className="space-y-2 text-sm text-secondary bg-secondary/30 p-3 rounded-lg border border-theme/50">
                            {event.event_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 flex-shrink-0 text-primary-500" />
                                    <span>{formatDate(event.event_date)}</span>
                                </div>
                            )}
                            {(event.start_time || event.end_time) && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 flex-shrink-0 text-primary-500" />
                                    <span>{displayTime(event.start_time)} - {displayTime(event.end_time)}</span>
                                </div>
                            )}
                            {event.location && event.event_location !== 'online' && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary-500" />
                                    <span className="line-clamp-1">{event.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 flex-shrink-0 text-primary-500" />
                                <span>{(event.capacity || 0) - (event.attendees?.length || 0)} spots remaining</span>
                            </div>
                        </div>
                    </div>

                    <EventActions event={event} onUpdate={onUpdate} />
                </CardBody>
            </div>

            <div className="px-4 pb-4 pt-2 mt-auto border-t border-theme/30 bg-elevated rounded-b-xl flex gap-3">
                <Button variant="outline" className="flex-1 justify-center text-sm py-2" onClick={onOpenDetails}>
                    View Detail
                </Button>
                <Button variant="primary" className="flex-1 justify-center text-sm py-2" onClick={handleBookSlot}>
                    <Ticket className="w-4 h-4 mr-2" />
                    Book a Slot
                </Button>
            </div>
        </Card>
    );
};

export default Events;
