import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Building2, Activity, Package, Users, FileText, Settings, AlertCircle,
    CheckCircle, Clock, XCircle, RefreshCcw, MessageSquare, LayoutDashboard
} from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import providerService from '../../services/provider.service';
import OverviewTab from './tabs/OverviewTab';
import ProductsTab from './tabs/ProductsTab';
import StaffTab from './tabs/StaffTab';
import DocumentsTab from './tabs/DocumentsTab';
import SettingsTab from './tabs/SettingsTab';
import ApplicationsTab from './tabs/ApplicationsTab';
import QueriesTab from './tabs/QueriesTab';

import TransactionsTab from './tabs/TransactionsTab';
import ConnectionsTab from './tabs/ConnectionsTab';

const STATUS_CONFIG = {
    draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock, label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock, label: 'Submitted' },
    under_review: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: 'Under Review' },
    approved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' },
    suspended: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle, label: 'Suspended' },
};

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Packages', icon: Package },
    { id: 'staff', label: 'Staff & Team', icon: Users },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'queries', label: 'Queries', icon: MessageSquare },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'connections', label: 'Connections', icon: Building2 },
    { id: 'documents', label: 'Compliance', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const ProviderDetail = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [provider, setProvider] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab to URL
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (activeTab !== currentTab) {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab]);

    // Sync URL to tab (back button)
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab && currentTab !== activeTab) {
            setActiveTab(currentTab);
        }
    }, [searchParams.get('tab')]);

    useEffect(() => {
        if (providerId) loadProvider();
    }, [providerId]);

    const loadProvider = async () => {
        setLoading(true);
        setError(null);
        try {
            const [providerData, statsData] = await Promise.all([
                providerService.getRegistrationDetail(providerId),
                providerService.getDashboardStats(providerId).catch(() => ({})),
            ]);
            setProvider(providerData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load provider:', err);
            setError('Could not load provider details. It may not exist or you may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 skeleton-shimmer" />
                    <div className="w-48 h-8 rounded-lg bg-secondary/10 skeleton-shimmer" />
                </div>
                <Card className="border-theme">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/10 skeleton-shimmer" />
                            <div className="space-y-2 flex-1">
                                <div className="w-48 h-6 rounded bg-secondary/10 skeleton-shimmer" />
                                <div className="w-32 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                            </div>
                            <div className="w-24 h-8 rounded-full bg-secondary/10 skeleton-shimmer" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="w-16 h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-24 h-6 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-theme">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-28 h-10 rounded-t-xl bg-secondary/10 skeleton-shimmer flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-primary mb-2">Error Loading Provider</h2>
                <p className="text-secondary mb-6">{error || 'Provider not found'}</p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/providers/dashboard')}>
                        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                    </Button>
                    <Button variant="primary" onClick={loadProvider}>Try Again</Button>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[provider.status] || STATUS_CONFIG.draft;
    const StatusIcon = statusConfig.icon;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/providers/dashboard')}
                    className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">Provider Management</h1>
            </div>

            {/* Provider Header Card */}
            <Card className="border-theme overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6">
                    <div className="flex flex-wrap items-start gap-5">
                        {/* Logo */}
                        {provider.logo_url ? (
                            <img src={provider.logo_url} alt={provider.business_name} className="w-16 h-16 rounded-2xl object-cover bg-white border border-theme shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20">
                                {provider.business_name?.charAt(0) || 'P'}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold text-primary truncate">{provider.business_name}</h2>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusConfig.color}`}>
                                    <StatusIcon size={14} />
                                    {statusConfig.label}
                                </span>
                            </div>
                            <p className="text-sm text-secondary mt-1 capitalize">
                                {provider.provider_type_display || provider.provider_type?.replace(/_/g, ' ')}
                                {provider.category_display && ` · ${provider.category_display}`}
                            </p>
                            {provider.description && (
                                <p className="text-sm text-secondary mt-2 line-clamp-2 max-w-2xl">{provider.description}</p>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" onClick={loadProvider}>
                                <RefreshCcw size={16} className="mr-1.5" /> Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Rejection banner */}
            {provider.status === 'rejected' && provider.rejection_reason && (
                <Card className="border-2 border-red-500/30 bg-red-500/5">
                    <CardBody className="p-4 flex items-start gap-3">
                        <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="font-bold text-red-800 dark:text-red-400">Application Rejected</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{provider.rejection_reason}</p>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Draft/Submitted action banner */}
            {(provider.status === 'draft' || provider.status === 'pending_documents') && (
                <Card className="border-2 border-amber-500/30 bg-amber-500/5">
                    <CardBody className="p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-800 dark:text-amber-400">Action Required</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Your application is incomplete. Submit it and upload the required documents to proceed.
                            </p>
                            {provider.status === 'draft' && (
                                <Button
                                    variant="outline"
                                    className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                                    onClick={async () => {
                                        await providerService.submitRegistration(providerId);
                                        loadProvider();
                                    }}
                                >
                                    Submit Application Now
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b-2 border-emerald-100 dark:border-emerald-900/30 overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-[2px] transition-all duration-200 whitespace-nowrap rounded-t-lg ${
                            activeTab === tab.id
                                ? 'border-amber-500 text-emerald-700 dark:text-amber-400 bg-gradient-to-t from-amber-50/80 to-transparent dark:from-amber-900/10'
                                : 'border-transparent text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pb-12">
                {activeTab === 'overview' && <OverviewTab provider={provider} stats={stats} onRefresh={loadProvider} />}
                {activeTab === 'products' && <ProductsTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'staff' && <StaffTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'applications' && <ApplicationsTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'queries' && <QueriesTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'transactions' && <TransactionsTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'connections' && <ConnectionsTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'documents' && <DocumentsTab provider={provider} onRefresh={loadProvider} />}
                {activeTab === 'settings' && <SettingsTab provider={provider} onRefresh={loadProvider} />}
            </div>
        </div>
    );
};

export default ProviderDetail;
