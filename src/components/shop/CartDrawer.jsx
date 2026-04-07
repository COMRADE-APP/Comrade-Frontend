import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Package, Briefcase, ShoppingBag, X, ChevronRight, User, Users } from 'lucide-react';
import Button from '../common/Button';
import { useCart } from '../../contexts/CartContext';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function CartDrawer() {
    const cart = useCart();
    const navigate = useNavigate();

    if (!cart.cartOpen) return null;

    const handleCheckout = () => {
        if (cart.items.length === 0) return;
        navigate('/payments/checkout', {
            state: {
                cartItems: cart.items,
                purchaseType: cart.purchaseType || 'individual',
                selectedGroupId: cart.selectedGroupId || null,
                selectedGroup: cart.purchaseType === 'group'
                    ? (cart.paymentGroups || []).find(g => g.id === cart.selectedGroupId)
                    : null,
                totalAmount: cart.total,
            }
        });
        cart.clearCart();
        cart.setCartOpen(false);
    };

    const getItemIcon = (type) => {
        switch (type) {
            case 'service': return <Briefcase size={18} className="text-indigo-400" />;
            case 'product': return <ShoppingBag size={18} className="text-primary-500" />;
            default: return <Package size={18} className="text-tertiary" />;
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => cart.setCartOpen(false)} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-elevated border-l border-theme z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-5 border-b border-theme">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <ShoppingCart size={20} className="text-primary" /> Cart
                        {cart.count > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{cart.count}</span>}
                    </h2>
                    <button onClick={() => cart.setCartOpen(false)} className="p-2 hover:bg-secondary/40 rounded-xl transition-colors"><X size={20} className="text-secondary" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                                <ShoppingBag size={28} className="text-tertiary opacity-50" />
                            </div>
                            <p className="text-secondary font-medium">Your cart is empty</p>
                            <p className="text-xs text-tertiary mt-1">Add products or services to get started</p>
                        </div>
                    ) : (
                        cart.items.map(item => (
                            <div key={`${item.type}-${item.id}`} className="flex gap-3 p-3 bg-secondary/10 rounded-xl border border-theme hover:bg-secondary/20 transition-colors">
                                <div className="w-14 h-14 rounded-xl bg-elevated border border-theme flex items-center justify-center overflow-hidden shrink-0">
                                    {item.image ? <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" /> : getItemIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-primary truncate">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {getItemIcon(item.type)}
                                        <span className="text-xs text-secondary capitalize">{item.type}</span>
                                    </div>
                                    <p className="text-sm font-bold text-primary mt-1">
                                        ${(Number(item.price) || 0).toFixed(2)} 
                                        {cart.getMultiplier(item) > 1 && <span className="text-xs text-secondary font-medium ml-2">x {cart.getMultiplier(item)} members</span>}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button onClick={() => cart.removeItem(item.id, item.type)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    <div className="flex items-center gap-0.5 bg-elevated rounded-lg border border-theme">
                                        {cart.getMultiplier(item) > 1 && <span className="text-xs font-bold px-2 text-tertiary">×{cart.getMultiplier(item)}</span>}
                                        <button onClick={() => cart.updateQty(item.id, item.type, item.qty - 1)} className="p-1.5 hover:bg-secondary/40 rounded-l-lg transition-colors"><Minus size={12} className="text-secondary" /></button>
                                        <span className="text-xs font-bold px-2 text-primary min-w-[24px] text-center">{item.qty}</span>
                                        <button onClick={() => cart.updateQty(item.id, item.type, item.qty + 1)} className="p-1.5 hover:bg-secondary/40 rounded-r-lg transition-colors"><Plus size={12} className="text-secondary" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {cart.items.length > 0 && (
                    <div className="p-5 border-t border-theme space-y-4">
                        {/* Purchase Type Toggle */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Purchase Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => cart.setPurchaseType?.('individual')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all ${cart.purchaseType !== 'group'
                                        ? 'bg-primary-600/10 border-primary-600/30 text-primary-500'
                                        : 'border-theme text-secondary hover:bg-secondary/20'
                                        }`}
                                >
                                    <User size={14} /> Individual
                                </button>
                                <button
                                    onClick={() => cart.setPurchaseType?.('group')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all ${cart.purchaseType === 'group'
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                        : 'border-theme text-secondary hover:bg-secondary/20'
                                        }`}
                                >
                                    <Users size={14} /> Group Purchase
                                </button>
                            </div>
                            {cart.purchaseType === 'group' && (
                                <div className="space-y-2">
                                    <select
                                        value={cart.selectedGroupId || ''}
                                        onChange={(e) => cart.setSelectedGroupId?.(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-secondary/10 border border-theme rounded-xl text-sm text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Select a group...</option>
                                        {(cart.paymentGroups || []).map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.member_count || 0} members)</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-tertiary">Sharable items: 1 product shared by all. Non-sharable: 1 per member.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-secondary">Subtotal</span>
                            <span className="text-lg font-bold text-primary">${cart.total.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={cart.clearCart}>Clear Cart</Button>
                            <Button variant="primary" size="sm" className="flex-1" onClick={handleCheckout} disabled={cart.purchaseType === 'group' && !cart.selectedGroupId}>
                                Checkout <ChevronRight size={16} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
