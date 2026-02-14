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
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Learning Paths</h1>
                    <p className="text-secondary mt-1">Explore specializations and learning stacks</p>
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
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${view === 'specializations'
                        ? 'bg-primary-600 text-white'
                        : 'bg-elevated text-secondary border border-theme hover:bg-secondary/5'
                        }`}
                >
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Specializations
                </button>
                <button
                    onClick={() => setView('stacks')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${view === 'stacks'
                        ? 'bg-primary-600 text-white'
                        : 'bg-elevated text-secondary border border-theme hover:bg-secondary/5'
                        }`}
                >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Stacks
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                <input
                    type="text"
                    placeholder={`Search ${view}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        {view === 'specializations' ? (
                            <>
                                <GraduationCap className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No specializations found</p>
                            </>
                        ) : (
                            <>
                                <BookOpen className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No stacks found</p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-elevated border-theme">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">Create Specialization</h2>
                                <button onClick={() => setShowCreateSpecModal(false)} className="text-secondary hover:text-primary">
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
                                    <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                    <textarea
                                        value={specFormData.description}
                                        onChange={(e) => setSpecFormData({ ...specFormData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe this specialization..."
                                        className="w-full px-4 py-2 border border-theme bg-background text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-elevated border-theme">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">Create Stack</h2>
                                <button onClick={() => setShowCreateStackModal(false)} className="text-secondary hover:text-primary">
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
                                    <label className="block text-sm font-medium text-secondary mb-1">Specialization</label>
                                    <select
                                        value={stackFormData.specialization}
                                        onChange={(e) => setStackFormData({ ...stackFormData, specialization: e.target.value })}
                                        className="w-full px-4 py-2 border border-theme bg-background text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    >
                                        <option value="">Select a specialization (optional)</option>
                                        {specializations.map((spec) => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                    <textarea
                                        value={stackFormData.description}
                                        onChange={(e) => setStackFormData({ ...stackFormData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe this stack..."
                                        className="w-full px-4 py-2 border border-theme bg-background text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
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
    <Card className="hover:shadow-md transition-shadow border border-theme bg-elevated">
        <CardBody>
            <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-primary">{specialization.name}</h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">
                        {specialization.description || 'No description available'}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-secondary">
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
    <Card className="hover:shadow-md transition-shadow border border-theme bg-elevated">
        <CardBody>
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        In Progress
                    </span>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-primary">{stack.name}</h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">
                        {stack.description || 'No description available'}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary">Progress</span>
                        <span className="font-medium text-primary">0%</span>
                    </div>
                    <div className="w-full bg-secondary/20 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
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
