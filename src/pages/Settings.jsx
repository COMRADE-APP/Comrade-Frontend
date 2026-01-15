import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import authService from '../services/auth.service';
import {
    Shield, Lock, Eye, EyeOff, Bell, Globe, User, AlertTriangle,
    UserCog, Palette, Languages, Send, CheckCircle, XCircle, Clock
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Account Information
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <p className="text-gray-900">{user?.first_name} {user?.last_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <p className="text-gray-900">{user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 capitalize">
                                            {user?.user_type?.replace('_', ' ') || 'Student'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <p className="text-gray-900">{user?.phone_number || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Role Change Request */}
                    <Card>
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <UserCog className="w-5 h-5" />
                                Request Role Change
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <p className="text-sm text-gray-600 mb-4">
                                Need a different role? Submit a request and our team will review it.
                            </p>
                            <form onSubmit={handleRoleChangeRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Requested Role
                                    </label>
                                    <select
                                        value={roleChangeRequest.requestedRole}
                                        onChange={(e) => setRoleChangeRequest({ ...roleChangeRequest, requestedRole: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select a role...</option>
                                        {USER_TYPE_OPTIONS.filter(opt => opt.value !== user?.user_type).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Request
                                    </label>
                                    <textarea
                                        value={roleChangeRequest.reason}
                                        onChange={(e) => setRoleChangeRequest({ ...roleChangeRequest, reason: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Linked Accounts
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {[
                                    { name: 'Google', connected: true, icon: '🔗' },
                                    { name: 'Apple', connected: false, icon: '🍎' },
                                    { name: 'X (Twitter)', connected: false, icon: '𝕏' },
                                ].map((account) => (
                                    <div key={account.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{account.icon}</span>
                                            <span className="font-medium text-gray-900">{account.name}</span>
                                        </div>
                                        {account.connected ? (
                                            <span className="text-sm text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Connected
                                            </span>
                                        ) : (
                                            <Button variant="outline" size="sm">Connect</Button>
                                        )}
                                    </div>
                                ))}
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
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
                                />
                                <Input
                                    label="New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Confirm New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showPassword"
                                        checked={showPassword}
                                        onChange={(e) => setShowPassword(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="showPassword" className="text-sm text-gray-700">
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Two-Factor Authentication (2FA)
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Enable 2FA</h4>
                                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Active Sessions
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Current Device</h4>
                                        <p className="text-sm text-gray-600">Windows • Chrome</p>
                                        <p className="text-xs text-gray-500">Last active: Just now</p>
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
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
                                    <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{setting.label}</h4>
                                            <p className="text-sm text-gray-600">{setting.description}</p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    [setting.key]: !notificationSettings[setting.key],
                                                })
                                            }
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings[setting.key] ? 'bg-primary-600' : 'bg-gray-200'
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
                    <Card>
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Theme
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: 'light', label: 'Light', icon: '☀️' },
                                    { value: 'dark', label: 'Dark', icon: '🌙' },
                                    { value: 'system', label: 'System', icon: '💻' },
                                ].map((themeOption) => (
                                    <button
                                        key={themeOption.value}
                                        onClick={() => changeTheme(themeOption.value)}
                                        className={`p-4 rounded-lg border-2 transition-all ${theme === themeOption.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-2xl mb-2 block">{themeOption.icon}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{themeOption.label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Languages className="w-5 h-5" />
                                Language & Region
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
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
                        <CardHeader className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Profile Visibility
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {[
                                    { label: 'Public Profile', description: 'Allow others to view your profile' },
                                    { label: 'Show Email', description: 'Display your email on your profile' },
                                    { label: 'Show Activity', description: 'Let others see your recent activity' },
                                ].map((setting, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{setting.label}</h4>
                                            <p className="text-sm text-gray-600">{setting.description}</p>
                                        </div>
                                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-red-200">
                        <CardHeader className="p-4 border-b border-red-200 bg-red-50">
                            <h3 className="font-semibold text-red-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900">Delete Account</h4>
                                    <p className="text-sm text-gray-600 mt-1">
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
