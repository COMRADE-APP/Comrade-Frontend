import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import portalService from '../../services/portal.service';
import { ROUTES } from '../../constants/routes';
import './RolePortal.css';

/* ── Shared Portal Sidebar ── */
export const PortalSidebar = ({ portalName, roleBadge, themeClass, navItems, currentPath }) => {
    const location = useLocation();
    const path = currentPath || location.pathname;

    return (
        <aside className="portal-sidebar">
            <div className="portal-sidebar-header">
                <h2>{portalName}</h2>
                <div className="portal-role-badge">{roleBadge}</div>
            </div>
            <nav>
                {navItems.map((item, i) => (
                    <Link
                        key={i}
                        to={item.path}
                        className={`portal-nav-item ${path === item.path ? 'active' : ''}`}
                    >
                        <span className="portal-nav-icon">{item.icon}</span>
                        {item.label}
                        {item.badge > 0 && (
                            <span className="portal-nav-badge">{item.badge}</span>
                        )}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

/* ── Staff Portal ── */
const StaffPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userTotal, setUserTotal] = useState(0);
    const [selectedUser, setSelectedUser] = useState(null);

    // Auth check
    useEffect(() => {
        if (!user?.is_staff && !user?.is_admin && !user?.is_superuser && user?.user_type !== 'staff') {
            navigate(ROUTES.DASHBOARD);
        }
    }, [user, navigate]);

    // Load dashboard
    useEffect(() => {
        loadDashboard();
    }, []);

    // Load users when switching to users view
    useEffect(() => {
        if (activeView === 'users') loadUsers();
    }, [activeView, userPage, userSearch]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await portalService.getStaffDashboard();
            setData(res.data);
        } catch (err) {
            console.error('Staff dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await portalService.getStaffUsers({
                search: userSearch,
                page: userPage,
                page_size: 15,
            });
            setUsers(res.data.results || []);
            setUserTotal(res.data.count || 0);
        } catch (err) {
            console.error('User load error:', err);
        }
    };

    const debounceSearch = useCallback((() => {
        let timer;
        return (val) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setUserSearch(val);
                setUserPage(1);
            }, 400);
        };
    })(), []);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    }) : '–';

    const navItems = [
        { path: '#', icon: '📊', label: 'Dashboard', badge: 0 },
        { path: '#users', icon: '👥', label: 'User Lookup', badge: 0 },
        { path: '#activity', icon: '📋', label: 'Activity Feed', badge: 0 },
        { path: '#requests', icon: '📨', label: 'Pending Requests', badge: data?.pending_requests?.role_changes || 0 },
    ];

    if (loading && !data) {
        return (
            <div className="portal-layout portal-theme-staff">
                <PortalSidebar
                    portalName="Staff Portal"
                    roleBadge="🔧 Staff"
                    navItems={navItems}
                    currentPath="#"
                />
                <div className="portal-content">
                    <div className="portal-loading"><div className="portal-spinner"></div></div>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-layout portal-theme-staff">
            <PortalSidebar
                portalName="Staff Portal"
                roleBadge="🔧 Staff"
                navItems={navItems}
                currentPath={`#${activeView === 'dashboard' ? '' : activeView}`}
            />
            <div className="portal-content">
                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Staff Dashboard</h1>
                            <p>Platform overview and user assistance tools</p>
                        </div>

                        <div className="portal-stats-grid">
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">👥</div>
                                <div className="portal-stat-value">{data?.total_users || 0}</div>
                                <div className="portal-stat-label">Total Users</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">✅</div>
                                <div className="portal-stat-value">{data?.active_users || 0}</div>
                                <div className="portal-stat-label">Active Users</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">🆕</div>
                                <div className="portal-stat-value">{data?.new_this_week || 0}</div>
                                <div className="portal-stat-label">New This Week</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📝</div>
                                <div className="portal-stat-value">{data?.pending_profiles || 0}</div>
                                <div className="portal-stat-label">Incomplete Profiles</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="portal-section">
                            <div className="portal-section-header">
                                <h3>Quick Actions</h3>
                            </div>
                            <div className="portal-section-body">
                                <div className="portal-actions-grid">
                                    <div className="portal-action-card" onClick={() => setActiveView('users')}>
                                        <span className="portal-action-icon">🔍</span>
                                        <span className="portal-action-label">User Lookup</span>
                                    </div>
                                    <div className="portal-action-card" onClick={() => setActiveView('activity')}>
                                        <span className="portal-action-icon">📋</span>
                                        <span className="portal-action-label">Activity Feed</span>
                                    </div>
                                    <div className="portal-action-card" onClick={() => setActiveView('requests')}>
                                        <span className="portal-action-icon">📨</span>
                                        <span className="portal-action-label">Pending Requests</span>
                                    </div>
                                    <Link className="portal-action-card" to={ROUTES.ANNOUNCEMENTS}>
                                        <span className="portal-action-icon">📢</span>
                                        <span className="portal-action-label">Announcements</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Pending Requests Summary */}
                        <div className="portal-grid-2">
                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Pending Requests</h3></div>
                                <div className="portal-section-body">
                                    <div className="portal-summary-list">
                                        <div className="portal-summary-row">
                                            <span>Role Change Requests</span>
                                            <span>{data?.pending_requests?.role_changes || 0}</span>
                                        </div>
                                        <div className="portal-summary-row">
                                            <span>Account Deletions</span>
                                            <span>{data?.pending_requests?.deletions || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Role Distribution</h3></div>
                                <div className="portal-section-body">
                                    <div className="portal-summary-list">
                                        {(data?.role_distribution || []).slice(0, 6).map((r, i) => (
                                            <div className="portal-summary-row" key={i}>
                                                <span style={{ textTransform: 'capitalize' }}>{(r.user_type || 'unknown').replace('_', ' ')}</span>
                                                <span>{r.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Signups */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Recent Signups</h3></div>
                            <div className="portal-table-wrap">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.recent_signups || []).map((u, i) => (
                                            <tr key={i}>
                                                <td>{u.first_name} {u.last_name}</td>
                                                <td>{u.email}</td>
                                                <td><span className="portal-badge info" style={{ textTransform: 'capitalize' }}>{(u.user_type || '').replace('_', ' ')}</span></td>
                                                <td><span className={`portal-badge ${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                                <td>{formatDate(u.date_joined)}</td>
                                            </tr>
                                        ))}
                                        {(!data?.recent_signups || data.recent_signups.length === 0) && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No recent signups</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Users View */}
                {activeView === 'users' && (
                    <>
                        <div className="portal-page-header">
                            <h1>User Lookup</h1>
                            <p>Search and view user details</p>
                        </div>

                        <div className="portal-toolbar">
                            <div className="portal-search">
                                <span className="portal-search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    onChange={(e) => debounceSearch(e.target.value)}
                                />
                            </div>
                            <button className="portal-btn ghost" onClick={() => setActiveView('dashboard')}>
                                ← Back
                            </button>
                        </div>

                        <div className="portal-section">
                            <div className="portal-table-wrap">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Profile</th>
                                            <th>Joined</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, i) => (
                                            <tr key={i}>
                                                <td>{u.first_name} {u.last_name}</td>
                                                <td>{u.email}</td>
                                                <td><span className="portal-badge info" style={{ textTransform: 'capitalize' }}>{(u.user_type || '').replace('_', ' ')}</span></td>
                                                <td><span className={`portal-badge ${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                                <td><span className={`portal-badge ${u.profile_completed ? 'success' : 'warning'}`}>{u.profile_completed ? 'Complete' : 'Incomplete'}</span></td>
                                                <td>{formatDate(u.date_joined)}</td>
                                                <td>
                                                    <button className="portal-btn ghost sm" onClick={() => setSelectedUser(u)}>View</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {userTotal > 15 && (
                                <div className="portal-pagination">
                                    <span>Showing {users.length} of {userTotal}</span>
                                    <div className="portal-pagination-btns">
                                        <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>Prev</button>
                                        <button disabled={users.length < 15} onClick={() => setUserPage(p => p + 1)}>Next</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Detail Drawer */}
                        {selectedUser && (
                            <>
                                <div className="portal-drawer-overlay" onClick={() => setSelectedUser(null)} />
                                <div className="portal-drawer">
                                    <div className="portal-drawer-header">
                                        <h3>User Details</h3>
                                        <button className="portal-drawer-close" onClick={() => setSelectedUser(null)}>✕</button>
                                    </div>
                                    <div className="portal-drawer-body">
                                        <div className="portal-info-row"><span className="portal-info-label">Name</span><span className="portal-info-value">{selectedUser.first_name} {selectedUser.last_name}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Email</span><span className="portal-info-value">{selectedUser.email}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Role</span><span className="portal-info-value" style={{ textTransform: 'capitalize' }}>{(selectedUser.user_type || '').replace('_', ' ')}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Status</span><span className={`portal-badge ${selectedUser.is_active ? 'success' : 'danger'}`}>{selectedUser.is_active ? 'Active' : 'Inactive'}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Profile</span><span className={`portal-badge ${selectedUser.profile_completed ? 'success' : 'warning'}`}>{selectedUser.profile_completed ? 'Complete' : 'Incomplete'}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Joined</span><span className="portal-info-value">{formatDate(selectedUser.date_joined)}</span></div>
                                        <div className="portal-info-row"><span className="portal-info-label">Last Seen</span><span className="portal-info-value">{formatDate(selectedUser.last_seen)}</span></div>

                                        <div style={{ marginTop: '1.25rem' }}>
                                            <Link className="portal-btn primary" to={`/profile/${selectedUser.id}`} style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                                                View Full Profile
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Activity View */}
                {activeView === 'activity' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Activity Feed</h1>
                            <p>Recent platform activity</p>
                        </div>
                        <button className="portal-btn ghost" onClick={() => setActiveView('dashboard')} style={{ marginBottom: '1rem' }}>
                            ← Back
                        </button>
                        <div className="portal-section">
                            <div className="portal-section-body">
                                {(data?.recent_activity || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">📋</div>
                                        <p>No recent activity</p>
                                    </div>
                                ) : (
                                    (data?.recent_activity || []).map((a, i) => (
                                        <div className="portal-content-item" key={i}>
                                            <div className="portal-content-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>📝</div>
                                            <div className="portal-content-info">
                                                <p className="portal-content-title">{a.description || a.activity_type || 'Activity'}</p>
                                                <p className="portal-content-meta">{a.user__first_name || a.user__email} • {formatDate(a.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Requests View */}
                {activeView === 'requests' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Pending Requests</h1>
                            <p>Review and manage user requests</p>
                        </div>
                        <button className="portal-btn ghost" onClick={() => setActiveView('dashboard')} style={{ marginBottom: '1rem' }}>
                            ← Back
                        </button>
                        <div className="portal-grid-2">
                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Role Changes</h3></div>
                                <div className="portal-section-body">
                                    <div className="portal-stat-value" style={{ fontSize: '2.5rem', textAlign: 'center', padding: '1.5rem' }}>
                                        {data?.pending_requests?.role_changes || 0}
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>pending role change requests</p>
                                    {(user?.is_admin || user?.is_superuser) && (
                                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                            <Link className="portal-btn primary" to={ROUTES.ADMIN_ROLE_REQUESTS} style={{ textDecoration: 'none' }}>
                                                Review in Admin Portal
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Account Deletions</h3></div>
                                <div className="portal-section-body">
                                    <div className="portal-stat-value" style={{ fontSize: '2.5rem', textAlign: 'center', padding: '1.5rem' }}>
                                        {data?.pending_requests?.deletions || 0}
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>pending deletion requests</p>
                                    {(user?.is_admin || user?.is_superuser) && (
                                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                            <Link className="portal-btn primary" to={ROUTES.ADMIN_DELETION_REVIEW} style={{ textDecoration: 'none' }}>
                                                Review in Admin Portal
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StaffPortal;
