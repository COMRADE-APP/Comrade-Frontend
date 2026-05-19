import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, DollarSign, FileText, Printer, CheckCircle, RefreshCw, ArrowUpRight, X, Banknote, AlertTriangle } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/20',
    refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20',
    partially_refunded: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20',
};

const TransactionsTab = ({ provider, onRefresh }) => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [processingId, setProcessingId] = useState(null);

    // Refund Modal State
    const [refundModal, setRefundModal] = useState(null); // tx object or null
    const [refundReason, setRefundReason] = useState('requested_by_customer');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState('');

    // Payout State
    const [showPayoutForm, setShowPayoutForm] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('stripe');
    const [payoutAccount, setPayoutAccount] = useState('');
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutError, setPayoutError] = useState('');
    const [payoutSuccess, setPayoutSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, [provider.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txRes, sumRes] = await Promise.all([
                api.get('/api/v1/payments/provider-transactions/', { params: { provider_id: provider.id } }),
                api.get('/api/v1/payments/provider-transactions/summary/', { params: { provider_id: provider.id } }).catch(() => ({ data: null }))
            ]);
            setTransactions(txRes.data.results || txRes.data || []);
            setSummary(sumRes.data);
        } catch (e) {
            console.error('Failed to load transactions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id) => {
        setProcessingId(id);
        try {
            await api.post(`/api/v1/payments/provider-transactions/${id}/process/`);
            loadData();
        } catch (e) {
            alert('Failed to process transaction');
        } finally {
            setProcessingId(null);
        }
    };

    const openRefundModal = (tx) => {
        setRefundModal(tx);
        setRefundAmount(tx.amount);
        setRefundReason('requested_by_customer');
        setRefundError('');
    };

    const handleRefundSubmit = async () => {
        if (!refundModal) return;
        setRefundLoading(true);
        setRefundError('');
        try {
            await api.post(`/api/v1/payments/provider-transactions/${refundModal.id}/refund/`, {
                amount: refundAmount,
                reason: refundReason,
            });
            setRefundModal(null);
            loadData();
        } catch (e) {
            setRefundError(e.response?.data?.error || 'Failed to process refund');
        } finally {
            setRefundLoading(false);
        }
    };

    const handlePayoutSubmit = async () => {
        if (!payoutAmount || !payoutAccount) return;
        setPayoutLoading(true);
        setPayoutError('');
        setPayoutSuccess('');
        try {
            const res = await api.post(`/api/v1/payments/provider-registrations/${provider.id}/request_payout/`, {
                amount: payoutAmount,
                method: payoutMethod,
                destination_account: payoutAccount,
            });
            setPayoutSuccess(`Payout of ${formatMoneySimple(res.data.amount)} processed successfully!`);
            setPayoutAmount('');
            setPayoutAccount('');
            setShowPayoutForm(false);
            loadData();
        } catch (e) {
            setPayoutError(e.response?.data?.error || 'Payout request failed');
        } finally {
            setPayoutLoading(false);
        }
    };

    const filterTx = () => {
        return transactions.filter(tx => {
            const matchSearch = !search || 
                tx.reference_number.toLowerCase().includes(search.toLowerCase()) || 
                (tx.user_name || '').toLowerCase().includes(search.toLowerCase());
            const matchStatus = !filterStatus || tx.status === filterStatus;
            
            let matchDate = true;
            if (dateRange === 'month') {
                const txDate = new Date(tx.created_at);
                const now = new Date();
                matchDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (dateRange === 'year') {
                matchDate = new Date(tx.created_at).getFullYear() === new Date().getFullYear();
            }

            return matchSearch && matchStatus && matchDate;
        });
    };

    const filteredTx = filterTx();

    const exportCSV = () => {
        const headers = ['Date', 'Reference', 'Customer', 'Product', 'Amount', 'Fee', 'Net', 'Status'];
        const rows = filteredTx.map(tx => [
            new Date(tx.created_at).toLocaleString(),
            tx.reference_number,
            tx.user_name || 'N/A',
            tx.service_product_name || 'N/A',
            tx.amount,
            tx.fee_amount || 0,
            tx.net_amount || tx.amount,
            tx.status
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_${provider.business_name}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between no-print">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative max-w-xs flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search reference or customer..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="all">All Time</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPayoutForm(!showPayoutForm)}>
                        <Banknote size={16} className="mr-1.5" /> Request Payout
                    </Button>
                    <Button variant="outline" onClick={exportCSV}>
                        <Download size={16} className="mr-1.5" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={exportPrint}>
                        <Printer size={16} className="mr-1.5" /> Print / PDF
                    </Button>
                </div>
            </div>

            {/* Payout Success */}
            {payoutSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">{payoutSuccess}</span>
                    <button onClick={() => setPayoutSuccess('')} className="ml-auto"><X size={16} /></button>
                </div>
            )}

            {/* Payout Request Form */}
            {showPayoutForm && (
                <Card className="border-theme bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                    <CardBody className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                <Banknote size={18} className="text-blue-600" /> Request Payout
                            </h3>
                            <button onClick={() => setShowPayoutForm(false)}><X size={18} className="text-secondary" /></button>
                        </div>
                        <p className="text-xs text-secondary">
                            Withdraw available funds from your provider wallet to your external bank account.
                            {provider.linked_payment_group && (
                                <span className="font-semibold text-primary ml-1">
                                    Available: {formatMoneySimple(provider.linked_payment_group.balance || 0)}
                                </span>
                            )}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-secondary mb-1 block">Amount</label>
                                <input type="number" step="0.01" min="1" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                                    placeholder="e.g. 5000.00" className="w-full px-3 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-secondary mb-1 block">Method</label>
                                <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="stripe">Stripe (Card/Bank)</option>
                                    <option value="flutterwave">Flutterwave (Bank/M-Pesa)</option>
                                    <option value="mpesa">M-Pesa Direct</option>
                                    <option value="equity_bank">Equity Bank</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-secondary mb-1 block">Destination Account</label>
                                <input type="text" value={payoutAccount} onChange={e => setPayoutAccount(e.target.value)}
                                    placeholder="Account # or phone" className="w-full px-3 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        </div>
                        {payoutError && <p className="text-xs text-red-500 font-medium">{payoutError}</p>}
                        <div className="flex justify-end">
                            <Button onClick={handlePayoutSubmit} disabled={payoutLoading || !payoutAmount || !payoutAccount}>
                                {payoutLoading ? <RefreshCw size={14} className="animate-spin mr-2" /> : <ArrowUpRight size={14} className="mr-2" />}
                                {payoutLoading ? 'Processing...' : 'Submit Payout'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                    <Card className="border-theme bg-primary/5">
                        <CardBody className="p-4">
                            <p className="text-xs font-semibold text-secondary uppercase mb-1">Total Volume</p>
                            <p className="text-xl font-bold text-primary">{formatMoneySimple(summary.total_volume)}</p>
                        </CardBody>
                    </Card>
                    <Card className="border-theme bg-emerald-50 dark:bg-emerald-900/10">
                        <CardBody className="p-4">
                            <p className="text-xs font-semibold text-secondary uppercase mb-1">Completed Vol</p>
                            <p className="text-xl font-bold text-emerald-600">{formatMoneySimple(summary.completed_volume)}</p>
                        </CardBody>
                    </Card>
                    <Card className="border-theme">
                        <CardBody className="p-4">
                            <p className="text-xs font-semibold text-secondary uppercase mb-1">Total Txns</p>
                            <p className="text-xl font-bold text-primary">{summary.total_transactions}</p>
                        </CardBody>
                    </Card>
                    <Card className="border-theme">
                        <CardBody className="p-4">
                            <p className="text-xs font-semibold text-secondary uppercase mb-1">Pending Txns</p>
                            <p className="text-xl font-bold text-amber-600">{summary.pending_transactions}</p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold mb-2">{provider.business_name} - Transaction Report</h1>
                <p className="text-gray-600">Generated on: {new Date().toLocaleString()}</p>
            </div>

            {/* Transactions Table */}
            <Card className="border-theme overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/5 border-b border-theme text-xs uppercase tracking-wider text-secondary font-semibold">
                                <th className="p-4">Date</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4">Customer & Product</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-secondary/20 border-t-primary-600 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredTx.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-secondary">
                                        <Activity size={32} className="mx-auto mb-3 text-secondary/30" />
                                        <p>No transactions found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTx.map(tx => (
                                    <tr key={tx.id} className="hover:bg-primary/3 transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-primary">{new Date(tx.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-secondary">{new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded inline-block">
                                                {tx.reference_number}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-primary">{tx.user_name || 'Anonymous'}</div>
                                            <div className="text-xs text-secondary">{tx.service_product_name || 'General Service'}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-sm font-bold text-primary">{formatMoneySimple(tx.amount)}</div>
                                            {tx.fee_amount > 0 && (
                                                <div className="text-[10px] text-secondary">Fee: {formatMoneySimple(tx.fee_amount)}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {tx.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right print:hidden">
                                            <div className="flex justify-end gap-2">
                                                {tx.status === 'pending' && (
                                                    <Button variant="outline" size="sm" onClick={() => handleProcess(tx.id)} disabled={processingId === tx.id}>
                                                        {processingId === tx.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} className="text-emerald-600" />}
                                                    </Button>
                                                )}
                                                {tx.status === 'completed' && (
                                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openRefundModal(tx)} disabled={processingId === tx.id}>
                                                        Refund
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Refund Modal */}
            {refundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-theme overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-theme bg-red-50/50 dark:bg-red-900/10">
                            <h3 className="text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle size={18} /> Process Refund
                            </h3>
                            <button onClick={() => setRefundModal(null)}><X size={18} className="text-secondary" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-sm text-secondary">
                                Refunding transaction <span className="font-mono font-bold text-primary">{refundModal.reference_number}</span> for customer <span className="font-semibold text-primary">{refundModal.user_name || 'Anonymous'}</span>.
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-secondary mb-1 block">Refund Amount</label>
                                <input type="number" step="0.01" min="0.01" max={refundModal.amount} value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50" />
                                <p className="text-[10px] text-secondary mt-1">Max: {formatMoneySimple(refundModal.amount)} (full refund)</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-secondary mb-1 block">Reason</label>
                                <select value={refundReason} onChange={e => setRefundReason(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50">
                                    <option value="requested_by_customer">Requested by Customer</option>
                                    <option value="duplicate">Duplicate Charge</option>
                                    <option value="fraudulent">Fraudulent Transaction</option>
                                    <option value="service_not_delivered">Service Not Delivered</option>
                                    <option value="defective_product">Defective Product</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            {refundError && <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{refundError}</p>}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-theme bg-secondary/5">
                            <Button variant="outline" onClick={() => setRefundModal(null)} className="flex-1">Cancel</Button>
                            <Button onClick={handleRefundSubmit} disabled={refundLoading || !refundAmount} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600">
                                {refundLoading ? <RefreshCw size={14} className="animate-spin mr-2" /> : null}
                                {refundLoading ? 'Processing...' : `Refund ${formatMoneySimple(refundAmount)}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTab;
