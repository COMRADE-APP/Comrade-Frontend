import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, MoreVertical, Power, PowerOff, Edit2, Trash2, X, Tag, DollarSign, Layers } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const SERVICE_TYPES = [
    { value: 'bill_payment', label: 'Bill Payment' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'loan', label: 'Loan' },
    { value: 'savings', label: 'Savings' },
    { value: 'investment', label: 'Investment' },
    { value: 'utility', label: 'Utility' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'membership', label: 'Membership' },
];

const PRICE_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'variable', label: 'Variable' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'free', label: 'Free' },
];

const PRODUCT_STATUS_COLORS = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    pending_approval: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const emptyForm = {
    name: '', description: '', service_type: 'bill_payment', category: 'other',
    price: '', price_type: 'fixed', commission_rate: '', processing_fee: '',
    min_amount: '', max_amount: '', terms_conditions: '', auto_link_kitty: true,
    is_featured: false,
};

const ProductsTab = ({ provider, onRefresh }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

    useEffect(() => {
        loadProducts();
    }, [provider.id]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await providerService.getServiceProducts({ provider_id: provider.id });
            setProducts(res.results || res || []);
        } catch (e) {
            console.error('Failed to load products:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const payload = { ...form, provider: provider.id };
            if (editingProduct) {
                await providerService.updateServiceProduct(editingProduct.id, payload);
            } else {
                await providerService.createServiceProduct(payload);
            }
            setShowModal(false);
            setEditingProduct(null);
            setForm(emptyForm);
            loadProducts();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async (productId) => {
        await providerService.activateProduct(productId);
        loadProducts();
    };

    const handleSuspend = async (productId) => {
        await providerService.suspendProduct(productId);
        loadProducts();
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        await providerService.deleteProduct(productId);
        loadProducts();
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setForm({
            name: product.name || '',
            description: product.description || '',
            service_type: product.service_type || 'bill_payment',
            category: product.category || 'other',
            price: product.price || '',
            price_type: product.price_type || 'fixed',
            commission_rate: product.commission_rate || '',
            processing_fee: product.processing_fee || '',
            min_amount: product.min_amount || '',
            max_amount: product.max_amount || '',
            terms_conditions: product.terms_conditions || '',
            auto_link_kitty: product.auto_link_kitty ?? true,
            is_featured: product.is_featured ?? false,
        });
        setShowModal(true);
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchType = !filterType || p.service_type === filterType;
        return matchSearch && matchType;
    });

    // Group products by service_type for visual bundling
    const groupedProducts = filteredProducts.reduce((acc, p) => {
        const key = p.service_type || 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center flex-1 min-w-0">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Types</option>
                        {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <Button variant="primary" onClick={() => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); }}>
                    <Plus size={16} className="mr-1.5" /> New Product
                </Button>
            </div>

            {/* Products */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-theme">
                            <CardBody className="p-5 space-y-3">
                                <div className="w-full h-5 rounded bg-secondary/10 skeleton-shimmer" />
                                <div className="w-3/4 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                                <div className="w-1/2 h-6 rounded bg-secondary/10 skeleton-shimmer" />
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <Card className="border-theme">
                    <CardBody className="p-12 text-center">
                        <Package size={48} className="text-primary/15 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">No Products Yet</h3>
                        <p className="text-secondary text-sm mb-6">Create your first service product to start offering services to customers.</p>
                        <Button variant="primary" onClick={() => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); }}>
                            <Plus size={16} className="mr-1.5" /> Create Product
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                Object.entries(groupedProducts).map(([type, items]) => (
                    <div key={type} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-secondary" />
                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                                {SERVICE_TYPES.find(t => t.value === type)?.label || type} ({items.length})
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(product => (
                                <Card key={product.id} className="border-theme hover:shadow-md transition-shadow duration-200 relative group">
                                    <CardBody className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-2xl">{product.icon || '📦'}</span>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-primary text-sm truncate">{product.name}</h4>
                                                    <p className="text-xs text-secondary capitalize">{product.service_type_display || product.service_type?.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                                                    className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openMenu === product.id && (
                                                    <div className="absolute right-0 top-8 z-20 w-44 bg-elevated border border-theme rounded-xl shadow-xl py-1 animate-fadeIn">
                                                        <button onClick={() => { openEdit(product); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2">
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        {product.status !== 'active' ? (
                                                            <button onClick={() => { handleActivate(product.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-2">
                                                                <Power size={14} /> Activate
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => { handleSuspend(product.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2">
                                                                <PowerOff size={14} /> Suspend
                                                            </button>
                                                        )}
                                                        <button onClick={() => { handleDelete(product.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-secondary line-clamp-2 mb-4 min-h-[32px]">{product.description || 'No description'}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-emerald-600" />
                                                <span className="text-sm font-bold text-primary">
                                                    {product.price_type === 'free' ? 'Free' : formatMoneySimple(product.price || 0)}
                                                </span>
                                                {product.price_type !== 'fixed' && product.price_type !== 'free' && (
                                                    <span className="text-xs text-secondary">({product.price_type})</span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRODUCT_STATUS_COLORS[product.status] || PRODUCT_STATUS_COLORS.draft}`}>
                                                {product.status_display || product.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        {product.is_featured && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                                                <Tag size={12} /> Featured
                                            </div>
                                        )}

                                        {product.linked_kitty_name && (
                                            <div className="mt-2 text-xs text-secondary">
                                                Kitty: <span className="font-semibold text-primary">{product.linked_kitty_name}</span>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-elevated border-b border-theme p-5 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold text-primary">{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-5">
                            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Product Name *</label>
                                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Service Type</label>
                                    <select value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Price</label>
                                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Price Type</label>
                                    <select value={form.price_type} onChange={e => setForm({...form, price_type: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        {PRICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Processing Fee</label>
                                    <input type="number" step="0.01" value={form.processing_fee} onChange={e => setForm({...form, processing_fee: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Min Amount</label>
                                    <input type="number" step="0.01" value={form.min_amount} onChange={e => setForm({...form, min_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Max Amount</label>
                                    <input type="number" step="0.01" value={form.max_amount} onChange={e => setForm({...form, max_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Terms & Conditions</label>
                                <textarea rows={2} value={form.terms_conditions} onChange={e => setForm({...form, terms_conditions: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.auto_link_kitty} onChange={e => setForm({...form, auto_link_kitty: e.target.checked})} className="w-4 h-4 rounded border-theme text-primary focus:ring-primary" />
                                    <span className="text-sm font-medium text-primary">Auto-link to Operations Kitty</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="w-4 h-4 rounded border-theme text-primary focus:ring-primary" />
                                    <span className="text-sm font-medium text-primary">Featured Product</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsTab;
