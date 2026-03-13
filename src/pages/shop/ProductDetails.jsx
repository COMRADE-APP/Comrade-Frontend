import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import shopService from '../../services/shop.service';
import { paymentsService } from '../../services/payments.service';
import API_ENDPOINTS from '../../constants/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import {
    ShoppingBag, ArrowLeft, Check, Shield, Clock, Info,
    ShoppingCart, Users, User, Share2, Lock, Star, Package
} from 'lucide-react';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [id]);

    useEffect(() => {
        if (purchaseType === 'group' && paymentGroups.length === 0) {
            (async () => {
                try {
                    const data = await paymentsService.getMyGroups();
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    setPaymentGroups(list);
                } catch (e) { console.error(e); }
            })();
        }
    }, [purchaseType]);

    const loadProduct = async () => {
        try {
            const data = await shopService.getProduct(id);
            setProduct(data);
            // If product doesn't allow group purchase, force individual
            if (data && data.allow_group_purchase === false) {
                setPurchaseType('individual');
            }
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = () => {
        const selectedGroup = purchaseType === 'group'
            ? paymentGroups.find(g => g.id === selectedGroupId)
            : null;

        navigate('/payments/checkout', {
            state: {
                product: {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image_url: product.image_url,
                    product_type: product.product_type,
                    is_sharable: product.is_sharable,
                    allow_group_purchase: product.allow_group_purchase,
                },
                purchaseType,
                selectedGroupId: selectedGroupId || null,
                selectedGroup,
            }
        });
    };

    const handleAddToCart = () => {
        try {
            const saved = localStorage.getItem('comrade_cart');
            const items = saved ? JSON.parse(saved) : [];
            const idx = items.findIndex(i => i.id === product.id && i.type === 'product');
            if (idx >= 0) {
                items[idx].qty += 1;
            } else {
                items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    type: 'product',
                    image: product.image_url,
                    is_sharable: product.is_sharable,
                    allow_group_purchase: product.allow_group_purchase,
                    qty: 1,
                });
            }
            localStorage.setItem('comrade_cart', JSON.stringify(items));
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!product) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-primary">Product not found</h2>
            <Button onClick={() => navigate('/shop')} className="mt-4">Back to Shop</Button>
        </div>
    );

    const groupAllowed = product.allow_group_purchase !== false;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in py-8 px-4">
            <button
                onClick={() => navigate('/shop')}
                className="flex items-center text-secondary hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="bg-elevated rounded-3xl p-8 shadow-sm border border-theme flex items-center justify-center min-h-[400px] relative overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="max-w-full max-h-[500px] object-contain rounded-xl hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-900/20 to-indigo-900/20 flex items-center justify-center">
                                <Package className="w-16 h-16 text-tertiary opacity-40" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${product.product_type === 'digital' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            product.product_type === 'service' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                product.product_type === 'subscription' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                            {product.product_type}
                        </span>
                        {product.is_sharable && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                <Share2 size={12} /> Sharable
                            </span>
                        )}
                        {!groupAllowed && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                                <Lock size={12} /> Individual Only
                            </span>
                        )}
                        {product.requires_subscription && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <Clock size={12} /> Subscription
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">{product.name}</h1>
                        <p className="text-base text-secondary leading-relaxed">{product.description}</p>
                    </div>

                    {/* Price Card */}
                    <div className="bg-secondary/20 rounded-2xl p-6 border border-theme">
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                            <span className="text-secondary mb-2">USD</span>
                        </div>
                        <p className="text-sm text-secondary">
                            Includes all taxes and fees. {product.product_type === 'digital' ? 'Instant delivery.' : 'Shipping calculated at checkout.'}
                        </p>
                    </div>

                    {/* Purchase Type Selector */}
                    {groupAllowed && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-primary">Purchase Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPurchaseType('individual')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${purchaseType === 'individual'
                                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                                        : 'border-theme text-secondary hover:bg-secondary/20'
                                        }`}
                                >
                                    <User size={16} /> Individual
                                </button>
                                <button
                                    onClick={() => setPurchaseType('group')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${purchaseType === 'group'
                                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                                        : 'border-theme text-secondary hover:bg-secondary/20'
                                        }`}
                                >
                                    <Users size={16} /> Group Purchase
                                </button>
                            </div>
                            {purchaseType === 'group' && (
                                <div className="space-y-2 bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-elevated border border-theme rounded-xl text-sm text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Select your group...</option>
                                        {paymentGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.member_count || 0} members)</option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-secondary flex items-center gap-1">
                                        <Info size={12} />
                                        {product.is_sharable
                                            ? 'This is a sharable product — 1 item will be shared among all group members.'
                                            : 'This is a non-sharable product — 1 item per member will be purchased (qty = group size).'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 py-4 text-base border-2"
                            onClick={handleAddToCart}
                        >
                            {addedToCart ? (
                                <><Check className="w-5 h-5 mr-2 text-green-500" /> Added!</>
                            ) : (
                                <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</>
                            )}
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 py-4 text-base bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/20"
                            onClick={handlePurchase}
                            disabled={purchaseType === 'group' && !selectedGroupId}
                        >
                            {product.product_type === 'subscription' ? 'Subscribe Now' : 'Buy Now'}
                        </Button>
                    </div>

                    <p className="text-center text-sm text-secondary flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Secure payment via Qomrade Balance
                    </p>

                    {/* Product Info */}
                    <div className="pt-6 border-t border-theme space-y-4">
                        <h3 className="font-semibold text-primary">Product Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-secondary/10 rounded-xl">
                                <p className="text-xs text-tertiary mb-1">Type</p>
                                <p className="text-sm font-medium text-primary capitalize">{product.product_type}</p>
                            </div>
                            <div className="p-3 bg-secondary/10 rounded-xl">
                                <p className="text-xs text-tertiary mb-1">Sharing</p>
                                <p className="text-sm font-medium text-primary">{product.is_sharable ? 'Sharable' : 'Non-sharable'}</p>
                            </div>
                            <div className="p-3 bg-secondary/10 rounded-xl">
                                <p className="text-xs text-tertiary mb-1">Group Purchase</p>
                                <p className="text-sm font-medium text-primary">{groupAllowed ? 'Allowed' : 'Individual Only'}</p>
                            </div>
                            {product.product_type === 'subscription' && (
                                <div className="p-3 bg-secondary/10 rounded-xl">
                                    <p className="text-xs text-tertiary mb-1">Duration</p>
                                    <p className="text-sm font-medium text-primary">{product.duration_days || 30} days</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
