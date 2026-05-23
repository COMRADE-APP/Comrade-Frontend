import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Building2, DollarSign, Users, TrendingUp, FileText, Plus,
    ArrowUpRight, Calendar, Clock, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const STATUS_CONFIG = {
    draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
    approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
    funded: { color: 'bg-blue-100 text-blue-700', label: 'Funded' },
};

const MyBusinesses = () => {
    const [tab, setTab] = useState('businesses');
    const [businesses, setBusinesses] = useState([]);
    const [fundingRequests, setFundingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bizData, fundingData] = await Promise.all([
                fundingService.getMyBusinesses().catch(() => ({ results: [] })),
                fundingService.getMyFundingRequests().catch(() => ({ results: [] })),
            ]);
            setBusinesses(bizData.results || []);
            setFundingRequests(fundingData.results || []);
        } catch (e) {
            console.error('Failed to load businesses:', e);
        } finally {
            setLoading(false);
        }
    };

    const totalFunding = fundingRequests
        .filter(r => r.status === 'approved' || r.status === 'funded')
        .reduce((sum, r) => sum + parseFloat(r.requested_amount || 0), 0);

    const pendingFunding = fundingRequests
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + parseFloat(r.requested_amount || 0), 0);

    const tabs = [
        { id: 'businesses', label: 'My Businesses', icon: Building2 },
        { id: 'funding', label: 'Funding Requests', icon: DollarSign },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <Building2 className="w-8 h-8" />
                        My Businesses
                    </h1>
                    <p className="text-secondary text-sm mt-1">
                        Manage your registered businesses and funding requests
                    </p>
                </div>
                <Link to="/business/register">
                    <Button variant="primary" className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Register Business
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm text-secondary">Total Businesses</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{businesses.length}</p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-secondary">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                        {businesses.filter(b => b.verification_status === 'approved').length}
                    </p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-secondary">Total Funded</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatMoneySimple(totalFunding)}</p>
                </div>
                <div className="bg-elevated border border-theme rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-secondary">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatMoneySimple(pendingFunding)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                            tab === t.id 
                                ? 'bg-primary-600 text-white shadow-md' 
                                : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        <t.icon className="w-5 h-5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'businesses' && (
                businesses.length === 0 ? (
                    <div className="text-center py-16 bg-elevated rounded-2xl border border-theme">
                        <Building2 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">No Businesses Registered</h3>
                        <p className="text-secondary mb-6">Register your first business to start seeking funding</p>
                        <Link to="/business/register">
                            <Button variant="primary">Register Business</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {businesses.map((biz, idx) => (
                            <motion.div
                                key={biz.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-elevated border border-theme rounded-2xl p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                biz.verification_status === 'approved' 
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : biz.verification_status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {biz.verification_status || 'Pending'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-primary mb-1">{biz.name}</h3>
                                        <p className="text-sm text-secondary line-clamp-2">{biz.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-tertiary mt-2">
                                            <span>{biz.sector}</span>
                                            <span>•</span>
                                            <span>Founded: {biz.year_established}</span>
                                            {biz.registration_number && (
                                                <>
                                                    <span>•</span>
                                                    <span>Reg: {biz.registration_number}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/business/${biz.id}`}>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}

            {tab === 'funding' && (
                fundingRequests.length === 0 ? (
                    <div className="text-center py-16 bg-elevated rounded-2xl border border-theme">
                        <DollarSign className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">No Funding Requests</h3>
                        <p className="text-secondary mb-6">Apply for funding through your registered businesses</p>
                        <Link to="/funding/request">
                            <Button variant="primary">Request Funding</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fundingRequests.map((req, idx) => {
                            const StatusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                            return (
                                <motion.div
                                    key={req.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-elevated border border-theme rounded-2xl p-6"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${StatusCfg.color}`}>
                                                    {StatusCfg.label}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-primary mb-1">
                                                {req.business_name || req.purpose}
                                            </h3>
                                            <p className="text-sm text-secondary line-clamp-2">{req.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-tertiary mt-2">
                                                <span>Requested: {formatMoneySimple(req.requested_amount)}</span>
                                                <span>•</span>
                                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-primary">{formatMoneySimple(req.requested_amount)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

export default MyBusinesses;