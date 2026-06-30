import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Plus, Search, Shield, Power, PowerOff, Settings, X, Mail, Clock, MoreVertical, UserPlus } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';
import paymentsService from '../../../services/payments.service';

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
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'support', userId: '' });
    const [permissions, setPermissions] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => { loadStaff(); }, [provider.id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        try { const res = await providerService.getProviderStaff(provider.id); setStaff(res.results || res || []); }
        catch (e) { console.error('Failed to load staff:', e); }
        finally { setLoading(false); }
    };

    const searchUsers = useCallback((query) => {
        if (!query || query.length < 2) { setUserResults([]); setShowUserDropdown(false); return; }
        setSearchingUsers(true);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await paymentsService.searchUsers(query);
                const results = Array.isArray(res) ? res : (res?.results || res?.data || []);
                setUserResults(results.slice(0, 6));
                setShowUserDropdown(true);
            } catch (err) { console.error('Search failed:', err); }
            finally { setSearchingUsers(false); }
        }, 300);
    }, []);

    const handleUserSearch = (value) => {
        setUserQuery(value);
        setSelectedUser(null);
        setInviteForm(prev => ({ ...prev, email: '', userId: '' }));
        if (value.includes('@')) {
            setInviteForm(prev => ({ ...prev, email: value }));
            setShowUserDropdown(false);
        } else {
            searchUsers(value);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setUserQuery(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email);
        setInviteForm(prev => ({ ...prev, email: user.email, userId: user.id }));
        setShowUserDropdown(false);
        setUserResults([]);
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        setUserQuery('');
        setInviteForm({ email: '', role: 'support', userId: '' });
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteForm.email) { setError('Please select a user or enter an email address.'); return; }
        setSubmitting(true); setError(null);
        try {
            await providerService.addStaff({ provider: provider.id, email: inviteForm.email, role: inviteForm.role });
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'support', userId: '' });
            setUserQuery(''); setSelectedUser(null); setUserResults([]);
            loadStaff();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to invite staff member.');
        } finally { setSubmitting(false); }
    };

    const handleActivate = async (staffId) => { await providerService.activateStaff(staffId); loadStaff(); };
    const handleDeactivate = async (staffId) => { await providerService.deactivateStaff(staffId); loadStaff(); };

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
        e.preventDefault(); setSubmitting(true);
        try { await providerService.updateStaffPermissions(selectedStaff.id, permissions); setShowPermissionsModal(false); setSelectedStaff(null); loadStaff(); }
        catch (err) { console.error('Failed to update permissions:', err); }
        finally { setSubmitting(false); }
    };

    const filteredStaff = staff.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (s.user_name || '').toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q);
    });

    const getRoleConfig = (role) => ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[4];

    const getInitials = (name) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <Button variant="primary" size="sm" onClick={() => { setError(null); setShowInviteModal(true); }}>
                    <UserPlus size={16} className="mr-1.5" /> Invite Staff
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filteredStaff.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <Users size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Staff Members</h4>
                    <p className="text-sm text-secondary mb-6">Invite team members to help manage your provider operations.</p>
                    <Button variant="primary" size="sm" onClick={() => { setError(null); setShowInviteModal(true); }}>
                        <UserPlus size={14} className="mr-1.5" /> Invite Your First Staff
                    </Button>
                </div>
            )}

            {!loading && filteredStaff.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                    {filteredStaff.map(member => {
                        const roleCfg = getRoleConfig(member.role);
                        return (
                            <Card key={member.id} className="border-theme">
                                <CardBody className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${roleCfg.color}`}>
                                            {getInitials(member.user_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary text-sm truncate">{member.user_name || member.user_email}</p>
                                            <p className="text-xs text-secondary truncate">{member.user_email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${roleCfg.color}`}>{roleCfg.label}</span>
                                        {member.status === 'active' ? (
                                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">Active</span>
                                        ) : (
                                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-gray-50 text-gray-700">Inactive</span>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex gap-1 flex-wrap max-w-[180px]">
                                        {member.can_manage_transactions && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">TXN</span>}
                                        {member.can_handle_queries && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">QRY</span>}
                                        {member.can_review_applications && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">APP</span>}
                                        {member.can_approve_claims && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">CLM</span>}
                                    </div>

                                    <div className="relative shrink-0 ml-auto sm:ml-0">
                                        <button onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                        {openMenu === member.id && (
                                            <div className="absolute right-0 top-10 z-20 w-48 bg-elevated border border-theme rounded-xl shadow-xl py-1">
                                                <button onClick={() => { openPermissions(member); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2">
                                                    <Shield size={14} /> Manage Permissions
                                                </button>
                                                {member.status === 'active' ? (
                                                    <button onClick={() => { handleDeactivate(member.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                                                        <PowerOff size={14} /> Deactivate
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { handleActivate(member.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
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

            {/* Invite Modal with Autocomplete */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowInviteModal(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); }}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Invite Staff Member</h3>
                                <p className="text-xs text-secondary mt-0.5">Search by name, username, or email</p>
                            </div>
                            <button onClick={() => { setShowInviteModal(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); }} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-5 space-y-5">
                            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}

                            {/* Autocomplete Search */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Find User *</label>
                                <div className="relative" ref={searchRef}>
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                    {selectedUser ? (
                                        <div className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                                {selectedUser.profile_picture || selectedUser.avatar ? (
                                                    <img src={selectedUser.profile_picture || selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : getInitials(`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim())}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-primary truncate">
                                                    {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email}
                                                </p>
                                                <p className="text-xs text-secondary truncate">{selectedUser.email}</p>
                                            </div>
                                            <button type="button" onClick={handleClearSelection} className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-600 shrink-0">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="text" required
                                            value={userQuery}
                                            onChange={e => handleUserSearch(e.target.value)}
                                            onFocus={() => { if (userResults.length > 0) setShowUserDropdown(true); }}
                                            placeholder="Search by name, username, or email..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    )}

                                    {/* Search Results Dropdown */}
                                    {showUserDropdown && !selectedUser && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-elevated border border-theme rounded-xl shadow-xl z-30 overflow-hidden">
                                            {searchingUsers ? (
                                                <div className="px-4 py-3 text-sm text-secondary text-center">
                                                    <div className="w-5 h-5 rounded-full border-2 border-secondary/20 border-t-primary-600 animate-spin mx-auto mb-1" />
                                                    Searching...
                                                </div>
                                            ) : userResults.length > 0 ? (
                                                userResults.map(user => (
                                                    <button key={user.id} type="button"
                                                        onClick={() => handleSelectUser(user)}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left border-b border-theme last:border-0">
                                                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                                            {user.profile_picture || user.avatar ? (
                                                                <img src={user.profile_picture || user.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : getInitials(`${user.first_name || ''} ${user.last_name || ''}`.trim())}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-primary truncate">
                                                                {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                                                            </p>
                                                            <p className="text-xs text-secondary truncate">{user.email}</p>
                                                        </div>
                                                        <span className="text-[10px] text-primary-600 font-medium shrink-0">Select</span>
                                                    </button>
                                                ))
                                            ) : userQuery.length >= 2 ? (
                                                <div className="px-4 py-3 text-sm text-secondary text-center">No users found</div>
                                            ) : (
                                                <div className="px-4 py-3 text-xs text-secondary text-center">Type at least 2 characters to search</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!selectedUser && !showUserDropdown && (
                                    <p className="text-[11px] text-secondary mt-1">Search by name or type a full email address directly.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Role</label>
                                <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                                    className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => { setShowInviteModal(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); }}>Cancel</Button>
                                <Button variant="primary" type="submit" isLoading={submitting}>Send Invite</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPermissionsModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary">Manage Permissions</h3>
                            <button onClick={() => setShowPermissionsModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdatePermissions} className="p-5 space-y-4">
                            <p className="text-sm text-secondary">{selectedStaff.user_name || selectedStaff.user_email} — {getRoleConfig(selectedStaff.role).label}</p>
                            {PERMISSIONS.map(perm => (
                                <label key={perm.key} className="flex items-start gap-3 p-3 rounded-xl border border-theme hover:bg-secondary/5 transition-colors cursor-pointer">
                                    <input type="checkbox" checked={permissions[perm.key] || false}
                                        onChange={e => setPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                                        className="mt-0.5 w-4 h-4 rounded border-theme text-primary focus:ring-primary shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary">{perm.label}</p>
                                        <p className="text-xs text-secondary">{perm.desc}</p>
                                    </div>
                                </label>
                            ))}
                            {permissions.can_manage_transactions && (
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Max Transaction Limit</label>
                                    <input type="number" step="0.01" value={permissions.max_transaction_limit || ''}
                                        onChange={e => setPermissions(prev => ({ ...prev, max_transaction_limit: e.target.value }))}
                                        className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="No limit" />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-3 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => setShowPermissionsModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" isLoading={submitting}>Save Permissions</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTab;
