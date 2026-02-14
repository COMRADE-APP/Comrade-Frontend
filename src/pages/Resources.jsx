import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FileText, Upload, Download, Eye, Trash2, X, File, Image, Video, Link as LinkIcon, Search, Plus } from 'lucide-react';
import resourcesService from '../services/resources.service';
import { formatDate } from '../utils/dateFormatter';

const Resources = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        desc: '',
        file_type: 'doc',
        res_file: null,
    });

    // All authenticated users can create resources
    const canManageResources = true;

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        setLoading(true);
        try {
            const data = await resourcesService.getAll();
            setResources(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await resourcesService.upload(uploadData);
            setShowUploadModal(false);
            setUploadData({ title: '', desc: '', file_type: 'doc', res_file: null });
            loadResources();
        } catch (error) {
            alert('Failed to upload resource');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await resourcesService.delete(id);
            loadResources();
        } catch (error) {
            alert('Failed to delete resource');
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesFilter = filter === 'all' || r.file_type === filter;
        const matchesSearch = !searchTerm ||
            r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.desc?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Resources</h1>
                    <p className="text-secondary mt-1">Browse and manage shared resources</p>
                </div>
                {canManageResources && (
                    <Button variant="primary" onClick={() => navigate('/resources/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Resource
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'doc', 'image', 'video', 'media_link', 'text'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                            ? 'bg-primary-600 text-white'
                            : 'bg-elevated text-secondary border border-theme hover:bg-secondary'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredResources.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <FileText className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No resources found. Upload your first resource!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">Upload Resource</h2>
                                <button onClick={() => setShowUploadModal(false)} className="text-secondary hover:text-primary">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <Input
                                    label="Title"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    required
                                    placeholder="Resource title"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                    <textarea
                                        value={uploadData.desc}
                                        onChange={(e) => setUploadData({ ...uploadData, desc: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        placeholder="Resource description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                                    <select
                                        value={uploadData.file_type}
                                        onChange={(e) => setUploadData({ ...uploadData, file_type: e.target.value })}
                                        className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    >
                                        <option value="doc">Document</option>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="media_link">Media Link</option>
                                        <option value="text">Text</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">File</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setUploadData({ ...uploadData, res_file: e.target.files[0] })}
                                        className="w-full px-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" type="button" onClick={() => setShowUploadModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Upload
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const ResourceCard = ({ resource, onDelete }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'image':
                return <Image className="w-6 h-6" />;
            case 'video':
                return <Video className="w-6 h-6" />;
            case 'media_link':
                return <LinkIcon className="w-6 h-6" />;
            default:
                return <File className="w-6 h-6" />;
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody>
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {getIcon(resource.file_type)}
                        </div>
                        <button
                            onClick={() => onDelete(resource.id)}
                            className="text-tertiary hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg text-primary line-clamp-1">{resource.title}</h3>
                        <p className="text-sm text-secondary mt-1 line-clamp-2">
                            {resource.desc || 'No description'}
                        </p>
                    </div>

                    <div className="text-xs text-tertiary">
                        Uploaded {formatDate(resource.created_on)}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                        </Button>
                        <Button variant="primary" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default Resources;
