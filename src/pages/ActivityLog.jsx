import React, { useEffect, useState } from 'react';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Activity, Shield, Search, Download, Clock,
    ChevronDown, Eye, EyeOff, ToggleLeft, ToggleRight,
    Wifi, WifiOff, Globe, Lock, Unlock, AlertTriangle
} from 'lucide-react';
import activityLogService from '../services/activityLog.service';

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activities');
    const [activityFilter, setActivityFilter] = useState('');

    // Consent state
    const [consents, setConsents] = useState([]);
    const [consentsLoading, setConsentsLoading] = useState(false);

    // Connection security
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [connectionLogs, setConnectionLogs] = useState([]);

    // Search history
    const [searchHistory, setSearchHistory] = useState([]);

    // Export
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchActivities();
        fetchStats();
    }, [activityFilter]);

    useEffect(() => {
        if (activeTab === 'privacy') fetchConsents();
        if (activeTab === 'security') fetchConnectionInfo();
        if (activeTab === 'searches') fetchSearchHistory();
    }, [activeTab]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = activityFilter ? { type: activityFilter } : {};
            const data = await activityLogService.getActivities(params);
            setActivities(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
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

    const fetchConsents = async () => {
        setConsentsLoading(true);
        try {
            const data = await activityLogService.getAllConsents();
            setConsents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching consents:', error);
        } finally {
            setConsentsLoading(false);
        }
    };

    const fetchConnectionInfo = async () => {
        try {
            const [current, logs] = await Promise.all([
                activityLogService.checkCurrentConnection().catch(() => null),
                activityLogService.getConnectionLogs().catch(() => []),
            ]);
            setConnectionInfo(current);
            setConnectionLogs(Array.isArray(logs?.results) ? logs.results : Array.isArray(logs) ? logs : []);
        } catch (error) {
            console.error('Error fetching connection info:', error);
        }
    };

    const fetchSearchHistory = async () => {
        try {
            const data = await activityLogService.getSearchHistory();
            setSearchHistory(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching search history:', error);
        }
    };

    const handleConsentToggle = async (permissionType, currentlyGranted) => {
        try {
            await activityLogService.updateConsent(permissionType, !currentlyGranted);
            fetchConsents(); // Refresh
        } catch (error) {
            console.error('Error updating consent:', error);
        }
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            await activityLogService.exportActivityLog(format);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Failed to export activity log');
        } finally {
            setExporting(false);
        }
    };

    const getActionIcon = (actionType) => {
        const icons = {
            login: '🔓', logout: '🔒', register: '📝',
            password_change: '🔑', security: '🛡️', device: '📱',
            search: '🔍', page_view: '📄', interaction: '👆',
            settings_change: '⚙️', permission_change: '🔐',
            payment: '💰', group_action: '👥', profile_view: '👤',
            download: '📥', api_request: '🌐', other: '📋',
        };
        return icons[actionType] || '📋';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).format(date);
    };

    const tabs = [
        { id: 'activities', label: 'Activity Log', icon: Activity },
        { id: 'privacy', label: 'Privacy & Consent', icon: Shield },
        { id: 'security', label: 'Connection Security', icon: Wifi },
        { id: 'searches', label: 'Search History', icon: Search },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Activity & Privacy</h1>
                    <p className="text-secondary mt-1">Track your activity, manage consent, and review security</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('csv')}
                        disabled={exporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('json')}
                        disabled={exporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardBody className="p-4">
                            <p className="text-sm text-secondary">Total Activities</p>
                            <p className="text-3xl font-bold text-primary mt-1">{stats.total_activities || 0}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="p-4">
                            <p className="text-sm text-secondary">This Week</p>
                            <p className="text-3xl font-bold text-primary mt-1">{stats.recent_week_count || 0}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="p-4">
                            <p className="text-sm text-secondary">Activity Types</p>
                            <p className="text-3xl font-bold text-primary mt-1">
                                {Object.keys(stats.by_type || {}).length}
                            </p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-theme overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Activities Tab */}
            {activeTab === 'activities' && (
                <Card>
                    <CardHeader className="p-4 border-b border-theme">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-primary">All Activities</h3>
                            <select
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-theme bg-elevated text-primary rounded-lg"
                            >
                                <option value="">All Types</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                                <option value="password_change">Password Change</option>
                                <option value="security">Security</option>
                                <option value="payment">Payment</option>
                                <option value="interaction">Interaction</option>
                                <option value="api_request">API Request</option>
                                <option value="search">Search</option>
                                <option value="permission_change">Permission Change</option>
                                <option value="download">Download</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="p-8 text-center">
                                <Activity className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No activities found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-theme">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="p-4 flex items-start gap-3">
                                        <span className="text-xl mt-0.5">
                                            {getActionIcon(activity.activity_type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary">
                                                {(activity.activity_type || '').replace(/_/g, ' ').toUpperCase()}
                                            </p>
                                            {activity.description && (
                                                <p className="text-sm text-secondary mt-0.5">{activity.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-1 text-xs text-tertiary flex-wrap">
                                                <span>{formatDate(activity.timestamp)}</span>
                                                {activity.request_method && (
                                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                                                        {activity.request_method}
                                                    </span>
                                                )}
                                                {activity.endpoint && (
                                                    <span className="font-mono truncate max-w-[200px]" title={activity.endpoint}>
                                                        {activity.endpoint}
                                                    </span>
                                                )}
                                                {activity.status_code && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${activity.status_code < 300 ? 'bg-green-500/10 text-green-600'
                                                            : activity.status_code < 400 ? 'bg-yellow-500/10 text-yellow-600'
                                                                : 'bg-red-500/10 text-red-600'
                                                        }`}>
                                                        {activity.status_code}
                                                    </span>
                                                )}
                                                {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Privacy & Consent Tab */}
            {activeTab === 'privacy' && (
                <Card>
                    <CardHeader className="p-4 border-b border-theme">
                        <h3 className="font-semibold text-primary">Privacy & Data Consent</h3>
                        <p className="text-sm text-secondary mt-1">
                            Control what data we collect. Toggle permissions on or off at any time.
                        </p>
                    </CardHeader>
                    <CardBody className="p-0">
                        {consentsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="divide-y divide-theme">
                                {consents.map((consent) => (
                                    <div key={consent.permission_type} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${consent.is_granted
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-secondary/10 text-secondary'
                                                }`}>
                                                {consent.is_granted ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary">{consent.label}</p>
                                                <p className="text-xs text-secondary">
                                                    {consent.is_granted
                                                        ? `Granted ${consent.granted_at ? formatDate(consent.granted_at) : ''}`
                                                        : 'Not granted'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleConsentToggle(consent.permission_type, consent.is_granted)}
                                            className="p-1 transition-colors"
                                        >
                                            {consent.is_granted
                                                ? <ToggleRight className="w-8 h-8 text-green-500" />
                                                : <ToggleLeft className="w-8 h-8 text-secondary" />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Connection Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Current Connection */}
                    {connectionInfo && (
                        <Card>
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary">Current Connection</h3>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${connectionInfo.security_level === 'secure'
                                        ? 'bg-green-500/10 text-green-600'
                                        : connectionInfo.security_level === 'warning'
                                            ? 'bg-yellow-500/10 text-yellow-600'
                                            : 'bg-red-500/10 text-red-600'
                                        }`}>
                                        {connectionInfo.security_level === 'secure'
                                            ? <Lock className="w-7 h-7" />
                                            : connectionInfo.security_level === 'warning'
                                                ? <AlertTriangle className="w-7 h-7" />
                                                : <Unlock className="w-7 h-7" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-primary capitalize">
                                            {connectionInfo.security_level} Connection
                                        </p>
                                        <p className="text-sm text-secondary">
                                            {connectionInfo.ip_address} • {connectionInfo.city}, {connectionInfo.country}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3 rounded-lg bg-secondary/5">
                                        <p className="text-xs text-secondary">HTTPS</p>
                                        <p className="font-medium text-primary">
                                            {connectionInfo.is_https ? '✅ Yes' : '❌ No'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/5">
                                        <p className="text-xs text-secondary">VPN</p>
                                        <p className="font-medium text-primary">
                                            {connectionInfo.is_vpn ? '🔒 Detected' : 'Not Detected'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/5">
                                        <p className="text-xs text-secondary">Proxy</p>
                                        <p className="font-medium text-primary">
                                            {connectionInfo.is_proxy ? '⚠️ Detected' : 'Not Detected'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/5">
                                        <p className="text-xs text-secondary">ISP</p>
                                        <p className="font-medium text-primary truncate">{connectionInfo.isp || 'Unknown'}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Connection Logs */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary">Connection History</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            {connectionLogs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Wifi className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                    <p className="text-secondary">No connection logs yet</p>
                                    <p className="text-xs text-tertiary mt-1">
                                        Enable "Internet Connection Info" consent to start tracking
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-theme">
                                    {connectionLogs.slice(0, 20).map((log) => (
                                        <div key={log.id} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.security_level === 'secure'
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-yellow-500/10 text-yellow-600'
                                                    }`}>
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-primary">
                                                        {log.ip_address} • {log.city || 'Unknown'}, {log.country || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-secondary">
                                                        {formatDate(log.checked_at)} • {log.security_level}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Search History Tab */}
            {activeTab === 'searches' && (
                <Card>
                    <CardHeader className="p-4 border-b border-theme">
                        <h3 className="font-semibold text-primary">Search History</h3>
                        <p className="text-sm text-secondary mt-1">
                            Tracked when "Search History" consent is enabled
                        </p>
                    </CardHeader>
                    <CardBody className="p-0">
                        {searchHistory.length === 0 ? (
                            <div className="p-8 text-center">
                                <Search className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No search history</p>
                                <p className="text-xs text-tertiary mt-1">
                                    Enable "Search History" consent to start tracking
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-theme">
                                {searchHistory.map((search) => (
                                    <div key={search.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Search className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-primary">"{search.query}"</p>
                                                <p className="text-xs text-secondary">
                                                    {search.search_type} • {search.results_count} results • {formatDate(search.searched_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default ActivityLog;
