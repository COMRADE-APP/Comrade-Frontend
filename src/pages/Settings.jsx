import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Shield, Lock, Eye, EyeOff, Bell, Globe, User, AlertTriangle } from 'lucide-react';

const Settings = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('security');
    const [showPassword, setShowPassword] = useState(false);
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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            // TODO: Implement password change API call
            alert('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert('Failed to change password');
        }
    };

    const handleToggle2FA = async () => {
        try {
            // TODO: Implement 2FA toggle API call
            setTwoFactorEnabled(!twoFactorEnabled);
            alert(twoFactorEnabled ? '2FA disabled' : '2FA enabled');
        } catch (error) {
            alert('Failed to toggle 2FA');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone.'
        );
        if (!confirmed) return;

        try {
            // TODO: Implement account deletion API call
            alert('Account deleted');
            logout();
        } catch (error) {
            alert('Failed to delete account');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'privacy', label: 'Privacy', icon: Lock },
                    ].map((tab) => {
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
                                <Button variant="primary" type="submit">
                                    Update Password
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
