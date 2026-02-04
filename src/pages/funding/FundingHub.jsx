import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Briefcase, Plus, Search, Filter,
    FileText, DollarSign, Building, PieChart, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const FundingHub = () => {
    const [activeTab, setActiveTab] = useState('market'); // market, raise, invest
    const [businesses, setBusinesses] = useState([]);
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
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
            } else if (activeTab === 'invest') {
                const data = await fundingService.getOpportunities();
                setOpportunities(data);
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
            <div className="flex gap-4 mb-8 border-b border-theme">
                {['market', 'raise', 'invest'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-secondary hover:text-primary'
                            }`}
                    >
                        {tab === 'market' && 'Startup Market'}
                        {tab === 'raise' && 'Raise Capital'}
                        {tab === 'invest' && 'Opportunities'}
                        {activeTab === tab && (
                            <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    {activeTab === 'market' && <StartupMarket businesses={businesses} loading={loading} />}
                    {activeTab === 'raise' && <FoundersHub myBusinesses={myBusinesses} loading={loading} navigate={navigate} />}
                    {activeTab === 'invest' && <InvestmentOpportunities opportunities={opportunities} loading={loading} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const StartupMarket = ({ businesses, loading }) => (
    <div>
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-tertiary w-5 h-5" />
                <input
                    type="text"
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
                {businesses.map(biz => (
                    <div key={biz.id} className="bg-elevated p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                {biz.logo ? <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover rounded-lg" /> : <Building className="text-secondary" />}
                            </div>
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full uppercase font-bold">{biz.stage}</span>
                        </div>
                        <h3 className="font-bold text-primary mb-1">{biz.name}</h3>
                        <p className="text-sm text-secondary mb-4 line-clamp-2">{biz.description}</p>
                        <div className="mt-auto border-t border-theme pt-4 flex justify-between items-center text-sm text-secondary">
                            <span>{biz.industry}</span>
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                <TrendingUp className="w-4 h-4" /> Invest
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

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
                                    <p className="text-sm text-secondary">{biz.industry} • {biz.stage}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 text-sm border border-theme rounded-lg hover:bg-secondary/5 text-primary">Manage Docs</button>
                                    <button className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20">Request Funding</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
);

const InvestmentOpportunities = ({ opportunities, loading }) => (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold text-lg mb-2">Money Market Fund</h3>
                <p className="text-blue-100 text-sm mb-4">Low risk, high liquidity savings.</p>
                <div className="text-3xl font-bold mb-1">14-16%</div>
                <div className="text-xs opacity-70 mb-4">Annual Interest Rate</div>
                <button className="w-full py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">Explore MMFs</button>
            </div>

            {opportunities.map(opp => (
                <div key={opp.id} className="bg-elevated p-6 rounded-2xl border border-theme shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <PieChart className="w-8 h-8 text-green-500" />
                        <span className={`px-2 py-1 text-xs rounded-full ${opp.risk_level === 'low' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {opp.risk_level.toUpperCase()} RISK
                        </span>
                    </div>
                    <h3 className="font-bold mb-1 text-primary">{opp.title}</h3>
                    <p className="text-xs text-secondary mb-3">{opp.provider}</p>
                    <div className="flex justify-between items-end border-t border-theme pt-3">
                        <div>
                            <div className="text-lg font-bold text-green-600">{opp.expected_return}</div>
                            <div className="text-xs text-tertiary">Return</div>
                        </div>
                        <button className="text-sm font-medium text-primary hover:underline">View Details</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default FundingHub;
