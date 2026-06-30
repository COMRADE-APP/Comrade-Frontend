import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    GraduationCap, BookOpen, Award, Users, Clock, CheckCircle, Play,
    Lock, ChevronDown, ChevronRight, FileText, Video, Music, Image,
    Code, Download, ArrowLeft, BarChart3, Eye, Edit, Trash2, AlertCircle,
    Timer, ListOrdered, ExternalLink
} from 'lucide-react';
import specializationsService from '../services/specializations.service';
import CourseEnrollModal from '../components/specializations/CourseEnrollModal';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

const normalizeYouTubeUrl = (url) => {
    if (!url) return url;
    if (url.includes('/embed/')) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
    if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1];
    return url;
};

const getContrastColor = (bg) => {
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000000' : '#ffffff';
};

const SpecializationDetail = () => {
    const { id, lessonSlug } = useParams();
    const navigate = useNavigate();
    

    // State
    const [spec, setSpec] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollItem, setEnrollItem] = useState(null);
    
    // UI State
    const [expandedStacks, setExpandedStacks] = useState({});
    const [activeLesson, setActiveLesson] = useState(null);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [activeActivity, setActiveActivity] = useState(null);
    const [activeLab, setActiveLab] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [quizTimer, setQuizTimer] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        loadDetail();
    }, [id]);

    const loadDetail = async () => {
        setLoading(true);
        try {
            const data = await specializationsService.getById(id);
            setSpec(data);
            
            // Re-expand first stack if none expanded
            if (data.stacks_detail?.length > 0 && Object.keys(expandedStacks).length === 0) {
                setExpandedStacks({ [data.stacks_detail[0].id]: true });
            }

            if (data.is_enrolled) {
                const prog = await specializationsService.getProgress(id);
                setProgress(prog);
            }

            // Set active lesson from URL slug or resume from progress
            if (data.stacks_detail?.length > 0) {
                if (lessonSlug) {
                    for (const stack of data.stacks_detail || []) {
                        const found = (stack.lessons || []).find(l => l.slug === lessonSlug);
                        if (found) { setActiveLesson(found); break; }
                    }
                } else {
                    // No slug — default to first incomplete lesson
                    for (const stack of data.stacks_detail || []) {
                        for (const l of (stack.lessons || [])) {
                            if (!l.completed && !l.is_locked) { setActiveLesson(l); break; }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (spec?.is_paid && parseFloat(spec.price || 0) > 0) {
            setEnrollItem(spec);
            return;
        }

        setEnrolling(true);
        try {
            await specializationsService.enroll(id);
            await loadDetail();
        } catch (err) {
            console.error('Enrollment failed:', err);
        } finally {
            setEnrolling(false);
        }
    };

    const handleCompleteLesson = async (lessonId) => {
        try {
            await specializationsService.completeLesson(lessonId);
            await loadDetail();
        } catch (err) {
            console.error('Failed to complete lesson:', err);
        }
    };

    const toggleStack = (stackId) => {
        setExpandedStacks(prev => ({ ...prev, [stackId]: !prev[stackId] }));
    };

    const loadLesson = (lessonId, lessonSlugParam) => {
        let found = null;
        for (const stack of spec?.stacks_detail || []) {
            found = (stack.lessons || []).find(l => l.id === lessonId);
            if (found) break;
        }
        if (found) {
            if (found.is_locked && !spec?.is_enrolled) {
                handleEnroll();
                return;
            }
            setActiveLesson(found);
            setActiveTab(null);
            setActiveQuiz(null);
            setActiveActivity(null);
            setActiveLab(null);
            setQuizResult(null);
            if (lessonSlugParam) navigate(`/specializations/${id}/${lessonSlugParam}`, { replace: true });
        }
    };

    const loadQuiz = (quizId) => {
        if (timerRef.current) clearInterval(timerRef.current);
        let found = null;
        for (const stack of spec?.stacks_detail || []) {
            found = (stack.quizzes || []).find(q => q.id === quizId);
            if (found) break;
        }
        if (found) {
            if (!spec?.is_enrolled) {
                handleEnroll();
                return;
            }
            setActiveQuiz(found);
            setActiveLesson(null);
            setActiveTab(null);
            setActiveActivity(null);
            setActiveLab(null);
            setQuizAnswers({});
            setQuizResult(null);
            setCurrentQuestionIdx(0);
            // Set timer
            if (found.time_limit_minutes && found.timer_mode === 'per_test') {
                const totalSecs = found.time_limit_minutes * 60;
                setTimeLeft(totalSecs);
            } else if (found.time_per_question && found.timer_mode === 'per_question') {
                setTimeLeft(found.time_per_question);
            } else {
                setTimeLeft(null);
            }
        }
    };

    const loadActivity = (activity) => {
        setActiveActivity(activity);
        setActiveTab('activity');
        setActiveLesson(null);
        setActiveQuiz(null);
        setQuizResult(null);
        setActiveLab(null);
    };

    const loadLab = (lab) => {
        setActiveLab(lab);
        setActiveTab('lab');
        setActiveLesson(null);
        setActiveQuiz(null);
        setQuizResult(null);
        setActiveActivity(null);
    };

    // Quiz timer countdown
    useEffect(() => {
        if (!activeQuiz || quizResult || timeLeft === null) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Auto-submit on timeout
                    submitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [activeQuiz, quizResult, timeLeft === null]);

    // Reset timer when question changes in per_question mode
    useEffect(() => {
        if (activeQuiz?.timer_mode === 'per_question' && activeQuiz?.time_per_question && !quizResult) {
            setTimeLeft(activeQuiz.time_per_question);
        }
    }, [currentQuestionIdx]);

    const goToNextQuestion = () => {
        if (activeQuiz && currentQuestionIdx < (activeQuiz.questions?.length || 0) - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        }
    };
    const goToPrevQuestion = () => {
        if (activeQuiz?.allow_back_navigation && currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (!activeQuiz) return;
        if (timerRef.current) clearInterval(timerRef.current);
        setSubmittingQuiz(true);
        try {
            const answers = Object.entries(quizAnswers).map(([qId, answer]) => ({
                question_id: parseInt(qId),
                answer
            }));
            const result = await specializationsService.submitQuizAttempt(activeQuiz.id, answers);
            setQuizResult(result);
            await loadDetail();
        } catch (err) {
            console.error('Quiz submission failed:', err);
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4 text-red-500" />;
            case 'audio': return <Music className="w-4 h-4 text-purple-500" />;
            case 'image': return <Image className="w-4 h-4 text-green-500" />;
            case 'code': return <Code className="w-4 h-4 text-yellow-500" />;
            case 'file': return <Download className="w-4 h-4 text-blue-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const isLessonCompleted = (lessonId) => {
        if (!progress) return false;
        for (const stack of progress.stacks || []) {
            const lesson = stack.lessons?.find(l => l.id === lessonId);
            if (lesson) return lesson.completed;
        }
        return false;
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );

    if (!spec) return (
        <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-primary">Not Found</h2>
        </div>
    );

    const typeColors = {
        specialization: 'from-indigo-600 to-violet-600',
        course: 'from-emerald-600 to-teal-600',
        masterclass: 'from-amber-600 to-orange-600',
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Back button */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Paths
            </button>

            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className={`h-56 md:h-72 ${spec.background_color && spec.background_color !== '#ffffff' ? '' : `bg-gradient-to-r ${typeColors[spec.learning_type] || 'from-gray-600 to-gray-800'}`}`}
                    style={spec.background_color && spec.background_color !== '#ffffff' ? { backgroundColor: spec.background_color } : {}}>
                    {spec.image_url && (
                        <img src={spec.image_url} alt="" className="w-full h-full object-cover opacity-30" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            {spec.learning_type}
                        </span>
                        {spec.is_paid && (
                            <span className="text-xs font-bold text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                ${spec.price}
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{spec.name}</h1>
                    <p className="text-white/70 max-w-2xl line-clamp-2">{spec.description}</p>
                    <div className="flex items-center gap-6 mt-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {spec.total_lessons || 0} lessons</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {Math.round((spec.total_duration || 0) / 60)}h</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {spec.member_count || 0} enrolled</span>
                        <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {spec.stack_count || 0} modules</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar (if enrolled) */}
            {spec.is_enrolled && progress && (
                <Card className="border border-theme bg-elevated">
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-primary">Your Progress</span>
                            <span className="text-sm font-bold text-primary-600">{progress.overall_progress?.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-secondary/20 rounded-full h-3">
                            <div className="bg-gradient-to-r from-primary-500 to-indigo-500 h-3 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(progress.overall_progress || 0, 100)}%` }} />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-secondary">
                            <span>{progress.completed_lessons}/{progress.total_lessons} lessons completed</span>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Module Accordion */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="font-bold text-lg text-primary">Curriculum</h2>
                    {(spec.stacks_detail || []).map((stack, idx) => {
                        const stackProgress = progress?.stacks?.find(s => s.stack_id === stack.id);
                        const isExpanded = expandedStacks[stack.id];
                        return (
                            <Card key={stack.id} className="border border-theme bg-elevated overflow-hidden" style={stack.background_color && stack.background_color !== '#ffffff' ? { backgroundColor: stack.background_color + '20', color: getContrastColor(stack.background_color) + '80' } : {}}>
                                <button
                                    onClick={() => toggleStack(stack.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors text-left"
                                >
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                                                Module {idx + 1}
                                            </span>
                                            {stackProgress && stackProgress.completed_lessons === stackProgress.total_lessons && stackProgress.total_lessons > 0 && (
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-primary text-sm mt-1 truncate">{stack.name}</h3>
                                        <span className="text-xs text-secondary">{stack.lesson_count || 0} lessons</span>
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-secondary flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-secondary flex-shrink-0" />}
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-theme">
                                        {(stack.lessons || []).map(lesson => {
                                            const completed = isLessonCompleted(lesson.id);
                                            const isHidden = lesson.hidden;
                                            const isLocked = lesson.is_locked && !completed;
                                            const isSequentialBlocked = lesson.sequential_blocked;
                                            if (isHidden) return null;
                                            return (
                                                <button key={lesson.id}
                                                    onClick={() => isLocked ? null : loadLesson(lesson.id, lesson.slug)}
                                                    disabled={isLocked}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-sm border-b border-theme last:border-b-0
                                                        ${activeLesson?.id === lesson.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                                                        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/5 cursor-pointer'}`}
                                                    title={isSequentialBlocked ? 'Complete previous lesson to unlock' : isLocked && !spec.is_enrolled ? 'Enroll to access' : ''}
                                                >
                                                    {completed
                                                        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        : isLocked
                                                            ? <Lock className="w-4 h-4 text-secondary/50 flex-shrink-0" />
                                                            : <Play className="w-4 h-4 text-primary flex-shrink-0" />}
                                                    <div className="flex-grow min-w-0">
                                                        <p className={`truncate ${completed ? 'text-secondary line-through' : isLocked ? 'text-secondary/50' : 'text-primary'}`}>
                                                            {lesson.title}
                                                        </p>
                                                        {isSequentialBlocked && !completed && (
                                                            <span className="text-[10px] text-amber-600">Complete previous lesson</span>
                                                        )}
                                                        {isLocked && !spec.is_enrolled && !isSequentialBlocked && (
                                                            <span className="text-[10px] text-secondary">Enroll to access</span>
                                                        )}
                                                    </div>
                                                    {getContentIcon(lesson.content_type)}
                                                    <span className="text-xs text-secondary flex-shrink-0">{lesson.duration_minutes}m</span>
                                                </button>
                                            );
                                        })}

                                        {/* Stack quizzes */}
                                        {(stack.quizzes || []).map(quiz => (
                                            <button key={`quiz-${quiz.id}`}
                                                onClick={() => loadQuiz(quiz.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/5 transition-colors text-sm bg-amber-50/50 dark:bg-amber-900/10
                                                    ${activeQuiz?.id === quiz.id ? 'bg-amber-100 dark:bg-amber-900/30' : ''}`}
                                            >
                                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-primary font-medium">{quiz.title}</p>
                                                    <p className="text-xs text-secondary">{quiz.question_count} questions · Pass: {quiz.passing_score}%</p>
                                                </div>
                                            </button>
                                        ))}

                                        {/* Stack activities */}
                                        {(stack.activities || []).map(activity => (
                                            <button key={`activity-${activity.id}`}
                                                onClick={() => loadActivity(activity)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/5 transition-colors text-sm bg-emerald-50/50 dark:bg-emerald-900/10
                                                    ${activeActivity?.id === activity.id ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}
                                            >
                                                <Play className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-primary font-medium">{activity.title}</p>
                                                    <p className="text-xs text-secondary capitalize">{activity.activity_type}</p>
                                                </div>
                                            </button>
                                        ))}

                                        {/* Stack labs */}
                                        {(stack.labs || []).map(lab => (
                                            <button key={`lab-${lab.id}`}
                                                onClick={() => loadLab(lab)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/5 transition-colors text-sm bg-indigo-50/50 dark:bg-indigo-900/10
                                                    ${activeLab?.id === lab.id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`}
                                            >
                                                <Code className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-primary font-medium">{lab.title}</p>
                                                    <p className="text-xs text-secondary">Lab / Practice</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {/* Enroll Button (if not enrolled) */}
                    {!spec.is_enrolled && (
                        <Button variant="primary" className="w-full py-3 text-lg font-bold" onClick={handleEnroll} disabled={enrolling}>
                            {enrolling ? 'Enrolling...' : spec.is_paid ? `Enroll — $${spec.price}` : 'Enroll Free'}
                        </Button>
                    )}
                </div>

                {/* RIGHT: Content Viewer */}
                <div className="lg:col-span-2">
                    {activeLesson ? (
                        <LessonViewer
                            lesson={activeLesson}
                            isCompleted={isLessonCompleted(activeLesson.id)}
                            onComplete={handleCompleteLesson}
                            isEnrolled={spec.is_enrolled}
                        />
                    ) : activeQuiz ? (
                        <QuizViewer
                            quiz={activeQuiz}
                            answers={quizAnswers}
                            setAnswers={setQuizAnswers}
                            result={quizResult}
                            onSubmit={submitQuiz}
                            submitting={submittingQuiz}
                            currentIdx={currentQuestionIdx}
                            onNext={goToNextQuestion}
                            onPrev={goToPrevQuestion}
                            timeLeft={timeLeft}
                        />
                    ) : activeTab === 'activity' && activeActivity ? (
                        <ActivityViewer activity={activeActivity} />
                    ) : activeTab === 'lab' && activeLab ? (
                        <LabViewer lab={activeLab} />
                    ) : (
    <Card className="border border-theme bg-elevated">
                            <CardBody className="text-center py-20">
                                <BookOpen className="w-20 h-20 text-tertiary mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-primary mb-2">Select a Lesson</h3>
                                <p className="text-secondary">Click on a lesson in the curriculum to start learning.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            {/* Enrollment Modal */}
            {enrollItem && (
                <CourseEnrollModal
                    course={enrollItem}
                    onClose={() => setEnrollItem(null)}
                    onSuccess={() => { setEnrollItem(null); loadDetail(); }}
                />
            )}
        </div>
    );
};


// ============================================================================
// LESSON VIEWER
// ============================================================================
const LessonViewer = ({ lesson, isCompleted, onComplete, isEnrolled }) => (
    <Card className="border border-theme bg-elevated" style={lesson.background_color && lesson.background_color !== '#ffffff' ? { backgroundColor: lesson.background_color + '30', color: getContrastColor(lesson.background_color) } : {}}>
        <CardBody className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                            {lesson.content_type}
                        </span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-primary">{lesson.title}</h2>
                </div>
                {isCompleted && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" /> Done
                    </span>
                )}
            </div>

            {/* Content Blocks (new multi-block format) */}
            {lesson.content_blocks && lesson.content_blocks.length > 0 ? (
                <div className="space-y-4">
                    {lesson.content_blocks.map((block, i) => {
                        const bg = block.background_color && block.background_color !== '#ffffff' ? { backgroundColor: block.background_color, color: getContrastColor(block.background_color) } : {};
                        switch (block.block_type) {
                            case 'text':
                                return (
                                    <div key={block.id || i} style={bg} className={bg.backgroundColor ? 'rounded-xl p-3' : ''}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-primary leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />
                                    </div>
                                );
                            case 'video':
                                return block.url ? (
                                    <div key={block.id || i} style={bg} className={`space-y-2 ${bg.backgroundColor ? 'rounded-xl p-3' : ''}`}>
                                        {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                                            <iframe src={normalizeYouTubeUrl(block.url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                                        </div>
                                    </div>
                                ) : null;
                            case 'audio':
                                return block.url ? (
                                    <div key={block.id || i} style={bg} className={`bg-secondary/5 rounded-xl p-4 space-y-2`}>
                                        {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                        <div className="flex items-center gap-3"><Music className="w-6 h-6 text-purple-500" /><span className="font-medium text-primary">Audio</span></div>
                                        <audio src={block.url} controls className="w-full" />
                                    </div>
                                ) : null;
                            case 'image':
                                return block.url ? (
                                    <div key={block.id || i} style={bg} className={`${bg.backgroundColor ? 'rounded-xl p-3' : ''}`}>
                                        {block.caption && <p className="text-sm font-medium text-primary mb-2">{block.caption}</p>}
                                        <div className="rounded-xl overflow-hidden"><img src={block.url} alt={block.caption || ''} className="w-full h-auto max-h-96 object-contain bg-secondary/5" /></div>
                                    </div>
                                ) : null;
                            case 'code':
                                return block.content ? (
                                    <div key={block.id || i} style={bg} className={`${bg.backgroundColor ? 'rounded-xl p-3' : ''}`}>
                                        {block.caption && <p className="text-sm font-medium text-primary mb-2">{block.caption}</p>}
                                        <div className="rounded-lg overflow-hidden border border-theme">
                                            <div className="bg-gray-800 text-gray-300 px-3 py-1.5 flex items-center justify-between">
                                                <span className="text-[10px] font-mono uppercase tracking-wider">{block.code_language || 'code'}</span>
                                            </div>
                                            <pre className="!bg-gray-950 !text-gray-100 p-4 max-h-96 overflow-y-auto overflow-x-auto text-sm font-mono leading-relaxed"><code dangerouslySetInnerHTML={{ __html: hljs.highlight(block.content, { language: block.code_language || 'plaintext' }).value }} /></pre>
                                        </div>
                                    </div>
                                ) : null;
                            case 'file':
                                return block.url ? (
                                    <div key={block.id || i} style={bg} className={`rounded-xl p-4 flex items-center gap-3 ${bg.backgroundColor ? '' : 'bg-secondary/5'}`}>
                                        <Download className="w-6 h-6 text-blue-500" />
                                        <div className="flex-grow"><p className="font-medium text-primary">{block.caption || 'Downloadable Resource'}</p></div>
                                        <a href={block.url} download className="text-primary-600 hover:underline text-sm font-medium">Download</a>
                                    </div>
                                ) : null;
                            default:
                                return block.content ? (
                                    <div key={block.id || i} style={bg} className={bg.backgroundColor ? 'rounded-xl p-3' : ''}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-primary leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />
                                    </div>
                                ) : null;
                        }
                    })}
                </div>
            ) : (
                <>
                    {/* Legacy single-field rendering (fallback) */}

            {/* Video Content */}
            {lesson.video_url && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe src={normalizeYouTubeUrl(lesson.video_url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={lesson.title} />
                </div>
            )}

            {/* Audio Content */}
            {lesson.audio_url && (
                <div className="bg-secondary/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Music className="w-6 h-6 text-purple-500" />
                        <span className="font-medium text-primary">Audio Content</span>
                    </div>
                    <audio src={lesson.audio_url} controls className="w-full" />
                </div>
            )}

            {/* Image Content */}
            {lesson.image_url && (
                <div className="rounded-xl overflow-hidden">
                    <img src={lesson.image_url} alt={lesson.title} className="w-full h-auto max-h-96 object-contain bg-secondary/5" />
                </div>
            )}

            {/* Code Content */}
            {lesson.code_snippet && (
                <div className="rounded-lg overflow-hidden border border-theme">
                    <div className="bg-gray-800 text-gray-300 px-3 py-1.5 flex items-center"><span className="text-[10px] font-mono uppercase tracking-wider">{lesson.code_language || 'code'}</span></div>
                    <pre className="!bg-gray-950 !text-gray-100 p-4 max-h-96 overflow-y-auto overflow-x-auto text-sm font-mono leading-relaxed"><code dangerouslySetInnerHTML={{ __html: hljs.highlight(lesson.code_snippet, { language: lesson.code_language || 'plaintext' }).value }} /></pre>
                </div>
            )}

            {/* File Download */}
            {lesson.file_upload && (
                <div className="bg-secondary/5 rounded-xl p-4 flex items-center gap-3">
                    <Download className="w-6 h-6 text-blue-500" />
                    <div className="flex-grow">
                        <p className="font-medium text-primary">Downloadable Resource</p>
                        <p className="text-xs text-secondary">Click to download the attached file</p>
                    </div>
                    <a href={lesson.file_upload} download className="text-primary-600 hover:underline text-sm font-medium">
                        Download
                    </a>
                </div>
            )}

            {/* Text Content */}
            {lesson.content_text && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-primary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content_text.replace(/\n/g, '<br/>')) }}
                />
            )}

            {lesson.description && !lesson.content_text && (
                <p className="text-secondary leading-relaxed">{lesson.description}</p>
            )}

                </>
            )}

            {/* Complete Button */}
            {isEnrolled && !isCompleted && (
                <Button variant="primary" className="w-full py-3 font-bold" onClick={() => onComplete(lesson.id)}>
                    <CheckCircle className="w-5 h-5 mr-2" /> Mark as Complete
                </Button>
            )}
        </CardBody>
    </Card>
);


// ============================================================================
// QUIZ VIEWER (ENHANCED)
// ============================================================================
const QuizViewer = ({ quiz, answers, setAnswers, result, onSubmit, submitting, currentIdx, onNext, onPrev, timeLeft }) => {
    const isOneByOne = quiz.display_mode === 'one_by_one';
    const totalQuestions = quiz.questions?.length || 0;
    const currentQuestion = isOneByOne ? quiz.questions?.[currentIdx] : null;
    const canGoBack = quiz.allow_back_navigation && currentIdx > 0;

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return null;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount >= totalQuestions;

    const renderQuestion = (q, idx) => (
        <div key={q.id} className="p-4 bg-secondary/5 rounded-xl space-y-3">
            <p className="font-medium text-primary">
                <span className="text-xs font-bold text-secondary mr-2">Q{idx + 1}</span>
                {q.question_text}
            </p>
            {q.question_type === 'multiple_choice' && q.choices?.map((choice, ci) => (
                <label key={ci} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${answers[q.id] === choice.label
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-theme hover:bg-secondary/5'}`}
                >
                    <input type="radio" name={`q-${q.id}`} value={choice.label}
                        checked={answers[q.id] === choice.label}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice.label }))}
                        className="accent-primary-600" />
                    <span className="text-sm font-bold text-secondary mr-1">{choice.label}.</span>
                    <span className="text-sm text-primary">{choice.text}</span>
                </label>
            ))}
            {q.question_type === 'true_false' && ['True', 'False'].map(opt => (
                <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${answers[q.id] === opt
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-theme hover:bg-secondary/5'}`}
                >
                    <input type="radio" name={`q-${q.id}`} value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className="accent-primary-600" />
                    <span className="text-sm text-primary">{opt}</span>
                </label>
            ))}
            {q.question_type === 'short_answer' && (
                <input type="text" value={answers[q.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer..."
                    className="w-full px-4 py-2.5 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            )}
            {q.question_type === 'code_challenge' && (
                <div className="space-y-2">
                    {q.code_template && (
                        <pre className="bg-gray-950 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">{q.code_template}</pre>
                    )}
                    <textarea value={answers[q.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Write your code..."
                        rows={6}
                        className="w-full px-4 py-2.5 border border-theme bg-gray-950 text-gray-100 font-mono text-sm rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
            )}
        </div>
    );

    return (
        <Card className="border border-theme bg-elevated">
            <CardBody className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-primary">{quiz.title}</h2>
                        <p className="text-sm text-secondary">
                            {totalQuestions} questions · Pass: {quiz.passing_score}% · {quiz.max_attempts} attempts max
                            {timeLeft !== null && (
                                <span className="ml-3 inline-flex items-center gap-1 font-mono text-amber-600">
                                    <Timer size={14} /> {formatTime(timeLeft)}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {result ? (
                    /* RESULTS */
                    result.show_results_immediately !== false && (
                    <div className="space-y-4">
                        <div className={`text-center py-8 rounded-xl ${result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            {result.passed
                                ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                : <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />}
                            <h3 className={`text-2xl font-bold ${result.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                {result.passed ? 'Passed!' : 'Not Passed'}
                            </h3>
                            <p className="text-4xl font-bold mt-2 text-primary">{result.score}%</p>
                            <p className="text-sm text-secondary mt-1">
                                {result.earned_points}/{result.total_points} points · Attempt #{result.attempt_number}
                                {result.attempts_remaining > 0 && ` · ${result.attempts_remaining} attempts left`}
                            </p>
                        </div>
                        {result.answers?.map((ans, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${ans.is_correct ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'}`}>
                                <div className="flex items-start gap-2">
                                    {ans.is_correct
                                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                    <div>
                                        <p className="text-sm text-primary font-medium">Your answer: {ans.answer}</p>
                                        {!ans.is_correct && ans.correct_answer && (
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">Correct: {ans.correct_answer}</p>
                                        )}
                                        {ans.explanation && (
                                            <p className="text-xs text-secondary mt-1 italic">{ans.explanation}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    )
                ) : (
                    /* QUESTIONS */
                    <div className="space-y-6">
                        {isOneByOne ? (
                            <>
                                {/* Progress bar */}
                                <div className="flex items-center gap-2 text-xs text-secondary">
                                    <span>Question {currentIdx + 1} of {totalQuestions}</span>
                                    <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }} />
                                    </div>
                                </div>
                                {currentQuestion && renderQuestion(currentQuestion, currentIdx)}
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        {canGoBack && (
                                            <Button variant="outline" size="sm" onClick={onPrev}>Previous</Button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {currentIdx < totalQuestions - 1 ? (
                                            <Button variant="primary" size="sm" onClick={onNext}
                                                disabled={!answers[currentQuestion?.id] && quiz.timer_mode !== 'per_question'}>
                                                Next
                                            </Button>
                                        ) : (
                                            <Button variant="primary" size="sm" onClick={onSubmit} isLoading={submitting}
                                                disabled={!allAnswered && quiz.timer_mode !== 'per_question'}>
                                                Submit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {quiz.questions?.map((q, idx) => renderQuestion(q, idx))}
                                <Button variant="primary" className="w-full py-3 font-bold" onClick={onSubmit} disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

// ============================================================================
// ACTIVITY VIEWER
// ============================================================================
const ActivityViewer = ({ activity }) => (
    <Card className="border border-theme bg-elevated">
        <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <ListOrdered className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-primary">{activity.title}</h2>
                    <p className="text-sm text-secondary capitalize">{activity.activity_type}</p>
                </div>
            </div>
            {activity.instructions && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-primary"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activity.instructions) }} />
            )}
            {(activity.content_blocks || []).map((block, i) => {
                const bg = block.background_color && block.background_color !== '#ffffff' ? { backgroundColor: block.background_color, color: getContrastColor(block.background_color) } : {};
                switch (block.block_type) {
                    case 'text':
                        return (
                            <div key={block.id || i} style={bg} className={bg.backgroundColor ? 'rounded-xl p-3' : ''}>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-primary leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />
                            </div>
                        );
                    case 'video':
                        return block.url ? (
                            <div key={block.id || i} className="space-y-2">
                                {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                                    <iframe src={normalizeYouTubeUrl(block.url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                                </div>
                            </div>
                        ) : null;
                    case 'image':
                        return block.url ? (
                            <div key={block.id || i}>
                                {block.caption && <p className="text-sm font-medium text-primary mb-1">{block.caption}</p>}
                                <img src={block.url} alt={block.caption || ''} className="w-full h-auto max-h-80 object-contain rounded-xl bg-secondary/5" />
                            </div>
                        ) : null;
                    case 'audio':
                        return block.url ? (
                            <div key={block.id || i} className="bg-secondary/5 rounded-xl p-4 space-y-1">
                                {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                <audio src={block.url} controls className="w-full" />
                            </div>
                        ) : null;
                    case 'file':
                        return block.url ? (
                            <div key={block.id || i} className="rounded-xl p-4 flex items-center gap-3 bg-secondary/5">
                                <Download className="w-5 h-5 text-blue-500" />
                                <div className="flex-grow"><p className="font-medium text-primary text-sm">{block.caption || 'Resource'}</p></div>
                                <a href={block.url} download className="text-primary-600 hover:underline text-xs font-medium">Download</a>
                            </div>
                        ) : null;
                    default:
                        return null;
                }
            })}
            {activity.submission_required && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Submission Required</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Complete and submit your work for this activity.</p>
                </div>
            )}
        </CardBody>
    </Card>
);

// ============================================================================
// LAB VIEWER
// ============================================================================
const LabViewer = ({ lab }) => (
    <Card className="border border-theme bg-elevated">
        <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Code className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-primary">{lab.title}</h2>
                    <p className="text-sm text-secondary">Lab / Practice</p>
                </div>
            </div>
            {lab.description && <p className="text-sm text-primary">{lab.description}</p>}
            {lab.instructions && (
                <div>
                    <h4 className="text-sm font-bold text-primary mb-2">Instructions</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-primary"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lab.instructions) }} />
                </div>
            )}
            {(lab.content_blocks || []).map((block, i) => {
                const bg = block.background_color && block.background_color !== '#ffffff' ? { backgroundColor: block.background_color, color: getContrastColor(block.background_color) } : {};
                switch (block.block_type) {
                    case 'text':
                        return (
                            <div key={block.id || i} style={bg} className={bg.backgroundColor ? 'rounded-xl p-3' : ''}>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-primary leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />
                            </div>
                        );
                    case 'video':
                        return block.url ? (
                            <div key={block.id || i} className="space-y-2">
                                {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                                    <iframe src={normalizeYouTubeUrl(block.url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                                </div>
                            </div>
                        ) : null;
                    case 'image':
                        return block.url ? (
                            <div key={block.id || i}>
                                {block.caption && <p className="text-sm font-medium text-primary mb-1">{block.caption}</p>}
                                <img src={block.url} alt={block.caption || ''} className="w-full h-auto max-h-80 object-contain rounded-xl bg-secondary/5" />
                            </div>
                        ) : null;
                    case 'audio':
                        return block.url ? (
                            <div key={block.id || i} className="bg-secondary/5 rounded-xl p-4 space-y-1">
                                {block.caption && <p className="text-sm font-medium text-primary">{block.caption}</p>}
                                <audio src={block.url} controls className="w-full" />
                            </div>
                        ) : null;
                    case 'file':
                        return block.url ? (
                            <div key={block.id || i} className="rounded-xl p-4 flex items-center gap-3 bg-secondary/5">
                                <Download className="w-5 h-5 text-blue-500" />
                                <div className="flex-grow"><p className="font-medium text-primary text-sm">{block.caption || 'Resource'}</p></div>
                                <a href={block.url} download className="text-primary-600 hover:underline text-xs font-medium">Download</a>
                            </div>
                        ) : null;
                    default:
                        return null;
                }
            })}
            {lab.setup_guide && (
                <details className="bg-secondary/5 rounded-xl p-3">
                    <summary className="text-sm font-medium text-primary cursor-pointer">Setup Guide</summary>
                    <div className="mt-2 text-sm text-primary prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lab.setup_guide) }} />
                </details>
            )}
            {lab.expected_output && (
                <div>
                    <h4 className="text-sm font-bold text-primary mb-2">Expected Output</h4>
                    <pre className="bg-gray-950 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">{lab.expected_output}</pre>
                </div>
            )}
            {lab.links?.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-primary mb-2">Resources</h4>
                    <div className="space-y-1.5">
                        {lab.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-primary-600 hover:underline">
                                <ExternalLink size={12} /> {link.label || link.url}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </CardBody>
    </Card>
);

export default SpecializationDetail;
