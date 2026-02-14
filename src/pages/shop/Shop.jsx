import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag, UtensilsCrossed, Hotel, Store, Briefcase,
    Star, MapPin, Truck, Package, Clock, Plus, ArrowRight,
    Check, X, Loader2
} from 'lucide-react';
import shopService from '../../services/shop.service';
import Button from '../../components/common/Button';

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
    <div className="flex items-center gap-1 mb-2">
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    size={14}
                    className={`${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
        <span className="text-xs text-secondary font-medium ml-1">
            {Number(rating).toFixed(1)} <span className="text-tertiary">({count})</span>
        </span>
    </div>
);

const EstablishmentCard = ({ establishment, onClick }) => {
    const { name, description, establishment_type, establishment_type_display, categories, city, country, rating, review_count, logo, banner, delivery_available, pickup_available, dine_in_available, is_verified } = establishment;

    return (
        <div
            className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
            onClick={onClick}
        >
            <div className="h-40 w-full bg-secondary/10 relative overflow-hidden shrink-0">
                {banner ? (
                    <img src={banner} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <Store className="text-tertiary opacity-20" size={48} />
                    </div>
                )}
                {/* Logo overlay */}
                <div className="absolute -bottom-6 left-4">
                    <div className="w-12 h-12 rounded-xl border-2 border-elevated bg-elevated overflow-hidden shadow-sm">
                        {logo ? (
                            <img src={logo} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {name?.charAt(0)}
                            </div>
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
                                <span key={i} className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-3 border-t border-theme">
                        {pickup_available && (
                            <div className="flex items-center gap-1 text-xs text-secondary" title="Pickup Available">
                                <Package size={14} className="text-green-600" />
                                <span>Pickup</span>
                            </div>
                        )}
                        {delivery_available && (
                            <div className="flex items-center gap-1 text-xs text-secondary" title="Delivery Available">
                                <Truck size={14} className="text-green-600" />
                                <span>Delivery</span>
                            </div>
                        )}
                        {dine_in_available && (
                            <div className="flex items-center gap-1 text-xs text-secondary" title="Dine-in Available">
                                <UtensilsCrossed size={14} className="text-green-600" />
                                <span>Dine-in</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductCard = ({ product, onClick }) => (
    <div
        className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
        onClick={onClick}
    >
        <div className="h-48 w-full bg-secondary/5 relative overflow-hidden shrink-0">
            {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={40} className="text-tertiary opacity-30" />
                </div>
            )}
            <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md
                    ${product.product_type === 'service' ? 'bg-indigo-500/90 text-white' :
                        product.product_type === 'digital' ? 'bg-purple-500/90 text-white' :
                            product.product_type === 'subscription' ? 'bg-amber-500/90 text-white' :
                                'bg-white/90 text-slate-800 border border-slate-200 shadow-sm'
                    }`}>
                    {product.product_type}
                </span>
            </div>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
            <div>
                <h3 className="font-bold text-base text-primary line-clamp-2 leading-snug mb-1">{product.name}</h3>
                <p className="text-sm text-secondary line-clamp-2">{product.description}</p>
            </div>

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-theme">
                <span className="text-lg font-bold text-primary">${(Number(product.price) || 0).toFixed(2)}</span>
                <Button size="sm" variant={product.product_type === 'subscription' ? 'outline' : 'primary'}>
                    {product.product_type === 'subscription' ? 'Subscribe' : 'View'}
                </Button>
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
        <div className="min-h-screen bg-background p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">🛍️ Marketplace</h1>
                    <p className="text-secondary mt-1 max-w-2xl">Shop products, order food, book hotels, and find services — all in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                {loading ? (
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
                                        <button
                                            onClick={() => setActiveTab('products')}
                                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                                        >
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {(activeTab === 'all' ? filteredProducts.slice(0, 4) : filteredProducts).map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => navigate(`/shop/${product.id}`)}
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
                                        <button
                                            onClick={() => setActiveTab('food')}
                                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                                        >
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const foodItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => FOOD_TYPES.includes(e.establishment_type));

                                    return foodItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {foodItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
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
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Hotel className="text-blue-500" size={20} /> Hotels & Stays
                                    </h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button
                                            onClick={() => setActiveTab('hotels')}
                                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                                        >
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const hotelItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => HOTEL_TYPES.includes(e.establishment_type));

                                    return hotelItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {hotelItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                            <Hotel size={48} className="text-tertiary mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-primary">No hotels found</h3>
                                            <p className="text-secondary text-sm max-w-sm mt-1">No accommodations are currently listed.</p>
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Stores Section */}
                        {showStores && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Store className="text-purple-500" size={20} /> Supermarkets & Stores
                                    </h2>
                                    {activeTab === 'all' && filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type)).length > 4 && (
                                        <button
                                            onClick={() => setActiveTab('shops')}
                                            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                                        >
                                            See all <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    const storeItems = activeTab === 'all'
                                        ? filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type)).slice(0, 4)
                                        : filteredEstablishments.filter(e => STORE_TYPES.includes(e.establishment_type));

                                    return storeItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {storeItems.map(est => (
                                                <EstablishmentCard
                                                    key={est.id}
                                                    establishment={est}
                                                    onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-elevated border border-dashed border-theme rounded-xl text-center">
                                            <Store size={48} className="text-tertiary mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium text-primary">No stores found</h3>
                                            <p className="text-secondary text-sm max-w-sm mt-1">Check back later for supermarkets and stores.</p>
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Services Section */}
                        {showServices && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Briefcase className="text-indigo-500" size={20} /> Services & Appointments
                                    </h2>
                                </div>

                                {serviceEstablishments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                        {(activeTab === 'all' ? serviceEstablishments.slice(0, 4) : serviceEstablishments).map(est => (
                                            <EstablishmentCard
                                                key={est.id}
                                                establishment={est}
                                                onClick={() => navigate(`/shop/establishment/${est.id}`)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {filteredServices.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {(activeTab === 'all' ? filteredServices.slice(0, 4) : filteredServices).map(service => (
                                            <div
                                                key={service.id}
                                                className="bg-elevated border border-theme rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
                                                onClick={() => navigate(`/shop/service/${service.id}`)}
                                            >
                                                <div className="h-40 w-full bg-secondary/5 relative overflow-hidden shrink-0">
                                                    {service.image ? (
                                                        <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Briefcase size={32} className="text-tertiary opacity-30" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <span className="px-2 py-1 rounded-md bg-indigo-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
                                                            Service
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <h3 className="font-bold text-base text-primary line-clamp-1 mb-1">{service.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-secondary mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} /> {service.duration_minutes} min
                                                        </span>
                                                        {service.service_mode_display && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-tertiary"></span>
                                                                <span>{service.service_mode_display}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-secondary line-clamp-2 mb-3 flex-1">{service.description}</p>

                                                    <div className="pt-3 border-t border-theme flex items-center justify-between mt-auto">
                                                        <span className="font-bold text-primary">${(Number(service.price) || 0).toFixed(2)}</span>
                                                        <Button size="sm" variant="primary" className="h-8 text-xs">Book Now</Button>
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
                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setActiveTab('all');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
