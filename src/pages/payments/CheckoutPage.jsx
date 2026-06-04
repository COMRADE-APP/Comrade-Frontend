import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Loader2, CheckCircle, Package, Smartphone, Building2, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import paymentsService from '../../services/payments.service';
import paymentProcessingService from '../../services/paymentProcessing.service';
import { detectCurrency } from '../../utils/currencyUtils';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

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
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [gatewayConfig, setGatewayConfig] = useState(null);

    // State coming from cart navigation
    const {
        cartItems = [],
        purchaseType = 'individual',
        selectedGroupId = null,
        selectedGroup = null,
        totalAmount = 0,
        isMultiDestination = false
    } = location.state || {};
    
    const flwConfig = {
        public_key: gatewayConfig?.gateways?.flutterwave?.public_key || '',
        tx_ref: Date.now().toString(),
        amount: totalAmount || 0,
        currency: detectCurrency('USD'),
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || 'user@example.com',
            phone_number: '',
            name: user?.first_name || 'Customer',
        },
        customizations: {
            title: 'Qomrade Checkout',
            description: 'Payment for items',
        },
    };
    const handleFlutterPayment = useFlutterwave(flwConfig);
    
    const triggerFlutterwave = (txRef, amount, method, phone) => {
        handleFlutterPayment({
            ...flwConfig,
            tx_ref: txRef,
            amount: amount,
            currency: detectCurrency(method === 'mpesa' ? 'KES' : 'USD'),
            customer: {
                ...flwConfig.customer,
                phone_number: phone,
            },
            callback: async (response) => {
                closePaymentModal();
                try {
                    setLoading(true);
                    await paymentProcessingService.verifyFlutterwavePayment({
                        transaction_id: response.transaction_id,
                        tx_ref: response.tx_ref
                    });
                    
                    // If it was a group contribution, we need to call the contribution endpoint
                    if (purchaseType === 'group_contribution') {
                        const roundItem = cartItems.find(item => item.type === 'round_contribution');
                        if (roundItem) {
                            const roundId = roundItem.id || roundItem.roundId;
                            const res = await paymentsService.contributeToRound(roundId, {
                                amount: roundItem.price
                            });
                            window.lastRoundContribution = res;
                        }
                    } else if (purchaseType === 'group') {
                        // Check if we need to manually trigger approval
                        // Since it was funded, the backend escrow webhook will handle it or we can just show success
                    }
                    
                    setSuccess(true);
                } catch (e) {
                    setError('Payment verification failed.');
                } finally {
                    setLoading(false);
                }
            },
            onClose: () => {
                setError('Payment modal closed.');
            }
        });
    };

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
        paymentProcessingService.getGatewayConfig()
            .then(res => setGatewayConfig(res))
            .catch(console.error);
            
        if (!location.state || cartItems.length === 0) {
            navigate('/shop');
            return;
        }
        // Always fetch wallet balance regardless of purchase type
        paymentsService.getBalance()
            .then(res => {
                console.log('Balance response:', res);
                const balance = res?.balance ?? res?.display_balance ?? res?.available_balance ?? 0;
                setWalletBalance(typeof balance === 'number' ? balance : parseFloat(balance) || 0);
            })
            .catch(err => {
                console.error("Error fetching balance:", err);
                setWalletBalance(0);
            });
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
            // ── ROUND CONTRIBUTION ──
            else if (purchaseType === 'group_contribution') {
                const roundItem = cartItems.find(item => item.type === 'round_contribution');
                if (!roundItem) throw new Error("No round contribution found.");
                
                const roundId = roundItem.id || roundItem.roundId;
                
                // For wallet payments, use the contributeToRound API directly
                const response = await paymentsService.contributeToRound(roundId, {
                    amount: roundItem.price
                });
                if (response?.error) {
                    throw new Error(response.error);
                }
                // Store the round response for success display
                window.lastRoundContribution = response;
            }
            // ── FLUTTERWAVE / CARD / MPESA (Inline) ──
            else if (paymentMethod === 'stripe' || paymentMethod === 'mpesa' || paymentMethod === 'flutterwave') {
                if (paymentMethod === 'mpesa' && !phoneNumber) throw new Error('Phone number is required for M-Pesa.');
                
                // Get transaction token from backend
                const intentResult = await paymentProcessingService.processPayment({
                    amount: totalAmount,
                    currency: detectCurrency(paymentMethod === 'mpesa' ? 'KES' : 'USD'),
                    payment_method: paymentMethod,
                    phone_number: phoneNumber,
                    description: `Checkout: ${cartItems.length} items`,
                });
                
                if (intentResult?.provider_response?.status !== 'ready_for_inline') {
                     throw new Error('Failed to initialize payment gateway.');
                }
                
                const txRef = intentResult.transaction?.transaction_code;
                
                // We use standard fetch here to avoid hook rule violations, or we can just call handleFlutterPayment
                // But handleFlutterPayment comes from useFlutterwave. We must declare it at the top level of the component!
                // We will handle it by setting a state to trigger the modal, or we can just use the hook function directly.
                // We'll call triggerFlutterwave which is defined above.
                triggerFlutterwave(txRef, totalAmount, paymentMethod, phoneNumber);
                return; // Return early, success will be set by the callback
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
                if (document.hidden) return;
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

    useEffect(() => {
        const onVisible = () => {
            if (!document.hidden && approvalPending && checkoutRequestId && selectedGroupId) {
                (async () => {
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
                    } catch (e) {}
                })();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [approvalPending, checkoutRequestId, selectedGroupId]);

    if (approvalPending) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
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
        const hasContribution = cartItems.some(item => item.type === 'contribution' || item.contribution_type);
        const hasDigitalItems = cartItems.every(item =>
            item.metadata?.product_type === 'digital' ||
            item.metadata?.service_mode === 'online' ||
            item.type === 'funding' ||
            item.type === 'booking'
        );

        const getSuccessTitle = () => {
            if (hasFundingItem) return 'Investment Successful!';
            if (hasContribution) return 'Contribution Recorded!';
            if (purchaseType === 'group') return 'Group Payment Successful!';
            if (hasDigitalItems) return 'Purchase Complete!';
            return 'Payment Successful!';
        };

        const getSuccessMessage = () => {
            if (hasFundingItem) return 'Your investment has been processed. Track your returns in the Funding Hub.';
            if (hasContribution) return 'Your contribution to the group savings has been recorded.';
            if (purchaseType === 'group') return 'The group payment has been split and processed among members.';
            if (hasDigitalItems) return 'Your digital items are now available in your library.';
            return 'Your order has been placed successfully and will be delivered soon.';
        };

        const getPrimaryAction = () => {
            if (hasFundingItem) return { label: 'Track Investment', path: '/funding/history' };
            if (hasContribution) return { label: 'View Group', path: `/payments/groups/${selectedGroupId || ''}` };
            if (hasDigitalItems) return { label: 'My Library', path: '/library' };
            return { label: 'View Orders', path: '/shop/orders' };
        };

        const getSecondaryAction = () => {
            if (hasFundingItem) return { label: 'Browse Funding Hub', path: '/funding' };
            if (hasContribution) return { label: 'View Analytics', path: `/payments/groups/${selectedGroupId || ''}?tab=analytics` };
            if (hasDigitalItems) return { label: 'Continue Shopping', path: '/shop' };
            return { label: 'Continue Shopping', path: '/shop' };
        };

        const primaryAction = getPrimaryAction();
        const secondaryAction = getSecondaryAction();

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">{getSuccessTitle()}</h1>
                <p className="text-secondary max-w-md text-center mb-6">
                    {getSuccessMessage()}
                </p>

                {/* Order Summary Card */}
                <Card className="w-full max-w-md mb-6">
                    <CardBody className="p-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">Items</span>
                                <span className="text-sm font-medium text-primary">{cartItems.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">Total Amount</span>
                                <span className="text-lg font-bold text-primary">{formatMoneySimple(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">Payment Method</span>
                                <span className="text-sm font-medium text-primary capitalize">{paymentMethod === 'stripe' ? 'Card' : paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">Date</span>
                                <span className="text-sm font-medium text-primary">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Item List */}
                        <div className="mt-4 pt-4 border-t border-theme space-y-2">
                            {cartItems.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-primary truncate max-w-[200px]">{item.name}</span>
                                    <span className="font-medium text-primary">{formatMoneySimple(item.price)}</span>
                                </div>
                            ))}
                            {cartItems.length > 3 && (
                                <div className="text-xs text-tertiary text-center">
                                    + {cartItems.length - 3} more items
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Next Steps */}
                <div className="w-full max-w-md space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">Next Steps</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <span className="text-emerald-500 text-xs font-bold">1</span>
                            </div>
                            <span className="text-primary">
                                {hasDigitalItems ? 'Access your items from your library' : 'Track your order status'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <span className="text-emerald-500 text-xs font-bold">2</span>
                            </div>
                            <span className="text-primary">
                                {hasFundingItem ? 'Monitor your investment returns' : 'Check delivery updates'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <span className="text-emerald-500 text-xs font-bold">3</span>
                            </div>
                            <span className="text-primary">Share with friends or request support</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate(secondaryAction.path)}>
                        {secondaryAction.label}
                    </Button>
                    <Button variant="primary" onClick={() => navigate(primaryAction.path)}>
                        {primaryAction.label}
                    </Button>
                </div>
            </div>
        );
    }

    const isGroupPurchase = purchaseType === 'group';

    // Payment options for individual checkout
    const paymentOptions = [];
    paymentOptions.push({ 
        val: 'wallet', 
        label: 'Personal Wallet', 
        icon: <CreditCard className="w-4 h-4" />, 
        sub: `Balance: $${(Number(walletBalance) || 0).toFixed(2)}` 
    });
    if (hasStripe) paymentOptions.push({ val: 'stripe', label: 'Card / Apple Pay', icon: <CreditCard className="w-4 h-4 text-amber-400" />, sub: 'Visa, Mastercard, Amex' });
    if (hasMpesa) paymentOptions.push({ val: 'mpesa', label: 'M-Pesa', icon: <Smartphone className="w-4 h-4 text-green-400" />, sub: 'Safaricom STK Push' });
    if (hasFlutterwave) paymentOptions.push({ val: 'flutterwave', label: 'Bank Transfer', icon: <Building2 className="w-4 h-4 text-amber-400" />, sub: 'Equity, KCB, DTB, Absa & more' });
    if (hasPaypal) paymentOptions.push({ val: 'paypal', label: 'PayPal', icon: <Globe className="w-4 h-4 text-emerald-400" />, sub: 'PayPal / Venmo' });

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
                                    <Package className="w-5 h-5 mr-2 text-amber-500" /> Order Summary
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
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Group Finance</span>
                                            </div>
                                            <p className="font-medium text-primary line-clamp-1">{selectedGroup?.name || 'Selected Group'}</p>
                                            <p className="text-xs text-secondary mt-1">Funds will be deducted from this group's pool.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paymentOptions.map(opt => (
                                                <label key={opt.val} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === opt.val ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10' : 'border-theme hover:bg-secondary/10'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === opt.val ? 'border-amber-500' : 'border-secondary'}`}>
                                                            {paymentMethod === opt.val && <div className="w-2 h-2 rounded-full bg-amber-500" />}
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
                                        <p className="text-xs text-tertiary mt-2">📱 Used for M-Pesa mobile money checkout</p>
                                    </div>
                                )}

                                <div className="border-t border-theme pt-4 space-y-3">
                                    <div className="flex justify-between text-secondary">
                                        <span>Subtotal</span>
                                        <span>${(Number(totalAmount) || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-secondary">
                                        <span>Fees</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-theme border-dashed">
                                        <span className="font-bold text-primary">Total</span>
                                        <span className="text-xl font-bold text-primary">${(Number(totalAmount) || 0).toFixed(2)}</span>
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
                                            {isGroupPurchase ? 'Confirm Group Checkout' : `Pay $${(Number(totalAmount) || 0).toFixed(2)}`}
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
