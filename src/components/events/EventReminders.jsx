/**
 * EventReminders Component
 * Set browser and email reminders for events
 */
import React, { useState } from 'react';
import { Bell, Mail, Clock, CheckCircle2 } from 'lucide-react';
import eventsService from '../../services/events.service';
import Button from '../common/Button';

const EventReminders = ({ event, onClose }) => {
    const [reminderType, setReminderType] = useState('email');
    const [remindBefore, setRemindBefore] = useState(24);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const reminderOptions = {
        email: [
            { value: 1, label: '1 hour before' },
            { value: 24, label: '1 day before' },
            { value: 48, label: '2 days before' },
            { value: 72, label: '3 days before' },
            { value: 168, label: '1 week before' },
        ],
        browser: [
            { value: 15, label: '15 minutes before' },
            { value: 30, label: '30 minutes before' },
            { value: 60, label: '1 hour before' },
            { value: 120, label: '2 hours before' },
            { value: 1440, label: '1 day before' },
        ]
    };

    const handleSetReminder = async () => {
        setLoading(true);
        try {
            // Request browser notification permission if needed
            if (reminderType === 'browser' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Browser notifications are blocked. Please enable them in your browser settings.');
                    setLoading(false);
                    return;
                }
            }

            await eventsService.setReminder(event.id, {
                type: reminderType,
                remind_before: remindBefore
            });

            setSuccess(true);
            setTimeout(() => {
                onClose?.();
            }, 2000);
        } catch (error) {
            alert('Failed to set reminder');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reminder Set!</h3>
                <p className="text-gray-600">
                    You'll receive a {reminderType} reminder {reminderOptions[reminderType].find(opt => opt.value === remindBefore)?.label}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Set Event Reminder</h3>
                <p className="text-gray-600">{event.name}</p>
            </div>

            {/* Reminder Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Reminder Type</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setReminderType('email')}
                        className={`p-4 border-2 rounded-lg transition-all ${reminderType === 'email'
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Mail className={`w-6 h-6 mx-auto mb-2 ${reminderType === 'email' ? 'text-primary-600' : 'text-gray-600'}`} />
                        <p className="font-medium text-sm">Email</p>
                    </button>
                    <button
                        onClick={() => setReminderType('browser')}
                        className={`p-4 border-2 rounded-lg transition-all ${reminderType === 'browser'
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Bell className={`w-6 h-6 mx-auto mb-2 ${reminderType === 'browser' ? 'text-primary-600' : 'text-gray-600'}`} />
                        <p className="font-medium text-sm">Browser</p>
                    </button>
                </div>
            </div>

            {/* Time Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Remind Me
                </label>
                <div className="space-y-2">
                    {reminderOptions[reminderType].map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <input
                                type="radio"
                                name="remind-before"
                                value={option.value}
                                checked={remindBefore === option.value}
                                onChange={() => setRemindBefore(option.value)}
                                className="w-4 h-4 text-primary-600"
                            />
                            <span className="flex-1 font-medium text-gray-900">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSetReminder}
                    disabled={loading}
                >
                    {loading ? 'Setting...' : 'Set Reminder'}
                </Button>
            </div>
        </div>
    );
};

export default EventReminders;
