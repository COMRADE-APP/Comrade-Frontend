/**
 * PaymentForm — Custom card inputs with real-time brand detection,
 * saved payment methods dropdown, M-Pesa phone field, PayPal selection,
 * and a "save payment details" checkbox.
 */
import React, { useState, useEffect, useCallback } from 'react';
import paymentProcessingService from '../../services/paymentProcessing.service';
import './PaymentForm.css';

// ── Card brand detection (client-side, mirrors backend) ──────────
const detectCardBrand = (num) => {
    const n = num.replace(/\s|-/g, '');
    if (!n || !/^\d+$/.test(n)) return null;
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720)/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^6011|^65|^64[4-9]/.test(n)) return 'discover';
    if (/^35(2[89]|[3-8]\d)/.test(n)) return 'jcb';
    if (/^3(0[0-5]|[68])/.test(n)) return 'diners_club';
    if (/^62/.test(n)) return 'unionpay';
    if (/^(5018|5020|5038|6304|6759|676[1-3])/.test(n)) return 'maestro';
    return null;
};

const BRAND_LABELS = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
    discover: '💳 Discover',
    jcb: '💳 JCB',
    diners_club: "💳 Diner's Club",
    unionpay: '💳 UnionPay',
    maestro: '💳 Maestro',
};

const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// ── Component ────────────────────────────────────────────────────
const PaymentForm = ({ amount, currency = 'USD', description, onSuccess, onCancel }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [methodType, setMethodType] = useState('card'); // card | mpesa | paypal | saved
    const [savedMethods, setSavedMethods] = useState([]);
    const [selectedSavedId, setSelectedSavedId] = useState('');
    const [saveDetails, setSaveDetails] = useState(false);

    // Card fields
    const [cardNumber, setCardNumber] = useState('');
    const [cardBrand, setCardBrand] = useState(null);
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvc, setCvc] = useState('');
    const [billingZip, setBillingZip] = useState('');

    // M-Pesa
    const [phoneNumber, setPhoneNumber] = useState('');

    // PayPal
    const [paypalEmail, setPaypalEmail] = useState('');

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

    // Real-time brand detection while typing
    useEffect(() => {
        setCardBrand(detectCardBrand(cardNumber));
    }, [cardNumber]);

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
                // If user wants to save details, save the method first
                let savedMethodId;
                if (saveDetails) {
                    try {
                        const saved = await paymentProcessingService.savePaymentMethod({
                            method_type: 'card',
                            card_number: cardNumber.replace(/\s/g, ''),
                            expiry_month: parseInt(expiryMonth),
                            expiry_year: parseInt(expiryYear),
                            cvc,
                            billing_zip: billingZip,
                            is_default: savedMethods.length === 0,
                        });
                        savedMethodId = saved.id;
                    } catch (saveErr) {
                        // Non-blocking: continue processing even if save fails
                        console.warn('Could not save payment method:', saveErr);
                    }
                }

                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'stripe',
                    ...(savedMethodId ? { saved_method_id: savedMethodId } : {}),
                    description,
                });
            } else if (methodType === 'mpesa') {
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
                    currency: 'KES',
                    payment_method: 'mpesa',
                    phone_number: phoneNumber,
                    description,
                });
            } else if (methodType === 'paypal') {
                if (saveDetails) {
                    try {
                        await paymentProcessingService.savePaymentMethod({
                            method_type: 'paypal',
                            paypal_email: paypalEmail,
                        });
                    } catch { /* non-blocking */ }
                }
                response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'paypal',
                    description,
                });
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
                    {[
                        { val: 'card', label: '💳 Card' },
                        { val: 'mpesa', label: '📱 M-Pesa' },
                        { val: 'paypal', label: '🅿️ PayPal' },
                        ...(savedMethods.length > 0 ? [{ val: 'saved', label: '⭐ Saved' }] : []),
                    ].map(({ val, label }) => (
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

                {/* ─── Card Inputs ─── */}
                {methodType === 'card' && (
                    <div className="card-fields">
                        <div className="card-number-row">
                            <input
                                id="card-number"
                                type="text"
                                placeholder="Card number"
                                className="form-input"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={23}
                                required
                                autoComplete="cc-number"
                            />
                            {cardBrand && (
                                <span className="card-brand-badge">{BRAND_LABELS[cardBrand] || '💳'}</span>
                            )}
                        </div>
                        <div className="card-row">
                            <select
                                id="expiry-month"
                                className="form-input"
                                value={expiryMonth}
                                onChange={(e) => setExpiryMonth(e.target.value)}
                                required
                            >
                                <option value="">Month</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                            </select>
                            <select
                                id="expiry-year"
                                className="form-input"
                                value={expiryYear}
                                onChange={(e) => setExpiryYear(e.target.value)}
                                required
                            >
                                <option value="">Year</option>
                                {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <input
                                id="cvc"
                                type="text"
                                placeholder="CVC"
                                className="form-input"
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                maxLength={4}
                                required
                                autoComplete="cc-csc"
                            />
                        </div>
                        <input
                            id="billing-zip"
                            type="text"
                            placeholder="Billing ZIP code"
                            className="form-input"
                            value={billingZip}
                            onChange={(e) => setBillingZip(e.target.value)}
                            maxLength={10}
                            autoComplete="postal-code"
                        />
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
                        <input
                            id="paypal-email"
                            type="email"
                            placeholder="PayPal email address"
                            className="form-input"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            required
                        />
                        <p className="help-text">You'll be redirected to PayPal to complete payment</p>
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
                {methodType !== 'saved' && (
                    <label className="save-details-check">
                        <input
                            type="checkbox"
                            checked={saveDetails}
                            onChange={(e) => setSaveDetails(e.target.checked)}
                        />
                        <span>Save payment details for next time</span>
                    </label>
                )}

                <button type="submit" className="btn-pay" disabled={processing}>
                    {processing ? 'Processing...' : `Pay ${currency} ${parseFloat(amount).toFixed(2)}`}
                </button>
            </form>

            <div className="payment-secure">🔒 Secure payment — details are encrypted</div>
        </div>
    );
};

export default PaymentForm;
