import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Users, ArrowLeft, Target, DollarSign, Calendar } from 'lucide-react';
import paymentsService from '../../services/payments.service';

const CreatePaymentGroup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        contribution_type: 'fixed',
        contribution_amount: '',
        frequency: 'monthly',
        deadline: '',
        is_public: true,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                target_amount: parseFloat(formData.target_amount) || 0,
                contribution_amount: parseFloat(formData.contribution_amount) || 0,
            };
            await paymentsService.createPaymentGroup(payload);
            navigate('/payments');
        } catch (error) {
            console.error('Failed to create payment group:', error);
            alert('Failed to create payment group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/payments')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Payment Group</h1>
                    <p className="text-gray-600 mt-1">Set up a group savings goal or contribution pool</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                Group Details
                            </h3>

                            <Input
                                label="Group Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Team Vacation Fund"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe the purpose of this payment group..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Financial Settings */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-600" />
                                Financial Settings
                            </h3>

                            <Input
                                label="Target Amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.target_amount}
                                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                placeholder="e.g., 1000.00"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Type</label>
                                    <select
                                        value={formData.contribution_type}
                                        onChange={(e) => setFormData({ ...formData, contribution_type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="flexible">Flexible</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>

                                <Input
                                    label="Contribution Amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.contribution_amount}
                                    onChange={(e) => setFormData({ ...formData, contribution_amount: e.target.value })}
                                    placeholder="e.g., 50.00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="once">One-time</option>
                                    </select>
                                </div>

                                <Input
                                    label="Deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-gray-900">Visibility</h3>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="is_public" className="text-sm text-gray-700">
                                    Make this group public (visible to all users)
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate('/payments')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                disabled={loading || !formData.name}
                            >
                                {loading ? 'Creating...' : 'Create Payment Group'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default CreatePaymentGroup;
