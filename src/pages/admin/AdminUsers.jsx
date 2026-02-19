import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

export default function AdminUsers() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getUsers({
                search, role: roleFilter, status: statusFilter, page, page_size: 25,
            });
            setUsers(res.data.results || []);
            setTotalPages(res.data.total_pages || 1);
            setTotal(res.data.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, statusFilter, page]);

    useEffect(() => { load(); }, [load]);

    const handleToggleActive = async (u) => {
        setActionLoading(`toggle-${u.id}`);
        try {
            await adminService.toggleUserActive(u.id);
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading('');
        }
    };

    const handleRoleChange = async (u, newRole) => {
        setActionLoading(`role-${u.id}`);
        try {
            await adminService.updateUserRole(u.id, newRole);
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading('');
        }
    };

    const roles = ['student', 'lecturer', 'admin', 'staff', 'moderator', 'normal_user',
        'student_admin', 'institutional_admin', 'institutional_staff',
        'organisational_admin', 'organisational_staff', 'author', 'editor', 'partner'];

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="users" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>User Management</h1>
                    <p>{total} users total</p>
                </div>

                {/* Toolbar */}
                <div className="admin-toolbar">
                    <div className="admin-search">
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select className="admin-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                        <option value="">All Roles</option>
                        {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select className="admin-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                        <option value="pending_deletion">Pending Deletion</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : users.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">👥</div>
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="admin-section">
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Last Seen</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                                                </div>
                                            </td>
                                            <td><span className="admin-badge info">{u.user_type?.replace(/_/g, ' ')}</span></td>
                                            <td>
                                                <span className={`admin-badge ${u.is_active ? 'success' : 'danger'}`}>
                                                    {u.is_active ? (u.is_online ? '🟢 Online' : 'Active') : 'Suspended'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {new Date(u.date_joined).toLocaleDateString()}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {u.last_seen ? new Date(u.last_seen).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button
                                                        className="admin-btn sm ghost"
                                                        onClick={() => setSelectedUser(u)}
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        className={`admin-btn sm ${u.is_active ? 'danger' : 'success'}`}
                                                        onClick={() => handleToggleActive(u)}
                                                        disabled={actionLoading === `toggle-${u.id}`}
                                                    >
                                                        {u.is_active ? 'Suspend' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="admin-pagination">
                            <span>Page {page} of {totalPages} ({total} users)</span>
                            <div className="admin-pagination-btns">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Detail Drawer */}
                {selectedUser && (
                    <>
                        <div className="admin-drawer-overlay" onClick={() => setSelectedUser(null)} />
                        <div className="admin-drawer">
                            <div className="admin-drawer-header">
                                <h3>User Details</h3>
                                <button className="admin-drawer-close" onClick={() => setSelectedUser(null)}>✕</button>
                            </div>
                            <div className="admin-drawer-body">
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Name</span>
                                    <span className="admin-info-value">{selectedUser.first_name} {selectedUser.last_name}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Email</span>
                                    <span className="admin-info-value">{selectedUser.email}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Phone</span>
                                    <span className="admin-info-value">{selectedUser.phone_number || '—'}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Role</span>
                                    <span className="admin-info-value">{selectedUser.user_type}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Status</span>
                                    <span className={`admin-badge ${selectedUser.is_active ? 'success' : 'danger'}`}>
                                        {selectedUser.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Account Status</span>
                                    <span className="admin-info-value">{selectedUser.account_status}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Admin</span>
                                    <span className="admin-info-value">{selectedUser.is_admin ? '✅' : '—'}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Staff</span>
                                    <span className="admin-info-value">{selectedUser.is_staff ? '✅' : '—'}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">2FA (TOTP)</span>
                                    <span className="admin-info-value">{selectedUser.totp_enabled ? '✅ Enabled' : 'Disabled'}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Profile Completed</span>
                                    <span className="admin-info-value">{selectedUser.profile_completed ? '✅' : '❌'}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Joined</span>
                                    <span className="admin-info-value">{new Date(selectedUser.date_joined).toLocaleString()}</span>
                                </div>
                                <div className="admin-info-row">
                                    <span className="admin-info-label">Last Seen</span>
                                    <span className="admin-info-value">
                                        {selectedUser.last_seen ? new Date(selectedUser.last_seen).toLocaleString() : '—'}
                                    </span>
                                </div>

                                {/* Role Change */}
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Change Role</h4>
                                    <select
                                        className="admin-select"
                                        style={{ width: '100%' }}
                                        value={selectedUser.user_type}
                                        onChange={(e) => {
                                            if (window.confirm(`Change role to ${e.target.value}?`)) {
                                                handleRoleChange(selectedUser, e.target.value);
                                                setSelectedUser(null);
                                            }
                                        }}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>

                                {/* Actions */}
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className={`admin-btn ${selectedUser.is_active ? 'danger' : 'success'}`}
                                        onClick={() => { handleToggleActive(selectedUser); setSelectedUser(null); }}
                                    >
                                        {selectedUser.is_active ? '🚫 Suspend User' : '✅ Activate User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
