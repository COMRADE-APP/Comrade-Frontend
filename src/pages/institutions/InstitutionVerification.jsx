import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const InstitutionVerification = () => {
    const { institutionId } = useParams();
    const [institution, setInstitution] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState(null);
    const [documentType, setDocumentType] = useState('registration_cert');

    useEffect(() => {
        fetchInstitutionData();
    }, [institutionId]);

    const fetchInstitutionData = async () => {
        try {
            setLoading(true);
            const [instResponse, logsResponse] = await Promise.all([
                api.get(`/api/institutions/${institutionId}/`),
                api.get(`/api/institutions/${institutionId}/verification_logs/`)
            ]);
            setInstitution(instResponse.data);
            setLogs(logsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('document_type', documentType);

        try {
            await api.post(`/api/institutions/${institutionId}/documents/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Document uploaded successfully!');
            setUploadFile(null);
            fetchInstitutionData();
        } catch (error) {
            alert('Failed to upload document');
        }
    };

    const sendEmailVerification = async () => {
        try {
            await api.post(`/api/institutions/${institutionId}/send_email_verification/`);
            alert('Verification email sent!');
        } catch (error) {
            alert('Failed to send verification email');
        }
    };

    const submitForReview = async () => {
        try {
            await api.post(`/api/institutions/${institutionId}/submit_for_review/`);
            alert('Institution submitted for review!');
            fetchInstitutionData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-gray-100 text-gray-800',
            submitted: 'bg-blue-100 text-blue-800',
            under_review: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{institution?.name}</h1>
                            <p className="text-gray-600 mt-1">{institution?.institution_type}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full font-medium ${getStatusBadge(institution?.status)}`}>
                            {institution?.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Verification Checklist */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Verification Checklist</h2>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                    {institution?.email_verified ? '✅' : '⏸️'}
                                </span>
                                <div>
                                    <p className="font-medium">Email Verification</p>
                                    <p className="text-sm text-gray-600">{institution?.email}</p>
                                    {!institution?.email_verified && (
                                        <button
                                            onClick={sendEmailVerification}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Send verification email
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                    {institution?.website_verified ? '✅' : '⏸️'}
                                </span>
                                <div>
                                    <p className="font-medium">Website Verification</p>
                                    <p className="text-sm text-gray-600">{institution?.website || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                    {institution?.documents_submitted ? '✅' : '⏸️'}
                                </span>
                                <div>
                                    <p className="font-medium">Documents Submitted</p>
                                    <p className="text-sm text-gray-600">
                                        {institution?.documents_verified ? 'Verified' : 'Pending review'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {institution?.status === 'pending' && institution?.email_verified && institution?.documents_submitted && (
                            <button
                                onClick={submitForReview}
                                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Submit for Review
                            </button>
                        )}
                    </div>

                    {/* Document Upload */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>

                        <form onSubmit={handleFileUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document Type
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="registration_cert">Registration Certificate</option>
                                    <option value="tax_id">Tax ID Document</option>
                                    <option value="proof_address">Proof of Address</option>
                                    <option value="director_id">Director ID</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select File (PDF, JPG, PNG - Max 10MB)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!uploadFile}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                            >
                                Upload Document
                            </button>
                        </form>
                    </div>
                </div>

                {/* Verification Logs */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Verification History</h2>

                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium">{log.action}</p>
                                    <p className="text-sm text-gray-600">{log.notes}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionVerification;
