import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, Link as LinkIcon, Save, Send, Megaphone, X } from 'lucide-react';
import api from '../services/api';

const CreateResource = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [resourceFile, setResourceFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        resource_type: 'document',
        visibility: 'public',
        external_link: '',
        category: '',
    });

    const handleSubmit = async (action) => {
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            if (resourceFile) {
                submitData.append('file', resourceFile);
            }

            // Add room ID if creating from within a room
            if (roomId) {
                submitData.append('room', roomId);
            }

            submitData.append('status', confirmAction === 'draft' ? 'draft' : 'published');

            const response = await api.post('/api/resources/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (confirmAction === 'announcement') {
                await api.post('/api/announcements/requests/', {
                    content_type: 'resource',
                    content_id: response.data.id,
                    heading: `📚 New Resource: ${formData.name}`,
                    content: formData.description?.substring(0, 500),
                    request_type: 'resource_share'
                });
                alert('Resource created and announcement requested!');
            } else if (confirmAction === 'draft') {
                alert('Resource saved as draft!');
            } else {
                alert('Resource published successfully!');
            }

            navigate('/resources');
        } catch (error) {
            console.error('Failed to create resource:', error);
            alert(error.response?.data?.detail || 'Failed to create resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/resources')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Upload Resource</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resource File</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition-colors">
                            {resourceFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-primary-600" />
                                    <span>{resourceFile.name}</span>
                                    <button onClick={() => setResourceFile(null)} className="p-1 text-red-500 hover:text-red-700">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <label className="cursor-pointer text-primary-600 hover:underline">
                                        Upload file (PDF, DOC, PPT, etc.)
                                        <input type="file" className="hidden" onChange={(e) => setResourceFile(e.target.files?.[0])} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resource Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter resource name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Describe the resource..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                            <select value={formData.resource_type} onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="document">Document</option>
                                <option value="video">Video</option>
                                <option value="presentation">Presentation</option>
                                <option value="spreadsheet">Spreadsheet</option>
                                <option value="link">External Link</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Study Materials" />
                        </div>
                    </div>

                    {formData.resource_type === 'link' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <LinkIcon size={16} className="inline mr-1" /> External Link
                            </label>
                            <input type="url" value={formData.external_link} onChange={(e) => setFormData({ ...formData, external_link: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                        <select value={formData.visibility} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="public">Public</option>
                            <option value="institution">Institution Only</option>
                            <option value="organization">Organization Only</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/resources')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('announcement')} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                            <Megaphone size={18} /> Request Announcement
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.name} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                            <Send size={18} /> Publish
                        </button>
                    </div>
                </div>
            </div>

            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {confirmAction === 'draft' && '💾 Save as Draft?'}
                            {confirmAction === 'publish' && '📚 Publish Resource?'}
                            {confirmAction === 'announcement' && '📢 Request Announcement?'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {confirmAction === 'draft' && 'Your resource will be saved as a draft.'}
                            {confirmAction === 'publish' && 'Your resource will be available based on visibility settings.'}
                            {confirmAction === 'announcement' && 'Your resource will be published and an announcement request sent.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                            <button onClick={confirmSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateResource;
