import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Save, Trash2, RefreshCcw } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const ProviderLoanEdit = () => {
    const { loanId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '', interest_rate: '', min_amount: '', max_amount: '', min_tenure_months: '1', max_tenure_months: '24', requires_guarantor: false, guarantors_required: '0', min_credit_score: '0', processing_fee: '0', late_penalty_rate: '1.5', is_group_loan: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => { load(); }, [loanId]);

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/api/v1/payments/loan-products/'+loanId+'/'); setForm(r.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const save = async (e) => {
        e.preventDefault(); setSaving(true); setErr(null);
        try { await api.patch('/api/v1/payments/loan-products/'+loanId+'/', form); navigate(-1); }
        catch (e) { setErr(e.response?.data?.error || 'Failed to save'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" /></div>;

    return (
        <div className="max-w-lg mx-auto space-y-6 pb-20">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-secondary hover:text-primary"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2"><DollarSign size={24} className="text-amber-500" /> Edit Loan Product</h1>
            <form onSubmit={save} className="bg-elevated border border-theme rounded-2xl p-5 space-y-4">
                {err && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{err}</div>}
                <div><label className="block text-sm font-medium text-primary mb-1">Name *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Interest Rate % *</label><input type="number" step="0.01" required value={form.interest_rate} onChange={e => setForm({...form, interest_rate: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Processing Fee %</label><input type="number" step="0.01" value={form.processing_fee} onChange={e => setForm({...form, processing_fee: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Min Amount</label><input type="number" step="0.01" value={form.min_amount} onChange={e => setForm({...form, min_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Max Amount</label><input type="number" step="0.01" value={form.max_amount} onChange={e => setForm({...form, max_amount: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Min Tenure (mo)</label><input type="number" value={form.min_tenure_months} onChange={e => setForm({...form, min_tenure_months: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-primary mb-1">Max Tenure (mo)</label><input type="number" value={form.max_tenure_months} onChange={e => setForm({...form, max_tenure_months: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button><Button variant="primary" type="submit" isLoading={saving}><Save size={14} className="mr-1.5" /> Save</Button></div>
            </form>
        </div>
    );
};

export default ProviderLoanEdit;
