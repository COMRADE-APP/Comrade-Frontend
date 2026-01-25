import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

/**
 * NotificationBell - Header notification bell with unread count and dropdown
 */
const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/api/notifications/unread_count/');
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notification count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/notifications/?page_size=10');
            setNotifications(response.data.results || response.data || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/api/notifications/${id}/mark_read/`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/mark_all_read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            like: '❤️',
            comment: '💬',
            follow: '👤',
            repost: '🔄',
            mention: '@',
            reply: '↩️',
            system: 'ℹ️',
            announcement: '📢',
        };
        return icons[type] || '🔔';
    };

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-purple-600 hover:text-purple-700"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-purple-50/50' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                                {notification.actor_avatar ? (
                                                    <img
                                                        src={notification.actor_avatar}
                                                        alt=""
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    getNotificationIcon(notification.notification_type)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800">
                                                    {notification.actor_name && (
                                                        <span className="font-medium">{notification.actor_name} </span>
                                                    )}
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {notification.time_ago}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block p-3 text-center text-sm text-purple-600 hover:bg-gray-50 border-t border-gray-100"
                        >
                            View all notifications
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
