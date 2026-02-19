import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

export default function AdminAnalytics() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [period, setPeriod] = useState('30');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAnalytics({ period });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const maxVal = (arr) => Math.max(1, ...arr.map(d => d.count || 0));
    const fmtDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return `${dt.getMonth() + 1}/${dt.getDate()}`;
    };

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="analytics" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>Platform Analytics</h1>
                    <p>Insights and trends across the platform</p>
                </div>

                {/* Period selector */}
                <div className="admin-toolbar">
                    {[
                        { val: '7', label: '7 Days' },
                        { val: '30', label: '30 Days' },
                        { val: '90', label: '90 Days' },
                        { val: '365', label: '1 Year' },
                    ].map(p => (
                        <button
                            key={p.val}
                            className={`admin-btn ${period === p.val ? 'primary' : 'ghost'}`}
                            onClick={() => setPeriod(p.val)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : !data ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">📈</div>
                        <p>No analytics data available</p>
                    </div>
                ) : (
                    <>
                        {/* Signups chart */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h3>📈 New Signups</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {(data.signups || []).reduce((s, d) => s + (d.count || 0), 0)} total
                                </span>
                            </div>
                            <div className="admin-section-body">
                                <BarChart data={data.signups || []} maxVal={maxVal(data.signups || [])} fmtDate={fmtDate} color="linear-gradient(180deg, #6366f1, #a855f7)" />
                            </div>
                        </div>

                        {/* Login activity chart */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h3>🔐 Login Activity</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {(data.logins || []).reduce((s, d) => s + (d.count || 0), 0)} total
                                </span>
                            </div>
                            <div className="admin-section-body">
                                <BarChart data={data.logins || []} maxVal={maxVal(data.logins || [])} fmtDate={fmtDate} color="linear-gradient(180deg, #10b981, #34d399)" />
                            </div>
                        </div>

                        {/* Content creation chart */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h3>📝 Content Created (Opinions)</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {(data.content_created || []).reduce((s, d) => s + (d.count || 0), 0)} total
                                </span>
                            </div>
                            <div className="admin-section-body">
                                <BarChart data={data.content_created || []} maxVal={maxVal(data.content_created || [])} fmtDate={fmtDate} color="linear-gradient(180deg, #3b82f6, #60a5fa)" />
                            </div>
                        </div>

                        {/* Two-column: Top creators + Popular rooms */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="admin-section">
                                <div className="admin-section-header"><h3>🏆 Top Creators</h3></div>
                                <div className="admin-section-body">
                                    {(data.top_creators || []).length === 0 ? (
                                        <div className="admin-empty"><p>No data</p></div>
                                    ) : (
                                        <div className="admin-role-list">
                                            {(data.top_creators || []).map((c, i) => (
                                                <div className="admin-role-item" key={i}>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)', minWidth: 20 }}>{i + 1}.</span>
                                                    <span className="admin-role-label">
                                                        {c.author__first_name} {c.author__last_name}
                                                    </span>
                                                    <span className="admin-role-count">{c.count} posts</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="admin-section">
                                <div className="admin-section-header"><h3>🏠 Popular Rooms</h3></div>
                                <div className="admin-section-body">
                                    {(data.popular_rooms || []).length === 0 ? (
                                        <div className="admin-empty"><p>No data</p></div>
                                    ) : (
                                        <div className="admin-role-list">
                                            {(data.popular_rooms || []).map((r, i) => (
                                                <div className="admin-role-item" key={i}>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)', minWidth: 20 }}>{i + 1}.</span>
                                                    <span className="admin-role-label">{r.name}</span>
                                                    <span className="admin-role-count">👥 {r.members_count || 0}</span>
                                                </div>
                                            ))}
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
}

/* ── CSS Bar Chart Component ── */
function BarChart({ data, maxVal, fmtDate, color }) {
    if (!data || data.length === 0) {
        return <div className="admin-empty" style={{ padding: '2rem' }}><p>No data for this period</p></div>;
    }

    // Show at most 60 bars
    const trimmed = data.length > 60 ? data.slice(-60) : data;

    return (
        <div className="admin-chart-container">
            <div className="admin-bar-chart">
                {trimmed.map((d, i) => (
                    <div
                        key={i}
                        className="admin-bar"
                        style={{
                            height: `${Math.max(4, (d.count / maxVal) * 100)}%`,
                            background: color,
                        }}
                    >
                        <div className="admin-bar-tooltip">
                            {fmtDate(d.date)}: {d.count}
                        </div>
                    </div>
                ))}
            </div>
            <div className="admin-chart-labels">
                {trimmed.map((d, i) => (
                    <div key={i} className="admin-chart-label">
                        {i === 0 || i === trimmed.length - 1 || i === Math.floor(trimmed.length / 2)
                            ? fmtDate(d.date)
                            : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}
