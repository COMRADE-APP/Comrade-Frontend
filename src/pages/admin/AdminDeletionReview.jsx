import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Search, Check, X, Clock, AlertTriangle,
    User, Calendar, FileText, Loader2, ChevronDown
} from 'lucide-react';
import profileService from '../../services/profile.service';

const AdminDeletionReview = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await profileService.getDeletionRequests(filter);
            setRequests(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error loading deletion requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        setProcessing(true);
        try {
            await profileService.approveDeletion(requestId, notes);
            loadRequests();
            setSelectedRequest(null);
            setNotes('');
        } catch (error) {
            console.error('Error approving deletion:', error);
            alert('Failed to approve deletion');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (requestId) => {
        setProcessing(true);
        try {
            await profileService.rejectDeletion(requestId, notes);
            loadRequests();
            setSelectedRequest(null);
            setNotes('');
        } catch (error) {
            console.error('Error rejecting deletion:', error);
            alert('Failed to reject deletion');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Deletion Requests</h1>
                    <p className="text-gray-600">Review and manage account deletion requests</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <Card>
                <CardBody className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No {filter} deletion requests</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{request.email}</h3>
                                                <p className="text-sm text-gray-500">{request.user_type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(request.status)}
                                            {request.days_until_deletion !== null && (
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {request.days_until_deletion} days left
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                        <strong>Reason:</strong> {request.reason}
                                    </div>
                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Requested: {formatDate(request.requested_at)}
                                        </span>
                                        {request.scheduled_deletion_date && (
                                            <span className="flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Scheduled: {formatDate(request.scheduled_deletion_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold">Review Deletion Request</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{selectedRequest.email}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{selectedRequest.user_type}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Reason for Deletion</h4>
                                <p className="text-gray-600">{selectedRequest.reason}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Requested:</span>
                                    <span className="ml-2 text-gray-900">{formatDate(selectedRequest.requested_at)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Scheduled:</span>
                                    <span className="ml-2 text-gray-900">{formatDate(selectedRequest.scheduled_deletion_date)}</span>
                                </div>
                            </div>

                            {selectedRequest.status === 'pending' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows="3"
                                        placeholder="Add any notes about this decision..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setSelectedRequest(null); setNotes(''); }}>
                                Close
                            </Button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleReject(selectedRequest.id)}
                                        disabled={processing}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                                        Reject
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleApprove(selectedRequest.id)}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                                        Approve
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDeletionReview;
