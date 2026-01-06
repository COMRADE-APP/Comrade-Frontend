/**
 * EventTicketing Component
 * Handle ticket purchase with payment integration
 */
import React, { useState } from 'react';
import { Ticket, CreditCard, QrCode, Download } from 'lucide-react';
import eventsService from '../../services/events.service';
import Button from '../common/Button';

const EventTicketing = ({ event, tickets = [] }) => {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentOption, setPaymentOption] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [purchasedTickets, setPurchasedTickets] = useState([]);

    const paymentMethods = [
        { value: 'stripe', label: 'Credit/Debit Card (Stripe)', icon: CreditCard },
        { value: 'paypal', label: 'PayPal', icon: CreditCard },
        { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
        { value: 'comrade_balance', label: 'Comrade Balance', icon: CreditCard },
    ];

    const handlePurchase = async () => {
        if (!selectedTicket) {
            alert('Please select a ticket type');
            return;
        }

        setLoading(true);
        try {
            const response = await eventsService.purchaseTicket(event.id, {
                ticket_id: selectedTicket.id,
                quantity,
                payment_option: paymentOption
            });

            setPurchasedTickets([...purchasedTickets, response.data]);
            alert('Ticket purchased successfully! Check your email for confirmation.');
            setSelectedTicket(null);
            setQuantity(1);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to purchase ticket');
        } finally {
            setLoading(false);
        }
    };

    const getTotalPrice = () => {
        return selectedTicket ? (parseFloat(selectedTicket.price) * quantity).toFixed(2) : '0.00';
    };

    return (
        <div className="space-y-6">
            {/* Ticket Types */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Available Tickets
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTicket?.id === ticket.id
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{ticket.ticket_type}</h4>
                                    <p className="text-2xl font-bold text-primary-600 mt-1">
                                        ${parseFloat(ticket.price).toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-gray-600">Available</span>
                                    <p className="font-semibold text-gray-900">{ticket.quantity_available}</p>
                                </div>
                            </div>

                            {selectedTicket?.id === ticket.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center gap-4">
                                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuantity(Math.max(1, quantity - 1));
                                                }}
                                                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center font-semibold">{quantity}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuantity(Math.min(ticket.quantity_available, quantity + 1));
                                                }}
                                                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Method */}
            {selectedTicket && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                    <div className="space-y-2">
                        {paymentMethods.map((method) => (
                            <label
                                key={method.value}
                                className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value={method.value}
                                    checked={paymentOption === method.value}
                                    onChange={(e) => setPaymentOption(e.target.value)}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <method.icon className="w-5 h-5 text-gray-600" />
                                <span className="flex-1 font-medium text-gray-900">{method.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary & Purchase */}
            {selectedTicket && (
                <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-gray-700">
                            <span>{selectedTicket.ticket_type} x {quantity}</span>
                            <span>${(parseFloat(selectedTicket.price) * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-primary-600">${getTotalPrice()}</span>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `Purchase Ticket - $${getTotalPrice()}`}
                    </Button>
                </div>
            )}

            {/* Purchased Tickets */}
            {purchasedTickets.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Your Tickets</h3>
                    <div className="space-y-3">
                        {purchasedTickets.map((purchase, index) => (
                            <div key={index} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <QrCode className="w-6 h-6 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {purchase.quantity}x {purchase.ticket_type}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Status: <span className="text-green-600 font-medium">{purchase.payment_status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventTicketing;
