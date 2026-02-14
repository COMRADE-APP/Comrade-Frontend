/**
 * Enhanced Events page with all new components integrated
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import EventComments from '../components/events/EventComments';
import EventTicketing from '../components/events/EventTicketing';
import EventReminders from '../components/events/EventReminders';
import {
    Calendar, MapPin, Users, Clock, Ticket, Bell, MessageSquare,
    X, ChevronRight, Plus
} from 'lucide-react';
import eventsService from '../services/events.service';
import { formatDate, formatTime } from '../utils/dateFormatter';
import SearchFilterBar from '../components/common/SearchFilterBar';

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_asc');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(null); // 'details', 'tickets', 'reminders'
    const navigate = useNavigate();

    // All authenticated users can create events
    const canCreateEvents = true;

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
            // Handle various response formats more explicitly
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

    const openModal = (event, modalType) => {
        setSelectedEvent(event);
        setShowModal(modalType);
    };

    const closeModal = () => {
        setShowModal(null);
        setSelectedEvent(null);
        loadEvents(); // Refresh to get updated data
    };

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

            {/* Filters and Search */}
            <SearchFilterBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                placeholder="Search events by name, location..."
                filters={[
                    {
                        key: 'status',
                        label: 'All Events',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'interested', label: 'Interested' }
                        ]
                    }
                ]}
                activeFilters={{ status: filter }}
                onFilterChange={(key, value) => setFilter(value)}
                sortOptions={[
                    { value: 'date_asc', label: 'Date (Soonest First)' },
                    { value: 'date_desc', label: 'Date (Latest First)' },
                    { value: 'name', label: 'Name (A-Z)' },
                ]}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            {/* Events Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : events.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Calendar className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No events found. Create your first event!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {events
                        .filter(e =>
                            e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.location?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .sort((a, b) => {
                            if (sortBy === 'date_asc') return new Date(a.event_date) - new Date(b.event_date);
                            if (sortBy === 'date_desc') return new Date(b.event_date) - new Date(a.event_date);
                            if (sortBy === 'name') return a.name.localeCompare(b.name);
                            return 0;
                        })
                        .map((event) => (
                            <EnhancedEventCard
                                key={event.id}
                                event={event}
                                onOpenDetails={() => navigate(`/events/${event.id}`)}
                                onOpenTickets={() => openModal(event, 'tickets')}
                                onOpenReminders={() => openModal(event, 'reminders')}
                                onUpdate={loadEvents}
                            />
                        ))}
                </div>
            )}

            {/* Modals */}
            {showModal && selectedEvent && (
                <Modal onClose={closeModal} size={showModal === 'details' ? 'large' : 'medium'}>
                    {showModal === 'details' && (
                        <EventDetailsModal event={selectedEvent} onClose={closeModal} />
                    )}
                    {showModal === 'tickets' && (
                        <EventTicketing event={selectedEvent} tickets={selectedEvent.tickets || []} />
                    )}
                    {showModal === 'reminders' && (
                        <EventReminders event={selectedEvent} onClose={closeModal} />
                    )}
                </Modal>
            )}
        </div>
    );
};

const EnhancedEventCard = ({ event, onOpenDetails, onOpenTickets, onOpenReminders, onUpdate }) => (
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
            {/* Event Info */}
            <div className="space-y-3 mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-primary line-clamp-2 hover:text-primary cursor-pointer" onClick={onOpenDetails}>
                        {event.name}
                    </h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm text-secondary">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.capacity - (event.attendees?.length || 0)} spots remaining</span>
                    </div>
                </div>
            </div>

            {/* Actions Component */}
            <EventActions event={event} onUpdate={onUpdate} />

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={onOpenTickets}>
                    <Ticket className="w-4 h-4 mr-1" />
                    Tickets
                </Button>
                <Button variant="outline" size="sm" onClick={onOpenReminders}>
                    <Bell className="w-4 h-4 mr-1" />
                    Remind
                </Button>
                <Button variant="primary" size="sm" onClick={onOpenDetails}>
                    Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </CardBody>
    </Card>
);

const EventDetailsModal = ({ event, onClose }) => (
    <div className="space-y-6">
        {/* Header */}
        <div>
            <h2 className="text-2xl font-bold text-primary">{event.name}</h2>
            <p className="text-secondary mt-2">{event.description}</p>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-theme">
            <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-secondary" />
                <div>
                    <p className="text-sm text-secondary">Date</p>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-secondary" />
                <div>
                    <p className="text-sm text-secondary">Time</p>
                    <p className="font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-secondary" />
                <div>
                    <p className="text-sm text-secondary">Location</p>
                    <p className="font-medium">{event.location}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-secondary" />
                <div>
                    <p className="text-sm text-secondary">Capacity</p>
                    <p className="font-medium">{event.capacity} attendees</p>
                </div>
            </div>
        </div>

        {/* Stats */}
        {(event.reactions_count > 0 || event.comments_count > 0 || event.interested_count > 0) && (
            <div className="flex gap-6 text-sm">
                {event.reactions_count > 0 && (
                    <div>
                        <span className="text-secondary">Reactions: </span>
                        <span className="font-semibold">{event.reactions_count}</span>
                    </div>
                )}
                {event.comments_count > 0 && (
                    <div>
                        <span className="text-secondary">Comments: </span>
                        <span className="font-semibold">{event.comments_count}</span>
                    </div>
                )}
                {event.interested_count > 0 && (
                    <div>
                        <span className="text-secondary">Interested: </span>
                        <span className="font-semibold">{event.interested_count}</span>
                    </div>
                )}
            </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-theme pt-6">
            <EventComments eventId={event.id} />
        </div>
    </div>
);

const Modal = ({ children, onClose, size = 'medium' }) => {
    const sizes = {
        medium: 'max-w-2xl',
        large: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className={`bg-elevated rounded-xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-elevated border-b border-theme px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors ml-auto"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Events;
