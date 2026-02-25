import React, { useState, useEffect } from 'react';
import { paymentProcessingService } from '../services/paymentProcessing.service';
import { CreditCard, Smartphone, Mail, Building2, Edit2, Trash2, Star, X, Save, Loader2, Plus, Shield } from 'lucide-react';

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // New method form
    const [newMethod, setNewMethod] = useState({
        method_type: 'card',
        nickname: '',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvc: '',
        billing_zip: '',
        phone_number: '',
        paypal_email: '',
        account_number: '',
        bank_name: '',
        is_default: false,
    });

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    // Auto-dismiss success message
    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const data = await paymentProcessingService.getSavedMethods();
            setPaymentMethods(Array.isArray(data) ? data : data?.results || []);
        } catch (err) {
            console.error('Error fetching payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (methodId) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return;
        try {
            await paymentProcessingService.deletePaymentMethod(methodId);
            setSuccessMsg('Payment method removed.');
            fetchPaymentMethods();
        } catch (err) {
            setError('Failed to remove payment method.');
        }
    };

    const handleSetDefault = async (methodId) => {
        try {
            await paymentProcessingService.setDefaultMethod(methodId);
            setSuccessMsg('Default payment method updated.');
            fetchPaymentMethods();
        } catch (err) {
            setError('Failed to set default.');
        }
    };

    // ── Edit ──────────────────────────────────────────────────

    const openEditModal = (method) => {
        setEditingMethod(method);
        setEditForm({
            nickname: method.nickname || '',
            phone_number: method.phone_number || '',
            paypal_email: method.paypal_email || '',
            billing_zip: method.billing_zip || '',
            bank_name: method.bank_name || '',
            is_default: method.is_default || false,
        });
        setError('');
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleEditSave = async () => {
        if (!editingMethod) return;
        setSaving(true);
        setError('');
        try {
            await paymentProcessingService.updatePaymentMethod(editingMethod.id, editForm);
            setSuccessMsg('Payment method updated successfully.');
            setEditingMethod(null);
            fetchPaymentMethods();
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to update payment method.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Add ───────────────────────────────────────────────────

    const handleNewMethodChange = (field, value) => {
        setNewMethod(prev => ({ ...prev, [field]: value }));
    };

    const handleAddSave = async () => {
        setSaving(true);
        setError('');
        try {
            // Only send fields relevant to the selected payment type
            const payload = {
                method_type: newMethod.method_type,
                nickname: newMethod.nickname || undefined,
                is_default: newMethod.is_default,
            };

            switch (newMethod.method_type) {
                case 'card':
                    payload.card_number = newMethod.card_number;
                    payload.expiry_month = newMethod.expiry_month ? parseInt(newMethod.expiry_month) : undefined;
                    payload.expiry_year = newMethod.expiry_year ? parseInt(newMethod.expiry_year) : undefined;
                    payload.cvc = newMethod.cvc;
                    if (newMethod.billing_zip) payload.billing_zip = newMethod.billing_zip;
                    break;
                case 'mpesa':
                    payload.phone_number = newMethod.phone_number;
                    break;
                case 'paypal':
                    payload.paypal_email = newMethod.paypal_email;
                    break;
                case 'bank_transfer':
                case 'equity':
                    payload.account_number = newMethod.account_number;
                    if (newMethod.bank_name) payload.bank_name = newMethod.bank_name;
                    break;
            }

            // Remove undefined values
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            await paymentProcessingService.savePaymentMethod(payload);
            setSuccessMsg('Payment method added!');
            setShowAddModal(false);
            setNewMethod({ method_type: 'card', nickname: '', card_number: '', expiry_month: '', expiry_year: '', cvc: '', billing_zip: '', phone_number: '', paypal_email: '', account_number: '', bank_name: '', is_default: false });
            fetchPaymentMethods();
        } catch (err) {
            const errData = err?.response?.data;
            let msg = 'Failed to add payment method.';
            if (errData) {
                if (typeof errData === 'string') msg = errData;
                else if (errData.detail) msg = errData.detail;
                else if (errData.error) msg = errData.error;
                else {
                    // Format field-level errors nicely
                    const fieldErrors = Object.entries(errData)
                        .map(([field, errors]) => `${field.replace(/_/g, ' ')}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('\n');
                    msg = fieldErrors || JSON.stringify(errData);
                }
            }
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────

    const getMethodIcon = (type) => {
        const icons = {
            card: <CreditCard className="w-6 h-6" />,
            mpesa: <Smartphone className="w-6 h-6" />,
            paypal: <Mail className="w-6 h-6" />,
            bank_transfer: <Building2 className="w-6 h-6" />,
            equity: <Building2 className="w-6 h-6" />,
            bank: <Building2 className="w-6 h-6" />,
        };
        return icons[type] || <CreditCard className="w-6 h-6" />;
    };

    const getMethodLabel = (method) => {
        switch (method.method_type) {
            case 'card':
                return `${method.card_brand?.toUpperCase() || 'Card'} •••• ${method.last_four || method.card_last4 || '****'}`;
            case 'mpesa':
                return `M-Pesa ${method.phone_number || ''}`;
            case 'paypal':
                return `PayPal ${method.paypal_email || ''}`;
            case 'bank_transfer':
            case 'equity':
            case 'bank':
                return `${method.bank_name || 'Bank'} •••• ${method.bank_account_last_four || method.bank_last_four || '****'}`;
            default:
                return method.nickname || method.method_type;
        }
    };

    const getGradient = (type) => {
        const gradients = {
            card: 'from-indigo-500 to-purple-600',
            mpesa: 'from-green-500 to-emerald-600',
            paypal: 'from-blue-500 to-cyan-500',
            bank_transfer: 'from-amber-500 to-orange-600',
            equity: 'from-amber-500 to-orange-600',
            bank: 'from-amber-500 to-orange-600',
        };
        return gradients[type] || 'from-gray-500 to-gray-600';
    };

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Payment Methods</h1>
                        <p className="text-secondary text-sm mt-1">Manage your saved payment details for quick transactions</p>
                    </div>
                    <button
                        onClick={() => { setShowAddModal(true); setError(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-lg shadow-purple-500/20"
                    >
                        <Plus size={18} /> Add Method
                    </button>
                </div>

                {/* Security Badge */}
                <div className="bg-elevated rounded-xl border border-theme p-4 mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary">Bank-Level Security</p>
                        <p className="text-xs text-secondary">Your payment info is encrypted with AES-256-GCM. Card numbers are never stored.</p>
                    </div>
                </div>

                {/* Success/Error Banners */}
                {successMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                        ✓ {successMsg}
                    </div>
                )}
                {error && !editingMethod && !showAddModal && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        ✗ {error}
                    </div>
                )}

                {/* Payment Methods List */}
                {loading ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
                        <p className="mt-4 text-secondary text-sm">Loading payment methods…</p>
                    </div>
                ) : paymentMethods.length === 0 ? (
                    <div className="bg-elevated rounded-2xl border border-theme p-12 text-center">
                        <CreditCard className="w-16 h-16 text-tertiary mx-auto mb-4 opacity-40" />
                        <h3 className="font-semibold text-primary text-lg mb-2">No payment methods yet</h3>
                        <p className="text-secondary text-sm mb-6">Add a card, M-Pesa, PayPal, or bank account to get started.</p>
                        <button
                            onClick={() => { setShowAddModal(true); setError(''); }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition font-medium"
                        >
                            Add Your First Payment Method
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                className={`bg-elevated rounded-2xl border transition-all hover:shadow-lg ${method.is_default ? 'border-purple-500/40 ring-1 ring-purple-500/20' : 'border-theme'}`}
                            >
                                <div className="p-5 flex items-center justify-between gap-4">
                                    {/* Icon + Info */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(method.method_type)} flex items-center justify-center text-white flex-shrink-0`}>
                                            {getMethodIcon(method.method_type)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-primary truncate">{getMethodLabel(method)}</p>
                                                {method.is_default && (
                                                    <span className="text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-secondary mt-0.5 truncate">
                                                {method.nickname || (method.method_type === 'card' ? 'Credit/Debit Card' : method.method_type)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!method.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(method.id)}
                                                title="Set as default"
                                                className="p-2 text-secondary hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition"
                                            >
                                                <Star size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEditModal(method)}
                                            title="Edit"
                                            className="p-2 text-secondary hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            title="Delete"
                                            className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Edit Modal ─────────────────────────────────────── */}
            {editingMethod && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-2xl border border-theme shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary">Edit Payment Method</h2>
                            <button onClick={() => setEditingMethod(null)} className="p-1 text-secondary hover:text-primary rounded-lg hover:bg-secondary/10">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Nickname — always editable */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Nickname</label>
                                <input
                                    type="text"
                                    value={editForm.nickname}
                                    onChange={(e) => handleEditChange('nickname', e.target.value)}
                                    placeholder="e.g. Personal Card, Work PayPal"
                                    className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>

                            {/* Per-method editable fields */}
                            {editingMethod.method_type === 'mpesa' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone_number}
                                        onChange={(e) => handleEditChange('phone_number', e.target.value)}
                                        placeholder="254712345678"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            )}

                            {editingMethod.method_type === 'paypal' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">PayPal Email</label>
                                    <input
                                        type="email"
                                        value={editForm.paypal_email}
                                        onChange={(e) => handleEditChange('paypal_email', e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            )}

                            {editingMethod.method_type === 'card' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Billing Zip Code</label>
                                    <input
                                        type="text"
                                        value={editForm.billing_zip}
                                        onChange={(e) => handleEditChange('billing_zip', e.target.value)}
                                        placeholder="00100"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <p className="text-xs text-tertiary mt-1">Card number and expiry cannot be changed. Remove and re-add if needed.</p>
                                </div>
                            )}

                            {(editingMethod.method_type === 'bank_transfer' || editingMethod.method_type === 'equity' || editingMethod.method_type === 'bank') && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={editForm.bank_name}
                                        onChange={(e) => handleEditChange('bank_name', e.target.value)}
                                        placeholder="e.g. Equity Bank"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            )}

                            {/* Default toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_default}
                                    onChange={(e) => handleEditChange('is_default', e.target.checked)}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-primary">Set as default payment method</span>
                            </label>
                        </div>

                        <div className="p-5 border-t border-theme flex justify-end gap-3">
                            <button
                                onClick={() => setEditingMethod(null)}
                                className="px-4 py-2 text-sm text-secondary border border-theme rounded-xl hover:bg-secondary/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Modal ──────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-2xl border border-theme shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-theme flex items-center justify-between sticky top-0 bg-elevated z-10">
                            <h2 className="text-lg font-bold text-primary">Add Payment Method</h2>
                            <button onClick={() => { setShowAddModal(false); setError(''); }} className="p-1 text-secondary hover:text-primary rounded-lg hover:bg-secondary/10">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Method Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Payment Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'card', label: 'Card', icon: <CreditCard size={16} /> },
                                        { value: 'mpesa', label: 'M-Pesa', icon: <Smartphone size={16} /> },
                                        { value: 'paypal', label: 'PayPal', icon: <Mail size={16} /> },
                                        { value: 'bank_transfer', label: 'Bank', icon: <Building2 size={16} /> },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleNewMethodChange('method_type', opt.value)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${newMethod.method_type === opt.value
                                                ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                                : 'border-theme text-secondary hover:border-purple-300'
                                                }`}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nickname */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Nickname (optional)</label>
                                <input
                                    type="text"
                                    value={newMethod.nickname}
                                    onChange={(e) => handleNewMethodChange('nickname', e.target.value)}
                                    placeholder="e.g. Personal Visa"
                                    className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>

                            {/* Card fields */}
                            {newMethod.method_type === 'card' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            value={newMethod.card_number}
                                            onChange={(e) => handleNewMethodChange('card_number', e.target.value.replace(/[^\d\s]/g, ''))}
                                            placeholder="4242 4242 4242 4242"
                                            maxLength={19}
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary mb-1">Month</label>
                                            <input
                                                type="text"
                                                value={newMethod.expiry_month}
                                                onChange={(e) => handleNewMethodChange('expiry_month', e.target.value)}
                                                placeholder="MM"
                                                maxLength={2}
                                                className="w-full px-3 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary mb-1">Year</label>
                                            <input
                                                type="text"
                                                value={newMethod.expiry_year}
                                                onChange={(e) => handleNewMethodChange('expiry_year', e.target.value)}
                                                placeholder="YY"
                                                maxLength={4}
                                                className="w-full px-3 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary mb-1">CVC</label>
                                            <input
                                                type="text"
                                                value={newMethod.cvc}
                                                onChange={(e) => handleNewMethodChange('cvc', e.target.value)}
                                                placeholder="123"
                                                maxLength={4}
                                                className="w-full px-3 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm text-center"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Billing Zip</label>
                                        <input
                                            type="text"
                                            value={newMethod.billing_zip}
                                            onChange={(e) => handleNewMethodChange('billing_zip', e.target.value)}
                                            placeholder="00100"
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {/* M-Pesa fields */}
                            {newMethod.method_type === 'mpesa' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newMethod.phone_number}
                                        onChange={(e) => handleNewMethodChange('phone_number', e.target.value)}
                                        placeholder="254712345678"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                            )}

                            {/* PayPal fields */}
                            {newMethod.method_type === 'paypal' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">PayPal Email</label>
                                    <input
                                        type="email"
                                        value={newMethod.paypal_email}
                                        onChange={(e) => handleNewMethodChange('paypal_email', e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                </div>
                            )}

                            {/* Bank fields */}
                            {newMethod.method_type === 'bank_transfer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={newMethod.account_number}
                                            onChange={(e) => handleNewMethodChange('account_number', e.target.value)}
                                            placeholder="00123456789"
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={newMethod.bank_name}
                                            onChange={(e) => handleNewMethodChange('bank_name', e.target.value)}
                                            placeholder="Equity Bank"
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-primary text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Default toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newMethod.is_default}
                                    onChange={(e) => handleNewMethodChange('is_default', e.target.checked)}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-primary">Set as default</span>
                            </label>
                        </div>

                        <div className="p-5 border-t border-theme flex justify-end gap-3 sticky bottom-0 bg-elevated">
                            <button
                                onClick={() => { setShowAddModal(false); setError(''); }}
                                className="px-4 py-2 text-sm text-secondary border border-theme rounded-xl hover:bg-secondary/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {saving ? 'Saving…' : 'Add Method'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethods;
