import React, { useState, useEffect } from 'react';
import { Banknote, Search, RefreshCcw, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';
import { formatDate } from '../../../utils/dateFormatter';

const BILL_STATUS = {
    pending: { color: 'bg-amber-50 text-amber-700', bg: 'bg-amber-100 text-amber-600', icon: Clock, label: 'Pending' },
    processing: { color: 'bg-blue-50 text-blue-700', bg: 'bg-blue-100 text-blue-600', icon: Clock, label: 'Processing' },
    completed: { color: 'bg-emerald-50 text-emerald-700', bg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle, label: 'Completed' },
    failed: { color: 'bg-red-50 text-red-700', bg: 'bg-red-100 text-red-600', icon: XCircle, label: 'Failed' },
    reversed: { color: 'bg-gray-50 text-gray-700', bg: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Reversed' },
};

const BillsTab = ({ provider, onRefresh }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => { loadPayments(); }, [provider?.id]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/v1/payments/bill-payments/', { params: { provider_id: provider?.id } });
            setPayments(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) { console.error('Failed to load bill payments:', err); }
        finally { setLoading(false); }
    };

    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.commission || 0), 0);
    const totalVolume = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'processing').length;

    const getStatusCfg = (s) => BILL_STATUS[s] || BILL_STATUS.pending;

    const filtered = payments.filter(p => {
        const ms = !search || p.account_number?.includes(search) || p.account_name?.toLowerCase().includes(search.toLowerCase());
        const mst = !filterStatus || p.status === filterStatus;
        return ms && mst;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Banknote size={20} className="text-emerald-500" /> Bill Transactions
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">Revenue dashboard and payment history</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadPayments}>
                    <RefreshCcw size={14} className="mr-1.5" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Commission Earned</p>
                    <p className="text-xl font-bold text-emerald-600">{formatMoneySimple(totalRevenue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Volume</p>
                    <p className="text-xl font-bold text-blue-600">{formatMoneySimple(totalVolume)}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Payments</p>
                    <p className="text-xl font-bold text-primary">{payments.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Pending</p>
                    <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input type="text" placeholder="Search by account..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">All Statuses</option>
                    {Object.entries(BILL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <FileText size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Bill Payments</h4>
                    <p className="text-sm text-secondary">No bill payments have been processed yet.</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-2">
                    {filtered.map(payment => {
                        const sc = getStatusCfg(payment.status);
                        const StatusIcon = sc.icon;
                        return (
                            <Card key={payment.id} className="border-theme">
                                <CardBody className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sc.bg}`}>
                                            <StatusIcon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">
                                                {payment.provider_name || 'Bill Payment'} • {payment.account_number}
                                            </p>
                                            <p className="text-xs text-secondary">
                                                {payment.account_name} • {formatDate(payment.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-primary">{formatMoneySimple(payment.amount)}</p>
                                        <p className="text-xs text-secondary">Fee: {formatMoneySimple(payment.commission || 0)}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BillsTab;
