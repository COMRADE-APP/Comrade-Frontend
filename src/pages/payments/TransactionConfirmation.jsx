import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import paymentsService from '../../services/payments.service';
import {
    ArrowLeft, CheckCircle, XCircle, Loader2, Shield, ArrowDownCircle,
    ArrowUpCircle, Send, ShoppingBag, CreditCard, Smartphone, Mail,
    Building2, Wallet, AlertTriangle
} from 'lucide-react';

const METHOD_ICONS = {
    card: CreditCard,
    mpesa: Smartphone,
    paypal: Mail,
    bank_transfer: Building2,
    equity: Building2,
    comrade_balance: Wallet,
};

const TYPE_ICONS = {
    deposit: ArrowDownCircle,
    withdraw: ArrowUpCircle,
    send: Send,
    checkout: ShoppingBag,
};

const TYPE_COLORS = {
    deposit: 'from-green-500 to-emerald-600',
    withdraw: 'from-orange-500 to-amber-600',
    send: 'from-blue-500 to-indigo-600',
    checkout: 'from-purple-500 to-violet-600',
};

const TransactionConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const transactionData = location.state?.transactionData;

    const [step, setStep] = useState('review'); // 'review', 'processing', 'success', 'error'
    const [resultMessage, setResultMessage] = useState('');
    const [transactionId, setTransactionId] = useState(null);

    // If no transaction data, redirect back
    useEffect(() => {
        if (!transactionData) {
            navigate('/payments', { replace: true });
        }
    }, [transactionData, navigate]);

    if (!transactionData) return null;

    const {
        type, amount, paymentMethod, savedMethodId, selectedMethod,
        recipient, accountNumber, phoneNumber, notes, product, config
    } = transactionData;

    const TypeIcon = TYPE_ICONS[type] || ShoppingBag;
    const MethodIcon = METHOD_ICONS[selectedMethod?.method_type] || CreditCard;
    const gradient = TYPE_COLORS[type] || 'from-purple-500 to-violet-600';

    const getMethodDisplayName = () => {
        if (selectedMethod?.method_type === 'comrade_balance') return 'Qomrade Balance';
        if (selectedMethod?.method_type === 'mpesa') return `M-Pesa ${selectedMethod?.phone_number || phoneNumber || ''}`;
        if (selectedMethod?.method_type === 'card') return `${selectedMethod?.card_brand || 'Card'} ••••${selectedMethod?.last_four || ''}`;
        if (selectedMethod?.method_type === 'paypal') return `PayPal ${selectedMethod?.paypal_email || ''}`;
        if (selectedMethod?.method_type === 'bank_transfer') return `${selectedMethod?.bank_name || 'Bank'} ${selectedMethod?.bank_account_last_four ? '••••' + selectedMethod.bank_account_last_four : ''}`;
        return paymentMethod || 'Payment Method';
    };

    const handleConfirm = async () => {
        setStep('processing');

        try {
            let result;

            switch (type) {
                case 'deposit':
                    result = await paymentsService.deposit(
                        amount,
                        paymentMethod,
                        {
                            phone_number: phoneNumber,
                            saved_method_id: savedMethodId,
                        }
                    );
                    break;

                case 'withdraw':
                    result = await paymentsService.withdraw(
                        amount,
                        accountNumber,
                        paymentMethod
                    );
                    break;

                case 'send':
                    result = await paymentsService.transfer({
                        amount,
                        recipient_email: recipient,
                        payment_option: paymentMethod,
                        notes,
                    });
                    break;

                case 'checkout':
                    result = await paymentsService.createTransaction({
                        recipient_email: 'system',
                        amount,
                        transaction_type: 'purchase',
                        payment_option: paymentMethod,
                        saved_method_id: savedMethodId,
                        notes: notes || (product ? `Purchase of ${product.name}` : ''),
                    });
                    break;

                default:
                    throw new Error('Unknown transaction type');
            }

            setTransactionId(result?.transaction_id || result?.id || null);
            setResultMessage(
                result?.message || result?.detail ||
                `Successfully ${config.successVerb} $${amount}`
            );
            setStep('success');

        } catch (err) {
            const errData = err?.response?.data;
            let msg = 'Transaction failed. Please try again.';
            if (errData) {
                if (typeof errData === 'string') msg = errData;
                else if (errData.error) msg = errData.error;
                else if (errData.detail) msg = errData.detail;
                else {
                    const entries = Object.entries(errData)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                        .join('. ');
                    if (entries) msg = entries;
                }
            }
            setResultMessage(msg);
            setStep('error');
        }
    };

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6 animate-in fade-in">
            {/* Back button — only on review step */}
            {step === 'review' && (
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Form
                </button>
            )}

            {/* ─── Review Step ──────────────────────────────────────── */}
            {step === 'review' && (
                <>
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                            <TypeIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary">Review {config.title}</h1>
                        <p className="text-secondary text-sm">Please review the details below before confirming.</p>
                    </div>

                    {/* Transaction Details Card */}
                    <Card>
                        <CardBody className="p-6 space-y-4">
                            {/* Amount */}
                            <div className="text-center py-4">
                                <p className="text-sm text-secondary mb-1">Amount</p>
                                <p className="text-4xl font-bold text-primary">${amount}</p>
                            </div>

                            <hr className="border-theme" />

                            {/* Details rows */}
                            <div className="space-y-3">
                                <DetailRow label="Transaction Type" value={config.title} />
                                <DetailRow
                                    label="Payment Method"
                                    value={getMethodDisplayName()}
                                    icon={<MethodIcon className="w-4 h-4 text-purple-500" />}
                                />
                                {type === 'send' && recipient && (
                                    <DetailRow label="Recipient" value={recipient} />
                                )}
                                {type === 'withdraw' && accountNumber && (
                                    <DetailRow label="Destination" value={accountNumber} />
                                )}
                                {product && (
                                    <DetailRow label="Product" value={product.name} />
                                )}
                                {notes && (
                                    <DetailRow label="Notes" value={notes} />
                                )}
                                <DetailRow label="Fees" value="Free" valueClass="text-green-600" />
                                <hr className="border-theme" />
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-primary">Total</span>
                                    <span className="font-bold text-primary">${amount}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Please review all details carefully. Once confirmed, this transaction cannot be reversed easily.
                        </p>
                    </div>

                    {/* CTA */}
                    <Button
                        variant="primary"
                        className="w-full py-4 text-base bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/20 rounded-2xl font-semibold"
                        onClick={handleConfirm}
                    >
                        {config.confirmLabel}
                    </Button>

                    <p className="text-center text-xs text-secondary flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        256-bit encrypted • Secure transaction
                    </p>
                </>
            )}

            {/* ─── Processing Step ─────────────────────────────────── */}
            {step === 'processing' && (
                <div className="text-center py-20 space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary">Processing Transaction</h2>
                        <p className="text-secondary mt-2">Please wait while we process your transaction...</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Success Step ────────────────────────────────────── */}
            {step === 'success' && (
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-14 h-14 text-green-500" />
                        </div>
                        {/* Success ring animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-2 border-green-500/30 animate-ping" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-green-600">Transaction Successful!</h2>
                        <p className="text-secondary mt-2">{resultMessage}</p>
                    </div>

                    <Card>
                        <CardBody className="p-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-secondary">Amount</span>
                                <span className="font-semibold text-primary">${amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Type</span>
                                <span className="font-medium text-primary">{config.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Method</span>
                                <span className="font-medium text-primary">{getMethodDisplayName()}</span>
                            </div>
                            {transactionId && (
                                <div className="flex justify-between">
                                    <span className="text-secondary">Transaction ID</span>
                                    <span className="font-mono text-xs text-primary">#{transactionId}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-secondary">Date</span>
                                <span className="font-medium text-primary">{new Date().toLocaleDateString()}</span>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 py-3 rounded-2xl border-theme"
                            onClick={() => navigate('/payments')}
                        >
                            View Transactions
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600"
                            onClick={() => navigate('/')}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── Error Step ──────────────────────────────────────── */}
            {step === 'error' && (
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-14 h-14 text-red-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-red-600">Transaction Failed</h2>
                        <p className="text-secondary mt-2">{resultMessage}</p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 py-3 rounded-2xl border-theme"
                            onClick={() => navigate('/payments')}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600"
                            onClick={() => navigate(-2)}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, icon, valueClass = '' }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-secondary">{label}</span>
        <span className={`text-sm font-medium text-primary flex items-center gap-1.5 ${valueClass}`}>
            {icon}
            {value}
        </span>
    </div>
);

export default TransactionConfirmation;
