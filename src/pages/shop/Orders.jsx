import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Package, Truck, Clock, CheckCircle, XCircle, Bell,
    ChevronRight, ChevronDown, Loader2, Calendar, MapPin, AlertCircle, RefreshCw, Wallet
} from 'lucide-react';
import shopService from '../../services/shop.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle },
    in_progress: { label: 'In Progress', color: 'bg-primary-600/10 text-primary-700 border-primary-600/20', icon: RefreshCw },
    completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: Package },
    delivered: { label: 'Delivered', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: Truck },
};

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    const tabs = [
        { id: 'all', label: 'All Orders', icon: Package },
        { id: 'reminders', label: 'Reminders', icon: Bell },
        { id: 'pickup', label: 'Pickup', icon: MapPin },
        { id: 'delivery', label: 'Delivery', icon: Truck },
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await shopService.getOrders();
            const list = Array.isArray(data) ? data : data?.results || [];
            setOrders(list);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        switch (activeTab) {
            case 'reminders':
                return orders.filter(o => o.reminder_set || o.has_reminder);
            case 'pickup':
                return orders.filter(o => o.status === 'ready_for_pickup' || o.delivery_method === 'pickup');
            case 'delivery':
                return orders.filter(o => o.status === 'delivered' || o.status === 'in_transit' || o.delivery_method === 'delivery');
            default:
                return orders;
        }
    };

    const filtered = getFilteredOrders();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-secondary hover:text-primary mb-6">
                    <ArrowLeft size={18} /> Back to Shop
                </button>

                <h1 className="text-3xl font-bold text-primary flex items-center gap-3 mb-8">
                    <Package /> My Orders
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-elevated p-1 rounded-xl border border-theme overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-secondary hover:text-primary hover:bg-secondary/10'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-secondary">Loading orders...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-primary mb-2">No orders found</h3>
                        <p className="text-secondary mb-4">
                            {activeTab === 'all' ? 'You haven\'t placed any orders yet' : `No ${activeTab} orders`}
                        </p>
                        <Button variant="primary" onClick={() => navigate('/shop')}>Browse Services</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(order => {
                            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                            const StatusIcon = statusCfg.icon;

                            return (
                                <Card 
                                    key={order.id} 
                                    className={`transition-all duration-300 overflow-hidden border ${expandedOrderId === order.id ? 'border-primary shadow-md' : 'hover:shadow-md border-theme'}`}
                                >
                                    <CardBody className="p-0">
                                        <div 
                                            className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                                            onClick={() => toggleExpand(order.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-primary">{order.service_name || order.items?.[0]?.name || order.order_type_display || 'Order'}{order.items?.length > 1 ? ` + ${order.items.length - 1} more` : ''}</h4>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                                                        <StatusIcon size={12} />
                                                        {statusCfg.label}
                                                    </span>
                                                    {order.payment_type === 'group' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-600/10 text-primary-700 border border-primary-600/20 ml-2" title={order.group_name || 'Group Payment'}>
                                                            <Wallet size={12} /> {order.group_name ? `${order.group_name}` : 'Group Payment'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-secondary">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(order.created_at || order.date)}
                                                    </span>
                                                    {order.booking_date && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Booked: {formatDate(order.booking_date)}
                                                        </span>
                                                    )}
                                                    {order.total_amount && (
                                                        <span className="font-bold text-green-600">
                                                            ${parseFloat(order.total_amount).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {order.status === 'completed' && !order.reviewed && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/shop/service/${order.service_id || order.service}`); }}
                                                        className="text-sm"
                                                    >
                                                        Leave Review
                                                    </Button>
                                                )}
                                                <button className="p-2 text-secondary hover:text-primary transition-transform">
                                                    {expandedOrderId === order.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Details Section */}
                                        {expandedOrderId === order.id && (
                                            <div className="border-t border-theme bg-secondary/5 p-5 animate-in slide-in-from-top-2 duration-200">
                                                <h5 className="font-semibold text-primary mb-3 text-sm flex items-center gap-2">
                                                    <Package size={16} className="text-tertiary" /> Order Items
                                                </h5>
                                                {order.items && order.items.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-theme border-opacity-50 last:border-0 last:pb-0">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-primary">{item.name}</span>
                                                                    <span className="text-xs text-secondary">Qty: {item.quantity}</span>
                                                                </div>
                                                                <span className="font-semibold text-primary">
                                                                    ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between items-center pt-3 mt-2 border-t border-theme font-bold text-base">
                                                            <span className="text-secondary">Total</span>
                                                            <span className="text-green-600">${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-secondary italic">No item details available.</div>
                                                )}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
