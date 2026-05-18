import React, { useState, useEffect } from 'react';
import { ShieldCheck, Vote, Clock, Check, X, AlertCircle, Info } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const GroupGovernanceTab = ({ groupId }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposeLoading, setProposeLoading] = useState(false);
    const [formData, setFormData] = useState({
        change_type: 'contribution_amount',
        change_description: '',
        new_values: '',
    });

    useEffect(() => {
        loadRequests();
    }, [groupId]);

    const loadRequests = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupSettingsChanges(groupId);
            setRequests(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading governance requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePropose = async (e) => {
        e.preventDefault();
        setProposeLoading(true);
        try {
            let parsedValues = formData.new_values;
            try {
                parsedValues = JSON.parse(formData.new_values);
            } catch (e) {
                // If it's not valid JSON, we'll just send it as a string
            }

            await paymentsService.proposeSettingsChange(groupId, {
                change_type: formData.change_type,
                change_description: formData.change_description,
                new_values: parsedValues,
            });
            setShowProposeModal(false);
            setFormData({ change_type: 'contribution_amount', change_description: '', new_values: '' });
            loadRequests();
        } catch (error) {
            console.error('Error proposing change:', error);
        } finally {
            setProposeLoading(false);
        }
    };

    const handleVote = async (requestId, vote) => {
        try {
            await paymentsService.voteOnSettingsChange(requestId, vote);
            loadRequests();
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Governance & Voting</h3>
                    <p className="text-sm text-secondary">Propose and vote on changes to group rules, settings, and financial policies.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => setShowProposeModal(true)}>
                    <ShieldCheck className="w-4 h-4" /> Propose Change
                </Button>
            </div>

            {requests.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                        <Vote className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Proposals</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        All group settings are stable. Members can propose changes to contribution amounts, frequencies, or rules.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <Card key={req.id} className="border-theme">
                            <CardBody className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            <Vote className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary capitalize">{req.change_type.replace('_', ' ')}</h4>
                                            <p className="text-sm text-secondary">{req.change_description}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/5 rounded-xl mb-4 border border-theme">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-tertiary mb-1">From</p>
                                        <div className="text-sm font-medium text-secondary line-through opacity-60">
                                            {JSON.stringify(req.old_values)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-primary mb-1">To</p>
                                        <div className="text-sm font-bold text-indigo-600">
                                            {JSON.stringify(req.new_values)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-xs text-secondary">
                                            <Check className="w-3.5 h-3.5 text-emerald-500" /> {req.votes_for} Yes
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-secondary">
                                            <X className="w-3.5 h-3.5 text-rose-500" /> {req.votes_against} No
                                        </div>
                                    </div>
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="!text-rose-500 border-rose-500/30 hover:bg-rose-50" onClick={() => handleVote(req.id, 'against')}>Vote No</Button>
                                            <Button variant="primary" size="sm" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => handleVote(req.id, 'for')}>Vote Yes</Button>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
            
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    Governance actions require a majority vote based on the group's hierarchy mode. Changes to financial policies may require a higher threshold of approval.
                </p>
            </div>

            {/* Propose Change Modal */}
            {showProposeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-theme shadow-2xl">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary">Propose Rule Change</h3>
                                <button onClick={() => setShowProposeModal(false)} className="text-secondary hover:text-primary">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handlePropose} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Change Type</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.change_type}
                                        onChange={(e) => setFormData({...formData, change_type: e.target.value})}
                                    >
                                        <option value="contribution_amount">Contribution Amount</option>
                                        <option value="contribution_frequency">Contribution Frequency</option>
                                        <option value="late_fee">Late Fee</option>
                                        <option value="hierarchy_mode">Hierarchy Mode</option>
                                        <option value="other">Other Rule</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Description / Rationale</label>
                                    <textarea 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary h-24"
                                        placeholder="Why should the group make this change?"
                                        value={formData.change_description}
                                        onChange={(e) => setFormData({...formData, change_description: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Proposed Value(s)</label>
                                    <textarea 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary font-mono text-sm h-20"
                                        placeholder='e.g. 5000 or {"amount": 5000}'
                                        value={formData.new_values}
                                        onChange={(e) => setFormData({...formData, new_values: e.target.value})}
                                        required
                                    />
                                    <p className="text-[10px] text-tertiary mt-1">Specify the exact new value or rule configuration.</p>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProposeModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={proposeLoading}>
                                        {proposeLoading ? 'Submitting...' : 'Submit Proposal'}
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

export default GroupGovernanceTab;
