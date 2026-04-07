import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    GraduationCap, BookOpen, Award, Users, Clock, CheckCircle, Play,
    Lock, ChevronDown, ChevronRight, FileText, Video, Music, Image,
    Code, Download, ArrowLeft, BarChart3, Eye, Edit, Trash2, AlertCircle
} from 'lucide-react';
import specializationsService from '../services/specializations.service';
import CourseEnrollModal from '../components/specializations/CourseEnrollModal';

const SpecializationDetail = () => {
    const { id } = useParams();
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
    const [quizAnswers, setQuizAnswers] = useState({});
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

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

    const loadLesson = (lessonId) => {
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
            setActiveQuiz(null);
            setQuizResult(null);
        }
    };

    const loadQuiz = (quizId) => {
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
            setQuizAnswers({});
            setQuizResult(null);
        }
    };

    const submitQuiz = async () => {
        if (!activeQuiz) return;
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
                <div className={`h-56 md:h-72 bg-gradient-to-r ${typeColors[spec.learning_type] || 'from-gray-600 to-gray-800'}`}>
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
                            <Card key={stack.id} className="border border-theme bg-elevated overflow-hidden">
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
                                            return (
                                                <button key={lesson.id}
                                                    onClick={() => loadLesson(lesson.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/5 transition-colors text-sm border-b border-theme last:border-b-0
                                                        ${activeLesson?.id === lesson.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                                >
                                                    {completed
                                                        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        : lesson.is_locked && !spec.is_enrolled
                                                            ? <Lock className="w-4 h-4 text-secondary/50 flex-shrink-0" />
                                                            : <Play className="w-4 h-4 text-primary flex-shrink-0" />}
                                                    <div className="flex-grow min-w-0">
                                                        <p className={`truncate ${completed ? 'text-secondary line-through' : 'text-primary'}`}>
                                                            {lesson.title}
                                                        </p>
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
                        />
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
    <Card className="border border-theme bg-elevated">
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

            {/* Video Content */}
            {lesson.video_url && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    {lesson.video_url.includes('youtube') || lesson.video_url.includes('youtu.be') ? (
                        <iframe
                            src={lesson.video_url.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={lesson.title}
                        />
                    ) : (
                        <video src={lesson.video_url} controls className="w-full h-full" />
                    )}
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
                <div className="rounded-xl overflow-hidden">
                    <div className="bg-gray-900 text-gray-100 p-1 flex items-center justify-between">
                        <span className="text-xs font-mono px-3 py-1 text-gray-400">{lesson.code_language || 'code'}</span>
                    </div>
                    <pre className="bg-gray-950 text-gray-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                        <code>{lesson.code_snippet}</code>
                    </pre>
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
                    dangerouslySetInnerHTML={{ __html: lesson.content_text.replace(/\n/g, '<br/>') }}
                />
            )}

            {lesson.description && !lesson.content_text && (
                <p className="text-secondary leading-relaxed">{lesson.description}</p>
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
// QUIZ VIEWER
// ============================================================================
const QuizViewer = ({ quiz, answers, setAnswers, result, onSubmit, submitting }) => (
    <Card className="border border-theme bg-elevated">
        <CardBody className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-primary">{quiz.title}</h2>
                    <p className="text-sm text-secondary">
                        {quiz.questions?.length} questions · Pass: {quiz.passing_score}% · {quiz.max_attempts} attempts max
                    </p>
                </div>
            </div>

            {result ? (
                /* RESULTS */
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

                    {/* Answer Review */}
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
            ) : (
                /* QUESTION FORM */
                <div className="space-y-6">
                    {quiz.questions?.map((q, idx) => (
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
                    ))}

                    <Button variant="primary" className="w-full py-3 font-bold" onClick={onSubmit} disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                </div>
            )}
        </CardBody>
    </Card>
);

export default SpecializationDetail;
