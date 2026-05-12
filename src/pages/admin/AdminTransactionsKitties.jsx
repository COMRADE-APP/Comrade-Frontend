import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export default function AdminTransactionsKitties() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('transactions');
    const [transactions, setTransactions] = useState([]);
    const [kitties, setKitties] = useState([]);
    const [transStats, setTransStats] = useState(null);
    const [kittyStats, setKittyStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'transactions') fetchTransactions();
        else fetchKitties();
    }, [activeTab]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/transactions/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setTransactions(response.data.results || response.data);
            
            const statsRes = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/transactions/stats/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setTransStats(statsRes.data);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const fetchKitties = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/kitties/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setKitties(response.data.results || response.data);
            
            const statsRes = await axios.get(`${API_ENDPOINTS.PAYMENT_LIST}admin/kitties/stats/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            setKittyStats(statsRes.data);
        } catch (error) {
            toast.error('Failed to load kitties');
        } finally {
            setLoading(false);
        }
    };

    const handleKittyAction = async (id, action) => {
        try {
            await axios.post(`${API_ENDPOINTS.PAYMENT_LIST}admin/kitties/${id}/${action}/`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            toast.success(`Kitty ${action}ed`);
            fetchKitties();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Transactions & Kitties</h1>
                <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-gray-500 text-white rounded">← Back</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 border-b-2 ${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                >
                    Transactions
                </button>
                <button
                    onClick={() => setActiveTab('kitties')}
                    className={`px-4 py-2 border-b-2 ${activeTab === 'kitties' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                >
                    Kitties
                </button>
            </div>

            {activeTab === 'transactions' ? (
                <>
                    {/* Stats */}
                    {transStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Total</div>
                                <div className="text-2xl font-bold">{transStats.total_transactions}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Completed</div>
                                <div className="text-2xl font-bold text-green-600">{transStats.completed}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Pending</div>
                                <div className="text-2xl font-bold text-yellow-600">{transStats.pending}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Total Amount</div>
                                <div className="text-xl font-bold">{formatMoneySimple(transStats.total_amount)}</div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">User</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center">No transactions found</td></tr>
                                ) : (
                                    transactions.map(txn => (
                                        <tr key={txn.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-mono text-sm">{txn.id?.slice(0, 8)}</td>
                                            <td className="p-3">{txn.user?.user?.email || 'N/A'}</td>
                                            <td className="p-3">{txn.transaction_type}</td>
                                            <td className="p-3 text-right">{formatMoneySimple(txn.amount)}</td>
                                            <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[txn.status]}`}>{txn.status}</span></td>
                                            <td className="p-3 text-sm">{new Date(txn.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    {/* Kitties Stats */}
                    {kittyStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Total Kitties</div>
                                <div className="text-2xl font-bold">{kittyStats.total_kitties}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Active</div>
                                <div className="text-2xl font-bold text-green-600">{kittyStats.active_kitties}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Total Value</div>
                                <div className="text-xl font-bold">{formatMoneySimple(kittyStats.total_value)}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="text-gray-500 text-sm">Total Targets</div>
                                <div className="text-xl font-bold">{formatMoneySimple(kittyStats.total_targets)}</div>
                            </div>
                        </div>
                    )}

                    {/* Kitties Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Created By</th>
                                    <th className="p-3 text-right">Current</th>
                                    <th className="p-3 text-right">Target</th>
                                    <th className="p-3 text-left">Category</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                                ) : kitties.length === 0 ? (
                                    <tr><td colSpan={7} className="p-4 text-center">No kitties found</td></tr>
                                ) : (
                                    kitties.map(kitty => (
                                        <tr key={kitty.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-medium">{kitty.group_name}</td>
                                            <td className="p-3">{kitty.created_by?.user?.email || 'N/A'}</td>
                                            <td className="p-3 text-right">{formatMoneySimple(kitty.current_amount)}</td>
                                            <td className="p-3 text-right">{formatMoneySimple(kitty.target_amount)}</td>
                                            <td className="p-3">{kitty.max_capacity}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${kitty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {kitty.is_active ? 'Active' : 'Frozen'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {kitty.is_active ? (
                                                    <button onClick={() => handleKittyAction(kitty.id, 'freeze')} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Freeze</button>
                                                ) : (
                                                    <button onClick={() => handleKittyAction(kitty.id, 'unfreeze')} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Activate</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}