import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, CheckCircle, XCircle, Clock, AlertTriangle, X, Eye, Trash2, File } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import providerService from '../../../services/provider.service';

const DOC_TYPES = [
    { value: 'business_license', label: 'Business License' },
    { value: 'tax_certificate', label: 'Tax Certificate' },
    { value: 'identity_proof', label: 'Identity Proof' },
    { value: 'kyc_document', label: 'KYC Document' },
    { value: 'insurance_certificate', label: 'Insurance Certificate' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'registration_certificate', label: 'Registration Certificate' },
    { value: 'compliance_report', label: 'Compliance Report' },
    { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Pending Review' },
    approved: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', label: 'Approved' },
    rejected: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Rejected' },
    expired: { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', label: 'Expired' },
};

const DocumentsTab = ({ provider, onRefresh }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        document_type: 'business_license',
        title: '',
        description: '',
        file: null,
        expiry_date: '',
    });

    useEffect(() => {
        loadDocuments();
    }, [provider.id]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const res = await providerService.getProviderDocuments(provider.id);
            setDocuments(res.results || res || []);
        } catch (e) {
            console.error('Failed to load documents:', e);
            if (provider.documents) {
                setDocuments(provider.documents);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return;

        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('provider', provider.id);
            formData.append('document_type', uploadForm.document_type);
            formData.append('title', uploadForm.title || uploadForm.file.name);
            formData.append('description', uploadForm.description);
            formData.append('file', uploadForm.file);
            if (uploadForm.expiry_date) formData.append('expiry_date', uploadForm.expiry_date);

            await providerService.uploadDocument(formData);
            setShowUploadModal(false);
            setUploadForm({ document_type: 'business_license', title: '', description: '', file: null, expiry_date: '' });
            loadDocuments();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await providerService.deleteDocument(docId);
            loadDocuments();
        } catch (e) {
            console.error('Failed to delete document:', e);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    // Group documents by type
    const groupedDocs = documents.reduce((acc, doc) => {
        const type = doc.document_type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(doc);
        return acc;
    }, {});

    // Define required documents based on provider_type
    const REQUIRED_DOCS = {
        bill_provider: ['business_license', 'tax_certificate', 'identity_proof'],
        insurance_provider: ['business_license', 'tax_certificate', 'insurance_certificate', 'compliance_report'],
        loan_provider: ['business_license', 'tax_certificate', 'kyc_document', 'bank_statement', 'compliance_report'],
        utility_provider: ['business_license', 'tax_certificate', 'registration_certificate'],
        financial_service: ['business_license', 'tax_certificate', 'identity_proof', 'kyc_document', 'bank_statement'],
    };

    const requiredTypes = REQUIRED_DOCS[provider.provider_type] || ['business_license', 'tax_certificate'];
    
    // Check which required docs are uploaded (and not rejected/expired)
    const uploadedValidTypes = documents
        .filter(d => d.status !== 'rejected' && d.status !== 'expired')
        .map(d => d.document_type);
        
    const missingDocs = requiredTypes.filter(type => !uploadedValidTypes.includes(type));
    const isFullyCompliant = missingDocs.length === 0;

    const stats = {
        total: documents.length,
        approved: documents.filter(d => d.status === 'approved').length,
        pending: documents.filter(d => d.status === 'pending').length,
        rejected: documents.filter(d => d.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Dynamic Compliance Checklist */}
            <Card className={`border-2 ${isFullyCompliant ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <CardBody className="p-5">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${isFullyCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isFullyCompliant ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-bold ${isFullyCompliant ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {isFullyCompliant ? 'Compliance Requirements Met' : 'Missing Required Documents'}
                            </h3>
                            <p className={`text-sm mt-1 mb-4 ${isFullyCompliant ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {isFullyCompliant 
                                    ? "You have uploaded all legally required documents for your provider type. Your profile is ready for final review."
                                    : `As a ${provider.provider_type?.replace('_', ' ')}, you must provide the following documents to operate on the platform.`}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {requiredTypes.map(type => {
                                    const isUploaded = uploadedValidTypes.includes(type);
                                    const docTypeLabel = DOC_TYPES.find(t => t.value === type)?.label || type;
                                    return (
                                        <div key={type} className={`flex items-center gap-3 p-3 rounded-lg border ${isUploaded ? 'bg-background/50 border-emerald-200' : 'bg-background border-amber-200'}`}>
                                            {isUploaded ? <CheckCircle size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-amber-500 shrink-0" />}
                                            <span className={`text-sm font-semibold ${isUploaded ? 'text-secondary line-through' : 'text-primary'}`}>
                                                {docTypeLabel}
                                            </span>
                                            {!isUploaded && (
                                                <Button variant="ghost" size="sm" className="ml-auto text-amber-700 hover:bg-amber-100 px-2" onClick={() => {
                                                    setUploadForm(prev => ({...prev, document_type: type}));
                                                    setShowUploadModal(true);
                                                }}>
                                                    Upload
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-4 text-sm">
                    <span className="text-secondary">{stats.total} documents</span>
                    {stats.approved > 0 && <span className="text-emerald-600 font-semibold">{stats.approved} approved</span>}
                    {stats.pending > 0 && <span className="text-amber-600 font-semibold">{stats.pending} pending</span>}
                    {stats.rejected > 0 && <span className="text-red-600 font-semibold">{stats.rejected} rejected</span>}
                </div>
                <Button variant="primary" onClick={() => { setError(null); setShowUploadModal(true); }}>
                    <Upload size={16} className="mr-1.5" /> Upload Document
                </Button>
            </div>

            {/* Documents */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-theme">
                            <CardBody className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 skeleton-shimmer" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-48 h-4 rounded bg-secondary/10 skeleton-shimmer" />
                                    <div className="w-32 h-3 rounded bg-secondary/10 skeleton-shimmer" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <Card className="border-theme">
                    <CardBody className="p-12 text-center">
                        <FileText size={48} className="text-primary/15 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">No Documents</h3>
                        <p className="text-secondary text-sm mb-6">Upload your business documents for verification and compliance.</p>
                        <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                            <Upload size={16} className="mr-1.5" /> Upload First Document
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                Object.entries(groupedDocs).map(([type, docs]) => (
                    <div key={type} className="space-y-3">
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                            {DOC_TYPES.find(t => t.value === type)?.label || type} ({docs.length})
                        </h4>
                        <div className="space-y-2">
                            {docs.map(doc => {
                                const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <Card key={doc.id} className="border-theme hover:shadow-md transition-shadow duration-200">
                                        <CardBody className="p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                                                <File size={22} className="text-primary/40" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-primary truncate">{doc.title || doc.document_type_display || 'Untitled'}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-secondary flex-wrap">
                                                    {doc.mime_type && <span>{doc.mime_type}</span>}
                                                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                                                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                    {doc.expiry_date && (
                                                        <span className={new Date(doc.expiry_date) < new Date() ? 'text-red-600 font-semibold' : ''}>
                                                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {doc.description && <p className="text-xs text-secondary mt-1 truncate">{doc.description}</p>}
                                            </div>
                                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${statusCfg.color}`}>
                                                <StatusIcon size={12} /> {statusCfg.label}
                                            </span>
                                            <div className="flex gap-1 shrink-0">
                                                {doc.file_url && (
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors">
                                                        <Eye size={16} />
                                                    </a>
                                                )}
                                                <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg hover:bg-red-50 text-secondary hover:text-red-600 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary">Upload Document</h3>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpload} className="p-5 space-y-5">
                            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Document Type *</label>
                                <select value={uploadForm.document_type} onChange={e => setUploadForm({...uploadForm, document_type: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Title</label>
                                <input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. Business License 2026" className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">File *</label>
                                <div className="border-2 border-dashed border-theme rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById('doc-file-input').click()}>
                                    <Upload size={24} className="text-secondary mx-auto mb-2" />
                                    <p className="text-sm text-secondary">
                                        {uploadForm.file ? uploadForm.file.name : 'Click to select a file'}
                                    </p>
                                    <p className="text-xs text-secondary mt-1">PDF, JPG, PNG up to 10MB</p>
                                </div>
                                <input id="doc-file-input" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Expiry Date (optional)</label>
                                <input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm({...uploadForm, expiry_date: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                <textarea rows={2} value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-theme">
                                <Button variant="outline" type="button" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={uploading || !uploadForm.file}>
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
