import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Loader2, UserPlus, Pencil, Check, X,
    Shield, ShieldCheck, User, MoreVertical, Trash2
} from 'lucide-react';
import Button from '../../components/common/Button';

const ROLES = [
    { value: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-purple-500' },
    { value: 'moderator', label: 'Moderator', icon: Shield, color: 'text-blue-500' },
    { value: 'member', label: 'Member', icon: User, color: 'text-gray-400' },
];

const MembersTab = ({ organizationId, isAdmin, organizationsService }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTitleId, setEditingTitleId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMembers();
    }, [organizationId]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const data = await organizationsService.getMembers(organizationId);
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditTitle = (member) => {
        setEditingTitleId(member.id);
        setEditingTitle(member.title || '');
    };

    const handleSaveTitle = async (memberId) => {
        setSaving(true);
        try {
            await organizationsService.updateMemberTitle(memberId, editingTitle);
            setMembers(members.map(m =>
                m.id === memberId ? { ...m, title: editingTitle } : m
            ));
            setEditingTitleId(null);
        } catch (err) {
            console.error('Error updating title:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleChangeRole = async (memberId, newRole) => {
        try {
            await organizationsService.updateMemberRole(memberId, newRole);
            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));
            setActionMenuId(null);
        } catch (err) {
            console.error('Error changing role:', err);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await organizationsService.removeMember(memberId);
            setMembers(members.filter(m => m.id !== memberId));
            setActionMenuId(null);
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    const getRoleInfo = (role) => {
        return ROLES.find(r => r.value === role) || ROLES[2];
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                    Members ({members.length})
                </h3>
                {isAdmin && (
                    <Button onClick={() => setShowAddModal(true)} size="sm">
                        <UserPlus className="w-4 h-4 mr-2" /> Add Member
                    </Button>
                )}
            </div>

            {/* Members List */}
            {members.length === 0 ? (
                <div className="text-center py-12 text-secondary">
                    <Users className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                    <p>No members yet.</p>
                    {isAdmin && (
                        <Button
                            onClick={() => setShowAddModal(true)}
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                        >
                            <UserPlus className="w-4 h-4 mr-2" /> Add First Member
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {members.map((member) => {
                        const roleInfo = getRoleInfo(member.role);
                        const RoleIcon = roleInfo.icon;

                        return (
                            <div
                                key={member.id}
                                className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg border border-theme hover:border-primary/30 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    {member.user_avatar ? (
                                        <img
                                            src={member.user_avatar}
                                            alt={member.user_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary-600" />
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-elevated ${roleInfo.color}`}>
                                        <RoleIcon className="w-3 h-3" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-primary truncate">{member.user_name}</p>
                                    <p className="text-sm text-secondary truncate">{member.user_email}</p>

                                    {/* Editable Title */}
                                    {editingTitleId === member.id ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                placeholder="Enter title (e.g., Head of Marketing)"
                                                className="flex-1 text-sm px-2 py-1 rounded bg-elevated border border-theme focus:border-primary-500 focus:outline-none text-primary"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveTitle(member.id)}
                                                disabled={saving}
                                                className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => setEditingTitleId(null)}
                                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            {member.title ? (
                                                <span className="text-xs text-primary-600 bg-primary-600/10 px-2 py-0.5 rounded-full">
                                                    {member.title}
                                                </span>
                                            ) : isAdmin ? (
                                                <button
                                                    onClick={() => handleEditTitle(member)}
                                                    className="text-xs text-tertiary hover:text-primary flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add title
                                                </button>
                                            ) : null}
                                            {isAdmin && member.title && (
                                                <button
                                                    onClick={() => handleEditTitle(member)}
                                                    className="p-1 text-tertiary hover:text-primary"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Role Badge */}
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color} bg-secondary/10`}>
                                    <RoleIcon className="w-3 h-3" />
                                    {roleInfo.label}
                                </div>

                                {/* Actions */}
                                {isAdmin && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                                            className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-secondary" />
                                        </button>

                                        {actionMenuId === member.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-elevated rounded-lg shadow-lg border border-theme py-1 z-50">
                                                <div className="px-3 py-2 text-xs text-tertiary font-medium border-b border-theme">
                                                    Change Role
                                                </div>
                                                {ROLES.map((role) => (
                                                    <button
                                                        key={role.value}
                                                        onClick={() => handleChangeRole(member.id, role.value)}
                                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary/20 ${member.role === role.value ? 'bg-primary-600/10 text-primary-600' : 'text-primary'
                                                            }`}
                                                    >
                                                        <role.icon className={`w-4 h-4 ${role.color}`} />
                                                        {role.label}
                                                        {member.role === role.value && <Check className="w-4 h-4 ml-auto" />}
                                                    </button>
                                                ))}
                                                <div className="border-t border-theme mt-1">
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        className="w-full px-3 py-2 text-left text-sm text-red-500 flex items-center gap-2 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Remove Member
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Member Modal placeholder - would need user search */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-elevated rounded-xl p-6 w-full max-w-md border border-theme">
                        <h3 className="text-lg font-semibold text-primary mb-4">Add Member</h3>
                        <p className="text-secondary text-sm mb-4">
                            Member invitation functionality coming soon.
                            You'll be able to search for users and invite them to join.
                        </p>
                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersTab;
