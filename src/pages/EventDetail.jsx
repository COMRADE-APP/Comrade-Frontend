/**
 * Event Detail Page
 * Comprehensive view of event with tabs for details, tickets, attendees, room, and logistics
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EventActions from '../components/events/EventActions';
import EventComments from '../components/events/EventComments';
import EventTicketing from '../components/events/EventTicketing';
import EventReminders from '../components/events/EventReminders';
import LogisticsSection from '../components/events/EventLogistics';
import {
    Calendar, MapPin, Users, Clock, Ticket, Bell, MessageSquare,
    ArrowLeft, Share2, Heart, Bookmark, MoreVertical, Globe, Building,
    FileText, DollarSign, Settings, ChevronRight
} from 'lucide-react';
import eventsService from '../services/events.service';
import { formatDate, formatTime } from '../utils/dateFormatter';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await eventsService.getEvent(id);
            setEvent(response.data);
        } catch (err) {
            console.error('Failed to load event:', err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const isOrganizer = event?.created_by === user?.id || user?.is_staff;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
        { id: 'attendees', label: 'Attendees', icon: Users },
        { id: 'room', label: 'Discussion', icon: MessageSquare },
        ...(isOrganizer ? [{ id: 'logistics', label: 'Logistics', icon: Settings }] : []),
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
                <button
                    onClick={() => navigate('/events')}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">{event.name}</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                        <Share2 size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Bookmark size={18} />
                    </Button>
                </div>
            </div>

            {/* Event Hero */}
            <Card className="overflow-hidden">
                <div className="aspect-video md:aspect-[3/1] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center relative">
                    <Calendar className="w-20 h-20 text-white/50" />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${event.status === 'active' ? 'bg-green-100 text-green-800' :
                            event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                            }`}>
                            {event.status}
                        </span>
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                            {event.complexity_level || 'small'}
                        </span>
                    </div>
                </div>

                <CardBody className="p-6">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="font-semibold">{formatDate(event.event_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Clock className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="font-semibold">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                {event.event_location === 'online' ? (
                                    <Globe className="w-5 h-5 text-primary-600" />
                                ) : (
                                    <MapPin className="w-5 h-5 text-primary-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-semibold truncate max-w-[150px]">{event.location || 'Virtual'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Capacity</p>
                                <p className="font-semibold">{event.attendees?.length || 0} / {event.capacity}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <EventActions event={event} onUpdate={loadEvent} />
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                            {/* Description */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-3">About this Event</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                                </CardBody>
                            </Card>

                            {/* Map for physical events */}
                            {event.event_location !== 'online' && event.latitude && event.longitude && (
                                <Card>
                                    <CardBody>
                                        <h3 className="font-semibold text-lg mb-3">Location</h3>
                                        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                                            <p className="text-gray-500">Map integration coming soon</p>
                                            <p className="text-sm text-gray-400">
                                                Coordinates: {event.latitude}, {event.longitude}
                                            </p>
                                        </div>
                                        <p className="mt-2 text-gray-700">
                                            <MapPin size={16} className="inline mr-1" />
                                            {event.location}
                                        </p>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Comments */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-4">Discussion</h3>
                                    <EventComments eventId={event.id} />
                                </CardBody>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Organizer */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3">Organized by</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{event.created_by_name || 'Event Organizer'}</p>
                                            <p className="text-sm text-gray-500">Organizer</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Stats */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3">Event Stats</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Interested</span>
                                            <span className="font-medium">{event.interested_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Reactions</span>
                                            <span className="font-medium">{event.reactions_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Comments</span>
                                            <span className="font-medium">{event.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Reminders */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3">Set Reminder</h3>
                                    <EventReminders event={event} compact />
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <Card>
                        <CardBody>
                            <EventTicketing event={event} tickets={[]} isOrganizer={isOrganizer} />
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'attendees' && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4">Attendees ({event.attendees?.length || 0})</h3>
                            {event.attendees_viewable ? (
                                event.attendees?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {event.attendees.map((attendee, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <span className="text-sm font-medium">Attendee {idx + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No attendees yet. Be the first to RSVP!</p>
                                )
                            ) : (
                                <p className="text-gray-500 text-center py-8">Attendee list is private</p>
                            )}
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'room' && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4">Event Discussion Room</h3>
                            {event.room ? (
                                <div className="text-center py-8">
                                    <Button onClick={() => navigate(`/rooms/${event.room.room}`)}>
                                        Enter Discussion Room
                                        <ChevronRight size={16} className="ml-1" />
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    Discussion room will be available when the event starts.
                                </p>
                            )}
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'logistics' && isOrganizer && (
                    <LogisticsSection event={event} onUpdate={loadEvent} />
                )}
            </div>
        </div>
    );
};

export default EventDetail;
