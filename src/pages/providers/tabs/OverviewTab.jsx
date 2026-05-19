import React, { useState, useEffect } from 'react';
import { Activity, FileText, Package, Users, MessageSquare, TrendingUp, Clock, Wallet, ArrowUpRight } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../../components/common/Card';
import providerService from '../../../services/provider.service';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const MetricCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <Card className="border-theme hover:shadow-md transition-shadow duration-200">
        <CardBody className="p-5 flex items-center gap-4">
            <div className={`p-3.5 rounded-xl ${colorClass}`}>
                <Icon size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{title}</p>
                <p className="text-xl font-bold text-primary truncate">{value}</p>
                {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
            </div>
        </CardBody>
    </Card>
);

const OverviewTab = ({ provider, stats, onRefresh }) => {
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [recentQueries, setRecentQueries] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    useEffect(() => {
        loadRecentActivity();
    }, [provider.id]);

    const loadRecentActivity = async () => {
        setLoadingActivity(true);
        try {
            const [txRes, queryRes] = await Promise.all([
                providerService.getProviderTransactions({ page_size: 5 }).catch(() => ({ results: [] })),
                providerService.getProviderQueries({ page_size: 5 }).catch(() => ({ results: [] })),
            ]);
            setRecentTransactions(txRes.results || txRes || []);
            setRecentQueries(queryRes.results || queryRes || []);
        } catch (e) {
            console.error('Failed to load activity:', e);
        } finally {
            setLoadingActivity(false);
        }
    };

    const txStatusColor = (status) => {
        const colors = {
            completed: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
            pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
            refunded: 'text-red-600 bg-red-50 dark:bg-red-900/20',
            failed: 'text-red-600 bg-red-50 dark:bg-red-900/20',
        };
        return colors[status] || 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    };

    const queryStatusColor = (status) => {
        const colors = {
            open: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
            in_progress: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
            resolved: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
            escalated: 'text-red-600 bg-red-50 dark:bg-red-900/20',
            closed: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
        };
        return colors[status] || 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Volume"
                    value={formatMoneySimple(stats?.total_volume || 0)}
                    icon={Activity}
                    colorClass="bg-blue-500/10 text-blue-600"
                />
                <MetricCard
                    title="Transactions"
                    value={stats?.total_transactions || 0}
                    icon={FileText}
                    colorClass="bg-emerald-500/10 text-emerald-600"
                    subtitle={stats?.pending_count ? `${stats.pending_count} pending` : undefined}
                />
                <MetricCard
                    title="Active Products"
                    value={stats?.active_products || provider.service_products_count || 0}
                    icon={Package}
                    colorClass="bg-purple-500/10 text-purple-600"
                />
                <MetricCard
                    title="Active Staff"
                    value={stats?.staff_count || provider.staff_count || 0}
                    icon={Users}
                    colorClass="bg-amber-500/10 text-amber-600"
                />
            </div>

            {/* Linked Kitty */}
            {provider.linked_kitty_name && (
                <Card className="border-theme border-l-4 border-l-emerald-500">
                    <CardBody className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Wallet size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Operations Kitty</p>
                                <p className="text-lg font-bold text-primary">{provider.linked_kitty_name}</p>
                            </div>
                        </div>
                        {provider.linked_payment_group && (
                            <a
                                href={`/payments/groups/${provider.linked_payment_group}`}
                                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                View Kitty <ArrowUpRight size={14} />
                            </a>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Business Info Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-theme">
                    <CardHeader className="p-4 border-b border-theme">
                        <h3 className="font-semibold text-primary text-sm">Business Information</h3>
                    </CardHeader>
                    <CardBody className="p-4 space-y-3">
                        {[
                            { label: 'Email', value: provider.business_email },
                            { label: 'Phone', value: provider.business_phone },
                            { label: 'Address', value: provider.business_address },
                            { label: 'Reg. Number', value: provider.business_registration_number },
                            { label: 'Tax ID', value: provider.tax_id },
                            { label: 'Website', value: provider.website },
                        ].filter(item => item.value).map(item => (
                            <div key={item.label} className="flex justify-between text-sm">
                                <span className="text-secondary font-medium">{item.label}</span>
                                <span className="text-primary font-semibold text-right truncate ml-4 max-w-[60%]">{item.value}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary font-medium">Commission Rate</span>
                            <span className="text-primary font-semibold">{(parseFloat(provider.commission_rate || 0) * 100).toFixed(2)}%</span>
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Transactions */}
                <Card className="border-theme">
                    <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                        <h3 className="font-semibold text-primary text-sm">Recent Transactions</h3>
                        <TrendingUp size={16} className="text-secondary" />
                    </CardHeader>
                    <CardBody className="p-0">
                        {loadingActivity ? (
                            <div className="p-6 text-center">
                                <div className="w-8 h-8 rounded-full border-2 border-secondary/20 border-t-primary-600 animate-spin mx-auto" />
                            </div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="p-6 text-center text-secondary text-sm">
                                No transactions yet
                            </div>
                        ) : (
                            <div className="divide-y divide-theme">
                                {recentTransactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-primary/3 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-primary truncate">
                                                {tx.service_product_name || tx.reference_number}
                                            </p>
                                            <p className="text-xs text-secondary mt-0.5">
                                                {tx.user_name} · {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right ml-3 shrink-0">
                                            <p className="text-sm font-bold text-primary">{formatMoneySimple(tx.amount)}</p>
                                            <span className={`inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${txStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Recent Queries */}
            <Card className="border-theme">
                <CardHeader className="p-4 border-b border-theme flex items-center justify-between">
                    <h3 className="font-semibold text-primary text-sm">Recent Customer Queries</h3>
                    <MessageSquare size={16} className="text-secondary" />
                </CardHeader>
                <CardBody className="p-0">
                    {loadingActivity ? (
                        <div className="p-6 text-center">
                            <div className="w-8 h-8 rounded-full border-2 border-secondary/20 border-t-primary-600 animate-spin mx-auto" />
                        </div>
                    ) : recentQueries.length === 0 ? (
                        <div className="p-6 text-center text-secondary text-sm">
                            No customer queries yet
                        </div>
                    ) : (
                        <div className="divide-y divide-theme">
                            {recentQueries.slice(0, 5).map(query => (
                                <div key={query.id} className="px-4 py-3 flex items-center justify-between hover:bg-primary/3 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-primary truncate">{query.subject}</p>
                                        <p className="text-xs text-secondary mt-0.5">
                                            {query.user_name} · {query.query_type_display || query.query_type}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 shrink-0">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${queryStatusColor(query.status)}`}>
                                            {query.status?.replace(/_/g, ' ')}
                                        </span>
                                        {query.priority === 'urgent' && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20">
                                                URGENT
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default OverviewTab;
