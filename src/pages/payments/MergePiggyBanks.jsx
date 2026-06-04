import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    GitMerge, ArrowLeft, Target, Users, DollarSign, X, Check, AlertCircle, Info
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';
import { renderContentWithEmojis } from '../../utils/emoji';

const MergePiggyBanks = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetId, setTargetId] = useState('');
    const [availableSources, setAvailableSources] = useState([]);
    const [selectedSources, setSelectedSources] = useState([]);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sourcesLoading, setSourcesLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPiggyBanks();
    }, []);

    const loadPiggyBanks = async () => {
        setLoading(true);
        try {
            const data = await paymentsService.getPiggyBanks();
            const pbs = Array.isArray(data) ? data : (data?.results || []);
            setPiggyBanks(pbs);
        } catch (err) {
            console.error('Error loading piggy banks:', err);
            setError('Failed to load piggy banks');
        } finally {
            setLoading(false);
        }
    };

    const handleTargetChange = async (e) => {
        const id = e.target.value;
        setTargetId(id);
        setSelectedSources([]);
        if (!id) {
            setAvailableSources([]);
            return;
        }
        setSourcesLoading(true);
        try {
            const sources = await paymentsService.getAvailableForMerge(id);
            setAvailableSources(sources || []);
        } catch (err) {
            console.error('Error loading available sources:', err);
            setAvailableSources([]);
            toast.error('Failed to load available piggy banks for merge');
        } finally {
            setSourcesLoading(false);
        }
    };

    const toggleSource = (sourceId) => {
        setSelectedSources(prev =>
            prev.includes(sourceId)
                ? prev.filter(id => id !== sourceId)
                : [...prev, sourceId]
        );
    };

    const handleSubmit = async () => {
        if (!targetId || selectedSources.length === 0) return;
        setSubmitting(true);
        try {
            const res = await paymentsService.requestMerge(targetId, selectedSources, reason);
            toast.success(res.status || 'Merge request submitted!');
            navigate(ROUTES.PIGGY_BANKS);
        } catch (err) {
            console.error('Merge request failed:', err);
            toast.error(err.response?.data?.error || 'Failed to submit merge request');
        } finally {
            setSubmitting(false);
        }
    };

    const target = piggyBanks.find(pb => pb.id === parseInt(targetId));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(ROUTES.PIGGY_BANKS)} className="p-2 hover:bg-secondary/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
                            <GitMerge className="w-7 h-7 text-blue-500" /> Merge Piggy Banks
                        </h1>
                        <p className="text-secondary mt-0.5 text-sm">Select a target piggy bank and sources to merge into it</p>
                    </div>
                </div>
            </div>

            {error && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardBody className="p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </CardBody>
                </Card>
            )}

            <Card>
                <CardBody className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">Target Piggy Bank (receives funds)</label>
                        {loading ? (
                            <div className="h-11 bg-secondary/5 rounded-lg animate-pulse" />
                        ) : (
                            <select value={targetId} onChange={handleTargetChange}
                                className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select target piggy bank...</option>
                                {piggyBanks.map(pb => (
                                    <option key={pb.id} value={pb.id}>
                                        {renderContentWithEmojis(pb.name)} — ${parseFloat(pb.current_amount || 0).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        )}
                        {piggyBanks.length === 0 && !loading && (
                            <p className="text-sm text-tertiary mt-2">No piggy banks available. Create one first.</p>
                        )}
                    </div>

                    {targetId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-secondary">Source Piggy Banks (will be dissolved)</label>
                                {!sourcesLoading && (
                                    <span className="text-xs text-tertiary">{selectedSources.length} selected</span>
                                )}
                            </div>
                            {sourcesLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary/5 rounded-lg animate-pulse" />)}
                                </div>
                            ) : availableSources.length === 0 ? (
                                <div className="bg-secondary/5 border border-theme rounded-lg p-6 text-center">
                                    <Target className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                    <p className="text-sm text-secondary">No piggy banks available to merge into {renderContentWithEmojis(target?.name)}.</p>
                                                    <p className="text-xs text-tertiary mt-1">All available piggy banks are either locked, inactive, or already selected.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {availableSources.map(pb => {
                                        const isSelected = selectedSources.includes(pb.id);
                                        return (
                                            <button key={pb.id} type="button" onClick={() => toggleSource(pb.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500'
                                                        : 'border-theme bg-elevated hover:border-blue-300 hover:bg-blue-50'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-secondary'
                                                    }`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{renderContentWithEmojis(pb.name)}</p>
                                                        <p className="text-xs text-secondary">${parseFloat(pb.current_amount || 0).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                {pb.locking_status !== 'unlocked' && (
                                                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{pb.locking_status}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {targetId && availableSources.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-secondary mb-2">Reason (optional)</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Explain why these piggy banks should be merged..."
                                className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">How merging works</p>
                            <p className="text-xs text-amber-700 mt-1">A merge request will be created. Group piggy banks require member approval; personal piggy banks are auto-approved. Once approved, all funds from source piggy banks will be transferred to the target. Source piggy banks will be dissolved.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.PIGGY_BANKS)}>Cancel</Button>
                        <Button variant="primary" className="flex-1" onClick={handleSubmit}
                            disabled={!targetId || selectedSources.length === 0 || submitting}>
                            {submitting ? 'Submitting...' : `Submit Merge Request (${selectedSources.length} source${selectedSources.length !== 1 ? 's' : ''})`}
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default MergePiggyBanks;
