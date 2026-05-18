import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-emerald-100 text-emerald-800',
};

export default function AdminInsurance() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '' });
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        fetchClaims();
        fetchStats();
    }, [filters]);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/insurance/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setClaims(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to load claims');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/insurance/stats/`, {
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
            await axios.post(`${API_ENDPOINTS.PAYMENT_LIST}admin/insurance/`, {
                action,
                claim_ids: selected
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            toast.success(`${selected.length} claims ${action}ed`);
            setSelected([]);
            fetchClaims();
            fetchStats();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selected.length === claims.length) setSelected([]);
        else setSelected(claims.map(c => c.id));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Insurance Claims</h1>
                <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-gray-500 text-white rounded">← Back</button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total Claims</div>
                        <div className="text-2xl font-bold">{stats.total_claims}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Approved</div>
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total Claimed</div>
                        <div className="text-xl font-bold">{formatMoneySimple(stats.total_claimed)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total Approved</div>
                        <div className="text-xl font-bold">{formatMoneySimple(stats.total_approved)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="p-2 border rounded">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.length === claims.length} onChange={toggleSelectAll} />
                    Select All
                </label>
                {selected.length > 0 && (
                    <>
                        <span className="text-gray-500">{selected.length} selected</span>
                        <button onClick={() => handleBulkAction('approve')} className="px-3 py-1 bg-green-500 text-white rounded">Approve</button>
                        <button onClick={() => handleBulkAction('reject')} className="px-3 py-1 bg-red-500 text-white rounded">Reject</button>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left"></th>
                            <th className="p-3 text-left">Claim #</th>
                            <th className="p-3 text-left">Policy</th>
                            <th className="p-3 text-left">Claimant</th>
                            <th className="p-3 text-right">Claimed</th>
                            <th className="p-3 text-right">Approved</th>
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="p-4 text-center">Loading...</td></tr>
                        ) : claims.length === 0 ? (
                            <tr><td colSpan={9} className="p-4 text-center">No claims found</td></tr>
                        ) : (
                            claims.map(claim => (
                                <tr key={claim.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3"><input type="checkbox" checked={selected.includes(claim.id)} onChange={() => toggleSelect(claim.id)} /></td>
                                    <td className="p-3 font-mono text-sm">{claim.claim_number}</td>
                                    <td className="p-3">{claim.policy?.policy_number}</td>
                                    <td className="p-3">{claim.policy?.user?.user?.email || 'N/A'}</td>
                                    <td className="p-3 text-right">{formatMoneySimple(claim.claimed_amount)}</td>
                                    <td className="p-3 text-right">{formatMoneySimple(claim.approved_amount || 0)}</td>
                                    <td className="p-3">{claim.claim_type}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[claim.status]}`}>{claim.status}</span></td>
                                    <td className="p-3 text-sm">{new Date(claim.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}