import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Target, Plus, Check, DollarSign, Calendar, Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/payments';

const GroupTargets = () => {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTarget, setNewTarget] = useState({
        group: '',
        name: '',
        description: '',
        target_amount: '',
        target_date: ''
    });
    const [userGroups, setUserGroups] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchTargets();
        fetchUserGroups();
    }, []);

    const fetchTargets = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/targets/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTargets(response.data);
        } catch (error) {
            console.error('Error fetching targets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserGroups = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/payment-groups/my_groups/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const handleCreateTarget = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/targets/`, newTarget, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateForm(false);
            setNewTarget({ group: '', name: '', description: '', target_amount: '', target_date: '' });
            fetchTargets();
        } catch (error) {
            console.error('Error creating target:', error);
            alert('Failed to create target');
        }
    };

    const handleContribute = async (targetId) => {
        const amount = prompt('Enter contribution amount:');
        if (!amount) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/targets/${targetId}/contribute/`, {
                amount: parseFloat(amount)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTargets();
            alert('Contribution successful!');
        } catch (error) {
            console.error('Error contributing:', error);
            alert(error.response?.data?.error || 'Failed to contribute');
        }
    };

    const TargetCard = ({ target }) => {
        const progress = target.progress_percentage;
        const groupName = userGroups.find(g => g.id === target.group)?.name || 'Unknown Group';

        return (
            <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${target.is_achieved
                    ? 'bg-gradient-to-br from-green-600 to-green-700 text-white border-transparent shadow-lg transform hover:-translate-y-1'
                    : 'bg-elevated border-theme hover:shadow-xl hover:-translate-y-1'
                }`}>
                {target.is_achieved && (
                    <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> Goal Achieved!
                    </div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className={`font-bold text-xl mb-1 ${target.is_achieved ? 'text-white' : 'text-primary'}`}>{target.name}</h3>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${target.is_achieved ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'
                            }`}>
                            <Users className="w-3 h-3" />
                            {groupName}
                        </div>
                    </div>
                    <div className={`p-2 rounded-full ${target.is_achieved ? 'bg-white/20' : 'bg-primary/10'}`}>
                        <Target className={`w-5 h-5 ${target.is_achieved ? 'text-white' : 'text-primary'}`} />
                    </div>
                </div>

                <p className={`text-sm mb-4 line-clamp-2 ${target.is_achieved ? 'text-white/90' : 'text-secondary'}`}>
                    {target.description}
                </p>

                {target.target_date && (
                    <div className={`flex items-center gap-2 text-xs mb-4 ${target.is_achieved ? 'text-white/80' : 'text-tertiary'}`}>
                        <Calendar className="w-3 h-3" />
                        Target Date: {new Date(target.target_date).toLocaleDateString()}
                    </div>
                )}

                <div className="mb-4">
                    <div className={`flex justify-between text-sm mb-1 ${target.is_achieved ? 'text-white/90' : 'text-secondary'}`}>
                        <span className="font-semibold">${target.current_amount}</span>
                        <span>of ${target.target_amount}</span>
                    </div>

                    <div className={`h-2.5 rounded-full overflow-hidden ${target.is_achieved ? 'bg-black/20' : 'bg-secondary/10'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${target.is_achieved ? 'bg-white' : 'bg-primary'
                                }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <div className={`text-right text-xs mt-1 font-medium ${target.is_achieved ? 'text-white' : 'text-primary'}`}>
                        {progress}% Complete
                    </div>
                </div>

                {!target.is_achieved && (
                    <Button
                        variant="primary"
                        onClick={() => handleContribute(target.id)}
                        className="w-full justify-center"
                    >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Contribute
                    </Button>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <span className="p-2 bg-yellow-500/10 rounded-lg text-yellow-600">
                            <DollarSign className="w-8 h-8" />
                        </span>
                        Savings Goals
                    </h1>
                    <p className="text-secondary mt-1 ml-14">Track and manage your group savings targets</p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant={showCreateForm ? 'outline' : 'primary'}
                >
                    {showCreateForm ? 'Cancel' : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Goal
                        </>
                    )}
                </Button>
            </div>

            {showCreateForm && (
                <Card className="mb-8 border-primary/20 shadow-md">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-theme">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Create New Savings Goal</h2>
                        </div>

                        <form onSubmit={handleCreateTarget} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Select Group</label>
                                    <select
                                        value={newTarget.group}
                                        onChange={(e) => setNewTarget({ ...newTarget, group: e.target.value })}
                                        className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {userGroups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Goal Name"
                                    placeholder="e.g., Emergency Fund"
                                    value={newTarget.name}
                                    onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[100px] transition-all"
                                    placeholder="What is this goal for?"
                                    value={newTarget.description}
                                    onChange={(e) => setNewTarget({ ...newTarget, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Target Amount ($)"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newTarget.target_amount}
                                    onChange={(e) => setNewTarget({ ...newTarget, target_amount: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Target Date"
                                    type="date"
                                    value={newTarget.target_date}
                                    onChange={(e) => setNewTarget({ ...newTarget, target_date: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" variant="primary" size="lg">
                                    Create Goal
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            )}

            {targets.length === 0 && !loading ? (
                <div className="text-center py-12 bg-secondary/5 rounded-2xl border-2 border-dashed border-theme">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">No savings goals yet</h3>
                    <p className="text-secondary max-w-md mx-auto mb-6">Create a goal to start tracking your group's saving progress together.</p>
                    <Button onClick={() => setShowCreateForm(true)} variant="primary">
                        Create Your First Goal
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {targets.map(target => (
                        <TargetCard key={target.id} target={target} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupTargets;
