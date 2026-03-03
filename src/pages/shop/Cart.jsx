import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Loader2, Package, AlertCircle
} from 'lucide-react';
import shopService from '../../services/shop.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

// Simple Cart Context (can be lifted to a provider later)
const useCartState = () => {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('shop_cart') || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('shop_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (service) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === service.id);
            if (existing) {
                return prev.map(i => i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...service, quantity: 1 }];
        });
    };

    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const updateQuantity = (id, qty) => {
        if (qty <= 0) return removeItem(id);
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    };
    const clearCart = () => setItems([]);
    const total = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);

    return { items, addItem, removeItem, updateQuantity, clearCart, total };
};

const Cart = () => {
    const navigate = useNavigate();
    const { items, removeItem, updateQuantity, clearCart, total } = useCartState();
    const [checkingOut, setCheckingOut] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setCheckingOut(true);
        try {
            // Separate product items from service items
            const productItems = items.filter(i => i.type === 'product' || !i.type);
            const serviceItems = items.filter(i => i.type === 'service');

            // Create product order if there are products
            if (productItems.length > 0) {
                await shopService.createOrder({
                    order_type: 'product',
                    delivery_mode: 'pickup',
                    items: productItems.map(item => ({
                        product_id: item.id,
                        quantity: item.quantity,
                    })),
                });
            }

            // Book service time slots individually
            for (const svc of serviceItems) {
                if (svc.timeSlotId) {
                    await shopService.bookTimeSlot(svc.timeSlotId);
                } else {
                    await shopService.createOrder({
                        order_type: 'service_appointment',
                        delivery_mode: 'appointment',
                        service_time_slot_id: svc.timeSlotId || undefined,
                        items: [],
                    });
                }
            }

            clearCart();
            toast.success('Order placed! Check your orders for tracking.');
            navigate('/shop/orders');
        } catch (err) {
            const detail = err.response?.data?.error || err.response?.data?.detail || 'Checkout failed. Please try again.';
            toast.error(detail);
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-secondary hover:text-primary mb-6">
                    <ArrowLeft size={18} /> Back to Shop
                </button>

                <h1 className="text-3xl font-bold text-primary flex items-center gap-3 mb-8">
                    <ShoppingCart /> Your Cart
                    <span className="text-lg font-normal text-secondary">({items.length} items)</span>
                </h1>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-primary mb-2">Your cart is empty</h3>
                        <p className="text-secondary mb-4">Browse services and add them to your cart</p>
                        <Button variant="primary" onClick={() => navigate('/shop')}>Browse Services</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map(item => (
                                <Card key={item.id}>
                                    <CardBody>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                                {item.category_icon || '📦'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-primary">{item.name}</h4>
                                                <p className="text-sm text-secondary line-clamp-1">{item.description}</p>
                                                <span className="text-sm text-green-600 font-bold">${item.price}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-primary"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center font-bold text-primary">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-primary"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-right min-w-[60px]">
                                                <p className="font-bold text-primary">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="p-2 text-tertiary hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>

                        {/* Summary */}
                        <div>
                            <Card className="sticky top-8">
                                <CardBody>
                                    <h3 className="font-bold text-primary mb-4">Order Summary</h3>
                                    <div className="space-y-3 mb-6">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-secondary">{item.name} x{item.quantity}</span>
                                                <span className="text-primary">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <hr className="border-theme" />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span className="text-primary">Total</span>
                                            <span className="text-green-600">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={handleCheckout} disabled={checkingOut} className="w-full">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        {checkingOut ? 'Processing...' : 'Checkout'}
                                    </Button>
                                    <button onClick={clearCart} className="w-full text-center text-sm text-red-500 hover:text-red-600 mt-3">
                                        Clear Cart
                                    </button>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
