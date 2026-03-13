/**
 * EventTicketing Component
 * Handle ticket purchase with payment integration
 */
import React, { useState } from 'react';
import { Ticket, CreditCard, QrCode, Download } from 'lucide-react';
import eventsService from '../../services/events.service';
import Button from '../common/Button';

const EventTicketing = ({ event, tickets = [] }) => {
    // Map of ticket.id -> quantity selected
    const [selectedQuantities, setSelectedQuantities] = useState({});
    const [paymentOption, setPaymentOption] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [purchasedTickets, setPurchasedTickets] = useState([]);

    const paymentMethods = [
        { value: 'stripe', label: 'Credit/Debit Card (Stripe)', icon: CreditCard },
        { value: 'paypal', label: 'PayPal', icon: CreditCard },
        { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
        { value: 'comrade_balance', label: 'Qomrade Balance', icon: CreditCard },
    ];

    const totalTicketsSelected = Object.values(selectedQuantities).reduce((sum, q) => sum + q, 0);

    const handlePurchase = async () => {
        if (totalTicketsSelected === 0) {
            alert('Please select at least one ticket');
            return;
        }

        setLoading(true);
        try {
            // Build payload for bulk processing
            const ticketsPayload = Object.entries(selectedQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({
                    ticket_id: parseInt(id),
                    quantity: qty
                }));

            // The backend endpoint typically anticipates an array or similar,
            // or we might need to iterate. Let's send `tickets_data` containing the array.
            const response = await eventsService.purchaseTicket(event.id, {
                tickets_data: ticketsPayload,
                payment_option: paymentOption
            });

            // If response returns multiple, concat them. If single, append it.
            const purchases = Array.isArray(response.data) ? response.data : (response.data?.purchases || [response.data]);
            setPurchasedTickets([...purchasedTickets, ...purchases]);
            alert('Tickets purchased successfully! Check your email for confirmation.');
            setSelectedQuantities({});
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to purchase tickets');
        } finally {
            setLoading(false);
        }
    };

    const getTotalPrice = () => {
        let total = 0;
        tickets.forEach(ticket => {
            const qty = selectedQuantities[ticket.id] || 0;
            total += (parseFloat(ticket.price) * qty);
        });
        return total.toFixed(2);
    };

    const handleQuantityChange = (ticketId, delta, maxAvailable) => {
        setSelectedQuantities(prev => {
            const current = prev[ticketId] || 0;
            const next = current + delta;
            if (next < 0) return prev;
            if (next > maxAvailable) return prev;

            const newState = { ...prev };
            newState[ticketId] = next;
            if (newState[ticketId] === 0) delete newState[ticketId];
            return newState;
        });
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
                    {tickets.map((ticket) => {
                        const isSelected = (selectedQuantities[ticket.id] || 0) > 0;
                        const qty = selectedQuantities[ticket.id] || 0;
                        return (
                            <div
                                key={ticket.id}
                                className={`p-4 border-2 rounded-lg transition-all ${isSelected
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{ticket.ticket_type || ticket.name}</h4>
                                        <p className="text-2xl font-bold text-primary-600 mt-1">
                                            ${parseFloat(ticket.price).toFixed(2)}
                                        </p>
                                        {(ticket.group_size_allowed > 1) && (
                                            <p className="text-sm text-gray-600 mt-1">Admit: {ticket.group_size_allowed}</p>
                                        )}
                                        {ticket.custom_criteria && (
                                            <p className="text-xs text-blue-600 mt-1">{ticket.custom_criteria}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-gray-600">Available</span>
                                        <p className="font-semibold text-gray-900">{ticket.capacity || ticket.quantity_available}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleQuantityChange(ticket.id, -1, ticket.capacity || ticket.quantity_available)}
                                                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600 font-medium"
                                                disabled={qty <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-semibold text-gray-900">{qty}</span>
                                            <button
                                                onClick={() => handleQuantityChange(ticket.id, 1, ticket.capacity || ticket.quantity_available)}
                                                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-600 font-medium"
                                                disabled={qty >= (ticket.capacity || ticket.quantity_available)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Method */}
            {totalTicketsSelected > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Payment Method</h3>
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
            {totalTicketsSelected > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Summary</h3>
                    <div className="space-y-3 mb-4">
                        {tickets.map(ticket => {
                            const qty = selectedQuantities[ticket.id] || 0;
                            if (qty === 0) return null;
                            return (
                                <div key={ticket.id} className="flex justify-between text-gray-700 text-sm">
                                    <span>{ticket.ticket_type || ticket.name} <span className="text-gray-500">x {qty}</span></span>
                                    <span className="font-medium">${(parseFloat(ticket.price) * qty).toFixed(2)}</span>
                                </div>
                            );
                        })}
                        <div className="flex justify-between font-semibold text-lg text-gray-900 pt-3 border-t border-gray-300">
                            <span>Total</span>
                            <span className="text-primary-600">${getTotalPrice()}</span>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full mt-4"
                        onClick={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `Purchase Tickets - $${getTotalPrice()}`}
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
