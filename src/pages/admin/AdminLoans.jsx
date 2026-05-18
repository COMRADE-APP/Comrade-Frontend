import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    disbursed: 'bg-green-100 text-green-800',
    repaying: 'bg-teal-100 text-teal-800',
    completed: 'bg-emerald-100 text-emerald-800',
    defaulted: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
};

const RISK_COLORS = {
    very_low: 'bg-green-100 text-green-800',
    low: 'bg-lime-100 text-lime-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    very_high: 'bg-red-100 text-red-800',
};

export default function AdminLoans() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', risk_level: '' });
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        fetchApplications();
        fetchStats();
    }, [filters]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.risk_level) params.append('risk_level', filters.risk_level);
            
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/loans/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setApplications(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to load loan applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/loans/stats/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats');
        }
    };

    const handleBulkAction = async (action) => {
        if (selected.length === 0) return;
        try {
            await axios.post(`${API_ENDPOINTS.PAYMENT_LIST}admin/loans/`, {
                action,
                application_ids: selected
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            toast.success(`${selected.length} applications ${action}ed`);
            setSelected([]);
            fetchApplications();
            fetchStats();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selected.length === applications.length) setSelected([]);
        else setSelected(applications.map(a => a.id));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Loan Applications</h1>
                <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-gray-500 text-white rounded">
                    ← Back
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total</div>
                        <div className="text-2xl font-bold">{stats.total_applications}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Approved</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Disbursed</div>
                        <div className="text-2xl font-bold text-green-600">{stats.disbursed}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Rejected</div>
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Disbursed Amount</div>
                        <div className="text-xl font-bold">{formatMoneySimple(stats.total_disbursed)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="p-2 border rounded">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select value={filters.risk_level} onChange={e => setFilters({ ...filters, risk_level: e.target.value })} className="p-2 border rounded">
                    <option value="">All Risk Levels</option>
                    <option value="very_low">Very Low</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="very_high">Very High</option>
                </select>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.length === applications.length} onChange={toggleSelectAll} />
                    Select All
                </label>
                {selected.length > 0 && (
                    <>
                        <span className="text-gray-500">{selected.length} selected</span>
                        <button onClick={() => handleBulkAction('approve')} className="px-3 py-1 bg-green-500 text-white rounded">Approve</button>
                        <button onClick={() => handleBulkAction('reject')} className="px-3 py-1 bg-red-500 text-white rounded">Reject</button>
                        <button onClick={() => handleBulkAction('disburse')} className="px-3 py-1 bg-blue-500 text-white rounded">Disburse</button>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left"></th>
                            <th className="p-3 text-left">Reference</th>
                            <th className="p-3 text-left">Applicant</th>
                            <th className="p-3 text-left">Product</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-left">Risk</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="p-4 text-center">Loading...</td></tr>
                        ) : applications.length === 0 ? (
                            <tr><td colSpan={8} className="p-4 text-center">No applications found</td></tr>
                        ) : (
                            applications.map(app => (
                                <tr key={app.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3"><input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggleSelect(app.id)} /></td>
                                    <td className="p-3 font-mono text-sm">{app.reference}</td>
                                    <td className="p-3">{app.user?.user?.email || 'N/A'}</td>
                                    <td className="p-3">{app.product?.name}</td>
                                    <td className="p-3 text-right">{formatMoneySimple(app.amount)}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${RISK_COLORS[app.risk_level] || 'bg-gray-100'}`}>{app.risk_level}</span></td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[app.status]}`}>{app.status}</span></td>
                                    <td className="p-3 text-sm">{new Date(app.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}