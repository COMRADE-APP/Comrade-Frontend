import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Star, MapPin, Clock, Phone, Globe, Mail,
    Package, Truck, UtensilsCrossed, Plus, Minus, ShoppingCart,
    Hotel, Briefcase, Check, Calendar, Loader2, X
} from 'lucide-react';
import shopService from '../../services/shop.service';
import Button from '../../components/common/Button';

const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    size={16}
                    className={`${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
        <span className="text-sm text-secondary font-medium ml-1">
            {Number(rating).toFixed(1)} <span className="text-tertiary">({count} reviews)</span>
        </span>
    </div>
);

export default function EstablishmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [establishment, setEstablishment] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('menu');
    const [cart, setCart] = useState([]);
    const [showPurchase, setShowPurchase] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Booking state
    const [bookingData, setBookingData] = useState({ check_in: '', check_out: '', guests: 1, special_requests: '' });
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        loadEstablishment();
    }, [id]);

    const loadEstablishment = async () => {
        setLoading(true);
        try {
            const est = await shopService.getEstablishment(id);
            setEstablishment(est);

            const [menu, rm, svc, rev] = await Promise.allSettled([
                shopService.getEstablishmentMenu(id),
                shopService.getEstablishmentRooms(id),
                shopService.getEstablishmentServices(id),
                shopService.getEstablishmentReviews(id),
            ]);

            if (menu.status === 'fulfilled') setMenuItems(Array.isArray(menu.value) ? menu.value : []);
            if (rm.status === 'fulfilled') setRooms(Array.isArray(rm.value) ? rm.value : []);
            if (svc.status === 'fulfilled') setServices(Array.isArray(svc.value) ? svc.value : []);
            if (rev.status === 'fulfilled') setReviews(Array.isArray(rev.value) ? rev.value : []);

            // Auto-select section based on type
            if (['hotel'].includes(est.establishment_type)) setActiveSection('rooms');
            else if (['service_provider'].includes(est.establishment_type)) setActiveSection('services');
            else setActiveSection('menu');
        } catch (e) {
            console.error('Error loading establishment:', e);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item, type = 'menu') => {
        setCart(prev => {
            const key = `${type}_${item.id}`;
            const existing = prev.find(c => c.key === key);
            if (existing) {
                return prev.map(c => c.key === key ? { ...c, quantity: c.quantity + 1 } : c);
            }
            return [...prev, { key, item, type, quantity: 1, price: parseFloat(item.price || item.price_per_night || 0) }];
        });
    };

    const removeFromCart = (key) => {
        setCart(prev => {
            const item = prev.find(c => c.key === key);
            if (item && item.quantity > 1) {
                return prev.map(c => c.key === key ? { ...c, quantity: c.quantity - 1 } : c);
            }
            return prev.filter(c => c.key !== key);
        });
    };

    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

    const handlePlaceOrder = async () => {
        setSubmitting(true);
        try {
            const items = cart.map(c => ({
                ...(c.type === 'menu' ? { menu_item_id: c.item.id } : { product_id: c.item.id }),
                quantity: c.quantity
            }));

            await shopService.createOrder({
                establishment_id: parseInt(id),
                order_type: establishment.establishment_type === 'hotel' ? 'hotel_booking' : 'food',
                delivery_mode: deliveryMode,
                delivery_address: deliveryMode === 'delivery' ? deliveryAddress : '',
                notes: orderNotes,
                items
            });

            alert('Order placed successfully!');
            setCart([]);
            setShowPurchase(false);
            navigate('/shop');
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBookRoom = async () => {
        if (!selectedRoom || !bookingData.check_in) return;
        setSubmitting(true);
        try {
            await shopService.createBooking({
                establishment: parseInt(id),
                hotel_room: selectedRoom.id,
                booking_type: selectedRoom.room_type === 'event_room' || selectedRoom.room_type === 'conference_room' ? 'event_room' : 'hotel_stay',
                check_in: bookingData.check_in,
                check_out: bookingData.check_out || bookingData.check_in,
                guests: bookingData.guests,
                total_price: parseFloat(selectedRoom.price_per_night),
                special_requests: bookingData.special_requests
            });
            alert('Booking request submitted!');
            setSelectedRoom(null);
        } catch (e) {
            alert(e.response?.data?.error || 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-secondary">
                <Loader2 className="animate-spin mb-4 text-primary" size={32} />
                <p>Loading establishment...</p>
            </div>
        );
    }

    if (!establishment) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
                <p className="text-secondary text-lg mb-6">Establishment not found.</p>
                <Button variant="primary" onClick={() => navigate('/shop')}>Back to Shop</Button>
            </div>
        );
    }

    const sections = [];
    if (menuItems.length > 0 || ['restaurant', 'coffee_shop', 'food_shop', 'supermarket', 'store'].includes(establishment.establishment_type)) sections.push({ key: 'menu', label: 'Menu / Items', icon: UtensilsCrossed });
    if (rooms.length > 0 || establishment.establishment_type === 'hotel') sections.push({ key: 'rooms', label: 'Rooms', icon: Hotel });
    if (services.length > 0 || establishment.establishment_type === 'service_provider') sections.push({ key: 'services', label: 'Services', icon: Briefcase });
    sections.push({ key: 'reviews', label: `Reviews (${reviews.length})`, icon: Star });

    // Group menu by category
    const menuByCategory = menuItems.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Banner */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                {establishment.banner ? (
                    <img src={establishment.banner} alt={establishment.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-primary opacity-50">{establishment.name}</h1>
                            <span className="text-secondary uppercase tracking-widest text-sm font-medium mt-2 block">
                                {establishment.establishment_type_display}
                            </span>
                        </div>
                    </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

                <button
                    onClick={() => navigate('/shop')}
                    className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className="container mx-auto px-4 md:px-8 -mt-20 relative z-10">
                {/* Info Card */}
                <div className="bg-elevated border border-theme rounded-2xl p-6 shadow-lg mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-primary mb-2">{establishment.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${establishment.establishment_type === 'restaurant' ? 'bg-orange-500/10 text-orange-600' :
                                        establishment.establishment_type === 'hotel' ? 'bg-blue-500/10 text-blue-600' :
                                            establishment.establishment_type === 'service_provider' ? 'bg-indigo-500/10 text-indigo-600' :
                                                'bg-emerald-500/10 text-emerald-600'
                                    }`}>
                                    {establishment.establishment_type_display}
                                </span>
                                <StarRating rating={establishment.rating || 0} count={establishment.review_count || 0} />
                            </div>
                        </div>
                    </div>

                    <p className="text-secondary text-base mb-6 max-w-3xl leading-relaxed">{establishment.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-secondary mb-6">
                        {establishment.city && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-tertiary shrink-0" />
                                <span>{establishment.city}{establishment.country ? `, ${establishment.country}` : ''}</span>
                            </div>
                        )}
                        {establishment.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-tertiary shrink-0" />
                                <span>{establishment.phone}</span>
                            </div>
                        )}
                        {establishment.website && (
                            <a href={establishment.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <Globe size={16} className="text-tertiary shrink-0" />
                                <span>Website</span>
                            </a>
                        )}
                        {establishment.email && (
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-tertiary shrink-0" />
                                <span>{establishment.email}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-6 border-t border-theme">
                        <div className={`flex items-center gap-2 text-sm ${establishment.pickup_available ? 'text-green-600' : 'text-gray-400 opacity-50'}`}>
                            <Package size={16} /> <span>Pickup</span> {establishment.pickup_available && <Check size={14} />}
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${establishment.delivery_available ? 'text-green-600' : 'text-gray-400 opacity-50'}`}>
                            <Truck size={16} /> <span>Delivery</span> {establishment.delivery_available && <Check size={14} />}
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${establishment.dine_in_available ? 'text-green-600' : 'text-gray-400 opacity-50'}`}>
                            <UtensilsCrossed size={16} /> <span>Dine-in</span> {establishment.dine_in_available && <Check size={14} />}
                        </div>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-none">
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap
                                ${activeSection === s.key
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-elevated border border-theme text-secondary hover:text-primary hover:border-primary/30'
                                }`}
                        >
                            <s.icon size={16} /> {s.label}
                        </button>
                    ))}
                </div>

                {/* Section Content */}
                <div className="min-h-[400px]">
                    {/* Menu */}
                    {activeSection === 'menu' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {Object.entries(menuByCategory).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                        {category}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {items.map(item => (
                                            <div key={item.id} className="bg-elevated border border-theme rounded-xl p-4 flex gap-4 hover:border-primary/30 transition-colors group">
                                                {item.image && (
                                                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-secondary/10 shrink-0" />
                                                )}
                                                <div className="flex-1 flex flex-col">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-primary">{item.name}</h4>
                                                        <span className="font-bold text-primary text-lg">${Number(item.price).toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-sm text-secondary line-clamp-2 mb-2 flex-1">{item.description}</p>

                                                    {item.dietary_tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            {item.dietary_tags.map((tag, i) => (
                                                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary font-medium uppercase">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mt-auto pt-2">
                                                        <div className="flex items-center gap-1.5 text-xs text-secondary">
                                                            <Clock size={12} /> {item.preparation_time} min
                                                        </div>
                                                        <button
                                                            onClick={() => addToCart(item, 'menu')}
                                                            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {menuItems.length === 0 && (
                                <div className="text-center py-20 bg-elevated border border-dashed border-theme rounded-2xl">
                                    <UtensilsCrossed size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-primary">No menu items yet</h3>
                                    <p className="text-secondary mt-1">This establishment hasn't added any items to their menu.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rooms */}
                    {activeSection === 'rooms' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {rooms.map(room => (
                                <div key={room.id} className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                                    <div className="h-48 bg-secondary/10 relative overflow-hidden flex items-center justify-center">
                                        <Hotel size={48} className="text-tertiary opacity-30" />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                                            {room.room_type_display || room.room_type}
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-primary mb-2 group-hover:text-amber-600 transition-colors">{room.name}</h3>
                                        <p className="text-sm text-secondary line-clamp-2 mb-4 flex-1">{room.description}</p>

                                        <div className="flex items-center gap-4 text-xs text-secondary mb-4">
                                            <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> {room.capacity} Guests</span>
                                            {room.amenities?.length > 0 && (
                                                <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> {room.amenities.length} Amenities</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-theme mt-auto">
                                            <div>
                                                <span className="text-xl font-bold text-primary">${Number(room.price_per_night).toFixed(2)}</span>
                                                <span className="text-xs text-secondary font-medium ml-1">/night</span>
                                            </div>
                                            <Button size="sm" variant="primary" onClick={() => setSelectedRoom(room)}>Book Now</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rooms.length === 0 && (
                                <div className="col-span-full text-center py-20 bg-elevated border border-dashed border-theme rounded-2xl">
                                    <Hotel size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-primary">No rooms listed</h3>
                                    <p className="text-secondary mt-1">No accommodations are available at the moment.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Services */}
                    {activeSection === 'services' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {services.map(svc => (
                                <div
                                    key={svc.id}
                                    className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                                    onClick={() => navigate(`/shop/service/${svc.id}`)}
                                >
                                    <div className="h-40 bg-secondary/10 relative overflow-hidden flex items-center justify-center">
                                        <Briefcase size={40} className="text-tertiary opacity-30" />
                                        <div className="absolute top-3 right-3 bg-indigo-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                            {svc.service_mode_display || 'Service'}
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-primary mb-1 group-hover:text-indigo-600 transition-colors">{svc.name}</h3>

                                        <div className="flex items-center gap-3 text-xs text-secondary mb-3">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {svc.duration_minutes} min</span>
                                            {svc.available_slots_count > 0 && <span className="text-green-600 font-medium flex items-center gap-1">● {svc.available_slots_count} slots</span>}
                                        </div>

                                        <p className="text-sm text-secondary line-clamp-2 mb-4 flex-1">{svc.description}</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-theme mt-auto">
                                            <span className="text-lg font-bold text-primary">${Number(svc.price).toFixed(2)}</span>
                                            <Button size="sm" variant="primary">Book Appointment</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {services.length === 0 && (
                                <div className="col-span-full text-center py-20 bg-elevated border border-dashed border-theme rounded-2xl">
                                    <Briefcase size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-primary">No services listed</h3>
                                    <p className="text-secondary mt-1">No services are currently offered.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews */}
                    {activeSection === 'reviews' && (
                        <div className="space-y-4 animate-in fade-in duration-500 max-w-3xl mx-auto">
                            {reviews.map(review => (
                                <div key={review.id} className="bg-elevated border border-theme rounded-xl p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-primary block">{review.user_name}</span>
                                            <span className="text-xs text-secondary">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <StarRating rating={review.rating} count={0} />
                                    </div>
                                    <p className="text-sm text-secondary leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <div className="text-center py-16 bg-elevated border border-dashed border-theme rounded-2xl">
                                    <Star size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-primary">No reviews yet</h3>
                                    <p className="text-secondary mt-1">Be the first to leave a review!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Cart */}
            {cart.length > 0 && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300"
                    onClick={() => setShowPurchase(true)}
                >
                    <div className="bg-primary text-white pl-4 pr-6 py-3 rounded-full shadow-xl shadow-primary/30 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <ShoppingCart size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-white/80">{cart.reduce((s, c) => s + c.quantity, 0)} items</span>
                            <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/20 mx-1"></div>
                        <span className="font-semibold text-sm">View Cart</span>
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {showPurchase && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPurchase(false)}>
                    <div className="w-full sm:max-w-md bg-elevated rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-theme flex items-center justify-between bg-primary/5">
                            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                <ShoppingCart size={20} /> Your Order
                            </h2>
                            <button onClick={() => setShowPurchase(false)} className="text-secondary hover:text-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1">
                            {/* Cart Items */}
                            <div className="space-y-4 mb-6">
                                {cart.map(c => (
                                    <div key={c.key} className="flex justify-between items-center gap-3">
                                        <div className="flex-1">
                                            <div className="font-medium text-primary text-sm">{c.item.name}</div>
                                            <span className="text-xs text-secondary">${c.price.toFixed(2)} each</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-1">
                                            <button
                                                onClick={() => removeFromCart(c.key)}
                                                className="w-6 h-6 rounded-md bg-background text-primary flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-bold text-primary text-sm min-w-[16px] text-center">{c.quantity}</span>
                                            <button
                                                onClick={() => addToCart(c.item, c.type)}
                                                className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary-light transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center py-3 border-t border-dashed border-theme mb-6">
                                <span className="text-secondary font-medium">Total Amount</span>
                                <span className="text-xl font-bold text-primary">${cartTotal.toFixed(2)}</span>
                            </div>

                            {/* Delivery Mode */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-primary mb-3">Delivery Method</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'pickup', label: 'Pickup', icon: Package },
                                        { key: 'delivery', label: 'Delivery', icon: Truck },
                                        { key: 'appointment', label: 'Dine-in', icon: UtensilsCrossed },
                                    ].map(mode => (
                                        <button
                                            key={mode.key}
                                            onClick={() => setDeliveryMode(mode.key)}
                                            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium border transition-all
                                                ${deliveryMode === mode.key
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background border-theme text-secondary hover:border-primary/30'
                                                }`}
                                        >
                                            <mode.icon size={18} /> {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {deliveryMode === 'delivery' && (
                                <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs text-secondary font-medium mb-1.5 block">Delivery Address</label>
                                    <input
                                        type="text"
                                        value={deliveryAddress}
                                        onChange={e => setDeliveryAddress(e.target.value)}
                                        placeholder="Enter your full address"
                                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-theme text-primary text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-secondary font-medium mb-1.5 block">Notes (Optional)</label>
                                <textarea
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                    placeholder="Any special requests or allergies..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-theme text-primary text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-theme bg-secondary/5">
                            <Button variant="primary" className="w-full py-3 text-base shadow-lg shadow-primary/20" onClick={handlePlaceOrder} disabled={submitting}>
                                {submitting ? (
                                    <><Loader2 className="animate-spin mr-2" size={18} /> Processing...</>
                                ) : (
                                    <>Pay ${cartTotal.toFixed(2)}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRoom(null)}>
                    <div className="w-full max-w-lg bg-elevated rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex justify-between items-start bg-primary/5">
                            <div>
                                <h2 className="text-lg font-bold text-primary mb-1">Book {selectedRoom.name}</h2>
                                <p className="text-xs text-secondary flex items-center gap-2">
                                    <Hotel size={12} /> {selectedRoom.room_type_display}
                                    <span className="w-1 h-1 rounded-full bg-secondary block"></span>
                                    <span className="font-semibold text-primary">${Number(selectedRoom.price_per_night).toFixed(2)}/night</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedRoom(null)} className="text-secondary hover:text-primary transition-colors bg-background rounded-full p-1"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-secondary font-medium mb-1.5 block">Check-in</label>
                                    <input
                                        type="datetime-local"
                                        value={bookingData.check_in}
                                        onChange={e => setBookingData(d => ({ ...d, check_in: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-theme text-primary text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-secondary font-medium mb-1.5 block">Check-out</label>
                                    <input
                                        type="datetime-local"
                                        value={bookingData.check_out}
                                        onChange={e => setBookingData(d => ({ ...d, check_out: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-theme text-primary text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-secondary font-medium mb-1.5 block">Guests (Max {selectedRoom.capacity})</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={1}
                                        max={selectedRoom.capacity}
                                        value={bookingData.guests}
                                        onChange={e => setBookingData(d => ({ ...d, guests: parseInt(e.target.value) || 1 }))}
                                        className="flex-1 accent-primary h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-primary w-8 text-center">{bookingData.guests}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-secondary font-medium mb-1.5 block">Special Requests</label>
                                <textarea
                                    value={bookingData.special_requests}
                                    onChange={e => setBookingData(d => ({ ...d, special_requests: e.target.value }))}
                                    placeholder="Early check-in, extra towels..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-theme text-primary text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-theme bg-secondary/5 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedRoom(null)}>Cancel</Button>
                            <Button variant="primary" className="flex-[2]" onClick={handleBookRoom} disabled={submitting || !bookingData.check_in}>
                                {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
