import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Wifi, Tv, Phone, Droplets, GraduationCap, Home, Building2, ChevronRight, ChevronDown, Clock, CheckCircle, XCircle, Search, ArrowLeft, RefreshCw, Loader2, Plus, X, Calendar, Trash2, Edit, CreditCard, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { billsService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import PaymentTypeSelector from '../../components/payments/PaymentTypeSelector';

const BILL_CATEGORIES = [
    { id: 'electricity', label: 'Electricity', icon: Zap, emoji: '⚡' },
    { id: 'water', label: 'Water', icon: Droplets, emoji: '💧' },
    { id: 'tv', label: 'TV & Streaming', icon: Tv, emoji: '📺' },
    { id: 'airtime', label: 'Airtime & Data', icon: Phone, emoji: '📱' },
    { id: 'internet', label: 'Internet', icon: Wifi, emoji: '🌐' },
    { id: 'school_fees', label: 'School Fees', icon: GraduationCap, emoji: '🎓' },
    { id: 'rent', label: 'Rent', icon: Home, emoji: '🏠' },
    { id: 'government', label: 'Government', icon: Building2, emoji: '🏛️' },
];

const BillPayments = () => {
    const navigate = useNavigate();
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providers, setProviders] = useState([]);
    const [expandedSections, setExpandedSections] = useState(
        Object.fromEntries(BILL_CATEGORIES.map(c => [c.id, false]))
    );
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [multiDestination, setMultiDestination] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [tab, setTab] = useState('pay');

    // Service Provider states
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [myProviders, setMyProviders] = useState([]);
    const [providerForm, setProviderForm] = useState({
        name: '', account_number: '', destination_account: '', category: 'electricity', destination_type: 'external_mpesa', details: ''
    });
    const [savingProvider, setSavingProvider] = useState(false);

    // Standing Order states
    const [showStandingOrderModal, setShowStandingOrderModal] = useState(false);
    const [standingOrders, setStandingOrders] = useState([]);
    const [standingOrderForm, setStandingOrderForm] = useState({
        provider_id: '', amount: '', frequency: 'monthly', start_date: '', end_date: ''
    });
    const [savingStandingOrder, setSavingStandingOrder] = useState(false);

    useEffect(() => {
        billsService.getPaymentHistory().then(r => {
            setHistory(r.data?.results || r.data || []);
        }).catch(() => {}).finally(() => setLoadingHistory(false));

        // Load saved service providers
        billsService.getMyServiceProviders().then(r => {
            setMyProviders(r.data?.results || r.data || []);
        }).catch(() => {});

        // Load standing orders
        billsService.getStandingOrders().then(r => {
            setStandingOrders(r.data?.results || r.data || []);
        }).catch(() => {});

        // Load all providers
        setLoadingProviders(true);
        billsService.getProviders().then(r => {
            const fetched = r.data?.results || r.data || [];
            setProviders(fetched);
            // Automatically expand the first category that has providers
            if (fetched.length > 0) {
                const firstCat = BILL_CATEGORIES.find(c => fetched.some(p => p.category === c.id));
                if (firstCat) setExpandedSections(prev => ({ ...prev, [firstCat.id]: true }));
            }
        }).catch(() => setProviders([])).finally(() => setLoadingProviders(false));
    }, []);

    const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

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

    const handleSaveProvider = async (e) => {
        e.preventDefault();
        setSavingProvider(true);
        try {
            const res = await billsService.addServiceProvider(providerForm);
            setMyProviders(prev => [...prev, res.data]);
            setShowProviderModal(false);
            setProviderForm({ name: '', account_number: '', destination_account: '', category: 'electricity', destination_type: 'external_mpesa', details: '' });
        } catch (err) {
            console.error('Failed to save provider:', err);
            // Optimistic add for demo when backend isn't ready
            setMyProviders(prev => [...prev, { id: Date.now(), ...providerForm }]);
            setShowProviderModal(false);
            setProviderForm({ name: '', account_number: '', destination_account: '', category: 'electricity', destination_type: 'external_mpesa', details: '' });
        } finally {
            setSavingProvider(false);
        }
    };

    const handleDeleteProvider = async (id) => {
        try {
            await billsService.deleteServiceProvider(id);
        } catch {} // Proceed anyway for demo
        setMyProviders(prev => prev.filter(p => p.id !== id));
    };

    const handleCreateStandingOrder = async (e) => {
        e.preventDefault();
        setSavingStandingOrder(true);
        try {
            const res = await billsService.createStandingOrder(standingOrderForm);
            setStandingOrders(prev => [...prev, res.data]);
            setShowStandingOrderModal(false);
            setStandingOrderForm({ provider_id: '', amount: '', frequency: 'monthly', start_date: '', end_date: '' });
        } catch (err) {
            console.error('Failed to create standing order:', err);
            // Optimistic add
            setStandingOrders(prev => [...prev, { id: Date.now(), status: 'active', ...standingOrderForm }]);
            setShowStandingOrderModal(false);
            setStandingOrderForm({ provider_id: '', amount: '', frequency: 'monthly', start_date: '', end_date: '' });
        } finally {
            setSavingStandingOrder(false);
        }
    };

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Bill Payments</h1>
                    <p className="text-secondary text-sm mt-1">Pay utilities, airtime, subscriptions, and more</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['pay', 'providers', 'standing_orders', 'history'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === t ? 'bg-primary flex items-center text-white shadow-md border-[1.5px] border-primary' : 'bg-transparent border-[1.5px] border-theme text-primary hover:bg-primary-600 hover:text-white hover:border-primary-600'}`}>
                            {t === 'pay' ? <><CreditCard className="w-4 h-4"/> Pay</> : 
                             t === 'providers' ? <><Building2 className="w-4 h-4"/> Providers</> : 
                             t === 'standing_orders' ? <><RefreshCw className="w-4 h-4"/> Standing Orders</> : 
                             <><History className="w-4 h-4"/> History</>}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'pay' ? (
                    <motion.div key="pay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Category List - collapsible sections */}
                        {!selectedProvider && !paymentSuccess && (
                            <div className="space-y-4">
                                {loadingProviders ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                                ) : (
                                    BILL_CATEGORIES.map(cat => {
                                        const Icon = cat.icon;
                                        const catProviders = providers.filter(p => p.category === cat.id);
                                        const isExpanded = expandedSections[cat.id];
                                        
                                        return (
                                            <div key={cat.id} className="bg-elevated rounded-2xl border border-theme overflow-hidden">
                                                <button onClick={() => toggleSection(cat.id)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Icon className="w-5 h-5 text-primary-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="font-semibold text-primary text-sm">{cat.label}</span>
                                                            <p className="text-xs text-secondary mt-0.5">{catProviders.length} provider{catProviders.length !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className={`w-5 h-5 text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div className="border-t border-theme divide-y divide-theme bg-secondary/5">
                                                        {catProviders.length === 0 ? (
                                                            <div className="text-center py-6 text-tertiary text-sm">No providers available yet.</div>
                                                        ) : (
                                                            catProviders.map(provider => (
                                                                <button key={provider.id} onClick={() => setSelectedProvider(provider)}
                                                                    className="w-full flex items-center gap-4 p-4 hover:bg-primary/10 transition-colors pl-6 md:pl-8">
                                                                    <div className="w-8 h-8 bg-white border border-theme rounded-xl flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                                                                        {provider.name.charAt(0)}
                                                                    </div>
                                                                    <div className="text-left flex-1">
                                                                        <p className="font-semibold text-primary text-sm">{provider.name}</p>
                                                                        <p className="text-xs text-tertiary">{provider.description}</p>
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-tertiary" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
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
                                    <div className="flex gap-3">
                                        <Button variant="primary" className="flex-1 py-3 font-bold text-lg rounded-xl" onClick={handlePay} disabled={!accountNumber || !amount || (purchaseType === 'group' && !selectedGroupId)}>
                                            {`Pay KES ${amount ? parseFloat(amount).toLocaleString() : '0'}`}
                                        </Button>
                                        <Button variant="outline" className="py-3 rounded-xl" onClick={() => setShowStandingOrderModal(true)} title="Set up recurring payment">
                                            <RefreshCw className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                ) : tab === 'providers' ? (
                    /* ===== SERVICE PROVIDERS TAB ===== */
                    <motion.div key="providers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-primary">My Service Providers</h2>
                            <Button variant="primary" onClick={() => setShowProviderModal(true)} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Provider
                            </Button>
                        </div>
                        {myProviders.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <Building2 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary mb-2">No saved providers yet.</p>
                                <p className="text-tertiary text-sm">Add service providers to quickly pay bills without re-entering details.</p>
                            </div>
                        ) : (
                            <div className="bg-elevated rounded-2xl border border-theme overflow-hidden divide-y divide-theme">
                                {myProviders.map(sp => (
                                    <div key={sp.id} className="flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                                                {sp.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary text-sm">{sp.name}</h4>
                                                <p className="text-xs text-secondary">{sp.account_number} {sp.destination_account && `→ ${sp.destination_account}`} · {sp.category} · <span className="capitalize">{(sp.destination_type || '').replace('_', ' ')}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sp.destination_type?.includes('internal') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {sp.destination_type?.includes('internal') ? 'Internal' : 'External'}
                                            </span>
                                            <button onClick={() => handleDeleteProvider(sp.id)} className="p-1.5 text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                ) : tab === 'standing_orders' ? (
                    /* ===== STANDING ORDERS TAB ===== */
                    <motion.div key="standing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-primary">Standing Orders</h2>
                            <Button variant="primary" onClick={() => setShowStandingOrderModal(true)} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" /> New Standing Order
                            </Button>
                        </div>
                        {standingOrders.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <RefreshCw className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary mb-2">No standing orders yet.</p>
                                <p className="text-tertiary text-sm">Set up recurring bill payments to automate your expenses.</p>
                            </div>
                        ) : (
                            <div className="bg-elevated rounded-2xl border border-theme overflow-hidden divide-y divide-theme">
                                {standingOrders.map(so => (
                                    <div key={so.id} className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <RefreshCw className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary text-sm">
                                                    {myProviders.find(p => p.id == so.provider_id)?.name || `Provider #${so.provider_id}`}
                                                </h4>
                                                <p className="text-xs text-secondary capitalize">
                                                    KES {parseFloat(so.amount || 0).toLocaleString()} · {so.frequency}
                                                    {so.start_date && ` · Starts ${so.start_date}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${so.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {so.status || 'Active'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                ) : (
                    /* ===== HISTORY TAB ===== */
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

            {/* ===== ADD SERVICE PROVIDER MODAL ===== */}
            {showProviderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-2xl border border-theme w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-theme">
                            <h3 className="text-lg font-bold text-primary">Add Service Provider</h3>
                            <button onClick={() => setShowProviderModal(false)} className="p-1 hover:bg-secondary/10 rounded-lg"><X className="w-5 h-5 text-secondary" /></button>
                        </div>
                        <form onSubmit={handleSaveProvider} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Provider Name *</label>
                                <input type="text" required value={providerForm.name} onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    placeholder="e.g. Kenya Power" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Account / Meter Number *</label>
                                <input type="text" required value={providerForm.account_number} onChange={e => setProviderForm({ ...providerForm, account_number: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    placeholder="e.g. 12345678" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Category</label>
                                    <select value={providerForm.category} onChange={e => setProviderForm({ ...providerForm, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                                        {BILL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Destination</label>
                                    <select value={providerForm.destination_type} onChange={e => setProviderForm({ ...providerForm, destination_type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                                        <option value="external_mpesa">M-Pesa (External)</option>
                                        <option value="external_bank">Bank (External)</option>
                                        <option value="internal_wallet">Qomrade Wallet (Internal)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Destination Account (Optional)</label>
                                <input type="text" value={providerForm.destination_account} onChange={e => setProviderForm({ ...providerForm, destination_account: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    placeholder="e.g. Paybill, Till Number, Bank Acct..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Additional Details</label>
                                <textarea value={providerForm.details} onChange={e => setProviderForm({ ...providerForm, details: e.target.value })} rows={2}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                                    placeholder="Optional notes..." />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProviderModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" disabled={savingProvider || !providerForm.name || !providerForm.account_number}>
                                    {savingProvider ? 'Saving...' : 'Save Provider'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== STANDING ORDER MODAL ===== */}
            {showStandingOrderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-2xl border border-theme w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-theme">
                            <h3 className="text-lg font-bold text-primary">Set Up Standing Order</h3>
                            <button onClick={() => setShowStandingOrderModal(false)} className="p-1 hover:bg-secondary/10 rounded-lg"><X className="w-5 h-5 text-secondary" /></button>
                        </div>
                        <form onSubmit={handleCreateStandingOrder} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Service Provider *</label>
                                <select required value={standingOrderForm.provider_id} onChange={e => setStandingOrderForm({ ...standingOrderForm, provider_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                                    <option value="">Select provider...</option>
                                    {myProviders.map(p => <option key={p.id} value={p.id}>{p.name} ({p.account_number})</option>)}
                                </select>
                                {myProviders.length === 0 && (
                                    <p className="text-xs text-tertiary mt-1">No saved providers. <button type="button" onClick={() => { setShowStandingOrderModal(false); setShowProviderModal(true); }} className="text-primary underline">Add one first</button></p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Amount (KES) *</label>
                                <input type="number" min="1" required value={standingOrderForm.amount} onChange={e => setStandingOrderForm({ ...standingOrderForm, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Frequency</label>
                                <select value={standingOrderForm.frequency} onChange={e => setStandingOrderForm({ ...standingOrderForm, frequency: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Start Date *</label>
                                    <input type="date" required value={standingOrderForm.start_date} onChange={e => setStandingOrderForm({ ...standingOrderForm, start_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">End Date</label>
                                    <input type="date" value={standingOrderForm.end_date} onChange={e => setStandingOrderForm({ ...standingOrderForm, end_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowStandingOrderModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" disabled={savingStandingOrder || !standingOrderForm.provider_id || !standingOrderForm.amount || !standingOrderForm.start_date}>
                                    {savingStandingOrder ? 'Creating...' : 'Create Standing Order'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillPayments;
