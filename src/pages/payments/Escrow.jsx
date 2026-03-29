import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Lock, Package, Users, AlertTriangle, CheckCircle,
    Clock, XCircle, ArrowLeft, Plus, ChevronRight, ShieldCheck,
    ArrowRightLeft, RefreshCw, Eye, MessageSquare, Flag, Loader2
} from 'lucide-react';
import { escrowService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import PaymentTypeSelector from '../../components/payments/PaymentTypeSelector';

const ESCROW_TYPES = [
    { id: 'marketplace', label: 'Marketplace Purchase', icon: Package, color: 'from-blue-500 to-indigo-600', desc: 'Buy products or services securely' },
    { id: 'gig', label: 'Gig / Freelance', icon: Users, color: 'from-purple-500 to-violet-600', desc: 'Secure payments for freelance work' },
    { id: 'p2p', label: 'Peer-to-Peer', icon: ArrowRightLeft, color: 'from-emerald-500 to-green-600', desc: 'Safe transactions between individuals' },
    { id: 'group_investment', label: 'Group Investment', icon: ShieldCheck, color: 'from-amber-500 to-orange-600', desc: 'Protect group investment funds' },
];

const STATUS_CONFIG = {
    initiated: { color: 'bg-secondary/10 text-secondary', icon: Clock },
    funded: { color: 'bg-blue-500/15 text-blue-500', icon: Lock },
    in_progress: { color: 'bg-indigo-500/15 text-indigo-500', icon: RefreshCw },
    delivered: { color: 'bg-amber-500/15 text-amber-500', icon: Package },
    released: { color: 'bg-emerald-500/15 text-emerald-500', icon: CheckCircle },
    disputed: { color: 'bg-rose-500/15 text-rose-500', icon: AlertTriangle },
    refunded: { color: 'bg-purple-500/15 text-purple-500', icon: ArrowRightLeft },
    cancelled: { color: 'bg-secondary/10 text-tertiary', icon: XCircle },
};

const Escrow = () => {
    const navigate = useNavigate();
    const [escrows, setEscrows] = useState([]);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', escrow_type: 'marketplace', description: '', amount: '', seller: '', release_conditions: '' });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [fundingEscrow, setFundingEscrow] = useState(null);
    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [multiDestination, setMultiDestination] = useState(false);

    useEffect(() => {
        escrowService.getMyEscrows().then(r => {
            setEscrows(r.data?.results || r.data || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        setSubmitting(true);
        try {
            await escrowService.createEscrow({ ...form, amount: parseFloat(form.amount), seller: parseInt(form.seller) });
            setCreating(false); setForm({ title: '', escrow_type: 'marketplace', description: '', amount: '', seller: '', release_conditions: '' });
            // Refresh escrows
            const r = await escrowService.getMyEscrows();
            setEscrows(r.data?.results || r.data || []);
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const handleFund = (escrow) => {
        setFundingEscrow(escrow);
        setPurchaseType('individual');
        setSelectedGroupId('');
    };

    const confirmFund = () => {
        if (!fundingEscrow) return;
        if (purchaseType === 'group' && !selectedGroupId) return;

        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: fundingEscrow.id,
                    type: 'escrow_funding',
                    name: `Escrow: ${fundingEscrow.title}`,
                    price: parseFloat(fundingEscrow.total_amount || fundingEscrow.amount),
                    qty: 1,
                    payload: { escrow_id: fundingEscrow.id },
                    metadata: { seller: fundingEscrow.seller_name, amount: fundingEscrow.amount, fee: fundingEscrow.escrow_fee },
                }],
                purchaseType: purchaseType,
                selectedGroupId: selectedGroupId,
                totalAmount: parseFloat(fundingEscrow.total_amount || fundingEscrow.amount),
                isMultiDestination: multiDestination
            }
        });
        setFundingEscrow(null);
    };

    const statusCounts = {
        total: escrows.length,
        active: escrows.filter(e => ['funded', 'in_progress', 'delivered'].includes(e.status)).length,
        disputed: escrows.filter(e => e.status === 'disputed').length,
        completed: escrows.filter(e => e.status === 'released').length,
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><Shield className="w-8 h-8" /> Escrow</h1>
                    <p className="text-secondary text-sm mt-1">Secure payments with milestone-based fund release</p>
                </div>
                <Button variant="primary" className="rounded-xl" onClick={() => setCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Escrow
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: statusCounts.total, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Active', value: statusCounts.active, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Disputed', value: statusCounts.disputed, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Completed', value: statusCounts.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-secondary">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Create New Escrow */}
            <AnimatePresence>
                {creating && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="bg-elevated border border-theme rounded-2xl p-6 space-y-5 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-primary text-lg">Create Escrow Transaction</h3>
                            <button onClick={() => setCreating(false)} className="text-tertiary hover:text-primary"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {ESCROW_TYPES.map(t => (
                                <button key={t.id} onClick={() => setForm({ ...form, escrow_type: t.id })}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${form.escrow_type === t.id ? 'border-primary-600 bg-primary-600/5' : 'border-theme hover:border-primary-600/30'}`}>
                                    <t.icon className={`w-5 h-5 mb-2 ${form.escrow_type === t.id ? 'text-primary-600' : 'text-tertiary'}`} />
                                    <p className={`text-sm font-semibold ${form.escrow_type === t.id ? 'text-primary-600' : 'text-primary'}`}>{t.label}</p>
                                    <p className="text-xs text-tertiary mt-0.5">{t.desc}</p>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Website Development"
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Amount (KES)</label>
                                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="50000"
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe the transaction..."
                                className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Release Conditions</label>
                            <input value={form.release_conditions} onChange={e => setForm({ ...form, release_conditions: e.target.value })} placeholder="e.g., Upon delivery confirmation"
                                className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none" />
                        </div>
                        {form.amount && (
                            <div className="bg-secondary/5 rounded-xl p-4 flex justify-between text-sm">
                                <span className="text-secondary">Escrow Fee (2%)</span>
                                <span className="font-bold text-primary">KES {(parseFloat(form.amount || 0) * 0.02).toLocaleString()} → Total: KES {(parseFloat(form.amount || 0) * 1.02).toLocaleString()}</span>
                            </div>
                        )}
                        <Button variant="primary" className="w-full py-3 rounded-xl font-bold" onClick={handleCreate} disabled={!form.title || !form.amount || submitting}>
                            {submitting ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Create Escrow'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Escrow List */}
            <div className="space-y-4">
                <h3 className="font-bold text-primary">Your Transactions</h3>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                ) : escrows.length === 0 ? (
                    <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                        <Shield className="w-12 h-12 text-tertiary mx-auto mb-3" />
                        <h3 className="font-bold text-primary">No Escrow Transactions</h3>
                        <p className="text-tertiary text-sm mt-1">Create your first escrow to secure a transaction.</p>
                    </div>
                ) : escrows.map(escrow => {
                    const SC = STATUS_CONFIG[escrow.status] || STATUS_CONFIG.initiated;
                    const StatusIcon = SC.icon;
                    return (
                        <motion.div key={escrow.id} whileHover={{ scale: 1.005 }}
                            className="bg-elevated border border-theme rounded-2xl overflow-hidden hover:shadow-md transition-all">
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${SC.color}`}>
                                        <StatusIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary">{escrow.title}</h4>
                                        <p className="text-xs text-tertiary">{escrow.type_display || escrow.escrow_type} • with {escrow.seller_name || 'Seller'} • {new Date(escrow.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary text-lg">KES {parseFloat(escrow.amount).toLocaleString()}</p>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SC.color}`}>{escrow.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            {/* Milestones */}
                            {escrow.milestones?.length > 0 && (
                                <div className="px-6 pb-4">
                                    <p className="text-xs font-medium text-secondary mb-2">Milestones</p>
                                    <div className="flex gap-2">
                                        {escrow.milestones.map((m, i) => (
                                            <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${m.completed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-secondary/5 text-tertiary'}`}>
                                                {m.completed && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                                {m.name} • KES {(m.amount || 0).toLocaleString()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Actions */}
                            {['initiated', 'funded', 'delivered'].includes(escrow.status) && (
                                <div className="px-6 pb-4 flex gap-2">
                                    {escrow.status === 'initiated' && (
                                        <button onClick={() => handleFund(escrow)} className="px-4 py-2 text-xs font-semibold bg-blue-500/15 text-blue-500 rounded-xl hover:bg-blue-500/25 transition-colors">Fund Escrow</button>
                                    )}
                                    {escrow.status === 'funded' && (
                                        <button className="px-4 py-2 text-xs font-semibold bg-amber-500/15 text-amber-500 rounded-xl hover:bg-amber-500/25 transition-colors">Mark Delivered</button>
                                    )}
                                    {escrow.status === 'delivered' && (
                                        <button className="px-4 py-2 text-xs font-semibold bg-emerald-500/15 text-emerald-500 rounded-xl hover:bg-emerald-500/25 transition-colors">Release Funds</button>
                                    )}
                                    <button className="px-4 py-2 text-xs font-semibold bg-rose-500/15 text-rose-500 rounded-xl hover:bg-rose-500/25 transition-colors flex items-center gap-1">
                                        <Flag className="w-3 h-3" /> Dispute
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* How it Works */}
            <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-primary">How Escrow Works</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { step: '1', title: 'Create', desc: 'Agree on terms and create escrow', icon: Plus },
                        { step: '2', title: 'Fund', desc: 'Buyer deposits funds securely', icon: Lock },
                        { step: '3', title: 'Deliver', desc: 'Seller delivers goods/services', icon: Package },
                        { step: '4', title: 'Release', desc: 'Buyer confirms and funds release', icon: CheckCircle },
                    ].map(s => (
                        <div key={s.step} className="text-center space-y-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto"><s.icon className="w-5 h-5 text-primary" /></div>
                            <p className="font-bold text-primary text-sm">{s.title}</p>
                            <p className="text-xs text-tertiary">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Funding Modal */}
            <AnimatePresence>
                {fundingEscrow && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFundingEscrow(null)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-elevated border border-theme rounded-3xl p-6 z-50 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-blue-500" /> Fund Escrow
                                </h2>
                                <button onClick={() => setFundingEscrow(null)} className="p-2 hover:bg-secondary/10 rounded-xl transition-colors text-secondary"><XCircle size={24} /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-secondary/5 border border-theme rounded-xl space-y-2">
                                    <h4 className="font-bold text-primary">{fundingEscrow.title}</h4>
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Amount</span><span className="font-bold text-primary">KES {parseFloat(fundingEscrow.amount).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-secondary">Escrow Fee</span><span className="font-bold text-primary">KES {parseFloat(fundingEscrow.escrow_fee).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-lg font-bold border-t border-theme pt-2 mt-2"><span className="text-primary">Total to Fund</span><span className="text-blue-500">KES {parseFloat(fundingEscrow.total_amount || fundingEscrow.amount).toLocaleString()}</span></div>
                                </div>
                                <PaymentTypeSelector 
                                    purchaseType={purchaseType} setPurchaseType={setPurchaseType} 
                                    selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId}
                                    multiDestination={multiDestination} setMultiDestination={setMultiDestination}
                                />
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setFundingEscrow(null)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1" onClick={confirmFund} disabled={purchaseType === 'group' && !selectedGroupId}>
                                        Proceed to Checkout <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Escrow;
