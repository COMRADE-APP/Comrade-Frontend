/**
 * EventAnalytics - Global Event Analytics overview page
 * Shows a list of the user's events with per-event analytics dashboards
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Calendar, Users, Ticket, TrendingUp, ChevronDown, ChevronUp, Search } from 'lucide-react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventAnalyticsDashboard from '../components/events/EventAnalyticsDashboard';
import eventsService from '../services/events.service';
import { formatDate } from '../utils/dateFormatter';

const EventAnalytics = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEventId, setExpandedEventId] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventsService.getAllEvents();
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

    const filteredEvents = events.filter(e =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (eventId) => {
        setExpandedEventId(prev => prev === eventId ? null : eventId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/events')}
                        className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                            <BarChart3 className="w-7 h-7 text-primary-600" />
                            Event Analytics
                        </h1>
                        <p className="text-secondary mt-1">Performance insights across all your events</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            {!loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex items-center gap-3 py-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                                <Calendar size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">{events.length}</p>
                                <p className="text-sm text-secondary">Total Events</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-3 py-4">
                            <div className="p-2.5 bg-green-500/10 rounded-xl text-green-500">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0)}
                                </p>
                                <p className="text-sm text-secondary">Total Attendees</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-3 py-4">
                            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
                                <Ticket size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {events.reduce((sum, e) => sum + (e.capacity || 0), 0)}
                                </p>
                                <p className="text-sm text-secondary">Total Capacity</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-3 py-4">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {events.filter(e => {
                                        if (!e.event_date) return false;
                                        return new Date(e.event_date) >= new Date();
                                    }).length}
                                </p>
                                <p className="text-sm text-secondary">Upcoming</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Events List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary">Loading events...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No events found. Create an event to see analytics!</p>
                        <Button variant="primary" className="mt-4" onClick={() => navigate('/events/create')}>
                            Create Event
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredEvents.map(event => (
                        <div key={event.id} className="rounded-xl border border-theme bg-elevated overflow-hidden transition-shadow hover:shadow-md">
                            {/* Event Row */}
                            <button
                                onClick={() => toggleExpand(event.id)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-primary truncate">{event.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-secondary mt-0.5">
                                            {event.event_date && (
                                                <span>{formatDate(event.event_date)}</span>
                                            )}
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {event.attendees?.length || 0} attendees
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                        event.event_date && new Date(event.event_date) >= new Date()
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-secondary text-secondary'
                                    }`}>
                                        {event.event_date && new Date(event.event_date) >= new Date() ? 'Upcoming' : 'Past'}
                                    </span>
                                    {expandedEventId === event.id
                                        ? <ChevronUp size={20} className="text-secondary" />
                                        : <ChevronDown size={20} className="text-secondary" />
                                    }
                                </div>
                            </button>

                            {/* Expanded Analytics Dashboard */}
                            {expandedEventId === event.id && (
                                <div className="border-t border-theme p-4 bg-primary/50">
                                    <EventAnalyticsDashboard event={event} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventAnalytics;
