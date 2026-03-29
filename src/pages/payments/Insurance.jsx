import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Heart, Smartphone, Plane, Building2, Wheat, GraduationCap, Briefcase,
    ChevronRight, ArrowLeft, CheckCircle, Clock, XCircle, Star, AlertTriangle,
    FileText, Plus, RefreshCw, Upload, Loader2
} from 'lucide-react';
import { insuranceService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import PaymentTypeSelector from '../../components/payments/PaymentTypeSelector';

const CATEGORIES = [
    { id: 'health', label: 'Health', icon: Heart, color: 'from-rose-500 to-pink-600', emoji: '❤️' },
    { id: 'device', label: 'Device / Phone', icon: Smartphone, color: 'from-blue-500 to-indigo-600', emoji: '📱' },
    { id: 'travel', label: 'Travel', icon: Plane, color: 'from-cyan-500 to-blue-600', emoji: '✈️' },
    { id: 'crop', label: 'Crop Insurance', icon: Wheat, color: 'from-emerald-500 to-green-600', emoji: '🌾' },
    { id: 'business', label: 'Business', icon: Briefcase, color: 'from-amber-500 to-orange-600', emoji: '💼' },
    { id: 'asset', label: 'Asset Protection', icon: Building2, color: 'from-violet-500 to-purple-600', emoji: '🏠' },
    { id: 'education', label: 'Education Plan', icon: GraduationCap, color: 'from-teal-500 to-cyan-600', emoji: '🎓' },
    { id: 'funeral', label: 'Funeral Cover', icon: Shield, color: 'from-gray-500 to-slate-700', emoji: '🕊️' },
];

const Insurance = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('browse');
    const [activeCategory, setActiveCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [claimForm, setClaimForm] = useState({ policy: '', amount: '', reason: '' });
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingPolicies, setLoadingPolicies] = useState(true);

    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [multiDestination, setMultiDestination] = useState(false);

    useEffect(() => {
        insuranceService.getProducts().then(r => setProducts(r.data?.results || r.data || [])).catch(() => {}).finally(() => setLoadingProducts(false));
        insuranceService.getMyPolicies().then(r => setPolicies(r.data?.results || r.data || [])).catch(() => {}).finally(() => setLoadingPolicies(false));
    }, []);

    const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : products;

    const handleSubscribe = (product) => {
        if (purchaseType === 'group' && !selectedGroupId) return;
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: product.id,
                    type: 'insurance_subscription',
                    name: `${product.name} — ${product.provider}`,
                    price: parseFloat(product.premium_amount),
                    qty: 1,
                    payload: { product: product.id },
                    metadata: { provider: product.provider, category: product.category_display || product.category, frequency: product.frequency_display || product.premium_frequency },
                }],
                purchaseType: purchaseType,
                selectedGroupId: selectedGroupId,
                totalAmount: parseFloat(product.premium_amount),
                isMultiDestination: multiDestination
            }
        });
    };

    const handleClaim = async () => {
        setLoading(true);
        try {
            await insuranceService.fileClaim({ policy: claimForm.policy, amount_claimed: parseFloat(claimForm.amount), reason: claimForm.reason });
            setShowClaimForm(false);
            setClaimForm({ policy: '', amount: '', reason: '' });
            // Refresh policies to get updated claims
            const r = await insuranceService.getMyPolicies();
            setPolicies(r.data?.results || r.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const tabs = [
        { id: 'browse', label: '🛡️ Browse Plans' },
        { id: 'policies', label: '📋 My Policies' },
        { id: 'claims', label: '📎 Claims' },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Micro-Insurance</h1>
                <p className="text-secondary text-sm mt-1">Affordable protection for health, devices, crops, and more</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setSelectedProduct(null); setActiveCategory(null); }}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-600 text-white shadow-md' : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* BROWSE */}
                {tab === 'browse' && !selectedProduct && (
                    <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <button onClick={() => setActiveCategory(null)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${!activeCategory ? 'bg-primary-600 text-white' : 'bg-secondary/5 text-secondary hover:bg-secondary/10'}`}>All</button>
                            {CATEGORIES.map(c => (
                                <button key={c.id} onClick={() => setActiveCategory(c.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center ${activeCategory === c.id ? 'bg-primary-600 text-white' : 'bg-secondary/5 text-secondary hover:bg-secondary/10'}`}>
                                    <c.icon className="w-3.5 h-3.5 mr-1" /> {c.label}
                                </button>
                            ))}
                        </div>

                        {/* Product Cards */}
                        {loadingProducts ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <Shield className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                <h3 className="font-bold text-primary">No Insurance Products</h3>
                                <p className="text-tertiary text-sm mt-1">{activeCategory ? 'No products in this category.' : 'Check back soon for new plans.'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(p => (
                                    <motion.div key={p.id} whileHover={{ y: -4 }} onClick={() => setSelectedProduct(p)}
                                        className="bg-elevated border border-theme rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all">
                                        <div className={`bg-gradient-to-br ${CATEGORIES.find(c => c.id === p.category)?.color || 'from-gray-500 to-gray-600'} p-5 text-white`}>
                                            <div className="flex items-center justify-between">
                                                {(() => {
                                                    const CatIcon = CATEGORIES.find(c => c.id === p.category)?.icon || Shield;
                                                    return <CatIcon className="w-8 h-8 opacity-80" />;
                                                })()}
                                                <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-0.5">
                                                    <Star className="w-3 h-3 fill-white" />
                                                    <span className="text-xs font-bold">{p.rating}</span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold mt-2">{p.name}</h3>
                                            <p className="text-white/60 text-xs">{p.provider}</p>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <p className="text-xs text-secondary line-clamp-2">{p.description}</p>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">Premium</span>
                                                <span className="font-bold text-primary">KES {parseFloat(p.premium_amount).toLocaleString()}<span className="text-xs text-tertiary">/{(p.frequency_display || p.premium_frequency || '').toLowerCase()}</span></span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">Coverage</span>
                                                <span className="font-medium text-primary">KES {parseFloat(p.coverage_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* PRODUCT DETAIL */}
                {tab === 'browse' && selectedProduct && (
                    <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <button onClick={() => setSelectedProduct(null)} className="flex items-center text-secondary hover:text-primary text-sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-elevated border border-theme rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-4 pb-4 border-b border-theme">
                                    <span className="text-4xl">{selectedProduct.icon || '🛡️'}</span>
                                    <div>
                                        <h3 className="font-bold text-xl text-primary">{selectedProduct.name}</h3>
                                        <p className="text-sm text-tertiary">{selectedProduct.provider} • {selectedProduct.category_display || selectedProduct.category}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="font-bold text-primary">{selectedProduct.rating}</span></div>
                                </div>
                                <p className="text-secondary text-sm">{selectedProduct.description}</p>

                                <div>
                                    <h4 className="font-bold text-primary text-sm mb-3">✅ What's Covered</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(selectedProduct.benefits || []).map((b, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-secondary"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {b}</div>
                                        ))}
                                    </div>
                                </div>
                                {selectedProduct.exclusions?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-primary text-sm mb-3">❌ Exclusions</h4>
                                        <div className="space-y-1.5">
                                            {selectedProduct.exclusions.map((e, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-tertiary"><XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" /> {e}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-4 h-fit">
                                <h4 className="font-bold text-primary">Plan Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Premium</span><span className="font-bold text-primary">KES {parseFloat(selectedProduct.premium_amount).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Frequency</span><span className="text-primary">{selectedProduct.frequency_display || selectedProduct.premium_frequency}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Coverage</span><span className="font-bold text-primary">KES {parseFloat(selectedProduct.coverage_amount).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Deductible</span><span className="text-primary">KES {parseFloat(selectedProduct.deductible || 0).toLocaleString()}</span></div>
                                    {selectedProduct.waiting_period_days > 0 && (
                                        <div className="flex justify-between text-sm"><span className="text-secondary">Waiting Period</span><span className="text-primary">{selectedProduct.waiting_period_days} days</span></div>
                                    )}
                                </div>
                                <PaymentTypeSelector 
                                    purchaseType={purchaseType} setPurchaseType={setPurchaseType} 
                                    selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId}
                                    multiDestination={multiDestination} setMultiDestination={setMultiDestination}
                                />
                                <Button variant="primary" className="w-full py-3 rounded-xl font-bold" onClick={() => handleSubscribe(selectedProduct)} disabled={purchaseType === 'group' && !selectedGroupId}>
                                    Subscribe to Plan
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* MY POLICIES */}
                {tab === 'policies' && (
                    <motion.div key="policies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        {loadingPolicies ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                        ) : policies.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <Shield className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                <h3 className="font-bold text-primary">No Policies Yet</h3>
                                <p className="text-tertiary text-sm mt-1">Browse insurance plans to get covered.</p>
                                <Button variant="primary" className="mt-4 rounded-xl" onClick={() => setTab('browse')}>Browse Plans</Button>
                            </div>
                        ) : policies.map(pol => (
                            <div key={pol.id} className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pol.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary/10 text-tertiary'}`}>
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">{pol.product_name || pol.product?.name || 'Policy'}</h4>
                                            <p className="text-xs text-tertiary">{pol.product_provider || pol.product?.provider} • {pol.policy_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pol.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary/10 text-tertiary'}`}>{pol.status_display || pol.status}</span>
                                        <p className="text-xs text-tertiary mt-1">{pol.start_date} → {pol.end_date}</p>
                                    </div>
                                </div>
                                <div className="px-6 pb-4 flex justify-between text-xs text-secondary border-t border-theme pt-3">
                                    <span>Premiums Paid: <strong className="text-primary">KES {parseFloat(pol.premium_paid).toLocaleString()}</strong></span>
                                    {pol.next_payment_date && <span>Next Payment: <strong className="text-primary">{pol.next_payment_date}</strong></span>}
                                </div>
                                {pol.claims?.length > 0 && (
                                    <div className="px-6 pb-4">
                                        <p className="text-xs font-medium text-secondary mb-2">Claims</p>
                                        {pol.claims.map(c => (
                                            <div key={c.id} className="flex items-center justify-between bg-secondary/5 rounded-xl p-3 text-sm">
                                                <span className="text-secondary">{c.reason}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-primary">KES {parseFloat(c.amount_claimed).toLocaleString()}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'approved' || c.status === 'paid' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'rejected' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}`}>{c.status_display || c.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* CLAIMS */}
                {tab === 'claims' && (
                    <motion.div key="claims" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-primary">File a Claim</h3>
                            <Button variant="primary" size="sm" className="rounded-xl" onClick={() => setShowClaimForm(!showClaimForm)}>
                                <Plus className="w-4 h-4 mr-1" /> New Claim
                            </Button>
                        </div>
                        <AnimatePresence>
                            {showClaimForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="bg-elevated border border-theme rounded-2xl p-6 space-y-4 overflow-hidden">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Select Policy</label>
                                        <select value={claimForm.policy} onChange={e => setClaimForm({ ...claimForm, policy: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary/30">
                                            <option value="">Choose a policy...</option>
                                            {policies.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.product_name || p.product?.name} ({p.policy_number})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Claim Amount (KES)</label>
                                        <input type="number" value={claimForm.amount} onChange={e => setClaimForm({ ...claimForm, amount: e.target.value })} placeholder="Amount"
                                            className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Reason</label>
                                        <textarea value={claimForm.reason} onChange={e => setClaimForm({ ...claimForm, reason: e.target.value })} rows={3} placeholder="Describe what happened..."
                                            className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
                                    </div>
                                    <Button variant="primary" className="w-full py-3 rounded-xl font-bold" onClick={handleClaim} disabled={!claimForm.policy || !claimForm.amount || !claimForm.reason || loading}>
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Claim'}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-4">
                            <h4 className="font-bold text-primary text-sm">All Claims</h4>
                            {policies.flatMap(p => (p.claims || []).map(c => ({ ...c, policy_name: p.product_name || p.product?.name, policy_number: p.policy_number }))).length === 0 ? (
                                <p className="text-tertiary text-sm text-center py-6">No claims filed yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {policies.flatMap(p => (p.claims || []).map(c => ({ ...c, policy_name: p.product_name || p.product?.name, policy_number: p.policy_number }))).map(c => (
                                        <div key={c.id} className="flex items-center justify-between bg-secondary/5 rounded-xl p-4">
                                            <div>
                                                <p className="font-semibold text-primary text-sm">{c.policy_name}</p>
                                                <p className="text-xs text-tertiary">{c.reason}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">KES {parseFloat(c.amount_claimed).toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'approved' || c.status === 'paid' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'rejected' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}`}>{c.status_display || c.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Insurance;
