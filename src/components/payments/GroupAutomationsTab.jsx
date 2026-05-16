import React, { useState, useEffect } from 'react';
import paymentsService from '../../services/payments.service';

const GroupAutomationsTab = ({ groupId }) => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (groupId) loadAutomations();
    }, [groupId]);

    const loadAutomations = async () => {
        try {
            const data = await paymentsService.getGroupAutomations(groupId);
            setAutomations(data || []);
        } catch (e) {
            console.error(e);
            setAutomations([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        try {
            await paymentsService.createGroupAutomation(groupId, {
                amount: parseFloat(form.amount.value),
                frequency: form.frequency.value,
                execution_day: parseInt(form.execution_day.value, 10),
                is_active: true
            });
            setShowModal(false);
            form.reset();
            loadAutomations();
        } catch (error) {
            alert('Failed to create automation');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Group Automations</h2>
                    <p style={{ color: '#666' }}>Set up recurring payments</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                >
                    + New Automation
                </button>
            </div>

            {automations.length === 0 ? (
                <p style={{ color: '#999' }}>No automations yet</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {automations.map(a => (
                        <div key={a.id} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                            <p><strong>Amount:</strong> {a.amount}</p>
                            <p><strong>Frequency:</strong> {a.frequency}</p>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>New Automation</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Amount</label>
                                <input name="amount" type="number" required style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Frequency</label>
                                <select name="frequency" style={{ width: '100%', padding: '0.5rem' }}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Day of Month</label>
                                <input name="execution_day" type="number" defaultValue={1} min={1} max={31} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: 'white', border: 'none' }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupAutomationsTab;