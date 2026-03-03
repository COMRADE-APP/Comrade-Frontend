import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, DollarSign, Star, Calendar, MapPin, Loader2,
    CheckCircle, AlertCircle, MessageSquare, ChevronRight, Tag, Send
} from 'lucide-react';
import shopService from '../../services/shop.service';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        fetchService();
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (selectedDate && id) fetchSlots();
    }, [selectedDate]);

    const fetchService = async () => {
        try {
            const response = await shopService.getServiceById(id);
            setService(response.data);
        } catch (err) {
            console.error('Failed to load service:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await shopService.getServiceReviews(id);
            const data = response.data;
            setReviews(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        }
    };

    const fetchSlots = async () => {
        try {
            const response = await shopService.getTimeSlots(id, { date: selectedDate });
            const data = response.data;
            setAvailableSlots(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load slots:', err);
            setAvailableSlots([]);
        }
    };

    const handleBooking = async () => {
        if (!selectedDate || !selectedSlot) return;
        setBookingLoading(true);
        try {
            await shopService.createBooking({
                service: id,
                date: selectedDate,
                time_slot: selectedSlot,
            });
            alert('Booking confirmed!');
            setSelectedDate('');
            setSelectedSlot(null);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to book. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.comment.trim()) return;
        setReviewSubmitting(true);
        try {
            await shopService.createServiceReview(id, newReview);
            setNewReview({ rating: 5, comment: '' });
            fetchReviews();
        } catch (err) {
            console.error('Review submit failed:', err);
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary mb-2">Service Not Found</h2>
                    <Button variant="primary" onClick={() => navigate('/shop')}>Back to Shop</Button>
                </div>
            </div>
        );
    }

    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-secondary hover:text-primary mb-6">
                    <ArrowLeft size={18} /> Back to Shop
                </button>

                {/* Hero */}
                <div className="bg-elevated border border-theme rounded-2xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                    {service.category}
                                </span>
                                {service.is_active && (
                                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">Active</span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-primary mb-3">{service.name}</h1>
                            <p className="text-secondary leading-relaxed mb-6">{service.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 text-secondary">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    <span className="font-bold text-green-600 text-lg">${service.price}</span>
                                </div>
                                <div className="flex items-center gap-2 text-secondary">
                                    <Clock className="w-4 h-4 text-primary" />
                                    {service.duration_minutes || 60} min
                                </div>
                                {avgRating && (
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        {avgRating} ({reviews.length} reviews)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Book */}
                        <div className="md:w-80 bg-background border border-theme rounded-xl p-5 flex-shrink-0">
                            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> Book Now
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-secondary mb-1">Select Date</label>
                                    <input type="date" value={selectedDate}
                                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none" />
                                </div>

                                {selectedDate && (
                                    <div>
                                        <label className="block text-sm text-secondary mb-2">Available Slots</label>
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                {availableSlots.map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedSlot(slot.id || slot.start_time)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSlot === (slot.id || slot.start_time)
                                                            ? 'bg-primary text-white'
                                                            : 'bg-secondary/10 text-primary hover:bg-primary/10'
                                                            }`}
                                                    >
                                                        {slot.start_time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-tertiary py-2">No slots available for this date</p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    variant="primary"
                                    onClick={handleBooking}
                                    disabled={!selectedDate || !selectedSlot || bookingLoading}
                                    className="w-full"
                                >
                                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-theme mb-6">
                    {['overview', 'reviews'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-4 font-medium capitalize transition-colors border-b-2 ${activeTab === tab
                                ? 'text-primary border-primary'
                                : 'border-transparent text-secondary hover:text-primary'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardBody>
                                <h3 className="font-bold text-primary mb-4">Service Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-theme">
                                        <span className="text-secondary">Duration</span>
                                        <span className="text-primary font-medium">{service.duration_minutes || 60} minutes</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-theme">
                                        <span className="text-secondary">Advance Notice</span>
                                        <span className="text-primary font-medium">{service.delay_minutes || 30} minutes</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-theme">
                                        <span className="text-secondary">Break Between Sessions</span>
                                        <span className="text-primary font-medium">{service.break_minutes || 15} minutes</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-secondary">Max Bookings/Day</span>
                                        <span className="text-primary font-medium">{service.max_bookings_per_day || 5}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody>
                                <h3 className="font-bold text-primary mb-4">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(service.tags || []).map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> {tag}
                                        </span>
                                    ))}
                                    {(!service.tags || service.tags.length === 0) && (
                                        <p className="text-sm text-tertiary">No tags</p>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {/* Write review */}
                        <Card>
                            <CardBody>
                                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" /> Write a Review
                                </h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-secondary mb-2">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} type="button"
                                                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                    className="p-1">
                                                    <Star className={`w-6 h-6 ${star <= newReview.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={3} placeholder="Share your experience..."
                                        className="w-full px-4 py-2 bg-background border border-theme rounded-lg text-primary outline-none resize-y" />
                                    <Button variant="primary" type="submit" disabled={reviewSubmitting}>
                                        <Send className="w-4 h-4 mr-1" /> {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </Button>
                                </form>
                            </CardBody>
                        </Card>

                        {/* Reviews list */}
                        <div className="space-y-3">
                            {reviews.map((review, i) => (
                                <Card key={review.id || i}>
                                    <CardBody>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {(review.user_name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary text-sm">{review.user_name || 'User'}</p>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, si) => (
                                                        <Star key={si} className={`w-3 h-3 ${si < (review.rating || 0) ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-secondary text-sm">{review.comment || review.text}</p>
                                    </CardBody>
                                </Card>
                            ))}
                            {reviews.length === 0 && (
                                <div className="text-center py-12 text-secondary">
                                    <MessageSquare className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                    <p>No reviews yet. Be the first to review!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceDetail;
