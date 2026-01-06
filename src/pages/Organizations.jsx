import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/common/Card';
import { Briefcase, MapPin, Users, Search } from 'lucide-react';
import organizationsService from '../services/organizations.service';

const Organizations = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

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

    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || org.org_type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Organizations</h1>
                <p className="text-gray-600 mt-1">Browse companies and organizations</p>
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
