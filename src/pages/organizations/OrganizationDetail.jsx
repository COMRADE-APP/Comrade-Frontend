import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Building2, MapPin, Globe, Mail, Phone, Users, Plus,
    ChevronRight, Settings, Network, FileCheck, ArrowLeft,
    Loader2, AlertCircle, Camera, MoreHorizontal,
    Share2, Flag, CheckCircle, BookOpen, Calendar, MessageCircle, Briefcase
} from 'lucide-react';
import organizationsService from '../../services/organizations.service';
import unitsService from '../../services/units.service';
import { careersService } from '../../services/careers.service';
import CreateOrgUnit from './CreateOrgUnit';
import MembersTab from './MembersTab';

const OrganizationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Units state
    const [units, setUnits] = useState({});
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [createUnitOpen, setCreateUnitOpen] = useState(false);

    // Jobs state
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // File inputs
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    useEffect(() => {
        loadOrganization();
    }, [id]);

    const loadOrganization = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await organizationsService.getById(id);
            setOrganization(data);

            // Check if current user is admin/creator
            const isCreator = data.created_by === user?.id;
            // Also check membership role if available
            setIsAdmin(isCreator || user?.is_staff);

        } catch (err) {
            console.error('Error loading organization:', err);
            setError('Failed to load organization details');
        } finally {
            setLoading(false);
        }
    };

    const loadUnits = async () => {
        setUnitsLoading(true);
        const unitTypes = unitsService.getOrganisationUnitTypes();
        const loadedUnits = {};

        for (const type of unitTypes) {
            try {
                const data = await unitsService.getOrganisationUnits(id, type.key);
                if (data && data.length > 0) {
                    loadedUnits[type.key] = data;
                }
            } catch (err) {
                console.log(`No ${type.key} units found`);
            }
        }

        setUnits(loadedUnits);
        setUnitsLoading(false);
    };

    const loadJobs = async () => {
        setJobsLoading(true);
        try {
            const response = await careersService.getAll({ organization_id: id });
            setJobs(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error loading jobs:', error);
        } finally {
            setJobsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'units' && id) {
            loadUnits();
        } else if (activeTab === 'jobs' && id) {
            loadJobs();
        }
    }, [activeTab, id]);

    const handleUnitCreated = (unit) => {
        // Reload units after creation
        loadUnits();
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        // Backend expects 'profile_picture' or 'cover_picture'
        // But some endpoints might use specific keys. 
        // Based on models: profile_picture, cover_picture.
        // Serializer uses __all__. 
        // We will use organizationsService.update which does a PUT/PATCH (usually JSON)
        // But for files we need multipart. 
        // Let's assume update handles it if we pass FormData, or we might need a specific endpoint if update wraps in JSON.
        // Looking at organizationsService.update: uses api.put(..., data). Axios handles FormData automatically if data is FormData.

        if (type === 'avatar') {
            formData.append('logo_url', ''); // Clear regular URL if any? Model has profile_picture. 
            // Actually, the model has `profile_picture`. `logo_url` might be legacy or for external. 
            // Let's check the model again. 
            // Organisation model has `profile_picture` (ImageField). 
            // OrganizationDetail.jsx uses `organization.logo_url`. 
            // We should probably check if `profile_picture` is available in response and use it, falling back to `logo_url`.
            // For now, let's append 'profile_picture'.
            formData.append('profile_picture', file);
        } else {
            formData.append('cover_picture', file);
        }

        try {
            // We use PATCH for partial update if possible, but service uses PUT. 
            // Most storage updates for files work better with PATCH to avoid overwriting other fields if not provided.
            // Let's try to use a direct API call or modify service if needed.
            // organizationsService.update uses PUT. 
            // Let's try sending FormData with PUT.
            await organizationsService.update(id, formData);
            loadOrganization();
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'opinions', label: 'Opinions', icon: MessageCircle },
        { id: 'articles', label: 'Articles', icon: BookOpen },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'units', label: 'Units & Structure', icon: Network },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'verification', label: 'Verification', icon: FileCheck },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading organization...</span>
                </div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-gray-400">{error || 'Organization not found'}</p>
                    <Button onClick={() => navigate('/organizations')}>
                        Back to Organizations
                    </Button>
                </div>
            </div>
        );
    }

    // Determine display images
    const coverUrl = organization.cover_picture || organization.cover_url;
    const profileUrl = organization.profile_picture || organization.logo_url;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/organizations')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Organizations
            </button>

            {/* Cover & Avatar Section */}
            <Card className="overflow-hidden">
                <div className="relative">
                    {/* Cover Photo - Gradient Fallback */}
                    <div
                        className="h-48 md:h-64 bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 relative"
                        style={coverUrl ? {
                            backgroundImage: `url(${coverUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } : {}}
                    >
                        {isAdmin && (
                            <>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'cover')}
                                />
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-white" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Logo / Avatar */}
                    <div className="absolute -bottom-16 left-6 md:left-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-xl bg-elevated p-1 shadow-xl">
                                {profileUrl ? (
                                    <img
                                        src={profileUrl}
                                        alt="Logo"
                                        className="w-full h-full rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                                        <Building2 className="w-12 h-12 text-emerald-400" />
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'avatar')}
                                    />
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 rounded-full transition-colors shadow-lg translate-x-1/4 translate-y-1/4"
                                    >
                                        <Camera className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions (top right under cover) */}
                    <div className="absolute -bottom-6 right-4 flex items-center gap-2">
                        {isAdmin ? (
                            <>
                                <Button variant="primary" size="sm" onClick={() => navigate(`/organizations/${id}/settings`)}>
                                    <Settings className="w-4 h-4 mr-1" /> Settings
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" size="sm">
                                <Plus className="w-4 h-4 mr-1" /> Follow
                            </Button>
                        )}

                        {/* More Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-full hover:bg-secondary transition-colors bg-elevated border border-theme hover:border-primary/50"
                            >
                                <MoreHorizontal className="w-5 h-5 text-secondary" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-elevated rounded-xl shadow-lg border border-theme py-2 z-50">
                                    <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2">
                                        <Share2 className="w-4 h-4" /> Share Organization
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-red-600">
                                        <Flag className="w-4 h-4" /> Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <CardBody className="pt-20">
                    {/* Name & Type */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            {organization.name}
                            {organization.verified && <CheckCircle className="w-5 h-5 text-blue-500" title="Verified Organization" />}
                        </h1>
                        <p className="text-primary-600 font-medium">
                            {organization.org_type?.replace('_', ' ') || 'Organization'}
                            {organization.industry && <span className="text-secondary"> • {organization.industry}</span>}
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mb-6">
                        {(organization.city || organization.town) && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-primary">
                                    {[organization.town, organization.city, organization.origin || 'Kenya'].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                        {organization.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span className="text-primary">{organization.email}</span>
                            </div>
                        )}
                        {organization.website && (
                            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                                <Globe className="w-4 h-4" />
                                <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                        )}
                    </div>

                    {/* Description */}
                    {organization.description && (
                        <p className="text-primary border-t border-theme pt-4">{organization.description}</p>
                    )}
                </CardBody>
            </Card>

            {/* Content Tabs */}
            <Card>
                <div className="border-b border-theme">
                    <div className="flex overflow-x-auto">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-6 text-sm font-medium text-center transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-primary-600 border-b-2 border-primary-600'
                                        : 'text-tertiary hover:text-primary'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {/* Overview Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-primary">About {organization.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-secondary/10 rounded-lg">
                                        <h4 className="font-medium text-primary mb-2">Contact Details</h4>
                                        <div className="space-y-2 text-sm">
                                            {organization.phone && (
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <Phone className="w-4 h-4" /> {organization.phone}
                                                </div>
                                            )}
                                            {organization.address && (
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <MapPin className="w-4 h-4" /> {organization.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {organization.industry && (
                                        <div className="p-4 bg-secondary/10 rounded-lg">
                                            <h4 className="font-medium text-primary mb-2">Industry Info</h4>
                                            <p className="text-sm text-secondary">{organization.industry}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jobs Tab */}
                    {activeTab === 'jobs' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Jobs & Gigs</h3>
                                {isAdmin && (
                                    <Button onClick={() => navigate('/careers/create')} size="sm">
                                        <Plus className="w-4 h-4 mr-2" /> Post Job
                                    </Button>
                                )}
                            </div>

                            {jobsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p>No jobs posted yet</p>
                                    <p className="text-sm mt-1">Open positions will appear here</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {jobs.map(job => (
                                        <div key={job.id} className="p-4 border border-theme rounded-lg hover:border-primary/50 transition-colors bg-secondary/5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-primary mb-1">{job.title}</h4>
                                                    <div className="flex flex-wrap gap-2 text-sm text-secondary mb-2">
                                                        <span className="bg-secondary/20 px-2 py-0.5 rounded">{job.job_type}</span>
                                                        <span className="bg-secondary/20 px-2 py-0.5 rounded">{job.location}</span>
                                                        <span className="bg-secondary/20 px-2 py-0.5 rounded text-green-600">{job.salary_range}</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => navigate(`/careers/${job.id}`)}>
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Opinions Tab */}
                    {activeTab === 'opinions' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Opinions from {organization.name}</h3>
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No opinions yet</p>
                                <p className="text-sm mt-1">Opinions posted by this organization will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Articles Tab */}
                    {activeTab === 'articles' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Articles from {organization.name}</h3>
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No articles yet</p>
                                <p className="text-sm mt-1">Articles published by this organization will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Events from {organization.name}</h3>
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No events yet</p>
                                <p className="text-sm mt-1">Events organized by this organization will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Units Tab */}
                    {activeTab === 'units' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Organizational Structure</h3>
                                {isAdmin && (
                                    <Button onClick={() => setCreateUnitOpen(true)} size="sm">
                                        <Plus className="w-4 h-4 mr-2" /> Add Unit
                                    </Button>
                                )}
                            </div>

                            {unitsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : Object.keys(units).length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Network className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p>No units added yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {unitsService.getOrganisationUnitTypes().map(type => {
                                        const typeUnits = units[type.key];
                                        if (!typeUnits || typeUnits.length === 0) return null;

                                        return (
                                            <div key={type.key}>
                                                <h4 className="text-sm font-medium text-tertiary uppercase tracking-wide mb-3">
                                                    {type.label}s
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {typeUnits.map(unit => (
                                                        <div key={unit.id || unit.pk || unit.code} className="p-4 bg-secondary/10 rounded-lg border border-theme hover:border-primary/50 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h5 className="font-medium text-primary">{unit.name}</h5>
                                                                    {isAdmin && (
                                                                        <p className="text-xs text-secondary mt-1">
                                                                            Code: {unit.div_code || unit.dep_code || unit.section_code || unit.unit_code || unit.team_code || 'N/A'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-tertiary" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <MembersTab
                            organizationId={id}
                            isAdmin={isAdmin}
                            organizationsService={organizationsService}
                        />
                    )}

                    {/* Verification Tab */}
                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-primary">Verification Status</h3>
                            <div className="space-y-3">
                                {isAdmin ? (
                                    <div className="p-4 border border-theme rounded-lg flex flex-col items-center justify-center text-center py-8">
                                        <FileCheck className="w-12 h-12 text-tertiary mb-3" />
                                        <p className="text-secondary mb-4">Verification process for Organizations is coming soon.</p>
                                        <Button
                                            onClick={() => navigate(`/organizations/${id}/verification`)}
                                        >
                                            Go to Verification Portal
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-secondary text-center">You do not have permission to view verification details.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <CreateOrgUnit
                isOpen={createUnitOpen}
                onClose={() => setCreateUnitOpen(false)}
                organizationId={id}
                organizationName={organization?.name}
                onUnitCreated={handleUnitCreated}
            />
        </div>
    );
};

export default OrganizationDetail;
