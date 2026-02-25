import React, { useState, useEffect } from 'react';
import { paymentProcessingService } from '../../services/paymentProcessing.service';
import { CreditCard, Smartphone, Mail, Building2, Wallet, ChevronDown, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const METHOD_ICONS = {
    card: CreditCard,
    mpesa: Smartphone,
    paypal: Mail,
    bank_transfer: Building2,
    equity: Building2,
    comrade_balance: Wallet,
};

const METHOD_COLORS = {
    card: 'from-blue-500 to-indigo-600',
    mpesa: 'from-green-500 to-emerald-600',
    paypal: 'from-sky-400 to-blue-600',
    bank_transfer: 'from-amber-500 to-orange-600',
    equity: 'from-red-500 to-rose-600',
    comrade_balance: 'from-purple-500 to-violet-600',
};

const getMethodLabel = (method) => {
    if (method.id === 'comrade_balance') return 'Qomrade Balance';
    if (method.method_type === 'card') {
        return `${method.card_brand || 'Card'} ••••${method.last_four || ''}`;
    }
    if (method.method_type === 'mpesa') {
        return `M-Pesa ${method.phone_number || ''}`;
    }
    if (method.method_type === 'paypal') {
        return `PayPal ${method.paypal_email || ''}`;
    }
    if (method.method_type === 'bank_transfer' || method.method_type === 'equity') {
        return `${method.bank_name || 'Bank'} ••••${method.bank_account_last_four || ''}`;
    }
    return method.nickname || method.method_type;
};

/**
 * Reusable payment method selector.
 * Fetches saved methods, pre-selects default, emits onChange.
 *
 * @param {Object}   props
 * @param {Function} props.onChange          - (selectedMethod) => void
 * @param {string}   [props.value]           - controlled value (method id or type string)
 * @param {boolean}  [props.showBalance]     - include "Qomrade Balance" option (default true)
 * @param {boolean}  [props.hideUnsupported] - hide types not relevant (e.g. hide balance for deposits)
 * @param {string}   [props.balanceAmount]   - display balance amount
 * @param {string}   [props.transactionType] - 'deposit' | 'withdraw' | 'send' | 'purchase'
 */
const PaymentMethodSelector = ({
    onChange,
    value,
    showBalance = true,
    balanceAmount,
    transactionType = 'purchase',
}) => {
    const navigate = useNavigate();
    const [savedMethods, setSavedMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(value || null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        try {
            const data = await paymentProcessingService.getSavedMethods();
            const list = Array.isArray(data) ? data : data?.results || [];
            setSavedMethods(list);

            // Build options and auto-select default
            const defaultMethod = list.find(m => m.is_default);
            if (!value) {
                if (defaultMethod) {
                    setSelected(String(defaultMethod.id));
                    onChange?.({ ...defaultMethod, source: 'saved' });
                } else if (showBalance) {
                    setSelected('comrade_balance');
                    onChange?.({ id: 'comrade_balance', method_type: 'comrade_balance', source: 'balance' });
                } else if (list.length > 0) {
                    setSelected(String(list[0].id));
                    onChange?.({ ...list[0], source: 'saved' });
                }
            }
        } catch (err) {
            console.error('Failed to load payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (method) => {
        const id = method.id === 'comrade_balance' ? 'comrade_balance' : String(method.id);
        setSelected(id);
        setExpanded(false);
        if (method.id === 'comrade_balance') {
            onChange?.({ id: 'comrade_balance', method_type: 'comrade_balance', source: 'balance' });
        } else {
            onChange?.({ ...method, source: 'saved' });
        }
    };

    // Build options list
    const allOptions = [];

    if (showBalance && transactionType !== 'deposit') {
        allOptions.push({
            id: 'comrade_balance',
            method_type: 'comrade_balance',
            nickname: 'Qomrade Balance',
            is_default: false,
            _isBalance: true,
        });
    }

    savedMethods.forEach(m => allOptions.push(m));

    // Fallback generic options if no saved methods
    const genericOptions = [
        { id: 'generic_mpesa', method_type: 'mpesa', nickname: 'M-Pesa', _isGeneric: true },
        { id: 'generic_card', method_type: 'card', nickname: 'Credit / Debit Card', _isGeneric: true },
        { id: 'generic_paypal', method_type: 'paypal', nickname: 'PayPal', _isGeneric: true },
        { id: 'generic_bank', method_type: 'bank_transfer', nickname: 'Bank Transfer', _isGeneric: true },
    ];

    if (savedMethods.length === 0 && !loading) {
        genericOptions.forEach(g => allOptions.push(g));
    }

    const selectedOption = allOptions.find(o => String(o.id) === selected) || allOptions[0];

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-secondary">Payment Method</label>
                <div className="animate-pulse h-16 rounded-2xl bg-elevated border border-theme" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-secondary">Payment Method</label>

            {/* Selected method display / toggle */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left"
            >
                <MethodIcon method={selectedOption} />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm truncate">
                        {getMethodLabel(selectedOption)}
                        {selectedOption?.is_default && (
                            <span className="ml-2 text-xs text-amber-500 font-medium">★ Default</span>
                        )}
                    </p>
                    {selectedOption?._isBalance && balanceAmount !== undefined && (
                        <p className="text-xs text-secondary">Available: ${balanceAmount}</p>
                    )}
                    {selectedOption?.nickname && !selectedOption?._isBalance && !selectedOption?._isGeneric && (
                        <p className="text-xs text-secondary truncate">{selectedOption.nickname}</p>
                    )}
                </div>
                <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded options list */}
            {expanded && (
                <div className="mt-1 rounded-2xl border border-theme bg-elevated shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {allOptions.map((method) => {
                        const isSelected = String(method.id) === selected;
                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => handleSelect(method)}
                                className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors border-b border-theme last:border-0 ${isSelected
                                        ? 'bg-purple-500/10'
                                        : 'hover:bg-secondary/5'
                                    }`}
                            >
                                <MethodIcon method={method} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-primary'}`}>
                                        {getMethodLabel(method)}
                                    </p>
                                    {method._isBalance && balanceAmount !== undefined && (
                                        <p className="text-xs text-secondary">Available: ${balanceAmount}</p>
                                    )}
                                </div>
                                {method.is_default && (
                                    <Star className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" />
                                )}
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {/* Add new method link */}
                    <button
                        type="button"
                        onClick={() => navigate('/payment-methods')}
                        className="w-full flex items-center gap-3 p-3.5 text-left text-purple-600 dark:text-purple-400 hover:bg-purple-500/5 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-xl border-2 border-dashed border-purple-400/50 flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Add New Payment Method</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const MethodIcon = ({ method, size = 'md' }) => {
    const Icon = METHOD_ICONS[method?.method_type] || CreditCard;
    const gradient = METHOD_COLORS[method?.method_type] || 'from-gray-500 to-gray-600';
    const sz = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
    const iconSz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div className={`${sz} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon className={`${iconSz} text-white`} />
        </div>
    );
};

export default PaymentMethodSelector;
