import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PaymentMethodSelector from '../../components/payments/PaymentMethodSelector';
import paymentsService from '../../services/payments.service';
import { getCurrencySymbol } from '../../utils/currency';
import {
    ArrowLeft, ArrowDownCircle, ArrowUpCircle, Send, ShoppingBag,
    Shield, Info, Wallet, Search, CheckCircle, Loader, User
} from 'lucide-react';

const TRANSACTION_CONFIG = {
    deposit: {
        title: 'Deposit Funds',
        subtitle: 'Add money to your Qomrade Balance',
        icon: ArrowDownCircle,
        color: 'from-green-500 to-emerald-600',
        amountLabel: 'Amount to Deposit',
        showBalance: false,         // Don't show balance as source — they're adding TO balance
        confirmLabel: 'Confirm Deposit',
        successVerb: 'deposited',
    },
    withdraw: {
        title: 'Withdraw Funds',
        subtitle: 'Send money to your external account',
        icon: ArrowUpCircle,
        color: 'from-orange-500 to-amber-600',
        amountLabel: 'Amount to Withdraw',
        showBalance: false,         // Balance is the source, method is the destination
        confirmLabel: 'Confirm Withdrawal',
        successVerb: 'withdrawn',
    },
    send: {
        title: 'Send Money',
        subtitle: 'Transfer funds to another user',
        icon: Send,
        color: 'from-blue-500 to-indigo-600',
        amountLabel: 'Amount to Send',
        showBalance: true,
        confirmLabel: 'Confirm Transfer',
        successVerb: 'sent',
    },
    checkout: {
        title: 'Checkout',
        subtitle: 'Complete your purchase',
        icon: ShoppingBag,
        color: 'from-primary-600 to-primary-600',
        amountLabel: 'Amount',
        showBalance: true,
        confirmLabel: 'Confirm Purchase',
        successVerb: 'purchased',
    },
};

const TransactionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine type from URL path
    const pathSegment = location.pathname.split('/').pop(); // deposit, withdraw, send, checkout
    const type = TRANSACTION_CONFIG[pathSegment] ? pathSegment : 'deposit';
    const config = TRANSACTION_CONFIG[type];
    const Icon = config.icon;

    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [recipient, setRecipient] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // For send - user search
    const [recipientQuery, setRecipientQuery] = useState('');
    const [recipientSearchResults, setRecipientSearchResults] = useState([]);
    const [recipientSearchLoading, setRecipientSearchLoading] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const recipientSearchTimeoutRef = useRef(null);

    // For checkout, product info comes via location.state
    const product = location.state?.product || null;

    useEffect(() => {
        loadBalance();
        if (product) {
            setAmount(String(product.price));
        }
    }, []);

    const loadBalance = async () => {
        try {
            const data = await paymentsService.getBalance();
            const balance = data?.balance ?? data?.display_balance ?? data?.available_balance ?? '0.00';
            setBalance(typeof balance === 'number' ? String(balance) : balance);
        } catch {
            setBalance('0.00');
        } finally {
            setLoading(false);
        }
    };

    const handleMethodChange = (method) => {
        setSelectedMethod(method);
        // If saved M-Pesa, pre-fill phone
        if (method?.phone_number) {
            setPhoneNumber(method.phone_number);
        }
        // If saved bank, pre-fill account
        if (method?.bank_account_last_four) {
            setAccountNumber(`****${method.bank_account_last_four}`);
        }
    };

    const handleRecipientSearch = async (query) => {
        setRecipient(query);
        if (recipientSearchTimeoutRef.current) {
            clearTimeout(recipientSearchTimeoutRef.current);
        }
        if (!query || query.length < 2) {
            setRecipientSearchResults([]);
            return;
        }
        recipientSearchTimeoutRef.current = setTimeout(async () => {
            setRecipientSearchLoading(true);
            try {
                const results = await paymentsService.searchUsers(query);
                setRecipientSearchResults(Array.isArray(results) ? results : (results?.results || []));
            } catch (error) {
                console.error('User search error:', error);
                setRecipientSearchResults([]);
            } finally {
                setRecipientSearchLoading(false);
            }
        }, 300);
    };

    const selectRecipient = (user) => {
        setSelectedRecipient(user);
        setRecipient(user.email || String(user.id));
        setRecipientSearchResults([]);
    };

    const isFormValid = () => {
        if (!amount || parseFloat(amount) <= 0) return false;
        if (!selectedMethod) return false;
        if (type === 'send' && !recipient) return false;
        if (type === 'withdraw' && !accountNumber) return false;
        if (type === 'deposit' && selectedMethod?.method_type === 'mpesa' && !phoneNumber) return false;
        return true;
    };

    const handleReviewAndConfirm = () => {
        if (!isFormValid()) {
            setError('Please fill in all required fields.');
            return;
        }

        // Determine the method type/identifier to send to the backend
        let paymentMethod = selectedMethod?.method_type || 'comrade_balance';
        if (selectedMethod?.source === 'balance') paymentMethod = 'comrade_balance';

        // Only pass serializable config fields (no React component refs like icon)
        const serializableConfig = {
            title: config.title,
            confirmLabel: config.confirmLabel,
            successVerb: config.successVerb,
        };

        const transactionData = {
            type,
            amount: parseFloat(amount),
            paymentMethod,
            savedMethodId: selectedMethod?.source === 'saved' ? selectedMethod.id : null,
            selectedMethod,
            recipient,
            accountNumber,
            phoneNumber,
            notes,
            product,
            config: serializableConfig,
        };

        navigate('/payments/confirm', { state: { transactionData } });
    };

    const quickAmounts = type === 'checkout' ? [] : [100, 500, 1000, 5000, 10000];

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in fade-in">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-secondary hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </button>

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">{config.title}</h1>
                    <p className="text-secondary text-sm">{config.subtitle}</p>
                </div>
            </div>

            {/* Balance Info */}
            {balance !== null && (
                <Card>
                    <CardBody className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary-700" />
                        </div>
                        <div>
                            <p className="text-xs text-secondary">Qomrade Balance</p>
                            <p className="text-xl font-bold text-primary">${balance}</p>
                        </div>
                        {type === 'withdraw' && (
                            <p className="ml-auto text-xs text-secondary">
                                Max withdrawal: ${balance}
                            </p>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Product info for checkout */}
            {product && (
                <Card>
                    <CardBody className="p-4 flex items-center gap-4">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-elevated flex items-center justify-center border border-theme">
                                <ShoppingBag className="w-8 h-8 text-tertiary" />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold text-primary">{product.name}</h3>
                            <p className="text-sm text-secondary line-clamp-1">{product.description}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">${product.price}</p>
                    </CardBody>
                </Card>
            )}

            {/* Main Form */}
            <Card>
                <CardBody className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
                            <Info className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-secondary">{config.amountLabel} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-secondary">{getCurrencySymbol(user?.preferred_currency)}</span>
                            <input
                                type="number"
                                step="0.01"
                                min="1"
                                max={type === 'withdraw' ? balance : undefined}
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                placeholder="0.00"
                                readOnly={type === 'checkout' && product}
                                className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-primary bg-elevated border-2 border-theme rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Quick amount buttons */}
                        {quickAmounts.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {quickAmounts.map(qa => (
                                    <button
                                        key={qa}
                                        type="button"
                                        onClick={() => setAmount(String(qa))}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${parseFloat(amount) === qa
                                            ? 'border-primary-600 bg-primary-600/10 text-primary-700'
                                            : 'border-theme text-secondary hover:border-primary-400 hover:bg-primary-600/5'
                                            }`}
                                    >
                                        {getCurrencySymbol(user?.preferred_currency)}{qa.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <PaymentMethodSelector
                        onChange={handleMethodChange}
                        showBalance={config.showBalance}
                        balanceAmount={balance}
                        transactionType={type}
                    />

                    {/* Type-specific fields */}
                    {type === 'send' && (
                        <div>
                            <label className="block text-sm font-semibold text-secondary mb-1">Recipient <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => handleRecipientSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-10 pr-4 py-3 bg-elevated border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
                                />
                            </div>
                            {recipientSearchLoading && (
                                <div className="p-2 text-center text-sm text-tertiary">
                                    <Loader className="w-4 h-4 animate-spin mx-auto" /> Searching...
                                </div>
                            )}
                            {recipientSearchResults.length > 0 && !selectedRecipient && (
                                <div className="mt-2 border border-theme rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                    {recipientSearchResults.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => selectRecipient(user)}
                                            className="w-full p-3 text-left hover:bg-secondary/10 border-b border-theme last:border-b-0 flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-primary text-sm">
                                                    {user.full_name || user.email}
                                                </div>
                                                <div className="text-xs text-tertiary">{user.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedRecipient && (
                                <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <div className="font-medium text-primary text-sm">
                                            {selectedRecipient.full_name || selectedRecipient.email}
                                        </div>
                                        <div className="text-xs text-tertiary">{selectedRecipient.email}</div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedRecipient(null); setRecipient(''); }}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'withdraw' && (
                        <div>
                            <Input
                                label="Destination Account / Phone"
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Enter account number or phone"
                                required
                            />
                        </div>
                    )}

                    {(selectedMethod?.method_type === 'mpesa' && type === 'deposit') && (
                        <div>
                            <Input
                                label="M-Pesa Phone Number"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="254712345678"
                                required
                            />
                            <p className="text-xs text-secondary mt-1">You'll receive an STK Push on this number.</p>
                        </div>
                    )}

                    {/* Notes */}
                    {(type === 'send' || type === 'checkout') && (
                        <div>
                            <label className="block text-sm font-semibold text-secondary mb-1">Notes (optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 bg-elevated border border-theme rounded-2xl text-primary text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none resize-none"
                                rows={2}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Summary & CTA */}
            <Card>
                <CardBody className="p-6 space-y-4">
                    <h3 className="font-semibold text-primary text-sm">Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-secondary">Amount</span>
                            <span className="font-semibold text-primary">{getCurrencySymbol(user?.preferred_currency)}{amount || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">Payment Method</span>
                            <span className="font-medium text-primary">
                                {selectedMethod?.method_type === 'comrade_balance'
                                    ? 'Qomrade Balance'
                                    : selectedMethod?.method_type === 'mpesa'
                                        ? 'M-Pesa'
                                        : selectedMethod?.method_type === 'card'
                                            ? `${selectedMethod?.card_brand || 'Card'} ••••${selectedMethod?.last_four || ''}`
                                            : selectedMethod?.method_type === 'paypal'
                                                ? 'PayPal'
                                                : selectedMethod?.method_type === 'bank_transfer'
                                                    ? `${selectedMethod?.bank_name || 'Bank'}`
                                                    : 'Select method'}
                            </span>
                        </div>
                        {type === 'send' && recipient && (
                            <div className="flex justify-between">
                                <span className="text-secondary">Recipient</span>
                                <span className="font-medium text-primary">{recipient}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-secondary">Fees</span>
                            <span className="font-medium text-green-600">Free</span>
                        </div>
                        <hr className="border-theme" />
                        <div className="flex justify-between text-lg">
                            <span className="font-semibold text-primary">Total</span>
                            <span className="font-bold text-primary">{getCurrencySymbol(user?.preferred_currency)}{amount || '0.00'}</span>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full py-4 text-base bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 shadow-lg shadow-primary-600/20 rounded-2xl"
                        onClick={handleReviewAndConfirm}
                        disabled={!isFormValid()}
                    >
                        Review & Confirm
                    </Button>

                    <p className="text-center text-xs text-secondary flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        Secure transaction • Encrypted end-to-end
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export default TransactionPage;
