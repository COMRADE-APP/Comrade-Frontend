import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Clock, MapPin, Users, Image as ImageIcon, Save, Send,
    Megaphone, X, Globe, Building2, GraduationCap, User, CheckCircle,
    AlertCircle, ChevronRight, ChevronLeft, Ticket, FileText, Upload, Plus, Trash2, HeartHandshake
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
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const { activeProfile } = useAuth();
    const isEditMode = !!id;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialFetchLoading, setInitialFetchLoading] = useState(false);
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
        is_ticketed: false,
        seeking_sponsors: false,
        seeking_partners: false,
    });

    const [ticketTiers, setTicketTiers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [existingMaterials, setExistingMaterials] = useState([]);
    const [isParsingDoc, setIsParsingDoc] = useState(false);

    useEffect(() => {
        if (id) {
            setInitialFetchLoading(true);
            eventsService.getEvent(id)
                .then(res => {
                    const data = res?.data || res;
                    if (data) {
                        const evtDate = data.event_date ? new Date(data.event_date) : null;
                        const bkdDate = data.booking_deadline ? new Date(data.booking_deadline) : null;
                        setFormData({
                            name: data.name || '',
                            description: data.description || '',
                            event_location: data.event_location || 'physical',
                            event_type: data.event_type || 'public',
                            location: data.location === 'Virtual' ? '' : (data.location || ''),
                            event_url: data.event_url || '',
                            event_date: evtDate ? evtDate.toISOString().split('T')[0] : '',
                            start_time: data.start_time || '09:00',
                            end_time: data.end_time || '17:00',
                            booking_deadline: bkdDate ? bkdDate.toISOString().split('T')[0] : '',
                            capacity: data.capacity || 100,
                            duration: data.duration || '08:00:00',
                            complexity_level: data.complexity_level || 'small',
                            booking_status: data.booking_status || 'open',
                            is_ticketed: data.is_ticketed || false,
                            seeking_sponsors: data.seeking_sponsors || false,
                            seeking_partners: data.seeking_partners || false,
                        });
                        if (data.materials) {
                            setExistingMaterials(data.materials);
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to load existing event details:", err);
                    setError("Could not load event for editing");
                })
                .finally(() => {
                    setInitialFetchLoading(false);
                });

            // Need to fetch ticket tiers too:
            eventsService.getEventTickets(id)
                .then(res => {
                    const tiers = Array.isArray(res?.data) ? res.data : [];
                    setTicketTiers(tiers);
                    if (tiers.length > 0) {
                        setFormData(prev => ({ ...prev, is_ticketed: true }));
                    }
                })
                .catch(err => console.error("Could not fetch tickets for edit", err));
        }
    }, [id]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsingDoc(true);
        setError(null);
        try {
            const res = await eventsService.parseDocument(file);
            const data = res.data.parsed_data;
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    name: data.name || prev.name,
                    description: data.description || prev.description,
                    location: data.location || prev.location,
                    event_date: data.event_date || prev.event_date,
                    start_time: data.start_time || prev.start_time,
                    end_time: data.end_time || prev.end_time,
                    capacity: data.capacity || prev.capacity,
                    is_ticketed: data.is_ticketed ?? prev.is_ticketed,
                    seeking_sponsors: data.seeking_sponsors ?? prev.seeking_sponsors,
                    seeking_partners: data.seeking_partners ?? prev.seeking_partners,
                }));
            }
        } catch (error) {
            console.error('Document parse failed', error);
            setError('Failed to extract information from the document.');
        } finally {
            setIsParsingDoc(false);
        }
    };

    const handleMaterialUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMaterials(prev => [...prev, ...files]);
        }
    };

    const removeMaterial = (index) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };

    const addTicketTier = () => {
        setTicketTiers(prev => [...prev, { name: 'Late Entry', price: 0, capacity: 50, group_size_allowed: 1, min_age: '', max_age: '', custom_criteria: '' }]);
    };

    const removeTicketTier = (index) => {
        setTicketTiers(prev => prev.filter((_, i) => i !== index));
    };

    const updateTicketTier = (index, field, value) => {
        setTicketTiers(prev => {
            const newTiers = [...prev];
            newTiers[index] = { ...newTiers[index], [field]: value };
            return newTiers;
        });
    };

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
                ticket_tiers: ticketTiers.map(t => ({
                    ...t,
                    price: parseFloat(t.price) || 0,
                    capacity: parseInt(t.capacity) || 0,
                    group_size_allowed: parseInt(t.group_size_allowed) || 1,
                    min_age: parseInt(t.min_age) || null,
                    max_age: parseInt(t.max_age) || null,
                }))
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

            let eventId;
            // Since we might be sending a file (coverImage), we will use FormData.
            const BOOLEAN_FIELDS = ['seeking_sponsors', 'is_recurring', 'is_private', 'allow_group_registration'];
            const dataToSubmit = new FormData();
            Object.keys(submitData).forEach(key => {
                if (key === 'ticket_tiers') {
                    const tiers = submitData[key];
                    if (tiers && tiers.length > 0) {
                        dataToSubmit.append(key, JSON.stringify(tiers));
                    }
                } else if (submitData[key] !== null && submitData[key] !== undefined && submitData[key] !== '') {
                    // Convert booleans explicitly to string for FormData compatibility
                    if (BOOLEAN_FIELDS.includes(key) || typeof submitData[key] === 'boolean') {
                        dataToSubmit.append(key, submitData[key] ? 'true' : 'false');
                    } else if (Array.isArray(submitData[key])) {
                        dataToSubmit.append(key, JSON.stringify(submitData[key]));
                    } else {
                        dataToSubmit.append(key, submitData[key]);
                    }
                }
            });
            if (coverImage) {
                dataToSubmit.append('cover_image', coverImage);
            }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (isEditMode) {
                const response = await api.patch(`/api/events/${id}/`, dataToSubmit, config);
                eventId = response.data?.id || id;
            } else {
                const response = await api.post('/api/events/event/', dataToSubmit, config);
                eventId = response.data?.id;
            }

            // Upload additional materials if any
            if (eventId && materials.length > 0) {
                for (const file of materials) {
                    const materialData = new FormData();
                    materialData.append('file', file);
                    materialData.append('name', file.name);
                    materialData.append('material_type', 'other');
                    try {
                        await eventsService.addMaterial(eventId, materialData);
                    } catch (mErr) {
                        console.warn('Failed to upload material:', file.name, mErr);
                    }
                }
            }

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
                if (isEditMode) {
                    alert('Event updated successfully!');
                } else {
                    alert('Event published successfully!');
                }
            }

            navigate('/events');
        } catch (error) {
            console.error('Failed to create event:', error);
            const errData = error.response?.data;
            const errMsg = errData ? (typeof errData === 'object' ? JSON.stringify(errData) : errData) : error.message;
            setError(errMsg || 'Failed to create event');
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
                        {isEditMode ? 'Edit Event' : 'Create Event'}
                    </h1>
                    <p className="text-secondary mt-2">
                        {isEditMode ? 'Update your event details.' : 'Plan and organize events for your community.'}
                    </p>
                </div>

                <Card>
                    <CardBody>
                        {initialFetchLoading ? (
                            <div className="py-20 flex justify-center text-primary">
                                <Clock className="animate-spin" size={32} />
                            </div>
                        ) : (
                            <>
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

                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center border-dashed text-center">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                                    {isParsingDoc ? <Clock className="animate-spin text-primary" /> : <FileText className="text-primary" size={24} />}
                                                </div>
                                                <h3 className="text-lg font-semibold text-primary mb-1">AI Event Auto-Fill</h3>
                                                <p className="text-sm text-secondary mb-4">Upload an event brochure, schedule, or poster PDF to automatically extract title, descriptions, and dates.</p>
                                                <label className="cursor-pointer border border-theme bg-background hover:bg-secondary/5 px-4 py-2 rounded-lg font-medium text-primary flex items-center gap-2 transition-colors">
                                                    <Upload size={18} />
                                                    {isParsingDoc ? "Parsing..." : "Select Document"}
                                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} disabled={isParsingDoc} />
                                                </label>
                                            </div>

                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center border-dashed text-center mt-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                                                    {coverImage ? (
                                                        <img src={URL.createObjectURL(coverImage)} alt="Cover" className="object-cover w-full h-full" />
                                                    ) : (
                                                        <ImageIcon className="text-primary" size={24} />
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-semibold text-primary mb-1">Event Cover Image</h3>
                                                <p className="text-sm text-secondary mb-4">Upload a high-quality picture to appear on the event card.</p>
                                                <label className="cursor-pointer border border-theme bg-background hover:bg-secondary/5 px-4 py-2 rounded-lg font-medium text-primary flex items-center gap-2 transition-colors">
                                                    <Upload size={18} />
                                                    {coverImage ? "Change Image" : "Select Image"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} />
                                                </label>
                                            </div>

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

                                            <div className="pt-4 border-t border-theme">
                                                <h4 className="text-md font-semibold text-primary mb-4 flex items-center gap-2">
                                                    <HeartHandshake size={18} className="text-pink-500" /> Partnerships & Sponsorships
                                                </h4>
                                                <div className="flex gap-6">
                                                    <label className="flex items-center gap-3 cursor-pointer text-primary">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.seeking_sponsors}
                                                            onChange={e => setFormData({ ...formData, seeking_sponsors: e.target.checked })}
                                                            className="w-5 h-5 rounded border-theme text-green-600 focus:ring-green-500"
                                                        />
                                                        We are strictly looking for Sponsors
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer text-primary">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.seeking_partners}
                                                            onChange={e => setFormData({ ...formData, seeking_partners: e.target.checked })}
                                                            className="w-5 h-5 rounded border-theme text-blue-600 focus:ring-blue-500"
                                                        />
                                                        We are strictly looking for Partners
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-theme">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-md font-semibold text-primary flex items-center gap-2">
                                                        <Ticket size={18} className="text-indigo-500" /> Ticketing & Tiers
                                                    </h4>
                                                    <label className="flex items-center gap-2 text-sm text-primary">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.is_ticketed}
                                                            onChange={e => setFormData({ ...formData, is_ticketed: e.target.checked })}
                                                            className="w-4 h-4 rounded border-theme text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span>Enable Tickets</span>
                                                    </label>
                                                </div>

                                                {formData.is_ticketed && (
                                                    <div className="space-y-4">
                                                        {ticketTiers.map((tier, idx) => (
                                                            <div key={idx} className="p-4 border border-theme rounded-lg bg-secondary/5 relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTicketTier(idx)}
                                                                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pr-8">
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Tier Name</label>
                                                                        <input type="text" value={tier.name} onChange={e => updateTicketTier(idx, 'name', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Price ($)</label>
                                                                        <input type="number" min="0" value={tier.price} onChange={e => updateTicketTier(idx, 'price', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Capacity</label>
                                                                        <input type="number" min="1" value={tier.capacity} onChange={e => updateTicketTier(idx, 'capacity', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Group Size</label>
                                                                        <input type="number" min="1" value={tier.group_size_allowed} onChange={e => updateTicketTier(idx, 'group_size_allowed', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" title="1 for Individual, 2 for Couple, etc" />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Min Age <span className="text-gray-400 font-light">(Optional)</span></label>
                                                                        <input type="number" min="0" value={tier.min_age} onChange={e => updateTicketTier(idx, 'min_age', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Max Age <span className="text-gray-400 font-light">(Optional)</span></label>
                                                                        <input type="number" min="0" value={tier.max_age} onChange={e => updateTicketTier(idx, 'max_age', e.target.value)} className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-secondary mb-1">Custom Req. <span className="text-gray-400 font-light">(Optional)</span></label>
                                                                        <input type="text" value={tier.custom_criteria} onChange={e => updateTicketTier(idx, 'custom_criteria', e.target.value)} placeholder="e.g. Must be a student" className="w-full px-2 py-1 text-sm bg-background border border-theme rounded outline-none text-primary" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button type="button" variant="outline" onClick={addTicketTier} className="w-full border-dashed text-primary flex items-center justify-center py-3">
                                                            <Plus size={16} className="mr-2" /> Add Ticket Tier
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-theme">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-md font-semibold text-primary flex items-center gap-2">
                                                        <FileText size={18} className="text-yellow-500" /> Event Materials
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-secondary mb-4">Upload schedules, brochures, or any other documents attendees might need.</p>

                                                <div className="space-y-3">
                                                    {existingMaterials.map((file, idx) => (
                                                        <div key={`exist-${idx}`} className="flex items-center justify-between p-3 bg-secondary/10 border border-theme rounded-lg">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <FileText size={18} className="text-green-400 shrink-0" />
                                                                <span className="text-sm text-primary truncate">{file.description || file.file_type || 'Attached Document'}</span>
                                                                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">Already Uploaded</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {materials.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/5 border border-theme rounded-lg">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <FileText size={18} className="text-secondary shrink-0" />
                                                                <span className="text-sm text-primary truncate">{file.name}</span>
                                                            </div>
                                                            <button type="button" onClick={() => removeMaterial(idx)} className="text-red-500 hover:text-red-700 p-1 shrink-0">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-theme rounded-lg text-secondary hover:text-primary hover:border-primary/50 transition-colors bg-background">
                                                        <Upload size={18} />
                                                        <span className="font-medium text-sm">Add Material File</span>
                                                        <input type="file" className="hidden" multiple onChange={handleMaterialUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: Review */}
                                    {currentStep === 4 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>

                                            <div className="bg-secondary/5 border border-theme rounded-xl p-6 shadow-sm">
                                                {coverImage && (
                                                    <div className="mb-4 h-48 w-full rounded-lg overflow-hidden relative bg-black/5">
                                                        <img src={URL.createObjectURL(coverImage)} alt="Event Cover" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
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
                                                    {(formData.seeking_partners || formData.seeking_sponsors) && (
                                                        <div className="flex items-center gap-2 text-pink-500 font-medium">
                                                            <HeartHandshake size={16} />
                                                            <span>Looking for: {[formData.seeking_sponsors ? "Sponsors" : null, formData.seeking_partners ? "Partners" : null].filter(Boolean).join(" & ")}</span>
                                                        </div>
                                                    )}
                                                    {formData.is_ticketed && ticketTiers.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            <div className="font-medium text-primary flex items-center gap-2">
                                                                <Ticket size={16} className="text-indigo-500" /> Ticket Tiers:
                                                            </div>
                                                            <ul className="list-disc pl-8 text-secondary">
                                                                {ticketTiers.map((t, idx) => (
                                                                    <li key={idx}>{t.name} - ${t.price} ({t.capacity} available)</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
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
                                                    <Send size={18} className="mr-2" /> {isEditMode ? 'Update Event' : 'Create Event'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateEvent;
