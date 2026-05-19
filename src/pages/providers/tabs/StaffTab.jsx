import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Power, PowerOff, Settings, X, Mail, Clock, MoreVertical } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20' },
    { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20' },
    { value: 'support', label: 'Support', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20' },
    { value: 'finance', label: 'Finance', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800' },
];

const PERMISSIONS = [
    { key: 'can_handle_queries', label: 'Handle Queries', desc: 'Respond to and resolve customer queries' },
    { key: 'can_review_applications', label: 'Review Applications', desc: 'Review and approve/reject customer applications' },
    { key: 'can_manage_transactions', label: 'Manage Transactions', desc: 'Process and refund transactions' },
    { key: 'can_approve_claims', label: 'Approve Claims', desc: 'Approve insurance/service claims' },
    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive email alerts for assigned tasks' },
];

const StaffTab = ({ provider, onRefresh }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'support' });
    const [permissions, setPermissions] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

    useEffect(() => {
        loadStaff();
    }, [provider.id]);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const res = await providerService.getProviderStaff(provider.id);
            setStaff(res.results || res || []);
        } catch (e) {
            console.error('Failed to load staff:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await providerService.addStaff({
                provider: provider.id,
                email: inviteForm.email,
                role: inviteForm.role,
            });
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'support' });
            loadStaff();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to invite staff member.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async (staffId) => {
        await providerService.activateStaff(staffId);
        loadStaff();
    };

    const handleDeactivate = async (staffId) => {
        await providerService.deactivateStaff(staffId);
        loadStaff();
    };

    const openPermissions = (member) => {
        setSelectedStaff(member);
        setPermissions({
            can_handle_queries: member.can_handle_queries || false,
            can_review_applications: member.can_review_applications || false,
            can_manage_transactions: member.can_manage_transactions || false,
            can_approve_claims: member.can_approve_claims || false,
            email_notifications: member.email_notifications || false,
            max_transaction_limit: member.max_transaction_limit || '',
        });
        setShowPermissionsModal(true);
    };

    const handleUpdatePermissions = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await providerService.updateStaffPermissions(selectedStaff.id, permissions);
            setShowPermissionsModal(false);
            setSelectedStaff(null);
            loadStaff();
        } catch (err) {
            console.error('Failed to update permissions:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStaff = staff.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (s.user_name || '').toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q);
    });

    const getRoleConfig = (role) => ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[4];

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search staff..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <Button variant="primary" onClick={() => { setError(null); setShowInviteModal(true); }}>
                    <Plus size={16} className="mr-1.5" /> Invite Staff
                </Button>
            </div>

            {/* Staff List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-theme">
                            <CardBody className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary/10 skeleton-shimmer" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-36 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-48 h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : filteredStaff.length === 0 ? (
                <Card className="border-theme">
                    <CardBody className="p-12 text-center">
                        <Users size={48} className="text-primary/15 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">No Staff Members</h3>
                        <p className="text-secondary text-sm mb-6">Invite team members to help manage your provider operations.</p>
                        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                            <Plus size={16} className="mr-1.5" /> Invite First Staff
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredStaff.map(member => {
                        const roleConfig = getRoleConfig(member.role);
                        return (
                            <Card key={member.id} className="border-theme hover:shadow-md transition-shadow duration-200">
                                <CardBody className="p-4 flex items-center gap-4">
                                    {/* Avatar */}
                                    {member.user_avatar ? (
                                        <img src={member.user_avatar} alt={member.user_name} className="w-12 h-12 rounded-full object-cover border border-theme" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                            {(member.user_name || 'S').charAt(0)}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-primary text-sm">{member.user_name}</h4>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleConfig.color}`}>
                                                {roleConfig.label}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                member.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                            }`}>
                                                {member.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-secondary mt-0.5 truncate">{member.user_email}</p>
                                        {member.working_hours && (
                                            <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                                                <Clock size={10} /> {typeof member.working_hours === 'object' ? JSON.stringify(member.working_hours) : member.working_hours}
                                            </p>
                                        )}
                                    </div>

                                    {/* Permission badges */}
                                    <div className="hidden md:flex gap-1.5 flex-wrap max-w-[200px]">
                                        {member.can_manage_transactions && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20">TXN</span>}
                                        {member.can_handle_queries && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/20">QRY</span>}
                                        {member.can_review_applications && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20">APP</span>}
                                        {member.can_approve_claims && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">CLM</span>}
                                    </div>

                                    {/* Actions */}
                                    <div className="relative shrink-0">
                                        <button onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                        {openMenu === member.id && (
                                            <div className="absolute right-0 top-10 z-20 w-48 bg-elevated border border-theme rounded-xl shadow-xl py-1 animate-fadeIn">
                                                <button onClick={() => { openPermissions(member); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2">
                                                    <Shield size={14} /> Manage Permissions
                                                </button>
                                                {member.status === 'active' ? (
                                                    <button onClick={() => { handleDeactivate(member.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2">
                                                        <PowerOff size={14} /> Deactivate
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { handleActivate(member.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-2">
                                                        <Power size={14} /> Activate
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary">Invite Staff Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleInvite} className="p-5 space-y-5">
                            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Email Address *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        type="email" required
                                        value={inviteForm.email}
                                        onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                                        placeholder="colleague@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Role</label>
                                <select
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                                    className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={submitting}>
                                    {submitting ? 'Inviting...' : 'Send Invite'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPermissionsModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Manage Permissions</h3>
                                <p className="text-sm text-secondary">{selectedStaff.user_name}</p>
                            </div>
                            <button onClick={() => setShowPermissionsModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdatePermissions} className="p-5 space-y-4">
                            {PERMISSIONS.map(perm => (
                                <label key={perm.key} className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/3 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={permissions[perm.key] || false}
                                        onChange={e => setPermissions({...permissions, [perm.key]: e.target.checked})}
                                        className="w-4 h-4 mt-0.5 rounded border-theme text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-primary">{perm.label}</p>
                                        <p className="text-xs text-secondary">{perm.desc}</p>
                                    </div>
                                </label>
                            ))}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-primary mb-1">Max Transaction Limit</label>
                                <input
                                    type="number" step="0.01"
                                    value={permissions.max_transaction_limit || ''}
                                    onChange={e => setPermissions({...permissions, max_transaction_limit: e.target.value})}
                                    placeholder="No limit"
                                    className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => setShowPermissionsModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Update Permissions'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTab;
