import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag, UtensilsCrossed, Hotel, Store, Briefcase,
    Star, MapPin, Truck, Package, Clock, Plus, ArrowRight,
    Check, X, Loader2, ShoppingCart, Minus, Trash2, ChevronRight,
    CalendarCheck, ClipboardList, Bell, Eye
} from 'lucide-react';
import shopService from '../../services/shop.service';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

// --- Service Categories ---
const SERVICE_CATEGORIES = [
    { key: 'legal', label: 'Legal', icon: '⚖️' },
    { key: 'consultancy', label: 'Consultancy', icon: '💼' },
    { key: 'fashion', label: 'Fashion', icon: '👗' },
    { key: 'hairdressing', label: 'Hairdressing', icon: '💇' },
    { key: 'beauty', label: 'Beauty', icon: '💄' },
    { key: 'makeup', label: 'Makeup', icon: '🎨' },
    { key: 'barbering', label: 'Barbering', icon: '✂️' },
    { key: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { key: 'banking', label: 'Banking Services', icon: '🏦' },
    { key: 'education', label: 'College & Tertiary', icon: '🎓' },
    { key: 'tutoring', label: 'Tutoring', icon: '📚' },
    { key: 'electricals', label: 'Electricals & Phones', icon: '📱' },
    { key: 'health', label: 'Health & Wellness', icon: '🩺' },
    { key: 'automotive', label: 'Automotive', icon: '🚗' },
    { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { key: 'photography', label: 'Photography', icon: '📷' },
    { key: 'catering', label: 'Catering', icon: '🍽️' },
    { key: 'other', label: 'Other', icon: '📦' },
];

const TABS = [
    { key: 'all', label: 'All', icon: ShoppingBag },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
    { key: 'hotels', label: 'Hotels & Stays', icon: Hotel },
    { key: 'shops', label: 'Supermarkets & Stores', icon: Store },
    { key: 'services', label: 'Services', icon: Briefcase },
    { key: 'orders', label: 'My Orders', icon: ClipboardList },
    { key: 'my-services', label: 'My Services', icon: CalendarCheck },
];

const FOOD_TYPES = ['restaurant', 'coffee_shop', 'food_shop'];
const HOTEL_TYPES = ['hotel'];
const STORE_TYPES = ['supermarket', 'store'];
const SERVICE_TYPES = ['service_provider'];

// --- Cart Context (local) ---
const useCart = () => {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('comrade_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('comrade_cart', JSON.stringify(items));
    }, [items]);

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

    const clearCart = useCallback(() => setItems([]), []);

    const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty, 0);
    const count = items.reduce((sum, i) => sum + i.qty, 0);

    return { items, addItem, removeItem, updateQty, clearCart, total, count };
};

