import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, Upload, Save, Send, Megaphone, X, Plus } from 'lucide-react';
import api from '../services/api';

const CreateResearch = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [authors, setAuthors] = useState(['']);
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        keywords: '',
        research_type: 'paper',
        visibility: 'public',
        doi: '',
        publication_date: '',
        journal: '',
    });

    const addAuthor = () => setAuthors([...authors, '']);
    const updateAuthor = (idx, value) => {
        const updated = [...authors];
        updated[idx] = value;
        setAuthors(updated);
    };
    const removeAuthor = (idx) => setAuthors(authors.filter((_, i) => i !== idx));

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
        e.target.value = '';
    };

    const removeAttachment = (idx) => setAttachments(attachments.filter((_, i) => i !== idx));

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

            submitData.append('authors', authors.filter(a => a.trim()).join(', '));
            submitData.append('status', confirmAction === 'draft' ? 'draft' : 'published');

            attachments.forEach((file, idx) => {
                submitData.append(`attachment_${idx}`, file);
            });

            const response = await api.post('/api/research/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (confirmAction === 'announcement') {
                await api.post('/api/announcements/requests/', {
                    content_type: 'research',
                    content_id: response.data.id,
                    heading: `🔬 Research: ${formData.title}`,
                    content: formData.abstract?.substring(0, 500),
                    request_type: 'research_publication'
                });
                alert('Research created and announcement requested!');
            } else if (confirmAction === 'draft') {
                alert('Research saved as draft!');
            } else {
                alert('Research published successfully!');
            }

            navigate('/research');
        } catch (error) {
            console.error('Failed to create research:', error);
            alert(error.response?.data?.detail || 'Failed to create research');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/research')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Submit Research</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Research Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter research title"
                            required
                        />
                    </div>

                    {/* Authors */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
                        {authors.map((author, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => updateAuthor(idx, e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Author name"
                                />
                                {authors.length > 1 && (
                                    <button onClick={() => removeAuthor(idx)} className="text-red-500">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addAuthor} className="text-primary-600 text-sm flex items-center gap-1">
                            <Plus size={16} /> Add author
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Abstract *</label>
                        <textarea
                            value={formData.abstract}
                            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Write the abstract..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Research Type</label>
                            <select value={formData.research_type} onChange={(e) => setFormData({ ...formData, research_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="paper">Research Paper</option>
                                <option value="thesis">Thesis</option>
                                <option value="dissertation">Dissertation</option>
                                <option value="article">Journal Article</option>
                                <option value="report">Report</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                            <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="machine learning, AI, ..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">DOI (optional)</label>
                            <input type="text" value={formData.doi} onChange={(e) => setFormData({ ...formData, doi: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="10.1000/xyz123" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publication Date</label>
                            <input type="date" value={formData.publication_date} onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Journal/Conference</label>
                            <input type="text" value={formData.journal} onChange={(e) => setFormData({ ...formData, journal: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Journal name" />
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-500 transition-colors">
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <label className="cursor-pointer text-primary-600 hover:underline">
                                Upload files
                                <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {attachments.map((file, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm">
                                        <FileText size={14} />
                                        {file.name}
                                        <button onClick={() => removeAttachment(idx)} className="text-red-500 ml-auto"><X size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/research')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('announcement')} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                            <Megaphone size={18} /> Request Announcement
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.title} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
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
                            {confirmAction === 'publish' && '🔬 Publish Research?'}
                            {confirmAction === 'announcement' && '📢 Request Announcement?'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {confirmAction === 'draft' && 'Your research will be saved as a draft.'}
                            {confirmAction === 'publish' && 'Your research will be published and searchable.'}
                            {confirmAction === 'announcement' && 'Your research will be published and an announcement requested.'}
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

export default CreateResearch;
