import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Upload, Check } from 'lucide-react';
import shopService from '../../services/shop.service';
import './Shop.css';

const ESTABLISHMENT_TYPES = [
    { value: 'restaurant', label: '🍽️ Restaurant', desc: 'Serve food and beverages with dine-in' },
    { value: 'coffee_shop', label: '☕ Coffee Shop / Café', desc: 'Specialty drinks and light bites' },
    { value: 'food_shop', label: '🥘 Food Shop / Takeout', desc: 'Quick meals & prepared food' },
    { value: 'hotel', label: '🏨 Hotel / Lodge', desc: 'Hotel stays and event room bookings' },
    { value: 'supermarket', label: '🛒 Supermarket', desc: 'Groceries with remote purchase & delivery' },
    { value: 'store', label: '🏪 Retail Store', desc: 'General merchandise, electronics etc.' },
    { value: 'service_provider', label: '🔧 Service Provider', desc: 'Appointments for any service' },
];

export default function RegisterEstablishment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', establishment_type: '',
        address: '', city: '', country: '', phone: '', email: '', website: '',
        opening_hours: '', currency: 'USD',
        delivery_available: false, pickup_available: true, dine_in_available: false,
        categories: '',
    });
    const [files, setFiles] = useState({ logo: null, banner: null });

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.establishment_type) return alert('Name and type are required');
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                if (key === 'categories') {
                    formData.append(key, val); // Will be processed as comma-separated string
                } else if (typeof val === 'boolean') {
                    formData.append(key, val.toString());
                } else {
                    formData.append(key, val);
                }
            });
            if (files.logo) formData.append('logo', files.logo);
            if (files.banner) formData.append('banner', files.banner);

            await shopService.createEstablishment(formData);
            setSuccess(true);
        } catch (e) {
            alert(e.response?.data?.error || JSON.stringify(e.response?.data) || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="shop-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Check size={32} color="#fff" />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Business Registered!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your establishment has been created. You can now add menu items, rooms, or services.</p>
                    <button className="shop-action-btn primary" onClick={() => navigate('/shop')}>Go to Shop</button>
                </div>
            </div>
        );
    }

    const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.85rem' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.3rem' };

    return (
        <div className="shop-page">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => navigate('/shop')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ArrowLeft size={20} /></button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Register Business</h1>
            </div>

            {/* Steps Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{ width: s === step ? 48 : 12, height: 6, borderRadius: 3, background: s <= step ? 'var(--accent-primary)' : 'var(--border-color)', transition: 'all 0.3s' }} />
                ))}
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto', padding: '0 1.5rem 2rem' }}>

                {/* Step 1: Type Selection */}
                {step === 1 && (
                    <>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>What type of business?</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {ESTABLISHMENT_TYPES.map(t => (
                                <div
                                    key={t.value}
                                    onClick={() => updateForm('establishment_type', t.value)}
                                    style={{
                                        padding: '1rem', borderRadius: '0.75rem',
                                        border: `2px solid ${form.establishment_type === t.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                        background: form.establishment_type === t.value ? 'rgba(99,102,241,0.06)' : 'var(--bg-elevated)',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{t.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="shop-action-btn primary" onClick={() => form.establishment_type && setStep(2)} disabled={!form.establishment_type} style={{ width: '100%' }}>Continue</button>
                    </>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Business Details</h2>

                        <label style={labelStyle}>Business Name *</label>
                        <input style={inputStyle} value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Java Coffee House" required />

                        <label style={labelStyle}>Description</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Tell customers about your business..." />

                        <label style={labelStyle}>Categories (comma-separated)</label>
                        <input style={inputStyle} value={form.categories} onChange={e => updateForm('categories', e.target.value)} placeholder="e.g. Pizza, Italian, Burgers" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={labelStyle}>City</label>
                                <input style={inputStyle} value={form.city} onChange={e => updateForm('city', e.target.value)} placeholder="City" />
                            </div>
                            <div>
                                <label style={labelStyle}>Country</label>
                                <input style={inputStyle} value={form.country} onChange={e => updateForm('country', e.target.value)} placeholder="Country" />
                            </div>
                        </div>

                        <label style={labelStyle}>Address</label>
                        <input style={inputStyle} value={form.address} onChange={e => updateForm('address', e.target.value)} placeholder="Street address" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input style={inputStyle} value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+254 700 000 000" />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input style={inputStyle} type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="hello@business.com" />
                            </div>
                        </div>

                        <label style={labelStyle}>Website</label>
                        <input style={inputStyle} value={form.website} onChange={e => updateForm('website', e.target.value)} placeholder="https://..." />

                        <label style={labelStyle}>Opening Hours</label>
                        <input style={inputStyle} value={form.opening_hours} onChange={e => updateForm('opening_hours', e.target.value)} placeholder="e.g. Mon-Fri 8am-10pm" />

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="button" className="shop-action-btn" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                            <button type="button" className="shop-action-btn primary" onClick={() => form.name && setStep(3)} disabled={!form.name} style={{ flex: 2 }}>Continue</button>
                        </div>
                    </>
                )}

                {/* Step 3: Branding & Settings */}
                {step === 3 && (
                    <>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Branding & Settings</h2>

                        <label style={labelStyle}>Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px dashed var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <Upload size={16} />
                                {files.logo ? files.logo.name : 'Upload Logo'}
                                <input type="file" accept="image/*" hidden onChange={e => setFiles(f => ({ ...f, logo: e.target.files[0] }))} />
                            </label>
                        </div>

                        <label style={labelStyle}>Banner Image</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px dashed var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <Upload size={16} />
                                {files.banner ? files.banner.name : 'Upload Banner'}
                                <input type="file" accept="image/*" hidden onChange={e => setFiles(f => ({ ...f, banner: e.target.files[0] }))} />
                            </label>
                        </div>

                        <label style={labelStyle}>Currency</label>
                        <select style={inputStyle} value={form.currency} onChange={e => updateForm('currency', e.target.value)}>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="KES">KES (KSh)</option>
                            <option value="NGN">NGN (₦)</option>
                            <option value="ZAR">ZAR (R)</option>
                        </select>

                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1rem 0 0.5rem' }}>Service Modes</h3>
                        {[
                            { key: 'pickup_available', label: 'Pickup', desc: 'Customers can pick up orders' },
                            { key: 'delivery_available', label: 'Delivery', desc: 'You can deliver to customers' },
                            { key: 'dine_in_available', label: 'Dine-in / Walk-in', desc: 'Customers can visit your location' },
                        ].map(mode => (
                            <label key={mode.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form[mode.key]} onChange={e => updateForm(mode.key, e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{mode.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mode.desc}</div>
                                </div>
                            </label>
                        ))}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button type="button" className="shop-action-btn" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                            <button type="submit" className="shop-action-btn primary" disabled={loading} style={{ flex: 2 }}>
                                {loading ? 'Registering...' : 'Register Business'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
