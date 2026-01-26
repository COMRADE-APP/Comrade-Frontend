import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Image as ImageIcon, Save, Send, Megaphone, X } from 'lucide-react';
import api from '../services/api';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState(''); // 'publish', 'draft', 'announcement'
    const [coverImage, setCoverImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        event_type: 'physical',
        location: '',
        virtual_link: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        visibility: 'public',
        max_attendees: '',
        is_ticketed: false,
        ticket_price: '',
    });

    const handleSubmit = async (action) => {
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            if (coverImage) {
                submitData.append('cover_image', coverImage);
            }

            // Set status based on action
            submitData.append('status', confirmAction === 'draft' ? 'draft' : 'published');

            console.log(submitData);
            const response = await api.post('/api/events/events/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // If requesting announcement, create an announcement request
            if (confirmAction === 'announcement') {
                await api.post('/api/announcements/requests/', {
                    content_type: 'event',
                    content_id: response.data.id,
                    heading: `📅 Event: ${formData.name}`,
                    content: formData.description?.substring(0, 500),
                    request_type: 'event_promotion'
                });
                alert('Event created and announcement requested!');
            } else if (confirmAction === 'draft') {
                alert('Event saved as draft!');
            } else {
                alert('Event published successfully!');
            }

            navigate('/events');
        } catch (error) {
            console.error('Failed to create event:', error);
            alert(error.response?.data?.detail || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/events')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* Cover Image Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition-colors">
                            {coverImage ? (
                                <div className="relative">
                                    <img src={URL.createObjectURL(coverImage)} alt="" className="max-h-48 mx-auto rounded-lg" />
                                    <button onClick={() => setCoverImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <label className="cursor-pointer text-primary-600 hover:underline">
                                        Upload cover image
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0])} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Event Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter event name"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Describe your event..."
                            required
                        />
                    </div>

                    {/* Event Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                        <div className="flex gap-4">
                            {['physical', 'virtual', 'hybrid'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="event_type"
                                        value={type}
                                        checked={formData.event_type === type}
                                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                    />
                                    <span className="capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Location / Virtual Link */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {formData.event_type !== 'virtual' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MapPin size={16} className="inline mr-1" /> Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Event venue"
                                />
                            </div>
                        )}
                        {formData.event_type !== 'physical' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Link</label>
                                <input
                                    type="url"
                                    value={formData.virtual_link}
                                    onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                            <input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                            <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>

                    {/* Visibility & Attendees */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                            <select value={formData.visibility} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="public">Public</option>
                                <option value="institution">Institution Only</option>
                                <option value="organization">Organization Only</option>
                                <option value="private">Private (Invite Only)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
                            <input type="number" value={formData.max_attendees} onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Unlimited if empty" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/events')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('announcement')} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                            <Megaphone size={18} /> Request Announcement
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.name || !formData.start_date} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                            <Send size={18} /> Publish
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {confirmAction === 'draft' && '💾 Save as Draft?'}
                            {confirmAction === 'publish' && '🎉 Publish Event?'}
                            {confirmAction === 'announcement' && '📢 Request Announcement?'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {confirmAction === 'draft' && 'Your event will be saved as a draft. You can edit and publish it later.'}
                            {confirmAction === 'publish' && 'Your event will be visible to your audience based on visibility settings.'}
                            {confirmAction === 'announcement' && 'Your event will be published and an announcement request will be sent for admin approval.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
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
