import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, User, Users, FileText, CheckCircle, Clock,
    MessageSquare, Share2, Award, BookOpen, AlertCircle, Plus
} from 'lucide-react';
import researchService from '../services/research.service';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';

const ResearchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const data = await researchService.getProjectById(id);
            setProject(data);
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReview = async () => {
        if (!window.confirm('Are you sure you want to request a peer review? This will change the project status.')) return;
        try {
            await researchService.requestReview(id);
            loadProject();
            alert('Peer review requested successfully!');
        } catch (error) {
            console.error('Error requesting review:', error);
            alert('Failed to request review.');
        }
    };

    const handlePublish = async () => {
        if (!window.confirm('Are you sure you want to publish this project?')) return;
        try {
            await researchService.publishProject(id);
            loadProject();
            alert('Project published successfully!');
        } catch (error) {
            console.error('Error publishing project:', error);
            alert('Failed to publish project.');
        }
    };

    const isPI = project?.principal_investigator?.id === user?.id;

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!project) return <div className="p-8 text-center">Project not found</div>;

    const renderOverview = () => (
        <div className="space-y-6">
            <Card>
                <CardBody className="space-y-4">
                    <h3 className="text-xl font-semibold text-primary">Abstract</h3>
                    <p className="text-secondary leading-relaxed">{project.abstract}</p>

                    <h3 className="text-xl font-semibold text-primary pt-4">Description</h3>
                    <p className="text-secondary leading-relaxed whitespace-pre-wrap">{project.description}</p>
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardBody>
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-tertiary" />
                            Milestones
                        </h3>
                        <div className="space-y-4">
                            {project.milestones?.map((milestone, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div>
                                        <h4 className={`font-medium ${milestone.completed ? 'text-primary' : 'text-secondary'}`}>
                                            {milestone.title}
                                        </h4>
                                        <p className="text-xs text-tertiary">{milestone.due_date}</p>
                                    </div>
                                </div>
                            ))}
                            {(!project.milestones || project.milestones.length === 0) && (
                                <p className="text-sm text-secondary italic">No milestones defined.</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-tertiary" />
                            Participant Requirements
                        </h3>
                        {/* Display generic requirements mainly, hard to parse structure without digging deep */}
                        <div className="space-y-2 text-sm text-secondary">
                            <p><strong>Age Range:</strong> {project.requirements?.[0]?.min_age || '?'} - {project.requirements?.[0]?.max_age || 'Any'}</p>
                            <p><strong>Gender:</strong> {project.requirements?.[0]?.gender || 'Any'}</p>
                            <p><strong>Education:</strong> {project.requirements?.[0]?.min_education_level?.replace('_', ' ') || 'Any'}</p>
                            <p><strong>Skills:</strong> {project.requirements?.[0]?.required_skills?.join(', ') || 'None'}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    const renderPositions = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary">Open Positions</h3>
                {isPI && (
                    <Button variant="primary" size="sm" onClick={() => {/* Navigate to create position */ }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Position
                    </Button>
                )}
            </div>

            {project.positions?.length === 0 ? (
                <div className="text-center py-8 bg-elevated rounded-xl border border-theme">
                    <Users className="w-12 h-12 mx-auto text-tertiary mb-3" />
                    <p className="text-secondary">No open positions at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.positions.map((pos) => (
                        <Card key={pos.id} className="hover:border-primary/50 transition-colors">
                            <CardBody className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary">{pos.title}</h4>
                                    <Badge variant={pos.is_full ? 'danger' : 'success'}>
                                        {pos.slots_available - pos.slots_filled} slots left
                                    </Badge>
                                </div>
                                <p className="text-sm text-secondary line-clamp-2">{pos.description}</p>
                                <div className="flex items-center gap-4 text-xs text-tertiary">
                                    <span>{pos.estimated_duration_weeks} weeks</span>
                                    <span>{pos.compensation_type !== 'none' ? 'Compensated' : 'Unpaid'}</span>
                                </div>
                                <Button className="w-full mt-2" variant="outline" disabled={pos.is_full}>
                                    Apply Now
                                </Button>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderTeam = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardBody className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        {project.principal_investigator?.avatar_url ? (
                            <img src={project.principal_investigator.avatar_url} alt="PI" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-primary">{project.principal_investigator?.full_name?.[0]}</span>
                        )}
                    </div>
                    <h3 className="font-semibold text-primary">{project.principal_investigator?.full_name}</h3>
                    <p className="text-xs text-secondary mb-3">Principal Investigator</p>
                    <Button size="sm" variant="outline">View Profile</Button>
                </CardBody>
            </Card>

            {project.co_investigators?.map(co => (
                <Card key={co.id}>
                    <CardBody className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                            {co.avatar_url ? (
                                <img src={co.avatar_url} alt={co.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-secondary">{co.full_name?.[0]}</span>
                            )}
                        </div>
                        <h3 className="font-semibold text-primary">{co.full_name}</h3>
                        <p className="text-xs text-secondary mb-3">Co-Investigator</p>
                        <Button size="sm" variant="outline">View Profile</Button>
                    </CardBody>
                </Card>
            ))}
        </div>
    );

    const renderPublication = () => {
        const [pubData, setPubData] = useState({
            fee: project.publication?.fee || 0,
            currency: project.publication?.currency || 'USD',
            full_paper: null
        });

        const handlePubSubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('research', project.id);
            formData.append('fee', pubData.fee);
            formData.append('currency', pubData.currency);
            if (pubData.full_paper) {
                formData.append('full_paper', pubData.full_paper);
            }
            // Add required fields
            formData.append('title', project.title);
            formData.append('abstract', project.abstract);

            try {
                if (project.publication) {
                    await researchService.updatePublication(project.publication.id, formData);
                } else {
                    await researchService.createPublication(formData);
                }
                alert('Publication details updated!');
                loadProject();
            } catch (error) {
                console.error('Error updating publication:', error);
                alert('Failed to update publication.');
            }
        };

        if (isPI) {
            return (
                <Card>
                    <CardBody className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-primary">Publication Settings</h3>
                            <Badge variant={project.publication ? 'success' : 'warning'}>
                                {project.publication ? 'Configured' : 'Not Configured'}
                            </Badge>
                        </div>

                        <form onSubmit={handlePubSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Access Fee</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={pubData.fee}
                                        onChange={(e) => setPubData({ ...pubData, fee: e.target.value })}
                                        className="w-full p-2 bg-elevated border border-theme rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Currency</label>
                                    <select
                                        value={pubData.currency}
                                        onChange={(e) => setPubData({ ...pubData, currency: e.target.value })}
                                        className="w-full p-2 bg-elevated border border-theme rounded-lg"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="KES">KES</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Full Paper (PDF)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPubData({ ...pubData, full_paper: e.target.files[0] })}
                                    className="w-full p-2 bg-elevated border border-theme rounded-lg"
                                />
                                {project.publication?.full_paper && (
                                    <p className="text-xs text-green-600 mt-1">Current file available</p>
                                )}
                            </div>

                            <Button type="submit" variant="primary">
                                {project.publication ? 'Update Settings' : 'Create Publication'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            );
        }

        if (!project.publication) {
            return (
                <div className="text-center py-12 text-secondary">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-tertiary" />
                    <p>Publication details not yet available.</p>
                </div>
            );
        }

        return (
            <Card>
                <CardBody className="text-center py-8 space-y-6">
                    <BookOpen className="w-16 h-16 mx-auto text-primary" />
                    <h2 className="text-2xl font-bold text-primary">{project.title}</h2>

                    <div className="flex justify-center gap-4">
                        <Badge variant="info">
                            {Number(project.publication.fee) > 0
                                ? `Price: ${project.publication.currency} ${project.publication.fee}`
                                : 'Free Access'}
                        </Badge>
                        <Badge variant="secondary">DOI: {project.publication.doi || 'Pending'}</Badge>
                    </div>

                    <div className="max-w-2xl mx-auto text-left">
                        <h4 className="font-semibold text-primary mb-2">Abstract</h4>
                        <p className="text-secondary">{project.publication.abstract || project.abstract}</p>
                    </div>

                    <div className="pt-4">
                        {Number(project.publication.fee) > 0 ? (
                            <Button variant="primary" size="lg">
                                Purchase Access
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => window.open(project.publication.full_paper, '_blank')}
                                disabled={!project.publication.full_paper}
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Download Full Paper
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/research')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Research
            </Button>

            {/* Header Card */}
            <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex gap-2 mb-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                {project.status?.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                {project.is_published ? 'Published' : 'Unpublished'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h1>
                        <div className="flex flex-wrap gap-6 text-sm text-primary-100">
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                PI: {project.principal_investigator?.full_name}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Created: {new Date(project.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                {project.views} views
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {isPI && !project.is_published && (
                            <Button onClick={handlePublish} className="bg-white text-primary hover:bg-gray-100">
                                <Share2 className="w-4 h-4 mr-2" /> Publish Now
                            </Button>
                        )}
                        {isPI && (
                            <Button className="bg-primary-600 text-white border border-primary-500 hover:bg-primary-500">
                                <Award className="w-4 h-4 mr-2" /> Manage Reviews
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-theme overflow-x-auto pb-1">
                {['overview', 'participants', 'team', 'reviews', 'publication'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'participants' && renderPositions()}
                {activeTab === 'team' && renderTeam()}
                {activeTab === 'reviews' && (
                    <div className="text-center py-12 text-secondary">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-tertiary" />
                        <p>No reviews yet.</p>
                        {isPI && <Button onClick={handleRequestReview} className="mt-4" variant="outline">Request Peer Review</Button>}
                    </div>
                )}
                {activeTab === 'publication' && renderPublication()}
            </div>
        </div>
    );
};

export default ResearchDetail;
