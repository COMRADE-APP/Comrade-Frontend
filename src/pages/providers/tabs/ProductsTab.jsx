import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, MoreVertical, Power, PowerOff, Edit2, Trash2, X, DollarSign, Layers, BookOpen, GraduationCap, Shield, CalendarDays, TrendingUp, Banknote, RefreshCcw, ShoppingBag, Zap, Droplets, Phone, Wifi, PiggyBank, Repeat, Star } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';
import api from '../../../services/api';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const PRODUCT_TYPES = [
    { id: 'all', label: 'All', icon: Package, color: 'bg-gray-100 text-gray-700', badge: 'bg-gray-50 text-gray-600' },
    { id: 'service', label: 'Services', icon: Package, color: 'bg-purple-100 text-purple-700', badge: 'bg-purple-50 text-purple-600' },
    { id: 'courses', label: 'Courses', icon: BookOpen, color: 'bg-sky-100 text-sky-700', badge: 'bg-sky-50 text-sky-600' },
    { id: 'masterclasses', label: 'Masterclasses', icon: GraduationCap, color: 'bg-amber-100 text-amber-700', badge: 'bg-amber-50 text-amber-600' },
    { id: 'stacks', label: 'Stacks', icon: Layers, color: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-50 text-emerald-600' },
    { id: 'loans', label: 'Loans', icon: DollarSign, color: 'bg-blue-100 text-blue-700', badge: 'bg-blue-50 text-blue-600' },
    { id: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-teal-100 text-teal-700', badge: 'bg-teal-50 text-teal-600' },
    { id: 'shop', label: 'Shop', icon: ShoppingBag, color: 'bg-rose-100 text-rose-700', badge: 'bg-rose-50 text-rose-600' },
    { id: 'events', label: 'Events', icon: CalendarDays, color: 'bg-rose-100 text-rose-700', badge: 'bg-rose-50 text-rose-600' },
    { id: 'investments', label: 'Investments', icon: TrendingUp, color: 'bg-primary-100 text-primary-700', badge: 'bg-primary-50 text-primary-600' },
];

const NEW_PRODUCT_OPTIONS = [
    { id: 'bill', label: 'Bill Payment', desc: 'Electricity, water, TV, internet', icon: Zap, color: 'from-amber-500 to-orange-600', action: 'createBill' },
    { id: 'utility', label: 'Utility', desc: 'Government services, rent, school fees', icon: Droplets, color: 'from-blue-500 to-cyan-600', action: 'createUtility' },
    { id: 'airtime', label: 'Airtime & Data', desc: 'Mobile airtime and data bundles', icon: Phone, color: 'from-green-500 to-emerald-600', action: 'createAirtime' },
    { id: 'savings', label: 'Savings', desc: 'Interest-bearing savings product', icon: PiggyBank, color: 'from-emerald-500 to-green-600', action: 'createSavings' },
    { id: 'subscription', label: 'Subscription', desc: 'Recurring subscription service', icon: Repeat, color: 'from-indigo-500 to-blue-600', action: 'createSubscription' },
    { id: 'membership', label: 'Membership', desc: 'Tiered membership program', icon: Star, color: 'from-yellow-500 to-amber-600', action: 'createMembership' },
    { id: 'course', label: 'Course', desc: 'Specialization course', icon: BookOpen, color: 'from-sky-500 to-blue-600', action: 'createCourse' },
    { id: 'masterclass', label: 'Masterclass', desc: 'Premium expert-led class', icon: GraduationCap, color: 'from-amber-500 to-orange-600', action: 'createMasterclass' },
    { id: 'stack', label: 'Stack', desc: 'Learning module stack', icon: Layers, color: 'from-emerald-500 to-green-600', action: 'createStack' },
    { id: 'loan', label: 'Loan Product', desc: 'Loan with rates & terms', icon: DollarSign, color: 'from-blue-500 to-cyan-600', action: 'createLoan' },
    { id: 'insurance', label: 'Insurance Product', desc: 'Policy with coverage', icon: Shield, color: 'from-teal-500 to-emerald-600', action: 'createInsurance' },
    { id: 'event', label: 'Event', desc: 'Physical or online event', icon: CalendarDays, color: 'from-rose-500 to-pink-600', action: 'createEvent' },
];

const emptyServiceForm = { name: '', description: '', service_type: 'bill_payment', category: 'other', price: '', price_type: 'fixed', commission_rate: '', processing_fee: '', min_amount: '', max_amount: '', terms_conditions: '', auto_link_kitty: true, is_featured: false };
const emptyLoanForm = { name: '', description: '', interest_rate: '', min_amount: '', max_amount: '', min_tenure_months: '1', max_tenure_months: '24', requires_guarantor: false, guarantors_required: '0', min_credit_score: '0', processing_fee: '0', late_penalty_rate: '1.5', is_group_loan: false };
const emptyInsuranceForm = { name: '', description: '', category: 'health', premium_amount: '', premium_frequency: 'monthly', coverage_amount: '', deductible: '0', waiting_period_days: '0', terms: '', is_group_product: false, min_group_size: '0' };

const TYPE_TO_SERVICE_TYPE = {
    bill: 'bill_payment', utility: 'utility', airtime: 'airtime',
    savings: 'savings', subscription: 'subscription', membership: 'membership',
};

const ProductsTab = ({ provider, onRefresh }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('all');
    const [showNewProductModal, setShowNewProductModal] = useState(false);

    const [serviceProducts, setServiceProducts] = useState([]);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [serviceForm, setServiceForm] = useState(emptyServiceForm);
    const [editingProduct, setEditingProduct] = useState(null);

    const [specializations, setSpecializations] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [loanProducts, setLoanProducts] = useState([]);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [loanForm, setLoanForm] = useState(emptyLoanForm);
    const [insuranceProducts, setInsuranceProducts] = useState([]);
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [insuranceForm, setInsuranceForm] = useState(emptyInsuranceForm);
    const [events, setEvents] = useState([]);
    const [shopProducts, setShopProducts] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [imgErrors, setImgErrors] = useState(new Set());

    const visibleTabs = PRODUCT_TYPES;

    useEffect(() => { loadAll(); }, [provider.id]);

    const loadAll = async () => {
        setLoading(true);
        await Promise.allSettled([loadServiceProducts(), loadSpecializations(), loadLoanProducts(), loadInsuranceProducts(), loadEvents(), loadShopProducts()]);
        setLoading(false);
    };

    const loadServiceProducts = async () => { try { const r = await providerService.getServiceProducts({ provider_id: provider.id }); setServiceProducts(r.results || r || []); } catch (e) {} };
    const loadSpecializations = async () => { try { const r = await api.get(`/api/v1/specializations/specializations/?provider=${provider.id}`); setSpecializations(r.data?.results || r.data || []); } catch (e) {} };
    const loadLoanProducts = async () => { try { const r = await api.get(`/api/v1/payments/provider-registrations/${provider.id}/my_loan_products/`); setLoanProducts(r.data || []); } catch (e) { setLoanProducts([]); } };
    const loadInsuranceProducts = async () => { try { const r = await api.get(`/api/v1/payments/insurance-products/?provider_registration=${provider.id}`); setInsuranceProducts(r.data?.results || r.data || []); } catch (e) {} };
    const loadEvents = async () => { try { const r = await api.get(`/api/v1/events/events/`); const all = r.data?.results || r.data || []; setEvents(all.filter(e => e.creator_id === provider.user || e.organiser_id === provider.user)); } catch (e) {} };
    const loadShopProducts = async () => { try { const r = await api.get(`/api/v1/payments/products/`); setShopProducts(r.data?.results || r.data || []); } catch (e) {} };

    const handleNewProduct = (action) => {
        setShowNewProductModal(false);
        if (TYPE_TO_SERVICE_TYPE[action]) {
            setServiceForm({ ...emptyServiceForm, service_type: TYPE_TO_SERVICE_TYPE[action] });
            setEditingProduct(null); setShowServiceModal(true); return;
        }
        switch (action) {
            case 'createCourse': navigate('/specializations/create?type=course'); break;
            case 'createMasterclass': navigate('/specializations/create?type=masterclass'); break;
            case 'createStack': navigate('/specializations/stacks/create'); break;
            case 'createLoan': setLoanForm(emptyLoanForm); setShowLoanModal(true); break;
            case 'createInsurance': setInsuranceForm(emptyInsuranceForm); setShowInsuranceModal(true); break;
            case 'createEvent': navigate('/events/create'); break;
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError(null);
        try {
            const payload = { ...serviceForm, provider: provider.id };
            if (editingProduct) await providerService.updateServiceProduct(editingProduct.id, payload);
            else await providerService.createServiceProduct(payload);
            setShowServiceModal(false); setEditingProduct(null); loadAll();
        } catch (err) { setError(err.response?.data?.error || 'Failed to save.'); }
        finally { setSubmitting(false); }
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError(null);
        try { await api.post('/api/v1/payments/loan-products/', { ...loanForm, provider_registration: provider.id }); setShowLoanModal(false); loadAll(); }
        catch (err) { setError(err.response?.data?.error || 'Failed to create loan.'); }
        finally { setSubmitting(false); }
    };

    const handleInsuranceSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError(null);
        try { await api.post('/api/v1/payments/insurance-products/', { ...insuranceForm, provider_registration: provider.id, provider: provider.business_name }); setShowInsuranceModal(false); loadAll(); }
        catch (err) { setError(err.response?.data?.error || 'Failed to create insurance.'); }
        finally { setSubmitting(false); }
    };

    const handleActivate = async (id) => { await providerService.activateProduct(id); loadAll(); };
    const handleSuspend = async (id) => { await providerService.suspendProduct(id); loadAll(); };

    const allItems = (() => {
        const items = [];
        serviceProducts.forEach(p => items.push({ ...p, _type: 'service' }));
        specializations.filter(s => s.learning_type === 'course').forEach(s => items.push({ ...s, _type: 'course' }));
        specializations.filter(s => s.learning_type === 'masterclass').forEach(s => items.push({ ...s, _type: 'masterclass' }));
        specializations.filter(s => s.learning_type === 'specialization').forEach(s => items.push({ ...s, _type: 'specialization' }));
        stacks.forEach(s => items.push({ ...s, _type: 'stack' }));
        loanProducts.forEach(l => items.push({ ...l, _type: 'loan' }));
        insuranceProducts.forEach(i => items.push({ ...i, _type: 'insurance' }));
        events.forEach(e => items.push({ ...e, _type: 'event' }));
        shopProducts.forEach(p => items.push({ ...p, _type: 'shop' }));
        return items;
    })();

    const filteredItems = allItems.filter(item => {
        const ms = !search || (item.name || item.title || '').toLowerCase().includes(search.toLowerCase());
        const mt = activeSubTab === 'all' || item._type === activeSubTab
            || (activeSubTab === 'courses' && item._type === 'course')
            || (activeSubTab === 'masterclasses' && item._type === 'masterclass')
            || (activeSubTab === 'stacks' && item._type === 'stack')
            || (activeSubTab === 'shop' && item._type === 'shop');
        return ms && mt;
    });

    const getItemImage = (item) => {
        switch (item._type) { case 'course': case 'masterclass': case 'specialization': return item.image_url; case 'stack': return item.image_url; case 'service': return item.image_url || null; case 'shop': return item.image || item.image_url || null; default: return null; }
    };
    const getItemLabel = (item) => item._type === 'event' ? (item.name || item.title) : item.name;
    const getItemMeta = (item) => {
        switch (item._type) {
            case 'course': return `${item.is_paid ? formatMoneySimple(item.price) : 'Free'} · ${item.learning_type}`;
            case 'masterclass': return `${item.is_paid ? formatMoneySimple(item.price) : 'Free'} · Masterclass`;
            case 'specialization': return 'Specialization';
            case 'stack': return 'Learning Stack';
            case 'loan': return `${item.interest_rate}% · ${formatMoneySimple(item.min_amount)}–${formatMoneySimple(item.max_amount)}`;
            case 'insurance': return `${item.category?.replace(/_/g, ' ')} · ${item.premium_frequency} · ${formatMoneySimple(item.premium_amount)}`;
            case 'event': return item.event_date ? new Date(item.event_date).toLocaleDateString() : 'TBD';
            case 'shop': return `${formatMoneySimple(item.price || 0)} · ${item.is_active ? 'Active' : 'Inactive'}`;
            case 'service': { const st = (item.service_type || '').replace(/_/g, ' '); return `${st.charAt(0).toUpperCase() + st.slice(1)} · ${item.price_type}`; }
            default: return '';
        }
    };
    const getTypeBadge = (type) => PRODUCT_TYPES.find(t => t.id === type || (t.id === 'courses' && type === 'course') || (t.id === 'masterclasses' && type === 'masterclass') || (t.id === 'stacks' && type === 'stack') || (t.id === 'shop' && type === 'shop'));
    const getCardIcon = (item) => {
        switch (item._type) { case 'loan': return DollarSign; case 'insurance': return Shield; case 'event': return CalendarDays; case 'shop': return ShoppingBag; case 'course': case 'masterclass': case 'specialization': return BookOpen; case 'stack': return Layers; default: return Package; }
    };

    const getDetailRoute = (item) => {
        switch (item._type) {
            case 'course': case 'masterclass': case 'specialization': return `/provider/products/specialization/${item.id}`;
            case 'stack': return `/provider/products/specialization/${item.specialization || item.specialization_id}?module=${item.id}`;
            case 'event': return `/events/edit/${item.id}`;
            case 'loan': return `/provider/products/loan/${item.id}`;
            case 'insurance': return `/provider/products/insurance/${item.id}`;
            case 'shop': return `/shop/item/${item.id}`;
            default: return null;
        }
    };

    const cardTypeLabel = (type) => {
        const t = PRODUCT_TYPES.find(t => t.id === type || (t.id === 'courses' && type === 'course') || (t.id === 'masterclasses' && type === 'masterclass') || (t.id === 'stacks' && type === 'stack') || (t.id === 'shop' && type === 'shop'));
        return t?.label || 'Product';
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowNewProductModal(true)}>
                    <Plus size={16} className="mr-1.5" /> Create New Product
                </Button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {visibleTabs.map(tab => {
                    const Icon = tab.icon;
                    const count = (() => {
                        if (tab.id === 'all') return allItems.length;
                        if (tab.id === 'courses') return specializations.filter(s => s.learning_type === 'course').length;
                        if (tab.id === 'masterclasses') return specializations.filter(s => s.learning_type === 'masterclass').length;
                        if (tab.id === 'stacks') return stacks.length;
                        if (tab.id === 'loans') return loanProducts.length;
                        if (tab.id === 'insurance') return insuranceProducts.length;
                        if (tab.id === 'events') return events.length;
                        if (tab.id === 'shop') return shopProducts.length;
                        if (tab.id === 'investments') return 0;
                        if (tab.id === 'service') return serviceProducts.length;
                        return 0;
                    })();
                    return (
                        <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeSubTab === tab.id ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-secondary hover:bg-secondary/10'}`}>
                            <Icon size={14} /> {tab.label} <span className="text-[10px] opacity-60">({count})</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" /></div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <Package size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Products Found</h4>
                    <p className="text-sm text-secondary mb-6">{search ? 'Try adjusting your search.' : 'Create your first product to get started.'}</p>
                    {!search && <Button variant="primary" size="sm" onClick={() => setShowNewProductModal(true)}><Plus size={14} className="mr-1.5" /> Create Product</Button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredItems.map(item => {
                        const typeBadge = getTypeBadge(item._type);
                        const image = getItemImage(item);
                        const CardIcon = getCardIcon(item);
                        const route = getDetailRoute(item);
                        const key = `${item._type}-${item.id}`;
                        return (
                            <Card key={key} className={`border-theme hover:border-primary/30 transition-all group overflow-hidden ${route ? 'cursor-pointer hover:shadow-md' : ''}`} onClick={route ? () => navigate(route) : undefined}>
                                <CardBody className="p-0">
                                    <div className="relative h-36 bg-gradient-to-br from-secondary/5 to-secondary/10 flex items-center justify-center">
                                        {image && !imgErrors.has(key) ? (
                                            <img src={image} alt={getItemLabel(item)} className="w-full h-full object-cover" onError={() => setImgErrors(prev => new Set([...prev, key]))} />
                                        ) : (
                                            <CardIcon size={40} className="text-secondary/30" />
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {typeBadge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${typeBadge.badge}`}>{typeBadge.label}</span>}
                                        </div>
                                        {item._type === 'service' && item.is_active === false && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full">Inactive</span></div>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-primary text-sm truncate">{getItemLabel(item)}</h5>
                                                <p className="text-[11px] sm:text-xs text-secondary mt-0.5">{getItemMeta(item)}</p>
                                                {item.description && <p className="text-[10px] text-tertiary line-clamp-2 mt-1">{item.description}</p>}
                                            </div>
                                            {item._type === 'service' && (
                                                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)} className="p-1 rounded-lg hover:bg-secondary/10 text-secondary"><MoreVertical size={14} /></button>
                                                    {openMenu === item.id && (
                                                        <div className="absolute right-0 top-8 z-20 w-40 bg-elevated border border-theme rounded-xl shadow-xl py-1">
                                                            <button onClick={() => { setEditingProduct(item); setServiceForm({ ...item }); setShowServiceModal(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2"><Edit2 size={14} /> Edit</button>
                                                            {item.is_active ? (
                                                                <button onClick={() => { handleSuspend(item.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"><PowerOff size={14} /> Suspend</button>
                                                            ) : (
                                                                <button onClick={() => { handleActivate(item.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"><Power size={14} /> Activate</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {showNewProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewProductModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between"><div><h3 className="text-lg font-bold text-primary">Create New Product</h3><p className="text-xs text-secondary mt-0.5">Select the type of product you want to create</p></div><button onClick={() => setShowNewProductModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button></div>
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {NEW_PRODUCT_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => handleNewProduct(opt.action)} className="p-3 sm:p-4 rounded-xl border-2 border-theme hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center mb-2 sm:mb-3`}><opt.icon size={16} className="text-white sm:size-20" /></div>
                                    <h4 className="font-bold text-primary text-xs sm:text-sm group-hover:text-primary-600">{opt.label}</h4>
                                    <p className="text-[10px] sm:text-xs text-secondary mt-0.5">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showServiceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowServiceModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-theme"><h3 className="font-bold text-primary">{editingProduct ? 'Edit' : 'Create'} {cardTypeLabel('service')}</h3><button onClick={() => { setShowServiceModal(false); setEditingProduct(null); }} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button></div>
                        <form onSubmit={handleServiceSubmit} className="p-5 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>}
                            <div><label className="block text-sm font-medium text-primary mb-1">Name *</label><input type="text" required value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Type</label><input type="text" value={serviceForm.service_type?.replace(/_/g, ' ')} disabled className="w-full rounded-xl border border-theme bg-secondary/30 px-3 py-2.5 text-sm cursor-not-allowed" /></div><div><label className="block text-sm font-medium text-primary mb-1">Price Type</label><select value={serviceForm.price_type} onChange={e => setServiceForm({...serviceForm, price_type: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm"><option value="fixed">Fixed</option><option value="variable">Variable</option><option value="percentage">Percentage</option><option value="free">Free</option></select></div></div>
                            <div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Price</label><input type="number" step="0.01" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Commission %</label><input type="number" step="0.01" value={serviceForm.commission_rate} onChange={e => setServiceForm({...serviceForm, commission_rate: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Fee</label><input type="number" step="0.01" value={serviceForm.processing_fee} onChange={e => setServiceForm({...serviceForm, processing_fee: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => { setShowServiceModal(false); setEditingProduct(null); }}>Cancel</Button><Button variant="primary" type="submit" isLoading={submitting}>{editingProduct ? 'Update' : 'Create'}</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {showLoanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLoanModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-theme"><h3 className="font-bold text-primary">Create Loan Product</h3><button onClick={() => setShowLoanModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button></div>
                        <form onSubmit={handleLoanSubmit} className="p-5 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>}
                            <div><label className="block text-sm font-medium text-primary mb-1">Name *</label><input type="text" required value={loanForm.name} onChange={e => setLoanForm({...loanForm, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" placeholder="e.g. Small Business Loan" /></div>
                            <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={loanForm.description} onChange={e => setLoanForm({...loanForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Interest Rate % *</label><input type="number" step="0.01" required value={loanForm.interest_rate} onChange={e => setLoanForm({...loanForm, interest_rate: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Processing Fee %</label><input type="number" step="0.01" value={loanForm.processing_fee} onChange={e => setLoanForm({...loanForm, processing_fee: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Min Amount</label><input type="number" step="0.01" value={loanForm.min_amount} onChange={e => setLoanForm({...loanForm, min_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Max Amount</label><input type="number" step="0.01" value={loanForm.max_amount} onChange={e => setLoanForm({...loanForm, max_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Min Tenure</label><input type="number" value={loanForm.min_tenure_months} onChange={e => setLoanForm({...loanForm, min_tenure_months: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Max Tenure</label><input type="number" value={loanForm.max_tenure_months} onChange={e => setLoanForm({...loanForm, max_tenure_months: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => setShowLoanModal(false)}>Cancel</Button><Button variant="primary" type="submit" isLoading={submitting}>Create Loan</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {showInsuranceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInsuranceModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-theme"><h3 className="font-bold text-primary">Create Insurance Product</h3><button onClick={() => setShowInsuranceModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button></div>
                        <form onSubmit={handleInsuranceSubmit} className="p-5 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>}
                            <div><label className="block text-sm font-medium text-primary mb-1">Name *</label><input type="text" required value={insuranceForm.name} onChange={e => setInsuranceForm({...insuranceForm, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" placeholder="e.g. Health Shield" /></div>
                            <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={insuranceForm.description} onChange={e => setInsuranceForm({...insuranceForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Category</label><select value={insuranceForm.category} onChange={e => setInsuranceForm({...insuranceForm, category: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm"><option value="health">Health</option><option value="device">Device</option><option value="travel">Travel</option><option value="business">Business</option><option value="asset">Asset</option><option value="education">Education</option><option value="funeral">Funeral</option><option value="crop">Crop</option></select></div><div><label className="block text-sm font-medium text-primary mb-1">Frequency</label><select value={insuranceForm.premium_frequency} onChange={e => setInsuranceForm({...insuranceForm, premium_frequency: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="one_time">One-Time</option></select></div></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Premium *</label><input type="number" step="0.01" required value={insuranceForm.premium_amount} onChange={e => setInsuranceForm({...insuranceForm, premium_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Coverage</label><input type="number" step="0.01" value={insuranceForm.coverage_amount} onChange={e => setInsuranceForm({...insuranceForm, coverage_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Deductible</label><input type="number" step="0.01" value={insuranceForm.deductible} onChange={e => setInsuranceForm({...insuranceForm, deductible: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Waiting (days)</label><input type="number" value={insuranceForm.waiting_period_days} onChange={e => setInsuranceForm({...insuranceForm, waiting_period_days: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => setShowInsuranceModal(false)}>Cancel</Button><Button variant="primary" type="submit" isLoading={submitting}>Create Product</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsTab;
