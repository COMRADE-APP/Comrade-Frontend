import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity, AlertCircle, FileText, Settings, Users, ArrowRight, CheckCircle, RefreshCcw } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className="border-theme">
        <CardBody className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorClass}`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <div>
                <p className="text-sm font-medium text-secondary mb-1">{title}</p>
                <p className="text-2xl font-bold text-primary">{value}</p>
            </div>
        </CardBody>
    </Card>
);

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        setError(null);
        try {
            // First get the list of provider registrations for this user
            const response = await api.get('/payments/provider-registrations/');
            const providerList = response.data.results || response.data;
            
            // For each provider, fetch their dashboard stats
            const providersWithStats = await Promise.all(providerList.map(async (provider) => {
                try {
                    const statsRes = await api.get(`/payments/provider-registrations/${provider.id}/dashboard/`);
                    return { ...provider, stats: statsRes.data };
                } catch (e) {
                    console.error('Failed to load stats for provider', provider.id, e);
                    return provider;
                }
            }));
            
            setProviders(providersWithStats);
        } catch (err) {
            console.error('Failed to load providers:', err);
            setError('Could not load your provider accounts.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-primary mb-2">Error Loading Dashboard</h2>
                <p className="text-secondary mb-6">{error}</p>
                <Button onClick={loadProviders} variant="primary">Try Again</Button>
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-primary/20 mb-6" />
                <h2 className="text-2xl font-bold text-primary mb-2">No Provider Accounts Found</h2>
                <p className="text-secondary mb-8 max-w-md">
                    You haven't registered any business as a service provider yet. Start the registration process to access the provider tools.
                </p>
                <Button onClick={() => navigate('/providers/register')} variant="primary" size="lg">
                    Register a Business <ArrowRight size={18} className="ml-2" />
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-elevated border-b border-theme sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Provider Dashboard</h1>
                        <p className="text-sm text-secondary font-medium tracking-wide">Manage your service operations</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={loadProviders} className="hidden sm:flex">
                            <RefreshCcw size={16} className="mr-2" /> Refresh
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/providers/register')}>
                            New Provider
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {providers.map((provider) => (
                    <Card key={provider.id} className="border-theme overflow-hidden border-2 border-primary/10">
                        <div className="bg-primary/5 px-6 py-4 border-b border-theme flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                {provider.logo ? (
                                    <img src={provider.logo} alt={provider.business_name} className="w-12 h-12 rounded-xl object-cover bg-white p-1" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                                        {provider.business_name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        {provider.business_name}
                                        {provider.status === 'approved' && <CheckCircle size={16} className="text-emerald-500" />}
                                    </h2>
                                    <p className="text-sm text-secondary uppercase tracking-wider font-semibold">
                                        {provider.provider_type.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    provider.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    provider.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    provider.status === 'submitted' || provider.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {provider.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <CardBody className="p-6">
                            {provider.status === 'draft' || provider.status === 'pending_documents' ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <h4 className="font-bold text-amber-800">Action Required</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Your application is incomplete. Please submit your application and upload the required business documents to proceed.
                                        </p>
                                        {provider.status === 'draft' && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                                                onClick={async () => {
                                                    await api.post(`/payments/provider-registrations/${provider.id}/submit/`);
                                                    loadProviders();
                                                }}
                                            >
                                                Submit Application Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <MetricCard 
                                    title="Total Volume" 
                                    value={formatMoneySimple(provider.stats?.total_volume || 0)} 
                                    icon={Activity} 
                                    colorClass="bg-blue-500/10 text-blue-600"
                                />
                                <MetricCard 
                                    title="Transactions" 
                                    value={provider.stats?.total_transactions || 0} 
                                    icon={FileText} 
                                    colorClass="bg-emerald-500/10 text-emerald-600"
                                />
                                <MetricCard 
                                    title="Active Products" 
                                    value={provider.stats?.active_products || 0} 
                                    icon={Building2} 
                                    colorClass="bg-purple-500/10 text-purple-600"
                                />
                                <MetricCard 
                                    title="Active Staff" 
                                    value={provider.stats?.staff_count || 0} 
                                    icon={Users} 
                                    colorClass="bg-amber-500/10 text-amber-600"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 border-t border-theme pt-6">
                                <Button variant="outline" className="flex-1 sm:flex-none">
                                    <FileText size={18} className="mr-2" /> View Documents
                                </Button>
                                {provider.status === 'approved' && (
                                    <>
                                        <Button variant="outline" className="flex-1 sm:flex-none">
                                            <Building2 size={18} className="mr-2" /> Manage Products
                                        </Button>
                                        <Button variant="outline" className="flex-1 sm:flex-none">
                                            <Users size={18} className="mr-2" /> Manage Staff
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" className="flex-1 sm:flex-none ml-auto text-secondary hover:text-primary">
                                    <Settings size={18} className="mr-2" /> Settings
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ProviderDashboard;
