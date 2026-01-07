import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentProcessingService from '../../services/paymentProcessing.service';
import './PaymentForm.css';

// Initialize Stripe - replace with your publishable key
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

const PaymentFormContent = ({ amount, currency = 'USD', description, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('stripe');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            if (paymentMethod === 'stripe') {
                // Create payment method
                const { error: stripeError, paymentMethod: pm } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: elements.getElement(CardElement),
                });

                if (stripeError) {
                    setError(stripeError.message);
                    setProcessing(false);
                    return;
                }

                // Process payment via backend
                const response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency,
                    payment_method: 'stripe',
                    payment_method_id: pm.id,
                    description,
                });

                if (response) {
                    onSuccess(response);
                }
            } else if (paymentMethod === 'mpesa') {
                // Process M-Pesa payment
                const response = await paymentProcessingService.processPayment({
                    amount: parseFloat(amount),
                    currency: 'KES',
                    payment_method: 'mpesa',
                    description,
                });

                if (response) {
                    onSuccess(response);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
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
                <div className="payment-method-selector">
                    <label className={paymentMethod === 'stripe' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>Credit/Debit Card</span>
                    </label>

                    <label className={paymentMethod === 'mpesa' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="mpesa"
                            checked={paymentMethod === 'mpesa'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>M-Pesa</span>
                    </label>
                </div>

                {paymentMethod === 'stripe' && (
                    <div className="card-element-container">
                        <CardElement options={cardElementOptions} />
                    </div>
                )}

                {paymentMethod === 'mpesa' && (
                    <div className="mpesa-input">
                        <input
                            type="tel"
                            placeholder="M-Pesa Phone Number (254...)"
                            className="form-input"
                            pattern="254[0-9]{9}"
                            required
                        />
                        <p className="help-text">You'll receive an STK push on your phone</p>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-pay"
                    disabled={processing || !stripe}
                >
                    {processing ? 'Processing...' : `Pay ${currency} ${parseFloat(amount).toFixed(2)}`}
                </button>
            </form>

            <div className="payment-secure">
                🔒 Secure payment powered by Stripe
            </div>
        </div>
    );
};

const PaymentForm = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentFormContent {...props} />
        </Elements>
    );
};

export default PaymentForm;
