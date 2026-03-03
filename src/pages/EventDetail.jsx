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
    FileText, DollarSign, Settings, ChevronRight, Star
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
    const [tickets, setTickets] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, feedback_text: '' });

    useEffect(() => {
        loadEvent();

        // Check URL for action parameter
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('action') === 'book') {
            setActiveTab('tickets');
        }
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await eventsService.getEvent(id);
            // Handle both direct data and {data: ...} response shapes
            const eventData = response?.data || response;
            if (!eventData || (typeof eventData === 'object' && !eventData.id && !eventData.name)) {
                setError('Event not found');
                return;
            }
            setEvent(eventData);

            try {
                const [ticketsRes, reviewsRes] = await Promise.all([
                    eventsService.getEventTickets(id).catch(() => ({ data: [] })),
                    eventsService.getEventFeedback(id).catch(() => ({ data: [] }))
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

    const isOrganizer = event?.created_by === user?.id || user?.is_staff;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
        { id: 'attendees', label: 'Attendees', icon: Users },
        { id: 'room', label: 'Discussion', icon: MessageSquare },
        { id: 'reviews', label: 'Reviews', icon: Star },
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
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">{event.name}</h1>
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
                <div className="aspect-video md:aspect-[3/1] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center relative">
                    <Calendar className="w-20 h-20 text-primary" />
                    <div className="absolute top-4 right-4 flex gap-2">
                        {(() => {
                            const locType = event.event_location?.toLowerCase();
                            const locText = event.location?.toLowerCase() || '';
                            let badge = 'Physical';
                            let badgeClass = 'bg-blue-500/20 text-blue-400';
                            if (locType === 'online' || locText.includes('virtual') || locText.includes('online') || locText.includes('zoom') || locText.includes('meet')) {
                                badge = 'Virtual';
                                badgeClass = 'bg-green-500/20 text-green-400';
                            } else if (locType === 'hybrid' || locText.includes('hybrid')) {
                                badge = 'Hybrid';
                                badgeClass = 'bg-purple-500/20 text-purple-400';
                            }
                            return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>{badge}</span>;
                        })()}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${event.status === 'active' ? 'bg-green-500/10 text-green-600' :
                            event.status === 'draft' ? 'bg-secondary text-secondary' :
                                event.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                                    'bg-blue-500/10 text-blue-600'
                            }`}>
                            {event.status}
                        </span>
                        <span className="px-3 py-1 bg-elevated/90 backdrop-blur-sm rounded-full text-sm font-medium text-secondary">
                            {event.complexity_level || 'small'}
                        </span>
                    </div>
                </div>

                <CardBody className="p-6">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Date</p>
                                <p className="font-semibold text-primary">{formatDate(event.event_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Time</p>
                                <p className="font-semibold text-primary">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {event.event_location === 'online' ? (
                                    <Globe className="w-5 h-5 text-primary" />
                                ) : (
                                    <MapPin className="w-5 h-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Location</p>
                                <p className="font-semibold text-primary truncate max-w-[150px]">{event.location || 'Virtual'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Capacity</p>
                                <p className="font-semibold text-primary">{event.attendees?.length || 0} / {event.capacity}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <EventActions event={event} onUpdate={loadEvent} />
                </CardBody>
            </Card>

            {/* Tabs */}
            <div className="border-b border-theme overflow-x-auto">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                            {/* Description */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-3 text-primary">About this Event</h3>
                                    <p className="text-secondary whitespace-pre-wrap">{event.description}</p>
                                </CardBody>
                            </Card>

                            {/* Map for physical events */}
                            {event.event_location !== 'online' && event.latitude && event.longitude && (
                                <Card>
                                    <CardBody>
                                        <h3 className="font-semibold text-lg mb-3 text-primary">Location</h3>
                                        <div className="bg-secondary rounded-lg h-64 flex items-center justify-center">
                                            <p className="text-secondary">Map integration coming soon</p>
                                            <p className="text-sm text-tertiary">
                                                Coordinates: {event.latitude}, {event.longitude}
                                            </p>
                                        </div>
                                        <p className="mt-2 text-secondary">
                                            <MapPin size={16} className="inline mr-1" />
                                            {event.location}
                                        </p>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Comments */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg mb-4 text-primary">Discussion</h3>
                                    <EventComments eventId={event.id} />
                                </CardBody>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Organizer */}
                            <Card>
                                <CardBody>
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
                                </CardBody>
                            </Card>

                            {/* Stats */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Event Stats</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Interested</span>
                                            <span className="font-medium text-primary">{event.interested_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Reactions</span>
                                            <span className="font-medium text-primary">{event.reactions_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Comments</span>
                                            <span className="font-medium text-primary">{event.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Reminders */}
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold mb-3 text-primary">Set Reminder</h3>
                                    <EventReminders event={event} compact />
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <Card>
                        <CardBody>
                            <EventTicketing event={event} tickets={tickets} isOrganizer={isOrganizer} />
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'attendees' && (
                    <Card>
                        <CardBody>
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
                                ) : (
                                    <p className="text-secondary text-center py-8">No attendees yet. Be the first to RSVP!</p>
                                )
                            ) : (
                                <p className="text-secondary text-center py-8">Attendee list is private</p>
                            )}
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'room' && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary">Event Discussion Room</h3>
                            {event.room ? (
                                <div className="text-center py-8">
                                    <Button onClick={() => navigate(`/rooms/${event.room.room}`)}>
                                        Enter Discussion Room
                                        <ChevronRight size={16} className="ml-1" />
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-secondary text-center py-8">
                                    Discussion room will be available when the event starts.
                                </p>
                            )}
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'reviews' && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-lg mb-4 text-primary">Event Reviews</h3>

                            {/* Submit Review Form */}
                            {!isOrganizer && (
                                <div className="mb-8 bg-secondary/30 p-4 rounded-lg border border-theme/50">
                                    <h4 className="font-medium text-primary mb-3">Leave a Review</h4>
                                    <div className="flex gap-2 mb-3">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className={`p-1 rounded-full transition-colors ${newReview.rating >= star ? 'text-yellow-500' : 'text-tertiary hover:text-yellow-500/50'}`}
                                            >
                                                <Star className={newReview.rating >= star ? "fill-current" : ""} size={24} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={newReview.feedback_text}
                                        onChange={(e) => setNewReview({ ...newReview, feedback_text: e.target.value })}
                                        placeholder="Share your experience..."
                                        className="w-full bg-secondary border border-theme rounded-lg p-3 text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 outline-none mb-3 min-h-[100px]"
                                    />
                                    <Button
                                        variant="primary"
                                        disabled={!newReview.feedback_text.trim()}
                                        onClick={async () => {
                                            try {
                                                await eventsService.submitFeedback({ event: event.id, rating: newReview.rating, feedback_text: newReview.feedback_text });
                                                setNewReview({ rating: 5, feedback_text: '' });
                                                loadEvent();
                                                alert("Review submitted successfully");
                                            } catch (err) {
                                                alert(err.response?.data?.error || "Failed to submit review");
                                            }
                                        }}
                                    >
                                        Submit Review
                                    </Button>
                                </div>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {reviews.length > 0 ? reviews.map((review, idx) => (
                                    <div key={idx} className="p-4 bg-secondary rounded-lg border border-theme/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary-600">
                                                    {(review.user?.first_name || review.user_name || 'U')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary text-sm">{review.user?.first_name || review.user_name || 'Anonymous User'}</p>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                size={12}
                                                                className={review.rating >= star ? 'text-yellow-500 fill-current' : 'text-tertiary'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-tertiary">{formatDate(review.created_at || new Date().toISOString())}</span>
                                        </div>
                                        <p className="text-secondary text-sm">{review.feedback_text}</p>
                                    </div>
                                )) : (
                                    <p className="text-secondary text-center py-6">No reviews yet.</p>
                                )}
                            </div>
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
