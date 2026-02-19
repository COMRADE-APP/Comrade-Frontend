import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

export default function AdminSettings() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sysInfo, setSysInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        loadSystemInfo();
    }, []);

    const loadSystemInfo = async () => {
        try {
            setLoading(true);
            const res = await adminService.getSystemInfo();
            setSysInfo(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="settings" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>System Settings</h1>
                    <p>Platform configuration and system information</p>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : !sysInfo ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">⚙️</div>
                        <p>Failed to load system information</p>
                    </div>
                ) : (
                    <>
                        {/* System Info */}
                        <div className="admin-section">
                            <div className="admin-section-header"><h3>🖥️ System Information</h3></div>
                            <div className="admin-section-body">
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Django Version</span>
                                    <span className="admin-info-value">{sysInfo.django_version}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Python Version</span>
                                    <span className="admin-info-value">{sysInfo.python_version?.split(' ')[0]}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Total Users</span>
                                    <span className="admin-info-value">{sysInfo.total_users?.toLocaleString()}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Active Users</span>
                                    <span className="admin-info-value">{sysInfo.active_users?.toLocaleString()}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Admin Count</span>
                                    <span className="admin-info-value">{sysInfo.admin_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Users */}
                        <div className="admin-section">
                            <div className="admin-section-header"><h3>🛡️ Platform Administrators</h3></div>
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Since</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(sysInfo.admin_users || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                                    No QomradeAdmin users found
                                                </td>
                                            </tr>
                                        ) : (
                                            sysInfo.admin_users.map((a, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{a.user__first_name} {a.user__last_name}</td>
                                                    <td>{a.user__email}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>
                                                        {a.created_on ? new Date(a.created_on).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="admin-section">
                            <div className="admin-section-header"><h3>🔗 Quick Links</h3></div>
                            <div className="admin-section-body">
                                <div className="admin-quick-actions">
                                    <a
                                        className="admin-quick-action"
                                        href="/admin/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="admin-quick-action-icon">🔧</span>
                                        <span className="admin-quick-action-label">Django Admin</span>
                                    </a>
                                    <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_USERS)}>
                                        <span className="admin-quick-action-icon">👥</span>
                                        <span className="admin-quick-action-label">Manage Users</span>
                                    </div>
                                    <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_ANALYTICS)}>
                                        <span className="admin-quick-action-icon">📈</span>
                                        <span className="admin-quick-action-label">View Analytics</span>
                                    </div>
                                    <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_PORTAL)}>
                                        <span className="admin-quick-action-icon">📊</span>
                                        <span className="admin-quick-action-label">Dashboard</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
