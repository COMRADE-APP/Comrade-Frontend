import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
};

export default function AdminBills() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', provider: '' });
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, [filters]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.provider) params.append('provider', filters.provider);
            
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/bills/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setPayments(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to load bill payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/bills/stats/`, {
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
            await axios.post(`${API_ENDPOINTS.PAYMENT_LIST}admin/bills/`, {
                action,
                payment_ids: selected
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            toast.success(`${selected.length} payments ${action}ed`);
            setSelected([]);
            fetchPayments();
            fetchStats();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selected.length === payments.length) setSelected([]);
        else setSelected(payments.map(p => p.id));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Bill & Airtime Payments</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-gray-500 text-white rounded">
                        ← Back
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total</div>
                        <div className="text-2xl font-bold">{stats.total_transactions}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Completed</div>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Failed</div>
                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-500 text-sm">Total Amount</div>
                        <div className="text-2xl font-bold">{formatMoneySimple(stats.total_amount)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className="p-2 border rounded"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.length === payments.length} onChange={toggleSelectAll} />
                    Select All
                </label>
                {selected.length > 0 && (
                    <>
                        <span className="text-gray-500">{selected.length} selected</span>
                        <button onClick={() => handleBulkAction('refund')} className="px-3 py-1 bg-red-500 text-white rounded">
                            Refund Selected
                        </button>
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
                            <th className="p-3 text-left">User</th>
                            <th className="p-3 text-left">Provider</th>
                            <th className="p-3 text-left">Account</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="p-4 text-center">Loading...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={8} className="p-4 text-center">No payments found</td></tr>
                        ) : (
                            payments.map(payment => (
                                <tr key={payment.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3">
                                        <input type="checkbox" checked={selected.includes(payment.id)} onChange={() => toggleSelect(payment.id)} />
                                    </td>
                                    <td className="p-3 font-mono text-sm">{payment.reference}</td>
                                    <td className="p-3">{payment.user?.user?.email || 'N/A'}</td>
                                    <td className="p-3">{payment.provider?.name}</td>
                                    <td className="p-3">{payment.account_number}</td>
                                    <td className="p-3 text-right">{formatMoneySimple(payment.amount)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[payment.status] || 'bg-gray-100'}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">{new Date(payment.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}