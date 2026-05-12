import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, TrendingUp, Award, Clock, CheckCircle, XCircle, AlertCircle, Loader, User, Wallet, RefreshCw, Landmark, CreditCard, Search, Send } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupRoundsTab = ({ groupId }) => {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [pickingForRound, setPickingForRound] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [showContributeConfirm, setShowContributeConfirm] = useState(null);
    const navigate = useNavigate();
    const [availablePositions, setAvailablePositions] = useState([]);
    const [myPosition, setMyPosition] = useState(null);
    const [positions, setPositions] = useState([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [configForm, setConfigForm] = useState({
        round_name: '',
        contribution_amount: '',
        assignment_method: 'random',
        start_date: '',
        use_previous_positions: false,
        contribution_frequency: 'monthly',
        start_condition: 'all_members',
        voting_deadline_days: 7
    });
    const [configError, setConfigError] = useState('');
    const [configLoading, setConfigLoading] = useState(false);
    const [pickLoading, setPickLoading] = useState(false);
    const [selectedRound, setSelectedRound] = useState(null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimDestination, setClaimDestination] = useState('wallet');
    const [claimMode, setClaimMode] = useState('wallet');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!groupId) return;
        loadRounds();
        loadPositions();
    }, [groupId]);

    const loadRounds = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await paymentsService.getGroupRounds(groupId).catch(err => {
                console.error('getGroupRounds error:', err);
                return [];
            });
            setRounds(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading rounds:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPositions = async (selectedRoundId = null) => {
        if (!groupId) return;
        setPositionsLoading(true);
        try {
            const roundId = selectedRoundId || (rounds[0]?.id || null);
            const [available, myPos, allPositions] = await Promise.all([
                paymentsService.getAvailablePositions(groupId, roundId).catch(() => ({ available_positions: [] })),
                paymentsService.getMyPosition(groupId, roundId).catch(() => ({ has_position: false, position: null })),
                paymentsService.getRoundPositions(groupId, roundId).catch(() => [])
            ]);
            setAvailablePositions(available.available_positions || []);
            if (myPos.has_position) setMyPosition(myPos.position);
            setPositions(Array.isArray(allPositions) ? allPositions : (allPositions?.results || []));
        } catch (error) {
            console.error('Error loading positions:', error);
        } finally {
            setPositionsLoading(false);
        }
    };

    const handlePickPosition = async (positionNumber) => {
        if (!pickingForRound) return;
        setPickLoading(positionNumber);
        try {
            await paymentsService.pickPosition(groupId, pickingForRound, positionNumber);
            setShowPositionModal(false);
            setPickingForRound(null);
            loadRounds();
            loadPositions(pickingForRound);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to pick position');
        } finally {
            setPickLoading(false);
        }
    };

    const openPickModal = (roundId) => {
        setPickingForRound(roundId);
        loadPositions(roundId);
        setShowPositionModal(true);
    };

    const handleCreateRound = async () => {
        setConfigLoading(true);
        setConfigError('');
        try {
            if (!configForm.contribution_amount || parseFloat(configForm.contribution_amount) <= 0) {
                setConfigError('Please enter a valid contribution amount');
                return;
            }
            await paymentsService.createRound({
                payment_group: groupId,
                round_name: configForm.round_name,
                contribution_amount: parseFloat(configForm.contribution_amount),
                assignment_method: configForm.assignment_method,
                start_date: configForm.start_date || new Date().toISOString(),
                use_previous_positions: configForm.use_previous_positions,
                contribution_frequency: configForm.contribution_frequency,
                start_condition: configForm.start_condition,
                voting_deadline: configForm.voting_deadline_days ? new Date(Date.now() + configForm.voting_deadline_days * 24 * 60 * 60 * 1000).toISOString() : null
            });
            setShowConfigModal(false);
            setConfigForm({ 
                round_name: '', 
                contribution_amount: '', 
                assignment_method: 'random', 
                start_date: '', 
                use_previous_positions: false,
                contribution_frequency: 'monthly',
                start_condition: 'all_members',
                voting_deadline_days: 7
            });
            loadRounds();
        } catch (error) {
            console.error('Round creation error:', error.response?.data || error);
            const errorData = error.response?.data;
            let errorMessage = 'Failed to create round';
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (typeof errorData === 'object') {
                    errorMessage = Object.entries(errorData).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('; ');
                }
            }
            setConfigError(errorMessage);
        } finally {
            setConfigLoading(false);
        }
    };

    const handleApprove = async (roundId) => {
        setApprovalLoading(roundId);
        try {
            const result = await paymentsService.approveRound(roundId);
            if (result.threshold_met) {
                alert('Round has been approved by enough members and is ready to start!');
            }
            loadRounds();
            if (showApprovalModal === roundId) {
                loadApprovalStatus(roundId);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve round');
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleReject = async (roundId) => {
        setApprovalLoading(roundId);
        try {
            const result = await paymentsService.rejectRound(roundId, rejectNote);
            if (result.current_status === 'cancelled') {
                alert('Round has been cancelled due to too many rejections');
            }
            setShowRejectModal(null);
            setRejectNote('');
            loadRounds();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject round');
        } finally {
            setApprovalLoading(false);
        }
    };

    const handleStart = async (roundId) => {
        setApprovalLoading(roundId);
        try {
            await paymentsService.startRound(roundId);
            loadRounds();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to start round');
        } finally {
            setApprovalLoading(false);
        }
    };


    const handleClaim = async () => {
        if (!selectedRound) return;
        setClaimLoading(true);
        try {
            const payload = {
                destination: claimDestination,
                claim_mode: claimMode
            };
            if (claimMode === 'send_to_user' && selectedUser) {
                payload.recipient_id = selectedUser.id;
            }
            await paymentsService.claimRoundPayout(selectedRound.id, payload);
            setShowClaimModal(false);
            setSelectedUser(null);
            setUserSearchQuery('');
            loadRounds();
            alert('Payout claimed successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to claim payout');
        } finally {
            setClaimLoading(false);
        }
    };

    const handleUserSearch = async (query) => {
        setUserSearchQuery(query);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        if (!query || query.length < 2) {
            setUserSearchResults([]);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            setUserSearchLoading(true);
            try {
                const results = await paymentsService.searchUsers(query);
                setUserSearchResults(Array.isArray(results) ? results : (results?.results || []));
            } catch (error) {
                console.error('User search error:', error);
                setUserSearchResults([]);
            } finally {
                setUserSearchLoading(false);
            }
        }, 300);
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        setUserSearchQuery(user.get_full_name ? user.get_full_name() : (user.full_name || user.email || user.username || ''));
        setUserSearchResults([]);
    };

    const [walletBalance, setWalletBalance] = useState(0);

    const handleContribute = async (round) => {
        const amount = parseFloat(round.contribution_amount || 0);
        // Redirect to checkout instead of direct deduction
        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: round.id,
                    type: 'round_contribution',
                    name: round.round_name || `Round #${round.round_number}`,
                    price: amount,
                    qty: 1,
                }],
                purchaseType: 'group_contribution',
                totalAmount: amount,
                groupId: groupId,
                roundId: round.id
            }
        });
    };

    const handleRandomize = async (roundId) => {
        if (!window.confirm('Are you sure you want to randomly assign positions to all members? This will overwrite existing choices.')) return;
        try {
            await paymentsService.randomizeRoundPositions(roundId);
            loadRounds();
            alert('Positions randomized successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to randomize positions');
        }
    };

    const loadWalletBalance = async () => {
        try {
            const data = await paymentsService.getBalance();
            console.log('Rounds wallet balance:', data);
            const balance = data?.balance ?? data?.display_balance ?? data?.available_balance ?? 0;
            setWalletBalance(typeof balance === 'number' ? balance : parseFloat(balance) || 0);
        } catch (error) {
            console.error('Error loading wallet balance:', error);
            setWalletBalance(0);
        }
    };

    useEffect(() => {
        loadWalletBalance();
    }, []);

    const loadApprovalStatus = async (roundId) => {
        try {
            const status = await paymentsService.getRoundApprovalStatus(roundId);
            setApprovalStatus(status);
        } catch (error) {
            console.error('Error loading approval status:', error);
        }
    };

    useEffect(() => {
        if (showApprovalModal) {
            loadApprovalStatus(showApprovalModal);
        }
    }, [showApprovalModal]);

    const statusColors = {
        pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    };

    const statusIcons = {
        pending_approval: AlertCircle,
        pending: Clock,
        active: TrendingUp,
        completed: CheckCircle,
        cancelled: XCircle
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Chama Rounds (Rotating Collections)</h3>
                    <p className="text-sm text-secondary">Track who&apos;s turn it is to receive the pool and member contributions.</p>
                </div>
                <Button variant="primary" className="gap-2" onClick={() => setShowConfigModal(true)}>
                    <Plus className="w-4 h-4" /> Start New Round
                </Button>
            </div>

            {positionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-secondary"><Loader className="w-4 h-4 animate-spin" /> Loading positions...</div>
            ) : myPosition ? (
                <Card className="border-theme bg-blue-50 dark:bg-blue-900/10">
                    <CardBody className="p-3 flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-primary"><strong>Your Position:</strong> #{myPosition.position_number} of {positions.length} members</span>
                    </CardBody>
                </Card>
            ) : availablePositions.length > 0 ? (
                <Card className="border-theme bg-amber-50 dark:bg-amber-900/10">
                    <CardBody className="p-3 flex items-center justify-between">
                        <span className="text-sm text-primary"><strong>Pick your position</strong> in the rotation sequence</span>
                        <Button variant="outline" size="sm" onClick={() => setShowPositionModal(true)}>Choose Position</Button>
                    </CardBody>
                </Card>
            ) : null}

            {rounds.some(r => r.has_unclaimed_payout) && (
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Pending Payouts for You
                    </h4>
                    {rounds.filter(r => r.has_unclaimed_payout).map(round => (
                        <Card key={`pending-${round.id}`} className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
                            <CardBody className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Payout Ready: {round.round_name || `Round #${round.round_number}`}</h4>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Your collection is ready to be claimed to your wallet.</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white" 
                                    onClick={() => { setSelectedRound(round); setShowClaimModal(true); }}
                                >
                                    Claim Now
                                </Button>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {rounds.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Rounds</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Enable rotating collections to allow members to take turns receiving the group&apos;s pooled contributions.
                    </p>
                    <Button variant="primary" onClick={() => setShowConfigModal(true)}>
                        Configure Rounds
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rounds.map((round) => (
                        <Card key={round.id} className="overflow-hidden border-theme">
                            <CardBody className="p-0">
                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            round.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                            round.status === 'completed' ? 'bg-purple-100 text-purple-600' :
                                            round.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-600' :
                                            round.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            {React.createElement(statusIcons[round.status] || Clock, { className: "w-6 h-6" })}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-primary text-lg">
                                                    {round.round_name || `Round #${round.round_number}`}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[round.status] || 'bg-secondary/10 text-secondary'}`}>
                                                    {round.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-secondary flex items-center gap-2 mt-1">
                                                <Users className="w-3.5 h-3.5" /> Recipient: 
                                                <span className="font-semibold text-primary">{round.awarded_to_name || 'Not assigned'}</span>
                                            </p>
                                        </div>
                                    </div>
                                        <div className="flex flex-col md:items-end">
                                            <div className="text-2xl font-bold text-primary">
                                                {formatMoneySimple(round.total_collected || 0)}
                                            </div>
                                            <p className="text-xs text-secondary">collected of {formatMoneySimple(round.contribution_amount || 0)} per member</p>
                                            
                                            {!round.user_position && (round.status === 'pending' || round.status === 'pending_approval' || round.status === 'active') ? (
                                                <button 
                                                    onClick={() => openPickModal(round.id)}
                                                    className="mt-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                                                >
                                                    <Calendar className="w-3 h-3" /> Pick Position
                                                </button>
                                            ) : round.user_position ? (
                                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    <Award className="w-3 h-3" /> Position: #{round.user_position}
                                                </div>
                                            ) : null}
                                        </div>
                                </div>
                                <div className="h-1.5 w-full bg-secondary/10">
                                    <div 
                                        className={`h-full transition-all ${round.status === 'active' ? 'bg-emerald-500' : round.status === 'pending' ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                                        style={{ width: `${round.progress_percentage || 0}%` }}
                                    />
                                </div>

                                {round.has_unclaimed_payout && (
                                    <div className="mx-4 my-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600">
                                                    <Award className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Payout Ready!</h4>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Your rotating collection is ready to be claimed.</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="primary" 
                                                size="sm" 
                                                className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white" 
                                                onClick={() => { setSelectedRound(round); setShowClaimModal(true); }}
                                            >
                                                Claim Now
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {round.status === 'active' && round.members_rotation && (
                                    <div className="px-4 py-3 border-t border-theme bg-secondary/5">
                                        <h5 className="text-[10px] font-bold text-secondary uppercase mb-2">Rotation Schedule</h5>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {round.members_rotation.map((pos) => (
                                                <div key={pos.member_id} className={`flex-shrink-0 w-24 p-2 rounded-lg border ${
                                                    pos.status === 'current' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20' :
                                                    pos.status === 'past' ? 'bg-secondary/10 border-transparent opacity-60' :
                                                    'bg-elevated border-theme'
                                                }`}>
                                                    <div className="text-[8px] font-bold text-tertiary mb-1 flex justify-between">
                                                        <span>#{pos.position}</span>
                                                        {pos.status === 'current' && <RefreshCw className="w-2 h-2 animate-spin text-emerald-500" />}
                                                        {pos.status === 'past' && <CheckCircle className="w-2 h-2 text-emerald-500" />}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-primary truncate">{pos.name}</div>
                                                    <div className={`text-[8px] mt-1 ${
                                                        pos.status === 'current' ? 'text-emerald-600 font-bold' :
                                                        pos.status === 'past' ? 'text-secondary' : 'text-tertiary'
                                                    }`}>
                                                        {pos.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 bg-secondary/5 flex items-center justify-between text-[10px] text-tertiary">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Starts: {formatDate(round.start_date)}</span>
                                        {round.award_date && <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Awarded: {formatDate(round.award_date)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {round.status === 'pending_approval' && (
                                            <>
                                                <Button variant="primary" size="sm" className="!py-1 !px-3 text-[10px]" onClick={() => handleApprove(round.id)} disabled={approvalLoading === round.id}>
                                                    {approvalLoading === round.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Approve'}
                                                </Button>
                                                <Button variant="outline" size="sm" className="!py-1 !px-3 text-[10px] !text-red-600 !border-red-300" onClick={() => setShowRejectModal(round.id)} disabled={approvalLoading === round.id}>
                                                    Reject
                                                </Button>
                                                <button className="text-primary font-bold hover:underline" onClick={() => setShowApprovalModal(round.id)}>View Votes</button>
                                            </>
                                        )}
                                        {round.status === 'pending' && (
                                            <Button variant="primary" size="sm" className="!py-1 !px-3 text-[10px]" onClick={() => handleStart(round.id)} disabled={approvalLoading === round.id}>
                                                {approvalLoading === round.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Start Round'}
                                            </Button>
                                        )}
                                        {round.status === 'active' && (
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant={walletBalance < parseFloat(round.contribution_amount) ? 'outline' : 'primary'} 
                                                    size="sm" 
                                                    className={`!py-1 !px-3 text-[10px] ${walletBalance < parseFloat(round.contribution_amount) ? 'border-amber-300 text-amber-600' : ''}`} 
                                                    onClick={() => handleContribute(round)}
                                                >
                                                    {walletBalance < parseFloat(round.contribution_amount) ? 'Top Up & Pay' : 'Contribute'}
                                                </Button>
                                            </div>
                                        )}
                                        {(round.status === 'pending' || round.status === 'pending_approval') && (
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="!py-1 !px-3 text-[10px] gap-1" 
                                                    onClick={() => handleRandomize(round.id)}
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Randomize
                                                </Button>
                                            </div>
                                        )}
                                        {round.status === 'completed' && (
                                            <span className="text-xs text-secondary">Completed</span>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Configure New Round</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Round Name (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary"
                                        value={configForm.round_name}
                                        onChange={(e) => setConfigForm({ ...configForm, round_name: e.target.value })}
                                        placeholder="e.g. January Round, Emergency Fund Round"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Contribution Amount (per member)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary"
                                        value={configForm.contribution_amount}
                                        onChange={(e) => setConfigForm({ ...configForm, contribution_amount: e.target.value })}
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Frequency</label>
                                        <select
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary"
                                            value={configForm.contribution_frequency}
                                            onChange={(e) => setConfigForm({ ...configForm, contribution_frequency: e.target.value })}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Start Condition</label>
                                        <select
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary"
                                            value={configForm.start_condition}
                                            onChange={(e) => setConfigForm({ ...configForm, start_condition: e.target.value })}
                                        >
                                            <option value="all_members">All Members Joined</option>
                                            <option value="threshold">Approval Threshold</option>
                                            <option value="manual">Manual Start</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="use_previous_positions"
                                        checked={configForm.use_previous_positions}
                                        onChange={(e) => setConfigForm({ ...configForm, use_previous_positions: e.target.checked })}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="use_previous_positions" className="text-sm text-secondary">
                                        Use positions from previous round
                                    </label>
                                </div>
                                {configError && <p className="text-sm text-red-500">{configError}</p>}
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowConfigModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1" onClick={handleCreateRound} disabled={configLoading}>
                                        {configLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Round'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {showPositionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Pick Your Position</h3>
                            <p className="text-sm text-secondary mb-4">Choose your position in the rotation sequence. This determines when you will receive the pooled amount.</p>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {availablePositions.map((pos) => (
                                    <button
                                        key={pos}
                                        className={`py-3 rounded-lg font-bold text-sm border transition-all ${
                                            pickLoading === pos
                                                ? 'bg-secondary/20 text-tertiary cursor-wait'
                                                : 'bg-elevated border-theme text-primary hover:border-primary hover:bg-primary/5'
                                        }`}
                                        onClick={() => handlePickPosition(pos)}
                                        disabled={pickLoading === pos}
                                    >
                                        {pickLoading === pos ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : `#${pos}`}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowPositionModal(false)}>Cancel</Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 border-emerald-300 text-emerald-600 gap-2" 
                                    onClick={() => handleRandomize(pickingForRound)}
                                >
                                    <RefreshCw className="w-4 h-4" /> Randomize
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {showApprovalModal && approvalStatus && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-2">Round #{approvalStatus.round_number} - Approval Status</h3>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-secondary">Progress</span>
                                    <span className="text-primary font-bold">{approvalStatus.approval_percentage}% ({approvalStatus.approvals_count}/{approvalStatus.member_count})</span>
                                </div>
                                <div className="h-2 bg-secondary/10 rounded-full">
                                    <div className={`h-full rounded-full transition-all ${approvalStatus.threshold_met ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${approvalStatus.approval_percentage}%` }} />
                                </div>
                                <p className="text-xs text-secondary mt-1">Required threshold: {approvalStatus.required_threshold}%</p>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {approvalStatus.votes.map((vote) => (
                                    <div key={vote.member_id} className="flex items-center justify-between p-2 bg-secondary/5 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {vote.profile_picture ? (
                                                <img src={vote.profile_picture} alt={vote.member_name} className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                                                    <User className="w-3 h-3" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-primary">{vote.member_name}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            vote.voted === 'approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {vote.voted}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => setShowApprovalModal(null)}>Close</Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-theme">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Reject Round</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Reason for rejection (optional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary"
                                        rows="3"
                                        value={rejectNote}
                                        onChange={(e) => setRejectNote(e.target.value)}
                                        placeholder="Explain why you're rejecting this round..."
                                    />
                                </div>
                                {configError && <p className="text-sm text-red-500">{configError}</p>}
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(null)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1 !bg-red-600 hover:!bg-red-700" onClick={() => handleReject(showRejectModal)} disabled={approvalLoading}>
                                        {approvalLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {showClaimModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-theme animate-in fade-in zoom-in duration-200">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-2">Claim Your Payout</h3>
                            <p className="text-sm text-secondary mb-4">Choose where you would like to receive your collected funds.</p>
                            
                            <div className="flex gap-2 mb-4">
                                {[
                                    { id: 'wallet', label: 'Wallet' },
                                    { id: 'send_to_user', label: 'Send to User' },
                                    { id: 'external', label: 'External' }
                                ].map(mode => (
                                    <button
                                        key={mode.id}
                                        onClick={() => { setClaimMode(mode.id); setSelectedUser(null); setClaimDestination('wallet'); }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                            claimMode === mode.id 
                                            ? 'bg-primary text-white' 
                                            : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {claimMode === 'send_to_user' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-primary mb-1">Search Recipient</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                        <input
                                            type="text"
                                            value={userSearchQuery}
                                            onChange={(e) => handleUserSearch(e.target.value)}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-theme bg-elevated focus:ring-1 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    {userSearchLoading && (
                                        <div className="p-2 text-center text-sm text-tertiary">
                                            <Loader className="w-4 h-4 animate-spin mx-auto" /> Searching...
                                        </div>
                                    )}
                                    {userSearchResults.length > 0 && (
                                        <div className="mt-2 border border-theme rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                            {userSearchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => selectUser(user)}
                                                    className="w-full p-3 text-left hover:bg-secondary/10 border-b border-theme last:border-b-0"
                                                >
                                                    <div className="font-medium text-primary text-sm">
                                                        {user.get_full_name ? user.get_full_name() : (user.full_name || user.email || user.username)}
                                                    </div>
                                                    <div className="text-xs text-tertiary">{user.email}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedUser && (
                                        <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                                                Sending to: {selectedUser.get_full_name ? selectedUser.get_full_name() : (selectedUser.full_name || selectedUser.email)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {claimMode === 'external' && (
                                <div className="space-y-3 mb-4">
                                    {[
                                        { id: 'mpesa', name: 'M-Pesa', icon: Landmark, description: 'Direct to phone (USD)' },
                                        { id: 'bank', name: 'Bank Account', icon: Landmark, description: '1-2 business days' },
                                        { id: 'card', name: 'Saved Card', icon: CreditCard, description: 'Instant payout' }
                                    ].map(dest => (
                                        <button
                                            key={dest.id}
                                            onClick={() => setClaimDestination(dest.id)}
                                            className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
                                                claimDestination === dest.id 
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                                : 'border-theme hover:border-secondary bg-elevated'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${claimDestination === dest.id ? 'bg-primary text-white' : 'bg-secondary/10 text-secondary'}`}>
                                                <dest.icon className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-primary text-sm">{dest.name}</div>
                                                <div className="text-xs text-tertiary">{dest.description}</div>
                                            </div>
                                            {claimDestination === dest.id && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {claimMode === 'wallet' && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-4">
                                    <div className="flex items-center gap-3">
                                        <Wallet className="w-8 h-8 text-emerald-500" />
                                        <div>
                                            <div className="font-bold text-primary">Qomrade Wallet</div>
                                            <div className="text-xs text-emtiary">Instant, no fees</div>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => { setShowClaimModal(false); setSelectedUser(null); setUserSearchQuery(''); }}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={handleClaim} disabled={claimLoading}>
                                    {claimLoading ? <Loader className="w-4 h-4 animate-spin" /> : (claimMode === 'send_to_user' ? 'Send Money' : 'Confirm Payout')}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupRoundsTab;
