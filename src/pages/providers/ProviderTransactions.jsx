import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Download, Filter, Search, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import providerService from '../../services/provider.service';
import { formatMoneySimple } from '../../utils/moneyUtils';

const ProviderTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [txRes, summaryRes] = await Promise.allSettled([
                providerService.getProviderTransactions(),
                providerService.getTransactionSummary(),
            ]);
            if (txRes.status === 'fulfilled') {
                setTransactions(txRes.value.results || txRes.value || []);
            }
            if (summaryRes.status === 'fulfilled') {
                setSummary(summaryRes.value);
            }
        } catch (e) {
            console.error('Failed to load transactions:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        Transactions & Payouts
                    </h1>
                    <p className="text-sm text-secondary mt-1">Track your earnings and withdrawal history</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => loadTransactions(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-elevated border rounded-xl text-secondary hover:bg-secondary/10 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                        Request Payout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-elevated border rounded-xl p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-secondary mb-1">Available for Payout</p>
                            <h3 className="text-2xl font-bold text-primary">
                                {formatMoneySimple(summary?.available_for_payout || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-elevated border rounded-xl p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-secondary mb-1">Pending Clearance</p>
                            <h3 className="text-2xl font-bold text-primary">
                                {formatMoneySimple(summary?.pending_clearance || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-elevated border rounded-xl p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-secondary mb-1">Total Withdrawn</p>
                            <h3 className="text-2xl font-bold text-primary">
                                {formatMoneySimple(summary?.total_withdrawn || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
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
                            placeholder="Search by transaction ID..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/5 text-secondary font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-secondary">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-secondary/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-primary">{t.id || t.transaction_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {(t.amount > 0 || t.transaction_type === 'payment') ? (
                                                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-primary">{t.transaction_type || t.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-secondary">
                                        {new Date(t.created_at || t.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <span className={t.amount > 0 ? 'text-emerald-600' : 'text-primary'}>
                                            {t.amount > 0 ? '+' : '-'}{formatMoneySimple(Math.abs(t.amount))}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${(t.status === 'Completed' || t.status === 'completed') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                                        `}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProviderTransactions;
