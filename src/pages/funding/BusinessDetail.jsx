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

const STAGE_LABELS = {
    idea: 'Idea Phase', mvp: 'MVP', pre_seed: 'Pre-Seed',
    seed: 'Seed', series_a: 'Series A', growth: 'Growth'
};
const INDUSTRY_LABELS = {
    tech: 'Technology', agri: 'Agriculture', fin: 'Finance',
    retail: 'Retail', health: 'Healthcare', educ: 'Education', energy: 'Energy', other: 'Other'
};

const InvestModal = ({ business, onClose }) => {
    const [investType, setInvestType] = useState('individual');
    const [amount, setAmount] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [step, setStep] = useState(1); // 1: amount, 2: legal, 3: confirm
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Simulate investment creation
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
        } catch (err) {
            console.error('Investment failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-elevated rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Investment Recorded</h3>
                    <p className="text-secondary text-sm mb-6">Your investment interest of KES {Number(amount).toLocaleString()} in {business.name} has been registered. You will be contacted for the next steps.</p>
                    <Button onClick={onClose} className="bg-primary text-white w-full">Done</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-elevated rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-theme flex justify-between items-center">
                    <h2 className="text-lg font-bold text-primary">Invest in {business.name}</h2>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-xl">&times;</button>
                </div>

                <div className="p-5 space-y-5">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Investment Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{ id: 'individual', label: 'Individual', desc: 'Personal investment' },
                                    { id: 'group', label: 'On Behalf of Group', desc: 'Organization or syndicate' }
                                    ].map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => setInvestType(t.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${investType === t.id ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'
                                                }`}
                                        >
                                            <p className="font-semibold text-primary text-sm">{t.label}</p>
                                            <p className="text-xs text-secondary mt-1">{t.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Investment Amount (KES)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 border border-theme rounded-xl bg-secondary text-primary focus:ring-2 focus:ring-primary outline-none"
                                />
                                {business?.valuation && (
                                    <p className="text-xs text-tertiary mt-1">Company valuation: KES {Number(business.valuation).toLocaleString()}</p>
                                )}
                            </div>
                            <Button onClick={() => amount && setStep(2)} disabled={!amount} className="w-full bg-primary text-white">
                                Continue to Legal Review
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="space-y-4">
                                <h3 className="font-bold text-primary flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" /> Legal Disclaimers
                                </h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 text-sm text-amber-800">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p><strong>Investment Risk:</strong> All investments carry risk. You may lose some or all of your invested capital. Past performance does not guarantee future results.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p><strong>No Guaranteed Returns:</strong> Returns on investments in private companies are not guaranteed and depend on business performance.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p><strong>Illiquidity:</strong> Shares in private companies are typically illiquid. You may not be able to sell your shares immediately.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p><strong>Dilution:</strong> Future funding rounds may dilute your equity percentage.</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                                    <p><strong>Regulatory Notice:</strong> This platform facilitates introductions between investors and businesses. Qomrade does not provide financial advice. Please consult a licensed financial advisor before making investment decisions.</p>
                                </div>
                                <label className="flex items-start gap-3 p-3 bg-secondary/5 rounded-xl cursor-pointer border border-theme">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={e => setAgreed(e.target.checked)}
                                        className="mt-1 rounded"
                                    />
                                    <span className="text-sm text-primary">
                                        I acknowledge that I have read and understood the risk disclaimers above. I am investing at my own risk and have the financial capacity to bear potential losses.
                                    </span>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                                <Button onClick={() => agreed && setStep(3)} disabled={!agreed} className="flex-1 bg-primary text-white">
                                    Proceed
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="text-center space-y-3">
                                <h3 className="font-bold text-xl text-primary">Confirm Investment</h3>
                                <div className="p-6 bg-gradient-to-br from-primary/5 to-green-50 rounded-2xl border border-theme">
                                    <p className="text-sm text-secondary">You are investing</p>
                                    <p className="text-3xl font-bold text-primary my-2">KES {Number(amount).toLocaleString()}</p>
                                    <p className="text-sm text-secondary">in <strong>{business.name}</strong></p>
                                    <p className="text-xs text-tertiary mt-2">as {investType === 'individual' ? 'Individual Investor' : 'Group Representative'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                                <Button onClick={handleConfirm} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                    {loading ? 'Processing...' : 'Confirm Investment'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
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
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
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
                    <Button onClick={() => setShowInvestModal(true)} className="bg-white text-violet-700 hover:bg-white/90 font-bold flex items-center gap-2">
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

                    <Button onClick={() => setShowInvestModal(true)} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 flex items-center justify-center gap-2">
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
                <InvestModal business={business} onClose={() => setShowInvestModal(false)} />
            )}
        </div>
    );
};

export default BusinessDetail;
