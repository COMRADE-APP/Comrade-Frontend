import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
import adminService from '../../services/admin.service';

const AdminEscrowDisputes = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const res = await adminService.getEscrowDisputes();
            setDisputes(res.data?.results || res.data || []);
        } catch (e) {
            console.error('Failed to fetch disputes:', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = disputes.filter(d =>
        !search ||
        d.id?.toString().includes(search) ||
        d.buyer?.toLowerCase().includes(search.toLowerCase()) ||
        d.seller?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Escrow Disputes</h1>
                    <p className="text-sm text-secondary">Mediate and resolve platform transaction conflicts</p>
                </div>
            </div>

            <div className="bg-elevated border rounded-xl overflow-hidden">
                <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search dispute ID..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-primary text-primary outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/5 text-secondary font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Dispute ID</th>
                                    <th className="px-6 py-4">Parties</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-secondary">
                                            No disputes found
                                        </td>
                                    </tr>
                                ) : (filtered.map((d) => (
                                    <tr key={d.id} className="hover:bg-secondary/5">
                                        <td className="px-6 py-4 font-medium text-primary">{d.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-primary">{d.buyer || 'Unknown'} (B)</p>
                                            <p className="text-secondary">{d.seller || 'Unknown'} (S)</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {d.amount ? `${d.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-secondary truncate max-w-xs">{d.reason || d.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                d.status === 'Open' || d.status === 'open'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 font-medium rounded hover:bg-primary-100">
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminEscrowDisputes;
