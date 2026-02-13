import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag, UtensilsCrossed, Hotel, Store, Briefcase,
    Star, MapPin, Truck, Package, Clock, Plus, ArrowRight,
    Coffee, ShoppingCart, Check, X
} from 'lucide-react';
import shopService from '../../services/shop.service';
import './Shop.css';

const TABS = [
    { key: 'all', label: 'All', icon: ShoppingBag },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
    { key: 'hotels', label: 'Hotels & Stays', icon: Hotel },
    { key: 'shops', label: 'Supermarkets & Stores', icon: Store },
    { key: 'services', label: 'Services', icon: Briefcase },
];

const FOOD_TYPES = ['restaurant', 'coffee_shop', 'food_shop'];
const HOTEL_TYPES = ['hotel'];
const STORE_TYPES = ['supermarket', 'store'];
const SERVICE_TYPES = ['service_provider'];

const StarRating = ({ rating, count }) => (
    <div className="est-rating">
        <div className="est-stars">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`est-star ${s <= Math.round(rating) ? '' : 'empty'}`} fill={s <= Math.round(rating) ? '#fbbf24' : 'none'} />
            ))}
        </div>
        <span className="est-rating-text">{Number(rating).toFixed(1)} ({count})</span>
    </div>
);

const EstablishmentCard = ({ establishment, onClick }) => {
    const { name, description, establishment_type, establishment_type_display, categories, city, country, rating, review_count, logo, banner, delivery_available, pickup_available, dine_in_available, is_verified } = establishment;

    return (
        <div className="est-card" onClick={onClick}>
            {banner ? (
                <img src={banner} alt={name} className="est-card-banner" />
            ) : (
                <div className="est-card-banner" />
            )}
            <div className="est-card-body">
                <div className="est-card-header">
                    {logo ? (
                        <img src={logo} alt={name} className="est-card-logo" />
                    ) : (
                        <div className="est-card-logo-placeholder">{name?.charAt(0)}</div>
                    )}
                    <div className="est-card-info">
                        <div className="est-card-name">
                            {name} {is_verified && <Check size={14} style={{ color: '#3b82f6', display: 'inline' }} />}
                        </div>
                        <span className={`est-card-type-badge ${establishment_type}`}>
                            {establishment_type_display || establishment_type}
                        </span>
                    </div>
                </div>

                <p className="est-card-desc">{description}</p>

                <StarRating rating={rating || 0} count={review_count || 0} />

                {(city || country) && (
                    <div className="est-location">
                        <MapPin size={14} />
                        <span>{[city, country].filter(Boolean).join(', ')}</span>
                    </div>
                )}

                {categories && categories.length > 0 && (
                    <div className="est-tags">
                        {categories.slice(0, 4).map((cat, i) => (
                            <span key={i} className="est-tag">{cat}</span>
                        ))}
                    </div>
                )}

                <div className="est-modes">
                    <span className={`est-mode ${pickup_available ? 'available' : ''}`}>
                        <Package size={14} /> Pickup {pickup_available ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <span className={`est-mode ${delivery_available ? 'available' : ''}`}>
                        <Truck size={14} /> Delivery {delivery_available ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <span className={`est-mode ${dine_in_available ? 'available' : ''}`}>
                        <UtensilsCrossed size={14} /> Dine-in {dine_in_available ? <Check size={12} /> : <X size={12} />}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ProductCard = ({ product, onClick }) => (
    <div className="product-card" onClick={onClick}>
        {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="product-card-image" />
        ) : (
            <div className="product-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            </div>
        )}
        <div className="product-card-body">
            <span className={`product-card-type ${product.product_type}`}>
                {product.product_type}
            </span>
            <h3 className="product-card-name">{product.name}</h3>
            <p className="product-card-desc">{product.description}</p>
            <div className="product-card-footer">
                <span className="product-card-price">${(Number(product.price) || 0).toFixed(2)}</span>
                <button className="product-card-btn">
                    {product.product_type === 'subscription' ? 'Subscribe' : 'View'}
                </button>
            </div>
        </div>
    </div>
);

export default function Shop() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

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
                const list = Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : [];
                setProducts(list);
            }
            if (establishmentsData.status === 'fulfilled') {
                const raw = establishmentsData.value?.results || establishmentsData.value;
                const list = Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : [];
                setEstablishments(list);
            }
            if (servicesData.status === 'fulfilled') {
                const raw = servicesData.value?.results || servicesData.value;
                const list = Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : [];
                setServices(list);
            }
        } catch (e) {
            console.error('Error loading shop data:', e);
        } finally {
            setLoading(false);
        }
    };

    const search = searchQuery.toLowerCase();

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            (p.name || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search)
        ), [products, search]);

    const filteredEstablishments = useMemo(() => {
        let list = establishments.filter(e =>
            (e.name || '').toLowerCase().includes(search) || (e.description || '').toLowerCase().includes(search)
        );
        if (activeTab === 'food') list = list.filter(e => FOOD_TYPES.includes(e.establishment_type));
        else if (activeTab === 'hotels') list = list.filter(e => HOTEL_TYPES.includes(e.establishment_type));
        else if (activeTab === 'shops') list = list.filter(e => STORE_TYPES.includes(e.establishment_type));
        return list;
    }, [establishments, search, activeTab]);

    const filteredServices = useMemo(() =>
        services.filter(s => (s.name || '').toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search)
        ), [services, search]);

    const serviceEstablishments = useMemo(() =>
        establishments.filter(e => SERVICE_TYPES.includes(e.establishment_type) && ((e.name || '').toLowerCase().includes(search) || (e.description || '').toLowerCase().includes(search))
        ), [establishments, search]);

    // Tab counts
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

    return (
        <div className="shop-page">
            {/* Hero */}
            <div className="shop-hero">
                <h1>🛍️ Marketplace</h1>
                <p>Shop products, order food, book hotels, and find services — all in one place.</p>
                <div className="shop-search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search products, restaurants, hotels, services..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="shop-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`shop-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {counts[tab.key] > 0 && <span className="tab-count">{counts[tab.key]}</span>}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="shop-content">
                {/* Action buttons */}
                <div className="shop-actions">
                    <button className="shop-action-btn primary" onClick={() => navigate('/shop/register-establishment')}>
                        <Plus size={16} /> Register Business
                    </button>
                    <button className="shop-action-btn" onClick={() => navigate('/payments/register-shop')}>
                        <Store size={16} /> Create Shop
                    </button>
                    <button className="shop-action-btn" onClick={() => navigate('/create-product')}>
                        <Package size={16} /> Add Product
                    </button>
                </div>

                {loading ? (
                    <div className="shop-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shop-skeleton" />)}
                    </div>
                ) : (
                    <>
                        {/* Products Section */}
                        {showProducts && filteredProducts.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="shop-section-header">
                                    <h2>🛒 Products</h2>
                                    {activeTab === 'all' && filteredProducts.length > 4 && (
                                        <button className="shop-see-all" onClick={() => setActiveTab('products')}>
                                            See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                </div>
                                <div className="shop-grid">
                                    {(activeTab === 'all' ? filteredProducts.slice(0, 4) : filteredProducts).map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => navigate(`/shop/${product.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Food & Dining Section */}
                        {showFood && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="shop-section-header">
                                    <h2>🍽️ Food & Dining</h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button className="shop-see-all" onClick={() => setActiveTab('food')}>
                                            See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const foodItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments;
                                    return foodItems.length > 0 ? (
                                        <div className="shop-grid">
                                            {foodItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="shop-empty">
                                            <UtensilsCrossed size={48} />
                                            <h3>No restaurants yet</h3>
                                            <p>Be the first to register a restaurant, café, or food shop!</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Hotels & Stays Section */}
                        {showHotels && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="shop-section-header">
                                    <h2>🏨 Hotels & Stays</h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button className="shop-see-all" onClick={() => setActiveTab('hotels')}>
                                            See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const hotelItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments;
                                    return hotelItems.length > 0 ? (
                                        <div className="shop-grid">
                                            {hotelItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="shop-empty">
                                            <Hotel size={48} />
                                            <h3>No hotels yet</h3>
                                            <p>Register your hotel or lodge to start receiving bookings.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Supermarkets & Stores Section */}
                        {showStores && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="shop-section-header">
                                    <h2>🏪 Supermarkets & Stores</h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button className="shop-see-all" onClick={() => setActiveTab('shops')}>
                                            See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const storeItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments;
                                    return storeItems.length > 0 ? (
                                        <div className="shop-grid">
                                            {storeItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="shop-empty">
                                            <ShoppingCart size={48} />
                                            <h3>No supermarkets or stores yet</h3>
                                            <p>Register your supermarket or store for remote purchases.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Services Section */}
                        {showServices && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="shop-section-header">
                                    <h2>🔧 Services & Appointments</h2>
                                </div>

                                {/* Service Provider Establishments */}
                                {serviceEstablishments.length > 0 && (
                                    <div className="shop-grid" style={{ marginBottom: '1.5rem' }}>
                                        {(activeTab === 'all' ? serviceEstablishments.slice(0, 4) : serviceEstablishments).map(est => (
                                            <EstablishmentCard
                                                key={est.id}
                                                establishment={est}
                                                onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Individual Service Offerings */}
                                {filteredServices.length > 0 ? (
                                    <div className="shop-grid">
                                        {(activeTab === 'all' ? filteredServices.slice(0, 4) : filteredServices).map(service => (
                                            <div key={service.id} className="product-card" onClick={() => navigate(`/shop/service/${service.id}`)}>
                                                {service.image ? (
                                                    <img src={service.image} alt={service.name} className="product-card-image" />
                                                ) : (
                                                    <div className="product-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Briefcase size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                                                    </div>
                                                )}
                                                <div className="product-card-body">
                                                    <span className="product-card-type service">Service</span>
                                                    <h3 className="product-card-name">{service.name}</h3>
                                                    <p className="product-card-desc">{service.description}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{service.duration_minutes} min</span>
                                                        {service.service_mode_display && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>• {service.service_mode_display}</span>
                                                        )}
                                                    </div>
                                                    <div className="product-card-footer">
                                                        <span className="product-card-price">${(Number(service.price) || 0).toFixed(2)}</span>
                                                        <button className="product-card-btn">Book</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : serviceEstablishments.length === 0 && (
                                    <div className="shop-empty">
                                        <Briefcase size={48} />
                                        <h3>No services yet</h3>
                                        <p>Offer your skills and services with appointment scheduling.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overall empty state */}
                        {!loading && filteredProducts.length === 0 && filteredEstablishments.length === 0 && filteredServices.length === 0 && (
                            <div className="shop-empty">
                                <ShoppingBag size={64} />
                                <h3>No results found</h3>
                                <p>Try adjusting your search or explore a different category.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
