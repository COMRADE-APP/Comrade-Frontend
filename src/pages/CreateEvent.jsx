import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Image as ImageIcon, Save, Send, Megaphone, X, Ticket, Globe, Building } from 'lucide-react';
import api from '../services/api';
import eventsService from '../services/events.service';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState(''); // 'publish', 'draft', 'announcement'
    const [coverImage, setCoverImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        event_location: 'physical', // physical, virtual, hybrid
        event_type: 'public', // public, private, invite_only, etc.
        location: '',
        latitude: '',
        longitude: '',
        event_url: '', // for virtual events
        event_date: '',
        start_time: '09:00',
        end_time: '17:00',
        booking_deadline: '',
        capacity: 100,
        duration: '08:00:00', // 8 hours default
        complexity_level: 'small', // small, midlevel, sophisticated
        booking_status: 'open',
        status: 'active',
    });
    const [errors, setErrors] = useState({});

    // Format duration from hours to Django DurationField format
    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = (hours - h) * 60;
        return `${String(h).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:00`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Event name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.event_date) newErrors.event_date = 'Event date is required';
        if (!formData.start_time) newErrors.start_time = 'Start time is required';
        if (!formData.end_time) newErrors.end_time = 'End time is required';
        if (formData.event_location !== 'virtual' && !formData.location.trim()) {
            newErrors.location = 'Location is required for physical/hybrid events';
        }
        if (formData.event_location !== 'physical' && !formData.event_url.trim()) {
            newErrors.event_url = 'Virtual link is required for virtual/hybrid events';
        }
        if (!formData.capacity || formData.capacity < 1) {
            newErrors.capacity = 'Capacity must be at least 1';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (action) => {
        if (!validateForm()) return;
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            // Prepare event date/time in ISO format
            const eventDateTime = new Date(`${formData.event_date}T${formData.start_time}`);
            const bookingDeadline = formData.booking_deadline
                ? new Date(`${formData.booking_deadline}T23:59:59`)
                : eventDateTime;

            const submitData = {
                name: formData.name,
                description: formData.description,
                event_location: formData.event_location,
                event_type: formData.event_type,
                location: formData.location || 'Virtual',
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
                event_url: formData.event_url || null,
                event_date: eventDateTime.toISOString(),
                start_time: formData.start_time,
                end_time: formData.end_time,
                booking_deadline: bookingDeadline.toISOString(),
                scheduled_time: eventDateTime.toISOString(),
                capacity: parseInt(formData.capacity),
                duration: formData.duration,
                complexity_level: formData.complexity_level,
                booking_status: formData.booking_status,
                status: confirmAction === 'draft' ? 'draft' : 'active',
            };

            // Add room ID if creating from within a room
            if (roomId) {
                submitData.room = roomId;
            }

            const response = await eventsService.createEvent(submitData);

            // If requesting announcement, create an announcement request
            if (confirmAction === 'announcement') {
                try {
                    await api.post('/api/announcements/announcements/', {
                        text: `📅 Event: ${formData.name}\n\n${formData.description?.substring(0, 500)}`,
                    });
                } catch (annError) {
                    console.warn('Announcement request failed:', annError);
                }
                alert('Event created and announcement requested!');
            } else if (confirmAction === 'draft') {
                alert('Event saved as draft!');
            } else {
                alert('Event published successfully!');
            }

            navigate(roomId ? `/rooms/${roomId}` : '/events');
        } catch (error) {
            console.error('Failed to create event:', error);
            const errorMessage = error.response?.data
                ? (typeof error.response.data === 'object'
                    ? JSON.stringify(error.response.data)
                    : error.response.data)
                : 'Failed to create event. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/events')} className="p-2 hover:bg-secondary/10 rounded-full text-primary">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-primary">Create Event</h1>
                </div>

                <div className="bg-elevated rounded-xl shadow-sm p-6 border border-theme">
                    {/* Cover Image Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-secondary mb-2">Cover Image</label>
                        <div className="border-2 border-dashed border-theme rounded-xl p-6 text-center hover:border-primary transition-colors">
                            {coverImage ? (
                                <div className="relative">
                                    <img src={URL.createObjectURL(coverImage)} alt="" className="max-h-48 mx-auto rounded-lg" />
                                    <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 mx-auto text-tertiary mb-2" />
                                    <label className="cursor-pointer text-primary hover:underline">
                                        Upload cover image
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0])} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Event Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-2">Event Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-elevated text-primary ${errors.name ? 'border-red-500' : 'border-theme'}`}
                            placeholder="Enter event name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-2">Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-elevated text-primary ${errors.description ? 'border-red-500' : 'border-theme'}`}
                            placeholder="Describe your event..."
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* Event Location Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-2">Event Format</label>
                        <div className="flex gap-4">
                            {[
                                { value: 'physical', label: 'Physical', icon: Building },
                                { value: 'online', label: 'Virtual', icon: Globe },
                                { value: 'hybrid', label: 'Hybrid', icon: Users }
                            ].map(({ value, label, icon: Icon }) => (
                                <label key={value} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${formData.event_location === value ? 'border-primary bg-primary/5 text-primary' : 'border-theme text-secondary hover:bg-secondary/5'}`}>
                                    <input
                                        type="radio"
                                        name="event_location"
                                        value={value}
                                        checked={formData.event_location === value}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <Icon size={18} />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Location / Virtual Link */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {formData.event_location !== 'online' && (
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    <MapPin size={16} className="inline mr-1" /> Physical Location *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg bg-elevated text-primary ${errors.location ? 'border-red-500' : 'border-theme'}`}
                                    placeholder="Event venue address"
                                />
                                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                            </div>
                        )}
                        {formData.event_location !== 'physical' && (
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    <Globe size={16} className="inline mr-1" /> Virtual Link *
                                </label>
                                <input
                                    type="url"
                                    name="event_url"
                                    value={formData.event_url}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg bg-elevated text-primary ${errors.event_url ? 'border-red-500' : 'border-theme'}`}
                                    placeholder="https://zoom.us/j/..."
                                />
                                {errors.event_url && <p className="text-red-500 text-sm mt-1">{errors.event_url}</p>}
                            </div>
                        )}
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Event Date *</label>
                            <input
                                type="date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-2 border rounded-lg bg-elevated text-primary ${errors.event_date ? 'border-red-500' : 'border-theme'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Start Time *</label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">End Time *</label>
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Booking Deadline</label>
                            <input
                                type="date"
                                name="booking_deadline"
                                value={formData.booking_deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Capacity & Complexity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                <Users size={16} className="inline mr-1" /> Capacity *
                            </label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="1"
                                className={`w-full px-4 py-2 border rounded-lg bg-elevated text-primary ${errors.capacity ? 'border-red-500' : 'border-theme'}`}
                                placeholder="Max attendees"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Event Type</label>
                            <select
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="invite_only">Invite Only</option>
                                <option value="members_only">Members Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Event Scale</label>
                            <select
                                name="complexity_level"
                                value={formData.complexity_level}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            >
                                <option value="small">Small (Simple gathering)</option>
                                <option value="midlevel">Mid-Level (Conference)</option>
                                <option value="sophisticated">Sophisticated (Major event)</option>
                            </select>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-secondary mb-2">Duration (hours)</label>
                        <input
                            type="number"
                            name="duration"
                            value={parseInt(formData.duration.split(':')[0])}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration: formatDuration(parseInt(e.target.value) || 1) }))}
                            min="1"
                            max="72"
                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg"
                            placeholder="Event duration in hours"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end border-t border-theme pt-6">
                        <button onClick={() => navigate('/events')} className="px-6 py-2 border border-theme rounded-lg hover:bg-secondary/5 text-primary">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('announcement')} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                            <Megaphone size={18} /> Request Announcement
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.name || !formData.event_date} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50">
                            <Send size={18} /> Publish
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-xl p-6 max-w-md w-full border border-theme">
                        <h3 className="text-lg font-bold mb-4 text-primary">
                            {confirmAction === 'draft' && '💾 Save as Draft?'}
                            {confirmAction === 'publish' && '🎉 Publish Event?'}
                            {confirmAction === 'announcement' && '📢 Request Announcement?'}
                        </h3>
                        <p className="text-secondary mb-6">
                            {confirmAction === 'draft' && 'Your event will be saved as a draft. You can edit and publish it later.'}
                            {confirmAction === 'publish' && 'Your event will be visible to your audience based on event type settings. A discussion room will be created automatically.'}
                            {confirmAction === 'announcement' && 'Your event will be published and an announcement request will be sent for admin approval.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-theme rounded-lg text-primary hover:bg-secondary/5">Cancel</button>
                            <button onClick={confirmSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;
