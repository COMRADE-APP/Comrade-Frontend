import React, { useState, useEffect } from 'react';
import { Search, FileText, Loader2 } from 'lucide-react';
import adminService from '../../services/admin.service';

const AdminKYC = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadKYC();
    }, []);

    const loadKYC = async () => {
        setLoading(true);
        try {
            const res = await adminService.getKYCRequests();
            setVerifications(res.data?.results || res.data || []);
        } catch (e) {
            console.error('Failed to fetch KYC requests:', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = verifications.filter(v =>
        !search ||
        v.id?.toString().includes(search) ||
        v.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.document_type?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Entity Verifications (KYC)</h1>
                    <p className="text-sm text-secondary">Review submitted identity documents for users and businesses</p>
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
                            placeholder="Search by name or ID..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-primary text-primary outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-secondary text-sm">Loading verifications...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/5 text-secondary font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Request ID</th>
                                    <th className="px-6 py-4">Entity Type</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Document Type</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-secondary">
                                            No verification requests found
                                        </td>
                                    </tr>
                                ) : (filtered.map((v) => (
                                    <tr key={v.id} className="hover:bg-secondary/5">
                                        <td className="px-6 py-4 font-medium text-primary">{v.id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                (v.document_type?.includes('business') || v.entity_type === 'Business')
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {v.entity_type || (v.document_type?.includes('business') ? 'Business' : 'Personal')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-primary">{v.user_name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-secondary flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" /> {v.document_type || 'Document'}
                                        </td>
                                        <td className="px-6 py-4 text-secondary">
                                            {v.created_at ? new Date(v.created_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs px-3 py-1.5 bg-primary-600 text-white font-medium rounded hover:bg-primary-700">
                                                Review Documents
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

export default AdminKYC;
