import React, { useState, useEffect } from 'react';
import paymentsService from '../services/payments.service';

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const data = await paymentService.getPaymentMethods();
            setPaymentMethods(data);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (methodId) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return;

        try {
            await paymentService.deletePaymentMethod(methodId);
            fetchPaymentMethods();
        } catch (error) {
            console.error('Error deleting payment method:', error);
            alert('Failed to remove payment method');
        }
    };

    const handleSetDefault = async (methodId) => {
        try {
            await paymentService.setDefaultPaymentMethod(methodId);
            fetchPaymentMethods();
        } catch (error) {
            console.error('Error setting default:', error);
            alert('Failed to set default payment method');
        }
    };

    const getCardBrandIcon = (brand) => {
        const icons = {
            visa: '💳',
            mastercard: '💳',
            amex: '💳',
            discover: '💳',
        };
        return icons[brand?.toLowerCase()] || '💳';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        + Add Payment Method
                    </button>
                </div>

                {/* Security Badge */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <p className="text-sm font-medium text-blue-900">Secure & Encrypted</p>
                            <p className="text-xs text-blue-700">
                                Your payment information is encrypted with bank-level security (AES-256-GCM)
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading payment methods...</p>
                    </div>
                ) : paymentMethods.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500 mb-4">No payment methods added yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Add Your First Payment Method
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                className={`bg-white rounded-lg shadow p-6 ${method.is_default ? 'ring-2 ring-primary-500' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-4xl">{getCardBrandIcon(method.card_brand)}</span>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-lg font-medium text-gray-900">
                                                    {method.card_brand?.toUpperCase()} ••••{method.card_last4}
                                                </p>
                                                {method.is_default && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {method.method_type === 'card' ? 'Credit/Debit Card' : method.method_type}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {!method.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(method.id)}
                                                className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Payment Method Modal - Placeholder */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-4">Add Payment Method</h2>
                            <p className="text-gray-600 mb-6">
                                Stripe Elements integration will be added here for secure card input
                            </p>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentMethods;
