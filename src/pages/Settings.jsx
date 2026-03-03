import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../contexts/ThemeContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ThemeSwitcher from '../components/common/ThemeSwitcher';
import ResizeControl from '../components/common/ResizeControl';
import authService from '../services/auth.service';
import activityLogService from '../services/activityLog.service';
import {
    Shield, Lock, Eye, EyeOff, Bell, Globe, User, AlertTriangle,
    UserCog, Palette, Languages, Send, CheckCircle, XCircle, Clock, Mail,
    Activity, Download, FileText, Calendar, ExternalLink, Loader2, Save, Pencil
} from 'lucide-react';

const USER_TYPE_OPTIONS = [
    { value: 'student', label: 'Student' },
    { value: 'normal_user', label: 'Normal User' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'staff', label: 'Staff' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'author', label: 'Author' },
    { value: 'editor', label: 'Editor' },
];


const AppleLogo = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

const XLogo = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const Settings = () => {
    const { user, logout, updateUser } = useAuth();
    const { theme, setTheme: changeTheme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('account');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile fetch state
    const [profileData, setProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        eventUpdates: true,
    });
    const [savingNotifications, setSavingNotifications] = useState(false);

    const [roleChangeRequest, setRoleChangeRequest] = useState({
        requestedRole: '',
        reason: '',
    });

    const [appearance, setAppearance] = useState({
        theme: 'light',
        fontSize: 'medium',
    });

    // Activity state
    const [activities, setActivities] = useState([]);
    const [activityStats, setActivityStats] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState('json');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const data = await authService.getProfile();
                setProfileData(data);
                setProfileForm({
                    first_name: data?.user?.first_name || data?.first_name || user?.first_name || '',
                    last_name: data?.user?.last_name || data?.last_name || user?.last_name || '',
                    phone_number: data?.user?.phone_number || data?.phone_number || user?.phone_number || '',
                });
                // Load notification settings from profile
                if (data?.notification_preferences || data?.user_profile) {
                    const prefs = data.notification_preferences || data.user_profile || {};
                    setNotificationSettings(prev => ({
                        emailNotifications: prefs.email_notifications ?? prev.emailNotifications,
                        pushNotifications: prefs.push_notifications ?? prev.pushNotifications,
                        taskReminders: prefs.task_reminders ?? prev.taskReminders,
                        eventUpdates: prefs.event_updates ?? prev.eventUpdates,
                    }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback to auth context user data
                setProfileForm({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    phone_number: user?.phone_number || '',
                });
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await authService.updateProfile(profileForm);
            updateUser(profileForm);
            setEditingProfile(false);
            showMessage('success', 'Profile updated successfully');
        } catch (error) {
            showMessage('error', error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleNotificationToggle = async (key, backendKey) => {
        const newValue = !notificationSettings[key];
        setNotificationSettings(prev => ({ ...prev, [key]: newValue }));
        try {
            await authService.updateProfile({ [backendKey]: newValue });
        } catch (error) {
            // Revert on failure
            setNotificationSettings(prev => ({ ...prev, [key]: !newValue }));
            showMessage('error', 'Failed to update notification setting');
        }
    };

    // Load activity data when activity tab is active
    useEffect(() => {
        if (activeTab === 'activity') {
            loadActivityData();
        }
    }, [activeTab]);

    const loadActivityData = async () => {
        setActivityLoading(true);
        try {
            const [activitiesData, statsData] = await Promise.all([
                activityLogService.getActivities().catch(() => []),
                activityLogService.getActivityStats().catch(() => null),
            ]);
            setActivities(Array.isArray(activitiesData?.results) ? activitiesData.results : Array.isArray(activitiesData) ? activitiesData : []);
            setActivityStats(statsData);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setActivityLoading(false);
        }
    };

    const handleExportActivity = async () => {
        try {
            await activityLogService.exportActivityLog(exportFormat, exportStartDate || null, exportEndDate || null);
            showMessage('success', `Activity log exported as ${exportFormat.toUpperCase()}`);
        } catch (error) {
            showMessage('error', 'Failed to export activity log');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            showMessage('success', 'Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showMessage('error', error.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        try {
            // TODO: Implement 2FA toggle API call
            setTwoFactorEnabled(!twoFactorEnabled);
            showMessage('success', twoFactorEnabled ? '2FA disabled' : '2FA enabled');
        } catch (error) {
            showMessage('error', 'Failed to toggle 2FA');
        }
    };

    const handleRoleChangeRequest = async (e) => {
        e.preventDefault();
        if (!roleChangeRequest.requestedRole || !roleChangeRequest.reason) {
            showMessage('error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await authService.requestRoleChange({
                current_role: user?.user_type || 'student',
                requested_role: roleChangeRequest.requestedRole,
                reason: roleChangeRequest.reason,
            });
            showMessage('success', 'Role change request submitted successfully. We will review and notify you.');
            setRoleChangeRequest({ requestedRole: '', reason: '' });
        } catch (error) {
            showMessage('error', error.response?.data?.detail || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone.'
        );
        if (!confirmed) return;

        try {
            // TODO: Implement account deletion API call
            showMessage('success', 'Account deletion requested');
            logout();
        } catch (error) {
            showMessage('error', 'Failed to delete account');
        }
    };

    const portalLinks = [
        { label: 'Staff Portal', path: ROUTES.PORTALS?.STAFF_PORTAL || '/portal/staff', roles: ['staff'], icon: '🏢' },
        { label: 'Author Portal', path: ROUTES.PORTALS?.AUTHOR_PORTAL || '/portal/author', roles: ['author', 'staff'], icon: '✍️' },
        { label: 'Editor Portal', path: ROUTES.PORTALS?.EDITOR_PORTAL || '/portal/editor', roles: ['editor', 'staff'], icon: '📝' },
        { label: 'Moderator Portal', path: ROUTES.PORTALS?.MODERATOR_PORTAL || '/portal/moderator', roles: ['moderator', 'staff'], icon: '🛡️' },
        { label: 'Lecturer Portal', path: ROUTES.PORTALS?.LECTURER_PORTAL || '/portal/lecturer', roles: ['lecturer', 'staff'], icon: '🎓' },
        { label: 'Institution Admin', path: ROUTES.PORTALS?.INSTITUTION_PORTAL || '/portal/institution', roles: ['institution_admin', 'staff'], icon: '🏛️' },
        { label: 'Organization Admin', path: ROUTES.PORTALS?.ORG_PORTAL || '/portal/organization', roles: ['org_admin', 'staff'], icon: '🏗️' },
        { label: 'Partner Portal', path: ROUTES.PORTALS?.PARTNER_PORTAL || '/portal/partner', roles: ['partner', 'staff'], icon: '🤝' },
        { label: 'Admin Dashboard', path: ROUTES.ADMIN_PORTAL || '/admin', roles: ['staff'], icon: '⚙️' },
    ];

    const userPortals = user?.is_staff
        ? portalLinks
        : portalLinks.filter(p => p.roles.some(r => user?.user_type === r || user?.roles?.includes(r)));

    const tabs = [
        { id: 'account', label: 'Account', icon: UserCog },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'privacy', label: 'Privacy', icon: Lock },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'portals', label: 'Other Portals', icon: ExternalLink },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Settings</h1>
                <p className="text-secondary mt-1">Manage your account and preferences</p>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                    : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-theme overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Account Tab */}
            {activeTab === 'account' && (
                <div className="space-y-6">
                    {/* User Info Card */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Account Information
                                </h3>
                                {!editingProfile ? (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                                        <Pencil className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingProfile(false); setProfileForm({ first_name: profileData?.user?.first_name || user?.first_name || '', last_name: profileData?.user?.last_name || user?.last_name || '', phone_number: profileData?.user?.phone_number || user?.phone_number || '' }); }}>
                                            Cancel
                                        </Button>
                                        <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                                            <Save className="w-4 h-4 mr-1" /> {savingProfile ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            {profileLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                                    <span className="text-secondary text-sm">Loading profile...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">First Name</label>
                                            {editingProfile ? (
                                                <input
                                                    className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary"
                                                    value={profileForm.first_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-primary">{profileData?.user?.first_name || user?.first_name || '—'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Last Name</label>
                                            {editingProfile ? (
                                                <input
                                                    className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary"
                                                    value={profileForm.last_name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-primary">{profileData?.user?.last_name || user?.last_name || '—'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                                            <p className="text-primary">{profileData?.user?.email || user?.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">User Type</label>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 capitalize">
                                                {(profileData?.user?.user_type || user?.user_type || 'student').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Phone</label>
                                            {editingProfile ? (
                                                <input
                                                    className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary"
                                                    value={profileForm.phone_number}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                                                    placeholder="Enter phone number"
                                                />
                                            ) : (
                                                <p className="text-primary">{profileData?.user?.phone_number || user?.phone_number || 'Not set'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Your Portal Quick Access */}
                    {(() => {
                        const portalMap = {
                            staff: { path: ROUTES.STAFF_PORTAL, label: 'Staff Portal', icon: '🔧', desc: 'User assistance, activity feed, and platform overview tools', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
                            author: { path: ROUTES.AUTHOR_PORTAL, label: 'Author Portal', icon: '✍️', desc: 'Content creation hub with drafts, analytics, and publishing', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
                            editor: { path: ROUTES.AUTHOR_PORTAL, label: 'Editor Portal', icon: '✍️', desc: 'Content management, editorial tools, and publishing', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
                            creator: { path: ROUTES.AUTHOR_PORTAL, label: 'Creator Portal', icon: '🎨', desc: 'Create and manage your content, rooms, and resources', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
                            moderator: { path: ROUTES.MODERATOR_PORTAL, label: 'Moderator Portal', icon: '🛡️', desc: 'Content review, community health, and moderation tools', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
                            lecturer: { path: ROUTES.LECTURER_PORTAL, label: 'Lecturer Portal', icon: '🎓', desc: 'Teaching tools, room management, and academic resources', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
                            student: { path: '/dashboard', label: 'Student Dashboard', icon: '📚', desc: 'Your courses, assignments, and academic progress', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
                            student_admin: { path: '/dashboard', label: 'Student Admin Dashboard', icon: '📋', desc: 'Student governance tools and administrative features', gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
                            normal_user: { path: '/dashboard', label: 'My Dashboard', icon: '🏠', desc: 'Your activity, bookmarks, and personalized feed', gradient: 'linear-gradient(135deg, #64748b, #94a3b8)' },
                            institutional_admin: { path: ROUTES.INSTITUTION_PORTAL, label: 'Institution Portal', icon: '🏛️', desc: 'Manage your institution, members, and verifications', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
                            institutional_staff: { path: ROUTES.INSTITUTION_PORTAL, label: 'Institution Portal', icon: '🏛️', desc: 'Institution tools and member management', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
                            organisational_admin: { path: ROUTES.INSTITUTION_PORTAL, label: 'Organisation Portal', icon: '🏢', desc: 'Manage your organisation and members', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
                            organisational_staff: { path: ROUTES.INSTITUTION_PORTAL, label: 'Organisation Portal', icon: '🏢', desc: 'Organisation tools and management', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
                            partner: { path: ROUTES.INSTITUTION_PORTAL, label: 'Partner Portal', icon: '🤝', desc: 'Product management, sales, and business tools', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
                        };
                        const portal = portalMap[user?.user_type];
                        const isAdmin = user?.is_admin || user?.is_superuser;
                        if (!portal && !isAdmin) return null;
                        return (
                            <Card>
                                <CardBody>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '0.875rem',
                                            background: portal?.gradient || 'linear-gradient(135deg, #6366f1, #818cf8)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.6rem', flexShrink: 0,
                                        }}>
                                            {portal?.icon || '🛡️'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 className="font-semibold text-primary" style={{ margin: 0 }}>
                                                {portal?.label || 'Admin Portal'}
                                            </h3>
                                            <p className="text-secondary" style={{ fontSize: '0.83rem', margin: '0.15rem 0 0' }}>
                                                {portal?.desc || 'Full platform administration'}
                                            </p>
                                        </div>
                                        <Link
                                            to={portal?.path || ROUTES.ADMIN_PORTAL}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                padding: '0.5rem 1.15rem', borderRadius: '0.6rem',
                                                background: portal?.gradient || 'linear-gradient(135deg, #6366f1, #818cf8)',
                                                color: 'white', fontWeight: 600, fontSize: '0.83rem',
                                                textDecoration: 'none', whiteSpace: 'nowrap',
                                                transition: 'transform 0.15s, box-shadow 0.15s',
                                            }}
                                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; }}
                                            onMouseLeave={(e) => { e.target.style.transform = ''; e.target.style.boxShadow = ''; }}
                                        >
                                            Open Portal →
                                        </Link>
                                    </div>
                                    {isAdmin && portal && (
                                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                                            <Link
                                                to={ROUTES.ADMIN_PORTAL}
                                                className="text-secondary"
                                                style={{ fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                🛡️ You also have access to the <strong style={{ marginLeft: '0.15rem' }}>Admin Portal</strong> →
                                            </Link>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        );
                    })()}

                    {/* Role Change Request */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <UserCog className="w-5 h-5" />
                                Request Role Change
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <p className="text-sm text-secondary mb-4">
                                Need a different role? Submit a request and our team will review it.
                            </p>
                            <form onSubmit={handleRoleChangeRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">
                                        Requested Role
                                    </label>
                                    <select
                                        value={roleChangeRequest.requestedRole}
                                        onChange={(e) => setRoleChangeRequest({ ...roleChangeRequest, requestedRole: e.target.value })}
                                        className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary"
                                    >
                                        <option value="">Select a role...</option>
                                        {USER_TYPE_OPTIONS.filter(opt => opt.value !== user?.user_type).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">
                                        Reason for Request
                                    </label>
                                    <textarea
                                        value={roleChangeRequest.reason}
                                        onChange={(e) => setRoleChangeRequest({ ...roleChangeRequest, reason: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary"
                                        placeholder="Please explain why you need this role change..."
                                    />
                                </div>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    <Send className="w-4 h-4 mr-2" />
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </form>
                        </CardBody>
                    </Card>

                    {/* Linked Accounts */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Linked Accounts
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {[
                                    { name: 'Google', connected: true, icon: Mail },
                                    { name: 'Apple', connected: false, icon: AppleLogo },
                                    { name: 'X (formerly Twitter)', connected: false, icon: XLogo },
                                ].map((account) => {
                                    const Icon = account.icon;
                                    return (
                                        <div key={account.name} className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-primary">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium text-primary">{account.name}</span>
                                            </div>
                                            {account.connected ? (
                                                <span className="text-sm text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Connected
                                                </span>
                                            ) : (
                                                <Button variant="outline" size="sm">Connect</Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Change Password */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Change Password
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <Input
                                    label="Current Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                    className="bg-primary border-theme text-primary"
                                />
                                <Input
                                    label="New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    className="bg-primary border-theme text-primary"
                                />
                                <Input
                                    label="Confirm New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    className="bg-primary border-theme text-primary"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showPassword"
                                        checked={showPassword}
                                        onChange={(e) => setShowPassword(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 border-theme rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="showPassword" className="text-sm text-primary">
                                        Show passwords
                                    </label>
                                </div>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </form>
                        </CardBody>
                    </Card>

                    {/* Two-Factor Authentication */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Two-Factor Authentication (2FA)
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-primary">Enable 2FA</h4>
                                    <p className="text-sm text-secondary">Add an extra layer of security to your account</p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-primary-600' : 'bg-secondary'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Active Sessions */}
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Active Sessions
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-primary">Current Device</h4>
                                        <p className="text-sm text-secondary">Windows • Chrome</p>
                                        <p className="text-xs text-tertiary">Last active: Just now</p>
                                    </div>
                                    <span className="text-xs text-green-600 font-medium">Active</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-4">
                                Sign Out All Devices
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notification Preferences
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNotifications', backendKey: 'email_notifications', label: 'Email Notifications', description: 'Receive email updates' },
                                    { key: 'pushNotifications', backendKey: 'push_notifications', label: 'Push Notifications', description: 'Receive browser notifications' },
                                    { key: 'taskReminders', backendKey: 'task_reminders', label: 'Task Reminders', description: 'Get reminded about pending tasks' },
                                    { key: 'eventUpdates', backendKey: 'event_updates', label: 'Event Updates', description: 'Receive updates about events' },
                                ].map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                                        <div>
                                            <h4 className="font-medium text-primary">{setting.label}</h4>
                                            <p className="text-sm text-secondary">{setting.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleNotificationToggle(setting.key, setting.backendKey)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings[setting.key] ? 'bg-primary-600' : 'bg-secondary'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="space-y-6">
                    <Card className="overflow-visible">
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Theme
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="flex justify-start">
                                <ThemeSwitcher />
                            </div>
                        </CardBody>
                    </Card>

                    {/* Display Size */}
                    <ResizeControl />

                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Languages className="w-5 h-5" />
                                Language & Region
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Language</label>
                                    <select className="w-full px-4 py-2 border border-theme bg-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-primary">
                                        <option value="en">English</option>
                                        <option value="sw">Kiswahili</option>
                                        <option value="fr">Français</option>
                                    </select>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )
            }

            {/* Privacy Tab */}
            {
                activeTab === 'privacy' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Profile Visibility
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                    {/* Activity Status */}
                                    <div className="flex items-center justify-between py-3 border-b border-theme">
                                        <div>
                                            <h4 className="font-medium text-primary">Show Activity Status</h4>
                                            <p className="text-sm text-secondary">Allow others to see when you're online or last seen</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const newStatus = !user?.user_profile?.show_activity_status;
                                                    await authService.updateProfile({ show_activity_status: newStatus });
                                                    updateUser({
                                                        user_profile: {
                                                            ...user?.user_profile,
                                                            show_activity_status: newStatus,
                                                        }
                                                    });
                                                    showMessage('success', 'Privacy setting updated');
                                                } catch (error) {
                                                    showMessage('error', 'Failed to update setting');
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user?.user_profile?.show_activity_status ? 'bg-primary-600' : 'bg-secondary'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.user_profile?.show_activity_status ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Read Receipts */}
                                    <div className="flex items-center justify-between py-3 border-b border-theme">
                                        <div>
                                            <h4 className="font-medium text-primary">Read Receipts</h4>
                                            <p className="text-sm text-secondary">Allow others to see when you've read their messages</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const newStatus = !user?.user_profile?.show_read_receipts;
                                                    await authService.updateProfile({ show_read_receipts: newStatus });
                                                    updateUser({
                                                        user_profile: {
                                                            ...user?.user_profile,
                                                            show_read_receipts: newStatus,
                                                        }
                                                    });
                                                    showMessage('success', 'Privacy setting updated');
                                                } catch (error) {
                                                    showMessage('error', 'Failed to update setting');
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user?.user_profile?.show_read_receipts ? 'bg-primary-600' : 'bg-secondary'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.user_profile?.show_read_receipts ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                                        <div>
                                            <h4 className="font-medium text-primary">Public Profile</h4>
                                            <p className="text-sm text-secondary">Allow others to view your profile</p>
                                        </div>
                                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary">
                                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-red-200 dark:border-red-900/50">
                            <CardHeader className="p-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
                                <h3 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Danger Zone
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-primary">Delete Account</h4>
                                        <p className="text-sm text-secondary mt-1">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                    </div>
                                    <Button variant="danger" onClick={handleDeleteAccount}>
                                        Delete My Account
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Activity Tab */}
            {
                activeTab === 'activity' && (
                    <div className="space-y-6">
                        {/* Activity Stats */}
                        {activityStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Actions', value: activityStats.total_actions || 0, color: 'blue' },
                                    { label: 'This Week', value: activityStats.this_week || 0, color: 'green' },
                                    { label: 'Sessions', value: activityStats.total_sessions || 0, color: 'purple' },
                                    { label: 'Today', value: activityStats.today || 0, color: 'amber' },
                                ].map((stat, idx) => (
                                    <Card key={idx}>
                                        <CardBody className="p-4 text-center">
                                            <p className="text-2xl font-bold text-primary">{stat.value}</p>
                                            <p className="text-xs text-secondary mt-1">{stat.label}</p>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Recent Activity
                                </h3>
                                <Link
                                    to="/activity"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary/5 rounded-lg transition"
                                >
                                    View All Activity →
                                </Link>
                            </CardHeader>
                            <CardBody className="p-0">
                                {activityLoading ? (
                                    <div className="p-8 text-center text-secondary">Loading activity...</div>
                                ) : activities.length === 0 ? (
                                    <div className="p-8 text-center text-secondary">No activity recorded yet.</div>
                                ) : (
                                    <div className="divide-y divide-theme max-h-96 overflow-y-auto">
                                        {activities.slice(0, 20).map((activity, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-secondary/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Activity className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">
                                                            {activity.description || activity.activity_type || 'Action'}
                                                        </p>
                                                        <p className="text-xs text-secondary">
                                                            {activity.created_at ? new Date(activity.created_at).toLocaleString() : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Export */}
                        <Card>
                            <CardHeader className="p-4 border-b border-theme">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Export Activity Log
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Format</label>
                                            <select
                                                value={exportFormat}
                                                onChange={(e) => setExportFormat(e.target.value)}
                                                className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            >
                                                <option value="json">JSON</option>
                                                <option value="csv">CSV</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={exportStartDate}
                                                onChange={(e) => setExportStartDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={exportEndDate}
                                                onChange={(e) => setExportEndDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={handleExportActivity}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export as {exportFormat.toUpperCase()}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Other Portals Tab */}
            {activeTab === 'portals' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="p-4 border-b border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <ExternalLink className="w-5 h-5" />
                                Other Portals
                            </h3>
                            <p className="text-sm text-secondary mt-1">Quick links to your available portals based on your role</p>
                        </CardHeader>
                        <CardBody>
                            {userPortals.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {userPortals.map((portal, i) => (
                                        <Link
                                            key={i}
                                            to={portal.path}
                                            className="flex items-center gap-3 p-4 bg-secondary/20 hover:bg-secondary/40 rounded-xl border border-transparent hover:border-theme transition-all group"
                                        >
                                            <span className="text-2xl">{portal.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-primary group-hover:text-primary-400 transition-colors">{portal.label}</p>
                                                <p className="text-xs text-tertiary">{portal.path}</p>
                                            </div>
                                            <ExternalLink size={16} className="text-tertiary group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                                        <ExternalLink size={24} className="text-tertiary opacity-50" />
                                    </div>
                                    <h4 className="font-medium text-primary mb-1">No additional portals available</h4>
                                    <p className="text-sm text-secondary max-w-sm">Portals will appear here based on your role. Request a role change from the Account tab if needed.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}
        </div >
    );
};

export default Settings;
