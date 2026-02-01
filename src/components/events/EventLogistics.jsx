/**
 * Event Logistics Section Component
 * Comprehensive logistics management for event organizers
 * Includes documents, articles, research, announcements, products, payment groups
 */
import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import {
    FileText, BookOpen, FlaskConical, Megaphone, ShoppingBag, PiggyBank,
    Upload, Link as LinkIcon, Trash2, Plus, Download, Archive, ExternalLink,
    ChevronDown, ChevronUp
} from 'lucide-react';
import eventsService from '../../services/events.service';

const LogisticsSection = ({ event, onUpdate }) => {
    const [activeSection, setActiveSection] = useState('documents');
    const [documents, setDocuments] = useState([]);
    const [articles, setArticles] = useState([]);
    const [research, setResearch] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [products, setProducts] = useState([]);
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [fundingProgress, setFundingProgress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        document_type: 'general',
        visibility: 'public',
        file: null
    });

    useEffect(() => {
        loadLogistics();
    }, [event.id]);

    const loadLogistics = async () => {
        setLoading(true);
        try {
            const [docsRes, articlesRes, researchRes, announcementsRes, productsRes, groupsRes, progressRes] = await Promise.all([
                eventsService.getEventDocuments(event.id).catch(() => ({ data: [] })),
                eventsService.getEventArticles(event.id).catch(() => ({ data: [] })),
                eventsService.getEventResearch(event.id).catch(() => ({ data: [] })),
                eventsService.getEventAnnouncements(event.id).catch(() => ({ data: [] })),
                eventsService.getEventProducts(event.id).catch(() => ({ data: [] })),
                eventsService.getEventPaymentGroups(event.id).catch(() => ({ data: [] })),
                eventsService.getEventFundingProgress(event.id).catch(() => ({ data: null }))
            ]);

            setDocuments(docsRes.data?.results || docsRes.data || []);
            setArticles(articlesRes.data?.results || articlesRes.data || []);
            setResearch(researchRes.data?.results || researchRes.data || []);
            setAnnouncements(announcementsRes.data?.results || announcementsRes.data || []);
            setProducts(productsRes.data?.results || productsRes.data || []);
            setPaymentGroups(groupsRes.data?.results || groupsRes.data || []);
            setFundingProgress(progressRes.data);
        } catch (error) {
            console.error('Failed to load logistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) return;

        setUploading(true);
        try {
            await eventsService.uploadDocument(event.id, uploadData);
            setShowUploadModal(false);
            setUploadData({ title: '', description: '', document_type: 'general', visibility: 'public', file: null });
            await loadLogistics();
        } catch (error) {
            console.error('Failed to upload document:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadDocument = async (docId) => {
        try {
            await eventsService.downloadDocument(docId);
            await loadLogistics();
        } catch (error) {
            console.error('Failed to track download:', error);
        }
    };

    const handleArchiveDocument = async (docId) => {
        try {
            await eventsService.archiveDocument(docId);
            await loadLogistics();
        } catch (error) {
            console.error('Failed to archive document:', error);
        }
    };

    const sections = [
        { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
        { id: 'articles', label: 'Articles', icon: BookOpen, count: articles.length },
        { id: 'research', label: 'Research', icon: FlaskConical, count: research.length },
        { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
        { id: 'products', label: 'Products', icon: ShoppingBag, count: products.length },
        { id: 'funding', label: 'Funding', icon: PiggyBank, count: paymentGroups.length },
    ];

    if (loading) {
        return (
            <Card>
                <CardBody className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Navigation */}
            <Card>
                <CardBody className="p-2">
                    <div className="flex flex-wrap gap-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeSection === section.id
                                        ? 'bg-primary-600 text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <section.icon size={16} />
                                {section.label}
                                {section.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeSection === section.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {section.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Documents Section */}
            {activeSection === 'documents' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Event Documents</h3>
                            <Button size="sm" onClick={() => setShowUploadModal(true)}>
                                <Upload size={16} className="mr-1" />
                                Upload Document
                            </Button>
                        </div>

                        {documents.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <FileText className="w-8 h-8 text-primary-600" />
                                        <div className="flex-1">
                                            <p className="font-medium">{doc.title}</p>
                                            <p className="text-sm text-gray-500">
                                                {doc.document_type} • {doc.visibility} • {doc.download_count} downloads
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.id)}>
                                                <Download size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleArchiveDocument(doc.id)}>
                                                <Archive size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Modal */}
                        {showUploadModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                                    <h3 className="font-semibold text-lg mb-4">Upload Document</h3>
                                    <form onSubmit={handleDocumentUpload} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={uploadData.title}
                                                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <textarea
                                                value={uploadData.description}
                                                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Type</label>
                                                <select
                                                    value={uploadData.document_type}
                                                    onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                >
                                                    <option value="general">General</option>
                                                    <option value="agenda">Agenda</option>
                                                    <option value="presentation">Presentation</option>
                                                    <option value="handout">Handout</option>
                                                    <option value="certificate">Certificate</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Visibility</label>
                                                <select
                                                    value={uploadData.visibility}
                                                    onChange={(e) => setUploadData({ ...uploadData, visibility: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="attendees">Attendees Only</option>
                                                    <option value="organizers">Organizers Only</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">File</label>
                                            <input
                                                type="file"
                                                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" loading={uploading}>
                                                Upload
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Articles Section */}
            {activeSection === 'articles' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Linked Articles</h3>
                            <Button size="sm">
                                <LinkIcon size={16} className="mr-1" />
                                Link Article
                            </Button>
                        </div>

                        {articles.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No articles linked yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {articles.map((article) => (
                                    <div key={article.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <BookOpen className="w-8 h-8 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="font-medium">{article.article_title}</p>
                                            <p className="text-sm text-gray-500">{article.link_type}</p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Research Section */}
            {activeSection === 'research' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Event Research</h3>
                            <Button size="sm">
                                <LinkIcon size={16} className="mr-1" />
                                Link Research
                            </Button>
                        </div>

                        {research.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No research projects linked yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {research.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <FlaskConical className="w-8 h-8 text-purple-600" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.research_title}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.is_keynote && <span className="text-amber-600 font-medium">Keynote • </span>}
                                                Order: {item.presentation_order}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Announcements Section */}
            {activeSection === 'announcements' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Event Announcements</h3>
                            <Button size="sm">
                                <Megaphone size={16} className="mr-1" />
                                Create Announcement
                            </Button>
                        </div>

                        {announcements.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No announcements linked yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Megaphone className="w-5 h-5 text-orange-600" />
                                            <p className="font-medium">{announcement.announcement_title}</p>
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                {announcement.link_type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.announcement_content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Products Section */}
            {activeSection === 'products' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Event Products</h3>
                            <Button size="sm">
                                <Plus size={16} className="mr-1" />
                                Link Product
                            </Button>
                        </div>

                        {products.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No products linked yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {products.map((product) => (
                                    <div key={product.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="font-medium text-sm">{product.product_name}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-primary-600 font-semibold">${product.product_price}</span>
                                            {product.is_exclusive && (
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                                    Exclusive
                                                </span>
                                            )}
                                        </div>
                                        {product.discount_percentage > 0 && (
                                            <p className="text-xs text-green-600 mt-1">
                                                {product.discount_percentage}% off for attendees
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Funding Section */}
            {activeSection === 'funding' && (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Event Funding</h3>
                            <Button size="sm">
                                <PiggyBank size={16} className="mr-1" />
                                Create Fundraiser
                            </Button>
                        </div>

                        {/* Funding Progress Summary */}
                        {fundingProgress && fundingProgress.total_target > 0 && (
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Total Funding Progress</span>
                                    <span className="text-primary-700 font-bold">
                                        {fundingProgress.progress_percentage}%
                                    </span>
                                </div>
                                <div className="h-3 bg-white rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(fundingProgress.progress_percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm mt-2 text-gray-600">
                                    <span>${fundingProgress.total_collected} raised</span>
                                    <span>Goal: ${fundingProgress.total_target}</span>
                                </div>
                            </div>
                        )}

                        {paymentGroups.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No fundraisers created yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {paymentGroups.map((group) => (
                                    <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <PiggyBank className="w-5 h-5 text-green-600" />
                                                <p className="font-medium">{group.group_name}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                {group.purpose}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${Math.min((group.current_amount / group.target_amount) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm mt-1 text-gray-600">
                                            <span>${group.current_amount || 0}</span>
                                            <span>${group.target_amount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default LogisticsSection;
