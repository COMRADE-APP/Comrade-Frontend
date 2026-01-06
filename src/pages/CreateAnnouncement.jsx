import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateAnnouncement = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        heading: '',
        content: '',
        visibility: 'institutional',
        schedule_time: '',
        expiry_time: '',
        notification_enabled: true,
        offline_notification: true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('/api/announcements/', formData);
            alert('Announcement created successfully!');
            navigate('/announcements');
        } catch (error) {
            alert('Failed to create announcement');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Create Announcement
                    </h1>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            📢 <strong>Note:</strong> Only moderators, admins, and creators can create announcements.
                            Subscribers will receive notifications based on their preferences.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.heading}
                                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="Enter announcement title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Content *
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="Write your announcement here..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Visibility
                                </label>
                                <select
                                    value={formData.visibility}
                                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="public">Public</option>
                                    <option value="institutional">Institution Members</option>
                                    <option value="organisational">Organization Members</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Schedule (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.schedule_time}
                                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>

                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_enabled}
                                        onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Enable notifications
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.offline_notification}
                                        onChange={(e) => setFormData({ ...formData, offline_notification: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Send push notifications (offline capable)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/announcements')}
                                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create Announcement
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncement;
