import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

export default function AdminVerifications() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('institutions');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [reviewingId, setReviewingId] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            let res;
            if (activeTab === 'institutions') {
                res = await adminService.getInstitutions();
            } else {
                res = await adminService.getOrganizations();
            }
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { load(); }, [load]);

    const handleReview = async (id, action) => {
        setActionLoading(`${action}-${id}`);
        try {
            if (activeTab === 'institutions') {
                await adminService.reviewInstitution(id, action, reviewNotes);
            } else {
                await adminService.reviewOrganization(id, action, reviewNotes);
            }
            setReviewingId(null);
            setReviewNotes('');
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading('');
        }
    };

    const getPending = items.filter(i => i.status === 'submitted' || i.status === 'pending');
    const getApproved = items.filter(i => i.status === 'approved' || i.status === 'verified');
    const getRejected = items.filter(i => i.status === 'rejected');

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="verifications" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>Verification Queue</h1>
                    <p>Review institution and organization verification requests</p>
                </div>

                {/* Type tabs */}
                <div className="admin-tabs">
                    <button className={`admin-tab ${activeTab === 'institutions' ? 'active' : ''}`} onClick={() => setActiveTab('institutions')}>
                        🏛️ Institutions
                    </button>
                    <button className={`admin-tab ${activeTab === 'organizations' ? 'active' : ''}`} onClick={() => setActiveTab('organizations')}>
                        🏢 Organizations
                    </button>
                </div>

                {/* Stats */}
                <div className="admin-stats-grid" style={{ marginBottom: '1rem' }}>
                    <div className="admin-stat-card orange">
                        <div className="admin-stat-value">{getPending.length}</div>
                        <div className="admin-stat-label">Pending</div>
                    </div>
                    <div className="admin-stat-card green">
                        <div className="admin-stat-value">{getApproved.length}</div>
                        <div className="admin-stat-label">Approved</div>
                    </div>
                    <div className="admin-stat-card red">
                        <div className="admin-stat-value">{getRejected.length}</div>
                        <div className="admin-stat-label">Rejected</div>
                    </div>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : items.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">✅</div>
                        <p>No {activeTab} found</p>
                    </div>
                ) : (
                    <>
                        {/* Pending Section */}
                        {getPending.length > 0 && (
                            <div className="admin-section">
                                <div className="admin-section-header">
                                    <h3>⏳ Pending Review ({getPending.length})</h3>
                                </div>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Type</th>
                                                <th>Submitted</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getPending.map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ fontWeight: 600 }}>{item.name || 'Unnamed'}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{item.email || item.contact_email || '—'}</td>
                                                    <td><span className="admin-badge info">{item.type || item.institution_type || item.organization_type || '—'}</span></td>
                                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td>
                                                        {reviewingId === item.id ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 200 }}>
                                                                <textarea
                                                                    className="admin-select"
                                                                    placeholder="Review notes..."
                                                                    value={reviewNotes}
                                                                    onChange={e => setReviewNotes(e.target.value)}
                                                                    rows={2}
                                                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                    <button
                                                                        className="admin-btn sm success"
                                                                        onClick={() => handleReview(item.id, 'approved')}
                                                                        disabled={!!actionLoading}
                                                                    >
                                                                        ✅ Approve
                                                                    </button>
                                                                    <button
                                                                        className="admin-btn sm danger"
                                                                        onClick={() => handleReview(item.id, 'rejected')}
                                                                        disabled={!!actionLoading}
                                                                    >
                                                                        ❌ Reject
                                                                    </button>
                                                                    <button className="admin-btn sm ghost" onClick={() => { setReviewingId(null); setReviewNotes(''); }}>
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button className="admin-btn sm primary" onClick={() => setReviewingId(item.id)}>
                                                                Review
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Approved + Rejected */}
                        {(getApproved.length > 0 || getRejected.length > 0) && (
                            <div className="admin-section" style={{ marginTop: '1rem' }}>
                                <div className="admin-section-header"><h3>History</h3></div>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...getApproved, ...getRejected].map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ fontWeight: 600 }}>{item.name || 'Unnamed'}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{item.email || item.contact_email || '—'}</td>
                                                    <td>
                                                        <span className={`admin-badge ${item.status === 'approved' || item.status === 'verified' ? 'success' : 'danger'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem' }}>
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
