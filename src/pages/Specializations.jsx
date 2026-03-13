import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { GraduationCap, BookOpen, CheckCircle, Award, Users, Search, Plus, X } from 'lucide-react';
import specializationsService from '../services/specializations.service';
import { ROUTES } from '../constants/routes';

const Specializations = () => {
    const navigate = useNavigate();
    const [specializations, setSpecializations] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('specializations'); // specializations, courses, masterclasses, or stacks
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

    const filteredItems = view === 'stacks'
        ? stacks.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : specializations.filter(s => s.learning_type === view && s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const getTabIcon = () => {
        switch (view) {
            case 'courses': return <BookOpen className="w-4 h-4 inline mr-2" />;
            case 'masterclasses': return <Award className="w-4 h-4 inline mr-2" />;
            case 'stacks': return <BookOpen className="w-4 h-4 inline mr-2" />;
            default: return <GraduationCap className="w-4 h-4 inline mr-2" />;
        }
    };

    const getTabLabel = () => {
        switch (view) {
            case 'courses': return 'Courses';
            case 'masterclasses': return 'Masterclasses';
            case 'stacks': return 'Stacks';
            default: return 'Specializations';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Learning Paths</h1>
                    <p className="text-secondary mt-1">Explore specializations and learning stacks</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => navigate(ROUTES.CREATE_SPECIALIZATION)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Specialization
                    </Button>
                    <Button variant="outline" onClick={() => navigate(ROUTES.CREATE_STACK)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Stack
                    </Button>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 flex-wrap">
                {['specializations', 'courses', 'masterclasses', 'stacks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setView(tab)}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors capitalize ${view === tab
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-elevated text-secondary border border-theme hover:bg-secondary/10'
                            }`}
                    >
                        {tab === 'specializations' && <GraduationCap className="w-4 h-4 inline mr-2" />}
                        {tab === 'courses' && <BookOpen className="w-4 h-4 inline mr-2" />}
                        {tab === 'masterclasses' && <Award className="w-4 h-4 inline mr-2" />}
                        {tab === 'stacks' && <BookOpen className="w-4 h-4 inline mr-2" />}
                        {tab}
                    </button>
                ))}
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
                    <CardBody className="text-center py-16">
                        <div className="mb-4 text-tertiary flex justify-center">
                            {getTabIcon()}
                        </div>
                        <h3 className="text-xl font-semibold text-primary mb-2">No {getTabLabel()} Found</h3>
                        <p className="text-secondary max-w-md mx-auto">There are currently no items matching your search criteria in this category. Be the first to create one!</p>
                        <Button variant="outline" className="mt-6" onClick={() => navigate(view === 'stacks' ? ROUTES.CREATE_STACK : ROUTES.CREATE_SPECIALIZATION)}>
                            Create New {getTabLabel().slice(0, -1)}
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {view !== 'stacks'
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
    <Card className="hover:shadow-xl transition-all duration-300 border border-theme bg-elevated overflow-hidden group flex flex-col h-full transform hover:-translate-y-1">
        {specialization.image_url ? (
            <div className="h-40 w-full overflow-hidden relative">
                <img
                    src={specialization.image_url}
                    alt={specialization.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {specialization.is_paid && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        Premium
                    </div>
                )}
            </div>
        ) : (
            <div className="h-40 w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex flex-col items-center justify-center relative border-b border-theme">
                <GraduationCap className="w-16 h-16 text-primary/30 group-hover:scale-110 transition-transform duration-500" />
                {specialization.is_paid && (
                    <div className="absolute top-3 right-3 bg-yellow-400/20 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400/50">
                        Paid Access
                    </div>
                )}
            </div>
        )}
        <CardBody className="flex flex-col flex-grow p-5 space-y-4">
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-primary leading-tight group-hover:text-purple-500 transition-colors">{specialization.name}</h3>
                </div>
                <p className="text-sm text-secondary/80 line-clamp-2 leading-relaxed">
                    {specialization.description || 'Embark on this learning journey to gain new skills and mastery. Join others in this curated path.'}
                </p>
                {specialization.is_paid && (
                    <p className="mt-3 text-sm font-bold text-primary">
                        ${specialization.price || '0.00'}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-secondary/70 bg-secondary/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 flex-1 justify-center">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>{specialization.stacks?.length || 0} Modules</span>
                </div>
                <div className="w-px h-4 bg-theme"></div>
                <div className="flex items-center gap-1.5 flex-1 justify-center">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>{specialization.members?.length || 0} Learners</span>
                </div>
            </div>

            <Button
                variant="primary"
                className="w-full mt-auto bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
                onClick={() => onJoin(specialization.id)}
            >
                Enroll Now
            </Button>
        </CardBody>
    </Card>
);

const StackCard = ({ stack, onComplete }) => (
    <Card className="hover:shadow-md transition-shadow border border-theme bg-elevated overflow-hidden group">
        {stack.image_url ? (
            <div className="h-32 w-full overflow-hidden relative">
                <img
                    src={stack.image_url}
                    alt={stack.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-background text-primary shadow-sm">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        In Progress
                    </span>
                </div>
            </div>
        ) : (
            <div className="h-32 w-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center relative">
                <BookOpen className="w-12 h-12 text-blue-600/50" />
                <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-background text-primary shadow-sm">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        In Progress
                    </span>
                </div>
            </div>
        )}
        <CardBody>
            <div className="space-y-4">
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
                    <Button variant="outline" className="flex-1 text-xs">
                        View Details
                    </Button>
                    <Button variant="primary" className="flex-1 text-xs" onClick={() => onComplete(stack.id)}>
                        Complete
                    </Button>
                </div>
            </div>
        </CardBody>
    </Card>
);

export default Specializations;
