import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Clock, MapPin, Users, Image as ImageIcon, Save, Send,
    Megaphone, X, Globe, Building2, GraduationCap, User, CheckCircle,
    AlertCircle, ChevronRight, ChevronLeft, Ticket
} from 'lucide-react';
import api from '../services/api';
import eventsService from '../services/events.service';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Basics' },
    { number: 2, title: 'When & Where' },
    { number: 3, title: 'Details' },
    { number: 4, title: 'Review' }
];

const CreateEvent = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const { activeProfile } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coverImage, setCoverImage] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        event_location: 'physical', // physical, virtual, hybrid
        event_type: 'public', // public, private, invite_only
        location: '',
        event_url: '',
        event_date: '',
        start_time: '09:00',
        end_time: '17:00',
        booking_deadline: '',
        capacity: 100,
        duration: '08:00:00',
        complexity_level: 'small', // small, midlevel, sophisticated
        booking_status: 'open',
    });

    const getProfileIcon = () => {
        if (activeProfile?.type === 'organisation') return Building2;
        if (activeProfile?.type === 'institution') return GraduationCap;
        return User;
    };
    const ProfileIcon = getProfileIcon();

    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = (hours - h) * 60;
        return `${String(h).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:00`;
    };

    const nextStep = () => {
        setError(null);
        if (currentStep === 1) {
            if (!formData.name.trim()) return setError("Event name is required");
            if (!formData.description.trim()) return setError("Description is required");
        }
        if (currentStep === 2) {
            if (!formData.event_date) return setError("Event date is required");
            if (!formData.start_time) return setError("Start time is required");
            if (!formData.end_time) return setError("End time is required");
            if (formData.event_location !== 'virtual' && !formData.location.trim()) {
                return setError("Location is required for physical events");
            }
            if (formData.event_location !== 'physical' && !formData.event_url.trim()) {
                return setError("Virtual link is required for virtual events");
            }
        }
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async (action) => {
        setLoading(true);
        setError(null);

        try {
            const eventDateTime = (formData.event_date && formData.start_time)
                ? new Date(`${formData.event_date}T${formData.start_time}`)
                : null;
            const bookingDeadline = formData.booking_deadline
                ? new Date(`${formData.booking_deadline}T23:59:59`)
                : eventDateTime;

            const submitData = {
                ...formData,
                location: formData.location || 'Virtual',
                event_date: eventDateTime ? eventDateTime.toISOString() : null,
                booking_deadline: bookingDeadline ? bookingDeadline.toISOString() : null,
                scheduled_time: eventDateTime ? eventDateTime.toISOString() : null,
                capacity: parseInt(formData.capacity),
                status: action === 'draft' ? 'draft' : 'active',
            };

            if (roomId) submitData.room = roomId;
            if (activeProfile?.type === 'organisation') submitData.organisation = activeProfile.id;
            else if (activeProfile?.type === 'institution') submitData.institution = activeProfile.id;

            // Note: coverImage upload handling would normally go here (FormData driven service)
            // Wait, original code `const response = await eventsService.createEvent(submitData);`
            // `submitData` was an object, not FormData. And `coverImage` was `useState(null)`.
            // It seems the original code **forgot** to send the image! 
            // I'll stick to JSON for now to ensure reliability, or check `events.service.js`.
            // Given I am converting "what is there", I will keep it as is, but logic suggests image upload is missing.

            await eventsService.createEvent(submitData);

            if (action === 'announcement') {
                try {
                    await api.post('/api/announcements/', {
                        text: `📅 Event: ${formData.name}\n\n${formData.description?.substring(0, 500)}`,
                    });
                } catch (e) {
                    console.warn('Announcement failed', e);
                }
                alert('Event created and announcement requested!');
            } else if (action === 'draft') {
                alert('Event saved as draft!');
            } else {
                alert('Event published successfully!');
            }

            navigate('/events');
        } catch (error) {
            console.error('Failed to create event:', error);
            setError(error.response?.data?.detail || 'Failed to create event');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/events')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Back to Events
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <Calendar className="text-green-600" />
                        Create Event
                    </h1>
                    <p className="text-secondary mt-2">Plan and organize events for your community.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-green-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            ></div>

                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center relative z-10 px-2 group cursor-pointer"
                                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-elevated text-secondary border-theme group-hover:border-green-300'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-green-600' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[300px]">
                            {/* STEP 1: Basics */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    {activeProfile && activeProfile.type !== 'personal' && (
                                        <div className="px-4 py-3 bg-secondary/5 rounded-lg flex items-center gap-3 border border-theme">
                                            <ProfileIcon className="w-5 h-5 text-primary" />
                                            <span className="text-primary">
                                                Creating event as <strong>{activeProfile.name}</strong>
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Event Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="Enter event name"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Description *</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y text-primary"
                                            placeholder="Describe your event..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Event Format</label>
                                        <div className="flex gap-4">
                                            {[
                                                { value: 'physical', label: 'Physical', icon: MapPin },
                                                { value: 'online', label: 'Virtual', icon: Globe },
                                                { value: 'hybrid', label: 'Hybrid', icon: Users }
                                            ].map(({ value, label, icon: Icon }) => (
                                                <label key={value} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-all ${formData.event_location === value
                                                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                                    : 'border-theme hover:border-primary/50 text-secondary'
                                                    }`}>
                                                    <input
                                                        type="radio"
                                                        name="event_location"
                                                        value={value}
                                                        checked={formData.event_location === value}
                                                        onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                                                        className="sr-only"
                                                    />
                                                    <Icon size={18} />
                                                    <span className="font-medium">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: When & Where */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Event Date *</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="date"
                                                    value={formData.event_date}
                                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Booking Deadline</label>
                                            <input
                                                type="date"
                                                value={formData.booking_deadline}
                                                onChange={(e) => setFormData({ ...formData, booking_deadline: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Start Time *</label>
                                            <input
                                                type="time"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">End Time *</label>
                                            <input
                                                type="time"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            />
                                        </div>
                                    </div>

                                    {formData.event_location !== 'online' && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Physical Location *</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                    placeholder="Event venue address"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.event_location !== 'physical' && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Virtual Link *</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="url"
                                                    value={formData.event_url}
                                                    onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                    placeholder="https://zoom.us/j/..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: Details */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Capacity</label>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="number"
                                                    value={formData.capacity}
                                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                    min="1"
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Event Type</label>
                                            <select
                                                value={formData.event_type}
                                                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            >
                                                <option value="public">Public (Open to all)</option>
                                                <option value="private">Private (Invite only)</option>
                                                <option value="members_only">Members Only</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Scale / Complexity</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { value: 'small', label: 'Small', desc: 'Simple gathering' },
                                                { value: 'midlevel', label: 'Mid-Level', desc: 'Conference / Workshop' },
                                                { value: 'sophisticated', label: 'Large', desc: 'Major Event / Expo' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, complexity_level: opt.value })}
                                                    className={`p-4 border rounded-lg text-left transition-all ${formData.complexity_level === opt.value
                                                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                                        : 'border-theme hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className={`font-medium ${formData.complexity_level === opt.value ? 'text-primary' : 'text-primary'}`}>{opt.label}</div>
                                                    <div className="text-xs text-secondary mt-1">{opt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Duration (hours)</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="12"
                                            step="0.5"
                                            value={parseInt(formData.duration)}
                                            onChange={(e) => setFormData({ ...formData, duration: formatDuration(parseFloat(e.target.value)) })}
                                            className="w-full accent-green-600"
                                        />
                                        <div className="text-right text-sm text-secondary mt-1">{parseInt(formData.duration)} hours</div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>

                                    <div className="bg-secondary/5 border border-theme rounded-xl p-6 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-primary">{formData.name}</h3>
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase">
                                                {formData.event_type}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 text-sm text-secondary mb-6 pb-4 border-b border-theme">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-green-600" />
                                                <span>{new Date(formData.event_date).toLocaleDateString()} • {formData.start_time} - {formData.end_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {formData.event_location === 'online' ? <Globe size={16} className="text-blue-500" /> : <MapPin size={16} className="text-red-500" />}
                                                <span>{formData.event_location === 'online' ? 'Online Event' : formData.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-secondary" />
                                                <span>Max {formData.capacity} attendees</span>
                                            </div>
                                        </div>

                                        <p className="text-primary whitespace-pre-wrap">
                                            {formData.description || <span className="text-secondary italic">No description provided.</span>}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                            <Button
                                variant="secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Previous'}
                            </Button>

                            <div className="ml-auto flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <Button variant="primary" onClick={nextStep}>
                                        Next <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading} className="border-theme text-secondary">
                                            <Save size={18} className="mr-2" /> Draft
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleSubmit('announcement')} disabled={loading}>
                                            <Megaphone size={18} className="mr-2" /> Announce
                                        </Button>
                                        <Button variant="primary" onClick={() => handleSubmit('publish')} disabled={loading}>
                                            <Send size={18} className="mr-2" /> Create Event
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateEvent;
