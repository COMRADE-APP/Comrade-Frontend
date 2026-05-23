import React, { useState, useEffect } from 'react';
import { Plus, Shield, UserCog, Mail, Phone, Edit, Trash2, Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import providerService from '../../services/provider.service';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'support', label: 'Support Agent', description: 'Handle queries and applications' },
    { value: 'sales', label: 'Sales Manager', description: 'Manage products and transactions' },
    { value: 'viewer', label: 'Viewer', description: 'View-only access' },
];

const PERMISSIONS = [
    { key: 'can_manage_products', label: 'Manage Products' },
    { key: 'can_manage_transactions', label: 'Manage Transactions' },
    { key: 'can_review_applications', label: 'Review Applications' },
    { key: 'can_manage_staff', label: 'Manage Staff' },
    { key: 'can_view_analytics', label: 'View Analytics' },
];

const ProviderStaff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [providerId, setProviderId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        email: '',
        role: 'support',
        permissions: {
            can_manage_products: true,
            can_manage_transactions: false,
            can_review_applications: true,
            can_manage_staff: false,
            can_view_analytics: true,
        }
    });

    useEffect(() => {
        loadProviderAndStaff();
    }, []);

    const loadProviderAndStaff = async () => {
        setLoading(true);
        try {
            const regs = await providerService.getMyRegistrations();
            const pid = regs?.length > 0 ? regs[0].id : null;
            setProviderId(pid);
            if (pid) {
                const res = await providerService.getProviderStaff(pid);
                setStaff(res.results || res || []);
            }
        } catch (e) {
            console.error('Failed to load staff:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!editingStaff) {
                await providerService.addStaff({
                    ...form,
                    provider_id: providerId,
                });
            }
            setShowModal(false);
            setEditingStaff(null);
            setForm({
                email: '',
                role: 'support',
                permissions: {
                    can_manage_products: true,
                    can_manage_transactions: false,
                    can_review_applications: true,
                    can_manage_staff: false,
                    can_view_analytics: true,
                }
            });
            if (providerId) {
                const res = await providerService.getProviderStaff(providerId);
                setStaff(res.results || res || []);
            }
        } catch (e) {
            console.error('Failed to save staff:', e);
            alert('Failed to save staff member. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (staffMember) => {
        try {
            if (staffMember.status === 'active') {
                await providerService.deactivateStaff(staffMember.id);
            } else {
                await providerService.activateStaff(staffMember.id);
            }
            if (providerId) {
                const res = await providerService.getProviderStaff(providerId);
                setStaff(res.results || res || []);
            }
        } catch (e) {
            console.error('Failed to toggle status:', e);
        }
    };

    const filteredStaff = staff.filter(s =>
        !search ||
        s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const activeStaff = staff.filter(s => s.status === 'active').length;
    const adminCount = staff.filter(s => s.role === 'admin').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
                    <p className="text-sm text-secondary mt-1">Manage your team members and their access levels</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={!providerId}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add Staff Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-elevated border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                        <UserCog className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Staff</p>
                        <h3 className="text-2xl font-bold text-primary">{staff.length}</h3>
                    </div>
                </div>
                <div className="bg-elevated border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Active</p>
                        <h3 className="text-2xl font-bold text-primary">{activeStaff}</h3>
                    </div>
                </div>
                <div className="bg-elevated border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Admins</p>
                        <h3 className="text-2xl font-bold text-primary">{adminCount}</h3>
                    </div>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border bg-elevated text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            <div className="bg-elevated border rounded-xl overflow-hidden">
                {filteredStaff.length === 0 ? (
                    <div className="p-12 text-center">
                        <UserCog className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">No Staff Found</h3>
                        <p className="text-secondary">Add staff members to help manage your provider operations.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/5 text-secondary font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Permissions</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-secondary/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                {member.user_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-medium text-primary">{member.user_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-secondary">
                                                <Mail className="w-3 h-3" /> {member.email || 'N/A'}
                                            </div>
                                            {member.phone && (
                                                <div className="flex items-center gap-2 text-tertiary text-xs">
                                                    <Phone className="w-3 h-3" /> {member.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium
                                            ${member.role === 'admin' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-700'}
                                        `}>
                                            {member.role || 'viewer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {member.permissions && Object.entries(member.permissions)
                                                .filter(([_, v]) => v)
                                                .map(([key]) => (
                                                    <span key={key} className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">
                                                        {key.replace('can_', '').replace('_', ' ')}
                                                    </span>
                                                ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}
                                        `}>
                                            {member.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingStaff(member);
                                                    setForm({
                                                        email: member.email || '',
                                                        role: member.role || 'viewer',
                                                        permissions: member.permissions || {}
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-secondary/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(member)}
                                                className={`p-2 transition-colors rounded-lg ${
                                                    member.status === 'active'
                                                        ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                                        : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                            >
                                                {member.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-elevated border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-primary mb-4">
                            {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm({...form, email: e.target.value})}
                                    className="w-full border rounded-lg p-2.5 text-sm bg-primary text-primary outline-none focus:border-primary"
                                    placeholder="staff@example.com"
                                    disabled={editingStaff}
                                />
                                <p className="text-xs text-secondary mt-1">
                                    Enter the email of an existing platform user
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm({...form, role: opt.value})}
                                            className={`p-3 rounded-lg border text-left transition-all ${
                                                form.role === opt.value
                                                    ? 'border-primary bg-primary-50/30'
                                                    : 'hover:bg-secondary/5'
                                            }`}
                                        >
                                            <p className="font-medium text-sm text-primary">{opt.label}</p>
                                            <p className="text-xs text-secondary">{opt.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Permissions
                                </label>
                                <div className="space-y-2">
                                    {PERMISSIONS.map(perm => (
                                        <label key={perm.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.permissions[perm.key] || false}
                                                onChange={e => setForm({
                                                    ...form,
                                                    permissions: {
                                                        ...form.permissions,
                                                        [perm.key]: e.target.checked
                                                    }
                                                })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-primary">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingStaff(null);
                                    }}
                                    className="flex-1 py-2.5 border rounded-lg font-medium text-secondary hover:bg-secondary/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingStaff ? 'Update' : 'Add'} Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderStaff;
