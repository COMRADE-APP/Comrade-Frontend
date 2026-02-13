import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Briefcase, Plus, Search, Filter, Users,
    FileText, DollarSign, Building, PieChart, Building2,
    Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
    Heart, Globe, Landmark, BarChart3, Shield, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const INDUSTRY_LABELS = {
    tech: 'Technology', agri: 'Agriculture', fin: 'Finance',
    retail: 'Retail', health: 'Healthcare', educ: 'Education', energy: 'Energy', other: 'Other'
};

const STATUS_TIMELINE = [
    { key: 'submitted', label: 'Submitted', icon: FileText, color: 'blue' },
    { key: 'under_review', label: 'Under Review', icon: Eye, color: 'yellow' },
    { key: 'due_diligence', label: 'Due Diligence', icon: Search, color: 'orange' },
    { key: 'negotiating', label: 'Negotiating', icon: AlertCircle, color: 'purple' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
    { key: 'funded', label: 'Funded', icon: DollarSign, color: 'emerald' },
];

const STATUS_ORDER = ['draft', 'submitted', 'under_review', 'due_diligence', 'negotiating', 'approved', 'funded'];

const FundingHub = () => {
    const [activeTab, setActiveTab] = useState('market');
    const [businesses, setBusinesses] = useState([]);
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [allVentures, setAllVentures] = useState([]);
    const [myVentures, setMyVentures] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'market') {
                const data = await fundingService.getAllBusinesses();
                setBusinesses(data);
            } else if (activeTab === 'raise') {
                const data = await fundingService.getMyBusinesses();
                setMyBusinesses(data);
            } else if (activeTab === 'tracking') {
                const data = await fundingService.getMyRequests();
                setMyRequests(data);
            } else if (activeTab === 'ventures') {
                const [myV, allV] = await Promise.all([
                    fundingService.getMyVentures(),
                    fundingService.getVentures()
                ]);
                setMyVentures(myV);
                setAllVentures(allV);
            }
        } catch (error) {
            console.error("Error fetching funding data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-background min-h-screen p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Business Funding Hub</h1>
                <p className="text-secondary mt-2">Connect with investors, raise capital, and explore opportunities.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-theme overflow-x-auto">
                {[
                    { id: 'market', label: 'Startup Market', icon: Building },
                    { id: 'raise', label: 'Raise Capital', icon: TrendingUp },
                    { id: 'invest', label: 'Opportunities', icon: PieChart },
                    { id: 'tracking', label: 'My Applications', icon: Clock },
                    { id: 'ventures', label: 'Capital Ventures', icon: Building2 }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-4 font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-primary' : 'text-secondary hover:text-primary'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    {activeTab === 'market' && <StartupMarket businesses={businesses} loading={loading} navigate={navigate} />}
                    {activeTab === 'raise' && <FoundersHub myBusinesses={myBusinesses} loading={loading} navigate={navigate} />}
                    {activeTab === 'invest' && <InvestmentOpportunities navigate={navigate} />}
                    {activeTab === 'tracking' && <ApplicationTracking requests={myRequests} loading={loading} navigate={navigate} />}
                    {activeTab === 'ventures' && <CapitalVenturesTab myVentures={myVentures} allVentures={allVentures} loading={loading} navigate={navigate} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// ==================== STARTUP MARKET ====================
const StartupMarket = ({ businesses, loading, navigate }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = businesses.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-tertiary w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search startups by name or industry..."
                        className="w-full pl-10 pr-4 py-2 border border-theme rounded-xl focus:ring-2 focus:ring-primary outline-none bg-elevated text-primary"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-theme rounded-xl hover:bg-secondary/5 text-primary">
                    <Filter className="w-5 h-5" /> Filter
                </button>
            </div>

            {loading ? <div className="text-center py-10 text-secondary">Loading startups...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(biz => (
                        <div
                            key={biz.id}
                            onClick={() => navigate(`/funding/business/${biz.id}`)}
                            className="bg-elevated p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                    {biz.logo ? <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover rounded-lg" /> : <Building className="text-secondary" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full uppercase font-bold">{biz.stage}</span>
                                </div>
                            </div>
                            <h3 className="font-bold text-primary mb-1 group-hover:text-primary-600 transition-colors">{biz.name}</h3>
                            <p className="text-sm text-secondary mb-3 line-clamp-2">{biz.description}</p>

                            {/* Investor Count Badge */}
                            <div className="flex items-center gap-4 mb-3 text-sm">
                                <span className="flex items-center gap-1 text-secondary">
                                    <Users className="w-4 h-4" /> {biz.investors_count || 0} investors
                                </span>
                                {biz.is_charity && (
                                    <span className="flex items-center gap-1 text-pink-600">
                                        <Heart className="w-4 h-4" /> Charity
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto border-t border-theme pt-4 flex justify-between items-center text-sm text-secondary">
                                <span>{INDUSTRY_LABELS[biz.industry] || biz.industry}</span>
                                <span className="flex items-center gap-1 text-green-600 font-medium group-hover:gap-2 transition-all">
                                    <TrendingUp className="w-4 h-4" /> View Details
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ==================== FOUNDERS HUB ====================
const FoundersHub = ({ myBusinesses, loading, navigate }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">My Businesses</h2>
            <Button onClick={() => navigate('/funding/create')} className="bg-primary hover:bg-primary-dark text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Register Business
            </Button>
        </div>

        {loading ? <div className="text-secondary">Loading...</div> : (
            <>
                {myBusinesses.length === 0 ? (
                    <div className="text-center py-12 bg-elevated rounded-2xl border border-dashed border-theme">
                        <Briefcase className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">You haven't registered any businesses yet.</p>
                        <button onClick={() => navigate('/funding/create')} className="text-primary font-medium mt-2 hover:underline">Register your first startup</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myBusinesses.map(biz => (
                            <div key={biz.id} className="bg-elevated p-6 rounded-xl border border-theme flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-primary">{biz.name}</h3>
                                    <p className="text-sm text-secondary">{INDUSTRY_LABELS[biz.industry] || biz.industry} • {biz.stage}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/funding/business/${biz.id}`)}
                                        className="px-4 py-2 text-sm border border-theme rounded-lg hover:bg-secondary/5 text-primary"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => navigate(`/funding/request/${biz.id}`)}
                                        className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 font-medium"
                                    >
                                        Request Funding
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
);

// ==================== INVESTMENT OPPORTUNITIES (Category Grid) ====================
const OPPORTUNITY_CATEGORIES = [
    { id: 'charity', label: 'Charity & Giving', icon: Heart, color: 'from-pink-500 to-rose-600', desc: 'Support causes and make an impact', count: 11 },
    { id: 'mmf', label: 'Money Market Funds', icon: PieChart, color: 'from-blue-500 to-cyan-600', desc: 'Low risk, high liquidity savings', count: 11 },
    { id: 'stocks', label: 'Stocks & Equities', icon: BarChart3, color: 'from-green-500 to-emerald-600', desc: 'NSE listed companies', count: 11 },
    { id: 'bonds_domestic', label: 'Domestic Bonds', icon: Landmark, color: 'from-amber-500 to-orange-600', desc: 'Government & corporate bonds', count: 10 },
    { id: 'bonds_foreign', label: 'Foreign Bonds', icon: Globe, color: 'from-violet-500 to-purple-600', desc: 'International fixed income', count: 10 },
    { id: 'agency', label: 'Investment Agencies', icon: Shield, color: 'from-slate-600 to-gray-700', desc: 'Licensed brokers & wealth managers', count: 10 },
];

const InvestmentOpportunities = ({ navigate }) => (
    <div>
        <div className="mb-6">
            <h2 className="text-xl font-bold text-primary mb-1">Explore Investment Opportunities</h2>
            <p className="text-sm text-secondary">Browse diverse investment avenues across multiple asset classes.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OPPORTUNITY_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                    <motion.div
                        key={cat.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => navigate(`/funding/opportunities/${cat.id}`)}
                        className={`bg-gradient-to-br ${cat.color} text-white p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-shadow`}
                    >
                        <Icon className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-1">{cat.label}</h3>
                        <p className="text-sm opacity-80 mb-3">{cat.desc}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm bg-white/15 px-3 py-0.5 rounded-full">{cat.count} listings</span>
                            <div className="flex items-center gap-1 text-sm opacity-70">
                                View All <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </div>
);

// ==================== APPLICATION TRACKING ====================
const ApplicationTracking = ({ requests, loading, navigate }) => {
    const getStatusIndex = (status) => STATUS_ORDER.indexOf(status);
    const isRejected = (status) => status === 'rejected';
    const isWithdrawn = (status) => status === 'withdrawn';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-primary">My Funding Applications</h2>
                    <p className="text-sm text-secondary">Track the status of your funding requests.</p>
                </div>
            </div>

            {loading ? <div className="text-secondary">Loading your applications...</div> : (
                <>
                    {requests.length === 0 ? (
                        <div className="text-center py-16 bg-elevated rounded-2xl border border-dashed border-theme">
                            <Clock className="w-12 h-12 text-tertiary mx-auto mb-4" />
                            <p className="text-secondary mb-2">No funding applications yet.</p>
                            <p className="text-sm text-tertiary">Submit a funding request from the "Raise Capital" tab to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {requests.map(req => {
                                const currentIdx = getStatusIndex(req.status);
                                const rejected = isRejected(req.status);
                                const withdrawn = isWithdrawn(req.status);

                                return (
                                    <div key={req.id} className="bg-elevated rounded-2xl border border-theme p-6">
                                        {/* Request Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-primary">{req.business_name || 'Business'}</h3>
                                                <p className="text-sm text-secondary">
                                                    {req.target_venture_name ? `To: ${req.target_venture_name}` : 'Open Application'} • Created {new Date(req.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">KES {Number(req.amount_needed).toLocaleString()}</p>
                                                <p className="text-xs text-secondary">{req.equity_offered}% equity</p>
                                            </div>
                                        </div>

                                        {/* Status Timeline */}
                                        {(rejected || withdrawn) ? (
                                            <div className={`p-4 rounded-xl flex items-center gap-3 ${rejected ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
                                                <XCircle className={`w-6 h-6 ${rejected ? 'text-red-500' : 'text-gray-500'}`} />
                                                <div>
                                                    <p className={`font-semibold ${rejected ? 'text-red-700' : 'text-gray-700'}`}>
                                                        Application {rejected ? 'Rejected' : 'Withdrawn'}
                                                    </p>
                                                    <p className={`text-sm ${rejected ? 'text-red-500' : 'text-gray-500'}`}>
                                                        {rejected ? 'Your application was not approved. Consider revising and resubmitting.' : 'You withdrew this application.'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                                                {STATUS_TIMELINE.map((s, idx) => {
                                                    const isCompleted = currentIdx > STATUS_ORDER.indexOf(s.key);
                                                    const isCurrent = req.status === s.key;
                                                    const Icon = s.icon;

                                                    return (
                                                        <React.Fragment key={s.key}>
                                                            <div className={`flex flex-col items-center min-w-[80px] ${isCurrent ? 'scale-110' : ''}`}>
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isCompleted ? 'bg-green-100 text-green-600' :
                                                                        isCurrent ? `bg-${s.color}-100 text-${s.color}-600 ring-2 ring-${s.color}-300` :
                                                                            'bg-gray-100 text-gray-400'
                                                                    }`}>
                                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                                                </div>
                                                                <span className={`text-[10px] font-medium text-center ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-tertiary'
                                                                    }`}>
                                                                    {s.label}
                                                                </span>
                                                            </div>
                                                            {idx < STATUS_TIMELINE.length - 1 && (
                                                                <div className={`flex-1 h-0.5 min-w-[20px] ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ==================== CAPITAL VENTURES ====================
const CapitalVenturesTab = ({ myVentures, allVentures, loading, navigate }) => {
    const otherVentures = allVentures.filter(v => !myVentures.some(mv => mv.id === v.id));

    return (
        <div className="space-y-8">
            {/* My Ventures Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary">My Funding Organizations</h2>
                    <Button onClick={() => navigate('/funding/ventures/create')} className="bg-primary hover:bg-primary-dark text-white flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create Funding Org
                    </Button>
                </div>

                {loading ? <div className="text-secondary">Loading...</div> : (
                    <>
                        {myVentures.length === 0 ? (
                            <div className="text-center py-8 bg-elevated rounded-2xl border border-dashed border-theme">
                                <Building2 className="w-10 h-10 text-tertiary mx-auto mb-3" />
                                <p className="text-secondary text-sm">No funding organizations yet.</p>
                                <button onClick={() => navigate('/funding/ventures/create')} className="text-primary font-medium mt-2 hover:underline text-sm">
                                    Create your first funding organization
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myVentures.map(venture => (
                                    <div
                                        key={venture.id}
                                        onClick={() => navigate(`/funding/ventures/${venture.id}`)}
                                        className="bg-elevated p-6 rounded-xl border border-theme hover:shadow-md transition-shadow cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-primary-600" />
                                            </div>
                                            {venture.is_verified && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-lg text-primary">{venture.name}</h3>
                                        <p className="text-sm text-secondary mt-1 line-clamp-2">{venture.investment_focus || venture.description}</p>
                                        <div className="mt-4 pt-3 border-t border-theme flex justify-between text-sm">
                                            <span className="text-secondary">{venture.received_requests_count || 0} requests</span>
                                            <span className="text-primary-600 font-medium">KES {venture.available_fund?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* All Ventures (Public Listing) */}
            {otherVentures.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-primary mb-4">All Funding Organizations</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {otherVentures.map(venture => (
                            <div
                                key={venture.id}
                                onClick={() => navigate(`/funding/ventures/${venture.id}`)}
                                className="bg-elevated p-5 rounded-xl border border-theme hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-primary">{venture.name}</h3>
                                        <p className="text-xs text-secondary">{venture.organisation_name || 'Independent'}</p>
                                    </div>
                                    {venture.is_verified && <Shield className="w-5 h-5 text-green-500" />}
                                </div>
                                <p className="text-sm text-secondary line-clamp-2 mb-3">{venture.investment_focus || venture.description}</p>
                                <div className="flex justify-between items-center text-xs text-secondary border-t border-theme pt-3">
                                    <span>Fund: KES {Number(venture.available_fund || 0).toLocaleString()}</span>
                                    <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                                        View <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundingHub;
