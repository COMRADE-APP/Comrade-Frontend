import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Building2, MapPin, Globe, Mail, Phone, Users, Plus,
    ChevronRight, Settings, Network, FileCheck, ArrowLeft,
    Loader2, AlertCircle
} from 'lucide-react';
import organizationsService from '../../services/organizations.service';
import unitsService from '../../services/units.service';
import CreateOrgUnit from './CreateOrgUnit';

const OrganizationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdmin, setIsAdmin] = useState(false);

    // Units state
    const [units, setUnits] = useState({});
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [createUnitOpen, setCreateUnitOpen] = useState(false);

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

    useEffect(() => {
        if (activeTab === 'units' && id) {
            loadUnits();
        }
    }, [activeTab, id]);

    const handleUnitCreated = (unit) => {
        // Reload units after creation
        loadUnits();
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'units', label: 'Units & Structure', icon: Network },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'verification', label: 'Verification', icon: FileCheck },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading organization...</span>
                </div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="text-gray-600">{error || 'Organization not found'}</p>
                    <Button onClick={() => navigate('/organizations')}>
                        Back to Organizations
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/organizations')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Organizations
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
                                <Building2 className="w-10 h-10 text-primary-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {organization.name}
                                </h1>
                                <div className="flex items-center gap-4 mt-2 text-gray-500">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-sm font-medium">
                                        {organization.org_type || 'Organization'}
                                    </span>
                                    {organization.town && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {organization.town}{organization.city ? `, ${organization.city}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/organizations/${id}/settings`)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-1 -mb-px overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap font-medium text-sm
                                        ${activeTab === tab.id
                                            ? 'border-primary-600 text-primary-700'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                                    <p className="text-gray-600">
                                        {organization.description || `${organization.name} is a ${organization.industry || ''} organization based in ${organization.origin || 'Kenya'}.`}
                                    </p>
                                    {organization.industry && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="text-sm text-gray-500 mb-1">Industry</div>
                                            <div className="font-medium text-gray-900">{organization.industry}</div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                                    <div className="space-y-3">
                                        {organization.email && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Mail className="w-4 h-4 text-primary-600" />
                                                <span>{organization.email}</span>
                                            </div>
                                        )}
                                        {organization.phone && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Phone className="w-4 h-4 text-primary-600" />
                                                <span>{organization.phone}</span>
                                            </div>
                                        )}
                                        {organization.website && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Globe className="w-4 h-4 text-primary-600" />
                                                <a
                                                    href={organization.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-primary-600 transition-colors"
                                                >
                                                    Website
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                                    <div className="text-gray-600 space-y-1">
                                        {organization.address && <p>{organization.address}</p>}
                                        <p>{[organization.town, organization.city].filter(Boolean).join(', ')}</p>
                                        <p>{[organization.origin, organization.postal_code].filter(Boolean).join(' - ')}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Units Tab */}
                {activeTab === 'units' && (
                    <div className="space-y-6">
                        {/* Header with Add Button */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Organizational Structure
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    View and manage divisions, departments, and other units
                                </p>
                            </div>
                            <Button onClick={() => setCreateUnitOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Unit
                            </Button>
                        </div>

                        {/* Units List */}
                        {unitsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                            </div>
                        ) : Object.keys(units).length === 0 ? (
                            <Card>
                                <CardBody className="text-center py-12">
                                    <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No Units Yet
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Start building your organizational structure by adding units
                                    </p>
                                    <Button onClick={() => setCreateUnitOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Unit
                                    </Button>
                                </CardBody>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {unitsService.getOrganisationUnitTypes().map(type => {
                                    const typeUnits = units[type.key];
                                    if (!typeUnits || typeUnits.length === 0) return null;

                                    return (
                                        <div key={type.key}>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-1 border-l-4 border-primary-500">
                                                {type.label}s ({typeUnits.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {typeUnits.map(unit => (
                                                    <Card key={unit.id || unit.pk || unit.code} className="hover:shadow-md transition-shadow cursor-pointer">
                                                        <CardBody className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="text-gray-900 font-bold">
                                                                        {unit.name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500 mt-1 font-mono">
                                                                        {unit.div_code || unit.dep_code || unit.section_code || unit.unit_code || unit.team_code || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        </CardBody>
                                                    </Card>
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
                    <Card>
                        <CardBody className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Members Management
                            </h3>
                            <p className="text-gray-500">
                                Member management will be available soon.
                            </p>
                        </CardBody>
                    </Card>
                )}

                {/* Verification Tab */}
                {activeTab === 'verification' && (
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Verification Status
                            </h3>
                            <div className="space-y-4">
                                {/* Only show verification actions if admin */}
                                {isAdmin ? (
                                    <div className="text-center py-8">
                                        <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">Verification process for Organizations is coming soon.</p>
                                        <Button
                                            onClick={() => navigate(`/organizations/${id}/verification`)}
                                        >
                                            Go to Verification Portal
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">You do not have permission to view verification details.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Create Unit Modal */}
            <CreateOrgUnit
                isOpen={createUnitOpen}
                onClose={() => setCreateUnitOpen(false)}
                organizationId={id}
                organizationName={organization.name}
                onUnitCreated={handleUnitCreated}
            />
        </div>
    );
};

export default OrganizationDetail;