// --- Star Rating ---
const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-1 mb-2">
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={`${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
        <span className="text-xs text-secondary font-medium ml-1">
            {Number(rating).toFixed(1)} <span className="text-tertiary">({count})</span>
        </span>
    </div>
);

// --- Establishment Card ---
const EstablishmentCard = ({ establishment, onClick }) => {
    const { name, description, establishment_type, establishment_type_display, categories, city, country, rating, review_count, logo, banner, delivery_available, pickup_available, dine_in_available, is_verified } = establishment;
    return (
        <div className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full" onClick={onClick}>
            <div className="h-40 w-full bg-secondary/10 relative overflow-hidden shrink-0">
                {banner ? (
                    <img src={banner} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <Store className="text-tertiary opacity-20" size={48} />
                    </div>
                )}
                <div className="absolute -bottom-6 left-4">
                    <div className="w-12 h-12 rounded-xl border-2 border-elevated bg-elevated overflow-hidden shadow-sm">
                        {logo ? <img src={logo} alt={name} className="w-full h-full object-cover" /> : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{name?.charAt(0)}</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 pt-8 flex flex-col flex-1">
                <div className="mb-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-lg text-primary leading-tight line-clamp-1">
                            {name} {is_verified && <Check size={14} className="text-blue-500 inline ml-0.5" />}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${establishment_type === 'restaurant' ? 'bg-orange-500/10 text-orange-600' :
                                establishment_type === 'hotel' ? 'bg-blue-500/10 text-blue-600' :
                                    establishment_type === 'coffee_shop' ? 'bg-amber-600/10 text-amber-700' :
                                        establishment_type === 'supermarket' ? 'bg-emerald-500/10 text-emerald-600' :
                                            establishment_type === 'service_provider' ? 'bg-indigo-500/10 text-indigo-600' :
                                                'bg-purple-500/10 text-purple-600'
                            }`}>
                            {establishment_type_display || establishment_type}
                        </span>
                    </div>
                    <StarRating rating={rating || 0} count={review_count || 0} />
                </div>
                <p className="text-sm text-secondary line-clamp-2 mb-3 flex-1">{description}</p>
                <div className="space-y-3 mt-auto">
                    {(city || country) && (
                        <div className="flex items-center gap-1.5 text-xs text-secondary">
                            <MapPin size={14} className="text-tertiary shrink-0" />
                            <span className="truncate">{[city, country].filter(Boolean).join(', ')}</span>
                        </div>
                    )}
                    {categories && Array.isArray(categories) && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {categories.slice(0, 3).map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-xs font-medium">{cat}</span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-3 pt-3 border-t border-theme">
                        {pickup_available && <div className="flex items-center gap-1 text-xs text-secondary" title="Pickup Available"><Package size={14} className="text-green-600" /><span>Pickup</span></div>}
                        {delivery_available && <div className="flex items-center gap-1 text-xs text-secondary" title="Delivery Available"><Truck size={14} className="text-green-600" /><span>Delivery</span></div>}
                        {dine_in_available && <div className="flex items-center gap-1 text-xs text-secondary" title="Dine-in Available"><UtensilsCrossed size={14} className="text-green-600" /><span>Dine-in</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Product Card with Add to Cart ---
const ProductCard = ({ product, onClick, onAddToCart }) => (
    <div className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col h-full" onClick={onClick}>
        <div className="h-40 sm:h-44 md:h-48 w-full bg-secondary/5 relative overflow-hidden shrink-0">
            {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/5 to-secondary/10 flex items-center justify-center">
                    <ShoppingBag size={36} className="text-tertiary opacity-30" />
                </div>
            )}
            <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md
                    ${product.product_type === 'service' ? 'bg-indigo-500/90 text-white' :
                        product.product_type === 'digital' ? 'bg-purple-500/90 text-white' :
                            product.product_type === 'subscription' ? 'bg-amber-500/90 text-white' :
                                'bg-white/90 text-slate-800 border border-slate-200 shadow-sm'
                    }`}>
                    {product.product_type}
                </span>
            </div>
        </div>
        <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
            <div>
                <h3 className="font-bold text-sm sm:text-base text-primary line-clamp-2 leading-snug mb-1">{product.name}</h3>
                <p className="text-xs sm:text-sm text-secondary line-clamp-2">{product.description}</p>
            </div>
            <div className="mt-auto pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-theme">
                <span className="text-base sm:text-lg font-bold text-primary">${(Number(product.price) || 0).toFixed(2)}</span>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-initial" onClick={(e) => { e.stopPropagation(); onAddToCart?.({ id: product.id, name: product.name, price: product.price, type: 'product', image: product.image_url }); }}>
                        <ShoppingCart size={14} className="mr-1" /> Add
                    </Button>
                    <Button size="sm" variant="primary" className="h-8 text-xs flex-1 sm:flex-initial">
                        <Eye size={14} className="mr-1" /> View
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

// --- Cart Drawer ---
const CartDrawer = ({ cart, open, onClose, onCheckout, checkoutLoading, checkoutMsg }) => {
    if (!open) return null;
    const getItemIcon = (type) => {
        switch (type) {
            case 'service': return <Briefcase size={18} className="text-indigo-400" />;
            case 'product': return <ShoppingBag size={18} className="text-purple-400" />;
            default: return <Package size={18} className="text-tertiary" />;
        }
    };
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-elevated border-l border-theme z-50 flex flex-col shadow-2xl animate-slide-in-right">
                <div className="flex items-center justify-between p-5 border-b border-theme">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <ShoppingCart size={20} className="text-primary" /> Cart
                        {cart.count > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{cart.count}</span>}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary/40 rounded-xl transition-colors"><X size={20} className="text-secondary" /></button>
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
                                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : getItemIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-primary truncate">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {getItemIcon(item.type)}
                                        <span className="text-xs text-secondary capitalize">{item.type}</span>
                                    </div>
                                    <p className="text-sm font-bold text-primary mt-1">${(Number(item.price) || 0).toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button onClick={() => cart.removeItem(item.id, item.type)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    <div className="flex items-center gap-0.5 bg-elevated rounded-lg border border-theme">
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
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-secondary">Subtotal</span>
                            <span className="text-lg font-bold text-primary">${cart.total.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={cart.clearCart} disabled={checkoutLoading}>Clear Cart</Button>
                            <Button variant="primary" size="sm" className="flex-1" onClick={onCheckout} disabled={checkoutLoading}>
                                {checkoutLoading ? 'Processing...' : 'Checkout'} {!checkoutLoading && <ChevronRight size={16} className="ml-1" />}
                            </Button>
                        </div>
                        {checkoutMsg?.text && (
                            <div className={`text-sm p-3 rounded-lg ${checkoutMsg.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                {checkoutMsg.text}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

// --- Orders Tab ---
const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const [ordersData, bookingsData] = await Promise.allSettled([
                shopService.getOrders(),
                shopService.getBookings(),
            ]);
            if (ordersData.status === 'fulfilled') {
                const raw = ordersData.value?.results || ordersData.value || [];
                setOrders(Array.isArray(raw) ? raw : []);
            }
            if (bookingsData.status === 'fulfilled') {
                const raw = bookingsData.value?.results || bookingsData.value || [];
                setBookings(Array.isArray(raw) ? raw : []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const statusColors = {
        pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        processing: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
        ready_for_pickup: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        completed: 'bg-green-500/10 text-green-600 border-green-500/20',
        cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" size={24} /></div>;

    return (
        <div className="space-y-8">
            {/* Orders */}
            <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Package size={20} /> Orders</h3>
                {orders.length === 0 ? (
                    <Card><CardBody className="text-center py-12 text-secondary">No orders yet. Start shopping!</CardBody></Card>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <Card key={order.id}>
                                <CardBody className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-bold text-primary">Order #{String(order.id).slice(0, 8)}</span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[order.status] || 'bg-secondary/10 text-secondary border-theme'}`}>
                                                {(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-secondary">
                                            {order.items?.length || 0} items • ${Number(order.total_amount || 0).toFixed(2)}
                                            {order.created_at && ` • ${new Date(order.created_at).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    {order.status === 'shipped' && (
                                        <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 px-3 py-1 rounded-full">
                                            <Truck size={14} /> In Transit
                                        </div>
                                    )}
                                    {order.status === 'ready_for_pickup' && (
                                        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                                            <Package size={14} /> Ready for Pickup
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Bookings */}
            <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><CalendarCheck size={20} /> Service Bookings</h3>
                {bookings.length === 0 ? (
                    <Card><CardBody className="text-center py-12 text-secondary">No bookings yet.</CardBody></Card>
                ) : (
                    <div className="space-y-3">
                        {bookings.map(booking => (
                            <Card key={booking.id}>
                                <CardBody className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-primary">{booking.service_name || booking.establishment_name || 'Booking'}</p>
                                        <p className="text-xs text-secondary">
                                            {booking.booking_date && new Date(booking.booking_date).toLocaleDateString()}
                                            {booking.time_slot_display && ` at ${booking.time_slot_display}`}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[booking.status] || 'bg-secondary/10 text-secondary border-theme'}`}>
                                        {(booking.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- My Services Tab (Creator) ---
const MyServicesTab = ({ navigate }) => {
    const [myEstablishments, setMyEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddService, setShowAddService] = useState(false);
    const [serviceForm, setServiceForm] = useState({
        name: '', description: '', category: '', price: '', duration_minutes: '60',
        service_mode: 'in_person', delay_time_minutes: '0', max_slots: '5',
        establishment: '',
    });

    useEffect(() => { loadMyEstablishments(); }, []);

    const loadMyEstablishments = async () => {
        setLoading(true);
        try {
            const data = await shopService.getMyEstablishments();
            const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
            setMyEstablishments(list);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        try {
            await shopService.createService({
                ...serviceForm,
                price: parseFloat(serviceForm.price),
                duration_minutes: parseInt(serviceForm.duration_minutes),
                delay_time_minutes: parseInt(serviceForm.delay_time_minutes),
                max_slots_per_day: parseInt(serviceForm.max_slots),
            });
            setShowAddService(false);
            setServiceForm({ name: '', description: '', category: '', price: '', duration_minutes: '60', service_mode: 'in_person', delay_time_minutes: '0', max_slots: '5', establishment: '' });
            alert('Service created successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to create service');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" size={24} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">My Services & Establishments</h3>
                <Button variant="primary" size="sm" onClick={() => setShowAddService(!showAddService)}>
                    <Plus size={16} className="mr-1" /> Add Service
                </Button>
            </div>

            {/* Add Service Form */}
            {showAddService && (
                <Card>
                    <CardBody>
                        <h4 className="font-semibold text-primary mb-4">Create New Service</h4>
                        <form onSubmit={handleCreateService} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Service Name *</label>
                                    <input className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Category *</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={serviceForm.category} onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })} required>
                                        <option value="">Select category</option>
                                        {SERVICE_CATEGORIES.map(cat => (
                                            <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Price *</label>
                                    <input type="number" step="0.01" min="0" className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Duration (min) *</label>
                                    <input type="number" min="5" className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Delay Time (min)</label>
                                    <input type="number" min="0" className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary outline-none" value={serviceForm.delay_time_minutes} onChange={e => setServiceForm({ ...serviceForm, delay_time_minutes: e.target.value })} />
                                    <p className="text-[10px] text-tertiary mt-0.5">Time between appointments</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Max Slots/Day</label>
                                    <input type="number" min="1" className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary outline-none" value={serviceForm.max_slots} onChange={e => setServiceForm({ ...serviceForm, max_slots: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Service Mode</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={serviceForm.service_mode} onChange={e => setServiceForm({ ...serviceForm, service_mode: e.target.value })}>
                                        <option value="in_person">In Person</option>
                                        <option value="online">Online / Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="home_visit">Home Visit</option>
                                    </select>
                                </div>
                                {myEstablishments.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Establishment</label>
                                        <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={serviceForm.establishment} onChange={e => setServiceForm({ ...serviceForm, establishment: e.target.value })}>
                                            <option value="">None (Independent)</option>
                                            {myEstablishments.map(est => (
                                                <option key={est.id} value={est.id}>{est.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Description *</label>
                                <textarea className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500 resize-none" rows={3} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} required />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" type="button" onClick={() => setShowAddService(false)}>Cancel</Button>
                                <Button variant="primary" type="submit">Create Service</Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            )}

            {/* Service Categories Browse */}
            <Card>
                <CardBody>
                    <h4 className="font-semibold text-primary mb-3">Service Categories</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {SERVICE_CATEGORIES.map(cat => (
                            <div key={cat.key} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors border border-transparent hover:border-theme text-center">
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-xs font-medium text-primary leading-tight">{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* My Establishments */}
            {myEstablishments.length > 0 && (
                <div>
                    <h4 className="font-semibold text-primary mb-3">Your Establishments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myEstablishments.map(est => (
                            <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Shop Component ---
export default function Shop() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const cart = useCart();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, establishmentsData, servicesData] = await Promise.allSettled([
                shopService.getProducts(),
                shopService.getEstablishments(),
                shopService.getServices(),
            ]);
            if (productsData.status === 'fulfilled') {
                const raw = productsData.value?.results || productsData.value;
                setProducts(Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : []);
            }
            if (establishmentsData.status === 'fulfilled') {
                const raw = establishmentsData.value?.results || establishmentsData.value;
                setEstablishments(Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : []);
            }
            if (servicesData.status === 'fulfilled') {
                const raw = servicesData.value?.results || servicesData.value;
                setServices(Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : []);
            }
        } catch (e) { console.error('Error loading shop data:', e); }
        finally { setLoading(false); }
    };

    const search = searchQuery.toLowerCase();
    const filteredProducts = useMemo(() => products.filter(p => (p.name || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search)), [products, search]);
    const filteredEstablishments = useMemo(() => {
        let list = establishments.filter(e => (e.name || '').toLowerCase().includes(search) || (e.description || '').toLowerCase().includes(search));
        if (activeTab === 'food') list = list.filter(e => FOOD_TYPES.includes(e.establishment_type));
        else if (activeTab === 'hotels') list = list.filter(e => HOTEL_TYPES.includes(e.establishment_type));
        else if (activeTab === 'shops') list = list.filter(e => STORE_TYPES.includes(e.establishment_type));
        return list;
    }, [establishments, search, activeTab]);
    const filteredServices = useMemo(() => services.filter(s => (s.name || '').toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search)), [services, search]);
    const serviceEstablishments = useMemo(() => establishments.filter(e => SERVICE_TYPES.includes(e.establishment_type) && ((e.name || '').toLowerCase().includes(search) || (e.description || '').toLowerCase().includes(search))), [establishments, search]);

    const foodCount = establishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).length;
    const hotelCount = establishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).length;
    const storeCount = establishments.filter(e => STORE_TYPES.includes(e.establishment_type)).length;
    const serviceCount = services.length + establishments.filter(e => SERVICE_TYPES.includes(e.establishment_type)).length;
    const counts = { all: products.length + establishments.length, products: products.length, food: foodCount, hotels: hotelCount, shops: storeCount, services: serviceCount };

    const showProducts = activeTab === 'all' || activeTab === 'products';
    const showFood = activeTab === 'all' || activeTab === 'food';
    const showHotels = activeTab === 'all' || activeTab === 'hotels';
    const showStores = activeTab === 'all' || activeTab === 'shops';
    const showServices = activeTab === 'all' || activeTab === 'services';

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutMsg, setCheckoutMsg] = useState({ type: '', text: '' });

    const handleCheckout = async () => {
        if (cart.items.length === 0) return;
        setCheckoutLoading(true);
        setCheckoutMsg({ type: '', text: '' });
        try {
            // Separate product items from service items
            const productItems = cart.items.filter(i => i.type === 'product');
            const serviceItems = cart.items.filter(i => i.type === 'service');

            // Create product order if there are products
            if (productItems.length > 0) {
                await shopService.createOrder({
                    order_type: 'product',
                    delivery_mode: 'pickup',
                    items: productItems.map(item => ({
                        product_id: item.id,
                        quantity: item.qty,
                    })),
                });
            }

            // Book service time slots individually
            for (const svc of serviceItems) {
                if (svc.timeSlotId) {
                    await shopService.bookTimeSlot(svc.timeSlotId);
                } else {
                    // Create service appointment order
                    await shopService.createOrder({
                        order_type: 'service_appointment',
                        delivery_mode: 'appointment',
                        service_time_slot_id: svc.timeSlotId || undefined,
                        items: [],
                    });
                }
            }

            cart.clearCart();
            setCartOpen(false);
            setCheckoutMsg({ type: 'success', text: 'Order placed successfully!' });
            setActiveTab('orders');
        } catch (err) {
            console.error('Checkout failed:', err);
            const detail = err.response?.data?.error || err.response?.data?.detail || 'Checkout failed. Please try again.';
            setCheckoutMsg({ type: 'error', text: detail });
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">🛍️ Marketplace</h1>
                    <p className="text-secondary mt-1 max-w-2xl">Shop products, order food, book hotels, and find services — all in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCartOpen(true)} className="relative">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                        {cart.count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.count}</span>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/shop/register-establishment')}>
                        <Plus className="w-4 h-4 mr-2" /> Register Business
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/payments/register-shop')}>
                        <Store className="w-4 h-4 mr-2" /> Create Shop
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/create-product')}>
                        <Package className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                </div>
            </div>

            {/* Search and Tabs */}
            <div className="mb-8 space-y-6">
                {!['orders', 'my-services'].includes(activeTab) && (
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for products, restaurants, services..."
                            className="w-full bg-elevated border border-theme rounded-xl py-3 pl-11 pr-4 text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-tertiary shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-theme">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap font-medium text-sm
                                ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-secondary hover:text-primary hover:border-border'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {counts[tab.key] > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                                    {counts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-10">
                {activeTab === 'orders' ? (
                    <OrdersTab />
                ) : activeTab === 'my-services' ? (
                    <MyServicesTab navigate={navigate} />
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-secondary">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>Loading marketplace...</p>
                    </div>
                ) : (
                    <>
                        {/* Products Section */}
                        {showProducts && filteredProducts.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Package className="text-primary" size={20} /> Products
                                    </h2>
                                    {activeTab === 'all' && filteredProducts.length > 4 && (
                                        <button onClick={() => setActiveTab('products')} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {(activeTab === 'all' ? filteredProducts.slice(0, 4) : filteredProducts).map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => navigate(`/shop/${product.id}`)}
                                            onAddToCart={cart.addItem}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Food & Dining Section */}
                        {showFood && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <UtensilsCrossed className="text-orange-500" size={20} /> Food & Dining
                                    </h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button onClick={() => setActiveTab('food')} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">See all <ArrowRight size={14} /></button>
                                    )}
                                </div>
                                {(() => {
                                    const foodItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type));
                                    return foodItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                            {foodItems.map(est => <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />)}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                            <UtensilsCrossed size={48} className="text-tertiary mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-primary">No restaurants found</h3>
                                            <p className="text-secondary text-sm max-w-sm mt-1">Check back later or register a new dining establishment.</p>
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Hotels Section */}
                        {showHotels && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Hotel className="text-blue-500" size={20} /> Hotels & Stays</h2>
                                </div>
                                {(() => {
                                    const items = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type));
                                    return items.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                            {items.map(est => <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />)}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                            <Hotel size={48} className="text-tertiary mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-primary">No hotels found</h3>
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Stores Section */}
                        {showStores && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Store className="text-purple-500" size={20} /> Supermarkets & Stores</h2>
                                </div>
                                {(() => {
                                    const items = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type));
                                    return items.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                            {items.map(est => <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />)}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                            <Store size={48} className="text-tertiary mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-primary">No stores found</h3>
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Services Section with Add to Cart */}
                        {showServices && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Briefcase className="text-indigo-500" size={20} /> Services & Appointments
                                    </h2>
                                </div>
                                {serviceEstablishments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                                        {(activeTab === 'all' ? serviceEstablishments.slice(0, 4) : serviceEstablishments).map(est => (
                                            <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />
                                        ))}
                                    </div>
                                )}
                                {filteredServices.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                        {(activeTab === 'all' ? filteredServices.slice(0, 4) : filteredServices).map(service => (
                                            <div key={service.id} className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col h-full" onClick={() => navigate(`/shop/service/${service.id}`)}>
                                                <div className="h-40 w-full bg-secondary/5 relative overflow-hidden shrink-0">
                                                    {service.image ? (
                                                        <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Briefcase size={32} className="text-tertiary opacity-30" /></div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <span className="px-2 py-1 rounded-md bg-indigo-500/90 text-white text-[10px] font-bold uppercase tracking-wider">Service</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <h3 className="font-bold text-base text-primary line-clamp-1 mb-1">{service.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-secondary mb-2">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {service.duration_minutes} min</span>
                                                        {service.service_mode_display && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-tertiary" />
                                                                <span>{service.service_mode_display}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-secondary line-clamp-2 mb-3 flex-1">{service.description}</p>
                                                    <div className="pt-3 border-t border-theme flex items-center justify-between mt-auto">
                                                        <span className="font-bold text-primary">${(Number(service.price) || 0).toFixed(2)}</span>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); cart.addItem({ id: service.id, name: service.name, price: service.price, type: 'service', image: service.image }); }}>
                                                                <ShoppingCart size={14} className="mr-1" /> Add
                                                            </Button>
                                                            <Button size="sm" variant="primary" className="h-8 text-xs">Book Now</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : serviceEstablishments.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                        <Briefcase size={48} className="text-tertiary mb-3 opacity-50" />
                                        <h3 className="text-lg font-medium text-primary">No services found</h3>
                                        <p className="text-secondary text-sm max-w-sm mt-1">No service providers are currently available.</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Overall Empty State */}
                        {!loading && filteredProducts.length === 0 && filteredEstablishments.length === 0 && filteredServices.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                                    <ShoppingBag size={40} className="text-tertiary" />
                                </div>
                                <h2 className="text-2xl font-bold text-primary mb-2">No results found</h2>
                                <p className="text-secondary max-w-md">We couldn't find anything matching your search. Try different keywords or browse all categories.</p>
                                <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(''); setActiveTab('all'); }}>Clear Filters</Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Cart Drawer */}
            <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} checkoutLoading={checkoutLoading} checkoutMsg={checkoutMsg} />
        </div>
    );
}
