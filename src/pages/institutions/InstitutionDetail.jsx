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
import institutionsService from '../../services/institutions.service';
import unitsService from '../../services/units.service';
import CreateUnit from './CreateUnit';
import PendingUnitsReview from '../../components/institutions/PendingUnitsReview';

const InstitutionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdmin, setIsAdmin] = useState(false);

    // Units state
    const [units, setUnits] = useState({});
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [createUnitOpen, setCreateUnitOpen] = useState(false);

    useEffect(() => {
        loadInstitution();
    }, [id]);

    const loadInstitution = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await institutionsService.getInstitution(id);
            setInstitution(data);

            // Check if current user is admin/creator
            const isCreator = data.created_by === user?.id;
            // Also check membership role if available
            setIsAdmin(isCreator || user?.is_staff);

        } catch (err) {
            console.error('Error loading institution:', err);
            setError('Failed to load institution details');
        } finally {
            setLoading(false);
        }
    };

    const loadUnits = async () => {
        setUnitsLoading(true);
        const unitTypes = unitsService.getInstitutionUnitTypes();
        const loadedUnits = {};

        for (const type of unitTypes) {
            try {
                const data = await unitsService.getInstitutionUnits(id, type.key);
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
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading institution...</span>
                </div>
            </div>
        );
    }

    if (error || !institution) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-gray-400">{error || 'Institution not found'}</p>
                    <Button onClick={() => navigate('/institutions')}>
                        Back to Institutions
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/institutions')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Institutions
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-violet-500/20 rounded-2xl">
                                <Building2 className="w-10 h-10 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    {institution.name}
                                </h1>
                                <div className="flex items-center gap-4 mt-2 text-gray-400">
                                    <span className="px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-sm">
                                        {institution.institution_type || 'Institution'}
                                    </span>
                                    {institution.city && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {institution.city}, {institution.country}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <Button
                                variant="ghost"
                                onClick={() => navigate(`/institutions/${id}/settings`)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-1 -mb-px overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'border-violet-500 text-violet-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-300'
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
                                    <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                                    <p className="text-gray-400">
                                        {institution.description || 'No description available.'}
                                    </p>
                                </CardBody>
                            </Card>

                            {isAdmin && (
                                <PendingUnitsReview
                                    institutionId={id}
                                    isAdmin={isAdmin}
                                />
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
                                    <div className="space-y-3">
                                        {institution.email && (
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <Mail className="w-4 h-4 text-violet-400" />
                                                <span>{institution.email}</span>
                                            </div>
                                        )}
                                        {institution.phone && (
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <Phone className="w-4 h-4 text-violet-400" />
                                                <span>{institution.phone}</span>
                                            </div>
                                        )}
                                        {institution.website && (
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <Globe className="w-4 h-4 text-violet-400" />
                                                <a
                                                    href={institution.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-violet-400 transition-colors"
                                                >
                                                    {institution.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                                    <div className="text-gray-400 space-y-1">
                                        <p>{institution.address}</p>
                                        <p>{institution.city}, {institution.state_province}</p>
                                        <p>{institution.country} {institution.postal_code}</p>
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
                                <h2 className="text-xl font-semibold text-white">
                                    Organizational Structure
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    View and manage departments, faculties, and other units
                                </p>
                            </div>
                            <Button onClick={() => setCreateUnitOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Unit
                            </Button>
                        </div>

                        {/* Pending Units Review for Admins */}
                        {isAdmin && (
                            <PendingUnitsReview
                                institutionId={id}
                                isAdmin={isAdmin}
                            />
                        )}

                        {/* Units List */}
                        {unitsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                            </div>
                        ) : Object.keys(units).length === 0 ? (
                            <Card>
                                <CardBody className="text-center py-12">
                                    <Network className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        No Units Yet
                                    </h3>
                                    <p className="text-gray-400 mb-4">
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
                                {unitsService.getInstitutionUnitTypes().map(type => {
                                    const typeUnits = units[type.key];
                                    if (!typeUnits || typeUnits.length === 0) return null;

                                    return (
                                        <div key={type.key}>
                                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                                                {type.label}s ({typeUnits.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {typeUnits.map(unit => (
                                                    <Card key={unit.id} className="hover:border-violet-500/50 transition-colors cursor-pointer">
                                                        <CardBody className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="text-white font-medium">
                                                                        {unit.name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {unit.branch_code || unit.faculty_code || unit.dep_code || unit.programme_code || unit.admin_code || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                                            </div>
                                                            {unit.description && (
                                                                <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                                                    {unit.description}
                                                                </p>
                                                            )}
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
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">
                                Members Management
                            </h3>
                            <p className="text-gray-400">
                                Member management will be available soon.
                            </p>
                        </CardBody>
                    </Card>
                )}

                {/* Verification Tab */}
                {activeTab === 'verification' && (
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Verification Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-violet-400" />
                                        <span className="text-white">Email Verification</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${institution.email_verified
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {institution.email_verified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-violet-400" />
                                        <span className="text-white">Website Verification</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${institution.website_verified
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {institution.website_verified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <FileCheck className="w-5 h-5 text-violet-400" />
                                        <span className="text-white">Documents</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${institution.documents_verified
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {institution.documents_verified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {isAdmin && !institution.documents_verified && (
                                <Button
                                    className="mt-6 w-full"
                                    onClick={() => navigate(`/institutions/${id}/verification`)}
                                >
                                    Continue Verification
                                </Button>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Create Unit Modal */}
            <CreateUnit
                isOpen={createUnitOpen}
                onClose={() => setCreateUnitOpen(false)}
                institutionId={id}
                institutionName={institution.name}
                onUnitCreated={handleUnitCreated}
            />
        </div>
    );
};

export default InstitutionDetail;
