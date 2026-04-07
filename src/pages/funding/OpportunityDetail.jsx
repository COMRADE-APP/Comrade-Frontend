import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PieChart, TrendingUp, Landmark, Building2,
    Shield, Briefcase, Globe, Target, AlertCircle
} from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';
import InvestModal from '../../components/funding/InvestModal';

const CATEGORY_CONFIG = {
    mmf: { label: 'Money Market Fund', icon: PieChart, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-100', text: 'text-blue-600' },
    stock: { label: 'Stocks & Equities', icon: TrendingUp, color: 'from-green-500 to-emerald-600', bg: 'bg-green-100', text: 'text-green-600' },
    bond_domestic: { label: 'Domestic Bond', icon: Landmark, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-100', text: 'text-amber-600' },
    bond_foreign: { label: 'Foreign Bond', icon: Globe, color: 'from-primary-500 to-primary-700', bg: 'bg-primary-100', text: 'text-primary-600' },
    agency: { label: 'Investment Agency', icon: Building2, color: 'from-slate-600 to-gray-700', bg: 'bg-slate-100', text: 'text-slate-600' },
    default: { label: 'Investment Opportunity', icon: Briefcase, color: 'from-primary to-primary-600', bg: 'bg-primary/10', text: 'text-primary' },
};

const OpportunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // InvestModal state
    const [showInvestModal, setShowInvestModal] = useState(false);

    useEffect(() => {
        loadOpportunity();
    }, [id]);

    const loadOpportunity = async () => {
        setLoading(true);
        try {
            const data = await fundingService.getOpportunityDetail(id);
            setOpportunity(data);
        } catch (err) {
            console.error('Error loading opportunity:', err);
            setError('Opportunity not found or you do not have permission to view it.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !opportunity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-primary mb-2">Not Found</h2>
                <p className="text-secondary mb-6">{error || 'The requested opportunity could not be found.'}</p>
                <Button variant="primary" onClick={() => navigate('/funding')}>
                    Back to Funding Hub
                </Button>
            </div>
        );
    }

    const config = CATEGORY_CONFIG[opportunity.type] || CATEGORY_CONFIG.default;
    const Icon = config.icon;

    // We manually adapt the `opportunity` so the InvestModal can process it correctly
    // Since InvestModal expects item.name, item.businessId, etc.
    const adaptedForInvest = {
        ...opportunity,
        id: opportunity.id,
        name: opportunity.title,
        businessId: null, // Since it's not a Business
        desc: opportunity.description,
        goal: opportunity.min_investment, // For lack of a better target
        raised: 0,
        provider: opportunity.provider,
        category: config.label
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Navigation & Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-primary">Opportunity Details</h1>
            </div>

            {/* Hero Cover */}
            <div className={`w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-br ${config.color} text-white p-8 relative`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                        <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">
                                {config.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase backdrop-blur-md ${
                                opportunity.risk_level === 'low' ? 'bg-green-500/30 text-green-50' :
                                opportunity.risk_level === 'medium' ? 'bg-yellow-500/30 text-yellow-50' :
                                'bg-red-500/30 text-red-50'
                            }`}>
                                {opportunity.risk_level} Risk
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">{opportunity.title}</h2>
                        <p className="text-white/80 text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5" /> Provided by {opportunity.provider}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Details */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-theme">
                        <CardBody className="p-6 md:p-8">
                            <h3 className="font-bold text-xl text-primary mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-600" /> About this Opportunity
                            </h3>
                            <div className="prose dark:prose-invert max-w-none text-secondary whitespace-pre-line leading-relaxed">
                                {opportunity.description || 'No description provided.'}
                            </div>
                            
                            {opportunity.link && (
                                <div className="mt-8 pt-6 border-t border-theme">
                                    <h4 className="font-semibold text-primary mb-2">External Reference</h4>
                                    <a 
                                        href={opportunity.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 underline flex items-center gap-1"
                                    >
                                        Visit Platform <Globe className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-theme sticky top-24">
                        <CardBody className="p-6">
                            <div className="space-y-6">
                                <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                    <p className="text-secondary text-sm mb-1">Expected Return</p>
                                    <p className="text-2xl font-bold text-green-600">{opportunity.expected_return}</p>
                                </div>

                                <div>
                                    <p className="text-secondary text-sm mb-1">Minimum Investment</p>
                                    <p className="text-xl font-bold text-primary">
                                        KES {parseFloat(opportunity.min_investment || 0).toLocaleString()}
                                    </p>
                                </div>

                                <Button 
                                    variant="primary" 
                                    className="w-full py-3 text-lg"
                                    onClick={() => setShowInvestModal(true)}
                                >
                                    Invest Now
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Invest Modal Instance */}
            {showInvestModal && (
                <InvestModal
                    isOpen={showInvestModal}
                    onClose={() => setShowInvestModal(false)}
                    opportunity={adaptedForInvest}
                    onSuccess={() => {
                        // After success, they can view their investment in the payments hub
                        navigate('/payments?tab=investments');
                    }}
                />
            )}
        </div>
    );
};

export default OpportunityDetail;
