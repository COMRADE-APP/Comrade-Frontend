import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import CourseEnrollModal from '../components/specializations/CourseEnrollModal';
import {
    GraduationCap, BookOpen, Award, Users, Search, Plus, Clock,
    CheckCircle, Play, Lock, TrendingUp, Download, BarChart3, Eye
} from 'lucide-react';
import specializationsService from '../services/specializations.service';
import { ROUTES } from '../constants/routes';

const Specializations = () => {
    const navigate = useNavigate();
    const [specializations, setSpecializations] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [completedEnrollments, setCompletedEnrollments] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topTab, setTopTab] = useState('explore');   // explore | in_progress | completed
    const [subTab, setSubTab] = useState('specializations'); // specializations | courses | masterclasses | stacks
    const [searchTerm, setSearchTerm] = useState('');
    const [enrollItem, setEnrollItem] = useState(null); // item to show in enrollment modal

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [specs, stacksData, activeEnrolls, completedEnrolls, certs] = await Promise.all([
                specializationsService.getAll().catch(() => []),
                specializationsService.getAllStacks().catch(() => []),
                specializationsService.getMyEnrollments('active').catch(() => []),
                specializationsService.getMyEnrollments('completed').catch(() => []),
                specializationsService.getIssuedCertificates().catch(() => []),
            ]);
            const parseList = (data) => Array.isArray(data) ? data : (data?.results || []);
            setSpecializations(parseList(specs));
            setStacks(parseList(stacksData));
            setEnrollments(parseList(activeEnrolls));
            setCompletedEnrollments(parseList(completedEnrolls));
            setCertificates(parseList(certs));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (item) => {
        if (item.is_paid && parseFloat(item.price || 0) > 0) {
            // Open the enrollment modal for paid courses
            setEnrollItem(item);
            return;
        }
        // Free course — enroll immediately
        try {
            await specializationsService.enroll(item.id);
            loadData();
        } catch (err) {
            console.error('Enrollment failed:', err);
        }
    };

    const getSingularType = (v) => {
        if (v === 'courses') return 'course';
        if (v === 'masterclasses') return 'masterclass';
        if (v === 'specializations') return 'specialization';
        return v;
    };

    const filterBySearch = (items) =>
        items.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.specialization_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredCatalog = subTab === 'stacks'
        ? filterBySearch(stacks)
        : filterBySearch(specializations.filter(s => s.learning_type === getSingularType(subTab)));

    const topTabs = [
        { key: 'explore', label: 'Explore', icon: <Search className="w-4 h-4" /> },
        { key: 'in_progress', label: 'In Progress', icon: <Play className="w-4 h-4" />, count: enrollments.length },
        { key: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" />, count: completedEnrollments.length },
    ];

    const subTabs = [
        { key: 'specializations', label: 'Specializations', icon: <GraduationCap className="w-4 h-4" /> },
        { key: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
        { key: 'masterclasses', label: 'Masterclasses', icon: <Award className="w-4 h-4" /> },
        { key: 'stacks', label: 'Stacks', icon: <BookOpen className="w-4 h-4" /> },
    ];

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Learning Paths</h1>
                    <p className="text-secondary mt-1">Explore specializations, courses, and masterclasses</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => navigate(ROUTES.CREATE_SPECIALIZATION)}>
                        <Plus className="w-4 h-4 mr-2" /> Create
                    </Button>
                </div>
            </div>

            {/* Top Level Tabs: Explore / In Progress / Completed */}
            <div className="flex gap-1 bg-secondary/5 p-1 rounded-xl border border-theme">
                {topTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setTopTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                            ${topTab === tab.key
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-secondary hover:bg-secondary/10'}`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${topTab === tab.key ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* EXPLORE TAB */}
            {topTab === 'explore' && (
                <>
                    {/* Sub-tabs for learning types */}
                    <div className="flex gap-2 flex-wrap">
                        {subTabs.map(tab => (
                            <button key={tab.key} onClick={() => setSubTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-colors
                                    ${subTab === tab.key
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-elevated text-secondary border border-theme hover:bg-secondary/10'}`}>
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                        <input
                            type="text"
                            placeholder={`Search ${subTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        </div>
                    ) : filteredCatalog.length === 0 ? (
                        <EmptyState type={subTab} onAction={() => navigate(ROUTES.CREATE_SPECIALIZATION)} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {subTab !== 'stacks'
                                ? filteredCatalog.map(spec => (
                                    <CatalogCard key={spec.id} item={spec} onEnroll={handleEnroll} navigate={navigate} />
                                ))
                                : filteredCatalog.map(stack => (
                                    <StackCard key={stack.id} stack={stack} navigate={navigate} />
                                ))
                            }
                        </div>
                    )}
                </>
            )}

            {/* IN PROGRESS TAB */}
            {topTab === 'in_progress' && (
                loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    </div>
                ) : enrollments.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-16">
                            <Play className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-primary mb-2">No Active Courses</h3>
                            <p className="text-secondary max-w-md mx-auto">You haven't enrolled in any learning paths yet. Start exploring to begin your journey!</p>
                            <Button variant="primary" className="mt-6" onClick={() => setTopTab('explore')}>
                                Explore Courses
                            </Button>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {enrollments.map(enrollment => (
                            <EnrollmentCard key={enrollment.id} enrollment={enrollment} navigate={navigate} />
                        ))}
                    </div>
                )
            )}

            {/* COMPLETED TAB */}
            {topTab === 'completed' && (
                loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    </div>
                ) : completedEnrollments.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-16">
                            <Award className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-primary mb-2">No Completed Courses Yet</h3>
                            <p className="text-secondary max-w-md mx-auto">Complete your enrolled learning paths to earn certificates!</p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {completedEnrollments.map(enrollment => (
                            <CompletedCard key={enrollment.id} enrollment={enrollment} certificates={certificates} navigate={navigate} />
                        ))}
                    </div>
                )
            )}
        </div>

            {/* Enrollment Modal for paid courses */}
            {enrollItem && (
                <CourseEnrollModal
                    course={enrollItem}
                    onClose={() => setEnrollItem(null)}
                    onSuccess={() => { setEnrollItem(null); loadData(); }}
                />
            )}
        </>
    );
};


// ============================================================================
// CATALOG CARD
// ============================================================================
const CatalogCard = ({ item, onEnroll, navigate }) => {
    const typeColors = {
        specialization: 'from-indigo-600 to-violet-600',
        course: 'from-emerald-600 to-teal-600',
        masterclass: 'from-amber-600 to-orange-600',
    };

    const typeLabels = {
        specialization: 'Specialization',
        course: 'Course',
        masterclass: 'Masterclass',
    };

    return (
        <Card className="hover:shadow-xl transition-all duration-300 border border-theme bg-elevated overflow-hidden group flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate(`/specializations/${item.id}`)}>
            <div className="h-32 w-full overflow-hidden relative">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${typeColors[item.learning_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                        <GraduationCap className="w-16 h-16 text-white/40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Type badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${typeColors[item.learning_type] || 'from-gray-500 to-gray-600'} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg`}>
                    {typeLabels[item.learning_type] || 'Learning'}
                </div>

                {/* Price badge */}
                {item.is_paid && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                        ${item.price || '0'}
                    </div>
                )}

                {/* Enrolled indicator */}
                {item.is_enrolled && (
                    <div className="absolute bottom-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enrolled
                    </div>
                )}
            </div>

            <CardBody className="flex flex-col flex-grow p-4 space-y-2">
                <div className="flex-grow">
                    <h3 className="font-bold text-base text-primary leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                        {item.name}
                    </h3>
                    <p className="text-xs text-secondary/80 line-clamp-2 mt-1 leading-relaxed">
                        {item.description || 'Explore this learning path.'}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-secondary/70 bg-secondary/5 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>{item.total_lessons || item.stack_count || 0} Lessons</span>
                    </div>
                    <div className="w-px h-4 bg-theme" />
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>{item.member_count || 0} Learners</span>
                    </div>
                </div>

                <Button
                    variant={item.is_enrolled ? 'outline' : 'primary'}
                    className="w-full mt-1 text-sm py-1.5"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (item.is_enrolled) {
                            navigate(`/specializations/${item.id}`);
                        } else {
                            onEnroll(item);
                        }
                    }}
                >
                    {item.is_enrolled ? (
                        <><Play className="w-3.5 h-3.5 mr-1.5" /> Continue</>
                    ) : item.is_paid ? (
                        <><Lock className="w-3.5 h-3.5 mr-1.5" /> Enroll — ${item.price}</>
                    ) : (
                        <><GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Enroll Free</>
                    )}
                </Button>
            </CardBody>
        </Card>
    );
};


// ============================================================================
// ENROLLMENT (IN-PROGRESS) CARD
// ============================================================================
const EnrollmentCard = ({ enrollment, navigate }) => (
    <Card className="hover:shadow-lg transition-all border border-theme bg-elevated cursor-pointer"
        onClick={() => navigate(`/specializations/${enrollment.specialization}`)}>
        <CardBody className="flex items-center gap-6 p-5">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                {enrollment.specialization_image ? (
                    <img src={enrollment.specialization_image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-white/60" />
                    </div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                        {enrollment.specialization_type}
                    </span>
                </div>
                <h3 className="font-bold text-lg text-primary truncate">{enrollment.specialization_name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {enrollment.completed_lessons}/{enrollment.total_lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> {parseFloat(enrollment.progress_percent || 0).toFixed(0)}%
                    </span>
                </div>
                <div className="mt-3 w-full bg-secondary/20 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-primary-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(enrollment.progress_percent || 0, 100)}%` }} />
                </div>
            </div>
            <Button variant="primary" className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/specializations/${enrollment.specialization}`); }}>
                <Play className="w-4 h-4 mr-2" /> Resume
            </Button>
        </CardBody>
    </Card>
);


// ============================================================================
// COMPLETED CARD
// ============================================================================
const CompletedCard = ({ enrollment, certificates, navigate }) => {
    const cert = certificates.find(c => c.specialization?.includes(enrollment.specialization));
    return (
        <Card className="border border-theme bg-elevated">
            <CardBody className="flex items-center gap-6 p-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {enrollment.specialization_image ? (
                        <img src={enrollment.specialization_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Award className="w-8 h-8 text-white/60" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-primary">{enrollment.specialization_name}</h3>
                    <p className="text-sm text-secondary mt-1">
                        Completed {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : '—'}
                    </p>
                    {cert && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Certificate: Grade {cert.grade || 'Pass'} — Code: {cert.verification_code?.slice(0, 8)}...
                        </p>
                    )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" onClick={() => navigate(`/specializations/${enrollment.specialization}`)}>
                        <Eye className="w-4 h-4 mr-2" /> Review
                    </Button>
                    {cert && (
                        <Button variant="primary">
                            <Download className="w-4 h-4 mr-2" /> Certificate
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};


// ============================================================================
// STACK CARD
// ============================================================================
const StackCard = ({ stack, navigate }) => (
    <Card className="hover:shadow-md transition-shadow border border-theme bg-elevated overflow-hidden group">
        <div className="h-32 w-full overflow-hidden">
            {stack.image_url ? (
                <img src={stack.image_url} alt={stack.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-blue-600/50" />
                </div>
            )}
        </div>
        <CardBody className="space-y-3">
            <h3 className="font-semibold text-lg text-primary line-clamp-1">{stack.name}</h3>
            <p className="text-sm text-secondary line-clamp-2">{stack.description || 'Learning module'}</p>
            <div className="flex items-center gap-2 text-xs text-secondary">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{stack.lesson_count || 0} lessons</span>
            </div>
        </CardBody>
    </Card>
);


// ============================================================================
// EMPTY STATE
// ============================================================================
const EmptyState = ({ type, onAction }) => (
    <Card>
        <CardBody className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">No {type} found</h3>
            <p className="text-secondary max-w-md mx-auto">There are no items matching your search. Be the first to create one!</p>
            <Button variant="outline" className="mt-6" onClick={onAction}>Create New</Button>
        </CardBody>
    </Card>
);

export default Specializations;
