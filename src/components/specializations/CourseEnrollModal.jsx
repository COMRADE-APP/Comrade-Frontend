/**
 * CourseEnrollModal — dedicated course enrollment/payment flow
 *
 * Individual: Confirm payment from wallet → enroll
 * Group: Select a payment group, choose members who get access → pay → enroll all
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Users, CreditCard, Lock, Check, AlertCircle, Loader2, GraduationCap } from 'lucide-react';
import Button from '../common/Button';
import paymentsService from '../../services/payments.service';
import specializationsService from '../../services/specializations.service';

const CourseEnrollModal = ({ course, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('individual'); // individual | group
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Group state
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Wallet balance
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect(() => {
        loadWallet();
        if (tab === 'group') loadGroups();
    }, [tab]);

    const loadWallet = async () => {
        try {
            const data = await paymentsService.getBalance();
            setWalletBalance(data?.balance ?? data?.available_balance ?? 0);
        } catch { setWalletBalance(0); }
    };

    const loadGroups = async () => {
        setLoadingGroups(true);
        try {
            const data = await paymentsService.getMyGroups();
            const list = Array.isArray(data) ? data : (data?.results || []);
            setGroups(list);
        } catch { setGroups([]); }
        finally { setLoadingGroups(false); }
    };

    const loadGroupMembers = async (group) => {
        setSelectedGroup(group);
        setSelectedMembers([]);
        try {
            const detail = await paymentsService.getPaymentGroupById(group.id);
            const members = detail?.members || detail?.member_list || [];
            setGroupMembers(Array.isArray(members) ? members : []);
        } catch {
            setGroupMembers([]);
        }
    };

    const toggleMember = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const price = parseFloat(course?.price || 0);
    const isFree = !course?.is_paid || price <= 0;

    // Group pricing: if package-based, calculate based on group size
    const groupPrice = (() => {
        const memberCount = selectedMembers.length;
        if (memberCount === 0) return 0;
        // If course has group_size / group_price fields, use them
        const groupSize = course?.group_size || 3;
        const groupPriceVal = course?.group_price || price;
        const groupsNeeded = Math.ceil(memberCount / groupSize);
        return groupsNeeded * groupPriceVal;
    })();

    const totalGroupCost = groupPrice + price; // requester + group members

    const handleIndividualEnroll = async () => {
        setLoading(true);
        setError('');
        try {
            if (isFree) {
                await specializationsService.enroll(course.id);
            } else {
                // Pay from wallet, then enroll
                await specializationsService.enrollWithPayment(course.id, {
                    payment_method: 'wallet',
                    amount: price
                });
            }
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Enrollment failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGroupEnroll = async () => {
        if (!selectedGroup || selectedMembers.length === 0) {
            setError('Please select a group and at least one member.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await specializationsService.groupEnroll(course.id, {
                group_id: selectedGroup.id,
                member_ids: selectedMembers,
                payment_method: 'wallet',
                amount: totalGroupCost
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Group enrollment failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <ModalShell onClose={onClose}>
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Enrolled Successfully!</h3>
                    <p className="text-secondary">
                        {tab === 'group'
                            ? `You and ${selectedMembers.length} members have been enrolled.`
                            : 'You now have full access to this course.'}
                    </p>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell onClose={onClose}>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                    {course?.image_url ? (
                        <img src={course.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <GraduationCap className="w-7 h-7 text-primary/60" />
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-primary leading-tight line-clamp-2">{course?.name}</h3>
                    <p className="text-sm text-secondary mt-0.5">
                        {isFree ? (
                            <span className="text-green-600 font-semibold">Free Course</span>
                        ) : (
                            <span className="font-semibold">${price.toFixed(2)}</span>
                        )}
                        {' · '}{course?.total_lessons || 0} lessons
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            {!isFree && (
                <div className="flex gap-1 bg-secondary/10 p-1 rounded-xl mb-5">
                    <button
                        onClick={() => setTab('individual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            tab === 'individual' ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        <User className="w-4 h-4" /> Individual
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            tab === 'group' ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        <Users className="w-4 h-4" /> Group
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg p-3 mb-4 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Individual Tab */}
            {(tab === 'individual' || isFree) && (
                <div className="space-y-4">
                    {/* Wallet info */}
                    {!isFree && (
                        <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-theme">
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <CreditCard className="w-4 h-4" /> Comrade Wallet
                            </div>
                            <div className="text-sm font-semibold text-primary">
                                ${Number(walletBalance || 0).toFixed(2)}
                            </div>
                        </div>
                    )}

                    {!isFree && walletBalance !== null && walletBalance < price && (
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg p-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Insufficient balance. Please top up your wallet.
                        </div>
                    )}

                    {/* Summary */}
                    <div className="border border-theme rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary">Course Fee</span>
                            <span className="font-semibold text-primary">{isFree ? 'Free' : `$${price.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-theme pt-2 mt-2">
                            <span className="text-primary">Total</span>
                            <span className="text-primary">{isFree ? 'Free' : `$${price.toFixed(2)}`}</span>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full justify-center"
                        onClick={handleIndividualEnroll}
                        disabled={loading || (!isFree && walletBalance < price)}
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : isFree ? (
                            <><GraduationCap className="w-4 h-4 mr-2" /> Enroll Free</>
                        ) : (
                            <><Lock className="w-4 h-4 mr-2" /> Pay & Enroll — ${price.toFixed(2)}</>
                        )}
                    </Button>
                </div>
            )}

            {/* Group Tab */}
            {tab === 'group' && !isFree && (
                <div className="space-y-4">
                    {/* Group selector */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">Select Payment Group</label>
                        {loadingGroups ? (
                            <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-4 text-sm text-secondary">
                                No groups found. <button onClick={() => navigate('/payments/groups')} className="text-primary-600 font-medium underline">Create one</button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-36 overflow-y-auto">
                                {groups.map(g => (
                                    <div
                                        key={g.id}
                                        onClick={() => loadGroupMembers(g)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                            selectedGroup?.id === g.id
                                                ? 'border-primary-500 bg-primary/5'
                                                : 'border-theme bg-elevated hover:border-primary-300'
                                        }`}
                                    >
                                        <Users className="w-5 h-5 text-primary-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">{g.name}</p>
                                            <p className="text-xs text-secondary">{g.member_count || g.members?.length || 0} members</p>
                                        </div>
                                        {selectedGroup?.id === g.id && <Check className="w-4 h-4 text-primary-500" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Member selector */}
                    {selectedGroup && (
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1.5">
                                Select Members ({selectedMembers.length} selected)
                            </label>
                            {groupMembers.length === 0 ? (
                                <p className="text-sm text-secondary text-center py-3">No members in this group.</p>
                            ) : (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {groupMembers.map(m => {
                                        const memberId = m.user_id || m.id || m.payment_profile?.id;
                                        const memberName = m.display_name || m.username || m.name || m.user?.username || m.payment_profile?.user?.username || `Member ${memberId}`;
                                        const memberAvatar = m.profile_picture || m.avatar || m.user?.profile_picture || m.payment_profile?.user?.profile_picture || null;
                                        const isSelected = selectedMembers.includes(memberId);
                                        return (
                                            <div
                                                key={memberId}
                                                onClick={() => toggleMember(memberId)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary/10 border border-primary-500'
                                                        : 'bg-secondary/5 border border-transparent hover:bg-secondary/10'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-400'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                
                                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden shrink-0">
                                                    {memberAvatar ? (
                                                        <img src={memberAvatar} alt={memberName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-secondary" />
                                                    )}
                                                </div>

                                                <span className="text-sm text-primary font-medium">{memberName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cost breakdown */}
                    {selectedMembers.length > 0 && (
                        <div className="border border-theme rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Your enrollment</span>
                                <span className="text-primary">${price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">{selectedMembers.length} members × ${price.toFixed(2)}</span>
                                <span className="text-primary">${(selectedMembers.length * price).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold border-t border-theme pt-2">
                                <span className="text-primary">Total</span>
                                <span className="text-primary">${((selectedMembers.length + 1) * price).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <Button
                        variant="primary"
                        className="w-full justify-center"
                        onClick={handleGroupEnroll}
                        disabled={loading || !selectedGroup || selectedMembers.length === 0}
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : (
                            <><Users className="w-4 h-4 mr-2" /> Enroll Group — ${((selectedMembers.length + 1) * price).toFixed(2)}</>
                        )}
                    </Button>
                </div>
            )}
        </ModalShell>
    );
};

// ─── modal shell ───────────────────────────────────────────────
const ModalShell = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-secondary hover:text-primary p-1 rounded-lg hover:bg-secondary/10 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            {children}
        </div>
    </div>
);

export default CourseEnrollModal;
