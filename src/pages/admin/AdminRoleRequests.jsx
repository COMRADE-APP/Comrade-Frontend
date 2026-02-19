import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

export default function AdminRoleRequests() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewingId, setReviewingId] = useState(null);

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getRoleRequests({ status: filter });
            setRequests(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const handleReview = async (id, action) => {
        setActionLoading(`${action}-${id}`);
        try {
            await adminService.reviewRoleRequest(id, action, reviewNotes);
            setReviewingId(null);
            setReviewNotes('');
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading('');
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="roles" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>Role Change Requests</h1>
                    <p>Review and manage user role change requests</p>
                </div>

                {/* Filter Tabs */}
                <div className="admin-tabs">
                    {['pending', 'approved', 'rejected'].map(s => (
                        <button key={s} className={`admin-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                            {s === 'pending' ? '⏳' : s === 'approved' ? '✅' : '❌'} {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : requests.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">🔑</div>
                        <p>No {filter} role change requests</p>
                    </div>
                ) : (
                    <div className="admin-section">
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Current Role</th>
                                        <th>Requested Role</th>
                                        <th>Reason</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        {filter === 'pending' && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>
                                                    {req.user_name || req.user_email || `User #${req.user || req.user_id}`}
                                                </div>
                                                {req.user_email && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{req.user_email}</div>
                                                )}
                                            </td>
                                            <td><span className="admin-badge neutral">{req.current_role || '—'}</span></td>
                                            <td><span className="admin-badge info">{req.requested_role || '—'}</span></td>
                                            <td style={{ maxWidth: 250, fontSize: '0.8rem' }}>
                                                {(req.reason || req.justification || '—').slice(0, 100)}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <span className={`admin-badge ${req.status === 'approved' ? 'success' :
                                                        req.status === 'rejected' ? 'danger' : 'warning'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            {filter === 'pending' && (
                                                <td>
                                                    {reviewingId === req.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 200 }}>
                                                            <textarea
                                                                className="admin-select"
                                                                placeholder="Review notes (optional)..."
                                                                value={reviewNotes}
                                                                onChange={(e) => setReviewNotes(e.target.value)}
                                                                rows={2}
                                                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                <button
                                                                    className="admin-btn sm success"
                                                                    onClick={() => handleReview(req.id, 'approve')}
                                                                    disabled={actionLoading.startsWith('approve')}
                                                                >
                                                                    ✅ Approve
                                                                </button>
                                                                <button
                                                                    className="admin-btn sm danger"
                                                                    onClick={() => handleReview(req.id, 'reject')}
                                                                    disabled={actionLoading.startsWith('reject')}
                                                                >
                                                                    ❌ Reject
                                                                </button>
                                                                <button
                                                                    className="admin-btn sm ghost"
                                                                    onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button className="admin-btn sm primary" onClick={() => setReviewingId(req.id)}>
                                                            Review
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
