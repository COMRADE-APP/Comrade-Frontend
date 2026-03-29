import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Search, ShoppingBag, UtensilsCrossed, Hotel, Store, Briefcase,
    Star, MapPin, Truck, Package, Clock, Plus, ArrowRight,
    Check, X, Loader2, ShoppingCart, Minus, Trash2, ChevronRight,
    Bell, Eye, Users, User, Wallet, ClipboardList, CalendarCheck,
    Filter, ArrowLeft, Shield, Share2, Lock, Tag, SearchSlash
} from 'lucide-react';
import { paymentsService } from '../../services/payments.service';
import shopService from '../../services/shop.service';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import InventoryManager from './InventoryManager';
import { useCart } from '../../contexts/CartContext';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

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
    { key: 'dashboard', label: 'Inventory & Sales', icon: Store },
];

const FOOD_TYPES = ['restaurant', 'coffee_shop', 'food_shop'];
const HOTEL_TYPES = ['hotel'];
const STORE_TYPES = ['supermarket', 'store'];
const SERVICE_TYPES = ['service_provider'];

// Removed local useCart hook here. Imported from CartContext.

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
    const { name, description, establishment_type, establishment_type_display, categories, city, country, rating, review_count, logo, banner, image_url, cover_image, image, delivery_available, pickup_available, dine_in_available, is_verified } = establishment;
    const resolvedBanner = getImageUrl(banner) || getImageUrl(image_url) || getImageUrl(cover_image) || getImageUrl(image);
    const resolvedLogo = getImageUrl(logo) || getImageUrl(image_url) || getImageUrl(image);
    return (
        <div className="group bg-elevated border border-theme rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700" onClick={onClick}>
            <div className="h-36 sm:h-40 lg:h-44 w-full bg-secondary/10 relative overflow-hidden shrink-0">
                {resolvedBanner ? (
                    <img src={resolvedBanner} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-secondary/5 to-indigo-900/20 flex items-center justify-center" style={{ display: resolvedBanner ? 'none' : 'flex' }}>
                    <Store className="text-tertiary opacity-30" size={48} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-1 shadow translate-y-4 group-hover:translate-y-0">
                        <Eye size={14} /> View Details
                    </span>
                </div>
                <div className="absolute -bottom-6 left-4 z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-xl border-[3px] border-elevated bg-elevated overflow-hidden shadow-sm">
                        {resolvedLogo ? <img src={resolvedLogo} alt={name} className="w-full h-full object-cover" /> : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{name?.charAt(0)}</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 pt-8 flex flex-col flex-1">
                <div className="mb-2">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-primary leading-tight line-clamp-1 group-hover:text-purple-600 transition-colors">
                            {name} {is_verified && <Check size={14} className="text-blue-500 inline ml-0.5" />}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                            ${establishment_type === 'restaurant' ? 'bg-orange-500/10 text-orange-600' :
                                establishment_type === 'hotel' ? 'bg-blue-500/10 text-blue-600' :
                                    establishment_type === 'coffee_shop' ? 'bg-amber-600/10 text-amber-700' :
                                        establishment_type === 'supermarket' ? 'bg-emerald-500/10 text-emerald-600' :
                                            establishment_type === 'service_provider' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-200 dark:border-indigo-800' :
                                                'bg-purple-500/10 text-purple-600'
                            }`}>
                            {establishment_type_display || establishment_type}
                        </span>
                    </div>
                    <StarRating rating={rating || 0} count={review_count || 0} />
                </div>
                <p className="text-sm text-secondary line-clamp-2 mb-4 flex-1 leading-relaxed">{description || "Explore this establishment for high quality services and products."}</p>
                <div className="space-y-3 mt-auto">
                    {(city || country) && (
                        <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                            <MapPin size={14} className="text-tertiary shrink-0" />
                            <span className="truncate">{[city, country].filter(Boolean).join(', ')}</span>
                        </div>
                    )}
                    {categories && Array.isArray(categories) && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {categories.slice(0, 3).map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-semibold">{cat}</span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-3 pt-3 border-t border-theme">
                        {pickup_available && <div className="flex items-center gap-1 text-[11px] font-medium text-secondary" title="Pickup Available"><Package size={14} className="text-emerald-500" /><span>Pickup</span></div>}
                        {delivery_available && <div className="flex items-center gap-1 text-[11px] font-medium text-secondary" title="Delivery Available"><Truck size={14} className="text-emerald-500" /><span>Delivery</span></div>}
                        {dine_in_available && <div className="flex items-center gap-1 text-[11px] font-medium text-secondary" title="Dine-in Available"><UtensilsCrossed size={14} className="text-emerald-500" /><span>Dine-in</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Product Card with Add to Cart / Book Now (Compact Premium Design) ---
const ProductCard = ({ product, onClick, onAddToCart, onBookNow }) => {
    const [justAdded, setJustAdded] = React.useState(false);
    const typeBadge = {
        service: 'bg-indigo-500/90 text-white',
        digital: 'bg-purple-500/90 text-white',
        subscription: 'bg-amber-500/90 text-white',
        physical: 'bg-emerald-500/90 text-white',
        recommendation: 'bg-rose-500/90 text-white',
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        onAddToCart?.({
            id: product.id, name: product.name, price: product.price,
            type: product.product_type === 'service' ? 'service' : 'product',
            image: getImageUrl(product.image_url) || getImageUrl(product.image),
            is_sharable: product.is_sharable, allow_group_purchase: product.allow_group_purchase
        });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
    };

    return (
        <div 
            className="group bg-elevated rounded-2xl border border-theme overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 flex flex-col h-full" 
            onClick={onClick}
        >
            {/* Image Box */}
            <div className="relative h-36 sm:h-40 lg:h-44 w-full bg-secondary/5 overflow-hidden shrink-0">
                {product.image_url ? (
                    <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-secondary/5 to-indigo-900/20 flex items-center justify-center">
                        <Package size={36} className="text-tertiary opacity-40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${typeBadge[product.product_type] || typeBadge.physical}`}>
                        {product.product_type}
                    </span>
                </div>
                {/* Sharability badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {product.is_sharable && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-blue-500/80 text-white backdrop-blur-md">Sharable</span>
                    )}
                    {product.allow_group_purchase === false && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-red-500/80 text-white backdrop-blur-md">Individual Only</span>
                    )}
                </div>
                {/* Quick view overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-1 shadow">
                        <Eye size={14} /> Quick View
                    </span>
                </div>
                {/* Added-to-cart overlay animation */}
                {justAdded && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center z-20 animate-in fade-in duration-200">
                        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg animate-in zoom-in duration-300">
                            <Check size={28} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                <div className="flex-1">
                    <h3 className="font-semibold text-primary text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-purple-600 transition-colors mb-1">
                        {product.name}
                    </h3>
                    {(product.duration_minutes || product.service_mode_display) && (
                        <div className="flex items-center gap-2 text-xs text-secondary mb-1">
                            {product.duration_minutes && <span className="flex items-center gap-1"><Clock size={12} /> {product.duration_minutes} min</span>}
                            {product.service_mode_display && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-tertiary" />
                                    <span>{product.service_mode_display}</span>
                                </>
                            )}
                        </div>
                    )}
                    <p className="text-secondary text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1">
                        {product.description}
                    </p>
                </div>
                {/* Price + Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-theme">
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                        ${(Number(product.price) || 0).toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddToCart}
                            className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm ${
                                justAdded
                                    ? 'bg-green-500 text-white scale-110'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                            }`}
                            title={justAdded ? 'Added!' : 'Add to Cart'}
                        >
                            {justAdded ? <Check size={16} strokeWidth={3} /> : (
                                    <div className="relative flex items-center justify-center">
                                        <ShoppingCart size={16} />
                                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-600 text-white rounded-full flex items-center justify-center border-2 border-purple-100 dark:border-purple-900">
                                            <Plus size={8} strokeWidth={4} />
                                        </div>
                                    </div>
                                )}
                        </button>
                        {onBookNow && (
                            <Button size="sm" variant="primary" className="h-[36px] text-xs px-3 rounded-full" onClick={(e) => { e.stopPropagation(); onBookNow(product); }}>
                                Book
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
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

// --- Dashboard (Inventory & Sales) Tab ---
const DashboardTab = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [offlineForm, setOfflineForm] = useState({
        total_amount: '', sales_channel: 'in_store', notes: ''
    });
    const [addingSale, setAddingSale] = useState(false);

    useEffect(() => { loadAnalytics(); }, []);

    const loadAnalytics = async () => {
        try {
            const data = await paymentsService.getShopAnalytics();
            setAnalytics(data);
        } catch (e) {
            console.error('Failed to load shop analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleOfflineSale = async (e) => {
        e.preventDefault();
        setAddingSale(true);
        try {
            await shopService.recordOfflineSale({
                total_amount: parseFloat(offlineForm.total_amount),
                sales_channel: offlineForm.sales_channel,
                notes: offlineForm.notes
            });
            setOfflineForm({ total_amount: '', sales_channel: 'in_store', notes: '' });
            alert("Offline sale recorded successfully!");
            loadAnalytics(); // refresh analytics
        } catch (err) {
            console.error(err);
            alert("Error recording offline sale.");
        } finally {
            setAddingSale(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" size={24} /></div>;

    if (!analytics) return (
        <Card><CardBody className="text-center py-12 text-secondary">No analytics found. Make sure you have a registered establishment.</CardBody></Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Store size={20} /> Shop Dashboard</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-5 flex flex-col items-center text-center">
                        <span className="p-3 bg-purple-500/10 text-purple-600 rounded-xl mb-3"><ShoppingCart size={24} /></span>
                        <h4 className="text-secondary text-sm font-medium mb-1">Total Sales</h4>
                        <span className="text-3xl font-bold text-primary">${Number(analytics.total_revenue || 0).toFixed(2)}</span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-5 flex flex-col items-center text-center">
                        <span className="p-3 bg-blue-500/10 text-blue-600 rounded-xl mb-3"><Package size={24} /></span>
                        <h4 className="text-secondary text-sm font-medium mb-1">Orders Count</h4>
                        <span className="text-3xl font-bold text-primary">{analytics.total_orders || 0}</span>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-5 flex flex-col items-center text-center">
                        <span className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl mb-3"><UtensilsCrossed size={24} /></span>
                        <h4 className="text-secondary text-sm font-medium mb-1">In-Store vs Online</h4>
                        <div className="flex gap-4 mt-1">
                            <div><span className="text-xs text-secondary">Online</span><p className="font-bold text-primary">{analytics.online_orders || 0}</p></div>
                            <div className="w-px bg-theme" />
                            <div><span className="text-xs text-secondary">Offline</span><p className="font-bold text-primary">{analytics.offline_orders || 0}</p></div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardBody>
                        <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">Revenue By Channel</h4>
                        <div className="space-y-4">
                            {Object.entries((analytics.revenue_by_channel || {})).map(([channel, val]) => (
                                <div key={channel} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary capitalize">{channel.replace('_', ' ')}</span>
                                        <span className="font-medium text-primary">${Number(val || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${analytics.total_revenue ? (val / analytics.total_revenue) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h4 className="font-semibold text-primary flex items-center gap-2 mb-4"><Plus size={18} /> Log Offline Sale</h4>
                        <form onSubmit={handleOfflineSale} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Amount ($)</label>
                                <input
                                    type="number" step="0.01" min="0" required
                                    className="w-full px-4 py-2.5 bg-secondary/10 border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500"
                                    value={offlineForm.total_amount}
                                    onChange={e => setOfflineForm({ ...offlineForm, total_amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Sales Channel</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-secondary/10 border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500"
                                    value={offlineForm.sales_channel}
                                    onChange={e => setOfflineForm({ ...offlineForm, sales_channel: e.target.value })}
                                >
                                    <option value="in_store">In-Store / POS</option>
                                    <option value="pop_up">Pop-Up Market</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-secondary/10 border border-theme rounded-xl text-primary outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={2}
                                    value={offlineForm.notes}
                                    onChange={e => setOfflineForm({ ...offlineForm, notes: e.target.value })}
                                />
                            </div>
                            <Button variant="primary" type="submit" className="w-full" disabled={addingSale}>
                                {addingSale ? 'Logging...' : 'Record Sale'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>

            {/* Inventory Management Block */}
            <div className="pt-4 mt-6 border-t border-theme">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Package size={20} /> Inventory Manager</h3>
                <InventoryManager />
            </div>
        </div>
    );
};

// --- Main Shop Component ---
export default function Shop() {
    const navigate = useNavigate();
    const { tab } = useParams();
    const { user } = useAuth();
    const cart = useCart();
    
    // Sync activeTab with URL param, default to 'all'
    const [activeTab, setActiveTab] = useState(tab || 'all');
    
    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== 'all') {
            setActiveTab('all');
        }
    }, [tab]);

    const handleTabChange = (t) => {
        setActiveTab(t);
        navigate(`/shop/${t}`, { replace: true });
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    // Cart open/close is managed by CartContext (cart.setCartOpen)

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

    // handleCheckout moved to CartDrawer component

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">🛍️ Marketplace</h1>
                    <p className="text-secondary mt-1 max-w-2xl">Shop products, order food, book hotels, and find services — all in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => cart.setCartOpen(true)} className="relative">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                        {cart.count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.count}</span>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/shop/register-establishment')}>
                        <Plus className="w-4 h-4 mr-2" /> Register Business
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/payments/kitties')}>
                        <Wallet className="w-4 h-4 mr-2" /> My Kitties
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
                {!['orders', 'my-services', 'dashboard'].includes(activeTab) && (
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
                    {TABS.map(tabOption => {
                                const count = counts[tabOption.key] || 0;
                                if (tabOption.key !== 'all' && tabOption.key !== 'orders' && tabOption.key !== 'my-services' && tabOption.key !== 'dashboard' && count === 0) return null;
                                return (
                                    <button
                                        key={tabOption.key}
                                        onClick={() => handleTabChange(tabOption.key)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 outline-none rounded-t-xl transition-all font-medium text-sm whitespace-nowrap
                                            ${activeTab === tabOption.key
                                                ? 'text-primary border-b-2 border-primary-600'
                                                : 'text-secondary hover:text-primary hover:bg-secondary/10'
                                            }`}
                                    >
                                        <tabOption.icon size={16} />
                                        <span>{tabOption.label}</span>
                                        {(tabOption.key !== 'orders' && tabOption.key !== 'my-services' && tabOption.key !== 'dashboard') && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tabOption.key ? 'bg-primary-600 text-white' : 'bg-secondary/20 text-secondary'}`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-10">
                {activeTab === 'orders' ? (
                    <OrdersTab />
                ) : activeTab === 'my-services' ? (
                    <MyServicesTab navigate={navigate} />
                ) : activeTab === 'dashboard' ? (
                    <DashboardTab />
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
                                        <button onClick={() => handleTabChange('products')} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                                    {(activeTab === 'all' ? filteredProducts.slice(0, 4) : filteredProducts).map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => navigate(`/shop/item/${product.id}`)}
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
                                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
                                        {(activeTab === 'all' ? serviceEstablishments.slice(0, 4) : serviceEstablishments).map(est => (
                                            <EstablishmentCard key={est.id} establishment={est} onClick={() => navigate(`/shop/establishment/${est.id}`)} />
                                        ))}
                                    </div>
                                )}
                                {filteredServices.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                                {(activeTab === 'all' ? filteredServices.slice(0, 4) : filteredServices).map(service => (
                                    <ProductCard 
                                        key={service.id} 
                                        product={{...service, product_type: 'service', image_url: service.image}} 
                                        onClick={() => navigate(`/shop/service/${service.id}`)}
                                        onAddToCart={cart.addItem}
                                        onBookNow={() => {
                                            cart.addItem({ id: service.id, name: service.name, price: service.price, type: 'service', image: service.image });
                                            // Optional: immediately redirect or open a booking modal
                                        }}
                                    />
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

            {/* Cart Drawer moved globally */}
        </div>
    );
}
