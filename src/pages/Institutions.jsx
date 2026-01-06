import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/common/Card';
import { Building2, MapPin, Users, Search } from 'lucide-react';
import institutionsService from '../services/institutions.service';

const Institutions = () => {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadInstitutions();
    }, []);

    const loadInstitutions = async () => {
        setLoading(true);
        try {
            const data = await institutionsService.getAll();
            setInstitutions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading institutions:', error);
            setInstitutions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredInstitutions = institutions.filter(inst =>
        inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Institutions</h1>
                <p className="text-gray-600 mt-1">Browse universities and learning institutions</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search institutions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Institutions Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredInstitutions.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No institutions found</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInstitutions.map((inst) => (
                        <InstitutionCard key={inst.id} institution={inst} />
                    ))}
                </div>
            )}
        </div>
    );
};

const InstitutionCard = ({ institution }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardBody>
            <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{institution.name}</h3>
                    {institution.abbreviation && (
                        <p className="text-sm text-gray-500">({institution.abbreviation})</p>
                    )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                    {institution.city && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{institution.city}, {institution.origin || 'Kenya'}</span>
                        </div>
                    )}
                    {institution.academic_disc && (
                        <p className="text-xs text-gray-500 line-clamp-2">{institution.academic_disc}</p>
                    )}
                </div>
            </div>
        </CardBody>
    </Card>
);

export default Institutions;
