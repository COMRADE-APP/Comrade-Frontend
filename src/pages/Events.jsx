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
    X, ChevronRight, Plus, Search
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
                <Button variant="primary" onClick={() => navigate('/events/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                </Button>
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

const EventCard = ({ event, onOpenDetails, onUpdate }) => (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Event Image */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center relative">
            <Calendar className="w-12 h-12 text-primary" />
            {event.status && (
                <span className="absolute top-3 right-3 px-3 py-1 bg-elevated/90 backdrop-blur-sm rounded-full text-xs font-medium text-secondary capitalize">
                    {event.status}
                </span>
            )}
        </div>

        <CardBody>
            <div className="space-y-3 mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-primary line-clamp-2 hover:text-primary-600 cursor-pointer" onClick={onOpenDetails}>
                        {event.name}
                    </h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm text-secondary">
                    {event.event_date && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(event.event_date)}</span>
                        </div>
                    )}
                    {(event.start_time || event.end_time) && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{displayTime(event.start_time)} - {displayTime(event.end_time)}</span>
                        </div>
                    )}
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{(event.capacity || 0) - (event.attendees?.length || 0)} spots remaining</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <EventActions event={event} onUpdate={onUpdate} />

            {/* View Details */}
            <Button variant="primary" className="w-full mt-4" size="sm" onClick={onOpenDetails}>
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
        </CardBody>
    </Card>
);

export default Events;
