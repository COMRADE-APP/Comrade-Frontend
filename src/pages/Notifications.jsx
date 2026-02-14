import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Settings, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Notifications - Full notifications page
 */
const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async (loadMore = false) => {
        if (!loadMore) setLoading(true);
        try {
            const currentPage = loadMore ? page + 1 : 1;
            const response = await api.get('/api/notifications/', {
                params: {
                    page: currentPage,
                    page_size: 20,
                    is_read: filter === 'unread' ? false : undefined
                }
            });

            const results = response.data.results || response.data || [];

            if (loadMore) {
                setNotifications(prev => [...prev, ...results]);
            } else {
                setNotifications(results);
            }

            setPage(currentPage);
            setHasMore(results.length === 20);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/api/notifications/${id}/mark_read/`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/mark_all_read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const clearAll = async () => {
        if (!confirm('Are you sure you want to delete all notifications?')) return;
        try {
            await api.post('/api/notifications/clear_all/');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
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
            research_update: '📚',
            product_update: '🛍️',
            profile_view: '👀',
        };
        return icons[type] || '🔔';
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-secondary">{unreadCount} unread</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/settings/notifications"
                        className="p-2 text-secondary hover:bg-secondary rounded-lg"
                        title="Notification settings"
                    >
                        <Settings size={20} />
                    </Link>
                </div>
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between mb-4 bg-elevated rounded-xl p-3 border border-theme">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary/10 text-primary'
                            : 'text-secondary hover:bg-secondary'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-primary/10 text-primary'
                            : 'text-secondary hover:bg-secondary'
                            }`}
                    >
                        Unread
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg"
                        >
                            <CheckCheck size={16} />
                            Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg"
                        >
                            <Trash2 size={16} />
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications list */}
            <div className="bg-elevated rounded-xl border border-theme overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-secondary">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-secondary">
                        <Bell size={48} className="mx-auto mb-4 opacity-30" />
                        <h3 className="font-medium text-primary mb-1">No notifications</h3>
                        <p className="text-sm">When you get notifications, they'll show up here</p>
                    </div>
                ) : (
                    <>
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className={`p-4 border-b border-theme hover:bg-tertiary/5 cursor-pointer transition-colors ${!notification.is_read ? 'bg-primary/5' : ''
                                    }`}
                            >
                                <div className="flex gap-4">
                                    {/* Avatar/Icon */}
                                    <div className="flex-shrink-0">
                                        {notification.actor_avatar ? (
                                            <img
                                                src={notification.actor_avatar}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                                                {getNotificationIcon(notification.notification_type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-primary">
                                            {notification.actor_name && (
                                                <Link
                                                    to={`/profile/${notification.extra_data?.actor_id}`}
                                                    className="font-semibold hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {notification.actor_name}
                                                </Link>
                                            )}
                                            {notification.actor_name && ' '}
                                            {notification.message}
                                        </p>

                                        {notification.title && (
                                            <p className="text-sm text-secondary mt-1 font-medium">
                                                {notification.title}
                                            </p>
                                        )}

                                        <p className="text-xs text-tertiary mt-2">
                                            {notification.time_ago}
                                        </p>
                                    </div>

                                    {/* Unread indicator */}
                                    {!notification.is_read && (
                                        <div className="flex-shrink-0">
                                            <div className="w-3 h-3 bg-primary rounded-full" />
                                        </div>
                                    )}
                                </div>

                                {/* Action link */}
                                {notification.action_url && (
                                    <Link
                                        to={notification.action_url}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-3 inline-block text-sm text-primary hover:underline font-medium"
                                    >
                                        View →
                                    </Link>
                                )}
                            </div>
                        ))}

                        {/* Load more */}
                        {hasMore && (
                            <button
                                onClick={() => loadNotifications(true)}
                                className="w-full p-4 text-center text-primary hover:bg-secondary font-medium"
                            >
                                Load more
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Notifications;
