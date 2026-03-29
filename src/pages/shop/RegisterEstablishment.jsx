import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, X } from 'lucide-react';
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

const SERVICE_SUGGESTIONS = [
    // Financial Services
    'Venture Capital (VC)', 'Private Equity', 'Angel Investment',
    'Private Credit', 'Loans & Microfinance', 'Mortgage Services',
    'Bill Payments', 'Airtime & Utilities',
    'Escrow Services', 'Payment Facilitation',
    // Brokerage
    'Brokers', 'Real Estate Brokers', 'Insurance Brokers', 'Stock Brokers',
    'Commodity Brokers', 'Forex Brokers',
    // Security
    'Security Provider', 'Cybersecurity', 'Physical Security', 'CCTV & Surveillance',
    // Events
    'Events Management', 'Event Planning', 'Catering', 'Venue Hire',
    'DJ & Entertainment', 'Wedding Planning',
    // Trade & Technical
    'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Landscaping',
    'HVAC', 'Pest Control', 'Painting & Decorating', 'Roofing',
    // Education
    'Tutoring / Education', 'Masterclasses', 'Coaching & Mentoring',
    'Language Training', 'Driving School',
    // Health & Wellness
    'Beauty & Wellness', 'Barber', 'Salon', 'Spa & Massage',
    'Medical Services', 'Pharmacy', 'Therapy & Counseling',
    'Dental Services', 'Optician', 'Fitness & Gym',
    // Professional
    'Legal Services', 'Law Firm', 'Notary',
    'Consulting', 'Business Consulting', 'Management Consulting',
    'Accounting & Tax', 'Auditing',
    // Technology
    'IT Support', 'Software Development', 'Web Hosting',
    'Cloud Services', 'Data Analytics', 'App Development',
    // Transport
    'Transport & Logistics', 'Ride Hailing', 'Courier Services',
    'Freight & Cargo', 'Moving Services',
    // Creative
    'Marketing & Advertising', 'Social Media Management', 'SEO Services',
    'Photography & Videography', 'Graphic Design', 'Content Creation',
    'Print & Publishing', 'Interior Design',
    // Automotive
    'Automotive Services', 'Car Wash', 'Towing Services',
    'Mechanic', 'Auto Parts',
    // Real Estate
    'Property Management', 'Real Estate Agency', 'Valuation Services',
    // Agriculture
    'Agro-Processing', 'Farm Equipment Rental', 'Veterinary Services',
    // Other
    'Waste Management', 'Laundry & Dry Cleaning', 'Funeral Services',
    'Travel Agency', 'Tour Guide', 'Pet Care',
];

// Categories that belong in the Funding Hub and require extra financial details
const FUNDING_CATEGORIES = [
    'Venture Capital (VC)', 'Private Equity', 'Angel Investment',
    'Private Credit', 'Loans & Microfinance', 'Mortgage Services',
    'Escrow Services', 'Payment Facilitation',
    'Brokers', 'Real Estate Brokers', 'Insurance Brokers', 'Stock Brokers',
    'Commodity Brokers', 'Forex Brokers',
];

