import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Heart, TrendingUp, Building2, Globe, Shield,
    PieChart, BarChart3, Landmark, Banknote, Search, Filter,
    ExternalLink, Star, ChevronRight, Users, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';
import InvestModal from '../../components/funding/InvestModal';

// ==================== CONFIGURATION ====================

const CATEGORY_CONFIG = {
    charity: { label: 'Charity & Giving', icon: Heart, color: 'from-pink-500 to-rose-600' },
    mmf: { label: 'Money Market Funds', icon: PieChart, color: 'from-blue-500 to-cyan-600' },
    stocks: { label: 'Stocks & Equities', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    bonds_domestic: { label: 'Domestic Bonds', icon: Landmark, color: 'from-amber-500 to-orange-600' },
    bonds_foreign: { label: 'Foreign Bonds', icon: Globe, color: 'from-violet-500 to-purple-600' },
    agency: { label: 'Investment Agencies', icon: Building2, color: 'from-slate-600 to-gray-700' },
};

// ==================== HELPER FUNCTIONS FOR MOCKING MISSING DATA ====================
// These adapt the generic backend model to the specific UI requirements

const adaptCharity = (biz) => ({
    id: biz.id,
    businessId: biz.id,
    name: biz.name,
    provider: biz.founder_details?.name || 'Qomrade Foundation',
    goal: parseFloat(biz.charity_goal || 0),
    raised: parseFloat(biz.charity_raised || 0),
    category: biz.industry || 'General',
    image: '❤️', // Default emoji
    desc: biz.description
});

const adaptMMF = (item) => ({
    id: item.id,
    businessId: item.organisation,
    name: item.title,
    provider: item.provider,
    return_rate: item.expected_return,
    min_investment: parseFloat(item.min_investment || 0),
    risk: item.risk_level,
    aum: '10.5B', // Mock
    rating: 4.5
});

const adaptStock = (item) => {
    // Extract ticker from description if present format "Name (TICKER) - Sector"
    const tickerMatch = item.description.match(/\((.*?)\)/);
    const sectorMatch = item.description.match(/-\s*(.*)/);

    return {
        id: item.id,
        businessId: item.organisation,
        name: item.title,
        ticker: tickerMatch ? tickerMatch[1] : 'NSE',
        price: parseFloat(item.min_investment || 0), // Using min_investment as current price
        change: Math.random() > 0.5 ? 1.2 : -0.5, // Mock daily change
        sector: sectorMatch ? sectorMatch[1] : 'General',
        market: 'NSE',
        pe_ratio: (Math.random() * 15 + 5).toFixed(1)
    };
};

const adaptBond = (item) => ({
    id: item.id,
    businessId: item.organisation,
    name: item.title,
    issuer: item.provider,
    coupon: item.expected_return,
    maturity: '2028', // Mock
    min_investment: parseFloat(item.min_investment || 0),
    type: item.type === 'bond_foreign' ? 'Sovereign' : 'Government',
    rating: 'A',
    currency: item.type === 'bond_foreign' ? 'USD' : 'KES'
});

const adaptAgency = (item) => ({
    id: item.id,
    businessId: item.organisation,
    name: item.title,
    type: item.provider,
    services: ['Stocks', 'Bonds', 'Advisory'],
    min_account: parseFloat(item.min_investment || 0),
    license: 'CMA Licensed',
    rating: 4.4,
    desc: item.description
});


// ==================== CARD RENDERERS ====================

const CharityCard = ({ item, onClick, onViewDetails }) => {
    const progress = Math.min((item.raised / item.goal) * 100, 100);
    return (
        <div onClick={onClick} className="bg-elevated rounded-2xl border border-theme p-5 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{item.image}</span>
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">{item.category}</span>
                </div>
                <h3 className="font-bold text-primary mb-1">{item.name}</h3>
                <p className="text-xs text-secondary mb-3 line-clamp-2">{item.desc}</p>
                <p className="text-xs text-tertiary mb-2">{item.provider}</p>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-green-600 font-bold">KES {(item.raised / 1000000).toFixed(1)}M raised</span>
                        <span className="text-secondary">of KES {(item.goal / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-theme">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                    className="flex-1 py-2 text-sm font-medium text-primary border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
                >
                    View Details
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="flex-1 py-2 text-sm font-medium text-pink-600 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors"
                >
                    Donate
                </button>
            </div>
        </div>
    );
};

const MMFCard = ({ item, onClick, onViewDetails }) => (
    <div onClick={onClick} className="bg-elevated rounded-2xl border border-theme p-5 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}
                </div>
            </div>
            <h3 className="font-bold text-primary mb-1">{item.name}</h3>
            <p className="text-xs text-secondary mb-3">{item.provider}</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{item.return_rate}</p>
                    <p className="text-[10px] text-green-500">Annual Return</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-blue-600">KES {item.min_investment.toLocaleString()}</p>
                    <p className="text-[10px] text-blue-500">Min Investment</p>
                </div>
            </div>
            <div className="flex justify-between text-xs text-secondary">
                <span>AUM: KES {item.aum}</span>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Low Risk</span>
            </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-theme">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                className="flex-1 py-2 text-sm font-medium text-primary border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
            >
                View Details
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
                Invest
            </button>
        </div>
    </div>
);

const StockCard = ({ item, onClick, onViewDetails }) => (
    <div onClick={onClick} className="bg-elevated rounded-2xl border border-theme p-5 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-mono bg-secondary/10 px-2 py-0.5 rounded text-primary">{item.ticker}</span>
                    <span className="text-xs text-secondary ml-2">{item.market}</span>
                </div>
                <span className={`text-sm font-bold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
            </div>
            <h3 className="font-bold text-primary mb-1">{item.name}</h3>
            <p className="text-xs text-secondary mb-3">{item.sector}</p>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-2xl font-bold text-primary">KES {item.price.toFixed(2)}</p>
                    <p className="text-[10px] text-tertiary">P/E: {item.pe_ratio}</p>
                </div>
                <div className={`w-16 h-8 flex items-end gap-px ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {[3, 5, 2, 7, 4, 6, item.change >= 0 ? 8 : 1].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-t ${item.change >= 0 ? 'bg-green-400' : 'bg-red-400'}`} style={{ height: `${h * 12.5}%` }} />
                    ))}
                </div>
            </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-theme">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                className="flex-1 py-2 text-sm font-medium text-primary border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
            >
                View Details
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="flex-1 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
                Invest
            </button>
        </div>
    </div>
);

const BondCard = ({ item, onClick, onViewDetails }) => (
    <div onClick={onClick} className="bg-elevated rounded-2xl border border-theme p-5 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{item.type}</span>
                <span className="text-xs font-bold text-primary">{item.rating}</span>
            </div>
            <h3 className="font-bold text-primary text-sm mb-1">{item.name}</h3>
            <p className="text-xs text-secondary mb-3">{item.issuer}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-lg font-bold text-green-600">{item.coupon}</p>
                    <p className="text-[10px] text-tertiary">Coupon</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-primary">{item.maturity}</p>
                    <p className="text-[10px] text-tertiary">Maturity</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-primary">KES {(item.min_investment / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-tertiary">Min</p>
                </div>
            </div>
            {item.currency && <p className="text-xs text-center text-secondary mt-2">Currency: {item.currency}</p>}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-theme">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                className="flex-1 py-2 text-sm font-medium text-primary border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
            >
                View Details
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="flex-1 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
            >
                Invest
            </button>
        </div>
    </div>
);

const AgencyCard = ({ item, onClick, onViewDetails }) => (
    <div onClick={onClick} className="bg-elevated rounded-2xl border border-theme p-5 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">{item.license}</span>
                </div>
            </div>
            <h3 className="font-bold text-primary mb-0.5">{item.name}</h3>
            <p className="text-xs text-secondary mb-3">{item.type}</p>
            <p className="text-xs text-tertiary mb-3 line-clamp-2">{item.desc}</p>
            <div className="flex flex-wrap gap-1 mb-3">
                {item.services.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full">{s}</span>
                ))}
            </div>
            <div className="flex justify-between items-center text-xs border-t border-theme pt-2">
                <span className="text-secondary">Min: KES {item.min_account.toLocaleString()}</span>
                <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-primary font-bold">{item.rating}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-theme">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                className="flex-1 py-2 text-sm font-medium text-primary border border-theme rounded-xl hover:bg-secondary/5 transition-colors"
            >
                View Details
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
                Invest
            </button>
        </div>
    </div>
);

const CARD_RENDERERS = {
    charity: CharityCard,
    mmf: MMFCard,
    stocks: StockCard,
    bonds_domestic: BondCard,
    bonds_foreign: BondCard,
    agency: AgencyCard,
};

const OpportunitiesExplorer = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Data state
    const [data, setData] = useState({
        charity: [],
        mmf: [],
        stocks: [],
        bonds_domestic: [],
        bonds_foreign: [],
        agency: []
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all data in parallel
                const [
                    charityRes,
                    mmfRes,
                    stockRes,
                    bondDomesticRes,
                    bondForeignRes,
                    agencyRes
                ] = await Promise.all([
                    fundingService.getCharities(),
                    fundingService.getMMFs(),
                    fundingService.getStocks(),
                    fundingService.getBondsDomestic(),
                    fundingService.getBondsForeign(),
                    fundingService.getAgencies()
                ]);

                // Map data using adapters
                setData({
                    charity: (Array.isArray(charityRes) ? charityRes : []).map(adaptCharity),
                    mmf: (Array.isArray(mmfRes) ? mmfRes : []).map(adaptMMF),
                    stocks: (Array.isArray(stockRes) ? stockRes : []).map(adaptStock),
                    bonds_domestic: (Array.isArray(bondDomesticRes) ? bondDomesticRes : []).map(adaptBond),
                    bonds_foreign: (Array.isArray(bondForeignRes) ? bondForeignRes : []).map(adaptBond),
                    agency: (Array.isArray(agencyRes) ? agencyRes : []).map(adaptAgency)
                });
            } catch (error) {
                console.error("Failed to fetch funding data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const config = CATEGORY_CONFIG[category];

    if (!config) {
        // Show all categories overview
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <button onClick={() => navigate('/opportunities')} className="flex items-center text-secondary hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Opportunities
                </button>
                <h1 className="text-3xl font-bold text-primary mb-2">Investment Opportunities</h1>
                <p className="text-secondary mb-8">Explore diverse investment avenues across multiple asset classes.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(CATEGORY_CONFIG).map(([key, c]) => {
                        const Icon = c.icon;
                        const count = data[key]?.length || 0;
                        return (
                            <motion.div
                                key={key}
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(`/opportunities/${key}`)}
                                className={`bg-gradient-to-br ${c.color} text-white p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-shadow`}
                            >
                                <Icon className="w-8 h-8 mb-3 opacity-80" />
                                <h3 className="text-xl font-bold mb-1">{c.label}</h3>
                                <p className="text-sm opacity-80">
                                    {loading ? '...' : `${count} opportunities available`}
                                </p>
                                <div className="flex items-center gap-1 mt-4 text-sm opacity-70">
                                    View All <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const Icon = config.icon;
    const CardRenderer = CARD_RENDERERS[category];
    const categoryData = data[category] || [];

    // Filter data
    const filteredData = categoryData.filter(item =>
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.provider || item.issuer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ticker || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <button onClick={() => navigate('/opportunities')} className="flex items-center text-secondary hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Opportunities
            </button>

            {/* Header */}
            <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-8 text-white mb-8`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{config.label}</h1>
                        <p className="text-sm opacity-80">
                            {loading ? 'Loading...' : `${filteredData.length} opportunities available`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-tertiary w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={`Search ${config.label.toLowerCase()}...`}
                        className="w-full pl-10 pr-4 py-2.5 border border-theme rounded-xl focus:ring-2 focus:ring-primary outline-none bg-elevated text-primary"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-secondary">
                        Loading opportunities...
                    </div>
                ) : filteredData.length > 0 ? (
                    filteredData.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <CardRenderer 
                                item={item} 
                                onClick={() => setSelectedItem(item)} 
                                onViewDetails={() => navigate(
                                    category === 'charity' || item.businessId
                                        ? `/funding/business/${item.businessId || item.id}`
                                        : `/funding/opportunity/${item.id}`
                                )} 
                            />
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <Search className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No results found for "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {/* Universal InvestModal */}
            <InvestModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem ? {
                    id: selectedItem.id,
                    name: selectedItem.name,
                    category: category,
                    min_investment: selectedItem.min_investment || selectedItem.min_account || 0,
                    investment_type: category === 'stocks' ? 'stock' : category === 'mmf' ? 'mmf' : category?.startsWith('bonds') ? 'bond' : 'equity',
                } : null}
                isDonation={category === 'charity'}
                categoryColor={config?.color || CATEGORY_CONFIG[category]?.color || 'from-purple-500 to-indigo-600'}
            />
        </div>
    );
};

export default OpportunitiesExplorer;
