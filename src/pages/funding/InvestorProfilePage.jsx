/**
 * InvestorProfilePage — Standalone page at /funding/investor-profile
 * View, edit, and manage the universal investor KYC profile.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, UserCheck, Edit3, Save, Loader2, Shield,
    CheckCircle, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import fundingService from '../../services/funding.service';

const InvestorProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '', id_number: '', id_type: 'national_id',
        nationality: '', date_of_birth: '', address: '',
        tax_pin: '', source_of_funds: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const p = await fundingService.getInvestorProfile();
            setProfile(p);
            setFormData({
                full_name: p.full_name || '',
                id_number: p.id_number || '',
                id_type: p.id_type || 'national_id',
                nationality: p.nationality || '',
                date_of_birth: p.date_of_birth || '',
                address: p.address || '',
                tax_pin: p.tax_pin || '',
                source_of_funds: p.source_of_funds || '',
            });
        } catch {
            // No profile yet, show empty form
            setEditing(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let result;
            if (profile) {
                result = await fundingService.updateInvestorProfile(formData);
            } else {
                result = await fundingService.createInvestorProfile(formData);
            }
            setProfile(result);
            setEditing(false);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const fields = [
        { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
        { key: 'id_type', label: 'ID Type', type: 'select', options: [
            { value: 'national_id', label: 'National ID' },
            { value: 'passport', label: 'Passport' },
            { value: 'military_id', label: 'Military ID' },
            { value: 'drivers_license', label: "Driver's License" },
        ]},
        { key: 'id_number', label: 'ID Number', type: 'text', required: true, placeholder: '12345678' },
        { key: 'nationality', label: 'Nationality', type: 'text', required: true, placeholder: 'Kenyan' },
        { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
        { key: 'address', label: 'Address', type: 'text', placeholder: 'P.O. Box 1234, Nairobi' },
        { key: 'tax_pin', label: 'Tax PIN', type: 'text', placeholder: 'A012345678B' },
        { key: 'source_of_funds', label: 'Source of Funds', type: 'text', placeholder: 'Employment' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-background min-h-screen p-8">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Investor Profile</h1>
                        <p className="text-secondary mt-1">Your KYC details for investments and donations</p>
                    </div>
                    {profile && !editing && (
                        <button onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
            >
                {/* Status badge */}
                {profile && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 ${profile.is_complete
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        }`}>
                        {profile.is_complete ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Profile complete — visible to businesses you invest in</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Profile incomplete — fill required fields to invest</span>
                            </>
                        )}
                    </div>
                )}

                {/* Profile form/view */}
                <div className="bg-elevated rounded-2xl border border-theme p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-primary">{editing ? (profile ? 'Edit Profile' : 'Create Investor Profile') : 'Profile Details'}</h2>
                            <p className="text-xs text-secondary">
                                {editing ? 'Fields with * are required for investments.' : 'This data is shared with businesses you invest in.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field.key} className={field.key === 'full_name' || field.key === 'address' ? 'md:col-span-2' : ''}>
                                <label className="text-xs font-medium text-secondary mb-1 block">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {editing ? (
                                    field.type === 'select' ? (
                                        <select value={formData[field.key]}
                                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full px-3 py-2.5 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none">
                                            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    ) : (
                                        <input type={field.type} value={formData[field.key]}
                                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder || ''}
                                            className="w-full px-3 py-2.5 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none" />
                                    )
                                ) : (
                                    <p className="px-3 py-2.5 bg-secondary/5 rounded-lg text-primary text-sm">
                                        {field.type === 'select'
                                            ? field.options?.find(o => o.value === formData[field.key])?.label || formData[field.key] || '—'
                                            : formData[field.key] || '—'
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {editing && (
                        <div className="flex gap-3 pt-3">
                            {profile && (
                                <button onClick={() => setEditing(false)}
                                    className="flex-1 py-2.5 border border-theme rounded-xl text-secondary text-sm font-medium hover:bg-secondary/5 transition-colors">
                                    Cancel
                                </button>
                            )}
                            <button onClick={handleSave}
                                disabled={saving || !formData.full_name || !formData.id_number || !formData.nationality}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Info note */}
                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium">Privacy Notice</p>
                        <p className="mt-1 text-xs">Your investor profile is only shared with businesses and ventures you directly invest in. It is stored securely and used for regulatory compliance.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InvestorProfilePage;
