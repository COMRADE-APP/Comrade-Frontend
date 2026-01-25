import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { GraduationCap, BookOpen, CheckCircle, Award, Users, Search, Plus, X } from 'lucide-react';
import specializationsService from '../services/specializations.service';

const Specializations = () => {
    const [specializations, setSpecializations] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('specializations'); // specializations or stacks
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateSpecModal, setShowCreateSpecModal] = useState(false);
    const [showCreateStackModal, setShowCreateStackModal] = useState(false);
    const [specFormData, setSpecFormData] = useState({ name: '', description: '' });
    const [stackFormData, setStackFormData] = useState({ name: '', description: '', specialization: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [specs, stacksData] = await Promise.all([
                specializationsService.getAll().catch(() => []),
                specializationsService.getAllStacks().catch(() => []),
            ]);
            setSpecializations(Array.isArray(specs) ? specs : []);
            setStacks(Array.isArray(stacksData) ? stacksData : []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSpec = async (e) => {
        e.preventDefault();
        try {
            await specializationsService.create(specFormData);
            setShowCreateSpecModal(false);
            setSpecFormData({ name: '', description: '' });
            loadData();
        } catch (error) {
            console.error('Failed to create specialization:', error);
            alert('Failed to create specialization');
        }
    };

    const handleCreateStack = async (e) => {
        e.preventDefault();
        try {
            await specializationsService.createStack(stackFormData);
            setShowCreateStackModal(false);
            setStackFormData({ name: '', description: '', specialization: '' });
            loadData();
        } catch (error) {
            console.error('Failed to create stack:', error);
            alert('Failed to create stack');
        }
    };

    const handleJoin = async (id) => {
        try {
            await specializationsService.join(id);
            alert('Successfully joined specialization!');
            loadData();
        } catch (error) {
            alert('Failed to join specialization');
        }
    };

    const handleCompleteStack = async (id) => {
        try {
            await specializationsService.completeStack(id);
            alert('Congratulations on completing the stack!');
            loadData();
        } catch (error) {
            alert('Failed to mark stack as complete');
        }
    };

    const filteredItems = view === 'specializations'
        ? specializations.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : stacks.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Learning Paths</h1>
                    <p className="text-gray-600 mt-1">Explore specializations and learning stacks</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => setShowCreateSpecModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Specialization
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateStackModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Stack
                    </Button>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setView('specializations')}
                    className={`px-6 py-2 rounded-lg font-medium ${view === 'specializations'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Specializations
                </button>
                <button
                    onClick={() => setView('stacks')}
                    className={`px-6 py-2 rounded-lg font-medium ${view === 'stacks'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Stacks
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder={`Search ${view}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        {view === 'specializations' ? (
                            <>
                                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No specializations found</p>
                            </>
                        ) : (
                            <>
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No stacks found</p>
                            </>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {view === 'specializations'
                        ? filteredItems.map((spec) => (
                            <SpecializationCard key={spec.id} specialization={spec} onJoin={handleJoin} />
                        ))
                        : filteredItems.map((stack) => (
                            <StackCard key={stack.id} stack={stack} onComplete={handleCompleteStack} />
                        ))}
                </div>
            )}

            {/* Create Specialization Modal */}
            {showCreateSpecModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create Specialization</h2>
                                <button onClick={() => setShowCreateSpecModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateSpec} className="space-y-4">
                                <Input
                                    label="Specialization Name *"
                                    value={specFormData.name}
                                    onChange={(e) => setSpecFormData({ ...specFormData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Data Science"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={specFormData.description}
                                        onChange={(e) => setSpecFormData({ ...specFormData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe this specialization..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateSpecModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Specialization
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Create Stack Modal */}
            {showCreateStackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create Stack</h2>
                                <button onClick={() => setShowCreateStackModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateStack} className="space-y-4">
                                <Input
                                    label="Stack Name *"
                                    value={stackFormData.name}
                                    onChange={(e) => setStackFormData({ ...stackFormData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Python for Data Science"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                    <select
                                        value={stackFormData.specialization}
                                        onChange={(e) => setStackFormData({ ...stackFormData, specialization: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select a specialization (optional)</option>
                                        {specializations.map((spec) => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={stackFormData.description}
                                        onChange={(e) => setStackFormData({ ...stackFormData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe this stack..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateStackModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Stack
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

const SpecializationCard = ({ specialization, onJoin }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardBody>
            <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{specialization.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {specialization.description || 'No description available'}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{specialization.stacks?.length || 0} stacks</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{specialization.members?.length || 0} members</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => onJoin(specialization.id)}
                >
                    Join Specialization
                </Button>
            </div>
        </CardBody>
    </Card>
);

const StackCard = ({ stack, onComplete }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardBody>
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        In Progress
                    </span>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{stack.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {stack.description || 'No description available'}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                        View Details
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={() => onComplete(stack.id)}>
                        Complete
                    </Button>
                </div>
            </div>
        </CardBody>
    </Card>
);

export default Specializations;
