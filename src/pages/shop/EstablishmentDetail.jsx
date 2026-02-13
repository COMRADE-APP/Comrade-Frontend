import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Star, MapPin, Clock, Phone, Globe, Mail,
    Package, Truck, UtensilsCrossed, Plus, Minus, ShoppingCart,
    Hotel, Briefcase, Check, Calendar
} from 'lucide-react';
import shopService from '../../services/shop.service';
import './Shop.css';

const StarRating = ({ rating, count }) => (
    <div className="est-rating">
        <div className="est-stars">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`est-star ${s <= Math.round(rating) ? '' : 'empty'}`} fill={s <= Math.round(rating) ? '#fbbf24' : 'none'} />
            ))}
        </div>
        <span className="est-rating-text">{Number(rating).toFixed(1)} ({count} reviews)</span>
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
            <div className="shop-page" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    if (!establishment) {
        return (
            <div className="shop-page" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Establishment not found.</p>
                <button className="shop-action-btn" onClick={() => navigate('/shop')}>Back to Shop</button>
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
        <div className="shop-page">
            {/* Banner */}
            <div style={{ position: 'relative' }}>
                {establishment.banner ? (
                    <img src={establishment.banner} alt="" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                ) : (
                    <div className="shop-hero" style={{ height: 220, display: 'flex', alignItems: 'flex-end', padding: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.75rem' }}>{establishment.name}</h1>
                            <span className={`est-card-type-badge ${establishment.establishment_type}`} style={{ fontSize: '0.8rem' }}>
                                {establishment.establishment_type_display}
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => navigate('/shop')}
                    style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            {/* Info */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {establishment.banner && <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{establishment.name}</h1>}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{establishment.description}</p>

                <StarRating rating={establishment.rating || 0} count={establishment.review_count || 0} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {establishment.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {establishment.city}{establishment.country ? `, ${establishment.country}` : ''}</span>}
                    {establishment.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} /> {establishment.phone}</span>}
                    {establishment.website && <a href={establishment.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)' }}><Globe size={14} /> Website</a>}
                    {establishment.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} /> {establishment.email}</span>}
                </div>

                <div className="est-modes" style={{ marginTop: '0.75rem' }}>
                    <span className={`est-mode ${establishment.pickup_available ? 'available' : ''}`}><Package size={14} /> Pickup {establishment.pickup_available ? <Check size={12} /> : ''}</span>
                    <span className={`est-mode ${establishment.delivery_available ? 'available' : ''}`}><Truck size={14} /> Delivery {establishment.delivery_available ? <Check size={12} /> : ''}</span>
                    <span className={`est-mode ${establishment.dine_in_available ? 'available' : ''}`}><UtensilsCrossed size={14} /> Dine-in {establishment.dine_in_available ? <Check size={12} /> : ''}</span>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="shop-tabs">
                {sections.map(s => (
                    <button key={s.key} className={`shop-tab ${activeSection === s.key ? 'active' : ''}`} onClick={() => setActiveSection(s.key)}>
                        <s.icon size={16} /> {s.label}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            <div className="shop-content">
                {/* Menu */}
                {activeSection === 'menu' && (
                    <>
                        {Object.entries(menuByCategory).map(([category, items]) => (
                            <div key={category} style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{category}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                            {item.image && <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '0.5rem' }} />}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{item.name}</div>
                                                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{item.description}</p>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {item.dietary_tags?.map((tag, i) => <span key={i} className="est-tag">{tag}</span>)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                                                    <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.preparation_time} min</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>${Number(item.price).toFixed(2)}</span>
                                                <button className="product-card-btn" onClick={() => addToCart(item, 'menu')}><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {menuItems.length === 0 && (
                            <div className="shop-empty">
                                <UtensilsCrossed size={48} />
                                <h3>No menu items yet</h3>
                                <p>This establishment hasn't added any items to their menu.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Rooms */}
                {activeSection === 'rooms' && (
                    <div className="shop-grid">
                        {rooms.map(room => (
                            <div key={room.id} className="product-card">
                                <div className="product-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Hotel size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                                </div>
                                <div className="product-card-body">
                                    <span className="product-card-type physical">{room.room_type_display || room.room_type}</span>
                                    <h3 className="product-card-name">{room.name}</h3>
                                    <p className="product-card-desc">{room.description}</p>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Capacity: {room.capacity} guests
                                    </div>
                                    {room.amenities?.length > 0 && (
                                        <div className="est-tags" style={{ marginBottom: '0.5rem' }}>
                                            {room.amenities.slice(0, 4).map((a, i) => <span key={i} className="est-tag">{a}</span>)}
                                        </div>
                                    )}
                                    <div className="product-card-footer">
                                        <span className="product-card-price">${Number(room.price_per_night).toFixed(2)}<small style={{ fontWeight: 400, fontSize: '0.75rem' }}>/night</small></span>
                                        <button className="product-card-btn" onClick={() => setSelectedRoom(room)}>Book</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {rooms.length === 0 && (
                            <div className="shop-empty" style={{ gridColumn: '1/-1' }}>
                                <Hotel size={48} />
                                <h3>No rooms listed</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* Services */}
                {activeSection === 'services' && (
                    <div className="shop-grid">
                        {services.map(svc => (
                            <div key={svc.id} className="product-card" onClick={() => navigate(`/shop/service/${svc.id}`)}>
                                <div className="product-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Briefcase size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                                </div>
                                <div className="product-card-body">
                                    <span className="product-card-type service">{svc.service_mode_display || 'Service'}</span>
                                    <h3 className="product-card-name">{svc.name}</h3>
                                    <p className="product-card-desc">{svc.description}</p>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {svc.duration_minutes} min
                                        {svc.available_slots_count > 0 && <span style={{ color: '#22c55e' }}> • {svc.available_slots_count} slots available</span>}
                                    </div>
                                    <div className="product-card-footer">
                                        <span className="product-card-price">${Number(svc.price).toFixed(2)}</span>
                                        <button className="product-card-btn">Book Appointment</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {services.length === 0 && (
                            <div className="shop-empty" style={{ gridColumn: '1/-1' }}>
                                <Briefcase size={48} />
                                <h3>No services listed</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* Reviews */}
                {activeSection === 'reviews' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map(review => (
                            <div key={review.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{review.user_name}</span>
                                    <StarRating rating={review.rating} count={0} />
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{review.comment}</p>
                            </div>
                        ))}
                        {reviews.length === 0 && (
                            <div className="shop-empty">
                                <Star size={48} />
                                <h3>No reviews yet</h3>
                                <p>Be the first to leave a review!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Cart */}
            {cart.length > 0 && (
                <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '2rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', zIndex: 100 }} onClick={() => setShowPurchase(true)}>
                    <ShoppingCart size={20} />
                    <span style={{ fontWeight: 600 }}>{cart.reduce((s, c) => s + c.quantity, 0)} items</span>
                    <span style={{ fontWeight: 700 }}>${cartTotal.toFixed(2)}</span>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>Place Order</span>
                </div>
            )}

            {/* Purchase Modal */}
            {showPurchase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowPurchase(false)}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '1.5rem 1.5rem 0 0', width: '100%', maxWidth: 500, maxHeight: '85vh', overflow: 'auto', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Your Order</h2>

                        {/* Cart Items */}
                        {cart.map(c => (
                            <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.item.name}</div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${c.price.toFixed(2)} each</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => removeFromCart(c.key)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}><Minus size={14} /></button>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.quantity}</span>
                                    <button onClick={() => addToCart(c.item, c.type)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}><Plus size={14} /></button>
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Delivery Mode */}
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>How would you like to receive this?</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {[
                                { key: 'pickup', label: 'Pickup', icon: Package },
                                { key: 'delivery', label: 'Delivery', icon: Truck },
                                { key: 'appointment', label: 'Dine-in / Visit', icon: UtensilsCrossed },
                            ].map(mode => (
                                <button key={mode.key} className={`shop-action-btn ${deliveryMode === mode.key ? 'primary' : ''}`} onClick={() => setDeliveryMode(mode.key)} style={{ flex: 1 }}>
                                    <mode.icon size={16} /> {mode.label}
                                </button>
                            ))}
                        </div>

                        {deliveryMode === 'delivery' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Delivery Address</label>
                                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Enter your delivery address" style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Notes (optional)</label>
                            <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Any special instructions..." rows={2} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="shop-action-btn" onClick={() => setShowPurchase(false)} style={{ flex: 1 }}>Cancel</button>
                            <button className="shop-action-btn primary" onClick={handlePlaceOrder} disabled={submitting} style={{ flex: 2 }}>
                                {submitting ? 'Placing Order...' : `Pay $${cartTotal.toFixed(2)} with Comrade Balance`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {selectedRoom && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedRoom(null)}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '1rem', width: '100%', maxWidth: 440, padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Book {selectedRoom.name}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{selectedRoom.room_type_display} • Capacity: {selectedRoom.capacity} • ${Number(selectedRoom.price_per_night).toFixed(2)}/night</p>

                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Check-in</label>
                        <input type="datetime-local" value={bookingData.check_in} onChange={e => setBookingData(d => ({ ...d, check_in: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginBottom: '0.75rem' }} />

                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Check-out</label>
                        <input type="datetime-local" value={bookingData.check_out} onChange={e => setBookingData(d => ({ ...d, check_out: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginBottom: '0.75rem' }} />

                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Guests</label>
                        <input type="number" min={1} max={selectedRoom.capacity} value={bookingData.guests} onChange={e => setBookingData(d => ({ ...d, guests: parseInt(e.target.value) || 1 }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginBottom: '0.75rem' }} />

                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Special Requests</label>
                        <textarea value={bookingData.special_requests} onChange={e => setBookingData(d => ({ ...d, special_requests: e.target.value }))} placeholder="Any special requests..." rows={2} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginBottom: '1rem', resize: 'vertical' }} />

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="shop-action-btn" onClick={() => setSelectedRoom(null)} style={{ flex: 1 }}>Cancel</button>
                            <button className="shop-action-btn primary" onClick={handleBookRoom} disabled={submitting || !bookingData.check_in} style={{ flex: 2 }}>
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
