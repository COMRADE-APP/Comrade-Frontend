import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import portalService from '../../services/portal.service';
import { ROUTES } from '../../constants/routes';
import { PortalSidebar } from './StaffPortal';
import './RolePortal.css';

const ModeratorPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');

    // Content review state
    const [contentTab, setContentTab] = useState('opinions');
    const [contentPage, setContentPage] = useState(1);
    const [contentData, setContentData] = useState({ results: [], count: 0 });
    const [contentLoading, setContentLoading] = useState(false);
    const [contentSearch, setContentSearch] = useState('');

    useEffect(() => {
        if (!user?.is_admin && !user?.is_staff && !user?.is_superuser && user?.user_type !== 'moderator') {
            navigate(ROUTES.DASHBOARD);
        }
    }, [user, navigate]);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await portalService.getModeratorDashboard();
            setData(res.data);
        } catch (err) { console.error('Moderator portal error:', err); }
        finally { setLoading(false); }
    };

    const loadContent = useCallback(async () => {
        setContentLoading(true);
        try {
            const res = await portalService.getModeratorContent({
                type: contentTab, page: contentPage, search: contentSearch
            });
            setContentData(res.data);
        } catch (err) { console.error('Content load error:', err); }
        finally { setContentLoading(false); }
    }, [contentTab, contentPage, contentSearch]);

    useEffect(() => {
        if (activeView === 'content') loadContent();
    }, [activeView, loadContent]);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    }) : '–';

    const navItems = [
        { path: '#', icon: '📊', label: 'Dashboard', badge: 0 },
        { path: '#content', icon: '📝', label: 'Content Review', badge: data?.total_opinions || 0 },
        { path: '#community', icon: '👥', label: 'Community', badge: 0 },
        { path: '#reports', icon: '🚩', label: 'Reports', badge: 0 },
    ];

    // Handle nav clicks
    const handleNavClick = (path) => {
        const view = path === '#' ? 'dashboard' : path.replace('#', '');
        setActiveView(view);
    };

    if (loading) {
        return (
            <div className="portal-layout portal-theme-moderator">
                <PortalSidebar portalName="Moderator Portal" roleBadge="🛡️ Moderator" navItems={navItems} currentPath="#" />
                <div className="portal-content"><div className="portal-loading"><div className="portal-spinner"></div></div></div>
            </div>
        );
    }

    return (
        <div className="portal-layout portal-theme-moderator">
            <PortalSidebar
                portalName="Moderator Portal"
                roleBadge="🛡️ Moderator"
                navItems={navItems.map(n => ({ ...n, onClick: () => handleNavClick(n.path) }))}
                currentPath={`#${activeView === 'dashboard' ? '' : activeView}`}
            />
            <div className="portal-content">
                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Moderator Dashboard</h1>
                            <p>Content moderation and community health</p>
                        </div>

                        {/* Content Stats */}
                        <div className="portal-stats-grid">
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">💬</div>
                                <div className="portal-stat-value">{data?.total_opinions || 0}</div>
                                <div className="portal-stat-label">Total Opinions</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📰</div>
                                <div className="portal-stat-value">{data?.total_articles || 0}</div>
                                <div className="portal-stat-label">Total Articles</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">🔬</div>
                                <div className="portal-stat-value">{data?.total_research || 0}</div>
                                <div className="portal-stat-label">Research Papers</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📦</div>
                                <div className="portal-stat-value">{data?.total_resources || 0}</div>
                                <div className="portal-stat-label">Resources</div>
                            </div>
                        </div>

                        {/* Weekly Activity */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Weekly Activity</h3></div>
                            <div className="portal-section-body">
                                <div className="portal-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">📝</div>
                                        <div className="portal-stat-value">{data?.weekly_opinions || 0}</div>
                                        <div className="portal-stat-label">Opinions this week</div>
                                    </div>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">📰</div>
                                        <div className="portal-stat-value">{data?.weekly_articles || 0}</div>
                                        <div className="portal-stat-label">Articles this week</div>
                                    </div>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">👤</div>
                                        <div className="portal-stat-value">{data?.weekly_signups || 0}</div>
                                        <div className="portal-stat-label">New users this week</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Community Health */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Community Health</h3></div>
                            <div className="portal-section-body">
                                <div className="portal-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">👥</div>
                                        <div className="portal-stat-value">{data?.total_users || 0}</div>
                                        <div className="portal-stat-label">Total Users</div>
                                    </div>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">💬</div>
                                        <div className="portal-stat-value">{data?.total_rooms || 0}</div>
                                        <div className="portal-stat-label">Active Rooms</div>
                                    </div>
                                    <div className="portal-stat-card">
                                        <div className="portal-stat-icon">📅</div>
                                        <div className="portal-stat-value">{data?.total_events || 0}</div>
                                        <div className="portal-stat-label">Events</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Moderation Quick Actions */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Quick Actions</h3></div>
                            <div className="portal-section-body">
                                <div className="portal-actions-grid">
                                    <button className="portal-action-card" onClick={() => setActiveView('content')}>
                                        <span className="portal-action-icon">📝</span>
                                        <span className="portal-action-label">Review Content</span>
                                    </button>
                                    <Link className="portal-action-card" to={ROUTES.OPINIONS} style={{ textDecoration: 'none' }}>
                                        <span className="portal-action-icon">💬</span>
                                        <span className="portal-action-label">Browse Opinions</span>
                                    </Link>
                                    <Link className="portal-action-card" to={ROUTES.ARTICLES} style={{ textDecoration: 'none' }}>
                                        <span className="portal-action-icon">📰</span>
                                        <span className="portal-action-label">Browse Articles</span>
                                    </Link>
                                    <Link className="portal-action-card" to={ROUTES.ROOMS} style={{ textDecoration: 'none' }}>
                                        <span className="portal-action-icon">👥</span>
                                        <span className="portal-action-label">Browse Rooms</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Content Review View */}
                {activeView === 'content' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Content Review</h1>
                            <p>Browse and moderate platform content</p>
                        </div>

                        {/* Tabs and Search */}
                        <div className="portal-toolbar">
                            <div className="portal-tabs">
                                <button
                                    className={`portal-tab ${contentTab === 'opinions' ? 'active' : ''}`}
                                    onClick={() => { setContentTab('opinions'); setContentPage(1); }}
                                >
                                    Opinions
                                </button>
                                <button
                                    className={`portal-tab ${contentTab === 'articles' ? 'active' : ''}`}
                                    onClick={() => { setContentTab('articles'); setContentPage(1); }}
                                >
                                    Articles
                                </button>
                            </div>
                            <div className="portal-search-bar">
                                <input
                                    type="text"
                                    className="portal-search-input"
                                    placeholder={`Search ${contentTab}...`}
                                    value={contentSearch}
                                    onChange={(e) => { setContentSearch(e.target.value); setContentPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Content Table */}
                        <div className="portal-section">
                            <div className="portal-section-body">
                                {contentLoading ? (
                                    <div className="portal-loading" style={{ padding: '2rem' }}>
                                        <div className="portal-spinner"></div>
                                    </div>
                                ) : (contentData.results || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">📝</div>
                                        <p>No {contentTab} found</p>
                                    </div>
                                ) : (
                                    <div className="portal-table-wrap">
                                        <table className="portal-table">
                                            <thead>
                                                <tr>
                                                    <th>Title / Content</th>
                                                    <th>Author</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(contentData.results || []).map((item, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.title || item.content?.substring(0, 80) || '(No title)'}
                                                        </td>
                                                        <td>{item.author_name || item.user?.username || '–'}</td>
                                                        <td>{formatDate(item.created_at)}</td>
                                                        <td>
                                                            <span className={`portal-badge ${item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'info'}`}>
                                                                {item.status || 'published'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        {contentData.count > 20 && (
                            <div className="portal-pagination">
                                <button
                                    className="portal-btn outline sm"
                                    disabled={contentPage === 1}
                                    onClick={() => setContentPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    Page {contentPage} of {Math.ceil(contentData.count / 20)}
                                </span>
                                <button
                                    className="portal-btn outline sm"
                                    disabled={contentPage >= Math.ceil(contentData.count / 20)}
                                    onClick={() => setContentPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Community View */}
                {activeView === 'community' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Community</h1>
                            <p>Community health and user management</p>
                        </div>
                        <div className="portal-section">
                            <div className="portal-section-body">
                                <div className="portal-empty">
                                    <div className="portal-empty-icon">👥</div>
                                    <p>Community management tools coming soon</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Reports View */}
                {activeView === 'reports' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Reports</h1>
                            <p>Flagged content and user reports</p>
                        </div>
                        <div className="portal-section">
                            <div className="portal-section-body">
                                <div className="portal-empty">
                                    <div className="portal-empty-icon">🚩</div>
                                    <p>Report management coming soon</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ModeratorPortal;
