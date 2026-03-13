import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, FileText, Upload, Link as LinkIcon, Save, Send, Megaphone, X,
    CheckCircle, ChevronRight, ChevronLeft, AlertCircle, File, Globe, Users, Plus, Trash2,
    Image, Download, Clock, Camera
} from 'lucide-react';
import api from '../services/api';
import VisibilitySelector from '../components/resources/VisibilitySelector';
import opinionsService from '../services/opinions.service';
import articlesService from '../services/articles.service';
import authService from '../services/auth.service';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Upload & Details' },
    { number: 2, title: 'Context & Links' },
    { number: 3, title: 'Visibility' },
    { number: 4, title: 'Review & Publish' }
];

const getFileType = (file) => {
    if (!file) return 'document';
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return 'spreadsheet';
    return 'document';
};

const CreateResource = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    // Form State (Array of resources)
    const [resources, setResources] = useState([
        { id: Date.now(), name: '', description: '', resource_type: 'document', external_link: '', category: '', file: null }
    ]);

    // Shared States
    const [visibility, setVisibility] = useState('public');
    const [visibilitySettings, setVisibilitySettings] = useState(null);
    const [linkType, setLinkType] = useState('none');
    const [linkedContentId, setLinkedContentId] = useState('');
    const [availableContent, setAvailableContent] = useState([]);
    const [loadingContent, setLoadingContent] = useState(false);

    // New fields: cover photo, download, expiry
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [allowDownload, setAllowDownload] = useState(true);
    const [expiresAt, setExpiresAt] = useState('');

    const handleCoverUpload = (file) => {
        if (!file) return;
        setCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result);
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        authService.getCurrentUser().then(setUser);
    }, []);

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
            setVisibility(value);
            setVisibilitySettings(null);
        } else {
            setVisibility('institutions');
            setVisibilitySettings(value.settings);
        }
    };

    const addResourceBlock = () => {
        setResources([...resources, { id: Date.now(), name: '', description: '', resource_type: 'document', external_link: '', category: '', file: null }]);
    };

    const removeResourceBlock = (id) => {
        if (resources.length > 1) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    const updateResource = (id, field, value) => {
        setResources(resources.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleFileUpload = (id, file) => {
        if (!file) return;
        setResources(resources.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    file,
                    resource_type: getFileType(file),
                    name: r.name || file.name.split('.').slice(0, -1).join('.') // auto-fill name if empty
                };
            }
            return r;
        }));
    };

    const nextStep = () => {
        setError(null);
        if (currentStep === 1) {
            // Validate all resources
            for (let i = 0; i < resources.length; i++) {
                const r = resources[i];
                if (!r.name) {
                    setError(`Resource #${i + 1} Name is required.`);
                    return;
                }
                if (r.resource_type === 'link' && !r.external_link) {
                    setError(`Resource #${i + 1} requires an External Link.`);
                    return;
                }
                if (r.resource_type !== 'link' && !r.file) {
                    setError(`Resource #${i + 1} requires a file upload.`);
                    return;
                }
            }
        }
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
            // Submit all resources in parallel
            const promises = resources.map(async (res) => {
                const submitData = new FormData();
                if (res.name) submitData.append('name', res.name);
                if (res.description) submitData.append('description', res.description);
                if (res.resource_type) submitData.append('resource_type', res.resource_type);
                if (res.category) submitData.append('category', res.category);
                if (res.external_link) submitData.append('external_link', res.external_link);
                if (res.file) submitData.append('res_file', res.file);

                // Shared fields
                if (roomId) submitData.append('room', roomId);
                submitData.append('visibility', visibility);
                if (visibilitySettings) {
                    submitData.append('visibility_settings', JSON.stringify(visibilitySettings));
                }
                if (linkType !== 'none' && linkedContentId) {
                    submitData.append('linked_' + linkType, linkedContentId);
                }

                const status = confirmAction === 'draft' ? 'draft' : (confirmAction === 'announcement' ? 'announcement_requested' : 'published');
                submitData.append('status', status);
                submitData.append('allow_download', allowDownload);
                if (expiresAt) submitData.append('expires_at', expiresAt);
                if (coverImage) submitData.append('cover_image', coverImage);

                const response = await api.post('/api/resources/resource/', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data;
            });

            const results = await Promise.all(promises);

            if (confirmAction === 'announcement') {
                try {
                    // Just announce the first one to avoid spam, or group them
                    const firstRes = results[0];
                    await api.post('/api/announcements/requests/', {
                        content_type: 'resource',
                        content_id: firstRes.id,
                        heading: `📚 New Resources: ${firstRes.name} ${results.length > 1 ? `& ${results.length - 1} more` : ''}`,
                        content: firstRes.description ? firstRes.description.substring(0, 500) : '',
                        request_type: 'resource_share'
                    });
                    alert(`${results.length} resources created and announcement requested!`);
                } catch (e) {
                    console.error('Announcement request failed', e);
                    alert('Resources created but announcement request failed.');
                }
            } else if (confirmAction === 'draft') {
                alert(`${results.length} resources saved as draft!`);
            } else {
                alert(`${results.length} resources published successfully!`);
            }

            navigate('/resources');
        } catch (error) {
            console.error('Failed to create resources:', error);
            setError(error.response?.data?.detail || 'Failed to create resources. Please try again.');
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
                        Upload Resources
                    </h1>
                    <p className="text-secondary mt-2">Upload multiple documents, links, and media with dedicated descriptions.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            {/* Active Progress Line */}
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-green-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}% ` }}
                            ></div>

                            {STEPS.map((step, index) => (
                                <div key={step.number} className="flex flex-col items-center relative z-10 px-2 group cursor-pointer" onClick={() => step.number < currentStep && setCurrentStep(step.number)}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-elevated text-secondary border-theme group-hover:border-green-300'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-green-600' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[400px]">
                            {/* STEP 1: Upload & Details (Multi-file) */}
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-semibold text-primary">Resource Files & Details</h3>
                                        <Button variant="outline" size="sm" onClick={addResourceBlock}>
                                            <Plus size={16} className="mr-1" /> Add Another
                                        </Button>
                                    </div>

                                    {resources.map((res, index) => (
                                        <div key={res.id} className="p-5 border border-theme rounded-xl bg-secondary/5 relative">
                                            {resources.length > 1 && (
                                                <button
                                                    onClick={() => removeResourceBlock(res.id)}
                                                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                            <div className="mb-4">
                                                <div className="flex gap-4 mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateResource(res.id, 'resource_type', 'document')}
                                                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-sm transition-all ${res.resource_type !== 'link'
                                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                                            : 'border-theme hover:border-primary/50 text-secondary'
                                                            }`}
                                                    >
                                                        <Upload size={16} /> Upload File
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            updateResource(res.id, 'resource_type', 'link');
                                                            updateResource(res.id, 'file', null);
                                                        }}
                                                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-sm transition-all ${res.resource_type === 'link'
                                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                                            : 'border-theme hover:border-primary/50 text-secondary'
                                                            }`}
                                                    >
                                                        <LinkIcon size={16} /> External Link
                                                    </button>
                                                </div>

                                                {res.resource_type === 'link' ? (
                                                    <input
                                                        type="url"
                                                        value={res.external_link}
                                                        onChange={(e) => updateResource(res.id, 'external_link', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary"
                                                        placeholder="https://example.com/resource"
                                                    />
                                                ) : (
                                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${res.file ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/50 bg-background'}`}>
                                                        {res.file ? (
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <FileText className="w-8 h-8 text-primary" />
                                                                <span className="font-medium text-primary text-sm">{res.file.name}</span>
                                                                <span className="text-xs text-secondary">{(res.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                <button onClick={() => updateResource(res.id, 'file', null)} className="mt-1 text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                                                                    <X size={12} /> Remove
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                                                <label className="cursor-pointer">
                                                                    <span className="text-primary hover:underline font-medium text-sm">Click to upload</span>
                                                                    <span className="text-gray-500 text-sm"> or drag & drop</span>
                                                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(res.id, e.target.files?.[0])} />
                                                                </label>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-secondary mb-1">Resource Name *</label>
                                                    <input
                                                        type="text"
                                                        value={res.name}
                                                        onChange={(e) => updateResource(res.id, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary"
                                                        placeholder="Name this file/link"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-secondary mb-1">Category</label>
                                                    <input
                                                        type="text"
                                                        value={res.category}
                                                        onChange={(e) => updateResource(res.id, 'category', e.target.value)}
                                                        className="w-full px-3 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary"
                                                        placeholder="e.g. Study Materials"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" className="w-full border-dashed" onClick={addResourceBlock}>
                                        <Plus size={18} className="mr-2" /> Add Another Resource
                                    </Button>
                                </div>
                            )}

                            {/* STEP 2: Content & Context */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Descriptions & Linking</h3>

                                    <div className="space-y-6">
                                        {resources.map((res, idx) => (
                                            <div key={res.id} className="p-4 border border-theme rounded-xl">
                                                <h4 className="font-medium text-primary mb-3 text-sm flex items-center justify-between">
                                                    <span>{res.name || `Resource #${idx + 1}`}</span>
                                                    <span className="text-xs px-2 py-1 bg-secondary/10 rounded-full text-secondary capitalize">{res.resource_type}</span>
                                                </h4>
                                                <textarea
                                                    value={res.description}
                                                    onChange={(e) => updateResource(res.id, 'description', e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-y text-primary text-sm"
                                                    placeholder="Detailed description for this specific resource..."
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                            <LinkIcon size={18} /> Shared Linking (Optional)
                                        </h4>
                                        <p className="text-sm text-secondary mb-4">Associate all uploaded resources with existing content.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <select
                                                    value={linkType}
                                                    onChange={(e) => setLinkType(e.target.value)}
                                                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary"
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
                                                            className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary"
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
                                    <h3 className="text-xl font-semibold text-primary mb-4">Visibility & Settings</h3>
                                    <p className="text-secondary mb-6">Choose who can see these {resources.length > 1 ? 'resources' : 'resource'} and configure access settings.</p>

                                    <VisibilitySelector onChange={handleVisibilityChange} initialValue={visibility} />

                                    {/* Cover Photo */}
                                    <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                            <Image size={18} /> Cover Photo (Optional)
                                        </h4>
                                        <p className="text-sm text-secondary mb-4">Add a cover image that represents these resources.</p>
                                        {coverPreview ? (
                                            <div className="relative group">
                                                <img src={coverPreview} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                                                <button
                                                    onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                                <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                                <label className="cursor-pointer">
                                                    <span className="text-primary hover:underline font-medium text-sm">Click to upload cover</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverUpload(e.target.files?.[0])} />
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Download & Expiry Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 border border-theme rounded-xl bg-secondary/5">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Download className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <span className="text-sm font-medium text-primary block">Allow Downloads</span>
                                                        <span className="text-xs text-secondary">Users can download these resources</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={allowDownload}
                                                        onChange={(e) => setAllowDownload(e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-10 h-6 rounded-full transition-colors ${allowDownload ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${allowDownload ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="p-4 border border-theme rounded-xl bg-secondary/5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-primary" />
                                                <div>
                                                    <span className="text-sm font-medium text-primary block">Expiry Date (Optional)</span>
                                                    <span className="text-xs text-secondary">Resource auto-hides after this date</span>
                                                </div>
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={expiresAt}
                                                onChange={(e) => setExpiresAt(e.target.value)}
                                                className="w-full px-3 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-primary text-sm mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>

                                    <div className="space-y-4">
                                        <div className="text-sm text-secondary flex items-center gap-2">
                                            <Users size={16} />
                                            Shared Visibility: <strong className="text-primary">{visibility === 'custom' || visibility === 'institutions' ? 'Specific Audience' : visibility.toUpperCase()}</strong>
                                        </div>

                                        {resources.map((res, idx) => (
                                            <div key={res.id} className="bg-secondary/5 border border-theme rounded-xl p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-primary">{res.name || `Resource #${idx + 1}`}</h4>
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium uppercase">
                                                            {res.resource_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                {res.description && <p className="text-sm text-secondary line-clamp-2">{res.description}</p>}
                                                <div className="text-sm">
                                                    {res.resource_type === 'link' ? (
                                                        <a href={res.external_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                            <Globe size={14} /> {res.external_link}
                                                        </a>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <File size={14} /> {res.file ? res.file.name : 'No file uploaded'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                            <Send size={18} className="mr-2" /> Publish {resources.length > 1 && `(${resources.length})`}
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
                                {confirmAction === 'publish' && `Publish ${resources.length} Resource${resources.length > 1 ? 's' : ''}?`}
                                {confirmAction === 'announcement' && 'Request Announcement?'}
                            </h3>
                            <p className="text-secondary mb-6">
                                {confirmAction === 'draft' && 'Your resources will be saved securely as drafts. You can edit and publish them later.'}
                                {confirmAction === 'publish' && 'Your resources will be made available immediately based on your visibility settings.'}
                                {confirmAction === 'announcement' && 'Your resources will be published and a request will be sent to administrators to announce them globally.'}
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
