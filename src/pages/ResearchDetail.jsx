import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, User, Users, FileText, CheckCircle, Clock,
    MessageSquare, Share2, Award, BookOpen, AlertCircle, Plus,
    Flag, Heart, DollarSign, Percent, Shield, Download, BarChart2, Edit2
} from 'lucide-react';
import researchService from '../services/research.service';
import api from '../services/api';
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

    // Personas state
    const [personas, setPersonas] = useState([]);
    const [newPersona, setNewPersona] = useState({ name: '', description: '', percentage: '' });

    // Recruitment state
    const [recruitmentPosts, setRecruitmentPosts] = useState([]);

    // Publication state
    const [pubData, setPubData] = useState({
        fee: 0,
        currency: 'USD',
        full_paper: null
    });

    // Surveys / Data Collection state
    const [surveys, setSurveys] = useState([]);
    const [surveysLoading, setSurveysLoading] = useState(false);

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const [projectData, postsData] = await Promise.all([
                researchService.getProjectById(id),
                researchService.getRecruitmentPosts({ research: id })
            ]);
            setProject(projectData);
            setRecruitmentPosts(postsData.results || postsData);

            if (projectData?.publication) {
                setPubData(prev => ({
                    ...prev,
                    fee: projectData.publication.fee || 0,
                    currency: projectData.publication.currency || 'USD'
                }));
            }

            // Load surveys linked to this project
            try {
                setSurveysLoading(true);
                const surveyRes = await api.get('/api/tasks/', { params: { research_project: id } });
                const surveyData = Array.isArray(surveyRes.data) ? surveyRes.data : surveyRes.data.results || [];
                setSurveys(surveyData);
            } catch (err) {
                console.error('Error loading surveys:', err);
            } finally {
                setSurveysLoading(false);
            }
        } catch (error) {
            console.error('Error loading project data:', error);
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

    const isPI = String(project?.principal_investigator?.id) === String(user?.id);

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

    const needsParticipants = project.status === 'seeking_participants' ||
        (project.positions?.some(p => !p.is_full));

    const isPaidParticipation = project.positions?.some(p => p.compensation_type !== 'none');

    const renderPersonas = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">Research Personas</h3>
                {isPI && (
                    <Button variant="primary" size="sm" onClick={() => {
                        if (newPersona.name && newPersona.percentage) {
                            setPersonas(prev => [...prev, { ...newPersona, id: Date.now(), percentage: Number(newPersona.percentage) }]);
                            setNewPersona({ name: '', description: '', percentage: '' });
                        }
                    }}>
                        <Plus className="w-4 h-4 mr-1" /> Add Persona
                    </Button>
                )}
            </div>

            {isPI && (
                <Card>
                    <CardBody className="space-y-3">
                        <h4 className="font-medium text-primary text-sm">Create Persona</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={newPersona.name}
                                onChange={e => setNewPersona(p => ({ ...p, name: e.target.value }))}
                                placeholder="Persona name (e.g., Students)"
                                className="bg-secondary border border-theme rounded-lg px-3 py-2 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <input
                                type="text"
                                value={newPersona.description}
                                onChange={e => setNewPersona(p => ({ ...p, description: e.target.value }))}
                                placeholder="Description"
                                className="bg-secondary border border-theme rounded-lg px-3 py-2 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    value={newPersona.percentage}
                                    onChange={e => setNewPersona(p => ({ ...p, percentage: e.target.value }))}
                                    placeholder="% needed"
                                    className="w-full bg-secondary border border-theme rounded-lg px-3 py-2 pr-8 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Allocation Bar */}
            {personas.length > 0 && (
                <Card>
                    <CardBody>
                        <h4 className="font-medium text-primary mb-3">Allocation Overview</h4>
                        <div className="w-full h-6 bg-secondary rounded-full overflow-hidden flex">
                            {personas.map((p, i) => {
                                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                                return (
                                    <div
                                        key={p.id}
                                        className={`${colors[i % colors.length]} h-full flex items-center justify-center text-white text-xs font-bold`}
                                        style={{ width: `${p.percentage}%` }}
                                        title={`${p.name}: ${p.percentage}%`}
                                    >
                                        {p.percentage >= 10 && `${p.percentage}%`}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {personas.map((p, i) => {
                                const colors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 'text-pink-500', 'text-teal-500'];
                                return (
                                    <span key={p.id} className={`text-xs font-medium ${colors[i % colors.length]}`}>
                                        ● {p.name} ({p.percentage}%)
                                    </span>
                                );
                            })}
                            <span className="text-xs text-secondary ml-auto">
                                Total: {personas.reduce((acc, p) => acc + (p.percentage || 0), 0)}%
                            </span>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Persona Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map(persona => (
                    <Card key={persona.id} className="hover:border-primary/50 transition-colors">
                        <CardBody>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-primary">{persona.name}</h4>
                                <Badge variant="info">{persona.percentage}%</Badge>
                            </div>
                            <p className="text-sm text-secondary">{persona.description || 'No description provided.'}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {personas.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-xl border border-theme">
                    <Users className="w-12 h-12 mx-auto text-tertiary mb-3" />
                    <p className="text-secondary">No personas defined yet.</p>
                    {isPI && <p className="text-xs text-tertiary mt-1">Add representative participant profiles above.</p>}
                </div>
            )}
        </div>
    );

    const renderGuidelines = () => (
        <div className="space-y-6">
            <Card>
                <CardBody className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary-500" />
                        <h3 className="text-xl font-semibold text-primary">Participant Guidelines</h3>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-6 space-y-4">
                        <div>
                            <h4 className="font-medium text-primary mb-2">Eligibility</h4>
                            <div className="text-sm text-secondary space-y-1">
                                <p>• Age Range: {project.requirements?.[0]?.min_age || '18'} - {project.requirements?.[0]?.max_age || 'Any'}</p>
                                <p>• Gender: {project.requirements?.[0]?.gender || 'Any'}</p>
                                <p>• Education: {project.requirements?.[0]?.min_education_level?.replace('_', ' ') || 'Any'}</p>
                                <p>• Skills: {project.requirements?.[0]?.required_skills?.join(', ') || 'None specified'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-primary mb-2">Compensation</h4>
                            <p className="text-sm text-secondary">
                                {isPaidParticipation ? 'This research provides compensation to participants.' : 'This research is unpaid / voluntary.'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-primary mb-2">Duration</h4>
                            <p className="text-sm text-secondary">
                                Estimated {project.positions?.[0]?.estimated_duration_weeks || 'N/A'} weeks
                            </p>
                        </div>
                    </div>
                    {needsParticipants && (
                        <Button variant="primary" className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Join as Participant
                        </Button>
                    )}
                </CardBody>
            </Card>
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

    const renderRecruitment = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary">Recruitment Posts</h3>
                {isPI && (
                    <Button variant="primary" size="sm" onClick={() => {/* Navigate to create post */ }}>
                        <Plus className="w-4 h-4 mr-2" /> Create Post
                    </Button>
                )}
            </div>

            {recruitmentPosts.length === 0 ? (
                <div className="text-center py-8 bg-elevated rounded-xl border border-theme">
                    <Users className="w-12 h-12 mx-auto text-tertiary mb-3" />
                    <p className="text-secondary">No active recruitment posts right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recruitmentPosts.map((post) => (
                        <Card key={post.id} className="hover:border-primary/50 transition-colors">
                            <CardBody className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary text-lg">{post.title}</h4>
                                    <Badge variant={post.is_active ? 'success' : 'secondary'}>
                                        {post.is_active ? 'Active' : 'Closed'}
                                    </Badge>
                                </div>

                                <Badge variant="info" className="w-fit mb-2">
                                    Seeking: {post.post_type === 'team_members' ? 'Team Members' : 'Participants'}
                                </Badge>

                                <p className="text-sm text-secondary line-clamp-3">{post.description}</p>

                                {post.requirements_text && (
                                    <div className="bg-secondary/10 p-3 rounded-lg text-xs text-secondary">
                                        <p className="font-semibold text-primary mb-1">Requirements:</p>
                                        <p className="line-clamp-2">{post.requirements_text}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-xs text-tertiary mt-2">
                                    {post.application_deadline && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Due {new Date(post.application_deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-theme flex justify-end">
                                    <Button
                                        onClick={() => navigate(`/research/${project.id}/recruitment/${post.id}/apply`)}
                                        variant="primary"
                                        className="w-full"
                                        disabled={!post.is_active}
                                    >
                                        Apply Now
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSurveys = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-primary">Data Collection Instruments</h3>
                    <p className="text-sm text-secondary mt-1">Surveys and questionnaires linked to this research project.</p>
                </div>
                {isPI && (
                    <Button variant="primary" size="sm" onClick={() => navigate(`/tasks/create?research_project=${project.id}`)}>
                        <Plus className="w-4 h-4 mr-2" /> Create Survey
                    </Button>
                )}
            </div>

            {surveysLoading ? (
                <div className="text-center py-12 text-secondary">Loading surveys...</div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-12 bg-elevated rounded-xl border border-theme">
                    <FileText className="w-12 h-12 mx-auto text-tertiary mb-3" />
                    <p className="text-secondary">No surveys have been linked to this project yet.</p>
                    {isPI && <p className="text-xs text-tertiary mt-1">Create a survey or questionnaire and link it to this project during creation.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {surveys.map(survey => (
                        <Card key={survey.id} className="hover:border-primary/50 transition-colors">
                            <CardBody className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary">{survey.heading}</h4>
                                    <Badge variant={survey.state === 'active' ? 'success' : 'secondary'}>
                                        {survey.state || 'Draft'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-secondary line-clamp-2">{survey.description}</p>
                                <div className="flex items-center gap-4 text-xs text-tertiary">
                                    <span className="flex items-center gap-1">
                                        <FileText size={14} /> {survey.question_count || 0} questions
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} /> {survey.response_count || 0} responses
                                    </span>
                                    {survey.due_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> Due {new Date(survey.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-theme">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => navigate(`/tasks/${survey.id}`)}
                                    >
                                        View Details
                                    </Button>
                                    {isPI && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => navigate(`/tasks/${survey.id}/responses`)}
                                        >
                                            <BarChart2 className="w-4 h-4 mr-1" /> Responses
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Aggregate Stats */}
            {surveys.length > 0 && (
                <Card>
                    <CardBody>
                        <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-tertiary" /> Collection Summary
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">{surveys.length}</div>
                                <div className="text-xs text-secondary">Total Surveys</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {surveys.reduce((sum, s) => sum + (s.response_count || 0), 0)}
                                </div>
                                <div className="text-xs text-secondary">Total Responses</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {surveys.filter(s => s.state === 'active').length}
                                </div>
                                <div className="text-xs text-secondary">Active Surveys</div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );

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
                            {needsParticipants && (
                                <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs font-bold backdrop-blur-sm animate-pulse">
                                    Seeking Participants
                                </span>
                            )}
                            {isPaidParticipation ? (
                                <span className="px-3 py-1 bg-amber-500/30 text-amber-200 rounded-full text-xs font-medium backdrop-blur-sm">
                                    💰 Paid Participation
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs font-medium backdrop-blur-sm">
                                    Free Participation
                                </span>
                            )}
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
                        {isPI && (
                            <Button onClick={() => navigate(`/research/${id}/edit`)} className="bg-white text-primary hover:bg-gray-100 text-sm py-1.5 h-auto">
                                <Edit2 className="w-4 h-4 mr-2" /> Update Research
                            </Button>
                        )}
                        {isPI && !project.is_published && (
                            <Button onClick={handlePublish} className="bg-white text-primary hover:bg-gray-100">
                                <Share2 className="w-4 h-4 mr-2" /> Publish Now
                            </Button>
                        )}
                        {isPI && (
                            <Button className="bg-primary-600 text-white border border-primary-500 hover:bg-primary-500 text-sm py-1.5 h-auto">
                                <Award className="w-4 h-4 mr-2" /> Manage Reviews
                            </Button>
                        )}
                        {isPI && (
                            <Button onClick={() => navigate(`/research/${project.id}/analytics`)} className="bg-elevated text-primary border border-theme hover:bg-secondary text-sm py-1.5 h-auto">
                                <BarChart2 className="w-4 h-4 mr-2" /> View Analytics
                            </Button>
                        )}
                        {isPI && (
                            <Button onClick={() => navigate(`/research/edit/${project.id}`)} className="bg-elevated text-primary border border-theme hover:bg-secondary text-sm py-1.5 h-auto">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Project
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-theme overflow-x-auto pb-1">
                {['overview', 'personas', 'participants', 'surveys', 'recruitment', 'guidelines', 'team', 'reviews', 'publication'].map((tab) => (
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
                {activeTab === 'personas' && renderPersonas()}
                {activeTab === 'participants' && renderPositions()}
                {activeTab === 'surveys' && renderSurveys()}
                {activeTab === 'recruitment' && renderRecruitment()}
                {activeTab === 'guidelines' && renderGuidelines()}
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

            {/* Support Creator + Report */}
            <div className="flex flex-col md:flex-row gap-4 pb-8">
                {project.support_enabled && (
                    <Card className="flex-1 bg-gradient-to-br from-amber-500/5 to-yellow-500/10 border-amber-500/20">
                        <CardBody className="flex items-center gap-4">
                            <DollarSign className="w-10 h-10 text-amber-500" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-primary">Support this Research</h3>
                                <p className="text-sm text-secondary">Fund the researcher's work</p>
                            </div>
                            <Button
                                variant="primary"
                                className="bg-amber-500 hover:bg-amber-600"
                                onClick={() => navigate(`/payments/send?to=${project.principal_investigator?.id}&reason=research_support&ref=${id}`)}
                            >
                                <Heart size={16} className="mr-2" /> Support
                            </Button>
                        </CardBody>
                    </Card>
                )}
                <button
                    onClick={() => navigate(`/report?type=research&id=${id}&title=${encodeURIComponent(project.title || '')}`)}
                    className="flex items-center gap-2 p-3 text-sm text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                    <Flag size={16} />
                    Report this research
                </button>
            </div>
        </div>
    );
};

export default ResearchDetail;
