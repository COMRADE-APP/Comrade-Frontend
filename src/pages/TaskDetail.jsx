/**
 * Task Detail Page
 * Multi-step answering with timer, tab-change detection, auto-save, and analytics
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ArrowLeft, ArrowRight, Check, Clock, FileText, Users, Send,
    Timer, Shield, AlertTriangle, BarChart3, Star, Eye, ChevronRight,
    Video, Shuffle, CheckCircle, XCircle, AlertCircle, ClipboardList, ExternalLink, File, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksService } from '../services/tasks.service';
import { formatDate, formatTime } from '../utils/dateFormatter';

const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Answering state
    const [answering, setAnswering] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [myResponse, setMyResponse] = useState(null);

    // Timer
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);

    // Tab detection
    const [tabSwitches, setTabSwitches] = useState(0);
    const [tabWarning, setTabWarning] = useState(false);

    // Analytics
    const [analyticsData, setAnalyticsData] = useState(null);
    const [responses, setResponses] = useState([]);
    const [viewingResponse, setViewingResponse] = useState(null);
    const [gradingState, setGradingState] = useState({});
    const [savingGrades, setSavingGrades] = useState(false);

    useEffect(() => {
        loadTask();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [id]);

    useEffect(() => {
        if (task?.id) tasksService.recordAccess(task.id);
    }, [task?.id]);

    const loadTask = async () => {
        setLoading(true);
        try {
            const isResponseRoute = window.location.pathname.includes('/tasks/responses/');
            let taskData;
            let targetResponseId = null;
            let loadedResponse = null;

            if (isResponseRoute) {
                loadedResponse = await tasksService.getResponseById(id);
                taskData = loadedResponse.task;
                targetResponseId = parseInt(id);
            } else {
                taskData = await tasksService.getById(id);
                const params = new URLSearchParams(window.location.search);
                const viewParam = params.get('view');
                if (viewParam === 'response' && params.get('responseId')) {
                    targetResponseId = parseInt(params.get('responseId'));
                }
            }

            setTask(taskData);

            const isTaskCreator = taskData?.user?.id === user?.id || user?.is_staff;
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view');

            if (isResponseRoute || targetResponseId) {
                setActiveTab('responses');
                if (loadedResponse) {
                    setViewingResponse(loadedResponse);
                } else if (targetResponseId) {
                    try {
                        const resp = await tasksService.getResponseById(targetResponseId);
                        setViewingResponse(resp);
                    } catch (e) { console.error('Failed to load response by ID', e); }
                }
            } else if (viewParam === 'submission') {
                setActiveTab(isTaskCreator ? 'responses' : 'take');
            } else if (viewParam === 'responses' && isTaskCreator) {
                setActiveTab('responses');
            }

            // Check if user already submitted
            try {
                const resp = await tasksService.getMyResponse(taskData.id);
                if (resp) { setMyResponse(resp); setSubmitted(true); }
            } catch { /* No submission */ }
        } catch (err) {
            console.error(err);
            setError('Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const startAnswering = () => {
        setAnswering(true);
        setCurrentPage(0);
        setAnswers({});

        // Start timer if enabled
        if (task?.settings?.timer_enabled && task?.settings?.timer_duration) {
            const parts = task.settings.timer_duration.split(':');
            const totalSec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
            setTimeLeft(totalSec);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // Set up tab detection
        if (task?.settings?.no_tab_leaving) {
            const handleVisibility = () => {
                if (document.hidden) {
                    setTabSwitches(prev => {
                        const newCount = prev + 1;
                        if (task?.settings?.auto_submit_on_tab_change) {
                            handleSubmit();
                        } else if (newCount >= (task?.settings?.max_tab_switches || 3)) {
                            handleSubmit();
                        } else {
                            setTabWarning(true);
                            setTimeout(() => setTabWarning(false), 5000);
                        }
                        return newCount;
                    });
                }
            };
            document.addEventListener('visibilitychange', handleVisibility);
            return () => document.removeEventListener('visibilitychange', handleVisibility);
        }
    };

    const setAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        // Auto-save: Handle text/choice only for auto-save, skip files for now
        if (task?.settings?.auto_save && !(value instanceof File) && !Array.isArray(value)) {
            tasksService.saveDraft(task.id, Object.entries({ ...answers, [questionId]: value })
                .filter(([_, ans]) => !(ans instanceof File) && !Array.isArray(ans))
                .map(([qId, ans]) => ({ question_id: parseInt(qId), answer_text: typeof ans === 'string' ? ans : '', answer_choice: typeof ans === 'number' ? ans : null }))
            );
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            if (timerRef.current) clearInterval(timerRef.current);

            const formData = new FormData();
            const responseData = [];

            Object.entries(answers).forEach(([qId, ans]) => {
                const qIdInt = parseInt(qId);

                if (ans instanceof File) {
                    formData.append(`file_${qIdInt}`, ans);
                    responseData.push({ question_id: qIdInt, answer_text: '', answer_choice: null });
                } else if (Array.isArray(ans) && ans.length > 0 && ans[0] instanceof File) {
                    ans.forEach(file => formData.append(`file_${qIdInt}`, file));
                    responseData.push({ question_id: qIdInt, answer_text: '', answer_choice: null });
                } else if (Array.isArray(ans)) {
                    // Checkbox array
                    responseData.push({ question_id: qIdInt, answer_text: JSON.stringify(ans), answer_choice: null });
                } else {
                    // Text or Radio
                    responseData.push({
                        question_id: qIdInt,
                        answer_text: typeof ans === 'string' ? ans : '',
                        answer_choice: typeof ans === 'number' ? ans : null,
                    });
                }
            });

            formData.append('responses', JSON.stringify(responseData));

            const result = await tasksService.submit(task.id, formData);
            setMyResponse(result);
            setSubmitted(true);
            setAnswering(false);
            toast.success('Task submitted successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const data = await tasksService.getAnalytics(task.id);
            setAnalyticsData(data);
        } catch { }
    };

    const loadResponses = async () => {
        try {
            const data = await tasksService.getResponses(task.id);
            setResponses(Array.isArray(data) ? data : data?.results || []);
        } catch { }
    };

    useEffect(() => {
        if (viewingResponse) {
            const initialGrades = {};
            viewingResponse.question_responses?.forEach(qr => {
                initialGrades[qr.id] = qr.score || 0;
            });
            setGradingState(initialGrades);
        }
    }, [viewingResponse]);

    const handleSaveGrades = async () => {
        if (!viewingResponse) return;
        setSavingGrades(true);
        try {
            const gradesPayload = {
                grades: Object.entries(gradingState).map(([qrId, score]) => ({
                    question_response_id: parseInt(qrId),
                    score: parseFloat(score) || 0
                }))
            };

            const updatedResponse = await tasksService.gradeResponse(viewingResponse.id, gradesPayload);

            setViewingResponse(updatedResponse);
            setResponses(prev => prev.map(r => r.id === updatedResponse.id ? updatedResponse : r));
            toast.success('Grades saved successfully!');
        } catch (error) {
            console.error('Failed to save grades', error);
            toast.error('Failed to save grades');
        } finally {
            setSavingGrades(false);
        }
    };

    const isCreator = task?.user?.id === user?.id || user?.is_staff;
    const questions = task?.questions || [];
    const questionsPerPage = task?.settings?.questions_per_page || 4;
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    const currentQuestions = questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'take', label: submitted ? 'My Submission' : 'Take Task', icon: ClipboardList },
        ...(isCreator ? [
            { id: 'responses', label: 'Responses', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ] : []),
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card><CardBody className="text-center py-12">
                    <p className="text-red-500 mb-4">{error || 'Task not found'}</p>
                    <Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>
                </CardBody></Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            {/* Tab Warning Overlay */}
            {tabWarning && (
                <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={24} />
                    <div>
                        <p className="font-bold">Tab switch detected!</p>
                        <p className="text-sm">Switches: {tabSwitches}/{task?.settings?.max_tab_switches || 3}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => { if (answering) { if (window.confirm('Leave task? Progress may be lost.')) { setAnswering(false); navigate('/tasks'); } } else navigate('/tasks'); }}
                    className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary">{task.heading}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-secondary flex-wrap">
                        <span className="capitalize px-2 py-0.5 bg-secondary rounded-full">{task.category}</span>
                        <span className="capitalize px-2 py-0.5 bg-secondary rounded-full">{task.difficulty}</span>
                        <span className="capitalize px-2 py-0.5 bg-secondary rounded-full">{task.difficulty}</span>
                        {(task?.status === 'completed' || submitted) ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Completed</span>
                        ) : (task && new Date(task.due_date) < new Date() && !(task?.status === 'completed' || submitted)) ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium">Overdue</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded-full ${task.state === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'} font-medium capitalize`}>
                                {task.state}
                            </span>
                        )}
                        {task.is_activity && (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full font-medium">Activity</span>
                        )}
                        {task.question_count > 0 && <span>{task.question_count} questions</span>}
                    </div>
                </div>
                {/* Creator Edit Button */}
                {(task?.user?.id === user?.id || user?.is_staff) && (
                    <Button variant="outline" onClick={() => navigate(`/tasks/edit/${task.id}`)} className="shrink-0 flex items-center gap-2">
                        <Edit2 size={16} /> <span className="hidden sm:inline">Update Task</span>
                    </Button>
                )}
                {/* Timer display when answering */}
                {answering && timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${timeLeft < 60 ? 'bg-red-500/10 text-red-400 animate-pulse' :
                        timeLeft < 300 ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-blue-500/10 text-blue-400'
                        }`}>
                        <Timer size={20} /> {formatTimer(timeLeft)}
                    </div>
                )}
            </div>

            {/* Answering Mode */}
            {answering && !submitted && (
                <div className="space-y-4">
                    {/* Task badges */}
                    <div className="flex gap-2 flex-wrap">
                        {task.settings?.timer_enabled && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1"><Timer size={12} /> Timed</span>}
                        {task.settings?.no_tab_leaving && <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs flex items-center gap-1"><Shield size={12} /> Proctored</span>}
                        {task.settings?.one_take && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">One Take</span>}
                        {task.settings?.record_video && <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs flex items-center gap-1"><Video size={12} /> Recording</span>}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }} />
                        </div>
                        <span className="text-sm text-secondary">Page {currentPage + 1} of {totalPages}</span>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        {currentQuestions.map((q, idx) => (
                            <Card key={q.id} className="border-l-4 border-l-primary/40">
                                <CardBody>
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                            {currentPage * questionsPerPage + idx + 1}
                                        </span>
                                        <h3 className="font-medium text-primary">{q.heading}</h3>
                                    </div>

                                    {q.question_type === 'short_text' && (
                                        <input type="text" value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)}
                                            placeholder="Type your short answer..."
                                            className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                    )}

                                    {q.question_type === 'text' && (
                                        <textarea value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)}
                                            placeholder="Type your paragraph answer..."
                                            className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none resize-y min-h-[100px] focus:ring-2 focus:ring-primary/20" />
                                    )}

                                    {q.question_type === 'radio' && (
                                        <div className="space-y-2">
                                            {q.choices?.map(c => (
                                                <button key={c.id} onClick={() => setAnswer(q.id, c.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${answers[q.id] === c.id
                                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                                        : 'border-theme text-secondary hover:border-primary/20'
                                                        }`}>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[q.id] === c.id ? 'border-primary bg-primary' : 'border-theme'
                                                        }`}>
                                                        {answers[q.id] === c.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-sm">{c.content}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.question_type === 'check' && (
                                        <div className="space-y-2">
                                            {q.choices?.map(c => {
                                                const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(c.id);
                                                return (
                                                    <button key={c.id}
                                                        onClick={() => {
                                                            const curr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                                            setAnswer(q.id, selected ? curr.filter(x => x !== c.id) : [...curr, c.id]);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${selected ? 'bg-primary/10 border-primary/30 text-primary' : 'border-theme text-secondary hover:border-primary/20'
                                                            }`}>
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary bg-primary' : 'border-theme'
                                                            }`}>
                                                            {selected && <Check size={12} className="text-white" />}
                                                        </div>
                                                        <span className="text-sm">{c.content}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {q.question_type === 'file' && (
                                        <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center">
                                            <input type="file" onChange={e => setAnswer(q.id, e.target.files[0])}
                                                className="text-sm text-secondary" />
                                        </div>
                                    )}

                                    {q.question_type === 'multiple_file' && (
                                        <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center">
                                            <input type="file" multiple onChange={e => setAnswer(q.id, Array.from(e.target.files))}
                                                className="text-sm text-secondary" />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center justify-between">
                        <Button variant="secondary" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
                            <ArrowLeft size={16} className="mr-1" /> Previous
                        </Button>
                        {currentPage < totalPages - 1 ? (
                            <Button variant="primary" onClick={() => setCurrentPage(p => p + 1)}>
                                Next <ArrowRight size={16} className="ml-1" />
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit'} <Send size={16} className="ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Non-answering mode */}
            {!answering && (
                <>
                    {/* Tabs */}
                    <div className="border-b border-theme overflow-x-auto">
                        <nav className="flex gap-1">
                            {tabs.map(tab => (
                                <button key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setViewingResponse(null);
                                        if (tab.id === 'analytics' && !analyticsData) loadAnalytics();
                                        if (tab.id === 'responses' && responses.length === 0) loadResponses();
                                    }}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
                                        }`}>
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <Card><CardBody>
                                        <h3 className="font-semibold text-lg mb-3 text-primary">Description</h3>
                                        <p className="text-secondary whitespace-pre-wrap">{task.description}</p>
                                    </CardBody></Card>

                                    <Card><CardBody>
                                        <h3 className="font-semibold text-lg mb-3 text-primary">Questions Preview</h3>
                                        <div className="space-y-2">
                                            {questions.map((q, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-theme/30">
                                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</span>
                                                    <span className="text-sm text-primary flex-1">{q.heading}</span>
                                                    <span className="text-xs text-secondary capitalize px-2 py-0.5 bg-secondary rounded-full">{q.question_type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardBody></Card>
                                </div>

                                <div className="space-y-6">
                                    <Card><CardBody>
                                        <h3 className="font-semibold mb-3 text-primary">Details</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-secondary">Created by</span><span className="text-primary font-medium">{task.user?.first_name} {task.user?.last_name}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary">Due date</span><span className="text-primary font-medium">{formatDate(task.due_date)}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary">Questions</span><span className="text-primary font-medium">{task.question_count || questions.length}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary">Submissions</span><span className="text-primary font-medium">{task.response_count || 0}</span></div>
                                        </div>
                                    </CardBody></Card>

                                    {task.settings && (
                                        <Card><CardBody>
                                            <h3 className="font-semibold mb-3 text-primary">Task Settings</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {task.settings.timer_enabled && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">⏱ Timed</span>}
                                                {task.settings.no_tab_leaving && <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs">🔒 Proctored</span>}
                                                {task.settings.one_take && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">☝️ One Take</span>}
                                                {task.settings.record_video && <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">📹 Recording</span>}
                                                {task.settings.shuffle_questions && <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs">🔀 Shuffled</span>}
                                                {task.settings.auto_save && <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">💾 Auto-save</span>}
                                                {task.settings.passing_score > 0 && <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">🎯 Pass: {task.settings.passing_score}%</span>}
                                            </div>
                                        </CardBody></Card>
                                    )}

                                    {!isCreator && task.state === 'active' && !submitted && (
                                        <Button variant="primary" className="w-full" onClick={task.is_activity ? async () => {
                                            try {
                                                await tasksService.markCompleted(task.id);
                                                setSubmitted(true);
                                                setMyResponse({ time_stamp: new Date().toISOString() });
                                                toast.success("Marked as Done!");
                                            } catch (e) {
                                                console.error(e);
                                                toast.error("Error marking as completed");
                                            }
                                        } : startAnswering}>
                                            {task.is_activity ? "Mark as Done" : "Start Task"} <ChevronRight size={16} className="ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'take' && (
                            <Card><CardBody>
                                {submitted && myResponse ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                                            <CheckCircle size={32} className="text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-primary">Task Submitted!</h3>
                                        <p className="text-secondary">Your response has been recorded.</p>
                                        {myResponse.total_score !== undefined && (
                                            <div className="inline-block px-6 py-3 bg-primary/10 rounded-xl">
                                                <p className="text-sm text-secondary">Score</p>
                                                <p className="text-3xl font-bold text-primary">{myResponse.total_score}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-secondary">
                                            Submitted: {formatDate(myResponse.time_stamp)} {formatTime(myResponse.time_stamp)}
                                        </p>
                                    </div>
                                ) : task.state === 'active' ? (
                                    <div className="text-center py-12 space-y-4">
                                        <ClipboardList size={48} className="mx-auto text-primary/20" />
                                        <h3 className="text-lg font-semibold text-primary">Ready to start?</h3>
                                        <p className="text-secondary text-sm max-w-md mx-auto">
                                            {task.is_activity ? "This is an activity. You can simply mark it as done once you've completed it." : `This task has ${questions.length} questions.`}
                                            {task.settings?.timer_enabled && ` You'll have ${task.settings.timer_duration} to complete it.`}
                                            {task.settings?.one_take && ` This is a one-take task — you only get one attempt.`}
                                            {task.settings?.no_tab_leaving && ` Tab switching is monitored.`}
                                        </p>
                                        <Button variant="primary" onClick={task.is_activity ? async () => {
                                            try {
                                                await tasksService.markCompleted(task.id);
                                                setSubmitted(true);
                                                setMyResponse({ time_stamp: new Date().toISOString() });
                                                toast.success("Marked as Done!");
                                            } catch (e) {
                                                console.error(e);
                                                toast.error("Error marking as completed");
                                            }
                                        } : startAnswering}>
                                            {task.is_activity ? "Mark as Done" : "Begin Task"} <ChevronRight size={16} className="ml-1" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <XCircle size={48} className="mx-auto text-red-400/30" />
                                        <p className="mt-3 text-secondary">This task is no longer accepting submissions.</p>
                                    </div>
                                )}
                            </CardBody></Card>
                        )}

                        {activeTab === 'responses' && isCreator && (
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-4 text-primary">Submissions ({responses.length})</h3>
                                {viewingResponse ? (
                                    <div>
                                        <Button variant="outline" size="sm" onClick={() => setViewingResponse(null)} className="mb-4">
                                            <ArrowLeft size={16} className="mr-2" /> Back to Submissions
                                        </Button>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-primary/10 rounded-lg flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                                                    {(viewingResponse.user?.first_name || 'U')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary">{viewingResponse.user?.first_name} {viewingResponse.user?.last_name}</p>
                                                    <p className="text-sm text-secondary">Submitted: {formatDate(viewingResponse.time_stamp)} at {formatTime(viewingResponse.time_stamp)}</p>
                                                    <p className="text-sm font-semibold text-primary mt-1">Total Score: {viewingResponse.total_score || 0}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-6">
                                                <h4 className="font-bold text-primary mb-2">Answers & Grading</h4>
                                                {viewingResponse.question_responses?.length > 0 ? viewingResponse.question_responses.map((qa, idx) => {
                                                    const q = questions.find(qItem => qItem.id === qa.question_id) || qa.question;
                                                    return (
                                                        <div key={idx} className="p-4 bg-secondary/10 rounded-lg border border-theme/30 flex flex-col md:flex-row gap-4 justify-between">
                                                            <div className="space-y-2 flex-grow">
                                                                <p className="font-medium text-primary">Q{idx + 1}: {q?.heading || `Question ID ${qa.question_id}`}</p>
                                                                <div className="p-3 bg-secondary/20 rounded-md text-secondary text-sm whitespace-pre-wrap">
                                                                    {qa.answer_text ? qa.answer_text : (qa.answer_choice !== null ? `Selected Choice: ${qa.answer_choice}` : 'No answer provided')}
                                                                </div>
                                                                {/* File response — View File button */}
                                                                {qa.answer_file && (
                                                                    <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg border border-theme">
                                                                        <File className="w-5 h-5 text-primary shrink-0" />
                                                                        <span className="text-sm text-primary truncate flex-1">
                                                                            {qa.answer_file.split('/').pop() || 'Uploaded File'}
                                                                        </span>
                                                                        <a
                                                                            href={qa.answer_file}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium shrink-0"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                            View File
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {qa.score !== null && qa.score !== undefined && (
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="text-green-600 font-medium">Auto-graded: {qa.score} pts</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="w-full md:w-32 shrink-0">
                                                                <label className="block text-xs font-semibold text-secondary mb-1">Score</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    value={gradingState[qa.id] !== undefined ? gradingState[qa.id] : (qa.score || '')}
                                                                    onChange={(e) => setGradingState(prev => ({ ...prev, [qa.id]: e.target.value }))}
                                                                    className="w-full px-3 py-2 bg-elevated border border-theme rounded focus:outline-none focus:border-primary text-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <p className="text-secondary italic">No detailed answers available for this submission.</p>
                                                )}

                                                {viewingResponse.question_responses?.length > 0 && (
                                                    <div className="flex justify-end pt-4 border-t border-theme">
                                                        <Button variant="primary" onClick={handleSaveGrades} disabled={savingGrades}>
                                                            {savingGrades ? 'Saving...' : 'Save Grades'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : responses.length > 0 ? (
                                    <div className="space-y-3">
                                        {responses.map((resp, idx) => (
                                            <div key={idx}
                                                onClick={() => setViewingResponse(resp)}
                                                className="p-4 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors rounded-lg border border-theme/30 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                        {(resp.user?.first_name || 'U')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary text-sm">{resp.user?.first_name} {resp.user?.last_name}</p>
                                                        <p className="text-xs text-secondary">{formatDate(resp.time_stamp)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resp.status === 'graded'
                                                        ? 'bg-green-500/10 text-green-600'
                                                        : 'bg-orange-500/10 text-orange-500'
                                                        }`}>
                                                        {resp.status === 'graded' ? 'Graded' : 'Pending'}
                                                    </span>
                                                    <div>
                                                        <p className="text-lg font-bold text-primary">{resp.total_score || 0}</p>
                                                        <p className="text-xs text-secondary">Score</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-secondary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-secondary text-center py-8">No submissions yet.</p>
                                )}
                            </CardBody></Card>
                        )}

                        {activeTab === 'analytics' && isCreator && (
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg mb-6 text-primary flex items-center gap-2">
                                    <BarChart3 size={20} /> Task Analytics
                                </h3>
                                {analyticsData ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Unique Visitors', value: analyticsData.unique_visitors || 0, color: 'blue' },
                                                { label: 'Total Submissions', value: analyticsData.total_submissions || 0, color: 'green' },
                                                { label: 'Questions', value: analyticsData.question_count || 0, color: 'purple' },
                                                { label: 'Page Views', value: analyticsData.action_counts?.access || 0, color: 'orange' },
                                            ].map((stat, idx) => (
                                                <div key={idx} className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                                                    <p className="text-sm text-secondary">{stat.label}</p>
                                                    <p className="text-2xl font-bold text-primary mt-1">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {Object.keys(analyticsData.action_counts || {}).length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-primary mb-3">Action Breakdown</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {Object.entries(analyticsData.action_counts).map(([action, count]) => (
                                                        <div key={action} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-theme/30">
                                                            <span className="text-sm text-secondary capitalize">{action.replace('_', ' ')}</span>
                                                            <span className="font-bold text-primary">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        <p className="text-secondary mt-3">Loading analytics...</p>
                                    </div>
                                )}
                            </CardBody></Card>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TaskDetail;
