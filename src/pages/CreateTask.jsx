/**
 * Create Task - Multi-Step Wizard
 * Steps: 1) Basic Info  2) Questions  3) Settings  4) Review
 * Features: Gradable toggle, Document auto-fill, AI question generation, Grading config
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ArrowLeft, ArrowRight, Check, Plus, Trash2, GripVertical,
    FileText, Settings, Eye, ClipboardList, Timer, Shield,
    Video, Shuffle, AlertCircle, ChevronDown, Upload, Sparkles,
    Brain, Loader2, BookOpen, Wand2, Clock
} from 'lucide-react';
import { tasksService } from '../services/tasks.service';

const CATEGORIES = [
    { value: 'exam', label: 'Exam' },
    { value: 'test', label: 'Test' },
    { value: 'survey', label: 'Survey' },
    { value: 'questionnaire', label: 'Questionnaire' },
    { value: 'scheduling', label: 'Scheduling' },
    { value: 'other', label: 'Other' },
];

const DIFFICULTIES = [
    { value: 'none', label: 'Not Applicable' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

const QUESTION_TYPES = [
    { value: 'short_text', label: 'Short Text', icon: '📝' },
    { value: 'text', label: 'Paragraph Text', icon: '✏️' },
    { value: 'radio', label: 'Single Choice', icon: '⭕' },
    { value: 'check', label: 'Multiple Choice', icon: '☑️' },
    { value: 'file', label: 'Single File', icon: '📎' },
    { value: 'multiple_file', label: 'Multiple Files', icon: '📂' },
];

const STEPS = [
    { id: 1, label: 'Basic Info', icon: FileText },
    { id: 2, label: 'Questions', icon: ClipboardList },
    { id: 3, label: 'Settings', icon: Settings },
    { id: 4, label: 'Review', icon: Eye },
];

const CreateTask = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Step 1: Basic Info
    const [taskData, setTaskData] = useState({
        heading: '',
        description: '',
        category: 'other',
        difficulty: 'none',
        visibility: 'public',
        is_activity: false,
        is_gradable: false,
        start_date: '',
        due_date: '',
    });

    // Step 2: Questions
    const [questions, setQuestions] = useState([
        { heading: '', description: '', question_type: 'text', points: 1, correct_answer_text: '', choices: [], has_subquestion: false }
    ]);

    // Step 3: Settings
    const [settings, setSettings] = useState({
        timer_enabled: false,
        timer_duration: '',
        no_tab_leaving: false,
        auto_submit_on_tab_change: false,
        max_tab_switches: 3,
        auto_save: true,
        one_take: false,
        max_attempts: 1,
        record_video: false,
        shuffle_questions: false,
        show_results_immediately: true,
        questions_per_page: 4,
        passing_score: 0,
        accept_late_submissions: false,
    });

    // Grading config
    const [gradingConfig, setGradingConfig] = useState({
        auto_grade: false,
        ai_grading_enabled: false,
        score_release_mode: 'immediate',
    });

    // AI States
    const [docParsing, setDocParsing] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genText, setGenText] = useState('');
    const [genDifficulty, setGenDifficulty] = useState('mixed');
    const [genCount, setGenCount] = useState(5);
    const [genType, setGenType] = useState('mixed');
    const [generating, setGenerating] = useState(false);

    const updateTask = (field, value) => setTaskData(prev => ({ ...prev, [field]: value }));

    const addQuestion = () => {
        setQuestions(prev => [...prev, { heading: '', description: '', question_type: 'text', points: 1, correct_answer_text: '', choices: [], has_subquestion: false }]);
    };

    const updateQuestion = (idx, field, value) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (idx) => {
        if (questions.length > 1) setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const addChoice = (qIdx) => {
        setQuestions(prev => prev.map((q, i) =>
            i === qIdx ? { ...q, choices: [...q.choices, { content: '', is_correct: false }] } : q
        ));
    };

    const updateChoice = (qIdx, cIdx, field, value) => {
        setQuestions(prev => prev.map((q, i) =>
            i === qIdx ? {
                ...q, choices: q.choices.map((c, ci) => {
                    if (ci === cIdx) return { ...c, [field]: value };
                    if (field === 'is_correct' && value && q.question_type === 'radio') return { ...c, is_correct: false };
                    return c;
                })
            } : q
        ));
    };

    const removeChoice = (qIdx, cIdx) => {
        setQuestions(prev => prev.map((q, i) =>
            i === qIdx ? { ...q, choices: q.choices.filter((_, ci) => ci !== cIdx) } : q
        ));
    };

    // ====== AI: Document Auto-fill ======
    const handleDocUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setDocParsing(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await tasksService.generateFromDocument(formData);
            if (result.heading) updateTask('heading', result.heading);
            if (result.description) updateTask('description', result.description);
            if (result.category) updateTask('category', result.category);
            if (result.difficulty) updateTask('difficulty', result.difficulty);
            if (result.questions && result.questions.length > 0) {
                const mapped = result.questions.map(q => ({
                    heading: q.heading || '',
                    description: q.description || '',
                    question_type: q.question_type || 'text',
                    points: q.points || 1,
                    correct_answer_text: q.correct_answer_text || '',
                    choices: q.choices || [],
                    has_subquestion: false,
                }));
                setQuestions(mapped);
                updateTask('is_gradable', true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to parse document. Make sure GEMINI_API_KEY is set.');
        } finally {
            setDocParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ====== AI: Generate Questions ======
    const handleGenerateQuestions = async () => {
        setGenerating(true);
        setError('');
        try {
            const result = await tasksService.generateQuestions({
                text: genText,
                difficulty: genDifficulty,
                count: genCount,
                question_types: genType,
            });
            if (result.questions && result.questions.length > 0) {
                const mapped = result.questions.map(q => ({
                    heading: q.heading || '',
                    description: q.description || '',
                    question_type: q.question_type || 'text',
                    points: q.points || 1,
                    correct_answer_text: q.correct_answer_text || '',
                    choices: q.choices || [],
                    has_subquestion: false,
                }));
                setQuestions(prev => {
                    const hasContent = prev.some(q => q.heading.trim());
                    return hasContent ? [...prev, ...mapped] : mapped;
                });
                setShowGenModal(false);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate questions');
        } finally {
            setGenerating(false);
        }
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                if (!taskData.heading.trim()) { setError('Task heading is required'); return false; }
                if (!taskData.description.trim()) { setError('Description is required'); return false; }
                if (!taskData.start_date) { setError('Start date is required'); return false; }
                if (!taskData.due_date) { setError('Due date is required'); return false; }

                const start = new Date(taskData.start_date);
                const due = new Date(taskData.due_date);
                if (due <= start) { setError('Due date must be after start date'); return false; }
                break;
            case 2:
                if (taskData.is_activity) return true;
                for (let i = 0; i < questions.length; i++) {
                    if (!questions[i].heading.trim()) { setError(`Question ${i + 1} needs a heading`); return false; }
                    if (['radio', 'check'].includes(questions[i].question_type) && questions[i].choices.length < 2) {
                        setError(`Question ${i + 1} needs at least 2 choices`); return false;
                    }
                }
                break;
        }
        setError('');
        return true;
    };

    const nextStep = () => { if (validateStep()) setStep(prev => Math.min(prev + 1, 4)); };
    const prevStep = () => { setError(''); setStep(prev => Math.max(prev - 1, 1)); };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const payload = {
                ...taskData,
                questions: taskData.is_activity ? [] : questions.map((q, idx) => ({
                    heading: q.heading,
                    description: q.description || q.heading,
                    question_type: q.question_type,
                    position: idx + 1,
                    points: q.points || 1,
                    correct_answer_text: q.correct_answer_text || '',
                    has_subquestion: q.has_subquestion,
                    choices: q.choices.map(c => ({ content: c.content, is_correct: c.is_correct })),
                })),
                settings: {
                    ...settings,
                    timer_duration: settings.timer_enabled && settings.timer_duration
                        ? `00:${String(settings.timer_duration).padStart(2, '0')}:00`
                        : null,
                },
                grading_config: taskData.is_gradable ? gradingConfig : undefined,
            };
            const result = await tasksService.create(payload);
            navigate(`/tasks/${result.id || result.data?.id}`);
        } catch (err) {
            console.error('Task creation error:', err);
            setError(err.response?.data?.detail || err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-primary flex-1">Create Task</h1>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {STEPS.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <button
                            onClick={() => { if (s.id < step || validateStep()) setStep(s.id); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${step === s.id ? 'bg-primary text-white' :
                                step > s.id ? 'bg-green-500/10 text-green-500' :
                                    'bg-secondary text-secondary'
                                }`}
                        >
                            {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                            {s.label}
                        </button>
                        {idx < STEPS.length - 1 && <div className={`w-8 h-0.5 ${step > s.id ? 'bg-green-500' : 'bg-secondary/50'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <Card><CardBody className="space-y-5">
                    <h2 className="text-lg font-semibold text-primary mb-2">Basic Information</h2>

                    {/* Document Auto-fill */}
                    <div className="p-4 bg-gradient-to-r from-primary-600/10 to-blue-500/10 border border-primary-600/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                                <Wand2 size={20} className="text-primary-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-primary">Auto-fill from Document</h3>
                                <p className="text-xs text-secondary">Upload a PDF, DOCX, or image to auto-generate task and questions using AI</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
                                onChange={handleDocUpload}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={docParsing}
                            >
                                {docParsing ? <><Loader2 size={16} className="animate-spin mr-1" /> Parsing...</> : <><Upload size={16} className="mr-1" /> Upload</>}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Task Heading *</label>
                        <input type="text" value={taskData.heading} onChange={e => updateTask('heading', e.target.value)}
                            placeholder="e.g., Week 3 Quiz - Data Structures"
                            className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Description *</label>
                        <textarea value={taskData.description} onChange={e => updateTask('description', e.target.value)}
                            placeholder="Describe the task, instructions, and any special notes..."
                            className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none resize-y min-h-[120px] focus:ring-2 focus:ring-primary/30" />
                    </div>

                    {/* Task Mode Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary mb-1">Task Mode</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Normal Task */}
                            <button
                                type="button"
                                onClick={() => {
                                    updateTask('is_activity', false);
                                    updateTask('is_gradable', false);
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                    !taskData.is_activity && !taskData.is_gradable
                                        ? 'border-primary bg-primary/10 shadow-sm'
                                        : 'border-theme hover:border-primary/30 bg-secondary/5'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList size={16} className={!taskData.is_activity && !taskData.is_gradable ? 'text-primary' : 'text-secondary'} />
                                    <span className={`font-medium text-sm ${!taskData.is_activity && !taskData.is_gradable ? 'text-primary' : 'text-secondary'}`}>Standard Task</span>
                                </div>
                                <p className="text-xs text-tertiary">Requires submissions with questions</p>
                            </button>

                            {/* Activity */}
                            <button
                                type="button"
                                onClick={() => {
                                    updateTask('is_activity', true);
                                    updateTask('is_gradable', false);
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                    taskData.is_activity
                                        ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                                        : 'border-theme hover:border-blue-500/30 bg-secondary/5'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Check size={16} className={taskData.is_activity ? 'text-blue-500' : 'text-secondary'} />
                                    <span className={`font-medium text-sm ${taskData.is_activity ? 'text-blue-500' : 'text-secondary'}`}>Activity</span>
                                </div>
                                <p className="text-xs text-tertiary">No submissions — just "Mark as Done"</p>
                            </button>

                            {/* Gradable */}
                            <button
                                type="button"
                                onClick={() => {
                                    updateTask('is_gradable', true);
                                    updateTask('is_activity', false);
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                    taskData.is_gradable
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                                        : 'border-theme hover:border-emerald-500/30 bg-secondary/5'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen size={16} className={taskData.is_gradable ? 'text-emerald-500' : 'text-secondary'} />
                                    <span className={`font-medium text-sm ${taskData.is_gradable ? 'text-emerald-500' : 'text-secondary'}`}>Gradable</span>
                                </div>
                                <p className="text-xs text-tertiary">Enable grading, answer keys & scores</p>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Category</label>
                            <select value={taskData.category} onChange={e => updateTask('category', e.target.value)}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30">
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Difficulty</label>
                            <select value={taskData.difficulty} onChange={e => updateTask('difficulty', e.target.value)}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30">
                                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Visibility</label>
                            <select value={taskData.visibility} onChange={e => updateTask('visibility', e.target.value)}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="only_me">Only Me</option>
                                <option value="institutional">Institution</option>
                                <option value="organisational">Organisation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Start Date *</label>
                            <input type="datetime-local" value={taskData.start_date} onChange={e => updateTask('start_date', e.target.value)}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Due Date *</label>
                            <input type="datetime-local" value={taskData.due_date} onChange={e => updateTask('due_date', e.target.value)}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                    </div>
                </CardBody></Card>
            )}

            {/* Step 2: Questions */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-primary">Questions ({questions.length})</h2>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setShowGenModal(true)}>
                                <Sparkles size={16} className="mr-1 text-amber-400" /> AI Generate
                            </Button>
                            <Button variant="primary" size="sm" onClick={addQuestion}><Plus size={16} className="mr-1" /> Add Question</Button>
                        </div>
                    </div>

                    {questions.map((q, qIdx) => (
                        <Card key={qIdx} className="border-l-4 border-l-primary/40">
                            <CardBody className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                        <GripVertical size={16} className="text-tertiary" />
                                        Question {qIdx + 1}
                                        {taskData.is_gradable && (
                                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                {q.points} pts
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => removeQuestion(qIdx)}
                                        className="text-red-400 hover:text-red-300 p-1" disabled={questions.length === 1}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <input type="text" value={q.heading} onChange={e => updateQuestion(qIdx, 'heading', e.target.value)}
                                    placeholder="Question heading..."
                                    className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/30" />

                                <div className="flex flex-wrap gap-2">
                                    {QUESTION_TYPES.map(t => (
                                        <button key={t.value}
                                            onClick={() => updateQuestion(qIdx, 'question_type', t.value)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${q.question_type === t.value
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'border-theme text-secondary hover:border-primary/20'
                                                }`}>
                                            <span>{t.icon}</span> {t.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Points for gradable */}
                                {taskData.is_gradable && (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                        <label className="text-sm text-secondary shrink-0">Points:</label>
                                        <input type="number" min="0.5" step="0.5" value={q.points}
                                            onChange={e => updateQuestion(qIdx, 'points', parseFloat(e.target.value) || 1)}
                                            className="w-20 px-3 py-1.5 bg-transparent border border-theme rounded-lg text-primary text-sm outline-none" />
                                        {!['radio', 'check'].includes(q.question_type) && (
                                            <>
                                                <label className="text-sm text-secondary shrink-0 ml-auto">Answer Key:</label>
                                                <input type="text" value={q.correct_answer_text}
                                                    onChange={e => updateQuestion(qIdx, 'correct_answer_text', e.target.value)}
                                                    placeholder="Expected answer..."
                                                    className="flex-1 px-3 py-1.5 bg-transparent border border-theme rounded-lg text-primary text-sm outline-none" />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Choices for radio/check */}
                                {['radio', 'check'].includes(q.question_type) && (
                                    <div className="space-y-2 pl-4 border-l-2 border-theme">
                                        <p className="text-xs text-secondary font-medium">
                                            Answer Choices {q.question_type === 'radio' ? '(select one correct)' : '(select correct ones)'}
                                            {taskData.is_gradable && <span className="text-emerald-400 ml-1">— mark correct answers for auto-grading</span>}
                                        </p>
                                        {q.choices.map((c, cIdx) => (
                                            <div key={cIdx} className="flex items-center gap-2">
                                                <button onClick={() => updateChoice(qIdx, cIdx, 'is_correct', !c.is_correct)}
                                                    className={`w-5 h-5 rounded-${q.question_type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center shrink-0 transition-colors ${c.is_correct ? 'bg-green-500 border-green-500 text-white' : 'border-theme'
                                                        }`}>
                                                    {c.is_correct && <Check size={12} />}
                                                </button>
                                                <input type="text" value={c.content}
                                                    onChange={e => updateChoice(qIdx, cIdx, 'content', e.target.value)}
                                                    placeholder={`Choice ${cIdx + 1}...`}
                                                    className="flex-1 px-3 py-1.5 bg-transparent border border-theme rounded-lg text-primary text-sm outline-none focus:ring-1 focus:ring-primary/20" />
                                                <button onClick={() => removeChoice(qIdx, cIdx)}
                                                    className="text-red-400 hover:text-red-300 p-0.5">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addChoice(qIdx)}
                                            className="text-sm text-primary hover:underline flex items-center gap-1">
                                            <Plus size={14} /> Add Choice
                                        </button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}

                    <div className="flex justify-center mt-4">
                        <Button variant="secondary" onClick={addQuestion} className="w-full md:w-auto">
                            <Plus size={16} className="mr-1" /> Add Another Question
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
                <Card><CardBody className="space-y-6">
                    <h2 className="text-lg font-semibold text-primary mb-2">Advanced Settings</h2>

                    {/* Timer */}
                    <div className="p-4 bg-secondary/30 rounded-lg border border-theme/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Timer size={18} className="text-blue-400" />
                                <span className="font-medium text-primary">Timer</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.timer_enabled}
                                    onChange={e => setSettings(prev => ({ ...prev, timer_enabled: e.target.checked }))}
                                    className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        {settings.timer_enabled && (
                            <div>
                                <label className="text-sm text-secondary">Duration (minutes)</label>
                                <input type="number" min="1" max="600" value={settings.timer_duration}
                                    onChange={e => setSettings(prev => ({ ...prev, timer_duration: e.target.value }))}
                                    className="mt-1 w-32 px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Tab Detection */}
                    <div className="p-4 bg-secondary/30 rounded-lg border border-theme/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Shield size={18} className="text-orange-400" />
                                <span className="font-medium text-primary">Tab/Focus Detection</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.no_tab_leaving}
                                    onChange={e => setSettings(prev => ({ ...prev, no_tab_leaving: e.target.checked }))}
                                    className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        {settings.no_tab_leaving && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-secondary">Auto-submit on tab change</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={settings.auto_submit_on_tab_change}
                                            onChange={e => setSettings(prev => ({ ...prev, auto_submit_on_tab_change: e.target.checked }))}
                                            className="sr-only peer" />
                                        <div className="w-9 h-5 bg-secondary rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                    </label>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary">Max tab switches allowed</label>
                                    <input type="number" min="1" max="20" value={settings.max_tab_switches}
                                        onChange={e => setSettings(prev => ({ ...prev, max_tab_switches: parseInt(e.target.value) || 3 }))}
                                        className="mt-1 w-24 px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attempt Control */}
                    <div className="p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                        <h4 className="font-medium text-primary">Attempt Control</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-secondary">One-take only (single attempt)</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.one_take}
                                    onChange={e => setSettings(prev => ({ ...prev, one_take: e.target.checked, max_attempts: e.target.checked ? 1 : prev.max_attempts }))}
                                    className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        {!settings.one_take && (
                            <div>
                                <label className="text-sm text-secondary">Max attempts</label>
                                <input type="number" min="1" max="50" value={settings.max_attempts}
                                    onChange={e => setSettings(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                                    className="mt-1 w-24 px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Display & Features */}
                    <div className="p-4 bg-secondary/30 rounded-lg border border-theme/50 space-y-3">
                        <h4 className="font-medium text-primary">Display & Features</h4>
                        {[
                            { key: 'record_video', label: 'Record video during task', icon: <Video size={16} className="text-primary-500" /> },
                            { key: 'shuffle_questions', label: 'Shuffle question order', icon: <Shuffle size={16} className="text-teal-400" /> },
                            { key: 'show_results_immediately', label: 'Show results immediately', icon: <Eye size={16} className="text-green-400" /> },
                            { key: 'auto_save', label: 'Auto-save progress', icon: <ClipboardList size={16} className="text-blue-400" /> },
                        ].map(opt => (
                            <div key={opt.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {opt.icon}
                                    <span className="text-sm text-secondary">{opt.label}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings[opt.key]}
                                        onChange={e => setSettings(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        ))}
                        <div>
                            <label className="text-sm text-secondary">Questions per page</label>
                            <input type="number" min="1" max="50" value={settings.questions_per_page}
                                onChange={e => setSettings(prev => ({ ...prev, questions_per_page: parseInt(e.target.value) || 4 }))}
                                className="mt-1 w-24 px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-sm text-secondary">Passing score (%)</label>
                            <input type="number" min="0" max="100" value={settings.passing_score}
                                onChange={e => setSettings(prev => ({ ...prev, passing_score: parseFloat(e.target.value) || 0 }))}
                                className="mt-1 w-24 px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none" />
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-orange-400" />
                                <span className="text-sm font-medium text-primary">Accept Late Submissions</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.accept_late_submissions}
                                    onChange={e => setSettings(prev => ({ ...prev, accept_late_submissions: e.target.checked }))}
                                    className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>

                    {/* Grading Config (if gradable) */}
                    {taskData.is_gradable && (
                        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl border border-emerald-500/20 space-y-4">
                            <h4 className="font-medium text-primary flex items-center gap-2">
                                <Brain size={18} className="text-emerald-400" /> Grading Configuration
                            </h4>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-primary">Auto-grade (choice-based)</span>
                                    <p className="text-xs text-secondary">Automatically grade multiple-choice answers on submission</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={gradingConfig.auto_grade}
                                        onChange={e => setGradingConfig(prev => ({ ...prev, auto_grade: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-primary flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-400" /> AI Grading (text answers)
                                    </span>
                                    <p className="text-xs text-secondary">Use AI to grade open-ended and paragraph answers</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={gradingConfig.ai_grading_enabled}
                                        onChange={e => setGradingConfig(prev => ({ ...prev, ai_grading_enabled: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <div>
                                <label className="text-sm text-secondary mb-1 block">Score Release</label>
                                <select value={gradingConfig.score_release_mode}
                                    onChange={e => setGradingConfig(prev => ({ ...prev, score_release_mode: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary outline-none text-sm">
                                    <option value="immediate">Immediately after submission</option>
                                    <option value="on_due_date">When due date passes</option>
                                    <option value="manual">Manually by creator</option>
                                </select>
                            </div>
                        </div>
                    )}
                </CardBody></Card>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
                <div className="space-y-4">
                    <Card><CardBody>
                        <h3 className="font-semibold text-lg text-primary mb-3">Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-secondary">Heading:</span> <span className="text-primary font-medium">{taskData.heading}</span></div>
                            <div><span className="text-secondary">Category:</span> <span className="text-primary font-medium capitalize">{taskData.category}</span></div>
                            <div><span className="text-secondary">Difficulty:</span> <span className="text-primary font-medium capitalize">{taskData.difficulty}</span></div>
                            <div><span className="text-secondary">Visibility:</span> <span className="text-primary font-medium capitalize">{taskData.visibility}</span></div>
                            <div><span className="text-secondary">Questions:</span> <span className="text-primary font-medium">{questions.length}</span></div>
                            <div><span className="text-secondary">Due:</span> <span className="text-primary font-medium">{taskData.due_date ? new Date(taskData.due_date).toLocaleString() : 'Not set'}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {!taskData.is_gradable && !taskData.is_activity && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">📝 Standard Task</span>}
                            {taskData.is_gradable && <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">✅ Gradable</span>}
                            {taskData.is_activity && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">📋 Activity</span>}
                            {gradingConfig.auto_grade && <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">⚡ Auto-Grade</span>}
                            {gradingConfig.ai_grading_enabled && <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">🤖 AI Grading</span>}
                        </div>
                    </CardBody></Card>

                    <Card><CardBody>
                        <h3 className="font-semibold text-primary mb-3">Questions Preview</h3>
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-theme/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                                        <span className="font-medium text-primary text-sm">{q.heading || 'Untitled'}</span>
                                        <span className="text-xs text-secondary ml-auto capitalize px-2 py-0.5 bg-secondary rounded-full">{q.question_type}</span>
                                        {taskData.is_gradable && <span className="text-xs text-emerald-400">{q.points}pts</span>}
                                    </div>
                                    {q.choices.length > 0 && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {q.choices.map((c, ci) => (
                                                <div key={ci} className="text-xs text-secondary flex items-center gap-1.5">
                                                    {c.is_correct ? <Check size={12} className="text-green-400" /> : <span className="w-3 h-3 rounded-full border border-theme inline-block" />}
                                                    {c.content || 'Empty choice'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {taskData.is_gradable && q.correct_answer_text && (
                                        <div className="ml-8 mt-1 text-xs text-emerald-400">
                                            Answer key: {q.correct_answer_text}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardBody></Card>

                    <Card><CardBody>
                        <h3 className="font-semibold text-primary mb-3">Settings Summary</h3>
                        <div className="flex flex-wrap gap-2">
                            {settings.timer_enabled && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">⏱ Timer: {settings.timer_duration}min</span>}
                            {settings.no_tab_leaving && <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs">🔒 No Tab Leaving</span>}
                            {settings.one_take && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">☝️ One Take</span>}
                            {settings.record_video && <span className="px-3 py-1 rounded-full bg-primary-600/10 text-primary-500 text-xs">📹 Video Recording</span>}
                            {settings.shuffle_questions && <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs">🔀 Shuffle</span>}
                            {settings.auto_save && <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">💾 Auto-Save</span>}
                            <span className="px-3 py-1 rounded-full bg-secondary text-secondary text-xs">📄 {settings.questions_per_page} per page</span>
                            {settings.passing_score > 0 && <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">🎯 Pass: {settings.passing_score}%</span>}
                        </div>
                    </CardBody></Card>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
                <Button variant="secondary" onClick={prevStep} disabled={step === 1}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
                {step < 4 ? (
                    <Button variant="primary" onClick={nextStep}>
                        Next <ArrowRight size={16} className="ml-1" />
                    </Button>
                ) : (
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Task'} {!submitting && <Check size={16} className="ml-1" />}
                    </Button>
                )}
            </div>

            {/* AI Generate Questions Modal */}
            {showGenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardBody className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <Sparkles size={20} className="text-amber-400" /> Generate Questions from Notes
                                </h3>
                                <button onClick={() => setShowGenModal(false)} className="text-secondary hover:text-primary p-1">✕</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Paste your notes or content *</label>
                                <textarea
                                    value={genText}
                                    onChange={e => setGenText(e.target.value)}
                                    placeholder="Paste lecture notes, study material, or any text you want to generate questions from..."
                                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg text-primary outline-none resize-y min-h-[200px] focus:ring-2 focus:ring-primary/30 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-secondary mb-1">Difficulty</label>
                                    <select value={genDifficulty} onChange={e => setGenDifficulty(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none text-sm">
                                        <option value="mixed">Mixed</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary mb-1">Count</label>
                                    <input type="number" min="1" max="20" value={genCount}
                                        onChange={e => setGenCount(parseInt(e.target.value) || 5)}
                                        className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary mb-1">Type</label>
                                    <select value={genType} onChange={e => setGenType(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-theme rounded-lg text-primary outline-none text-sm">
                                        <option value="mixed">Mixed</option>
                                        <option value="radio">Single Choice</option>
                                        <option value="check">Multiple Choice</option>
                                        <option value="text">Open-ended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="secondary" onClick={() => setShowGenModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleGenerateQuestions} disabled={generating || !genText.trim()}>
                                    {generating ? <><Loader2 size={16} className="animate-spin mr-1" /> Generating...</> : <><Sparkles size={16} className="mr-1" /> Generate</>}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CreateTask;
