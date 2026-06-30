import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Search, Eye, EyeOff, RefreshCcw, X, DollarSign, Target, Shield, Clock } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const OPP_TYPES = [
    { value: 'stock', label: 'Stock Market' },
    { value: 'mmf', label: 'Money Market Fund' },
    { value: 'bond_domestic', label: 'Domestic Bond' },
    { value: 'bond_foreign', label: 'Foreign Bond' },
    { value: 'lending', label: 'P2P Lending' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'agency', label: 'Investment Agency' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Low Risk', color: 'bg-emerald-50 text-emerald-700' },
    { value: 'medium', label: 'Medium Risk', color: 'bg-amber-50 text-amber-700' },
    { value: 'high', label: 'High Risk', color: 'bg-red-50 text-red-700' },
];

const GAIN_INTERVALS = [
    { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' },
    { value: 'biannual', label: 'Biannually' }, { value: 'annual', label: 'Annually' },
    { value: 'maturity', label: 'At Maturity' },
];

const emptyForm = { title: '', description: '', type: 'mmf', expected_return: '', risk_level: 'medium', min_individual_entry: '', min_group_entry: '', gain_intervals: 'monthly', maturity_period: '' };

const InvestmentsTab = ({ provider, onRefresh }) => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');

    useEffect(() => { loadOpportunities(); }, [provider?.id]);

    const loadOpportunities = async () => {
        setLoading(true);
        try { const data = await providerService.getMyOpportunities(); setOpportunities(Array.isArray(data) ? data : (data?.results || [])); }
        catch (err) { console.error('Failed to load opportunities:', err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); setError(null);
        try {
            const payload = { ...form, min_individual_entry: parseFloat(form.min_individual_entry) || 0, min_group_entry: parseFloat(form.min_group_entry) || 0 };
            await providerService.publishOpportunity(provider.id, payload);
            setShowModal(false); setForm(emptyForm); await loadOpportunities(); onRefresh?.();
        } catch (err) { setError(err.response?.data?.error || 'Failed to publish opportunity'); }
        finally { setSubmitting(false); }
    };

    const handleToggleActive = async (opp) => {
        try { await providerService.toggleOpportunity(opp.id, !opp.is_active); await loadOpportunities(); }
        catch (err) { console.error('Failed to toggle:', err); }
    };

    const getRiskConfig = (level) => RISK_LEVELS.find(r => r.value === level) || RISK_LEVELS[1];
    const getTypeLabel = (type) => OPP_TYPES.find(t => t.value === type)?.label || type;
    const activeCount = opportunities.filter(o => o.is_active).length;
    const verifiedCount = opportunities.filter(o => o.is_verified).length;

    const filtered = opportunities.filter(o => {
        const ms = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase());
        const mt = !filterType || o.type === filterType;
        return ms && mt;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary-500" /> Investment Opportunities
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">Publish and manage investment opportunities</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadOpportunities}>
                        <RefreshCcw size={14} className="mr-1.5" /> Refresh
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm); setShowModal(true); setError(null); }}>
                        <Plus size={14} className="mr-1.5" /> Publish
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Published</p>
                    <p className="text-xl font-bold text-primary">{opportunities.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Active</p>
                    <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Verified</p>
                    <p className="text-xl font-bold text-blue-600">{verifiedCount}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input type="text" placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">All Types</option>
                    {OPP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <TrendingUp size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Opportunities Published</h4>
                    <p className="text-sm text-secondary mb-6 max-w-md mx-auto">Publish investment opportunities that groups and individuals can discover.</p>
                    <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
                        <Plus size={14} className="mr-1.5" /> Publish Your First Opportunity
                    </Button>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(opp => {
                        const risk = getRiskConfig(opp.risk_level);
                        return (
                            <Card key={opp.id} className={`border-theme transition-all ${!opp.is_active ? 'opacity-60' : ''}`}>
                                <CardBody className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-primary text-sm truncate">{opp.title}</h4>
                                            <p className="text-xs text-secondary mt-0.5 line-clamp-2">{opp.description}</p>
                                        </div>
                                        <button onClick={() => handleToggleActive(opp)}
                                            className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary transition-colors shrink-0 ml-2"
                                            title={opp.is_active ? 'Deactivate' : 'Activate'}>
                                            {opp.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">{getTypeLabel(opp.type)}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.color}`}>{risk.label}</span>
                                        {opp.is_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1"><Shield size={10} /> Verified</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center gap-1.5 text-secondary"><DollarSign size={12} /><span>Min Individual: <strong className="text-primary">{formatMoneySimple(opp.min_individual_entry)}</strong></span></div>
                                        <div className="flex items-center gap-1.5 text-secondary"><Target size={12} /><span>Min Group: <strong className="text-primary">{formatMoneySimple(opp.min_group_entry)}</strong></span></div>
                                        <div className="flex items-center gap-1.5 text-secondary"><TrendingUp size={12} /><span>Return: <strong className="text-emerald-600">{opp.expected_return}</strong></span></div>
                                        <div className="flex items-center gap-1.5 text-secondary"><Clock size={12} /><span>Interval: <strong className="text-primary">{opp.gain_intervals}</strong></span></div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-theme">
                            <h3 className="font-bold text-primary">Publish Investment Opportunity</h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Title *</label>
                                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. High-Yield Money Market Fund" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Describe the investment opportunity..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        {OPP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Risk Level</label>
                                    <select value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}
                                        className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-primary mb-1">Min Individual Entry</label><input type="number" step="0.01" value={form.min_individual_entry} onChange={e => setForm({ ...form, min_individual_entry: e.target.value })} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                                <div><label className="block text-sm font-medium text-primary mb-1">Min Group Entry</label><input type="number" step="0.01" value={form.min_group_entry} onChange={e => setForm({ ...form, min_group_entry: e.target.value })} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                                <div><label className="block text-sm font-medium text-primary mb-1">Expected Return</label><input type="text" value={form.expected_return} onChange={e => setForm({ ...form, expected_return: e.target.value })} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. 12% p.a." /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Gain Intervals</label>
                                    <select value={form.gain_intervals} onChange={e => setForm({ ...form, gain_intervals: e.target.value })}
                                        className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        {GAIN_INTERVALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-primary mb-1">Maturity Period</label><input type="text" value={form.maturity_period} onChange={e => setForm({ ...form, maturity_period: e.target.value })} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. 12 Months" /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={submitting}>Publish Opportunity</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentsTab;
