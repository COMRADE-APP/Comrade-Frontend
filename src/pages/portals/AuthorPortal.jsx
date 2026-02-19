import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import portalService from '../../services/portal.service';
import { ROUTES } from '../../constants/routes';
import { PortalSidebar } from './StaffPortal';
import './RolePortal.css';

const AuthorPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');

    useEffect(() => {
        const allowed = ['author', 'editor'];
        if (!allowed.includes(user?.user_type) && !user?.is_admin && !user?.is_staff && !user?.is_superuser) {
            navigate(ROUTES.DASHBOARD);
        }
    }, [user, navigate]);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await portalService.getAuthorDashboard();
            setData(res.data);
        } catch (err) {
            console.error('Author dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '–';

    const navItems = [
        { path: '#', icon: '📊', label: 'Dashboard', badge: 0 },
        { path: '#content', icon: '📝', label: 'My Content', badge: 0 },
        { path: '#drafts', icon: '📄', label: 'Drafts', badge: data?.articles?.drafts || 0 },
        { path: '#analytics', icon: '📈', label: 'Engagement', badge: 0 },
    ];

    if (loading && !data) {
        return (
            <div className="portal-layout portal-theme-author">
                <PortalSidebar portalName="Author Portal" roleBadge="✍️ Author" navItems={navItems} currentPath="#" />
                <div className="portal-content">
                    <div className="portal-loading"><div className="portal-spinner"></div></div>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-layout portal-theme-author">
            <PortalSidebar
                portalName="Author Portal"
                roleBadge={`✍️ ${user?.user_type === 'editor' ? 'Editor' : 'Author'}`}
                navItems={navItems}
                currentPath={`#${activeView === 'dashboard' ? '' : activeView}`}
            />
            <div className="portal-content">
                {activeView === 'dashboard' && (
                    <>
                        <div className="portal-page-header">
                            <h1>Author Dashboard</h1>
                            <p>Your content creation hub</p>
                        </div>

                        <div className="portal-stats-grid">
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">💬</div>
                                <div className="portal-stat-value">{data?.opinions?.published || 0}</div>
                                <div className="portal-stat-label">Opinions</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📰</div>
                                <div className="portal-stat-value">{data?.articles?.published || 0}</div>
                                <div className="portal-stat-label">Published Articles</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📝</div>
                                <div className="portal-stat-value">{data?.articles?.drafts || 0}</div>
                                <div className="portal-stat-label">Drafts</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">🔬</div>
                                <div className="portal-stat-value">{data?.research?.published || 0}</div>
                                <div className="portal-stat-label">Research Papers</div>
                            </div>
                        </div>

                        {/* Quick Create Actions */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Create New Content</h3></div>
                            <div className="portal-section-body">
                                <div className="portal-actions-grid">
                                    <Link className="portal-action-card" to={ROUTES.OPINIONS}>
                                        <span className="portal-action-icon">💬</span>
                                        <span className="portal-action-label">New Opinion</span>
                                    </Link>
                                    <Link className="portal-action-card" to="/articles/create">
                                        <span className="portal-action-icon">📰</span>
                                        <span className="portal-action-label">Write Article</span>
                                    </Link>
                                    <Link className="portal-action-card" to={ROUTES.CREATE_RESEARCH}>
                                        <span className="portal-action-icon">🔬</span>
                                        <span className="portal-action-label">Publish Research</span>
                                    </Link>
                                    <Link className="portal-action-card" to={ROUTES.CREATE_RESOURCE}>
                                        <span className="portal-action-icon">📚</span>
                                        <span className="portal-action-label">Share Resource</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Engagement Stats */}
                        <div className="portal-grid-2">
                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Engagement Overview</h3></div>
                                <div className="portal-section-body">
                                    <div className="portal-summary-list">
                                        <div className="portal-summary-row">
                                            <span>Total Likes (Opinions)</span>
                                            <span>{data?.opinions?.total_likes || 0}</span>
                                        </div>
                                        <div className="portal-summary-row">
                                            <span>Total Comments</span>
                                            <span>{data?.opinions?.total_comments || 0}</span>
                                        </div>
                                        <div className="portal-summary-row">
                                            <span>Published Articles</span>
                                            <span>{data?.articles?.published || 0}</span>
                                        </div>
                                        <div className="portal-summary-row">
                                            <span>Research Papers</span>
                                            <span>{data?.research?.published || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="portal-section">
                                <div className="portal-section-header"><h3>Content Breakdown</h3></div>
                                <div className="portal-section-body">
                                    {['opinions', 'articles', 'research'].map(type => {
                                        const total = (data?.opinions?.published || 0) + (data?.articles?.published || 0) + (data?.research?.published || 0);
                                        const count = type === 'opinions' ? data?.opinions?.published : type === 'articles' ? data?.articles?.published : data?.research?.published;
                                        const pct = total > 0 ? ((count || 0) / total * 100) : 0;
                                        return (
                                            <div key={type} style={{ marginBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{type}</span>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{count || 0}</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'var(--color-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '9999px', transition: 'width 0.5s' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recent Content */}
                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Recent Content</h3></div>
                            <div className="portal-section-body">
                                {(data?.recent_content || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">📝</div>
                                        <p>No content yet. Start creating!</p>
                                    </div>
                                ) : (
                                    (data?.recent_content || []).map((c, i) => (
                                        <div className="portal-content-item" key={i}>
                                            <div className="portal-content-icon" style={{ background: c.type === 'opinion' ? 'rgba(139,92,246,0.1)' : c.type === 'article' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)' }}>
                                                {c.type === 'opinion' ? '💬' : c.type === 'article' ? '📰' : '🔬'}
                                            </div>
                                            <div className="portal-content-info">
                                                <p className="portal-content-title">{c.title || 'Untitled'}</p>
                                                <p className="portal-content-meta">
                                                    <span className="portal-badge info" style={{ marginRight: '0.5rem', textTransform: 'capitalize' }}>{c.type}</span>
                                                    {c.status && <span className={`portal-badge ${c.status === 'published' ? 'success' : 'warning'}`} style={{ marginRight: '0.5rem' }}>{c.status}</span>}
                                                    {formatDate(c.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthorPortal;
