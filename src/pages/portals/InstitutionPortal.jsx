import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import portalService from '../../services/portal.service';
import { ROUTES } from '../../constants/routes';
import { PortalSidebar } from './StaffPortal';
import './RolePortal.css';

const InstitutionPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [instData, setInstData] = useState(null);
    const [orgData, setOrgData] = useState(null);
    const [partnerData, setPartnerData] = useState(null);

    const portalType = ['institutional_admin', 'institutional_staff'].includes(user?.user_type)
        ? 'institution'
        : ['organisational_admin', 'organisational_staff'].includes(user?.user_type)
            ? 'organisation'
            : user?.user_type === 'partner'
                ? 'partner'
                : null;

    useEffect(() => {
        if (!portalType && !user?.is_admin && !user?.is_staff && !user?.is_superuser) {
            navigate(ROUTES.DASHBOARD);
        }
    }, [user, navigate, portalType]);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            if (portalType === 'institution' || user?.is_admin || user?.is_superuser) {
                const res = await portalService.getInstitutionDashboard();
                setInstData(res.data);
            }
            if (portalType === 'organisation' || user?.is_admin || user?.is_superuser) {
                const res = await portalService.getOrganisationDashboard();
                setOrgData(res.data);
            }
            if (portalType === 'partner' || user?.is_admin || user?.is_superuser) {
                const res = await portalService.getPartnerDashboard();
                setPartnerData(res.data);
            }
        } catch (err) { console.error('Portal error:', err); }
        finally { setLoading(false); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    }) : '–';

    // Determine theme & labels
    const themeClass = portalType === 'partner' ? 'portal-theme-partner' : 'portal-theme-institution';
    const portalLabel = portalType === 'institution' ? 'Institution Portal'
        : portalType === 'organisation' ? 'Organisation Portal'
            : 'Partner Portal';
    const roleBadge = portalType === 'institution' ? '🏛️ Institution'
        : portalType === 'organisation' ? '🏢 Organisation'
            : '🤝 Partner';

    const navItems = [
        { path: '#', icon: '📊', label: 'Dashboard', badge: 0 },
        ...(portalType === 'partner' ? [
            { path: '#products', icon: '🛍️', label: 'Products', badge: partnerData?.products || 0 },
        ] : [
            { path: '#members', icon: '👥', label: 'Members', badge: 0 },
        ]),
        { path: '#settings', icon: '⚙️', label: 'Settings', badge: 0 },
    ];

    if (loading) {
        return (
            <div className={`portal-layout ${themeClass}`}>
                <PortalSidebar portalName={portalLabel} roleBadge={roleBadge} navItems={navItems} currentPath="#" />
                <div className="portal-content"><div className="portal-loading"><div className="portal-spinner"></div></div></div>
            </div>
        );
    }

    return (
        <div className={`portal-layout ${themeClass}`}>
            <PortalSidebar portalName={portalLabel} roleBadge={roleBadge} navItems={navItems} currentPath="#" />
            <div className="portal-content">
                <div className="portal-page-header">
                    <h1>{portalLabel}</h1>
                    <p>Manage your {portalType === 'partner' ? 'products and business' : 'organization and members'}</p>
                </div>

                {/* Institution View */}
                {(portalType === 'institution' || user?.is_admin) && instData && (
                    <>
                        <div className="portal-stats-grid">
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">🏛️</div>
                                <div className="portal-stat-value">{(instData.institutions || []).length}</div>
                                <div className="portal-stat-label">Institutions</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">👥</div>
                                <div className="portal-stat-value">{instData.total_members || 0}</div>
                                <div className="portal-stat-label">Total Members</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📅</div>
                                <div className="portal-stat-value">{instData.total_events || 0}</div>
                                <div className="portal-stat-label">Events</div>
                            </div>
                            <div className="portal-stat-card">
                                <div className="portal-stat-icon">📚</div>
                                <div className="portal-stat-value">{instData.total_resources || 0}</div>
                                <div className="portal-stat-label">Resources</div>
                            </div>
                        </div>

                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Your Institutions</h3></div>
                            <div className="portal-section-body">
                                {(instData.institutions || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">🏛️</div>
                                        <p>No institutions registered</p>
                                    </div>
                                ) : (
                                    <div className="portal-table-wrap">
                                        <table className="portal-table">
                                            <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
                                            <tbody>
                                                {(instData.institutions || []).map((inst, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>{inst.name}</td>
                                                        <td><span className="portal-badge info" style={{ textTransform: 'capitalize' }}>{(inst.institution_type || '').replace('_', ' ')}</span></td>
                                                        <td><span className={`portal-badge ${inst.status === 'verified' ? 'success' : inst.status === 'pending' ? 'warning' : 'neutral'}`}>{inst.status}</span></td>
                                                        <td>{formatDate(inst.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Organisation View */}
                {(portalType === 'organisation' || user?.is_admin) && orgData && (
                    <>
                        {portalType === 'organisation' && (
                            <div className="portal-stats-grid">
                                <div className="portal-stat-card">
                                    <div className="portal-stat-icon">🏢</div>
                                    <div className="portal-stat-value">{(orgData.organisations || []).length}</div>
                                    <div className="portal-stat-label">Organisations</div>
                                </div>
                                <div className="portal-stat-card">
                                    <div className="portal-stat-icon">👥</div>
                                    <div className="portal-stat-value">{orgData.total_members || 0}</div>
                                    <div className="portal-stat-label">Members</div>
                                </div>
                            </div>
                        )}

                        <div className="portal-section">
                            <div className="portal-section-header"><h3>Your Organisations</h3></div>
                            <div className="portal-section-body">
                                {(orgData.organisations || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">🏢</div>
                                        <p>No organisations registered</p>
                                    </div>
                                ) : (
                                    <div className="portal-table-wrap">
                                        <table className="portal-table">
                                            <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
                                            <tbody>
                                                {(orgData.organisations || []).map((org, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>{org.name}</td>
                                                        <td><span className="portal-badge info" style={{ textTransform: 'capitalize' }}>{(org.organization_type || '').replace('_', ' ')}</span></td>
                                                        <td><span className={`portal-badge ${org.status === 'verified' ? 'success' : org.status === 'pending' ? 'warning' : 'neutral'}`}>{org.status}</span></td>
                                                        <td>{formatDate(org.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Partner View */}
                {(portalType === 'partner' || user?.is_admin) && partnerData && (
                    <>
                        {portalType === 'partner' && (
                            <div className="portal-stats-grid">
                                <div className="portal-stat-card">
                                    <div className="portal-stat-icon">🛍️</div>
                                    <div className="portal-stat-value">{partnerData.products || 0}</div>
                                    <div className="portal-stat-label">Products</div>
                                </div>
                                <div className="portal-stat-card">
                                    <div className="portal-stat-icon">🏪</div>
                                    <div className="portal-stat-value">{partnerData.establishments || 0}</div>
                                    <div className="portal-stat-label">Establishments</div>
                                </div>
                            </div>
                        )}

                        <div className="portal-section">
                            <div className="portal-section-header">
                                <h3>Recent Products</h3>
                                <Link className="portal-btn primary sm" to="/products/create" style={{ textDecoration: 'none' }}>+ Add Product</Link>
                            </div>
                            <div className="portal-section-body">
                                {(partnerData.recent_products || []).length === 0 ? (
                                    <div className="portal-empty">
                                        <div className="portal-empty-icon">🛍️</div>
                                        <p>No products yet</p>
                                    </div>
                                ) : (
                                    <div className="portal-table-wrap">
                                        <table className="portal-table">
                                            <thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Created</th></tr></thead>
                                            <tbody>
                                                {(partnerData.recent_products || []).map((p, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                        <td>KES {p.price}</td>
                                                        <td><span className={`portal-badge ${p.status === 'active' ? 'success' : 'warning'}`}>{p.status}</span></td>
                                                        <td>{formatDate(p.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Actions */}
                <div className="portal-section">
                    <div className="portal-section-header"><h3>Quick Actions</h3></div>
                    <div className="portal-section-body">
                        <div className="portal-actions-grid">
                            <Link className="portal-action-card" to={ROUTES.SETTINGS}>
                                <span className="portal-action-icon">⚙️</span>
                                <span className="portal-action-label">Settings</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.CREATE_EVENT}>
                                <span className="portal-action-icon">📅</span>
                                <span className="portal-action-label">Create Event</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.CREATE_ROOM}>
                                <span className="portal-action-icon">💬</span>
                                <span className="portal-action-label">Create Room</span>
                            </Link>
                            <Link className="portal-action-card" to={ROUTES.ANNOUNCEMENTS}>
                                <span className="portal-action-icon">📢</span>
                                <span className="portal-action-label">Announce</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionPortal;
