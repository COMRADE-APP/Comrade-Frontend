import React, { useState, useEffect } from 'react';
import { Plus, Zap, Clock, Power, Shield, Settings2, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupAutomationsTab = ({ groupId }) => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formData, setFormData] = useState({
        order_type: 'payment',
        amount: '',
        frequency: 'monthly',
        execution_day: '1',
    });

    useEffect(() => {
        loadAutomations();
    }, [groupId]);

    const loadAutomations = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupAutomations(groupId);
            setAutomations(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await paymentsService.createGroupAutomation(groupId, {
                order_type: formData.order_type,
                amount: parseFloat(formData.amount),
                frequency: formData.frequency,
                execution_day: parseInt(formData.execution_day, 10),
                is_active: true
            });
            setShowCreateModal(false);
            setFormData({ order_type: 'payment', amount: '', frequency: 'monthly', execution_day: '1' });
            loadAutomations();
        } catch (error) {
            console.error('Error creating automation:', error);
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Automations</h3>
                    <p className="text-sm text-secondary">Set up recurring bills, automated transfers, and smart triggers.</p>
                </div>
                <Button variant="primary" className="gap-2" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> New Automation
                </Button>
            </div>

            {automations.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-fuchsia-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Automations Active</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Automate group bill payments, standing orders, or scheduled internal transfers.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Set Up Automation
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {automations.map(auto => (
                        <Card key={auto.id} className="border-theme">
                            <CardBody className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">{auto.automation_type || 'Recurring Payment'}</h4>
                                            <p className="text-xs text-secondary">{auto.frequency} • Next run: {auto.next_run_date || 'TBD'}</p>
                                        </div>
                                    </div>
                                    <button className="text-secondary hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-3 bg-secondary/5 rounded-xl border border-theme flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-secondary" />
                                        <span className="text-xs font-medium text-primary">Amount</span>
                                    </div>
                                    <div className="text-sm font-bold text-primary">{formatMoneySimple(auto.amount)}</div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${auto.is_active ? 'bg-emerald-500' : 'bg-secondary'}`} />
                                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{auto.is_active ? 'Active' : 'Paused'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="p-2"><Settings2 className="w-3.5 h-3.5" /></Button>
                                        <Button variant="outline" size="sm" className="p-2 text-rose-500 border-rose-100"><Power className="w-3.5 h-3.5" /></Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Automation Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-theme shadow-2xl">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-fuchsia-500" />
                                    New Automation
                                </h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-primary">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Automation Type</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-fuchsia-500"
                                        value={formData.order_type}
                                        onChange={(e) => setFormData({...formData, order_type: e.target.value})}
                                    >
                                        <option value="payment">Recurring Payment / Bill</option>
                                        <option value="transfer">Internal Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Amount (USD)</label>
                                    <input 
                                        type="number"
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-fuchsia-500"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Frequency</label>
                                        <select 
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-fuchsia-500"
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Execution Day</label>
                                        <input 
                                            type="number"
                                            className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-fuchsia-500"
                                            placeholder="Day of month (1-31)"
                                            value={formData.execution_day}
                                            onChange={(e) => setFormData({...formData, execution_day: e.target.value})}
                                            required
                                            min="1"
                                            max="31"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1 !bg-fuchsia-600 hover:!bg-fuchsia-700" disabled={createLoading}>
                                        {createLoading ? 'Creating...' : 'Create Automation'}
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

export default GroupAutomationsTab;
