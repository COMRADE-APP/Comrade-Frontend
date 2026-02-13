import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

import { Building2, Search, Plus, Users, MapPin, Globe, Edit, Trash2, X, Eye } from 'lucide-react';
import institutionsService from '../services/institutions.service';

const Institutions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // All authenticated users can create institutions
    const canManageInstitutions = true;

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



    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this institution?')) return;
        try {
            await institutionsService.delete(id);
            loadInstitutions();
        } catch (error) {
            console.error('Failed to delete institution:', error);
            alert('Failed to delete institution');
        }
    };

    const viewDetails = (institution) => {
        navigate(`/institutions/${institution.id}`);
    };

    const filteredInstitutions = institutions.filter(inst =>
        (inst.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Institutions</h1>
                    <p className="text-secondary mt-1">Browse and manage educational institutions</p>
                </div>
                {canManageInstitutions && (
                    <Button variant="primary" onClick={() => navigate('/institutions/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Institution
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search institutions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme bg-elevated rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-primary placeholder-secondary"
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
                        <Building2 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">
                            {searchTerm ? 'No institutions found matching your search.' : 'No institutions available yet.'}
                        </p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInstitutions.map((institution) => (
                        <InstitutionCard
                            key={institution.id}
                            institution={institution}
                            onView={() => viewDetails(institution)}
                            onDelete={() => handleDelete(institution.id)}
                            canManage={canManageInstitutions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InstitutionCard = ({ institution, onView, onDelete, canManage }) => (
    <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onView}
    >
        <CardBody>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    {canManage && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1 text-secondary hover:text-red-600 transition-colors"
                            title="Delete institution"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-primary line-clamp-1 group-hover:text-primary-600 transition-colors">{institution.name}</h3>
                    {institution.location && (
                        <p className="text-sm text-secondary flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {institution.location}
                        </p>
                    )}
                </div>

                {institution.about && (
                    <p className="text-sm text-secondary line-clamp-2">{institution.about}</p>
                )}

                <Button variant="primary" className="w-full mt-2">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                </Button>
            </div>
        </CardBody>
    </Card>
);

export default Institutions;
