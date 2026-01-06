import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupTargets.css';

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
            <div className={`target-card ${target.is_achieved ? 'achieved' : ''}`}>
                {target.is_achieved && <div className="achieved-badge">✓ Goal Achieved!</div>}

                <div className="target-header">
                    <h3>{target.name}</h3>
                    <span className="group-name">{groupName}</span>
                </div>

                <p className="target-description">{target.description}</p>

                {target.target_date && (
                    <p className="target-date">Target Date: {new Date(target.target_date).toLocaleDateString()}</p>
                )}

                <div className="progress-section">
                    <div className="progress-info">
                        <span className="current-amount">${target.current_amount}</span>
                        <span className="target-amount">/ ${target.target_amount}</span>
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>

                    <div className="progress-percentage">{progress}% Complete</div>
                </div>

                {!target.is_achieved && (
                    <button
                        className="btn-contribute"
                        onClick={() => handleContribute(target.id)}
                    >
                        Contribute to Goal
                    </button>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="loading">Loading targets...</div>;
    }

    return (
        <div className="group-targets">
            <div className="targets-header">
                <h1>💰 Savings Goals (Piggy Banks)</h1>
                <button
                    className="btn-create"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Cancel' : 'Create New Goal'}
                </button>
            </div>

            {showCreateForm && (
                <form className="create-target-form" onSubmit={handleCreateTarget}>
                    <h2>Create New Savings Goal</h2>

                    <select
                        value={newTarget.group}
                        onChange={(e) => setNewTarget({ ...newTarget, group: e.target.value })}
                        required
                    >
                        <option value="">Select Group</option>
                        {userGroups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Goal Name (e.g., Emergency Fund)"
                        value={newTarget.name}
                        onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                        required
                    />

                    <textarea
                        placeholder="Description"
                        value={newTarget.description}
                        onChange={(e) => setNewTarget({ ...newTarget, description: e.target.value })}
                        required
                    />

                    <input
                        type="number"
                        step="0.01"
                        placeholder="Target Amount"
                        value={newTarget.target_amount}
                        onChange={(e) => setNewTarget({ ...newTarget, target_amount: e.target.value })}
                        required
                    />

                    <input
                        type="date"
                        value={newTarget.target_date}
                        onChange={(e) => setNewTarget({ ...newTarget, target_date: e.target.value })}
                    />

                    <button type="submit" className="btn-submit">Create Goal</button>
                </form>
            )}

            <div className="targets-grid">
                {targets.length === 0 ? (
                    <p className="no-targets">No savings goals yet. Create one to get started!</p>
                ) : (
                    targets.map(target => (
                        <TargetCard key={target.id} target={target} />
                    ))
                )}
            </div>
        </div>
    );
};

export default GroupTargets;
