import React, { useState, useEffect } from 'react';
import institutionService from '../../services/institutions.service';
import organizationsService from '../../services/organizations.service';
import './VerificationDashboard.css';

const VerificationDashboard = ({ entityId, entityType = 'institution' }) => {
    const [entity, setEntity] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isInstitution = entityType === 'institution';
    const service = isInstitution ? institutionService : organizationsService;

    useEffect(() => {
        loadData();
    }, [entityId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const entityData = isInstitution
                ? await institutionService.getInstitution(entityId)
                : await organizationsService.getById(entityId);

            setEntity(entityData);

            // Load verification logs
            const logsData = await service.getVerificationLogs(entityId);
            setLogs(logsData);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, documentType) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('document', file);
        formData.append('document_type', documentType);

        try {
            await service.uploadDocument(entityId, formData);
            alert('Document uploaded successfully!');
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!entity.email_verified) {
            setError('Please verify your email before submitting for review');
            return;
        }

        if (!entity.documents_submitted) {
            setError('Please upload all required documents before submitting');
            return;
        }

        try {
            await service.submitForReview(entityId);
            alert('Submitted for review successfully!');
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit for review');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-pending', text: 'Pending' },
            email_verified: { class: 'badge-info', text: 'Email Verified' },
            submitted: { class: 'badge-warning', text: 'Under Review' },
            verified: { class: 'badge-success', text: 'Verified' },
            rejected: { class: 'badge-danger', text: 'Rejected' },
        };
        const badge = badges[status] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    if (loading) {
        return <div className="verification-dashboard loading">Loading...</div>;
    }

    if (!entity) {
        return <div className="verification-dashboard error">Entity not found</div>;
    }

    return (
        <div className="verification-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>{entity.name}</h1>
                    <p className="entity-type">{entity.institution_type || entity.organization_type}</p>
                </div>
                {getStatusBadge(entity.status)}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="dashboard-grid">
                {/* Verification Progress */}
                <div className="dashboard-card">
                    <h2>Verification Progress</h2>

                    <div className="checklist">
                        <div className={`checklist-item ${entity.email_verified ? 'complete' : ''}`}>
                            <div className="check-icon">{entity.email_verified ? '✓' : '○'}</div>
                            <div className="check-content">
                                <h4>Email Verification</h4>
                                <p>Verify your email address</p>
                            </div>
                        </div>

                        <div className={`checklist-item ${entity.documents_submitted ? 'complete' : ''}`}>
                            <div className="check-icon">{entity.documents_submitted ? '✓' : '○'}</div>
                            <div className="check-content">
                                <h4>Document Submission</h4>
                                <p>Upload required documents</p>
                            </div>
                        </div>

                        <div className={`checklist-item ${entity.documents_verified ? 'complete' : ''}`}>
                            <div className="check-icon">{entity.documents_verified ? '✓' : '○'}</div>
                            <div className="check-content">
                                <h4>Document Verification</h4>
                                <p>Documents reviewed and verified</p>
                            </div>
                        </div>

                        <div className={`checklist-item ${entity.status === 'verified' ? 'complete' : ''}`}>
                            <div className="check-icon">{entity.status === 'verified' ? '✓' : '○'}</div>
                            <div className="check-content">
                                <h4>Final Approval</h4>
                                <p>Entity verified and activated</p>
                            </div>
                        </div>
                    </div>

                    {entity.status !== 'submitted' && entity.status !== 'verified' && (
                        <button
                            className="btn-submit"
                            onClick={handleSubmitForReview}
                            disabled={!entity.email_verified || !entity.documents_submitted}
                        >
                            Submit for Review
                        </button>
                    )}
                </div>

                {/* Document Upload */}
                <div className="dashboard-card">
                    <h2>Required Documents</h2>

                    <div className="document-upload-section">
                        <div className="document-item">
                            <h4>Registration Certificate</h4>
                            <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, 'registration_certificate')}
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={uploading}
                                className="file-input"
                            />
                        </div>

                        <div className="document-item">
                            <h4>Tax Identification</h4>
                            <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, 'tax_id')}
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={uploading}
                                className="file-input"
                            />
                        </div>

                        <div className="document-item">
                            <h4>Proof of Address</h4>
                            <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, 'proof_of_address')}
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={uploading}
                                className="file-input"
                            />
                        </div>

                        <div className="document-item">
                            <h4>Authorization Letter</h4>
                            <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, 'authorization_letter')}
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={uploading}
                                className="file-input"
                            />
                        </div>
                    </div>

                    {uploading && <div className="upload-progress">Uploading...</div>}
                </div>

                {/* Contact Information */}
                <div className="dashboard-card">
                    <h2>Contact Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Email</label>
                            <p>{entity.email}</p>
                        </div>
                        <div className="info-item">
                            <label>Phone</label>
                            <p>{entity.phone || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                            <label>Website</label>
                            <p>{entity.website || 'Not provided'}</p>
                        </div>
                        <div className="info-item">
                            <label>Address</label>
                            <p>{entity.address || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Verification Logs */}
                <div className="dashboard-card">
                    <h2>Verification History</h2>
                    <div className="logs-list">
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <div key={index} className="log-item">
                                    <div className="log-icon">{log.action === 'approved' ? '✓' : '○'}</div>
                                    <div className="log-content">
                                        <h4>{log.action}</h4>
                                        <p>{log.notes || 'No notes'}</p>
                                        <span className="log-date">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-logs">No verification logs yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationDashboard;
