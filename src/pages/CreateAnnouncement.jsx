import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Megaphone, Calendar, Clock, Bell, Eye, CheckCircle,
    AlertCircle, ChevronRight, ChevronLeft, Save, Send, Type, FileText
} from 'lucide-react';
import api from '../services/api';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Content' },
    { number: 2, title: 'Settings' },
    { number: 3, title: 'Notifications' },
    { number: 4, title: 'Review' }
];

const CreateAnnouncement = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        heading: '',
        content: '',
        visibility: 'institutional',
        schedule_time: '',
        expiry_time: '',
        notification_enabled: true,
        offline_notification: true
    });

    const nextStep = () => {
        setError(null);
        if (currentStep === 1) {
            if (!formData.heading.trim()) {
                setError("Title is required");
                return;
            }
            if (!formData.content.trim()) {
                setError("Content is required");
                return;
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

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const submitData = { ...formData };
            if (roomId) {
                submitData.room = roomId;
            }
            await api.post('/api/announcements/', submitData);
            navigate(roomId ? `/rooms/${roomId}` : '/announcements');
        } catch (error) {
            console.error('Failed to create announcement:', error);
            setError(error.response?.data?.detail || 'Failed to create announcement');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/announcements')}
                        className="mb-4 text-gray-500 hover:text-gray-900"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Back to Announcements
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                        <Megaphone className="text-blue-600" />
                        Create Announcement
                    </h1>
                    <p className="text-gray-500 mt-2">Broadcast important updates to your organization or institution.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            ></div>

                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center relative z-10 px-2 group cursor-pointer"
                                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-400 border-gray-300 group-hover:border-blue-300'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[300px]">
                            {/* STEP 1: Content */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-start gap-2">
                                            <Megaphone size={16} className="mt-0.5 shrink-0" />
                                            <span>
                                                <strong>Note:</strong> Only moderators, admins, and creators can create announcements.
                                                Subscribers will receive notifications based on preferences.
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.heading}
                                                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="Enter announcement title"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <textarea
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                rows={6}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y"
                                                placeholder="Write your announcement here..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Settings */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                                        <div className="relative">
                                            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select
                                                value={formData.visibility}
                                                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                            >
                                                <option value="public">Public (Everyone)</option>
                                                <option value="institutional">Institution Members Only</option>
                                                <option value="organisational">Organization Members Only</option>
                                                <option value="private">Private (Only You)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="datetime-local"
                                                    value={formData.schedule_time}
                                                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (Optional)</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="datetime-local"
                                                    value={formData.expiry_time}
                                                    onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Announcement will be hidden after this date.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Notifications */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Bell className="text-blue-600" size={20} /> Notification Settings
                                    </h3>

                                    <div className="bg-white border boundary-gray-200 rounded-xl p-6 space-y-4">
                                        <label className="flex items-start cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.notification_enabled}
                                                    onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                            <div className="ml-4">
                                                <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Enable In-App Notifications</span>
                                                <span className="block text-xs text-gray-500">Users will receive a notification in their dashboard.</span>
                                            </div>
                                        </label>

                                        <div className="border-t border-gray-100 my-4"></div>

                                        <label className={`flex items-start cursor-pointer group ${!formData.notification_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.offline_notification}
                                                    onChange={(e) => setFormData({ ...formData, offline_notification: e.target.checked })}
                                                    className="sr-only peer"
                                                    disabled={!formData.notification_enabled}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                            <div className="ml-4">
                                                <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Push Notifications</span>
                                                <span className="block text-xs text-gray-500">Send push notifications to mobile devices and browsers (Offline capable).</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.heading}</h3>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                                            <span className="flex items-center gap-1">
                                                <Eye size={14} /> {formData.visibility}
                                            </span>
                                            {formData.schedule_time && (
                                                <span className="flex items-center gap-1 text-orange-600">
                                                    <Calendar size={14} /> Scheduled: {new Date(formData.schedule_time).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap">
                                            {formData.content}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                                        <Bell size={16} className={formData.notification_enabled ? 'text-blue-600' : 'text-gray-400'} />
                                        {formData.notification_enabled
                                            ? `Notifications enabled ${formData.offline_notification ? '(including push)' : '(in-app only)'}`
                                            : 'Notifications disabled'
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <Button
                                variant="secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Previous'}
                            </Button>

                            <div className="ml-auto">
                                {currentStep < STEPS.length ? (
                                    <Button variant="primary" onClick={nextStep}>
                                        Next <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            'Creating...'
                                        ) : (
                                            <>
                                                <Send size={18} className="mr-2" /> Publish Announcement
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateAnnouncement;
