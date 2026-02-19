import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin.service';
import { ROUTES } from '../../constants/routes';
import { AdminSidebar } from './AdminPortal';
import './AdminPortal.css';

const CONTENT_TYPES = [
    { key: 'opinions', label: 'Opinions', icon: '💬' },
    { key: 'articles', label: 'Articles', icon: '📰' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'rooms', label: 'Rooms', icon: '🏠' },
    { key: 'resources', label: 'Resources', icon: '📚' },
    { key: 'research', label: 'Research', icon: '🔬' },
];

export default function AdminContent() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('opinions');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleting, setDeleting] = useState('');

    useEffect(() => {
        if (user && !user.is_admin && !user.is_staff && !user.is_superuser) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getContent({
                type: activeTab, search, page, page_size: 20,
            });
            setItems(res.data.results || []);
            setTotalPages(res.data.total_pages || 1);
            setTotal(res.data.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, page]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete this ${item.type}? This cannot be undone.`)) return;
        setDeleting(item.id);
        try {
            await adminService.deleteContent(item.type, item.id);
            load();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting('');
        }
    };

    const getTitle = (item) => item.title || item.name || item.content?.slice(0, 80) || 'Untitled';
    const getAuthor = (item) => item.author_name || item.creator_name || item.author_email || item.creator_email || 'Unknown';

    return (
        <div className="admin-layout">
            <AdminSidebar activeKey="content" navigate={navigate} />
            <div className="admin-content">
                <div className="admin-page-header">
                    <h1>Content Moderation</h1>
                    <p>Review and manage platform content</p>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    {CONTENT_TYPES.map(ct => (
                        <button
                            key={ct.key}
                            className={`admin-tab ${activeTab === ct.key ? 'active' : ''}`}
                            onClick={() => { setActiveTab(ct.key); setPage(1); setSearch(''); }}
                        >
                            {ct.icon} {ct.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="admin-toolbar">
                    <div className="admin-search">
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{total} items</span>
                </div>

                {/* Content List */}
                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /></div>
                ) : items.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">📝</div>
                        <p>No {activeTab} found</p>
                    </div>
                ) : (
                    <div className="admin-section">
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Content</th>
                                        <th>Author</th>
                                        <th>Created</th>
                                        <th>Info</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ maxWidth: 350 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                                                    {getTitle(item).slice(0, 80)}
                                                    {getTitle(item).length > 80 && '…'}
                                                </div>
                                                {(item.description || item.abstract || item.content) && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                                        {(item.description || item.abstract || item.content || '').slice(0, 120)}
                                                        {(item.description || item.abstract || item.content || '').length > 120 && '…'}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{getAuthor(item)}</td>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                {item.status && <span className="admin-badge info">{item.status}</span>}
                                                {item.likes_count > 0 && <span className="admin-badge neutral" style={{ marginLeft: '0.3rem' }}>❤️ {item.likes_count}</span>}
                                                {item.members_count > 0 && <span className="admin-badge neutral" style={{ marginLeft: '0.3rem' }}>👥 {item.members_count}</span>}
                                            </td>
                                            <td>
                                                <button
                                                    className="admin-btn sm danger"
                                                    onClick={() => handleDelete(item)}
                                                    disabled={deleting === item.id}
                                                >
                                                    {deleting === item.id ? '...' : '🗑️ Remove'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-pagination">
                            <span>Page {page} of {totalPages}</span>
                            <div className="admin-pagination-btns">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
