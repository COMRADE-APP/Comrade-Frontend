import React, { useEffect, useState } from 'react';
import activityLogService from '../services/activityLog.service';

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' or 'recent'

    useEffect(() => {
        fetchActivities();
        fetchStats();
    }, [filter]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const data = filter === 'recent'
                ? await activityLogService.getRecentActivities()
                : await activityLogService.getActivities();
            setActivities(data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await activityLogService.getActivityStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getActionIcon = (actionType) => {
        const icons = {
            login: '🔓',
            logout: '🔒',
            register: '📝',
            profile_update: '👤',
            password_change: '🔑',
            room_join: '🚪',
            message_send: '💬',
            file_upload: '📤',
            permission_grant: '✅',
            oauth_login: '🌐',
        };
        return icons[actionType] || '📋';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Activity Log</h1>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_activities}</p>
                        </div>
                        {Object.entries(stats.by_action_type || {}).slice(0, 2).map(([type, count]) => (
                            <div key={type} className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500">{type.replace('_', ' ')}</h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setFilter('all')}
                                className={`${filter === 'all'
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                All Activities
                            </button>
                            <button
                                onClick={() => setFilter('recent')}
                                className={`${filter === 'recent'
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Last 24 Hours
                            </button>
                        </nav>
                    </div>

                    {/* Activity Timeline */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading activities...</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No activities found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 border-l-2 border-gray-200 pl-4 py-2">
                                        <span className="text-2xl">{getActionIcon(activity.action_type)}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.action_type.replace('_', ' ').toUpperCase()}
                                            </p>
                                            {activity.description && (
                                                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                <span>{formatDate(activity.created_at)}</span>
                                                {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;
