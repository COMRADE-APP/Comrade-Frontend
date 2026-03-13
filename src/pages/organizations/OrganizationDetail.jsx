import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Building2, MapPin, Globe, Mail, Phone, Users, Plus,
    ChevronRight, Settings, Network, FileCheck, ArrowLeft,
    Loader2, AlertCircle, Camera, MoreHorizontal,
    Share2, Flag, CheckCircle, BookOpen, Calendar, MessageCircle, Briefcase,
    BarChart3, TrendingUp, Eye, UserPlus, Search, Shield, X
} from 'lucide-react';
import organizationsService from '../../services/organizations.service';
import unitsService from '../../services/units.service';
import { careersService } from '../../services/careers.service';
import CreateOrgUnit from './CreateOrgUnit';

const TABS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'opinions', label: 'Opinions', icon: MessageCircle },
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'units', label: 'Units & Structure', icon: Network },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'verification', label: 'Verification', icon: FileCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const OrganizationDetail = () => {
    const { id, tab } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const activeTab = tab || 'overview';
    const [isAdmin, setIsAdmin] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    // Units state
    const [units, setUnits] = useState({});
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [createUnitOpen, setCreateUnitOpen] = useState(false);

    // Jobs state
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // Members state
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
    const [inviting, setInviting] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    // Analytics state
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // File inputs
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    useEffect(() => {
        loadOrganization();
    }, [id]);

    const setActiveTab = (tabId) => {
        navigate(`/organizations/${id}/${tabId}`, { replace: true });
    };

    const loadOrganization = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await organizationsService.getById(id);
            setOrganization(data);

            const isCreator = data.created_by === user?.id;
            const userRole = data.current_user_role;
            const hasEditPermission = isCreator || user?.is_staff || ['creator', 'admin', 'moderator'].includes(userRole);

            setIsAdmin(hasEditPermission);
            setIsFollowing(data.is_following);
            setFollowersCount(data.followers_count || 0);
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

    const loadMembers = async () => {
        setMembersLoading(true);
        try {
            const data = await organizationsService.getMembers(id);
            setMembers(Array.isArray(data) ? data : data?.results || data?.members || []);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'units' && id) {
            loadUnits();
        } else if (activeTab === 'jobs' && id) {
            loadJobs();
        } else if (activeTab === 'members' && id) {
            loadMembers();
        } else if (activeTab === 'analytics' && id) {
            if (Object.keys(units).length === 0) loadUnits();
            if (jobs.length === 0) loadJobs();
            if (members.length === 0) loadMembers();
            setAnalyticsLoading(false);
        }
    }, [activeTab, id]);

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        if (type === 'avatar') {
            formData.append('profile_picture', file);
        } else {
            formData.append('cover_picture', file);
        }

        try {
            await organizationsService.partialUpdate(id, formData);
            loadOrganization();
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await organizationsService.unfollow(id);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                await organizationsService.follow(id);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteData.email.trim()) return;
        setInviting(true);
        try {
            await organizationsService.inviteMember(id, inviteData);
            setShowInviteModal(false);
            setInviteData({ email: '', role: 'member' });
            loadMembers();
            alert('Invitation sent successfully!');
        } catch (error) {
            console.error('Error inviting member:', error);
            alert(error.response?.data?.error || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const filteredMembers = members.filter(m => {
        if (!memberSearch) return true;
        const name = `${m.first_name || m.user?.first_name || ''} ${m.last_name || m.user?.last_name || ''}`.toLowerCase();
        const email = (m.email || m.user?.email || '').toLowerCase();
        return name.includes(memberSearch.toLowerCase()) || email.includes(memberSearch.toLowerCase());
    });

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
                    <div
                        className="h-48 md:h-64 bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 relative"
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

                    {/* Actions */}
                    <div className="absolute -bottom-6 right-4 flex items-center gap-2">
                        {isAdmin ? (
                            <Button variant="primary" size="sm" onClick={() => navigate(`/organizations/${id}/settings`)}>
                                <Settings className="w-4 h-4 mr-1" /> Settings
                            </Button>
                        ) : (
                            <Button
                                variant={isFollowing ? "outline" : "primary"}
                                size="sm"
                                onClick={handleFollow}
                            >
                                {isFollowing ? (
                                    <><CheckCircle className="w-4 h-4 mr-1" /> Following</>
                                ) : (
                                    <><Plus className="w-4 h-4 mr-1" /> Follow</>
                                )}
                            </Button>
                        )}

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
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            {organization.name}
                            {organization.documents_verified && <CheckCircle className="w-5 h-5 text-blue-500" title="Verified Organization" />}
                        </h1>
                        <p className="text-primary-600 font-medium">{organization.organization_type || 'Organization'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mb-6">
                        {organization.city && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-primary">{organization.city}, {organization.country}</span>
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
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span className="text-primary">{followersCount} followers</span>
                        </div>
                    </div>

                    {organization.description && (
                        <p className="text-primary border-t border-theme pt-4">{organization.description}</p>
                    )}
                </CardBody>
            </Card>

            {/* Content Tabs */}
            <Card>
                <div className="border-b border-theme">
                    <div className="flex overflow-x-auto">
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            if ((t.id === 'analytics' || t.id === 'verification') && !isAdmin) return null;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-2 py-4 px-6 text-sm font-medium text-center transition-colors whitespace-nowrap ${activeTab === t.id
                                        ? 'text-primary-600 border-b-2 border-primary-600'
                                        : 'text-tertiary hover:text-primary'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
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

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                                            <p className="text-2xl font-bold text-primary">{followersCount}</p>
                                            <p className="text-xs text-secondary">Followers</p>
                                        </div>
                                        <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20 text-center">
                                            <p className="text-2xl font-bold text-primary">{Object.values(units).reduce((s, a) => s + a.length, 0)}</p>
                                            <p className="text-xs text-secondary">Units</p>
                                        </div>
                                    </div>
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
                                    <Button onClick={() => navigate(`/careers/create?organization=${id}&name=${encodeURIComponent(organization.name)}`)} size="sm">
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
                                {isAdmin && (
                                    <Button onClick={() => navigate(`/opinions?organization=${id}`)} size="sm">
                                        <Plus className="w-4 h-4 mr-2" /> Post Opinion
                                    </Button>
                                )}
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No opinions yet</p>
                            </div>
                        </div>
                    )}

                    {/* Articles Tab */}
                    {activeTab === 'articles' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Articles from {organization.name}</h3>
                                {isAdmin && (
                                    <Button onClick={() => navigate(`/articles/create?organization=${id}`)} size="sm">
                                        <Plus className="w-4 h-4 mr-2" /> Write Article
                                    </Button>
                                )}
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No articles yet</p>
                            </div>
                        </div>
                    )}

                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">Events from {organization.name}</h3>
                                {isAdmin && (
                                    <Button onClick={() => navigate(`/events/create?organization=${id}`)} size="sm">
                                        <Plus className="w-4 h-4 mr-2" /> Create Event
                                    </Button>
                                )}
                            </div>
                            <div className="text-center py-12 text-secondary">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                <p>No events yet</p>
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
                                                        <div
                                                            key={unit.id}
                                                            className="p-4 bg-secondary/10 rounded-lg border border-theme hover:border-primary/50 transition-colors cursor-pointer group"
                                                            onClick={() => navigate(`/organizations/${id}/units/${type.key}/${unit.id}`)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h5 className="font-medium text-primary group-hover:text-primary-600 transition-colors">{unit.name}</h5>
                                                                    {isAdmin && (
                                                                        <p className="text-xs text-secondary mt-1">Code: {unit.branch_code || unit.division_code || unit.dep_code || 'N/A'}</p>
                                                                    )}
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors" />
                                                            </div>
                                                            {isAdmin && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button
                                                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); }}
                                                                    >
                                                                        <Shield className="w-3 h-3 inline mr-1" />
                                                                        Act as unit
                                                                    </button>
                                                                </div>
                                                            )}
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-lg font-semibold text-primary">Members ({members.length})</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-secondary border border-theme rounded-lg text-primary text-sm outline-none focus:ring-2 focus:ring-primary/20 w-48"
                                        />
                                    </div>
                                    {isAdmin && (
                                        <Button onClick={() => setShowInviteModal(true)} size="sm">
                                            <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {membersLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p>{memberSearch ? 'No matching members found' : 'No members yet'}</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredMembers.map((member, idx) => {
                                        const memberUser = member.user || member;
                                        const displayName = `${memberUser.first_name || ''} ${memberUser.last_name || ''}`.trim() || memberUser.email || 'Unknown';
                                        const role = member.role || member.membership_role || 'member';

                                        return (
                                            <div key={idx} className="p-4 bg-secondary/5 border border-theme rounded-lg flex items-center justify-between hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                                        {displayName[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary text-sm">{displayName}</p>
                                                        <p className="text-xs text-secondary">{memberUser.email || ''}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                    role === 'admin' || role === 'creator' ? 'bg-violet-500/10 text-violet-500' :
                                                    role === 'moderator' ? 'bg-blue-500/10 text-blue-500' :
                                                    role === 'staff' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-secondary text-secondary'
                                                }`}>
                                                    {role}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verification Tab */}
                    {activeTab === 'verification' && isAdmin && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-primary">Verification Status</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Email Verification', icon: Mail, key: 'email_verified' },
                                    { label: 'Website Verification', icon: Globe, key: 'website_verified' },
                                    { label: 'Document Verification', icon: FileCheck, key: 'documents_verified' },
                                ].map(item => (
                                    <div key={item.key} className="p-4 border border-theme rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 text-tertiary" />
                                            <span className="text-primary">{item.label}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${organization[item.key] ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            {organization[item.key] ? 'Verified' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {!organization.documents_verified && (
                                <div className="mt-4 flex gap-3">
                                    <Button onClick={() => navigate(`/organizations/${id}/verification`)}>
                                        <FileCheck className="w-4 h-4 mr-2" /> Continue Verification
                                    </Button>
                                    {!organization.email_verified && (
                                        <Button variant="outline" onClick={async () => {
                                            try {
                                                await organizationsService.sendEmailVerification(id);
                                                alert('Verification email sent!');
                                            } catch (e) {
                                                alert('Failed to send verification email');
                                            }
                                        }}>
                                            <Mail className="w-4 h-4 mr-2" /> Send Verification Email
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && isAdmin && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" /> Organization Analytics
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Followers', value: followersCount, color: 'emerald', icon: Users },
                                    { label: 'Members', value: members.length, color: 'teal', icon: UserPlus },
                                    { label: 'Units', value: Object.values(units).reduce((s, a) => s + a.length, 0), color: 'cyan', icon: Network },
                                    { label: 'Jobs Posted', value: jobs.length, color: 'orange', icon: Briefcase },
                                ].map((stat, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                                            <span className="text-xs text-secondary">{stat.label}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-secondary/10 rounded-lg border border-theme">
                                <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Verification Status
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {['email_verified', 'website_verified', 'documents_verified'].map(key => (
                                        <span key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${organization[key] ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}: {organization[key] ? '✓' : '⏳'}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-secondary/10 rounded-lg border border-theme">
                                <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Unit Breakdown
                                </h4>
                                {Object.keys(units).length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {unitsService.getOrganisationUnitTypes().map(type => {
                                            const count = (units[type.key] || []).length;
                                            if (count === 0) return null;
                                            return (
                                                <div key={type.key} className="flex items-center justify-between p-2 bg-elevated rounded-md">
                                                    <span className="text-sm text-secondary capitalize">{type.label}s</span>
                                                    <span className="font-bold text-primary">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-secondary">No units created yet</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <UserPlus className="w-5 h-5" /> Invite Member
                                </h3>
                                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-secondary rounded-full">
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="member@example.com"
                                        className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Role</label>
                                    <select
                                        value={inviteData.role}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="member">Member</option>
                                        <option value="staff">Staff</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleInviteMember} disabled={inviting || !inviteData.email.trim()}>
                                        {inviting ? 'Sending...' : 'Send Invitation'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            <CreateOrgUnit
                isOpen={createUnitOpen}
                onClose={() => setCreateUnitOpen(false)}
                organizationId={id}
                organizationName={organization?.name}
                onUnitCreated={() => loadUnits()}
            />
        </div>
    );
};

export default OrganizationDetail;
