import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Building2, Search, Plus, Users, MapPin, Globe, Edit, Trash2, X, Eye } from 'lucide-react';
import institutionsService from '../services/institutions.service';

const Institutions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        about: '',
        location: '',
        website: '',
    });

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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await institutionsService.create(formData);
            setShowCreateModal(false);
            setFormData({ name: '', about: '', location: '', website: '' });
            loadInstitutions();
        } catch (error) {
            console.error('Failed to create institution:', error);
            alert('Failed to create institution');
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
        setSelectedInstitution(institution);
        setShowDetailModal(true);
    };

    const filteredInstitutions = institutions.filter(inst =>
        inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Institutions</h1>
                    <p className="text-gray-600 mt-1">Browse and manage educational institutions</p>
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
                        <p className="text-gray-500">
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Add New Institution</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <Input
                                    label="Institution Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="University of..."
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                                    <textarea
                                        value={formData.about}
                                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Brief description..."
                                    />
                                </div>
                                <Input
                                    label="Location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="City, Country"
                                />
                                <Input
                                    label="Website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://..."
                                    type="url"
                                />
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Institution
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedInstitution && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl">
                        <CardBody>
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <Building2 className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedInstitution.name}</h2>
                                        {selectedInstitution.location && (
                                            <p className="text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-4 h-4" />
                                                {selectedInstitution.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedInstitution.about && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
                                    <p className="text-gray-600">{selectedInstitution.about}</p>
                                </div>
                            )}

                            {selectedInstitution.website && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Website</h3>
                                    <a
                                        href={selectedInstitution.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                    >
                                        <Globe className="w-4 h-4" />
                                        {selectedInstitution.website}
                                    </a>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                                    Close
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const InstitutionCard = ({ institution, onView, onDelete, canManage }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardBody>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    {canManage && (
                        <button
                            onClick={onDelete}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete institution"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{institution.name}</h3>
                    {institution.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {institution.location}
                        </p>
                    )}
                </div>

                {institution.about && (
                    <p className="text-sm text-gray-600 line-clamp-2">{institution.about}</p>
                )}

                <Button variant="outline" className="w-full" onClick={onView}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                </Button>
            </div>
        </CardBody>
    </Card>
);

export default Institutions;
