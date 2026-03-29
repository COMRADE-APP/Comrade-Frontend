import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Wifi, Tv, Phone, Droplets, GraduationCap, Home, Building2, ChevronRight, Clock, CheckCircle, XCircle, Search, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { billsService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import PaymentTypeSelector from '../../components/payments/PaymentTypeSelector';

const BILL_CATEGORIES = [
    { id: 'electricity', label: 'Electricity', icon: Zap, color: 'from-amber-500 to-orange-600', emoji: '⚡' },
    { id: 'water', label: 'Water', icon: Droplets, color: 'from-cyan-500 to-blue-600', emoji: '💧' },
    { id: 'tv', label: 'TV & Streaming', icon: Tv, color: 'from-purple-500 to-indigo-600', emoji: '📺' },
    { id: 'airtime', label: 'Airtime & Data', icon: Phone, color: 'from-green-500 to-emerald-600', emoji: '📱' },
    { id: 'internet', label: 'Internet', icon: Wifi, color: 'from-blue-500 to-cyan-600', emoji: '🌐' },
    { id: 'school_fees', label: 'School Fees', icon: GraduationCap, color: 'from-rose-500 to-pink-600', emoji: '🎓' },
    { id: 'rent', label: 'Rent', icon: Home, color: 'from-teal-500 to-green-600', emoji: '🏠' },
    { id: 'government', label: 'Government', icon: Building2, color: 'from-slate-500 to-gray-700', emoji: '🏛️' },
];

const BillPayments = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providers, setProviders] = useState([]);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [multiDestination, setMultiDestination] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [tab, setTab] = useState('pay');

    useEffect(() => {
        billsService.getPaymentHistory().then(r => {
            setHistory(r.data?.results || r.data || []);
        }).catch(() => {}).finally(() => setLoadingHistory(false));
    }, []);

    useEffect(() => {
        if (activeCategory) {
            setLoadingProviders(true);
            billsService.getProviders(activeCategory).then(r => {
                setProviders(r.data?.results || r.data || []);
            }).catch(() => setProviders([])).finally(() => setLoadingProviders(false));
        }
    }, [activeCategory]);

    const handlePay = () => {
        if (!selectedProvider || !accountNumber || !amount) return;
        const fee = parseFloat(amount) * 0.015;
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: selectedProvider.id,
                    type: 'bill_payment',
                    name: `${selectedProvider.name} - ${accountNumber}`,
                    price: parseFloat(amount) + fee,
                    qty: 1,
                    payload: { provider: selectedProvider.id, account_number: accountNumber, amount: parseFloat(amount) },
                    metadata: { provider_name: selectedProvider.name, account_label: selectedProvider.account_label, fee },
                }],
                purchaseType: purchaseType,
                selectedGroupId: selectedGroupId,
                totalAmount: parseFloat(amount) + fee,
                isMultiDestination: multiDestination
            }
        });
    };

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Bill Payments</h1>
                    <p className="text-secondary text-sm mt-1">Pay utilities, airtime, subscriptions, and more</p>
                </div>
                <div className="flex gap-2">
                    {['pay', 'history'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-primary text-white shadow-md' : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'}`}>
                            {t === 'pay' ? '💳 Pay' : '📜 History'}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'pay' ? (
                    <motion.div key="pay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Category Grid */}
                        {!activeCategory && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {BILL_CATEGORIES.map(cat => (
                                    <motion.div key={cat.id} whileHover={{ y: -4, scale: 1.02 }} onClick={() => setActiveCategory(cat.id)}
                                        className={`bg-gradient-to-br ${cat.color} text-white p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-shadow group flex flex-col justify-between`}>
                                        <div>
                                            <cat.icon className="w-8 h-8 mb-4 opacity-80" />
                                            <h3 className="font-bold text-lg">{cat.label}</h3>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Provider Selection */}
                        {activeCategory && !selectedProvider && (
                            <div className="space-y-4">
                                <button onClick={() => { setActiveCategory(null); setProviders([]); }} className="flex items-center text-secondary hover:text-primary transition-colors text-sm">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to categories
                                </button>
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    {BILL_CATEGORIES.find(c => c.id === activeCategory)?.emoji} {BILL_CATEGORIES.find(c => c.id === activeCategory)?.label}
                                </h2>
                                {loadingProviders ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                                ) : providers.length === 0 ? (
                                    <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                        <p className="text-tertiary">No providers found for this category.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {providers.map(provider => (
                                            <motion.div key={provider.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedProvider(provider)}
                                                className="bg-elevated border border-theme rounded-2xl p-5 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-lg">{provider.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-semibold text-primary">{provider.name}</p>
                                                    <p className="text-xs text-tertiary">{provider.description}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-tertiary ml-auto" />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Form */}
                        {selectedProvider && !paymentSuccess && (
                            <div className="space-y-4">
                                <button onClick={() => setSelectedProvider(null)} className="flex items-center text-secondary hover:text-primary transition-colors text-sm">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to providers
                                </button>
                                <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center gap-4 pb-4 border-b border-theme">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-lg">{selectedProvider.name.charAt(0)}</div>
                                        <div>
                                            <h3 className="font-bold text-primary text-lg">{selectedProvider.name}</h3>
                                            <p className="text-xs text-tertiary">{selectedProvider.description}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">{selectedProvider.account_label}</label>
                                        <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={`Enter ${selectedProvider.account_label.toLowerCase()}`}
                                            className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">Amount (KES)</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
                                            className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-2xl font-bold" />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {quickAmounts.map(a => (
                                                <button key={a} onClick={() => setAmount(String(a))} className="px-3 py-1.5 text-xs font-semibold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-colors">
                                                    KES {a.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {amount && (
                                        <div className="bg-secondary/5 rounded-xl p-4 space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-secondary">Amount</span><span className="text-primary font-medium">KES {parseFloat(amount || 0).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary">Service Fee</span><span className="text-primary font-medium">KES {(parseFloat(amount || 0) * 0.015).toFixed(2)}</span></div>
                                            <div className="flex justify-between border-t border-theme pt-2"><span className="font-bold text-primary">Total</span><span className="font-bold text-primary">KES {(parseFloat(amount || 0) * 1.015).toFixed(2)}</span></div>
                                        </div>
                                    )}
                                    <PaymentTypeSelector 
                                        purchaseType={purchaseType} setPurchaseType={setPurchaseType} 
                                        selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId}
                                        multiDestination={multiDestination} setMultiDestination={setMultiDestination}
                                    />
                                    <Button variant="primary" className="w-full py-3 font-bold text-lg rounded-xl" onClick={handlePay} disabled={!accountNumber || !amount || (purchaseType === 'group' && !selectedGroupId)}>
                                        {`Pay KES ${amount ? parseFloat(amount).toLocaleString() : '0'}`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-theme">
                                <h3 className="font-bold text-primary">Payment History</h3>
                            </div>
                            {loadingHistory ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                            ) : history.length === 0 ? (
                                <div className="p-10 text-center text-tertiary">No bill payments yet.</div>
                            ) : (
                                <div className="divide-y divide-theme">
                                    {history.map(tx => (
                                        <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                                                    {tx.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-primary">{tx.provider_name || tx.provider?.name || 'Bill Payment'}</p>
                                                    <p className="text-xs text-tertiary">{tx.account_number} • {new Date(tx.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">KES {parseFloat(tx.amount).toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>{tx.status}</span>
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

export default BillPayments;