export default function RegisterEstablishment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [categoryInput, setCategoryInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [form, setForm] = useState({
        name: '', description: '', establishment_type: '', service_categories: [],
        address: '', city: '', country: '', phone: '', email: '', website: '',
        opening_hours: '', currency: 'USD',
        delivery_available: false, pickup_available: true, dine_in_available: false,
        categories: '',
        // Funding-specific fields
        fund_total: '', fund_available: '', investment_focus: '',
        investment_criteria: '', min_investment: '', max_investment: '',
        risk_level: 'medium', expected_return: '',
    });
    const [files, setFiles] = useState({ logo: null, banner: null });

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // Determine if the selected service categories include any funding-related ones
    const hasFundingCategories = useMemo(() =>
        (form.service_categories || []).some(cat => FUNDING_CATEGORIES.includes(cat)),
        [form.service_categories]
    );

    // Dynamic total steps: 3 normally, 4 if service_provider, 5 if also has funding categories
    const totalSteps = useMemo(() => {
        if (form.establishment_type !== 'service_provider') return 3;
        return hasFundingCategories ? 5 : 4;
    }, [form.establishment_type, hasFundingCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.establishment_type) return alert('Name and type are required');
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                if (key === 'categories') {
                    let cats = val;
                    if (form.establishment_type === 'service_provider' && form.service_categories?.length > 0) {
                        cats = cats ? `${cats},${form.service_categories.join(',')}` : form.service_categories.join(',');
                    }
                    if (cats) formData.append(key, cats);
                } else if (key === 'service_categories') {
                    // Handled within categories
                } else if (typeof val === 'boolean') {
                    formData.append(key, val.toString());
                } else if (val !== '' && val !== null && val !== undefined) {
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
                    <button className="btn-primary py-3 px-6" onClick={() => navigate('/shop')}>Go to Shop</button>
                </div>
            </div>
        );
    }

    const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.85rem' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.3rem' };
    const sectionTitle = (text) => <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>{text}</h2>;

    const filteredSuggestions = SERVICE_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(categoryInput.toLowerCase()) && !form.service_categories.includes(s)
    );

    const addCategory = (cat) => {
        if (cat && !form.service_categories.includes(cat)) {
            updateForm('service_categories', [...form.service_categories, cat]);
        }
        setCategoryInput('');
        setShowSuggestions(false);
    };

    const removeCategory = (cat) => {
        updateForm('service_categories', form.service_categories.filter(c => c !== cat));
    };

    // Determine if current step is the final (submit) step
    const isFinalStep = step === totalSteps;

    return (
        <div className="shop-page">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => navigate('/shop')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ArrowLeft size={20} /></button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Register Business</h1>
            </div>

            {/* Steps Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                    <div key={s} style={{ width: s === step ? 48 : 12, height: 6, borderRadius: 3, background: s <= step ? 'var(--accent-primary)' : 'var(--border-color)', transition: 'all 0.3s' }} />
                ))}
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto', padding: '0 1.5rem 2rem' }}>

                {/* ═══════════ Step 1: Type Selection ═══════════ */}
                {step === 1 && (
                    <>
                        {sectionTitle('What type of business?')}
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
                        <button type="button" className="btn-primary w-full py-3" onClick={() => form.establishment_type && setStep(2)} disabled={!form.establishment_type}>Continue</button>
                    </>
                )}

                {/* ═══════════ Step 2: Business Details ═══════════ */}
                {step === 2 && (
                    <>
                        {sectionTitle('Business Details')}

                        <label style={labelStyle}>Business Name *</label>
                        <input style={inputStyle} value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Java Coffee House" required />

                        <label style={labelStyle}>Description</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Tell customers about your business..." />

                        <label style={labelStyle}>Categories (comma-separated)</label>
                        <input style={inputStyle} value={form.categories} onChange={e => updateForm('categories', e.target.value)} placeholder="e.g. Pizza, Italian, Burgers" />

                        {/* Service Categories: searchable tag input (only for service_provider) */}
                        {form.establishment_type === 'service_provider' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Service Categories *</label>
                                
                                {/* Input + dropdown wrapper */}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        style={{ ...inputStyle, marginBottom: 0 }} 
                                        value={categoryInput} 
                                        onChange={e => {
                                            setCategoryInput(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCategory(categoryInput.trim());
                                            }
                                        }}
                                        placeholder="Type to search or add custom category..." 
                                    />

                                    {/* Suggestions dropdown */}
                                    {showSuggestions && categoryInput.trim() && (
                                        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '0 0 0.5rem 0.5rem', maxHeight: '180px', overflowY: 'auto', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                            {filteredSuggestions.map((suggestion, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}
                                                    onClick={() => addCategory(suggestion)}
                                                    onMouseOver={e => e.target.style.background = 'var(--border-color)'}
                                                    onMouseOut={e => e.target.style.background = 'transparent'}
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                            {filteredSuggestions.length === 0 && (
                                                <div 
                                                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '0.85rem' }}
                                                    onClick={() => addCategory(categoryInput.trim())}
                                                    onMouseOver={e => e.target.style.background = 'var(--border-color)'}
                                                    onMouseOut={e => e.target.style.background = 'transparent'}
                                                >
                                                    + Add "{categoryInput.trim()}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected tags — rendered OUTSIDE the relative wrapper so they're always visible */}
                                {form.service_categories.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                        {form.service_categories.map((cat, idx) => (
                                            <span key={idx} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                background: 'var(--accent-primary)', color: '#fff',
                                                padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 500
                                            }}>
                                                {cat}
                                                <button type="button" onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
                                                    <X size={13} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {hasFundingCategories && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.5rem' }}>
                                        💰 Funding-related categories detected — you'll provide financial details in an extra step.
                                    </p>
                                )}
                            </div>
                        )}

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
                            <button type="button" className="btn-outline flex-1 py-3" onClick={() => setStep(1)}>Back</button>
                            <button type="button" className="btn-primary flex-[2] py-3" onClick={() => {
                                if (!form.name) return;
                                if (form.establishment_type === 'service_provider' && form.service_categories.length === 0) {
                                    return alert('Please select at least one service category.');
                                }
                                setStep(3);
                            }} disabled={!form.name}>Continue</button>
                        </div>
                    </>
                )}

                {/* ═══════════ Step 3: Branding & Settings ═══════════ */}
                {step === 3 && (
                    <>
                        {sectionTitle('Branding & Settings')}

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
                            <button type="button" className="btn-outline flex-1 py-3" onClick={() => setStep(2)}>Back</button>
                            {isFinalStep ? (
                                <button type="submit" className="btn-primary flex-[2] py-3" disabled={loading}>
                                    {loading ? 'Registering...' : 'Register Business'}
                                </button>
                            ) : (
                                <button type="button" className="btn-primary flex-[2] py-3" onClick={() => setStep(4)}>Continue</button>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════════ Step 4: Service Provider - Service Setup ═══════════ */}
                {step === 4 && form.establishment_type === 'service_provider' && (
                    <>
                        {sectionTitle('Service Configuration')}
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Configure how your services will appear on the platform. 
                            {hasFundingCategories
                                ? ' You have selected funding-related services — financial details will be collected next.'
                                : ' Review and confirm your service setup.'}
                        </p>

                        {/* Summary of selected categories */}
                        <label style={labelStyle}>Your Selected Service Categories</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '0.6rem', border: '1px solid var(--border-color)' }}>
                            {form.service_categories.map((cat, idx) => {
                                const isFunding = FUNDING_CATEGORIES.includes(cat);
                                return (
                                    <span key={idx} style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                        background: isFunding ? 'rgba(234,179,8,0.15)' : 'var(--accent-primary)', 
                                        color: isFunding ? '#ca8a04' : '#fff',
                                        border: isFunding ? '1px solid rgba(234,179,8,0.3)' : 'none',
                                        padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 500 
                                    }}>
                                        {isFunding && '💰 '}{cat}
                                    </span>
                                );
                            })}
                        </div>

                        <label style={labelStyle}>Service Listing Visibility</label>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '0.6rem', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                            {form.service_categories.some(c => !FUNDING_CATEGORIES.includes(c)) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Marketplace → Services tab</span>
                                </div>
                            )}
                            {hasFundingCategories && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ca8a04' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Funding Hub → Financial Services</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button type="button" className="btn-outline flex-1 py-3" onClick={() => setStep(3)}>Back</button>
                            {isFinalStep ? (
                                <button type="submit" className="btn-primary flex-[2] py-3" disabled={loading}>
                                    {loading ? 'Registering...' : 'Register Business'}
                                </button>
                            ) : (
                                <button type="button" className="btn-primary flex-[2] py-3" onClick={() => setStep(5)}>Continue to Financial Details</button>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════════ Step 5: Funding Details (only if funding categories selected) ═══════════ */}
                {step === 5 && hasFundingCategories && (
                    <>
                        {sectionTitle('Financial Details')}
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Provide details about your financial service. This information will appear in the Funding Hub and help investors discover your services.
                        </p>

                        <label style={labelStyle}>Total Fund / Capital Available *</label>
                        <input style={inputStyle} type="number" value={form.fund_total} onChange={e => updateForm('fund_total', e.target.value)} placeholder="e.g. 1000000" />

                        <label style={labelStyle}>Currently Available Fund</label>
                        <input style={inputStyle} type="number" value={form.fund_available} onChange={e => updateForm('fund_available', e.target.value)} placeholder="e.g. 500000" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={labelStyle}>Min Investment</label>
                                <input style={inputStyle} type="number" value={form.min_investment} onChange={e => updateForm('min_investment', e.target.value)} placeholder="e.g. 100" />
                            </div>
                            <div>
                                <label style={labelStyle}>Max Investment</label>
                                <input style={inputStyle} type="number" value={form.max_investment} onChange={e => updateForm('max_investment', e.target.value)} placeholder="e.g. 50000" />
                            </div>
                        </div>

                        <label style={labelStyle}>Investment Focus</label>
                        <input style={inputStyle} value={form.investment_focus} onChange={e => updateForm('investment_focus', e.target.value)} placeholder="e.g. Tech, Agriculture, Healthcare" />

                        <label style={labelStyle}>Investment Criteria</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.investment_criteria} onChange={e => updateForm('investment_criteria', e.target.value)} placeholder="Describe what types of businesses or projects you invest in..." />

                        <label style={labelStyle}>Expected Return</label>
                        <input style={inputStyle} value={form.expected_return} onChange={e => updateForm('expected_return', e.target.value)} placeholder="e.g. 12% p.a." />

                        <label style={labelStyle}>Risk Level</label>
                        <select style={inputStyle} value={form.risk_level} onChange={e => updateForm('risk_level', e.target.value)}>
                            <option value="low">Low Risk</option>
                            <option value="medium">Medium Risk</option>
                            <option value="high">High Risk</option>
                        </select>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button type="button" className="btn-outline flex-1 py-3" onClick={() => setStep(4)}>Back</button>
                            <button type="submit" className="btn-primary flex-[2] py-3" disabled={loading}>
                                {loading ? 'Registering...' : 'Register Business'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
