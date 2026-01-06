import React, { useEffect, useState } from 'react';
import deviceManagementService from '../services/deviceManagement.service';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDevices();
        fetchCurrentDevice();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const data = await deviceManagementService.getDevices();
            setDevices(data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentDevice = async () => {
        try {
            const data = await deviceManagementService.getCurrentDevice();
            setCurrentDevice(data);
        } catch (error) {
            console.error('Error fetching current device:', error);
        }
    };

    const handleRevoke = async (deviceId) => {
        if (!confirm('Are you sure you want to revoke this device? You will be logged out on that device.')) return;

        try {
            await deviceManagementService.revokeDevice(deviceId);
            fetchDevices();
        } catch (error) {
            console.error('Error revoking device:', error);
            alert('Failed to revoke device');
        }
    };

    const handleTrust = async (deviceId) => {
        try {
            await deviceManagementService.trustDevice(deviceId);
            fetchDevices();
        } catch (error) {
            console.error('Error trusting device:', error);
            alert('Failed to trust device');
        }
    };

    const getDeviceIcon = (deviceType) => {
        const icons = {
            desktop: '💻',
            mobile: '📱',
            tablet: '📱',
            unknown: '🖥️',
        };
        return icons[deviceType] || '🖥️';
    };

    const getTrustBadge = (trustLevel) => {
        const badges = {
            trusted: { color: 'bg-green-100 text-green-800', text: 'Trusted' },
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            untrusted: { color: 'bg-gray-100 text-gray-800', text: 'Untrusted' },
            suspicious: { color: 'bg-red-100 text-red-800', text: 'Suspicious' },
        };
        return badges[trustLevel] || badges.untrusted;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Device Management</h1>

                <p className="text-gray-600 mb-8">
                    Manage devices that have access to your account. You can revoke access to any device or mark devices as trusted.
                </p>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading devices...</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">No devices found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {devices.map((device) => {
                            const isCurrent = currentDevice && device.id === currentDevice.id;
                            const trustBadge = getTrustBadge(device.trust_level);

                            return (
                                <div
                                    key={device.id}
                                    className={`bg-white rounded-lg shadow p-6 ${isCurrent ? 'ring-2 ring-primary-500' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <span className="text-4xl">{getDeviceIcon(device.device_type)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {device.device_name || `${device.browser} on ${device.os}`}
                                                    </h3>
                                                    {isCurrent && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                            Current Device
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs font-medium ${trustBadge.color} rounded`}>
                                                        {trustBadge.text}
                                                    </span>
                                                </div>

                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        <strong>Browser:</strong> {device.browser} {device.browser_version}
                                                    </p>
                                                    <p>
                                                        <strong>OS:</strong> {device.os} {device.os_version}
                                                    </p>
                                                    <p>
                                                        <strong>Last IP:</strong> {device.last_ip}
                                                    </p>
                                                    {device.last_location && (
                                                        <p>
                                                            <strong>Location:</strong> {device.last_location}
                                                        </p>
                                                    )}
                                                    <p>
                                                        <strong>Last seen:</strong> {formatDate(device.last_seen)}
                                                    </p>
                                                    <p>
                                                        <strong>First seen:</strong> {formatDate(device.first_seen)}
                                                    </p>
                                                </div>

                                                {device.trust_score && (
                                                    <div className="mt-3">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            Risk Score: {device.trust_score.risk_score}/100
                                                        </p>
                                                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${device.trust_score.risk_score > 70
                                                                        ? 'bg-red-600'
                                                                        : device.trust_score.risk_score > 40
                                                                            ? 'bg-yellow-600'
                                                                            : 'bg-green-600'
                                                                    }`}
                                                                style={{ width: `${device.trust_score.risk_score}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col space-y-2 ml-4">
                                            {device.trust_level !== 'trusted' && device.is_active && (
                                                <button
                                                    onClick={() => handleTrust(device.id)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                >
                                                    Trust Device
                                                </button>
                                            )}
                                            {device.is_active && !isCurrent && (
                                                <button
                                                    onClick={() => handleRevoke(device.id)}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                >
                                                    Revoke Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Devices;
