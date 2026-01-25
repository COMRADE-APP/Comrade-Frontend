import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Image as ImageIcon, DollarSign, Tag, Save, Send, X } from 'lucide-react';
import api from '../../services/api';

const PRODUCT_TYPES = [
    { value: 'physical', label: 'Physical Product' },
    { value: 'digital', label: 'Digital Product' },
    { value: 'service', label: 'Service' },
    { value: 'subscription', label: 'Subscription' },
];

const CreateProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [productImage, setProductImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        product_type: 'physical',
        is_sharable: true,
        requires_subscription: false,
        duration_days: 30,
    });

    const handleSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            if (productImage) {
                submitData.append('image', productImage);
            }

            await api.post('/api/payments/products/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Product created successfully!');
            navigate('/shop');
        } catch (error) {
            console.error('Failed to create product:', error);
            alert(error.response?.data?.detail || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/shop')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* Product Image */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition-colors">
                            {productImage ? (
                                <div className="relative">
                                    <img src={URL.createObjectURL(productImage)} alt="" className="max-h-48 mx-auto rounded-lg" />
                                    <button onClick={() => setProductImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <label className="cursor-pointer text-primary-600 hover:underline">
                                        Upload product image
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setProductImage(e.target.files?.[0])} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Product Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter product name"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Describe your product..."
                            required
                        />
                    </div>

                    {/* Price & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign size={16} className="inline mr-1" /> Price *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Tag size={16} className="inline mr-1" /> Product Type
                            </label>
                            <select
                                value={formData.product_type}
                                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                {PRODUCT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="mb-6 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_sharable}
                                onChange={(e) => setFormData({ ...formData, is_sharable: e.target.checked })}
                                className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Allow group purchases</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.requires_subscription}
                                onChange={(e) => setFormData({ ...formData, requires_subscription: e.target.checked })}
                                className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Requires subscription</span>
                        </label>
                    </div>

                    {formData.product_type === 'subscription' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Duration (days)</label>
                            <input
                                type="number"
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/shop')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowConfirmation(true)}
                            disabled={loading || !formData.name || !formData.price}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Send size={18} /> Create Product
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">📦 Create Product?</h3>
                        <p className="text-gray-600 mb-6">
                            Your product will be created and available in the shop.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                {loading ? 'Creating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateProduct;
