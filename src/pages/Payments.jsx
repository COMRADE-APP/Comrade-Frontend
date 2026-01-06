import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { CreditCard, DollarSign, TrendingUp, Download, Filter, X } from 'lucide-react';
import paymentsService from '../services/payments.service';
import { formatDate } from '../utils/dateFormatter';

const Payments = () => {
    const { user } = useAuth();
    const [paymentProfile, setPaymentProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSendModal, setShowSendModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sendData, setSendData] = useState({
        amount: '',
        recipient: '',
        payment_option: 'comrade_balance',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profile, txns] = await Promise.all([
                paymentsService.getProfile().catch(() => null),
                paymentsService.getTransactions().catch(() => []),
            ]);
            setPaymentProfile(profile);
            setTransactions(Array.isArray(txns) ? txns : []);
        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMoney = async (e) => {
        e.preventDefault();
        try {
            await paymentsService.createTransaction(sendData);
            setShowSendModal(false);
            setSendData({ amount: '', recipient: '', payment_option: 'comrade_balance' });
            loadData();
        } catch (error) {
            alert('Failed to send payment');
        }
    };

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.transaction_type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Manage your transactions and wallet</p>
                </div>
                <Button variant="primary" onClick={() => setShowSendModal(true)}>
                    Send Money
                </Button>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm mb-2">Comrade Balance</p>
                            <h2 className="text-4xl font-bold">
                                ${paymentProfile?.comrade_balance || '0.00'}
                            </h2>
                        </div>
                        <CreditCard className="w-12 h-12 text-primary-200" />
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-primary-100 text-xs">This Month</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-xs">Spent</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-xs">Earned</p>
                            <p className="text-lg font-semibold">$0.00</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Received</p>
                                <p className="text-xl font-bold text-gray-900">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Sent</p>
                                <p className="text-xl font-bold text-gray-900">$0.00</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Transactions</p>
                                <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'purchase', 'deposit', 'withdrawal', 'transfer'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </CardHeader>
                <CardBody className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredTransactions.map((txn, idx) => (
                                <TransactionRow key={idx} transaction={txn} />
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Send Money Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Send Money</h2>
                                <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSendMoney} className="space-y-4">
                                <Input
                                    label="Amount"
                                    type="number"
                                    step="0.01"
                                    value={sendData.amount}
                                    onChange={(e) => setSendData({ ...sendData, amount: e.target.value })}
                                    required
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Recipient Email"
                                    type="email"
                                    value={sendData.recipient}
                                    onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
                                    required
                                    placeholder="recipient@example.com"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={sendData.payment_option}
                                        onChange={(e) => setSendData({ ...sendData, payment_option: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="comrade_balance">Comrade Balance</option>
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="stripe">Stripe</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" type="button" onClick={() => setShowSendModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Send ${sendData.amount || '0.00'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const TransactionRow = ({ transaction }) => (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.transaction_type === 'deposit' ? 'bg-green-100' :
                    transaction.transaction_type === 'withdrawal' ? 'bg-red-100' :
                        'bg-blue-100'
                }`}>
                <DollarSign className={`w-5 h-5 ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                        transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                            'text-blue-600'
                    }`} />
            </div>
            <div>
                <h4 className="font-medium text-gray-900 capitalize">{transaction.transaction_type || 'Transaction'}</h4>
                <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-semibold ${transaction.transaction_type === 'deposit' ? 'text-green-600' :
                    transaction.transaction_type === 'withdrawal' ? 'text-red-600' :
                        'text-gray-900'
                }`}>
                {transaction.transaction_type === 'withdrawal' ? '-' : '+'}${transaction.amount || '0.00'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{transaction.status || 'pending'}</p>
        </div>
    </div>
);

export default Payments;
