import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import './AdminPortal.css';

/* ── helper ── */
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
const ago = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return d.toLocaleDateString();
};

/* ── sidebar navigation config ── */
const NAV = [
    { key: 'overview', label: 'Overview', icon: '📊', route: ROUTES.ADMIN_PORTAL },
    { key: 'users', label: 'Users', icon: '👥', route: ROUTES.ADMIN_USERS },
    { key: 'content', label: 'Content', icon: '📝', route: ROUTES.ADMIN_CONTENT },
    { key: 'roles', label: 'Role Requests', icon: '🔑', route: ROUTES.ADMIN_ROLE_REQUESTS, badgeKey: 'role_changes' },
    { key: 'verifications', label: 'Verifications', icon: '✅', route: ROUTES.ADMIN_VERIFICATIONS, badgeKey: 'verifications' },
    { key: 'deletions', label: 'Deletions', icon: '🗑️', route: ROUTES.ADMIN_DELETION_REVIEW, badgeKey: 'deletions' },
    { key: 'analytics', label: 'Analytics', icon: '📈', route: ROUTES.ADMIN_ANALYTICS },
    { key: 'settings', label: 'Settings', icon: '⚙️', route: ROUTES.ADMIN_SETTINGS },
];

/* ══════════════════════════════════════════════
   AdminPortal — Main Admin Dashboard
   ══════════════════════════════════════════════ */
