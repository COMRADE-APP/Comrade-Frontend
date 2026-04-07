/**
 * Response Detail Page
 * Shows all responses for a task, with review/grading capabilities
 * Features: Auto-expand, AI grading, answer key display, per-question points
 * Route: /tasks/responses/:id (where :id is the TASK ID)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ArrowLeft, CheckCircle, Clock, FileText, User, Star, Send,
    AlertCircle, Eye, Award, MessageSquare, ChevronDown, ChevronUp,
    Loader2, XCircle, Shield, Search, Filter, Users, Zap, Brain,
    Sparkles, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksService } from '../services/tasks.service';
import { formatDate, formatTime } from '../utils/dateFormatter';

const REVIEW_STATUSES = [
    { value: 'received', label: 'Received', icon: Eye, color: 'blue', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    { value: 'under_review', label: 'Under Review', icon: Clock, color: 'yellow', bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
    { value: 'complete', label: 'Complete', icon: CheckCircle, color: 'green', bg: 'bg-green-500/10 border-green-500/30 text-green-400' },
    { value: 'confirmed', label: 'Confirmed', icon: Shield, color: 'purple', bg: 'bg-primary-600/10 border-primary-600/30 text-primary-500' },
    { value: 'graded', label: 'Graded', icon: Award, color: 'emerald', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
];

const ResponseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Grading state
    const [feedback, setFeedback] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [updating, setUpdating] = useState(false);
    const [grades, setGrades] = useState({});
    const [gradingMode, setGradingMode] = useState(false);
    const [savingGrades, setSavingGrades] = useState(false);
    const [aiGrading, setAiGrading] = useState(false);
    const [aiGradingResults, setAiGradingResults] = useState(null);

    useEffect(() => {
        loadTaskAndResponses();
    }, [id]);

    const loadTaskAndResponses = async () => {
        setLoading(true);
        setError(null);
        try {
            const taskData = await tasksService.getById(id);
            setTask(taskData);

            let responseData;
            try {
                responseData = await tasksService.getResponses(id);
            } catch {
                responseData = [];
            }
            const responseList = Array.isArray(responseData) ? responseData
                : responseData?.results ? responseData.results
                    : [];
            setResponses(responseList);

            if (responseList.length > 0 && !selectedResponse) {
                selectResponse(responseList[0]);
            }
        } catch (err) {
            console.error('Load task/responses error:', err);
            setError('Failed to load task responses. Make sure this task exists.');
        } finally {
            setLoading(false);
        }
    };

    const selectResponse = (resp) => {
        setSelectedResponse(resp);
        setSelectedStatus(resp.review_status || resp.status || 'received');
        setFeedback(resp.feedback || '');
        setGradingMode(false);
        setAiGradingResults(null);

        // Auto-expand all questions for easy review
        const qrs = resp.question_responses_detail || resp.question_responses || [];
        const expanded = {};
        qrs.forEach((_, idx) => { expanded[idx] = true; });
        setExpandedQuestions(expanded);

        // Initialize grades
        const existing = {};
        qrs.forEach(qr => { existing[qr.id] = qr.score || 0; });
        setGrades(existing);
    };

    const handleUpdateStatus = async () => {
        if (!task?.id || !selectedResponse?.id) return;
        setUpdating(true);
        try {
            await tasksService.updateResponseStatus(task.id, selectedResponse.id, {
                review_status: selectedStatus,
                feedback
            });
            await loadTaskAndResponses();
            toast.success('Status updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleGrade = async () => {
        if (!selectedResponse?.id) return;
        setSavingGrades(true);
        try {
            await tasksService.gradeResponse(selectedResponse.id, {
                grades,
                feedback,
                total_score: Object.values(grades).reduce((sum, v) => sum + Number(v), 0)
            });
            setGradingMode(false);
            await loadTaskAndResponses();
            toast.success('Grades saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save grades');
        } finally {
            setSavingGrades(false);
        }
    };

    const handleAutoGrade = async () => {
        if (!task?.id) return;
        try {
            const res = await tasksService.autoGrade(task.id);
            await loadTaskAndResponses();
            toast.success(res.message || 'Auto-graded successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Auto-grade failed');
        }
    };

    const handleAiGrade = async () => {
        if (!task?.id || !selectedResponse?.id) return;
        setAiGrading(true);
        setAiGradingResults(null);
        try {
            const result = await tasksService.aiGrade(task.id, selectedResponse.id);
            setAiGradingResults(result.grading_details);
            await loadTaskAndResponses();
            toast.success('AI grading completed');
        } catch (err) {
            toast.error(err.response?.data?.error || 'AI grading failed. Make sure GEMINI_API_KEY is configured.');
        } finally {
            setAiGrading(false);
        }
    };

    const toggleQuestion = (idx) => {
        setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const isOwner = task?.created_by === user?.id || task?.user === user?.id || user?.is_staff;
    const isGradable = task?.is_gradable;

    // Filter and search
    const filteredResponses = responses.filter(r => {
        const matchesSearch = !searchQuery ||
            (r.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.user_email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (r.review_status || r.status || 'received') === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = responses.reduce((acc, r) => {
        const s = r.review_status || r.status || 'received';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card><CardBody className="text-center py-12">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-400 mb-4">{error || 'Task not found'}</p>
                    <Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>
                </CardBody></Card>
            </div>
        );
    }

    const questionResponses = selectedResponse?.question_responses_detail || selectedResponse?.question_responses || [];
    const currentStatus = REVIEW_STATUSES.find(s => s.value === (selectedResponse?.review_status || selectedResponse?.status)) || REVIEW_STATUSES[0];

    // Get task questions to find correct answers for display
    const taskQuestions = task?.questions || task?.question_set || [];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-primary truncate">{task.title || task.heading || task.content?.substring(0, 50)}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-secondary">
                            {responses.length} response{responses.length !== 1 ? 's' : ''} submitted
                        </p>
                        {isGradable && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                                <BookOpen size={12} /> Gradable
                            </span>
                        )}
                    </div>
                </div>
                {isOwner && responses.length > 0 && (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="secondary" size="sm" onClick={handleAutoGrade}>
                            <Zap size={16} className="mr-1" /> Auto Grade
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-2xl font-bold text-blue-400">{responses.length}</p>
                    <p className="text-xs text-secondary">Total</p>
                </div>
                {REVIEW_STATUSES.map(st => (
                    <div key={st.value} className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${statusFilter === st.value ? st.bg + ' ring-2 ring-offset-1 ring-offset-transparent' : 'border-theme/30 hover:border-theme'}`}
                        onClick={() => setStatusFilter(statusFilter === st.value ? 'all' : st.value)}>
                        <p className="text-2xl font-bold text-primary">{statusCounts[st.value] || 0}</p>
                        <p className="text-xs text-secondary">{st.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Response List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            type="text"
                            placeholder="Search respondents..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-transparent border border-theme rounded-xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                        {filteredResponses.length > 0 ? filteredResponses.map(resp => {
                            const respStatus = REVIEW_STATUSES.find(s => s.value === (resp.review_status || resp.status)) || REVIEW_STATUSES[0];
                            const isSelected = selectedResponse?.id === resp.id;
                            return (
                                <button
                                    key={resp.id}
                                    onClick={() => selectResponse(resp)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-theme hover:border-primary/30 hover:bg-secondary/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {(resp.user_name || resp.user_email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-primary text-sm truncate">{resp.user_name || 'User'}</p>
                                            <p className="text-xs text-secondary truncate">{resp.user_email || formatDate(resp.created_at || resp.time_stamp)}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${respStatus.bg}`}>
                                            {respStatus.label}
                                        </div>
                                    </div>
                                    {(isOwner || (resp.status === 'graded' || resp.review_status === 'graded')) && resp.total_score != null && (
                                        <div className="mt-2 text-sm text-secondary">
                                            Score: <span className="font-bold text-primary">{resp.total_score}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        }) : (
                            <div className="text-center py-12 text-secondary">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">{responses.length === 0 ? 'No responses yet' : 'No matching responses'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Selected Response Detail */}
                <div className="lg:col-span-8 space-y-4">
                    {selectedResponse ? (
                        <>
                            {/* Response header */}
                            <Card><CardBody>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                            {(selectedResponse.user_name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-primary">{selectedResponse.user_name || 'User'}</h3>
                                            <p className="text-sm text-secondary">{selectedResponse.user_email}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${currentStatus.bg}`}>
                                        <currentStatus.icon size={16} />
                                        {currentStatus.label}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="p-3 bg-secondary/20 rounded-lg">
                                        <p className="text-secondary text-xs">Submitted</p>
                                        <p className="font-semibold text-primary mt-1">{formatDate(selectedResponse.created_at || selectedResponse.time_stamp)}</p>
                                    </div>
                                    <div className="p-3 bg-secondary/20 rounded-lg">
                                        <p className="text-secondary text-xs">Score</p>
                                        <p className="font-semibold text-primary mt-1 text-lg">
                                            {(isOwner || (selectedResponse.status === 'graded' || selectedResponse.review_status === 'graded'))
                                                ? (selectedResponse.total_score ?? '—')
                                                : 'Pending'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-secondary/20 rounded-lg">
                                        <p className="text-secondary text-xs">Answers</p>
                                        <p className="font-semibold text-primary mt-1">{questionResponses.length}</p>
                                    </div>
                                </div>
                            </CardBody></Card>

                            {/* Questions & Answers */}
                            <Card><CardBody>
                                <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-4">
                                    <FileText size={20} /> Answers
                                </h3>
                                {questionResponses.length > 0 ? (
                                    <div className="space-y-3">
                                        {questionResponses.map((qr, idx) => {
                                            const qDetail = qr.question_detail || qr.question || {};
                                            return (
                                                <div key={qr.id || idx} className="border border-theme rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleQuestion(idx)}
                                                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="font-medium text-primary text-sm truncate">
                                                                {qr.question_text || qDetail?.heading || qDetail?.question_text || `Question ${idx + 1}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {isGradable && qDetail?.points && (
                                                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                    {qDetail.points}pts
                                                                </span>
                                                            )}
                                                            {qr.is_correct !== undefined && (
                                                                qr.is_correct
                                                                    ? <CheckCircle size={18} className="text-green-400" />
                                                                    : <XCircle size={18} className="text-red-400" />
                                                            )}
                                                            {qr.score != null && (
                                                                <span className="text-sm font-medium text-secondary">{qr.score} pts</span>
                                                            )}
                                                            {expandedQuestions[idx] ? <ChevronUp size={18} className="text-secondary" /> : <ChevronDown size={18} className="text-secondary" />}
                                                        </div>
                                                    </button>
                                                    {expandedQuestions[idx] && (
                                                        <div className="px-4 pb-4 border-t border-theme bg-secondary/10">
                                                            <div className="pt-3 space-y-3">
                                                                <div>
                                                                    <p className="text-xs text-secondary uppercase tracking-wider mb-1">Student Answer</p>
                                                                    <p className="text-primary text-sm bg-secondary/30 rounded-lg p-3">
                                                                        {qr.answer_text || qr.selected_choice_text || qr.selected_choice || '—'}
                                                                    </p>
                                                                </div>
                                                                {/* Show correct answer / answer key */}
                                                                {isGradable && (qr.correct_answer || qDetail?.correct_answer_text) && (
                                                                    <div>
                                                                        <p className="text-xs text-secondary uppercase tracking-wider mb-1">Answer Key</p>
                                                                        <p className="text-green-400 text-sm bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                                                                            {qr.correct_answer || qDetail?.correct_answer_text}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {/* AI grading feedback */}
                                                                {aiGradingResults && aiGradingResults[idx] && (
                                                                    <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                                                        <p className="text-xs text-amber-400 font-medium mb-1 flex items-center gap-1">
                                                                            <Sparkles size={12} /> AI Feedback
                                                                        </p>
                                                                        <p className="text-sm text-secondary">{aiGradingResults[idx].feedback}</p>
                                                                        <p className="text-xs text-amber-400 mt-1">
                                                                            Score: {aiGradingResults[idx].score}/{aiGradingResults[idx].max} ({aiGradingResults[idx].method})
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {gradingMode && isOwner && (
                                                                    <div className="flex items-center gap-3 pt-2 border-t border-theme">
                                                                        <label className="text-sm text-secondary shrink-0">Score:</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={grades[qr.id] || 0}
                                                                            onChange={(e) => setGrades(prev => ({ ...prev, [qr.id]: Number(e.target.value) }))}
                                                                            className="w-20 px-3 py-1.5 bg-transparent border border-theme rounded-lg text-primary text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                                        />
                                                                        {isGradable && qDetail?.points && (
                                                                            <span className="text-xs text-secondary">/ {qDetail.points} max</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-secondary">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No question responses found</p>
                                    </div>
                                )}
                            </CardBody></Card>

                            {/* Status & Grading Panel (owner only) */}
                            {isOwner && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card><CardBody>
                                        <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                                            <Shield size={18} /> Update Status
                                        </h4>
                                        <div className="space-y-2 mb-3">
                                            {REVIEW_STATUSES.map(status => (
                                                <button
                                                    key={status.value}
                                                    onClick={() => setSelectedStatus(status.value)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm ${selectedStatus === status.value
                                                        ? status.bg
                                                        : 'border-theme text-secondary hover:border-primary/30'
                                                        }`}
                                                >
                                                    <status.icon size={14} />
                                                    <span className="font-medium">{status.label}</span>
                                                    {selectedStatus === status.value && <CheckCircle size={12} className="ml-auto" />}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Add feedback..."
                                            className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary text-sm outline-none resize-y min-h-[60px] focus:ring-2 focus:ring-primary/20 mb-3"
                                        />
                                        <Button variant="primary" className="w-full" disabled={updating} onClick={handleUpdateStatus}>
                                            {updating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                            Update Status
                                        </Button>
                                    </CardBody></Card>

                                    <Card><CardBody>
                                        <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                                            <Award size={18} /> Grading
                                        </h4>
                                        {!gradingMode ? (
                                            <div className="space-y-3">
                                                <Button
                                                    variant="primary"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setGradingMode(true);
                                                        setExpandedQuestions(
                                                            Object.fromEntries(questionResponses.map((_, i) => [i, true]))
                                                        );
                                                    }}
                                                >
                                                    <Star size={16} className="mr-2" /> Manual Grade
                                                </Button>
                                                {isGradable && (
                                                    <Button
                                                        variant="secondary"
                                                        className="w-full"
                                                        onClick={handleAiGrade}
                                                        disabled={aiGrading}
                                                    >
                                                        {aiGrading ? (
                                                            <><Loader2 size={16} className="animate-spin mr-2" /> AI Grading...</>
                                                        ) : (
                                                            <><Brain size={16} className="mr-2 text-amber-400" /> AI Grade (Gemini)</>
                                                        )}
                                                    </Button>
                                                )}
                                                <p className="text-xs text-secondary text-center">
                                                    {isGradable ? 'Manual grade or use AI for text-based answers' : 'Expand each question to assign scores'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                                    <p className="text-sm text-secondary">Total Score</p>
                                                    <p className="text-2xl font-bold text-primary">
                                                        {Object.values(grades).reduce((sum, v) => sum + Number(v), 0)}
                                                    </p>
                                                </div>
                                                <Button variant="primary" className="w-full" disabled={savingGrades} onClick={handleGrade}>
                                                    {savingGrades ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                                                    Save Grades
                                                </Button>
                                                <Button variant="secondary" className="w-full" onClick={() => setGradingMode(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </CardBody></Card>
                                </div>
                            )}

                            {/* Feedback display for respondents */}
                            {selectedResponse.feedback && !isOwner && (
                                <Card><CardBody>
                                    <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
                                        <MessageSquare size={18} /> Reviewer Feedback
                                    </h4>
                                    <p className="text-secondary text-sm bg-secondary/20 rounded-lg p-3">{selectedResponse.feedback}</p>
                                </CardBody></Card>
                            )}
                        </>
                    ) : (
                        <Card><CardBody className="text-center py-16">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-10 text-primary" />
                            <h3 className="text-lg font-semibold text-primary mb-2">
                                {responses.length === 0 ? 'No Responses Yet' : 'Select a Response'}
                            </h3>
                            <p className="text-secondary text-sm">
                                {responses.length === 0
                                    ? 'No one has submitted a response to this task yet.'
                                    : 'Click on a response from the list to view details and grade.'
                                }
                            </p>
                        </CardBody></Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResponseDetail;
