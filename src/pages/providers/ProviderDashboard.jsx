import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity, AlertCircle, FileText, Settings, Users, CheckCircle, RefreshCcw, Wallet, MessageSquare, Clock, DollarSign, TrendingUp, Package, Zap, ChevronDown, ChevronUp, Shield, Banknote, BookOpen } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import providerService from '../../services/provider.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import { ROUTES } from '../../constants/routes';
import ProductsTab from './tabs/ProductsTab';
import StaffTab from './tabs/StaffTab';
import ApplicationsTab from './tabs/ApplicationsTab';
import QueriesTab from './tabs/QueriesTab';
import TransactionsTab from './tabs/TransactionsTab';
import DocumentsTab from './tabs/DocumentsTab';
import InvestmentsTab from './tabs/InvestmentsTab';
import LoansTab from './tabs/LoansTab';
import InsuranceTab from './tabs/InsuranceTab';
import BillsTab from './tabs/BillsTab';
import CoursesTab from './tabs/CoursesTab';
import SettingsTab from './tabs/SettingsTab';

const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className="border-theme">
        <CardBody className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-xl ${colorClass} shrink-0`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-secondary uppercase tracking-wider mb-0.5">{title}</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">{value}</p>
            </div>
        </CardBody>
    </Card>
);

const MiniBarChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.amount), 1);
    return (
        <div className="flex items-end gap-1 h-16 sm:h-20 mt-2">
            {data.slice(-14).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-primary-500/60 hover:bg-primary-500 transition-all duration-200 min-h-[2px]"
                        style={{ height: `${(d.amount / maxVal) * 100}%` }} />
                    <span className="text-[8px] sm:text-[9px] text-tertiary">{new Date(d.date).getDate()}</span>
                </div>
            ))}
        </div>
    );
};

const getActivityIcon = (type) => {
    switch (type) {
        case 'transaction': return <DollarSign size={12} className="text-emerald-500" />;
        case 'query': return <MessageSquare size={12} className="text-blue-500" />;
        case 'application': return <FileText size={12} className="text-amber-500" />;
        default: return <Activity size={12} className="text-secondary" />;
    }
};

const getStatusBadge = (status) => {
    const map = {
        completed: 'bg-emerald-50 text-emerald-700', active: 'bg-emerald-50 text-emerald-700',
        resolved: 'bg-emerald-50 text-emerald-700', approved: 'bg-emerald-50 text-emerald-700',
        pending: 'bg-amber-50 text-amber-700', submitted: 'bg-blue-50 text-blue-700',
        under_review: 'bg-blue-50 text-blue-700', open: 'bg-blue-50 text-blue-700',
        in_progress: 'bg-primary-50 text-primary-700', rejected: 'bg-red-50 text-red-700',
        failed: 'bg-red-50 text-red-700', escalated: 'bg-orange-50 text-orange-700',
    };
    return map[status] || 'bg-gray-50 text-gray-700';
};

const SectionHeader = ({ icon: Icon, title, subtitle, badge, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-primary text-sm sm:text-base">{title}</h3>
                        {subtitle && <p className="text-xs text-secondary hidden sm:block">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {badge != null && badge > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{badge}</span>
                    )}
                    <ChevronDown size={18} className={`text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {open && <div className="px-3 sm:px-6 pb-4 sm:pb-6">{subtitle && <p className="text-xs text-secondary sm:hidden mb-3">{subtitle}</p>}</div>}
        </div>
    );
};

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openSections, setOpenSections] = useState({});

    useEffect(() => { loadProviders(); }, []);

    const loadProviders = async () => {
        setLoading(true); setError(null);
        try {
            const providerList = await providerService.getMyRegistrations();
            const providersWithStats = await Promise.all(providerList.map(async (p) => {
                try {
                    const stats = await providerService.getDashboardStats(p.id);
                    return { ...p, stats };
                } catch (e) { return { ...p, stats: {} }; }
            }));
            setProviders(providersWithStats);
        } catch (err) {
            setError('Could not load your provider accounts.');
        } finally { setLoading(false); }
    };

    const toggleSection = (providerId, section) => {
        setOpenSections(prev => ({
            ...prev,
            [`${providerId}-${section}`]: !prev[`${providerId}-${section}`]
        }));
    };

    const isOpen = (providerId, section) => !!openSections[`${providerId}-${section}`];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-primary mb-2">Error Loading Dashboard</h2>
                <p className="text-secondary mb-6">{error}</p>
                <Button onClick={loadProviders} variant="primary">Try Again</Button>
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-primary/20 mb-6" />
                <h2 className="text-2xl font-bold text-primary mb-2">No Provider Accounts</h2>
                <p className="text-secondary mb-8 max-w-md">You haven't registered any business as a service provider yet.</p>
                <Button onClick={() => navigate(ROUTES.PROVIDER_REGISTRATION)} variant="primary" size="lg">
                    Register a Business <ChevronDown size={18} className="ml-2 rotate-270" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-16">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary">Provider Dashboard</h1>
                    <p className="text-xs sm:text-sm text-secondary">Operations hub for your business</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadProviders}>
                        <RefreshCcw size={14} className="mr-1.5" /> Refresh
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.PROVIDER_REGISTRATION)}>
                        New Provider
                    </Button>
                </div>
            </div>

            {providers.map(provider => {
                const s = provider.stats || {};
                const pt = provider.provider_type;
                return (
                    <div key={provider.id} className="space-y-4 sm:space-y-6">
                        {/* Provider Header */}
                        <Card className="border-theme border-2 border-primary/10 overflow-hidden">
                            <div className="bg-primary/5 px-4 sm:px-6 py-3 sm:py-4 border-b border-theme flex flex-wrap gap-3 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                                        {provider.business_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                                            {provider.business_name}
                                            {provider.status === 'approved' && <CheckCircle size={14} className="text-emerald-500" />}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-secondary capitalize">{pt.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${provider.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : provider.status === 'rejected' ? 'bg-red-50 text-red-700' : provider.status === 'submitted' || provider.status === 'under_review' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                                    {provider.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {provider.status === 'draft' && (
                                <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Action Required — Application Incomplete</p>
                                        <Button size="sm" className="mt-2 border-amber-300 text-amber-700" variant="outline"
                                            onClick={async () => { await providerService.submitRegistration(provider.id); loadProviders(); }}>
                                            Submit Application Now
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <CardBody className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                                {/* KPI Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                    <MetricCard title="Kitty Balance" value={formatMoneySimple(s.kitty_balance || 0)} icon={Wallet} colorClass="bg-emerald-500/10 text-emerald-600" />
                                    <MetricCard title="Total Volume" value={formatMoneySimple(s.total_volume || 0)} icon={Activity} colorClass="bg-blue-500/10 text-blue-600" />
                                    <MetricCard title="Transactions" value={s.total_transactions || 0} icon={DollarSign} colorClass="bg-primary-500/10 text-primary-600" />
                                    <MetricCard title="Active Products" value={s.active_products || 0} icon={Package} colorClass="bg-purple-500/10 text-purple-600" />
                                    <MetricCard title="Staff" value={s.staff_count || 0} icon={Users} colorClass="bg-amber-500/10 text-amber-600" />
                                    <MetricCard title="Pending Queries" value={s.pending_queries || 0} icon={MessageSquare} colorClass="bg-blue-500/10 text-blue-600" />
                                    <MetricCard title="Pending Apps" value={s.pending_applications || 0} icon={FileText} colorClass="bg-amber-500/10 text-amber-600" />
                                    <MetricCard title="Total Queries" value={s.total_queries || 0} icon={Zap} colorClass="bg-rose-500/10 text-rose-600" />
                                </div>

                                {/* Revenue Chart + Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                    <div className="lg:col-span-2 bg-elevated rounded-2xl border border-theme p-4 sm:p-5">
                                        <h3 className="font-bold text-primary flex items-center gap-2 text-sm sm:text-base">
                                            <TrendingUp size={18} className="text-primary-500" /> 30-Day Revenue
                                        </h3>
                                        {(s.daily_revenue?.length > 0) ? <MiniBarChart data={s.daily_revenue} /> : (
                                            <div className="flex items-center justify-center h-16 text-secondary text-sm">No revenue data yet</div>
                                        )}
                                    </div>
                                    <div className="bg-elevated rounded-2xl border border-theme p-4 sm:p-5">
                                        <h3 className="font-bold text-primary flex items-center gap-2 mb-3 text-sm sm:text-base">
                                            <Clock size={18} className="text-amber-500" /> Recent Activity
                                        </h3>
                                        {(s.recent_activity?.length > 0) ? (
                                            <div className="space-y-2.5 max-h-56 overflow-y-auto">
                                                {s.recent_activity.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 pb-2.5 border-b border-theme last:border-0 last:pb-0">
                                                        <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            {getActivityIcon(item.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-primary truncate">{item.description}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadge(item.status)}`}>
                                                                    {item.status.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-[10px] text-tertiary">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-16 text-secondary text-sm">No recent activity</div>
                                        )}
                                    </div>
                                </div>

                                {/* Operations Sections */}
                                <div className="space-y-3 sm:space-y-4 pt-2">
                                    {/* Products */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'products')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Package size={18} /></div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-primary text-sm sm:text-base">Products & Packages</h3>
                                                    <p className="text-xs text-secondary hidden sm:block">Manage your service products</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'products') ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen(provider.id, 'products') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6">
                                                <ProductsTab provider={provider} onRefresh={loadProviders} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Service-specific sections */}
                                    {pt === 'financial_service' && (
                                        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                            <button onClick={() => toggleSection(provider.id, 'investments')}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0"><TrendingUp size={18} /></div>
                                                    <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Investments</h3></div>
                                                </div>
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'investments') ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen(provider.id, 'investments') && (
                                                <div className="px-3 sm:px-6 pb-4 sm:pb-6"><InvestmentsTab provider={provider} onRefresh={loadProviders} /></div>
                                            )}
                                        </div>
                                    )}
                                    {pt === 'loan_provider' && (
                                        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                            <button onClick={() => toggleSection(provider.id, 'loans')}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><DollarSign size={18} /></div>
                                                    <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Loans</h3></div>
                                                </div>
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'loans') ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen(provider.id, 'loans') && (
                                                <div className="px-3 sm:px-6 pb-4 sm:pb-6"><LoansTab provider={provider} onRefresh={loadProviders} /></div>
                                            )}
                                        </div>
                                    )}
                                    {pt === 'insurance_provider' && (
                                        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                            <button onClick={() => toggleSection(provider.id, 'insurance')}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><Shield size={18} /></div>
                                                    <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Insurance</h3></div>
                                                </div>
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'insurance') ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen(provider.id, 'insurance') && (
                                                <div className="px-3 sm:px-6 pb-4 sm:pb-6"><InsuranceTab provider={provider} onRefresh={loadProviders} /></div>
                                            )}
                                        </div>
                                    )}
                                    {(pt === 'bill_provider' || pt === 'utility_provider') && (
                                        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                            <button onClick={() => toggleSection(provider.id, 'bills')}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Banknote size={18} /></div>
                                                    <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Bills</h3></div>
                                                </div>
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'bills') ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen(provider.id, 'bills') && (
                                                <div className="px-3 sm:px-6 pb-4 sm:pb-6"><BillsTab provider={provider} onRefresh={loadProviders} /></div>
                                            )}
                                        </div>
                                    )}
                                    {pt === 'course_provider' && (
                                        <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                            <button onClick={() => toggleSection(provider.id, 'courses')}
                                                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><BookOpen size={18} /></div>
                                                    <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Courses</h3></div>
                                                </div>
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'courses') ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen(provider.id, 'courses') && (
                                                <div className="px-3 sm:px-6 pb-4 sm:pb-6"><CoursesTab provider={provider} onRefresh={loadProviders} /></div>
                                            )}
                                        </div>
                                    )}

                                    {/* Staff */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'staff')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Users size={18} /></div>
                                                <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Staff & Team</h3></div>
                                            </div>
                                            <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'staff') ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen(provider.id, 'staff') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><StaffTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>

                                    {/* Applications */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'applications')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText size={18} /></div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-primary text-sm sm:text-base">Applications</h3>
                                                    <span className="text-xs text-secondary hidden sm:inline">{s.pending_applications || 0} pending</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.pending_applications > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.pending_applications}</span>}
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'applications') ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {isOpen(provider.id, 'applications') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><ApplicationsTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>

                                    {/* Queries */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'queries')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><MessageSquare size={18} /></div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-primary text-sm sm:text-base">Customer Queries</h3>
                                                    <span className="text-xs text-secondary hidden sm:inline">{s.pending_queries || 0} pending</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.pending_queries > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.pending_queries}</span>}
                                                <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'queries') ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {isOpen(provider.id, 'queries') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><QueriesTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>

                                    {/* Transactions */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'transactions')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Activity size={18} /></div>
                                                <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Transactions</h3></div>
                                            </div>
                                            <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'transactions') ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen(provider.id, 'transactions') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><TransactionsTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>

                                    {/* Documents */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'documents')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"><FileText size={18} /></div>
                                                <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Compliance Documents</h3></div>
                                            </div>
                                            <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'documents') ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen(provider.id, 'documents') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><DocumentsTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>

                                    {/* Settings */}
                                    <div className="border border-theme rounded-2xl bg-elevated overflow-hidden">
                                        <button onClick={() => toggleSection(provider.id, 'settings')}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"><Settings size={18} /></div>
                                                <div className="text-left"><h3 className="font-bold text-primary text-sm sm:text-base">Settings</h3></div>
                                            </div>
                                            <ChevronDown size={18} className={`text-secondary transition-transform ${isOpen(provider.id, 'settings') ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen(provider.id, 'settings') && (
                                            <div className="px-3 sm:px-6 pb-4 sm:pb-6"><SettingsTab provider={provider} onRefresh={loadProviders} /></div>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
};

export default ProviderDashboard;
