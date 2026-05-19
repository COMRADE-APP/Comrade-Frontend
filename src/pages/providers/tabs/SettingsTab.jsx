import React, { useState } from 'react';
import { Save, Upload, AlertTriangle, Globe, Phone, Mail, MapPin, Building2, Hash, FileText, Percent, DollarSign, CreditCard } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';

const PROVIDER_TYPES = [
    { value: 'bill_provider', label: 'Bill Provider' },
    { value: 'insurance_provider', label: 'Insurance Provider' },
    { value: 'loan_provider', label: 'Loan Provider' },
    { value: 'utility_provider', label: 'Utility Provider' },
    { value: 'financial_service', label: 'Financial Service' },
];

const PAYMENT_METHODS = [
    { value: 'comrade_balance', label: 'Comrade Balance' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
];

const SettingsTab = ({ provider, onRefresh }) => {
    const [form, setForm] = useState({
        business_name: provider.business_name || '',
        business_email: provider.business_email || '',
        business_phone: provider.business_phone || '',
        business_address: provider.business_address || '',
        business_registration_number: provider.business_registration_number || '',
        tax_id: provider.tax_id || '',
        description: provider.description || '',
        website: provider.website || '',
        provider_type: provider.provider_type || 'bill_provider',
        commission_rate: provider.commission_rate || '',
        min_transaction_amount: provider.min_transaction_amount || '',
        max_transaction_amount: provider.max_transaction_amount || '',
        supported_payment_methods: provider.supported_payment_methods || [],
    });
    const [logo, setLogo] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            let payload;
            if (logo) {
                payload = new FormData();
                Object.entries(form).forEach(([key, value]) => {
                    if (key === 'supported_payment_methods') {
                        payload.append(key, JSON.stringify(value));
                    } else {
                        payload.append(key, value);
                    }
                });
                payload.append('logo', logo);
            } else {
                payload = { ...form };
            }

            await providerService.updateRegistration(provider.id, payload);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const togglePaymentMethod = (method) => {
        setForm(prev => ({
            ...prev,
            supported_payment_methods: prev.supported_payment_methods.includes(method)
                ? prev.supported_payment_methods.filter(m => m !== method)
                : [...prev.supported_payment_methods, method]
        }));
    };

    const InputRow = ({ icon: Icon, label, name, type = 'text', placeholder, required = false, ...rest }) => (
        <div>
            <label className="block text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-secondary" />} {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={form[name] || ''}
                onChange={e => setForm({...form, [name]: e.target.value})}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                {...rest}
            />
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
            {saved && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200 flex items-center gap-2">
                    <Save size={16} /> Settings saved successfully!
                </div>
            )}

            {/* Business Profile */}
            <Card className="border-theme">
                <CardHeader className="p-5 border-b border-theme">
                    <h3 className="font-bold text-primary flex items-center gap-2"><Building2 size={18} /> Business Profile</h3>
                </CardHeader>
                <CardBody className="p-5 space-y-5">
                    {/* Logo */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Business Logo</label>
                        <div className="flex items-center gap-4">
                            {provider.logo_url || logo ? (
                                <img
                                    src={logo ? URL.createObjectURL(logo) : provider.logo_url}
                                    alt="Logo"
                                    className="w-16 h-16 rounded-2xl object-cover border border-theme"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20">
                                    {form.business_name?.charAt(0) || 'P'}
                                </div>
                            )}
                            <div>
                                <Button type="button" variant="outline" onClick={() => document.getElementById('logo-input').click()}>
                                    <Upload size={14} className="mr-1.5" /> {logo ? 'Change' : 'Upload Logo'}
                                </Button>
                                <input id="logo-input" type="file" className="hidden" accept="image/*" onChange={e => setLogo(e.target.files[0])} />
                                {logo && <p className="text-xs text-secondary mt-1">{logo.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputRow icon={Building2} label="Business Name" name="business_name" required placeholder="Acme Corp" />
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
                                <Building2 size={14} className="text-secondary" /> Provider Type
                            </label>
                            <select
                                value={form.provider_type}
                                onChange={e => setForm({...form, provider_type: e.target.value})}
                                className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {PROVIDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
                            <FileText size={14} className="text-secondary" /> Description
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Contact Info */}
            <Card className="border-theme">
                <CardHeader className="p-5 border-b border-theme">
                    <h3 className="font-bold text-primary flex items-center gap-2"><Mail size={18} /> Contact Information</h3>
                </CardHeader>
                <CardBody className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputRow icon={Mail} label="Business Email" name="business_email" type="email" required />
                        <InputRow icon={Phone} label="Business Phone" name="business_phone" type="tel" required />
                        <InputRow icon={Globe} label="Website" name="website" type="url" placeholder="https://" />
                        <InputRow icon={Hash} label="Registration Number" name="business_registration_number" />
                    </div>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputRow icon={Hash} label="Tax ID" name="tax_id" />
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
                                <MapPin size={14} className="text-secondary" /> Business Address
                            </label>
                            <textarea
                                rows={2}
                                value={form.business_address}
                                onChange={e => setForm({...form, business_address: e.target.value})}
                                className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Financial Settings */}
            <Card className="border-theme">
                <CardHeader className="p-5 border-b border-theme">
                    <h3 className="font-bold text-primary flex items-center gap-2"><DollarSign size={18} /> Financial Settings</h3>
                </CardHeader>
                <CardBody className="p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <InputRow icon={Percent} label="Commission Rate" name="commission_rate" type="number" step="0.0001" placeholder="0.05 = 5%" />
                        <InputRow icon={DollarSign} label="Min Transaction" name="min_transaction_amount" type="number" step="0.01" />
                        <InputRow icon={DollarSign} label="Max Transaction" name="max_transaction_amount" type="number" step="0.01" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
                            <CreditCard size={14} className="text-secondary" /> Supported Payment Methods
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PAYMENT_METHODS.map(method => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => togglePaymentMethod(method.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                                        form.supported_payment_methods.includes(method.value)
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                            : 'bg-background text-secondary border-theme hover:border-primary/50'
                                    }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Save bar */}
            <div className="sticky bottom-0 bg-elevated/95 backdrop-blur-sm border-t border-theme p-4 -mx-4 flex items-center justify-between rounded-b-xl">
                <p className="text-xs text-secondary">Changes are saved to your provider profile.</p>
                <Button variant="primary" type="submit" disabled={saving} className="px-6">
                    <Save size={16} className="mr-1.5" /> {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );
};

export default SettingsTab;
