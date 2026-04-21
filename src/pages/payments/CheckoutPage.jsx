import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Loader2, CheckCircle, Package, Smartphone, Building2, Globe } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { useStripeContext } from '../../contexts/StripeProvider';
import { paymentsService } from '../../services/payments.service';
import paymentProcessingService from '../../services/paymentProcessing.service';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

// Stripe CardElement styling
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
            '::placeholder': { color: '#64748b' },
            iconColor: '#6366f1',
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
    hidePostalCode: false,
};

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const stripe = useStripe();
    const elements = useElements();
    const { gatewayConfig } = useStripeContext();

    // State coming from cart navigation
    const {
        cartItems = [],
        purchaseType = 'individual',
        selectedGroupId = null,
        selectedGroup = null,
        totalAmount = 0,
        isMultiDestination = false
    } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [deliveryMethod, setDeliveryMethod] = useState('delivery');
    const [walletBalance, setWalletBalance] = useState(0);
    const [approvalPending, setApprovalPending] = useState(false);
    const [checkoutRequestId, setCheckoutRequestId] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    const hasPhysicalItems = cartItems.some(item => 
        (item.type === 'product' && item.metadata?.product_type !== 'digital') ||
        (item.type === 'service' && item.metadata?.service_mode !== 'online')
    );

    // Available gateways
    const gateways = gatewayConfig?.gateways || {};
    const hasStripe = gateways.stripe?.available;
    const hasMpesa = gateways.mpesa?.available || gateways.flutterwave?.available;
    const hasPaypal = gateways.paypal?.available;
    const hasFlutterwave = gateways.flutterwave?.available;

    useEffect(() => {
        if (!location.state || cartItems.length === 0) {
            navigate('/shop');
            return;
        }
        if (purchaseType === 'individual') {
            paymentsService.getBalance()
                .then(res => {
                    setWalletBalance(res.balance !== undefined ? res.balance : (res.available_balance || 0));
                })
                .catch(err => console.error("Error fetching balance:", err));
        }
    }, [location.state, navigate, cartItems, purchaseType]);

    const handleCheckout = async () => {
        setLoading(true);
        setError('');

        try {
            const productIds = cartItems.filter(item => item.type === 'product').map(i => i.id);
            const serviceIds = cartItems.filter(item => item.type === 'service').map(i => i.id);
            const bookingIds = cartItems.filter(item => item.type === 'booking' || item.type === 'room').map(i => i.id);
            const fundingIds = cartItems.filter(item => item.type === 'funding').map(i => i.id);

            const payload = {
                product_ids: productIds,
                service_ids: serviceIds,
                booking_ids: bookingIds,
                funding_ids: fundingIds,
                items: cartItems.map(item => ({
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    price: item.price,
                    qty: item.qty || 1,
                    delivery_method: (item.metadata?.product_type === 'digital' || item.metadata?.service_mode === 'online' || item.type === 'funding' || item.type === 'booking') ? 'online' : deliveryMethod,
                    payload: item.payload,
                    metadata: item.metadata,
                })),
                amount: totalAmount,
                payment_method: paymentMethod,
                delivery_method: deliveryMethod
            };

            // ── GROUP PURCHASE ──
            if (purchaseType === 'group') {
                if (!selectedGroupId) throw new Error("No group selected for group purchase.");
                payload.group_id = selectedGroupId;
                if (isMultiDestination) payload.is_multi_destination = true;

                const response = await paymentsService.processGroupCheckout(payload);
                if (response?.approval_pending || response?.data?.approval_pending) {
                    const reqId = response?.checkout_request_id || response?.data?.checkout_request_id;
                    setCheckoutRequestId(reqId);
                    setApprovalPending(true);
                    setLoading(false);
                    return;
                }
            }
            // ── STRIPE CARD PAYMENT ──
            else if (paymentMethod === 'stripe') {
                if (!stripe || !elements) {
                    throw new Error('Stripe not loaded. Please wait and try again.');
                }
                const cardElement = elements.getElement(CardElement);
                if (!cardElement) throw new Error('Card input not ready.');

                // Create PaymentMethod (tokenized — PCI compliant)
                const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });
                if (pmError) throw new Error(pmError.message);

                // Create PaymentIntent on backend
                const intentResult = await paymentProcessingService.processPayment({
                    amount: totalAmount,
                    currency: 'USD',
                    payment_method: 'stripe',
                    payment_method_id: pm.id,
                    description: `Checkout: ${cartItems.length} items`,
                });

                // Confirm on client if needed
                if (intentResult?.provider_response?.client_secret) {
                    const { error: confirmError } = await stripe.confirmCardPayment(
                        intentResult.provider_response.client_secret
                    );
                    if (confirmError) throw new Error(confirmError.message);
                }
            }
            // ── M-PESA ──
            else if (paymentMethod === 'mpesa') {
                if (!phoneNumber) throw new Error('Phone number is required for M-Pesa.');
                await paymentProcessingService.processPayment({
                    amount: totalAmount,
                    currency: 'KES',
                    payment_method: 'mpesa',
                    phone_number: phoneNumber,
                    description: `Checkout: ${cartItems.length} items`,
                });
            }
            // ── PAYPAL (redirect) ──
            else if (paymentMethod === 'paypal') {
                const result = await paymentProcessingService.processPayment({
                    amount: totalAmount,
                    currency: 'USD',
                    payment_method: 'paypal',
                    description: `Checkout: ${cartItems.length} items`,
                });
                if (result?.provider_response?.approve_url) {
                    window.location.href = result.provider_response.approve_url;
                    return;
                }
            }
            // ── FLUTTERWAVE (redirect) ──
            else if (paymentMethod === 'flutterwave') {
                const result = await paymentProcessingService.initiateFlutterwavePayment({
                    amount: totalAmount,
                    currency: 'KES',
                    email: user?.email || '',
                    description: `Checkout: ${cartItems.length} items`,
                });
                if (result?.provider_response?.payment_link) {
                    window.location.href = result.provider_response.payment_link;
                    return;
                }
            }
            // ── WALLET (existing flow) ──
            else {
                const donationItem = cartItems.find(item => item.type === 'donation');
                const investItem = cartItems.find(item => item.type === 'investment_quote');
                
                if (donationItem) {
                    await paymentsService.contributeToDonation(donationItem.id, totalAmount);
                } else if (investItem) {
                    await paymentsService.quoteGroupInvestment(investItem.id, totalAmount);
                } else {
                    await paymentsService.processCheckout(payload);
                }
            }

            setSuccess(true);
        } catch (err) {
            console.error("Checkout error:", err);
            let errMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || err.message || "Checkout failed. Please try again.";
            
            if (typeof err.response?.data === 'object' && !err.response?.data?.detail && !err.response?.data?.error) {
                const errorValues = Object.values(err.response.data).flat();
                if (errorValues.length > 0 && typeof errorValues[0] === 'string') {
                    errMsg = errorValues[0];
                }
            }
            
            if (errMsg === 'Request failed with status code 400') {
               errMsg = "Invalid request. Please check your payment details or group balance.";
            } else if (errMsg === 'Request failed with status code 404') {
               errMsg = "A requested item is no longer available or the payment group was not found.";
            }
            
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    // Polling for group checkout approval
    useEffect(() => {
        let interval;
        if (approvalPending && checkoutRequestId && selectedGroupId) {
            interval = setInterval(async () => {
                try {
                    const requests = await paymentsService.getGroupCheckoutRequests(selectedGroupId);
                    const currentRequest = requests.find(r => r.id === checkoutRequestId);
                    if (currentRequest) {
                        if (currentRequest.status === 'approved') {
                            setApprovalPending(false);
                            setSuccess(true);
                        } else if (currentRequest.status === 'rejected') {
                            setApprovalPending(false);
                            setError('Your checkout request was rejected by the group members.');
                        }
                    }
                } catch (error) {
                    console.error("Error polling checkout status:", error);
                }
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [approvalPending, checkoutRequestId, selectedGroupId]);

    if (approvalPending) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">Approval Pending</h1>
                <p className="text-secondary max-w-md text-center mb-8">
                    Your group checkout has been initiated. Waiting for other members to approve the payment.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate('/shop')}>Return to Shop</Button>
                    <Button variant="primary" onClick={() => navigate(`/payments/groups/${selectedGroupId}?tab=approvals`)}>View Pending Approvals</Button>
                </div>
            </div>
        );
    }

    if (success) {
        const hasFundingItem = cartItems.some(item => item.type === 'funding');
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">Payment Successful!</h1>
                <p className="text-secondary max-w-md text-center mb-8">
                    Your {purchaseType === 'group' ? 'group ' : ''}payment has been processed successfully.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate(hasFundingItem ? '/funding' : '/shop')}>
                        {hasFundingItem ? 'Return to Funding' : 'Continue Shopping'}
                    </Button>
                    <Button variant="primary" onClick={() => navigate(hasFundingItem ? '/funding/history' : '/shop/orders')}>
                        {hasFundingItem ? 'Track Investment' : 'View Orders'}
                    </Button>
                </div>
            </div>
        );
    }

    const isGroupPurchase = purchaseType === 'group';

    // Payment options for individual checkout
    const paymentOptions = [];
    paymentOptions.push({ val: 'wallet', label: 'Personal Wallet', icon: <CreditCard className="w-4 h-4" />, sub: `Balance: $${walletBalance.toFixed(2)}` });
    if (hasStripe) paymentOptions.push({ val: 'stripe', label: 'Card / Apple Pay', icon: <CreditCard className="w-4 h-4 text-indigo-400" />, sub: 'Visa, Mastercard, Amex' });
    if (hasMpesa) paymentOptions.push({ val: 'mpesa', label: 'M-Pesa', icon: <Smartphone className="w-4 h-4 text-green-400" />, sub: 'Safaricom STK Push' });
    if (hasFlutterwave) paymentOptions.push({ val: 'flutterwave', label: 'Bank Transfer', icon: <Building2 className="w-4 h-4 text-amber-400" />, sub: 'Equity, KCB, DTB, Absa & more' });
    if (hasPaypal) paymentOptions.push({ val: 'paypal', label: 'PayPal', icon: <Globe className="w-4 h-4 text-blue-400" />, sub: 'PayPal / Venmo' });

    const canPay = isGroupPurchase ||
        paymentMethod === 'stripe' ||
        paymentMethod === 'mpesa' ||
        paymentMethod === 'paypal' ||
        paymentMethod === 'flutterwave' ||
        (paymentMethod === 'wallet' && walletBalance >= totalAmount);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm font-medium text-secondary hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
                </button>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: Order Summary */}
                    <div className="flex-1 space-y-6">
                        <Card>
                            <CardBody>
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-indigo-500" /> Order Summary
                                </h2>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {cartItems.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex justify-between items-center py-3 border-b border-theme last:border-0 hover:bg-secondary/10 p-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded bg-secondary/20 object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-secondary/10 flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-tertiary" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-primary line-clamp-1">{item.name}</p>
                                                    <p className="text-xs text-secondary capitalize">{item.type}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-primary">
                                                ${parseFloat(item.price).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right Column: Payment Details */}
                    <div className="w-full md:w-80 lg:w-96 space-y-6">
                        <Card>
                            <CardBody className="space-y-6">
                                {/* Delivery Selection */}
                                {hasPhysicalItems && (
                                    <div className="mb-6 pb-6 border-b border-theme">
                                        <h3 className="font-bold text-lg text-primary mb-4">Delivery Options</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5 text-primary' : 'border-theme text-secondary hover:bg-secondary/10'}`}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                                                <span className="font-medium">Delivery</span>
                                            </label>
                                            <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 text-primary' : 'border-theme text-secondary hover:bg-secondary/10'}`}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} />
                                                <span className="font-medium">Pickup</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-bold text-lg text-primary mb-4">Payment Selection</h3>

                                    {isGroupPurchase ? (
                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Group Finance</span>
                                            </div>
                                            <p className="font-medium text-primary line-clamp-1">{selectedGroup?.name || 'Selected Group'}</p>
                                            <p className="text-xs text-secondary mt-1">Funds will be deducted from this group's pool.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paymentOptions.map(opt => (
                                                <label key={opt.val} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === opt.val ? 'border-indigo-500 bg-indigo-500/5 shadow-sm shadow-indigo-500/10' : 'border-theme hover:bg-secondary/10'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === opt.val ? 'border-indigo-500' : 'border-secondary'}`}>
                                                            {paymentMethod === opt.val && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-primary flex items-center gap-2">
                                                                {opt.icon} {opt.label}
                                                            </p>
                                                            <p className="text-xs text-secondary">{opt.sub}</p>
                                                        </div>
                                                    </div>
                                                    <input type="radio" className="hidden" checked={paymentMethod === opt.val} onChange={() => setPaymentMethod(opt.val)} />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Stripe Card Element */}
                                {paymentMethod === 'stripe' && !isGroupPurchase && (
                                    <div className="p-4 bg-secondary/5 rounded-xl border border-theme">
                                        <p className="text-xs text-secondary mb-3 font-medium">Enter card details</p>
                                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                                        </div>
                                        <p className="text-xs text-tertiary mt-2">🔒 Secured by Stripe — we never see your card number</p>
                                    </div>
                                )}

                                {/* M-Pesa Phone Input */}
                                {paymentMethod === 'mpesa' && !isGroupPurchase && (
                                    <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                                        <p className="text-xs text-green-400 mb-3 font-medium">M-Pesa Phone Number</p>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 0712345678"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            className="w-full px-4 py-3 bg-secondary/10 border border-theme rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-green-500 transition-colors"
                                        />
                                        <p className="text-xs text-tertiary mt-2">📱 You'll receive an STK push on your phone</p>
                                    </div>
                                )}

                                <div className="border-t border-theme pt-4 space-y-3">
                                    <div className="flex justify-between text-secondary">
                                        <span>Subtotal</span>
                                        <span>${totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-secondary">
                                        <span>Fees</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-theme border-dashed">
                                        <span className="font-bold text-primary">Total</span>
                                        <span className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    className="w-full flex justify-center items-center py-3"
                                    variant="primary"
                                    onClick={handleCheckout}
                                    disabled={loading || !canPay}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5 mr-2" />
                                            {isGroupPurchase ? 'Confirm Group Checkout' : `Pay $${totalAmount.toFixed(2)}`}
                                        </>
                                    )}
                                </Button>

                                {!isGroupPurchase && paymentMethod === 'wallet' && walletBalance < totalAmount && (
                                    <p className="text-xs text-red-400 text-center">Insufficient wallet balance. Please top up or select another payment method.</p>
                                )}
                            </CardBody>
                        </Card>

                        <div className="flex items-center justify-center gap-2 text-xs text-tertiary">
                            <CreditCard className="w-4 h-4" /> Secure encrypted payment
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
