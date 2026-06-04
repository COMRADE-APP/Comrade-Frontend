/**
 * PaymentForm — PCI-compliant card capture with Stripe Elements,
 * M-Pesa phone field, PayPal, Flutterwave/Pesapal redirect,
 * and saved payment methods selector.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import paymentProcessingService from '../../services/paymentProcessing.service';
import { detectCurrency } from '../../utils/currencyUtils';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import './PaymentForm.css';

// Removed Stripe CardElement options

const PaymentForm = ({ amount, currency = 'USD', description, onSuccess, onCancel }) => {
    const { user } = useAuth();
    const [gatewayConfig, setGatewayConfig] = useState(null);

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [methodType, setMethodType] = useState('card');
    const [savedMethods, setSavedMethods] = useState([]);
    const [selectedSavedId, setSelectedSavedId] = useState('');
    const [saveDetails, setSaveDetails] = useState(false);

    // M-Pesa
    const [phoneNumber, setPhoneNumber] = useState('');

    // PayPal
    const [paypalEmail, setPaypalEmail] = useState('');

    // Available gateways
    const gateways = gatewayConfig?.gateways || {};
    const hasStripe = gateways.stripe?.available;
    const hasMpesa = gateways.mpesa?.available;
    const hasPaypal = gateways.paypal?.available;
    const hasFlutterwave = gateways.flutterwave?.available;
    const hasPesapal = gateways.pesapal?.available;

    // Load saved payment methods & gateway config
    useEffect(() => {
        paymentProcessingService.getGatewayConfig()
            .then(res => setGatewayConfig(res))
            .catch(console.error);
            
        const loadSaved = async () => {
            try {
                const data = await paymentProcessingService.getSavedMethods();
                const methods = data?.results || data || [];
                setSavedMethods(Array.isArray(methods) ? methods : []);
            } catch { /* ignore */ }
        };
        loadSaved();
    }, []);

    const flwConfig = {
        public_key: gatewayConfig?.gateways?.flutterwave?.public_key || '',
        tx_ref: Date.now().toString(),
        amount: parseFloat(amount) || 0,
        currency: detectCurrency(currency),
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || 'user@example.com',
            phone_number: phoneNumber,
            name: user?.first_name || 'Customer',
        },
        customizations: {
            title: 'Qomrade Payment',
            description,
        },
    };
    const handleFlutterPayment = useFlutterwave(flwConfig);
    
    const triggerFlutterwave = (txRef, method) => {
        handleFlutterPayment({
            ...flwConfig,
            tx_ref: txRef,
            currency: detectCurrency(method === 'mpesa' ? 'KES' : currency),
            callback: async (response) => {
                closePaymentModal();
                try {
                    setProcessing(true);
                    await paymentProcessingService.verifyFlutterwavePayment({
                        transaction_id: response.transaction_id,
                        tx_ref: response.tx_ref
                    });
                    
                    if (onSuccess) onSuccess(response);
                } catch (e) {
                    setError('Payment verification failed.');
                } finally {
                    setProcessing(false);
                }
            },
            onClose: () => {
                setError('Payment modal closed.');
                setProcessing(false);
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');

        try {
            let response;

            if (methodType === 'saved') {
                if (!selectedSavedId) {
                    setError('Please select a saved payment method.');
                    setProcessing(false);
                    return;
                }
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'stripe',
                    saved_method_id: selectedSavedId,
                    description,
                });

            } else if (methodType === 'card' || methodType === 'mpesa' || methodType === 'flutterwave') {
                if (methodType === 'mpesa' && !phoneNumber) {
                    setError('Phone number is required for M-Pesa.');
                    setProcessing(false);
                    return;
                }
                
                // Save method preference
                if (saveDetails) {
                    try {
                        await paymentProcessingService.savePaymentMethod({
                            method_type: methodType === 'card' ? 'card' : 'mpesa',
                            phone_number: phoneNumber,
                            is_default: savedMethods.length === 0,
                            nickname: methodType === 'mpesa' ? phoneNumber : 'Card'
                        });
                    } catch { /* non-blocking */ }
                }

                // Initialize via backend
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency: detectCurrency(methodType === 'mpesa' ? 'KES' : currency),
                    payment_method: methodType,
                    phone_number: phoneNumber,
                    description,
                });
                
                if (response?.provider_response?.status !== 'ready_for_inline') {
                     throw new Error('Failed to initialize payment gateway.');
                }
                
                const txRef = response.transaction?.transaction_code;
                triggerFlutterwave(txRef, methodType);
                return; // callback handles success

            } else if (methodType === 'paypal') {
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'paypal',
                    description,
                });
                // PayPal returns an approval URL — redirect user
                if (response?.provider_response?.approve_url) {
                    window.location.href = response.provider_response.approve_url;
                    return;
                }


            } else if (methodType === 'pesapal') {
                response = await paymentProcessingService.initiatePesapalPayment({
                    amount: parseFloat(amount),
                    currency: currency === 'USD' ? 'KES' : currency,
                    description,
                });
                if (response?.provider_response?.redirect_url) {
                    window.location.href = response.provider_response.redirect_url;
                    return;
                }
            }

            if (response && onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'string') setError(detail);
            else if (detail?.error) setError(detail.error);
            else if (detail?.detail) setError(detail.detail);
            else setError('Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // Build method tabs dynamically based on available gateways
    const methodTabs = [];
    if (hasStripe) methodTabs.push({ val: 'card', label: '💳 Card', icon: '💳' });
    if (hasMpesa || hasFlutterwave) methodTabs.push({ val: 'mpesa', label: '📱 M-Pesa', icon: '📱' });
    if (hasPaypal) methodTabs.push({ val: 'paypal', label: '🅿️ PayPal', icon: '🅿️' });
    if (hasFlutterwave) methodTabs.push({ val: 'flutterwave', label: '🏦 Bank', icon: '🏦' });
    if (hasPesapal && !hasFlutterwave) methodTabs.push({ val: 'pesapal', label: '🏦 Pesapal', icon: '🏦' });
    if (savedMethods.length > 0) methodTabs.push({ val: 'saved', label: '⭐ Saved', icon: '⭐' });

    // Fallback if no gateways loaded yet
    if (methodTabs.length === 0) {
        methodTabs.push({ val: 'card', label: '💳 Card', icon: '💳' });
        methodTabs.push({ val: 'mpesa', label: '📱 M-Pesa', icon: '📱' });
    }

    return (
        <div className="payment-form">
            <div className="payment-form-header">
                <h2>Payment</h2>
                <button className="close-btn" onClick={onCancel}>×</button>
            </div>

            <div className="payment-amount">
                <span className="currency">{currency}</span>
                <span className="amount">{parseFloat(amount).toFixed(2)}</span>
            </div>

            {description && <p className="payment-description">{description}</p>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* ─── Method Selector ─── */}
                <div className="payment-method-selector">
                    {methodTabs.map(({ val, label }) => (
                        <label key={val} className={methodType === val ? 'active' : ''}>
                            <input
                                type="radio" name="methodType" value={val}
                                checked={methodType === val}
                                onChange={() => setMethodType(val)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>

                {/* ─── Card Fields ─── */}
                {methodType === 'card' && (
                    <div className="card-fields">
                        <p className="help-text">
                            💳 You'll be redirected to a secure page to enter your card details.
                        </p>
                    </div>
                )}

                {/* ─── M-Pesa ─── */}
                {methodType === 'mpesa' && (
                    <div className="mpesa-input">
                        <div className="form-group mb-4">
                            <label>M-Pesa Phone Number</label>
                            <input
                                type="tel"
                                className="form-control"
                                placeholder="e.g. 0712345678"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <p className="helper-text mt-2 text-xs text-tertiary">📱 Used for mobile money checkout</p>
                        </div>
                    </div>
                )}

                {/* ─── PayPal ─── */}
                {methodType === 'paypal' && (
                    <div className="paypal-input">
                        <p className="help-text" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            🅿️ You'll be redirected to PayPal to complete your payment securely.
                        </p>
                    </div>
                )}

                {/* ─── Flutterwave (Bank/M-Pesa/Card via hosted page) ─── */}
                {methodType === 'flutterwave' && (
                    <div className="flutterwave-input">
                        <p className="help-text" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            🏦 You'll be redirected to a secure payment page supporting banks (Equity, KCB, DTB, Absa, NCBA, Ecobank, Family Bank), M-Pesa, and cards.
                        </p>
                    </div>
                )}

                {/* ─── Pesapal ─── */}
                {methodType === 'pesapal' && (
                    <div className="pesapal-input">
                        <p className="help-text" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            🏦 You'll be redirected to Pesapal to pay via M-Pesa, Airtel Money, or bank transfer.
                        </p>
                    </div>
                )}

                {/* ─── Saved Methods ─── */}
                {methodType === 'saved' && (
                    <div className="saved-methods">
                        <select
                            id="saved-method"
                            className="form-input"
                            value={selectedSavedId}
                            onChange={(e) => setSelectedSavedId(e.target.value)}
                            required
                        >
                            <option value="">Select a saved payment method</option>
                            {savedMethods.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.display_name || m.nickname || `${m.method_type} ending ${m.last_four || ''}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* ─── Save Details Checkbox ─── */}
                {(methodType === 'card' || methodType === 'mpesa') && (
                    <label className="save-details-check">
                        <input
                            type="checkbox"
                            checked={saveDetails}
                            onChange={(e) => setSaveDetails(e.target.checked)}
                        />
                        <span>Save payment details for next time</span>
                    </label>
                )}

                <button type="submit" className="btn-pay" disabled={processing || (methodType === 'card' && !stripe)}>
                    {processing ? 'Processing...' : `Pay ${currency} ${parseFloat(amount).toFixed(2)}`}
                </button>
            </form>

            <div className="payment-secure">🔒 Secure payment — PCI Level 1 compliant</div>
        </div>
    );
};

export default PaymentForm;
