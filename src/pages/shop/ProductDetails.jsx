import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import shopService from '../../services/shop.service';
import paymentsService from '../../services/payments.service';
import Button from '../../components/common/Button';
import { ShoppingBag, ArrowLeft, Check, Shield, Clock, Info } from 'lucide-react';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            const data = await shopService.getProduct(id);
            setProduct(data);
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            await paymentsService.createTransaction({
                recipient_email: 'system', // or handle backend logic to fetch based on internal shop
                amount: product.price,
                transaction_type: 'purchase',
                payment_option: 'comrade_balance',
                notes: `Purchase of ${product.name}`
            });
            alert('Purchase successful!');
            navigate('/shop');
        } catch (error) {
            alert('Purchase failed. Check balance.');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!product) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Product not found</h2>
            <Button onClick={() => navigate('/shop')} className="mt-4">Back to Shop</Button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in py-8">
            <button
                onClick={() => navigate('/shop')}
                className="flex items-center text-secondary hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="bg-elevated rounded-3xl p-8 shadow-sm border border-theme flex items-center justify-center min-h-[400px]">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-w-full max-h-[500px] object-contain rounded-xl hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <ShoppingBag className="w-32 h-32 text-tertiary" />
                    )}
                </div>

                {/* Details Section */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                {product.product_type}
                            </span>
                            {product.requires_subscription && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Subscription Required
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-primary mb-4">{product.name}</h1>
                        <p className="text-lg text-secondary leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    <div className="bg-secondary rounded-2xl p-6 border border-theme">
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-primary">${product.price}</span>
                            <span className="text-secondary mb-2">USD</span>
                        </div>
                        <p className="text-sm text-secondary">
                            Includes all taxes and fees. Instant delivery.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            className="w-full py-4 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20"
                            onClick={handlePurchase}
                            disabled={purchasing}
                        >
                            {purchasing ? 'Processing...' : (product.product_type === 'subscription' ? 'Subscribe Now' : 'Buy Now')}
                        </Button>
                        <p className="text-center text-sm text-secondary flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            Secure payment via Qomrade Balance
                        </p>
                    </div>

                    <div className="pt-8 border-t border-theme">
                        <h3 className="font-semibold text-primary mb-4">Product Features</h3>
                        <ul className="space-y-3">
                            {[1, 2, 3].map((_, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="text-secondary">Premium feature included with this purchase</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
