import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Save, RefreshCcw } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const ProviderInsuranceEdit = () => {
    const { insuranceId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', category: 'health', premium_amount: '', premium_frequency: 'monthly', coverage_amount: '', deductible: '0', waiting_period_days: '0', terms: '', is_group_product: false, min_group_size: '0' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => { load(); }, [insuranceId]);

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/api/v1/payments/insurance-products/'+insuranceId+'/'); setForm(r.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const save = async (e) => {
        e.preventDefault(); setSaving(true); setErr(null);
        try { await api.patch('/api/v1/payments/insurance-products/'+insuranceId+'/', form); navigate(-1); }
        catch (e) { setErr(e.response?.data?.error || 'Failed to save'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" /></div>;

    return (
        <div className="max-w-lg mx-auto space-y-6 pb-20">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-secondary hover:text-primary"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2"><Shield size={24} className="text-teal-500" /> Edit Insurance Product</h1>
            <form onSubmit={save} className="bg-elevated border border-theme rounded-2xl p-5 space-y-4">
                {err && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{err}</div>}
                <div><label className="block text-sm font-medium text-primary mb-1">Name *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm"><option value="health">Health</option><option value="device">Device</option><option value="travel">Travel</option><option value="business">Business</option><option value="asset">Asset</option><option value="education">Education</option><option value="funeral">Funeral</option><option value="crop">Crop</option></select></div><div><label className="block text-sm font-medium text-primary mb-1">Frequency</label><select value={form.premium_frequency} onChange={e => setForm({...form, premium_frequency: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="one_time">One-Time</option></select></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Premium *</label><input type="number" step="0.01" required value={form.premium_amount} onChange={e => setForm({...form, premium_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Coverage</label><input type="number" step="0.01" value={form.coverage_amount} onChange={e => setForm({...form, coverage_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Deductible</label><input type="number" step="0.01" value={form.deductible} onChange={e => setForm({...form, deductible: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Waiting (days)</label><input type="number" value={form.waiting_period_days} onChange={e => setForm({...form, waiting_period_days: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button><Button variant="primary" type="submit" isLoading={saving}><Save size={14} className="mr-1.5" /> Save</Button></div>
            </form>
        </div>
    );
};

export default ProviderInsuranceEdit;
