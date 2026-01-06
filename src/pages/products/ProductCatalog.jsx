import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductCatalog.css';

const API_BASE_URL = 'http://localhost:8000/api/payments';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const url = selectedCategory
                ? `${API_BASE_URL}/products/?category=${selectedCategory}`
                : `${API_BASE_URL}/products/`;

            const response = await axios.get(url);
            setProducts(response.data);

            // Extract unique categories
            const uniqueCategories = [...new Set(response.data.map(p => p.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const ProductCard = ({ product }) => (
        <div className="product-card">
            {product.image && (
                <img src={product.image} alt={product.name} className="product-image" />
            )}
            <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                    <span className="product-price">${product.price}</span>
                    <span className={`stock-status ${product.is_available ? 'in-stock' : 'out-of-stock'}`}>
                        {product.is_available ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                    </span>
                </div>
                <button
                    className="btn-purchase"
                    disabled={!product.is_available}
                >
                    Purchase
                </button>
            </div>
        </div>
    );

    if (loading) {
        return <div className="loading">Loading products...</div>;
    }

    return (
        <div className="product-catalog">
            <div className="catalog-header">
                <h1>Product Catalog</h1>
                <div className="category-filter">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="products-grid">
                {products.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductCatalog;
