import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ThemeSwitcher from '../components/common/ThemeSwitcher';
import authService from '../services/auth.service';
import {
    Shield, Lock, Eye, EyeOff, Bell, Globe, User, AlertTriangle,
    UserCog, Palette, Languages, Send, CheckCircle, XCircle, Clock, Mail
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
    const { user, logout } = useAuth();
    const { theme, setTheme: changeTheme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('account');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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

    const [roleChangeRequest, setRoleChangeRequest] = useState({
        requestedRole: '',
        reason: '',
    });

    const [appearance, setAppearance] = useState({
        theme: 'light',
        fontSize: 'medium',
    });

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

    const tabs = [
        { id: 'account', label: 'Account', icon: UserCog },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'privacy', label: 'Privacy', icon: Lock },
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
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Account Information
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Name</label>
                                        <p className="text-primary">{user?.first_name} {user?.last_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                                        <p className="text-primary">{user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">User Type</label>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 capitalize">
                                            {user?.user_type?.replace('_', ' ') || 'Student'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Phone</label>
                                        <p className="text-primary">{user?.phone_number || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

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
                                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates' },
                                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser notifications' },
                                    { key: 'taskReminders', label: 'Task Reminders', description: 'Get reminded about pending tasks' },
                                    { key: 'eventUpdates', label: 'Event Updates', description: 'Receive updates about events' },
                                ].map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                                        <div>
                                            <h4 className="font-medium text-primary">{setting.label}</h4>
                                            <p className="text-sm text-secondary">{setting.description}</p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    [setting.key]: !notificationSettings[setting.key],
                                                })
                                            }
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
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
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
                                                // Optimistic update (if user object is structured this way, else fetch profile)
                                                // Better to just call API and reload
                                                await authService.updateProfile({ show_activity_status: newStatus });
                                                // Ideally we should reload user context or profile here. 
                                                // For now, assuming authService.getCurrentUser() will be called or page reload
                                                showMessage('success', 'Privacy setting updated');
                                                // Trigger a reload of user data if possible, or just let the user know
                                                setTimeout(() => window.location.reload(), 500); // Simple reload to refresh context
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
                                                showMessage('success', 'Privacy setting updated');
                                                setTimeout(() => window.location.reload(), 500);
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
            )}
        </div>
    );
};

export default Settings;
