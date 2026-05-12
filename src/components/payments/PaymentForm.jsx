/**
 * PaymentForm — PCI-compliant card capture with Stripe Elements,
 * M-Pesa phone field, PayPal, Flutterwave/Pesapal redirect,
 * and saved payment methods selector.
 */
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStripeContext } from '../../contexts/StripeProvider';
import paymentProcessingService from '../../services/paymentProcessing.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';
import './PaymentForm.css';

// Stripe CardElement styling (matches dark theme)
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
            '::placeholder': { color: '#64748b' },
            iconColor: '#6366f1',
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
    hidePostalCode: false,
};

const PaymentForm = ({ amount, currency = 'USD', description, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { gatewayConfig } = useStripeContext();

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

    // Load saved payment methods
    useEffect(() => {
        const loadSaved = async () => {
            try {
                const data = await paymentProcessingService.getSavedMethods();
                const methods = data?.results || data || [];
                setSavedMethods(Array.isArray(methods) ? methods : []);
            } catch { /* ignore */ }
        };
        loadSaved();
    }, []);

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

            } else if (methodType === 'card') {
                // PCI-compliant: use Stripe Elements to create a PaymentMethod
                if (!stripe || !elements) {
                    setError('Payment system is loading. Please wait a moment.');
                    setProcessing(false);
                    return;
                }

                const cardElement = elements.getElement(CardElement);
                if (!cardElement) {
                    setError('Card input not available.');
                    setProcessing(false);
                    return;
                }

                // Create PaymentMethod using Stripe.js (card data never touches our server)
                const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (stripeError) {
                    setError(stripeError.message);
                    setProcessing(false);
                    return;
                }

                // Send only the tokenized PM ID to our backend
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'stripe',
                    payment_method_id: paymentMethod.id,
                    description,
                });

                // If backend returns client_secret, confirm on client
                if (response?.provider_response?.client_secret) {
                    const { error: confirmError } = await stripe.confirmCardPayment(
                        response.provider_response.client_secret
                    );
                    if (confirmError) {
                        setError(confirmError.message);
                        setProcessing(false);
                        return;
                    }
                }

                // Save method for future use if requested
                if (saveDetails && paymentMethod?.id) {
                    try {
                        await paymentProcessingService.savePaymentMethod({
                            method_type: 'card',
                            provider_token: paymentMethod.id,
                            provider: 'stripe',
                            last_four: paymentMethod.card?.last4 || '',
                            card_brand: paymentMethod.card?.brand || '',
                            is_default: savedMethods.length === 0,
                            nickname: `${paymentMethod.card?.brand || 'Card'} •••• ${paymentMethod.card?.last4 || ''}`,
                        });
                    } catch { /* non-blocking */ }
                }

            } else if (methodType === 'mpesa') {
                if (!phoneNumber) {
                    setError('Phone number is required for M-Pesa.');
                    setProcessing(false);
                    return;
                }
                if (saveDetails) {
                    try {
                        await paymentProcessingService.savePaymentMethod({
                            method_type: 'mpesa',
                            phone_number: phoneNumber,
                        });
                    } catch { /* non-blocking */ }
                }
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency: 'USD',
                    payment_method: 'mpesa',
                    phone_number: phoneNumber,
                    description,
                });

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

            } else if (methodType === 'flutterwave') {
                response = await paymentProcessingService.initiateFlutterwavePayment({
                    amount: parseFloat(amount),
                    currency: currency === 'USD' ? 'KES' : currency,
                    description,
                });
                if (response?.provider_response?.payment_link) {
                    window.location.href = response.provider_response.payment_link;
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

                {/* ─── Stripe Card Element (PCI Compliant) ─── */}
                {methodType === 'card' && (
                    <div className="card-fields">
                        <div className="stripe-card-element-wrapper">
                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                        <p className="help-text">
                            🔒 Card details are securely processed by Stripe. We never see your card number.
                        </p>
                    </div>
                )}

                {/* ─── M-Pesa ─── */}
                {methodType === 'mpesa' && (
                    <div className="mpesa-input">
                        <input
                            id="mpesa-phone"
                            type="tel"
                            placeholder="Phone number (e.g. 0712345678)"
                            className="form-input"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                        <p className="help-text">You'll receive an STK push on your phone</p>
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
