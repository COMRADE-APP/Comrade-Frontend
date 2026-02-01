import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import organizationsService from '../../services/organizations.service';
import { FileCheck, Mail, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../../components/common/Button';

const OrganizationVerification = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [organization, setOrganization] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState(null);
    const [documentType, setDocumentType] = useState('registration_cert');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await organizationsService.getById(id);
            setOrganization(data);
            // Fetch logs if endpoint exists, otherwise ignore
            try {
                // Assuming a similar endpoint structure or we can add it later
                const logsData = await organizationsService.getVerificationLogs(id);
                setLogs(logsData);
            } catch (e) {
                console.log('Logs not available');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('document_type', documentType);

        try {
            await organizationsService.uploadDocument(id, formData);
            alert('Document uploaded successfully!');
            setUploadFile(null);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const sendEmailVerification = async () => {
        try {
            await organizationsService.sendEmailVerification(id);
            alert('Verification email sent!');
        } catch (error) {
            alert('Failed to send verification email');
        }
    };

    const submitForReview = async () => {
        try {
            await organizationsService.submitForReview(id);
            alert('Organization submitted for review!');
            fetchData();
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading verification details...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(`/organizations/${id}`)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Verification Portal</h1>
                        <p className="text-gray-600">Manage verification for {organization?.name}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{organization?.name}</h2>
                            <p className="text-gray-500 mt-1 capitalize">{organization?.org_type?.replace('_', ' ')}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full font-medium ${getStatusBadge(organization?.status)}`}>
                            {organization?.status?.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Verification Checklist */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Requirements</h2>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${organization?.email_verified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Email Verification</p>
                                        {organization?.email_verified && <span className="text-sm text-green-600 font-medium">Verified</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{organization?.email}</p>
                                    {!organization?.email_verified && (
                                        <button
                                            onClick={sendEmailVerification}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
                                        >
                                            Send verification email
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${organization?.website_verified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Website Verification</p>
                                        {organization?.website_verified && <span className="text-sm text-green-600 font-medium">Verified</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{organization?.website || 'No website provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${organization?.documents_submitted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <FileCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Documents</p>
                                        {organization?.documents_verified && <span className="text-sm text-green-600 font-medium">Verified</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {organization?.documents_submitted
                                            ? (organization?.documents_verified ? 'All documents verified' : 'Documents under review')
                                            : 'Pending document submission'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {organization?.status === 'pending' && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <Button
                                    onClick={submitForReview}
                                    className="w-full"
                                    disabled={!organization?.email_verified || !organization?.documents_submitted}
                                >
                                    Submit for Review
                                </Button>
                                {(!organization?.email_verified || !organization?.documents_submitted) && (
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        Complete all requirements above to submit
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Document Upload */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Upload Documents</h2>

                        <form onSubmit={handleFileUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document Type
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="registration_cert">Registration Certificate</option>
                                    <option value="tax_id">Tax ID / PIN Certificate</option>
                                    <option value="proof_address">Proof of Address</option>
                                    <option value="director_id">Director ID / Passport</option>
                                    <option value="other">Other Supporting Document</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select File
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                    <input
                                        type="file"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        {uploadFile ? (
                                            <div className="text-primary-600 font-medium break-all">
                                                {uploadFile.name}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="text-gray-600 font-medium">Click to upload</div>
                                                <div className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={!uploadFile || uploading}
                            >
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </span>
                                ) : 'Upload Document'}
                            </Button>
                        </form>

                        {/* Recent Uploads List could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationVerification;
