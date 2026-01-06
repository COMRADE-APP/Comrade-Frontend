import React, { useEffect, useState } from 'react';
import permissionsService from '../services/permissions.service';

const PermissionsSettings = () => {
    const [permissions, setPermissions] = useState([]);
    const [audit, setAudit] = useState([]);
    const [loading, setLoading] = useState(true);

    const permissionInfo = {
        camera: {
            icon: '📷',
            title: 'Camera Access',
            description: 'Allow access to your camera for video chat and profile photos',
        },
        microphone: {
            icon: '🎤',
            title: 'Microphone Access',
            description: 'Allow access to your microphone for voice chat and audio messages',
        },
        location: {
            icon: '📍',
            title: 'Location Services',
            description: 'Allow access to your location for location-based features',
        },
        files: {
            icon: '📁',
            title: 'File Access',
            description: 'Allow file uploads and downloads',
        },
        notifications: {
            icon: '🔔',
            title: 'Notifications',
            description: 'Receive notifications about messages and updates',
        },
    };

    useEffect(() => {
        fetchPermissions();
        fetchAudit();
    }, []);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const data = await permissionsService.getPermissions();
            setPermissions(data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAudit = async () => {
        try {
            const data = await permissionsService.getPermissionAudit();
            setAudit(data);
        } catch (error) {
            console.error('Error fetching audit:', error);
        }
    };

    const handleRequestPermission = async (permissionType) => {
        try {
            const info = permissionInfo[permissionType];

            // Request browser permission first (for camera, microphone, location)
            if (['camera', 'microphone', 'location'].includes(permissionType)) {
                const browserResult = await permissionsService.requestBrowserPermission(permissionType);
                if (!browserResult.granted) {
                    alert(`Browser permission denied for ${info.title}. Please enable it in your browser settings.`);
                    return;
                }
            }

            // Then request from backend
            await permissionsService.requestPermission(
                permissionType,
                `User requested ${info.title}`,
                info.title,
                window.location.pathname
            );

            alert(`${info.title} granted successfully!`);
            fetchPermissions();
            fetchAudit();
        } catch (error) {
            console.error('Error requesting permission:', error);
            alert('Failed to request permission');
        }
    };

    const handleRevokePermission = async (permissionId, permissionType) => {
        if (!confirm(`Are you sure you want to revoke ${permissionInfo[permissionType]?.title}?`)) return;

        try {
            await permissionsService.revokePermission(permissionId);
            fetchPermissions();
            fetchAudit();
        } catch (error) {
            console.error('Error revoking permission:', error);
            alert('Failed to revoke permission');
        }
    };

    const hasPermission = (permissionType) => {
        return permissions.find(p => p.permission_type === permissionType && p.is_active);
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
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Permissions Settings</h1>

                <p className="text-gray-600 mb-8">
                    Manage permissions for various features. Grant or revoke access to your camera, microphone, location, and other resources.
                </p>

                {/* Permissions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.entries(permissionInfo).map(([type, info]) => {
                        const permission = hasPermission(type);
                        const isGranted = !!permission;

                        return (
                            <div key={type} className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <span className="text-3xl">{info.icon}</span>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                                            {isGranted && permission.granted_at && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Granted on {formatDate(permission.granted_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        {isGranted ? (
                                            <>
                                                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                    ✓ Granted
                                                </span>
                                                <button
                                                    onClick={() => handleRevokePermission(permission.id, type)}
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                >
                                                    Revoke
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleRequestPermission(type)}
                                                className="px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                                            >
                                                Grant Access
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Audit Log */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Permission History</h2>
                    </div>
                    <div className="p-6">
                        {audit.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No permission history</p>
                        ) : (
                            <div className="space-y-3">
                                {audit.slice(0, 10).map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-3">
                                            <span>{permissionInfo[entry.permission_type]?.icon || '📋'}</span>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {permissionInfo[entry.permission_type]?.title || entry.permission_type}
                                                </p>
                                                <p className="text-gray-600">
                                                    {entry.action === 'granted' ? 'Permission granted' : 'Permission revoked'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-gray-500 text-xs">{formatDate(entry.created_at)}</span>
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

export default PermissionsSettings;