export default function AdminPortal() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Guard: redirect non-admin users
    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const res = await adminService.getDashboardStats();
            setStats(res.data);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* Pending counts for badges */
    const pendingBadges = useMemo(() => {
        if (!stats) return {};
        const p = stats.pending_reviews || {};
        return {
            role_changes: p.role_changes || 0,
            deletions: p.deletions || 0,
            verifications: (p.institutions || 0) + (p.organizations || 0),
        };
    }, [stats]);

    /* Active nav item */
    const activeKey = useMemo(() => {
        const match = NAV.find(n => location.pathname === n.route);
        return match?.key || 'overview';
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="admin-layout">
                <AdminSidebar activeKey={activeKey} pendingBadges={pendingBadges} navigate={navigate} />
                <div className="admin-content">
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-layout">
                <AdminSidebar activeKey={activeKey} pendingBadges={pendingBadges} navigate={navigate} />
                <div className="admin-content">
                    <div className="admin-empty">
                        <div className="admin-empty-icon">⚠️</div>
                        <p>{error}</p>
                        <button className="admin-btn primary" onClick={loadStats} style={{ marginTop: '1rem' }}>Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    const u = stats?.users || {};
    const c = stats?.content || {};
    const cw = stats?.content_this_week || {};
    const pr = stats?.pending_reviews || {};

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey={activeKey} pendingBadges={pendingBadges} navigate={navigate} />

            <div className="admin-content">
                {/* Header */}
                <div className="admin-page-header">
                    <h1>Admin Dashboard</h1>
                    <p>Platform overview and quick actions</p>
                </div>

                {/* Stat Cards */}
                <div className="admin-stats-grid">
                    <StatCard icon="👥" value={fmt(u.total)} label="Total Users" sub={`+${u.new_this_week || 0} this week`} color="purple" />
                    <StatCard icon="🟢" value={fmt(u.active_today)} label="Active Today" sub={`${u.new_this_month || 0} new this month`} color="green" />
                    <StatCard icon="⏳" value={fmt(pr.total)} label="Pending Reviews" sub="Requires attention" color="orange" />
                    <StatCard icon="📝" value={fmt(cw.opinions || 0)} label="Opinions This Week" sub={`${fmt(c.opinions)} total`} color="blue" />
                </div>

                {/* Quick Actions */}
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="admin-section-body">
                        <div className="admin-quick-actions">
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_USERS)}>
                                <span className="admin-quick-action-icon">👥</span>
                                <span className="admin-quick-action-label">Manage Users</span>
                            </div>
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_ROLE_REQUESTS)}>
                                <span className="admin-quick-action-icon">🔑</span>
                                <span className="admin-quick-action-label">Role Requests ({pr.role_changes || 0})</span>
                            </div>
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_VERIFICATIONS)}>
                                <span className="admin-quick-action-icon">✅</span>
                                <span className="admin-quick-action-label">Verifications ({(pr.institutions || 0) + (pr.organizations || 0)})</span>
                            </div>
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_CONTENT)}>
                                <span className="admin-quick-action-icon">📝</span>
                                <span className="admin-quick-action-label">Moderate Content</span>
                            </div>
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_ANALYTICS)}>
                                <span className="admin-quick-action-icon">📈</span>
                                <span className="admin-quick-action-label">View Analytics</span>
                            </div>
                            <div className="admin-quick-action" onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}>
                                <span className="admin-quick-action-icon">⚙️</span>
                                <span className="admin-quick-action-label">System Settings</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two-column: Role Distribution + Pending Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Role distribution */}
                    <div className="admin-section">
                        <div className="admin-section-header"><h3>User Roles</h3></div>
                        <div className="admin-section-body">
                            <div className="admin-role-list">
                                {(u.role_distribution || []).slice(0, 8).map((r) => (
                                    <div className="admin-role-item" key={r.user_type}>
                                        <span className="admin-role-label">{r.user_type?.replace(/_/g, ' ')}</span>
                                        <div className="admin-role-bar-bg">
                                            <div
                                                className="admin-role-bar-fill"
                                                style={{ width: `${Math.min(100, (r.count / (u.total || 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="admin-role-count">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending breakdown */}
                    <div className="admin-section">
                        <div className="admin-section-header"><h3>Pending Reviews</h3></div>
                        <div className="admin-section-body">
                            <div className="admin-role-list">
                                <ReviewRow label="Deletion Requests" count={pr.deletions} onClick={() => navigate(ROUTES.ADMIN_DELETION_REVIEW)} />
                                <ReviewRow label="Role Changes" count={pr.role_changes} onClick={() => navigate(ROUTES.ADMIN_ROLE_REQUESTS)} />
                                <ReviewRow label="Institutions" count={pr.institutions} onClick={() => navigate(ROUTES.ADMIN_VERIFICATIONS)} />
                                <ReviewRow label="Organizations" count={pr.organizations} onClick={() => navigate(ROUTES.ADMIN_VERIFICATIONS)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Overview */}
                <div className="admin-section" style={{ marginTop: '1rem' }}>
                    <div className="admin-section-header"><h3>Content Overview</h3></div>
                    <div className="admin-section-body">
                        <div className="admin-stats-grid">
                            {Object.entries(c).map(([key, val]) => (
                                <div key={key} style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(val)}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{key}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="admin-section" style={{ marginTop: '1rem' }}>
                    <div className="admin-section-header"><h3>Recent Activity</h3></div>
                    <div className="admin-section-body">
                        {(stats?.recent_activity || []).length === 0 ? (
                            <div className="admin-empty"><p>No recent activity</p></div>
                        ) : (
                            (stats.recent_activity || []).map((a, i) => (
                                <div className="admin-activity-item" key={i}>
                                    <div className={`admin-activity-dot ${a.activity_type || 'other'}`} />
                                    <div className="admin-activity-text">
                                        <strong>{a.user__first_name || a.user__email || 'Unknown'}</strong> — {a.description || a.activity_type}
                                    </div>
                                    <div className="admin-activity-time">{ago(a.timestamp)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Signups */}
                <div className="admin-section" style={{ marginTop: '1rem' }}>
                    <div className="admin-section-header"><h3>Recent Signups</h3></div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
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
                                {(stats?.recent_signups || []).map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.first_name} {s.last_name}</td>
                                        <td>{s.email}</td>
                                        <td><span className="admin-badge info">{s.user_type}</span></td>
                                        <td>
                                            <span className={`admin-badge ${s.is_active ? 'success' : 'danger'}`}>
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{ago(s.date_joined)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({ icon, value, label, sub, color = 'purple' }) {
    return (
        <div className={`admin-stat-card ${color}`}>
            <div className="admin-stat-icon">{icon}</div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-label">{label}</div>
            {sub && <div className="admin-stat-sub">{sub}</div>}
        </div>
    );
}

/* ── Pending Review Row ── */
function ReviewRow({ label, count, onClick }) {
    return (
        <div className="admin-role-item" style={{ cursor: 'pointer' }} onClick={onClick}>
            <span className="admin-role-label">{label}</span>
            <span className={`admin-badge ${count > 0 ? 'warning' : 'neutral'}`}>{count || 0}</span>
        </div>
    );
}

/* ══════════════════════════════════════════════
   Admin Sidebar — Shared across all admin pages
   ══════════════════════════════════════════════ */
export function AdminSidebar({ activeKey, pendingBadges = {}, navigate }) {
    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <h2>🛡️ Admin</h2>
                <p>Platform Management</p>
            </div>
            {NAV.map((item) => {
                const badge = item.badgeKey ? pendingBadges[item.badgeKey] : 0;
                return (
                    <button
                        key={item.key}
                        className={`admin-nav-item ${activeKey === item.key ? 'active' : ''}`}
                        onClick={() => navigate(item.route)}
                    >
                        <span className="admin-nav-icon">{item.icon}</span>
                        {item.label}
                        {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
                    </button>
                );
            })}
        </aside>
    );
}
