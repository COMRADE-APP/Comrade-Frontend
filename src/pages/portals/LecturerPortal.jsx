import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import portalService from '../../services/portal.service';
import { ROUTES } from '../../constants/routes';
import { PortalSidebar } from './StaffPortal';
import './RolePortal.css';

const LecturerPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (user?.user_type !== 'lecturer' && !user?.is_admin && !user?.is_staff && !user?.is_superuser) {
            navigate(ROUTES.DASHBOARD);
        }
    }, [user, navigate]);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await portalService.getLecturerDashboard();
            setData(res.data);
        } catch (err) { console.error('Lecturer dashboard error:', err); }
        finally { setLoading(false); }
    };

    const navItems = [
        { path: '#', icon: '📊', label: 'Dashboard', badge: 0 },
        { path: '#rooms', icon: '🏫', label: 'My Rooms', badge: (data?.my_rooms || []).length },
        { path: '#resources', icon: '📚', label: 'Resources', badge: 0 },
        { path: '#research', icon: '🔬', label: 'Research', badge: 0 },
    ];

    if (loading && !data) {
        return (
            <div className="portal-layout portal-theme-lecturer">
                <PortalSidebar portalName="Lecturer Portal" roleBadge="🎓 Lecturer" navItems={navItems} currentPath="#" />
                <div className="portal-content"><div className="portal-loading"><div className="portal-spinner"></div></div></div>
            </div>
        );
    }

    return (
        <div className="portal-layout portal-theme-lecturer">
            <PortalSidebar portalName="Lecturer Portal" roleBadge="🎓 Lecturer" navItems={navItems} currentPath="#" />
            <div className="portal-content">
                <div className="portal-page-header">
                    <h1>Lecturer Dashboard</h1>
                    <p>Teaching tools and academic management</p>
                </div>

                <div className="portal-stats-grid">
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">🏫</div>
                        <div className="portal-stat-value">{(data?.my_rooms || []).length}</div>
                        <div className="portal-stat-label">My Rooms</div>
                    </div>
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">📚</div>
                        <div className="portal-stat-value">{data?.my_resources || 0}</div>
                        <div className="portal-stat-label">Resources Shared</div>
                    </div>
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">🔬</div>
                        <div className="portal-stat-value">{data?.my_research || 0}</div>
                        <div className="portal-stat-label">Research Papers</div>
                    </div>
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">📅</div>
                        <div className="portal-stat-value">{data?.my_events || 0}</div>
                        <div className="portal-stat-label">Events Created</div>
                    </div>
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">✅</div>
                        <div className="portal-stat-value">{data?.my_tasks || 0}</div>
                        <div className="portal-stat-label">Tasks Assigned</div>
                    </div>
                    <div className="portal-stat-card">
                        <div className="portal-stat-icon">📢</div>
                        <div className="portal-stat-value">{data?.my_announcements || 0}</div>
                        <div className="portal-stat-label">Announcements</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="portal-section">
                    <div className="portal-section-header"><h3>Teaching Tools</h3></div>
                    <div className="portal-section-body">
                        <div className="portal-actions-grid">
                            <Link className="portal-action-card" to={ROUTES.CREATE_ROOM}>
                                <span className="portal-action-icon">🏫</span>
                                <span className="portal-action-label">Create Room</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.CREATE_RESOURCE}>
                                <span className="portal-action-icon">📚</span>
                                <span className="portal-action-label">Share Resource</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.CREATE_RESEARCH}>
                                <span className="portal-action-icon">🔬</span>
                                <span className="portal-action-label">Publish Research</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.CREATE_EVENT}>
                                <span className="portal-action-icon">📅</span>
                                <span className="portal-action-label">Create Event</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.ANNOUNCEMENTS}>
                                <span className="portal-action-icon">📢</span>
                                <span className="portal-action-label">Announcement</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.TASKS}>
                                <span className="portal-action-icon">✅</span>
                                <span className="portal-action-label">Assign Task</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* My Rooms */}
                <div className="portal-section">
                    <div className="portal-section-header">
                        <h3>My Rooms</h3>
                        <Link className="portal-btn primary sm" to={ROUTES.CREATE_ROOM} style={{ textDecoration: 'none' }}>+ New</Link>
                    </div>
                    <div className="portal-section-body">
                        {(data?.my_rooms || []).length === 0 ? (
                            <div className="portal-empty">
                                <div className="portal-empty-icon">🏫</div>
                                <p>No rooms yet. Create your first room!</p>
                            </div>
                        ) : (
                            <div className="portal-table-wrap">
                                <table className="portal-table">
                                    <thead><tr><th>Room Name</th><th>Members</th><th>Created</th><th></th></tr></thead>
                                    <tbody>
                                        {(data?.my_rooms || []).map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{r.name}</td>
                                                <td>{r.members_count || 0}</td>
                                                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '–'}</td>
                                                <td><Link className="portal-btn ghost sm" to={`/rooms/${r.id}`} style={{ textDecoration: 'none' }}>Open</Link></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LecturerPortal;
