import React, { useState, useEffect } from 'react';
import { Clock, Check, X, AlertCircle, Loader2, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import Button from '../../components/common/Button';
import unitsService from '../../services/units.service';

/**
 * Component for reviewing and approving/rejecting pending unit requests
 * Should be rendered on the Institution detail page for admins
 */
const PendingUnitsReview = ({ institutionId, isAdmin }) => {
    const [pendingUnits, setPendingUnits] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [rejectModal, setRejectModal] = useState({ isOpen: false, unitId: null, unitType: null });
    const [rejectReason, setRejectReason] = useState('');

    const unitTypes = unitsService.getInstitutionUnitTypes();

    useEffect(() => {
        if (isAdmin && institutionId) {
            loadPendingUnits();
        }
    }, [institutionId, isAdmin]);

    const loadPendingUnits = async () => {
        setLoading(true);
        setError('');

        try {
            const allPending = {};

            // Load pending units for each type
            for (const type of unitTypes) {
                try {
                    const pending = await unitsService.getPendingInstitutionUnits(institutionId, type.key);
                    if (pending && pending.length > 0) {
                        allPending[type.key] = pending;
                    }
                } catch (err) {
                    // Skip if no pending or error for this type
                    console.log(`No pending ${type.key} units or error fetching`);
                }
            }

            setPendingUnits(allPending);
        } catch (err) {
            console.error('Error loading pending units:', err);
            setError('Failed to load pending units');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (unitId, unitType) => {
        setActionLoading(prev => ({ ...prev, [unitId]: 'approve' }));

        try {
            await unitsService.approveInstitutionUnit(unitId, unitType);

            // Remove from pending list
            setPendingUnits(prev => ({
                ...prev,
                [unitType]: prev[unitType]?.filter(u => u.id !== unitId) || []
            }));
        } catch (err) {
            console.error('Error approving unit:', err);
            alert('Failed to approve unit. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [unitId]: null }));
        }
    };

    const handleReject = async () => {
        const { unitId, unitType } = rejectModal;
        if (!unitId || !unitType) return;

        setActionLoading(prev => ({ ...prev, [unitId]: 'reject' }));

        try {
            await unitsService.rejectInstitutionUnit(unitId, unitType, rejectReason);

            // Remove from pending list
            setPendingUnits(prev => ({
                ...prev,
                [unitType]: prev[unitType]?.filter(u => u.id !== unitId) || []
            }));

            setRejectModal({ isOpen: false, unitId: null, unitType: null });
            setRejectReason('');
        } catch (err) {
            console.error('Error rejecting unit:', err);
            alert('Failed to reject unit. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [unitId]: null }));
        }
    };

    const openRejectModal = (unitId, unitType) => {
        setRejectModal({ isOpen: true, unitId, unitType });
        setRejectReason('');
    };

    // Don't render if not admin
    if (!isAdmin) return null;

    // Calculate total pending count
    const totalPending = Object.values(pendingUnits).reduce((sum, units) => sum + (units?.length || 0), 0);

    if (loading) {
        return (
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading pending units...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (totalPending === 0) {
        return null; // Don't show anything if no pending units
    }

    return (
        <>
            {/* Main Panel */}
            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl border border-amber-500/30 overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-amber-500/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-semibold text-white">Pending Unit Requests</h3>
                            <p className="text-sm text-gray-400">{totalPending} unit(s) awaiting your review</p>
                        </div>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {/* Content */}
                {expanded && (
                    <div className="p-4 pt-0 space-y-4">
                        {Object.entries(pendingUnits).map(([type, units]) => {
                            if (!units || units.length === 0) return null;
                            const typeInfo = unitTypes.find(t => t.key === type);

                            return (
                                <div key={type} className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                                        {typeInfo?.label || type}s
                                    </h4>

                                    {units.map(unit => (
                                        <div
                                            key={unit.id}
                                            className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-white font-medium">{unit.name}</h5>
                                                    <p className="text-sm text-gray-400">
                                                        Code: {unit.branch_code || unit.faculty_code || unit.dep_code || unit.programme_code || unit.admin_code || unit.office_code || 'N/A'}
                                                    </p>
                                                    {unit.description && (
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                            {unit.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                                                <span className="text-xs text-gray-500">
                                                    Requested by: {unit.created_by_email || 'Unknown'}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openRejectModal(unit.id, type)}
                                                        disabled={actionLoading[unit.id]}
                                                        className="text-red-400 hover:bg-red-500/10"
                                                    >
                                                        {actionLoading[unit.id] === 'reject' ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                        <span className="ml-1">Reject</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(unit.id, type)}
                                                        disabled={actionLoading[unit.id]}
                                                        className="bg-green-600 hover:bg-green-500"
                                                    >
                                                        {actionLoading[unit.id] === 'approve' ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                        <span className="ml-1">Approve</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reject Reason Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700/50">
                        <div className="p-6 border-b border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white">Reject Unit Request</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Please provide a reason for rejection (optional)
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                placeholder="Reason for rejection..."
                                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 
                                         text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 
                                         focus:border-transparent transition-all duration-200 resize-none"
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setRejectModal({ isOpen: false, unitId: null, unitType: null })}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    className="flex-1 bg-red-600 hover:bg-red-500"
                                >
                                    Reject Unit
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PendingUnitsReview;
