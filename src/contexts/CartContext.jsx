import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { paymentsService } from '../services/payments.service';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('comrade_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('comrade_cart', JSON.stringify(items));
    }, [items]);

    // Fetch payment groups when switching to group mode
    useEffect(() => {
        if (purchaseType === 'group' && paymentGroups.length === 0) {
            (async () => {
                try {
                    const data = await paymentsService.getMyGroups();
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    setPaymentGroups(list);
                } catch (e) { console.error('Failed to load payment groups:', e); }
            })();
        }
    }, [purchaseType]);

    const addItem = useCallback((item) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i.id === item.id && i.type === item.type);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
                return updated;
            }
            return [...prev, { ...item, qty: 1 }];
        });
    }, []);

    const removeItem = useCallback((id, type) => {
        setItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
    }, []);

    const updateQty = useCallback((id, type, qty) => {
        if (qty < 1) return removeItem(id, type);
        setItems(prev => prev.map(i => i.id === id && i.type === type ? { ...i, qty } : i));
    }, [removeItem]);

    const clearCart = useCallback(() => { setItems([]); setPurchaseType('individual'); setSelectedGroupId(''); }, []);

    const getMultiplier = useCallback((item) => {
        if (purchaseType === 'group' && selectedGroupId) {
            const group = paymentGroups.find(g => String(g.id) === String(selectedGroupId));
            const memberCount = group?.member_count || group?.members?.length || 1;
            if (item.is_sharable) return 1;
            return memberCount;
        }
        return 1;
    }, [purchaseType, selectedGroupId, paymentGroups]);

    const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty * getMultiplier(i), 0);
    const count = items.reduce((sum, i) => sum + i.qty * getMultiplier(i), 0);

    const value = {
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        total,
        count,
        purchaseType,
        setPurchaseType,
        selectedGroupId,
        setSelectedGroupId,
        paymentGroups,
        getMultiplier,
        cartOpen,
        setCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
