import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import shopService from '../../services/shop.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ShoppingBag, Star, Filter, Search, Tag, ArrowRight } from 'lucide-react';

const Shop = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await shopService.getProducts();
            // Handle both array and paginated responses
            const productsList = Array.isArray(data) ? data : (data?.results || []);
            setProducts(productsList);
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesType = filter === 'all' || product.product_type === filter;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const categories = [
        { id: 'all', label: 'All Items' },
        { id: 'physical', label: 'Physical' },
        { id: 'digital', label: 'Digital' },
        { id: 'service', label: 'Services' },
        { id: 'subscription', label: 'Subscriptions' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium">
                            <Star className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" />
                            Premium Store
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Upgrade Your Experience
                        </h1>
                        <p className="text-lg text-white/90">
                            Discover exclusive resources, tools, and subscriptions to elevate your journey.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <ShoppingBag className="w-48 h-48 text-white/20 rotate-12" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-10 bg-elevated/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${filter === cat.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-elevated text-secondary hover:bg-secondary/10 border border-theme'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-elevated border border-theme text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 bg-tertiary/10 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-elevated rounded-3xl border border-dashed border-theme">
                    <ShoppingBag className="w-16 h-16 text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary">No products found</h3>
                    <p className="text-secondary">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="group bg-elevated rounded-2xl border border-theme shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="relative h-48 bg-secondary overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-tertiary/10">
                                        <ShoppingBag className="w-12 h-12 text-tertiary" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-1 bg-elevated/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-primary border border-theme">
                                        {product.product_type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                    {product.name}
                                </h3>
                                <p className="text-sm text-secondary line-clamp-2 mb-4 flex-1">
                                    {product.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-theme">
                                    <span className="text-xl font-bold text-primary">
                                        ${product.price}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/shop/${product.id}`)}
                                        className="p-2 rounded-full bg-secondary text-secondary hover:bg-primary hover:text-white transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shop;
