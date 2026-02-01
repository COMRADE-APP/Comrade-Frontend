import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Users, Plus, Search, Target, DollarSign, UserPlus, Settings,
    MoreVertical, Calendar, TrendingUp, ArrowLeft, Filter,
    CheckCircle, XCircle, Clock, Bell, PiggyBank, X, Mail, AlertCircle
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const PaymentGroups = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, completed, pending

    // Modal states
    const [showInvitationsModal, setShowInvitationsModal] = useState(false);
    const [respondingTo, setRespondingTo] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [groupsData, invitationsData] = await Promise.all([
                paymentsService.getMyGroups().catch(() => []),
                paymentsService.getInvitations().catch(() => [])
            ]);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
            setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
        } catch (error) {
            console.error('Error loading payment groups:', error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRespondInvitation = async (invitationId, accept) => {
        setRespondingTo(invitationId);
        try {
            await paymentsService.respondToInvitation(invitationId, accept);
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            if (accept) loadData();
        } catch (error) {
            console.error('Error responding to invitation:', error);
            alert('Failed to respond to invitation');
        } finally {
            setRespondingTo(null);
        }
    };

    const filteredGroups = groups.filter((group) => {
        const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'active') return matchesSearch && group.is_active;
        if (filter === 'completed') return matchesSearch && !group.is_active;
        return matchesSearch;
    });

    const getProgress = (group) => {
        if (!group.target_amount || group.target_amount === 0) return 0;
        return Math.min(100, (parseFloat(group.current_amount || 0) / parseFloat(group.target_amount)) * 100);
    };

    const totalSaved = groups.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
    const totalTarget = groups.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
    const activeCount = groups.filter(g => g.is_active).length;
    const pendingInvites = invitations.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/payments')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payment Groups</h1>
                        <p className="text-gray-600 mt-1">Manage your group savings and contributions</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {pendingInvites > 0 && (
                        <Button variant="outline" onClick={() => setShowInvitationsModal(true)}>
                            <Bell className="w-4 h-4 mr-2" />
                            Invitations ({pendingInvites})
                        </Button>
                    )}
                    <Button variant="primary" onClick={() => navigate('/payments/create-group')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Group
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Groups</p>
                                <p className="text-xl font-bold text-gray-900">{groups.length}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Active Groups</p>
                                <p className="text-xl font-bold text-gray-900">{activeCount}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Saved</p>
                                <p className="text-xl font-bold text-gray-900">${totalSaved.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Target Amount</p>
                                <p className="text-xl font-bold text-gray-900">${totalTarget.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm ${filter === f
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pending Invitations Banner */}
            {pendingInvites > 0 && (
                <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">You have {pendingInvites} pending invitation(s)</h3>
                                    <p className="text-sm text-gray-600">Review and respond to group invitations</p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => setShowInvitationsModal(true)}>
                                View Invitations
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Groups List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading groups...</p>
                </div>
            ) : filteredGroups.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No groups found' : 'No payment groups yet'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm
                                ? 'Try a different search term'
                                : 'Create a payment group to start saving with others'
                            }
                        </p>
                        {!searchTerm && (
                            <Button variant="primary" onClick={() => navigate('/payments/create-group')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Group
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGroups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            progress={getProgress(group)}
                            onClick={() => navigate(`/payments/groups/${group.id}`)}
                            onInvite={() => navigate(`/payments/groups/${group.id}?tab=members`)}
                            onPiggyBank={() => navigate('/piggy-banks')}
                        />
                    ))}
                </div>
            )}

            {/* Invitations Modal */}
            {showInvitationsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <CardBody className="p-0">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-xl font-bold text-gray-900">Group Invitations</h2>
                                <button onClick={() => setShowInvitationsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-4">
                                {invitations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No pending invitations</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {invitations.map((invitation) => (
                                            <div key={invitation.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {invitation.group_name || invitation.payment_group?.name || 'Payment Group'}
                                                            </h4>
                                                            <p className="text-sm text-gray-500">
                                                                Invited by {invitation.invited_by_name || invitation.invited_by?.username || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatDate(invitation.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleRespondInvitation(invitation.id, false)}
                                                        disabled={respondingTo === invitation.id}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Decline
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        className="flex-1"
                                                        onClick={() => handleRespondInvitation(invitation.id, true)}
                                                        disabled={respondingTo === invitation.id}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Accept
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const GroupCard = ({ group, progress, onClick, onInvite, onPiggyBank }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <Card
            className="hover:shadow-lg transition-shadow cursor-pointer relative"
            onClick={onClick}
        >
            <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            <p className="text-sm text-gray-500">
                                {group.members_count || 0} members
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {group.is_active ? 'Active' : 'Completed'}
                        </span>
                        <div className="relative">
                            <button
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-8 bg-white border shadow-lg rounded-lg py-1 z-10 min-w-[150px]">
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        onClick={(e) => { e.stopPropagation(); onInvite(); setShowMenu(false); }}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Invite Members
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        onClick={(e) => { e.stopPropagation(); onPiggyBank(); setShowMenu(false); }}
                                    >
                                        <PiggyBank className="w-4 h-4" />
                                        Create Piggy Bank
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        onClick={(e) => { e.stopPropagation(); onClick(); setShowMenu(false); }}
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {group.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                )}

                {/* Progress Bar */}
                {group.target_amount > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>${parseFloat(group.current_amount || 0).toFixed(2)}</span>
                            <span>${parseFloat(group.target_amount).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(group.created_at)}</span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); onInvite(); }}
                        >
                            <UserPlus className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); onPiggyBank(); }}
                        >
                            <PiggyBank className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default PaymentGroups;
