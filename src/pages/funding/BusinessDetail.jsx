import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building, TrendingUp, Globe, DollarSign, Users,
    FileText, ExternalLink, Shield, CheckCircle, AlertTriangle,
    Calendar, Briefcase, PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import InvestModal from '../../components/funding/InvestModal';

const STAGE_LABELS = {
    idea: 'Idea Phase', mvp: 'MVP', pre_seed: 'Pre-Seed',
    seed: 'Seed', series_a: 'Series A', growth: 'Growth'
};
const INDUSTRY_LABELS = {
    tech: 'Technology', agri: 'Agriculture', fin: 'Finance',
    retail: 'Retail', health: 'Healthcare', educ: 'Education', energy: 'Energy', other: 'Other'
};



const BusinessDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInvestModal, setShowInvestModal] = useState(false);

    useEffect(() => {
        loadBusiness();
    }, [id]);

    const loadBusiness = async () => {
        setLoading(true);
        try {
            const data = await fundingService.getBusinessDetail(id);
            setBusiness(data);
        } catch (err) {
            console.error('Failed to load business:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-primary">Business not found</h2>
                <Button onClick={() => navigate('/funding')} className="mt-4">Back to Hub</Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            {/* Hero */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,...')]"></div>
                <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            {business.logo ? (
                                <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <Building className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{business.name}</h1>
                            <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
                                <span className="px-2 py-0.5 bg-white/20 rounded-full">{INDUSTRY_LABELS[business.industry] || business.industry}</span>
                                <span className="px-2 py-0.5 bg-white/20 rounded-full">{STAGE_LABELS[business.stage] || business.stage}</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setShowInvestModal(true)} className="bg-white text-primary-700 hover:bg-white/90 font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Invest Now
                    </Button>
                </div>
                <div className="relative grid grid-cols-3 gap-6 mt-8">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Valuation</p>
                        <p className="text-2xl font-bold">{business.valuation ? `KES ${Number(business.valuation).toLocaleString()}` : 'Pre-Valuation'}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Investors</p>
                        <p className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5" /> {business.investors_count || 0}
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Active Requests</p>
                        <p className="text-2xl font-bold">{business.funding_requests?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-elevated rounded-2xl border border-theme p-6">
                        <h2 className="font-bold text-lg text-primary mb-3">About</h2>
                        <p className="text-secondary leading-relaxed">{business.description}</p>
                    </div>

                    {/* Funding Requests */}
                    {business.funding_requests?.length > 0 && (
                        <div className="bg-elevated rounded-2xl border border-theme p-6">
                            <h2 className="font-bold text-lg text-primary mb-4">Active Funding Requests</h2>
                            <div className="space-y-3">
                                {business.funding_requests.map(req => (
                                    <div key={req.id} className="p-4 bg-secondary/5 rounded-xl border border-theme flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary">KES {Number(req.amount_needed).toLocaleString()}</p>
                                            <p className="text-sm text-secondary">{req.equity_offered}% equity • {req.status}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${req.status === 'funded' ? 'bg-green-100 text-green-700' :
                                            req.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {business.documents?.length > 0 && (
                        <div className="bg-elevated rounded-2xl border border-theme p-6">
                            <h2 className="font-bold text-lg text-primary mb-4">Available Documents</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {business.documents.filter(d => d.is_viewable).map(doc => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-secondary/5 rounded-xl border border-theme">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">{doc.title}</p>
                                            <p className="text-xs text-tertiary capitalize">{doc.doc_type.replace('_', ' ')}</p>
                                        </div>
                                        {doc.file && (
                                            <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-elevated rounded-2xl border border-theme p-5 space-y-4">
                        <h3 className="font-bold text-primary">Quick Info</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-secondary">Founded</span>
                                <span className="text-primary">{new Date(business.created_at).toLocaleDateString()}</span>
                            </div>
                            {business.website && (
                                <div className="flex justify-between">
                                    <span className="text-secondary">Website</span>
                                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        Visit <Globe className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-secondary">Founder</span>
                                <span className="text-primary">{business.founder_details?.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Verification Badge */}
                    <div className={`rounded-2xl border p-5 ${business.is_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {business.is_verified ? (
                                <>
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-emerald-700">Verified Business</h3>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-bold text-amber-700">Not Yet Verified</h3>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-secondary mb-3">
                            {business.is_verified
                                ? 'This business has been verified with supporting documentation.'
                                : 'Submit business documents and licenses to earn the verification badge.'}
                        </p>
                        {!business.is_verified && (
                            <button
                                onClick={async () => {
                                    try {
                                        await fundingService.requestBusinessVerification(business.id);
                                        alert('Verification request submitted!');
                                        loadBusiness();
                                    } catch { alert('Failed to submit request.'); }
                                }}
                                className="w-full text-center text-sm font-bold bg-amber-500 text-white rounded-xl py-2 hover:bg-amber-600 transition-colors"
                            >
                                Request Verification
                            </button>
                        )}
                    </div>

                    {/* Analytics Button */}
                    <Button
                        onClick={() => navigate(`/funding/businesses/${business.id}/analytics`)}
                        className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-3 flex items-center justify-center gap-2"
                    >
                        <PieChart className="w-5 h-5" /> View Analytics
                    </Button>
                    
                    <Button
                        onClick={() => navigate(`/funding/opportunity/create/${business.id}`)}
                        variant="outline"
                        className="w-full border-indigo-200 text-indigo-700 font-bold py-3 flex items-center justify-center gap-2 hover:bg-indigo-50"
                    >
                        Offer Investment Opportunity
                    </Button>

                    <Button onClick={() => setShowInvestModal(true)} className="w-full bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white font-bold py-3 flex items-center justify-center gap-2">
                        <DollarSign className="w-5 h-5" /> Invest in {business.name}
                    </Button>

                    {business.is_charity && (
                        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5">
                            <h3 className="font-bold text-pink-700 mb-2">🎀 Charity Campaign</h3>
                            <div className="mb-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-pink-600">KES {Number(business.charity_raised || 0).toLocaleString()}</span>
                                    <span className="text-pink-400">of KES {Number(business.charity_goal || 0).toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-pink-100 rounded-full h-2">
                                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${business.charity_progress || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showInvestModal && (
                <InvestModal
                    isOpen={showInvestModal}
                    onClose={() => setShowInvestModal(false)}
                    item={business ? {
                        id: business.id,
                        name: business.name,
                        category: 'business',
                        investment_type: business.is_charity ? 'donation' : 'equity',
                    } : null}
                    isDonation={!!business?.is_charity}
                    categoryColor="from-primary-600 to-primary-800"
                />
            )}
        </div>
    );
};

export default BusinessDetail;
