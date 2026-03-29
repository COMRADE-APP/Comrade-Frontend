import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Loader2, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsService } from '../../services/payments.service';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    const hasPhysicalItems = cartItems.some(item => 
        (item.type === 'product' && item.metadata?.product_type !== 'digital') ||
        (item.type === 'service' && item.metadata?.service_mode !== 'online')
    );

    // Initial load checks
    useEffect(() => {
        if (!location.state || cartItems.length === 0) {
            navigate('/shop');
            return;
        }

        // Fetch wallet balance if individual purchase
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

            if (purchaseType === 'group') {
                if (!selectedGroupId) {
                    throw new Error("No group selected for group purchase.");
                }
                payload.group_id = selectedGroupId;
                if (isMultiDestination) {
                    payload.is_multi_destination = true;
                }
                const response = await paymentsService.processGroupCheckout(payload);
                if (response?.approval_pending || response?.data?.approval_pending) {
                    const reqId = response?.checkout_request_id || response?.data?.checkout_request_id;
                    setCheckoutRequestId(reqId);
                    setApprovalPending(true);
                    setLoading(false);
                    return;
                }
            } else {
                await paymentsService.processCheckout(payload);
            }

            setSuccess(true);
        } catch (err) {
            console.error("Checkout error:", err);
            let errMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || err.message || "Checkout failed. Please try again.";
            
            if (typeof err.response?.data === 'object' && !err.response?.data?.detail && !err.response?.data?.error) {
                // Parse nested validation errors (e.g. {"amount": ["Too low"], "group": ["Invalid group"]})
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

    // Polling Effect for realtime checkout approval updates
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
            }, 3000); // poll every 3 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
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
                    <Button variant="outline" onClick={() => navigate('/shop')}>
                        Return to Shop
                    </Button>
                    <Button variant="primary" onClick={() => navigate(`/payments/groups/${selectedGroupId}?tab=approvals`)}>
                        View Pending Approvals
                    </Button>
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
                                            <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-theme hover:bg-secondary/10'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-primary' : 'border-secondary'}`}>
                                                        {paymentMethod === 'wallet' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary">Personal Wallet</p>
                                                        <p className="text-xs text-secondary">Balance: ${walletBalance.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </label>
                                            {/* Could add Stripe / PayPal here later */}
                                        </div>
                                    )}
                                </div>

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
                                    disabled={loading || (!isGroupPurchase && walletBalance < totalAmount && paymentMethod === 'wallet')}
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
                                    <p className="text-xs text-red-400 text-center">Insufficient wallet balance. Please top up your wallet.</p>
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
