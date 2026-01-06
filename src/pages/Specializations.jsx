import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { GraduationCap, BookOpen, CheckCircle, Award, Users, Search } from 'lucide-react';
import specializationsService from '../services/specializations.service';

const Specializations = () => {
    const [specializations, setSpecializations] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('specializations'); // specializations or stacks
    const [searchTerm, setSearchTerm] = useState('');

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
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Learning Paths</h1>
                <p className="text-gray-600 mt-1">Explore specializations and learning stacks</p>
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
