import React, { useState, useEffect } from 'react';
import paymentService from '../../services/payment.service';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Target, Lock, Unlock, TrendingUp, Plus, Users, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

const PiggyBanks = () => {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null); // Target ID

    // Form States
    const [newTarget, setNewTarget] = useState({
        name: '',
        target_amount: '',
        description: '',
        maturity_date: '',
        locking_status: 'unlocked'
    });

    const [contributionAmount, setContributionAmount] = useState('');

    useEffect(() => {
        loadTargets();
    }, []);

    const loadTargets = async () => {
        try {
            const response = await paymentService.getTargets();
            setTargets(response.data || []);
        } catch (error) {
            console.error('Error loading targets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Logic to create target (needs logic in backend or passed group ID)
            // Ideally we select a group first. For MVP, assuming we pass a default group or user selects one.
            // Since UI for group selection is complex, I'll stub it.
            alert("To create a Piggy Bank, go to a Payment Group!");
            setShowCreateModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!showContributeModal) return;
        try {
            await paymentService.contributeToTarget(showContributeModal.id, contributionAmount);
            setShowContributeModal(null);
            setContributionAmount('');
            loadTargets();
            alert('Contribution successful!');
        } catch (error) {
            alert('Contribution failed.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Piggy Banks</h1>
                    <p className="text-gray-600 mt-1">Track your group savings and goals.</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    New Piggy Bank
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-pink-100 mb-1">Total Saved</p>
                                <h2 className="text-3xl font-bold">$12,450</h2>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-white border border-gray-200">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 mb-1">Active Goals</p>
                                <h2 className="text-3xl font-bold text-gray-900">{targets.length}</h2>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-white border border-gray-200">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 mb-1">Completion Rate</p>
                                <h2 className="text-3xl font-bold text-gray-900">84%</h2>
                            </div>
                            <div className="bg-green-50 p-3 rounded-full">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
                ) : targets.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No active Piggy Banks found.</p>
                    </div>
                ) : (
                    targets.map(target => (
                        <Card key={target.id} className="group hover:shadow-lg transition-shadow duration-300 border-gray-200">
                            <CardBody className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-xl ${target.achieved ? 'bg-green-100' : 'bg-rose-100'}`}>
                                            <Target className={`w-6 h-6 ${target.achieved ? 'text-green-600' : 'text-rose-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{target.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1">{target.description}</p>
                                        </div>
                                    </div>
                                    {target.locking_status !== 'unlocked' ? (
                                        <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                            <Lock className="w-3 h-3 mr-1" />
                                            Locked
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                            <Unlock className="w-3 h-3 mr-1" />
                                            Unlocked
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-700">${target.current_amount}</span>
                                        <span className="text-gray-400">Target: ${target.target_amount}</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(target.current_amount / target.target_amount) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {target.maturity_date ? formatDate(target.maturity_date) : 'No deadline'}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowContributeModal(target)}
                                        disabled={target.achieved}
                                    >
                                        Contribute
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md animate-in zoom-in duration-200">
                        <CardBody className="p-6">
                            <h3 className="text-xl font-bold mb-4">Contribute to {showContributeModal.name}</h3>
                            <form onSubmit={handleContribute} className="space-y-4">
                                <Input
                                    label="Amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowContributeModal(null)}>Cancel</Button>
                                    <Button type="submit" variant="primary">Confirm Contribution</Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PiggyBanks;
