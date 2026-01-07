/**
 * Admin Review Panel for Institutions & Organizations
 * Allows admins to review and approve/reject verification requests
 */
import React, { useState, useEffect } from 'react';
import institutionService from '../../services/institutions.service';
import organizationsService from '../../services/organizations.service';
import EntityStatusBadge from '../common/EntityStatusBadge';
import './AdminReviewPanel.css';

const AdminReviewPanel = ({ entityType = 'institution' }) => {
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const service = entityType === 'institution' ? institutionService : organizationsService;
    const isInstitution = entityType === 'institution';

    useEffect(() => {
        loadEntities();
    }, []);

    const loadEntities = async () => {
        setLoading(true);
        try {
            const data = isInstitution
                ? await institutionService.getInstitutions()
                : await organizationsService.getAll();

            // Filter for submitted entities
            const pendingReview = data.filter(e => e.status === 'submitted');
            setEntities(pendingReview);
        } catch (err) {
            console.error('Failed to load entities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedEntity) return;

        setSubmitting(true);
        try {
            // API call to approve - you'll need to create this endpoint
            await service.update(selectedEntity.id, {
                status: 'verified',
                review_notes: reviewNotes,
                reviewed_at: new Date().toISOString()
            });

            alert(`${isInstitution ? 'Institution' : 'Organization'} approved successfully!`);
            setSelectedEntity(null);
            setReviewNotes('');
            loadEntities();
        } catch (err) {
            alert(`Failed to approve: ${err.response?.data?.error || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedEntity) return;
        if (!reviewNotes.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setSubmitting(true);
        try {
            await service.update(selectedEntity.id, {
                status: 'rejected',
                review_notes: reviewNotes,
                reviewed_at: new Date().toISOString()
            });

            alert(`${isInstitution ? 'Institution' : 'Organization'} rejected`);
            setSelectedEntity(null);
            setReviewNotes('');
            loadEntities();
        } catch (err) {
            alert(`Failed to reject: ${err.response?.data?.error || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="admin-panel loading">Loading review queue...</div>;
    }

    return (
        <div className="admin-review-panel">
            <div className="panel-header">
                <h1>
                    {isInstitution ? 'Institution' : 'Organization'} Review Panel
                </h1>
                <span className="pending-count">{entities.length} Pending</span>
            </div>

            <div className="panel-layout">
                {/* Entity List */}
                <div className="entity-list">
                    <h2>Pending Reviews</h2>
                    {entities.length > 0 ? (
                        entities.map(entity => (
                            <div
                                key={entity.id}
                                className={`entity-card ${selectedEntity?.id === entity.id ? 'selected' : ''}`}
                                onClick={() => setSelectedEntity(entity)}
                            >
                                <div className="entity-header">
                                    <h3>{entity.name}</h3>
                                    <EntityStatusBadge status={entity.status} size="small" />
                                </div>
                                <p className="entity-type">{entity.institution_type || entity.organization_type}</p>
                                <p className="entity-email">{entity.email}</p>
                            </div>
                        ))
                    ) : (
                        <p className="no-pending">No pending reviews</p>
                    )}
                </div>

                {/* Review Details */}
                <div className="review-details">
                    {selectedEntity ? (
                        <>
                            <h2>Review: {selectedEntity.name}</h2>

                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Email</label>
                                    <p>{selectedEntity.email}</p>
                                    <span className={selectedEntity.email_verified ? 'verified' : 'not-verified'}>
                                        {selectedEntity.email_verified ? '✓ Verified' : '✗ Not verified'}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <label>Phone</label>
                                    <p>{selectedEntity.phone || 'Not provided'}</p>
                                </div>

                                <div className="detail-item">
                                    <label>Website</label>
                                    <p>{selectedEntity.website || 'Not provided'}</p>
                                </div>

                                <div className="detail-item">
                                    <label>Address</label>
                                    <p>{selectedEntity.address || 'Not provided'}</p>
                                </div>

                                <div className="detail-item full-width">
                                    <label>Description</label>
                                    <p>{selectedEntity.description || 'No description'}</p>
                                </div>

                                <div className="detail-item">
                                    <label>Documents Submitted</label>
                                    <span className={selectedEntity.documents_submitted ? 'verified' : 'not-verified'}>
                                        {selectedEntity.documents_submitted ? '✓ Yes' : '✗ No'}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <label>Documents Verified</label>
                                    <span className={selectedEntity.documents_verified ? 'verified' : 'not-verified'}>
                                        {selectedEntity.documents_verified ? '✓ Yes' : '✗ No'}
                                    </span>
                                </div>
                            </div>

                            <div className="review-section">
                                <label>Review Notes</label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add review notes or reason for rejection..."
                                    rows="4"
                                    className="review-textarea"
                                />
                            </div>

                            <div className="review-actions">
                                <button
                                    className="btn-reject"
                                    onClick={handleReject}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Reject'}
                                </button>
                                <button
                                    className="btn-approve"
                                    onClick={handleApprove}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <p>Select an entity from the list to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReviewPanel;
