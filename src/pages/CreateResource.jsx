import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, FileText, Upload, Link as LinkIcon, Save, Send, Megaphone, X, Search,
    CheckCircle, ChevronRight, ChevronLeft, AlertCircle, File, Globe, Users
} from 'lucide-react';
import api from '../services/api';
import VisibilitySelector from '../components/resources/VisibilitySelector';
import opinionsService from '../services/opinions.service';
import articlesService from '../services/articles.service';
// import researchService from '../services/research.service'; 
import authService from '../services/auth.service';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Resource Details' },
    { number: 2, title: 'Content & Links' },
    { number: 3, title: 'Visibility' },
    { number: 4, title: 'Review & Publish' }
];

const CreateResource = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [resourceFile, setResourceFile] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        resource_type: 'document',
        external_link: '',
        category: '',
        visibility: 'public', // 'public', 'private', 'institutions', 'organisations'
    });

    // Advanced Visibility State
    const [visibilitySettings, setVisibilitySettings] = useState(null);

    // Linking State
    const [linkType, setLinkType] = useState('none'); // 'opinion', 'article', 'research'
    const [linkedContentId, setLinkedContentId] = useState('');
    const [availableContent, setAvailableContent] = useState([]);
    const [loadingContent, setLoadingContent] = useState(false);

    useEffect(() => {
        authService.getCurrentUser().then(setUser);
    }, []);

    // Fetch content when link type changes
    useEffect(() => {
        if (linkType === 'none') {
            setAvailableContent([]);
            setLinkedContentId('');
            return;
        }

        const fetchContent = async () => {
            setLoadingContent(true);
            try {
                let data = [];
                if (linkType === 'opinion') {
                    if (user?.id) {
                        data = await opinionsService.getUserOpinions(user.id);
                        data = data.results || data;
                        data = data.map(item => ({ id: item.id, title: item.content.substring(0, 50) + '...' }));
                    }
                } else if (linkType === 'article') {
                    data = await articlesService.getMyArticles();
                    data = data.results || data;
                    data = data.map(item => ({ id: item.id, title: item.title }));
                } else if (linkType === 'research') {
                    const response = await api.get('/api/research/projects/', { params: { mine: true } });
                    data = response.data.results || response.data;
                    data = data.map(item => ({ id: item.id, title: item.title }));
                }
                setAvailableContent(data);
            } catch (error) {
                console.error("Failed to load content", error);
                setAvailableContent([]);
            } finally {
                setLoadingContent(false);
            }
        };

        if (user) {
            fetchContent();
        }
    }, [linkType, user]);

    const handleVisibilityChange = (value) => {
        if (typeof value === 'string') {
            setFormData(prev => ({ ...prev, visibility: value }));
            setVisibilitySettings(null);
        } else {
            setFormData(prev => ({ ...prev, visibility: 'institutions' }));
            setVisibilitySettings(value.settings);
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.name) {
                setError("Resource Name is required.");
                return;
            }
            if (formData.resource_type !== 'link' && !resourceFile && !formData.external_link) {
                // If not a link type, user should upload file. Wait, let's logic check.
                // If type is link, external_link required.
                // If type is doc/video etc, file is expected but maybe optional if just metadata?
                // Usually resource needs content.
                if (!resourceFile && formData.resource_type !== 'link') {
                    setError("Please upload a file.");
                    return;
                }
            }
            if (formData.resource_type === 'link' && !formData.external_link) {
                setError("External Link is required.");
                return;
            }
        }
        setError(null);
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async (action) => {
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);
        setError(null);

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

            if (roomId) {
                submitData.append('room', roomId);
            }

            // Status
            submitData.append('status', confirmAction === 'draft' ? 'draft' : (confirmAction === 'announcement' ? 'announcement_requested' : 'published'));

            // Visibility Settings (JSON stringify for complex object)
            if (visibilitySettings) {
                submitData.append('visibility_settings', JSON.stringify(visibilitySettings));
            }

            // Linked Content
            if (linkType !== 'none' && linkedContentId) {
                submitData.append('linked_' + linkType, linkedContentId);
            }

            const response = await api.post('/api/resources/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (confirmAction === 'announcement') {
                try {
                    await api.post('/api/announcements/requests/', {
                        content_type: 'resource',
                        content_id: response.data.id,
                        heading: '📚 New Resource: ' + formData.name,
                        content: formData.description ? formData.description.substring(0, 500) : '',
                        request_type: 'resource_share'
                    });
                    alert('Resource created and announcement requested!');
                } catch (e) {
                    console.error('Announcement request failed', e);
                    alert('Resource created but announcement request failed.');
                }
            } else if (confirmAction === 'draft') {
                alert('Resource saved as draft!');
            } else {
                alert('Resource published successfully!');
            }

            navigate('/resources');
        } catch (error) {
            console.error('Failed to create resource:', error);
            setError(error.response?.data?.detail || 'Failed to create resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button onClick={() => navigate('/resources')} className="flex items-center text-secondary hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Resources
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <FileText className="text-primary" />
                        Upload Resource
                    </h1>
                    <p className="text-secondary mt-2">Share documents, links, and media with your network.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            {/* Active Progress Line */}
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-primary -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}% ` }}
                            ></div>

                            {STEPS.map((step, index) => (
                                <div key={step.number} className="flex flex-col items-center relative z-10 px-2 group cursor-pointer" onClick={() => step.number < currentStep && setCurrentStep(step.number)}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-elevated text-secondary border-theme group-hover:border-primary/50'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-primary' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[400px]">
                            {/* STEP 1: Resource Basics */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Basic Information</h3>

                                    {/* File Upload / Link Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-primary mb-2">Resource Content</label>

                                        <div className="flex gap-4 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, resource_type: 'document' })}
                                                className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.resource_type !== 'link'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-theme hover:border-primary/50 text-secondary'
                                                    }`}
                                            >
                                                <Upload size={20} /> Upload File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, resource_type: 'link' });
                                                    setResourceFile(null);
                                                }}
                                                className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.resource_type === 'link'
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-theme hover:border-primary/50 text-secondary'
                                                    }`}
                                            >
                                                <LinkIcon size={20} /> External Link
                                            </button>
                                        </div>

                                        {formData.resource_type === 'link' ? (
                                            <div className="animate-fade-in">
                                                <input
                                                    type="url"
                                                    value={formData.external_link}
                                                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                                                    className="w-full px-4 py-3 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                    placeholder="https://example.com/resource"
                                                />
                                            </div>
                                        ) : (
                                            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors animate-fade-in ${resourceFile ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/50'
                                                }`}>
                                                {resourceFile ? (
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <FileText className="w-12 h-12 text-primary" />
                                                        <span className="font-medium text-primary">{resourceFile.name}</span>
                                                        <span className="text-xs text-secondary">{(resourceFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                                        <button onClick={() => setResourceFile(null)} className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                                            <X size={14} /> Remove File
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                                        <label className="cursor-pointer">
                                                            <span className="text-primary hover:underline font-medium text-lg">Click to upload</span>
                                                            <span className="text-gray-500"> or drag and drop</span>
                                                            <input type="file" className="hidden" onChange={(e) => setResourceFile(e.target.files?.[0])} />
                                                        </label>
                                                        <p className="text-xs text-gray-400 mt-2">PDF, DOCX, PPTX, MP4, JPEG (Max 50MB)</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Resource Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                placeholder="e.g. Lecture Notes Week 5"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Category</label>
                                            <input
                                                type="text"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                                placeholder="e.g. Study Materials"
                                            />
                                        </div>
                                    </div>

                                    {formData.resource_type !== 'link' && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">File Type</label>
                                            <select
                                                value={formData.resource_type}
                                                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                                                className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                            >
                                                <option value="document">Document</option>
                                                <option value="video">Video</option>
                                                <option value="presentation">Presentation</option>
                                                <option value="spreadsheet">Spreadsheet</option>
                                                <option value="image">Image</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Content & Links */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Content & Context</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y text-primary"
                                            placeholder="Provide a detailed description of this resource..."
                                        />
                                    </div>

                                    <div className="p-5 bg-secondary/5 border border-theme rounded-xl">
                                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                            <LinkIcon size={18} /> Link to Existing Content (Optional)
                                        </h4>
                                        <p className="text-sm text-secondary mb-4">Associate this resource with your existing opinions, articles, or research.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <select
                                                    value={linkType}
                                                    onChange={(e) => setLinkType(e.target.value)}
                                                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                >
                                                    <option value="none">No Link</option>
                                                    <option value="opinion">My Opinion</option>
                                                    <option value="article">My Article</option>
                                                    <option value="research">My Research</option>
                                                </select>
                                            </div>
                                            {linkType !== 'none' && (
                                                <div className="md:col-span-2">
                                                    {loadingContent ? (
                                                        <div className="flex items-center gap-2 text-sm text-secondary h-10">
                                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                            Loading items...
                                                        </div>
                                                    ) : availableContent.length > 0 ? (
                                                        <select
                                                            value={linkedContentId}
                                                            onChange={(e) => setLinkedContentId(e.target.value)}
                                                            className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                        >
                                                            <option value="">Select content...</option>
                                                            {availableContent.map(item => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="text-sm text-red-500 py-2">No items found for this category.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Visibility */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Visibility Settings</h3>
                                    <p className="text-secondary mb-6">Choose who can see this resource.</p>

                                    <VisibilitySelector onChange={handleVisibilityChange} initialValue={formData.visibility} />
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>

                                    <div className="bg-secondary/5 border border-theme rounded-xl p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-2xl font-bold text-primary">{formData.name}</h4>
                                                <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase tracking-wider">
                                                    {formData.resource_type}
                                                </span>
                                            </div>
                                        </div>

                                        {formData.category && (
                                            <div className="text-sm text-secondary">
                                                <span className="font-semibold">Category:</span> {formData.category}
                                            </div>
                                        )}

                                        <div className="text-sm text-primary whitespace-pre-wrap py-2 border-t border-b border-gray-200">
                                            {formData.description || <span className="text-gray-400 italic">No description provided.</span>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <strong className="block text-secondary mb-1">Content</strong>
                                                {formData.resource_type === 'link' ? (
                                                    <a href={formData.external_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                        <Globe size={14} /> {formData.external_link}
                                                    </a>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-primary">
                                                        <File size={14} /> {resourceFile ? resourceFile.name : 'No file uploaded'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <strong className="block text-secondary mb-1">Visibility</strong>
                                                <span className="flex items-center gap-1 text-primary">
                                                    <Users size={14} />
                                                    {formData.visibility === 'custom' || formData.visibility === 'institutions' ? 'Specific Audience' : formData.visibility}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                        {/* Action buttons are mainly in the footer, but we can put preview actions here? No, stick to consistent footer */}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <Button
                                variant="secondary"
                                onClick={() => currentStep === 1 ? navigate('/resources') : prevStep()}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Previous'}
                            </Button>

                            <div className="ml-auto flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <Button variant="primary" onClick={nextStep}>
                                        Next <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading} className="border-gray-300">
                                            <Save size={18} className="mr-2" /> Save Draft
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleSubmit('announcement')} disabled={loading}>
                                            <Megaphone size={18} className="mr-2" /> Announce
                                        </Button>
                                        <Button variant="primary" onClick={() => handleSubmit('publish')} disabled={loading}>
                                            <Send size={18} className="mr-2" /> Publish
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <Card className="max-w-md w-full animate-scale-up">
                        <CardBody>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                {confirmAction === 'draft' && <Save className="text-gray-500" />}
                                {confirmAction === 'publish' && <Send className="text-primary" />}
                                {confirmAction === 'announcement' && <Megaphone className="text-orange-500" />}

                                {confirmAction === 'draft' && 'Save as Draft?'}
                                {confirmAction === 'publish' && 'Publish Resource?'}
                                {confirmAction === 'announcement' && 'Request Announcement?'}
                            </h3>
                            <p className="text-secondary mb-6">
                                {confirmAction === 'draft' && 'Your resource will be saved securely as a draft. You can edit and publish it later.'}
                                {confirmAction === 'publish' && 'Your resource will be made available immediately based on your visibility settings.'}
                                {confirmAction === 'announcement' && 'Your resource will be published and a request will be sent to administrators to announce it globally.'}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="secondary" onClick={() => setShowConfirmation(false)}>Cancel</Button>
                                <Button variant="primary" onClick={confirmSubmit} disabled={loading}>
                                    {loading ? 'Processing...' : 'Confirm'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CreateResource;
