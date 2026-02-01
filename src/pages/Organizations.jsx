import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Briefcase, MapPin, Users, Search, Plus, X } from 'lucide-react';
import organizationsService from '../services/organizations.service';

const Organizations = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        org_type: 'business',
        industry: '',
        city: '',
        origin: 'Kenya',
    });

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        setLoading(true);
        try {
            const data = await organizationsService.getAll();
            setOrganizations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading organizations:', error);
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await organizationsService.create(formData);
            setShowCreateModal(false);
            setFormData({ name: '', abbreviation: '', org_type: 'business', industry: '', city: '', origin: 'Kenya' });
            loadOrganizations();
        } catch (error) {
            console.error('Failed to create organization:', error);
            alert('Failed to create organization');
        }
    };

    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || org.org_type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-600 mt-1">Browse companies and organizations</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/organizations/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'business', 'ngo', 'go', 'ministry', 'other'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Organizations Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredOrganizations.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No organizations found</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrganizations.map((org) => (
                        <OrganizationCard key={org.id} organization={org} />
                    ))}
                </div>
            )}

            {/* Create Organization Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        // Close modal when clicking on backdrop
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                        }
                    }}
                >
                    <Card className="w-full max-w-lg relative z-[51]" onClick={(e) => e.stopPropagation()}>
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <Input
                                    label="Organization Name *"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Enter organization name"
                                />
                                <Input
                                    label="Abbreviation"
                                    value={formData.abbreviation}
                                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                                    placeholder="e.g., ACME"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                                    <select
                                        value={formData.org_type}
                                        onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="business">Business</option>
                                        <option value="ngo">NGO</option>
                                        <option value="go">Government Organization</option>
                                        <option value="ministry">Ministry</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <Input
                                    label="Industry"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="e.g., Technology, Healthcare"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="City"
                                    />
                                    <Input
                                        label="Country"
                                        value={formData.origin}
                                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                        placeholder="Country"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Organization
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

const OrganizationCard = ({ organization }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardBody>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {organization.org_type?.replace('_', ' ') || 'Other'}
                    </span>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{organization.name}</h3>
                    {organization.abbreviation && (
                        <p className="text-sm text-gray-500">({organization.abbreviation})</p>
                    )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                    {organization.city && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{organization.city}, {organization.origin || 'Kenya'}</span>
                        </div>
                    )}
                    {organization.industry && (
                        <p className="text-xs text-gray-500 line-clamp-2">Industry: {organization.industry}</p>
                    )}
                    {organization.members?.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{organization.members.length} members</span>
                        </div>
                    )}
                </div>
            </div>
        </CardBody>
    </Card>
);

export default Organizations;
