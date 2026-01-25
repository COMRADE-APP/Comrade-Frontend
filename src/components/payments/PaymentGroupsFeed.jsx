import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, ChevronRight, UserPlus, Check, X } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import paymentsService from '../../services/payments.service';

/**
 * PaymentGroupsFeed - Dashboard widget showing user's payment groups and invitations
 */
const PaymentGroupsFeed = ({ limit = 5 }) => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [groupsData, invitesData] = await Promise.all([
                paymentsService.getMyGroups().catch(() => []),
                paymentsService.getInvitations().catch(() => []),
            ]);
            setGroups(Array.isArray(groupsData) ? groupsData.slice(0, limit) : []);
            setInvitations(Array.isArray(invitesData) ? invitesData.filter(i => i.status === 'pending') : []);
        } catch (error) {
            console.error('Error loading payment groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvitationResponse = async (invitationId, accept) => {
        try {
            await paymentsService.respondToInvitation(invitationId, accept);
            setInvitations(invitations.filter(i => i.id !== invitationId));
            if (accept) loadData();
        } catch (error) {
            console.error('Failed to respond to invitation:', error);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardBody className="p-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">My Groups</h3>
                </div>
                <button
                    onClick={() => navigate('/payments/create-group')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    + New Group
                </button>
            </CardHeader>
            <CardBody className="p-0">
                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="p-4 bg-amber-50 border-b border-amber-100">
                        <p className="text-sm font-medium text-amber-800 mb-2">
                            <UserPlus className="w-4 h-4 inline mr-1" />
                            {invitations.length} Pending Invitation{invitations.length > 1 ? 's' : ''}
                        </p>
                        {invitations.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between bg-white p-3 rounded-lg mt-2">
                                <div>
                                    <p className="font-medium text-gray-900">{invite.payment_group?.name || 'Group Invitation'}</p>
                                    <p className="text-xs text-gray-500">From {invite.invited_by?.user?.email || 'unknown'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleInvitationResponse(invite.id, false)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleInvitationResponse(invite.id, true)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Group List */}
                {groups.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No payment groups yet</p>
                        <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => navigate('/payments/create-group')}
                        >
                            Create Your First Group
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                onClick={() => navigate(`/payments/groups/${group.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{group.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {group.members?.length || 0} members • ${group.current_amount || 0} / ${group.target_amount || 'No target'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                )}

                {groups.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/savings-goals')}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All Groups →
                        </button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default PaymentGroupsFeed;
