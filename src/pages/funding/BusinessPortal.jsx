import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Plus, ArrowRight, BarChart3, TrendingUp, CheckCircle, Shield, Store, LayoutTemplate, Activity, Wallet, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

const BusinessPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [businesses, setBusinesses] = useState([]);
    const [ventures, setVentures] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            setLoading(true);
            try {
                // Fetch both user-created businesses and enterprises/ventures
                const [bData, vData] = await Promise.all([
                    fundingService.getMyBusinesses(),
                    fundingService.getMyVentures()
                ]);
                setBusinesses(Array.isArray(bData) ? bData : []);
                setVentures(Array.isArray(vData) ? vData : []);
            } catch (error) {
                console.error("Failed to fetch business portfolio", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    const totalPortfolioCount = businesses.length + ventures.length;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-primary flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-primary-600" /> My Businesses
                    </h1>
                    <p className="text-secondary mt-2">
                        Manage your registered businesses, enterprises, kitties, and operations history.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate(ROUTES.KITTIES)} className="flex items-center gap-2 border-theme hover:border-primary-600/30">
                        <Wallet size={16} className="text-primary-600" /> Manage Kitties
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/shop/register-establishment')} className="flex items-center gap-2 font-bold shadow-lg shadow-primary-600/20">
                        <Plus size={16} /> Register New
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
                </div>
            ) : totalPortfolioCount === 0 ? (
                // Empty State
                <div className="bg-elevated border border-theme rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xl">
                    <div className="w-20 h-20 bg-primary-600/10 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Building2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-3">No Registered Businesses</h2>
                    <p className="text-secondary mb-8 leading-relaxed">
                        Start your entrepreneurial journey by registering your first business or enterprise. 
                        Get access to dedicated kitties, operation analytics, and funding opportunities.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="primary" onClick={() => navigate('/shop/register-establishment')} className="font-bold px-8 py-3">
                            Register a Business
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/funding/enterprise/create')} className="px-8 py-3 font-semibold">
                            Create Enterprise
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Businesses Section */}
                    {businesses.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Store className="w-5 h-5 text-blue-500" /> Local Businesses & Startups
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {businesses.map((biz) => (
                                    <motion.div 
                                        key={biz.id} 
                                        whileHover={{ y: -4 }}
                                        className="bg-elevated border border-theme rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Store size={24} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-primary text-lg truncate" title={biz.name}>{biz.name}</h3>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-secondary/10 rounded-full text-secondary capitalize inline-block mt-0.5 max-w-full truncate">
                                                        {biz.industry}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-600 rounded-lg uppercase tracking-widest text-center whitespace-nowrap">
                                                {biz.stage.replace('_', ' ')}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm text-tertiary line-clamp-2 mb-6 h-10">
                                            {biz.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-secondary/5 rounded-xl p-3 border border-theme/50">
                                                <div className="flex items-center gap-1.5 text-xs text-secondary mb-1">
                                                    <BarChart3 size={12} /> Valuation
                                                </div>
                                                <p className="font-bold text-primary text-sm">
                                                    {biz.valuation ? `KES ${parseFloat(biz.valuation).toLocaleString()}` : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-secondary/5 rounded-xl p-3 border border-theme/50">
                                                <div className="flex items-center gap-1.5 text-xs text-secondary mb-1">
                                                    <CheckCircle size={12} className={biz.is_verified ? "text-emerald-500" : "text-gray-400"} /> Verification
                                                </div>
                                                {biz.is_verified ? (
                                                    <p className="font-bold text-emerald-600 text-sm">Verified ✓</p>
                                                ) : (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await fundingService.requestBusinessVerification(biz.id);
                                                                alert('Verification request submitted successfully!');
                                                            } catch (err) {
                                                                alert('Failed to submit verification request.');
                                                            }
                                                        }}
                                                        className="font-bold text-amber-600 text-xs hover:underline"
                                                    >
                                                        Request Verification →
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => navigate(`/funding/business/${biz.id}`)} 
                                                className="flex-1 border-theme hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors text-xs py-1.5 px-2 flex items-center justify-center min-w-[30%]"
                                            >
                                                Dashboard <Activity size={12} className="ml-1 shrink-0" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => navigate(`/funding/businesses/${biz.id}/analytics`)} 
                                                className="flex-1 border-theme hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors text-xs py-1.5 px-2 flex items-center justify-center min-w-[30%]"
                                                title="View Analytics"
                                            >
                                                Analytics <PieChart size={12} className="ml-1 shrink-0" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => navigate(ROUTES.KITTIES)} 
                                                className="px-2.5 py-1.5 border-theme hover:bg-secondary/10 text-secondary flex items-center justify-center"
                                                title="View Kitties"
                                            >
                                                <Wallet size={14} />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enterprises / Ventures Section */}
                    {ventures.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2 pt-6 border-t border-theme">
                                <Building2 className="w-5 h-5 text-primary-500" /> Investment Enterprises
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ventures.map((ven) => (
                                    <motion.div 
                                        key={ven.id} 
                                        whileHover={{ y: -4 }}
                                        className="bg-elevated border border-theme rounded-2xl p-6 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-primary text-lg truncate w-32 md:w-36">{ven.name}</h3>
                                                    <div className="flex items-center gap-1 text-xs text-secondary mt-0.5">
                                                        <Shield size={12} className={ven.is_verified ? "text-green-500" : ""} />
                                                        {ven.is_verified ? 'Verified' : 'Pending'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-4 text-white mb-6">
                                            <p className="text-white/70 text-xs mb-1">Available Fund Pool (Kitty)</p>
                                            <p className="font-bold text-2xl">KES {parseFloat(ven.available_fund).toLocaleString()}</p>
                                            <div className="mt-3 flex items-center justify-between text-xs text-white/80 border-t border-white/20 pt-2">
                                                <span>Total: KES {parseFloat(ven.total_fund).toLocaleString()}</span>
                                                <span className="flex items-center gap-1"><TrendingUp size={12}/> Active</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => navigate(`/funding/ventures/${ven.id}`)} 
                                                className="flex-1 border-theme hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-colors text-sm py-2"
                                            >
                                                Analytics & History <PieChart size={14} className="ml-1 inline" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BusinessPortal;
