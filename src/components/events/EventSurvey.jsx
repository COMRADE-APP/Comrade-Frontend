import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import eventsService from '../../services/events.service';
import { ClipboardList, Plus, X, Check, Send, BarChart3, Save, BookTemplate, Star } from 'lucide-react';

const QUESTION_TYPES = [
    { value: 'text', label: 'Text Response' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'rating', label: 'Rating Scale (1-5)' },
];

const EventSurvey = ({ event, isOrganizer }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showRespond, setShowRespond] = useState(null);
    const [showResults, setShowResults] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([{ text: '', type: 'text', options: [] }]);
    const [responses, setResponses] = useState({});
    const [results, setResults] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [templates, setTemplates] = useState([]);

    const loadSurveys = async () => {
        setLoading(true);
        try {
            const res = await eventsService.getEventSurveys(event.id);
            const data = res.data;
            setSurveys(data?.results || data || []);
        } catch {
            setSurveys([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await eventsService.getSurveyTemplates();
            setTemplates(res.data?.results || res.data || []);
        } catch {
            setTemplates([]);
        }
    };

    useEffect(() => { loadSurveys(); }, [event.id]);

    const openCreate = () => {
        setShowCreate(true);
        loadTemplates();
    };

    const loadResults = async (survey) => {
        const resultMap = {};
        for (const q of survey.questions || []) {
            try {
                const res = await eventsService.getSurveyResponses(q.id);
                resultMap[q.id] = res.data || [];
            } catch {
                resultMap[q.id] = [];
            }
        }
        setResults(resultMap);
        setShowResults(survey.id);
    };

    const handleAddQuestion = () => setQuestions([...questions, { text: '', type: 'text', options: [] }]);
    const handleRemoveQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
    const handleQuestionChange = (idx, field, val) => {
        const updated = [...questions];
        updated[idx] = { ...updated[idx], [field]: val };
        if (field === 'type' && val !== 'multiple_choice') updated[idx].options = [];
        setQuestions(updated);
    };
    const handleOptionAdd = (idx, opt) => {
        if (!opt.trim()) return;
        const updated = [...questions];
        updated[idx] = { ...updated[idx], options: [...updated[idx].options, opt.trim()] };
        setQuestions(updated);
    };
    const handleOptionRemove = (qIdx, oIdx) => {
        const updated = [...questions];
        updated[qIdx] = { ...updated[qIdx], options: updated[qIdx].options.filter((_, i) => i !== oIdx) };
        setQuestions(updated);
    };
    const [optionsInput, setOptionsInput] = useState({});

    const applyTemplate = (template) => {
        setTitle(template.template_title);
        setDescription(template.template_description || '');
        if (template.questions_data && template.questions_data.length > 0) {
            setQuestions(template.questions_data.map(q => ({
                text: q.question_text || '',
                type: q.question_type || 'text',
                options: q.options || [],
            })));
        } else {
            setQuestions([{ text: '', type: 'text', options: [] }]);
        }
    };

    const handleCreateSurvey = async () => {
        if (!title.trim() || questions.some(q => !q.text.trim())) return;
        setSubmitting(true);
        try {
            const surveyRes = await eventsService.createSurvey({
                event: event.id,
                survey_title: title,
                survey_description: description,
            });
            const surveyId = surveyRes.data.id;
            for (const q of questions) {
                await eventsService.createSurveyQuestion({
                    survey: surveyId,
                    question_text: q.text,
                    question_type: q.type,
                    options: q.options,
                });
            }
            toast.success('Survey created successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create survey');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!title.trim() || questions.some(q => !q.text.trim())) {
            toast.error('Please fill in the survey title and questions first');
            return;
        }
        try {
            await eventsService.createSurveyTemplate({
                template_title: title,
                template_description: description,
                questions_data: questions.map(q => ({
                    question_text: q.text,
                    question_type: q.type,
                    options: q.options,
                })),
            });
            toast.success('Template saved!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save template');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setQuestions([{ text: '', type: 'text', options: [] }]);
    };

    const handleSubmitResponse = async (survey) => {
        const unanswered = (survey.questions || []).filter(q => {
            const r = responses[q.id];
            if (!r) return true;
            if (typeof r === 'object' && r.value === undefined) return true;
            return false;
        });
        if (unanswered.length > 0) { toast.error('Please answer all questions'); return; }
        setSubmitting(true);
        try {
            for (const q of survey.questions || []) {
                const r = responses[q.id];
                const responseText = typeof r === 'object' ? JSON.stringify(r) : (r || '');
                await eventsService.submitSurveyResponse({
                    question: q.id,
                    user: user?.id,
                    response_text: responseText,
                });
            }
            toast.success('Survey responses submitted!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit responses');
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuestionInput = (q, idx) => {
        if (q.question_type === 'multiple_choice') {
            return (
                <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={responses[q.id]?.value === opt}
                                onChange={() => setResponses(prev => ({ ...prev, [q.id]: { type: 'multiple_choice', value: opt } }))}
                                className="text-primary-600"
                            />
                            <span className="text-sm text-primary">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        }
        if (q.question_type === 'rating') {
            const [min, max] = q.options?.length === 2 ? q.options : [1, 5];
            const stars = [];
            for (let i = min; i <= max; i++) stars.push(i);
            return (
                <div className="flex items-center gap-1">
                    {stars.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setResponses(prev => ({ ...prev, [q.id]: { type: 'rating', value: s } }))}
                            className={`p-1.5 rounded-lg transition-colors ${(responses[q.id]?.value || 0) >= s ? 'text-yellow-500' : 'text-tertiary hover:text-yellow-400'}`}
                        >
                            <Star size={22} className={responses[q.id]?.value >= s ? 'fill-current' : ''} />
                        </button>
                    ))}
                    <span className="text-sm text-secondary ml-2">{responses[q.id]?.value ? `${responses[q.id].value}/${max}` : ''}</span>
                </div>
            );
        }
        return (
            <textarea
                value={responses[q.id] || ''}
                onChange={e => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary resize-y"
                rows={3} placeholder="Your answer..."
            />
        );
    };

    const renderQuestionType = (q, idx) => (
        <div className="flex items-center gap-2">
            <select
                value={q.type}
                onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                className="text-xs px-2 py-1 bg-elevated border border-theme rounded text-tertiary outline-none"
            >
                {QUESTION_TYPES.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
            </select>
            {q.type === 'multiple_choice' && (
                <div className="flex items-center gap-1 flex-1">
                    <input
                        placeholder="Add option..."
                        value={optionsInput[idx] || ''}
                        onChange={e => setOptionsInput(prev => ({ ...prev, [idx]: e.target.value }))}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleOptionAdd(idx, optionsInput[idx] || ''); setOptionsInput(prev => ({ ...prev, [idx]: '' })); }
                        }}
                        className="flex-1 text-xs px-2 py-1 bg-elevated border border-theme rounded outline-none text-primary"
                    />
                    {q.options.map((opt, oIdx) => (
                        <span key={oIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-600">
                            {opt}
                            <button onClick={() => handleOptionRemove(idx, oIdx)} className="hover:text-red-500"><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-primary">Surveys</h3>
                {isOrganizer && (
                    <Button variant="outline" size="sm" onClick={openCreate}>
                        <Plus size={16} className="mr-1" /> Create Survey
                    </Button>
                )}
            </div>

            {loading ? (
                <p className="text-secondary text-center py-8">Loading surveys...</p>
            ) : surveys.length === 0 ? (
                <Card><CardBody>
                    <div className="text-center py-8">
                        <ClipboardList size={40} className="mx-auto mb-3 text-secondary" />
                        <p className="text-secondary">No surveys yet</p>
                        {isOrganizer && (
                            <Button variant="outline" size="sm" onClick={openCreate} className="mt-3">
                                <Plus size={16} className="mr-1" /> Create the first survey
                            </Button>
                        )}
                    </div>
                </CardBody></Card>
            ) : (
                surveys.map(survey => (
                    <Card key={survey.id}>
                        <CardBody>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold text-primary">{survey.survey_title}</h4>
                                    {survey.survey_description && (
                                        <p className="text-sm text-secondary mt-1">{survey.survey_description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isOrganizer && (
                                        <Button variant="ghost" size="sm" onClick={() => loadResults(survey)} title="View Results">
                                            <BarChart3 size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {survey.questions?.length > 0 && (
                                <p className="text-xs text-secondary mb-3">{survey.questions.length} question(s)</p>
                            )}
                            {!isOrganizer && (
                                <Button variant="outline" size="sm" onClick={() => { setShowRespond(survey.id); setResponses({}); }}>
                                    <ClipboardList size={16} className="mr-1" /> Answer Survey
                                </Button>
                            )}
                        </CardBody>
                    </Card>
                ))
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">Create Survey</h3>
                                <button onClick={() => setShowCreate(false)}><X size={20} className="text-secondary" /></button>
                            </div>

                            {templates.length > 0 && (
                                <div className="mb-4 p-3 bg-elevated rounded-lg">
                                    <label className="block text-xs font-medium text-secondary mb-2">Start from a template</label>
                                    <div className="flex flex-wrap gap-2">
                                        {templates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => applyTemplate(t)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 transition-colors"
                                            >
                                                <BookTemplate size={12} />
                                                {t.template_title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Title</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary"
                                        placeholder="Survey title" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary resize-y"
                                        rows={2} placeholder="Optional description" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">Questions</label>
                                    {questions.map((q, idx) => (
                                        <div key={idx} className="mb-3 p-3 bg-elevated rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <input value={q.text} onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                                                    className="flex-1 px-3 py-1.5 bg-secondary border border-theme rounded-lg text-primary outline-none focus:border-primary text-sm"
                                                    placeholder={`Question ${idx + 1}`} />
                                                {questions.length > 1 && (
                                                    <button onClick={() => handleRemoveQuestion(idx)} className="text-red-400 hover:text-red-300"><X size={18} /></button>
                                                )}
                                            </div>
                                            {renderQuestionType(q, idx)}
                                        </div>
                                    ))}
                                    <Button variant="ghost" size="sm" onClick={handleAddQuestion} className="mt-1">
                                        <Plus size={16} className="mr-1" /> Add Question
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-between gap-3 mt-6">
                                <Button variant="ghost" size="sm" onClick={handleSaveAsTemplate} disabled={!title.trim()}>
                                    <Save size={16} className="mr-1" /> Save as Template
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleCreateSurvey}
                                        disabled={submitting || !title.trim() || questions.some(q => !q.text.trim())}>
                                        {submitting ? 'Creating...' : <><Check size={16} className="mr-1" /> Create</>}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {showRespond && (() => {
                const survey = surveys.find(s => s.id === showRespond);
                if (!survey) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                            <CardBody className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-primary">{survey.survey_title}</h3>
                                    <button onClick={() => setShowRespond(null)}><X size={20} className="text-secondary" /></button>
                                </div>
                                {survey.survey_description && <p className="text-sm text-secondary mb-4">{survey.survey_description}</p>}
                                <div className="space-y-5">
                                    {(survey.questions || []).map((q, idx) => (
                                        <div key={q.id}>
                                            <label className="block text-sm font-medium text-primary mb-2">
                                                {idx + 1}. {q.question_text}
                                            </label>
                                            {renderQuestionInput(q, idx)}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button variant="secondary" onClick={() => setShowRespond(null)}>Cancel</Button>
                                    <Button variant="primary" onClick={() => handleSubmitResponse(survey)} disabled={submitting}>
                                        {submitting ? 'Submitting...' : <><Send size={16} className="mr-1" /> Submit</>}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );
            })()}

            {showResults && (() => {
                const survey = surveys.find(s => s.id === showResults);
                if (!survey) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                            <CardBody className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-primary">Results: {survey.survey_title}</h3>
                                    <button onClick={() => setShowResults(null)}><X size={20} className="text-secondary" /></button>
                                </div>
                                {(survey.questions || []).length === 0 ? (
                                    <p className="text-secondary text-center py-4">No questions in this survey</p>
                                ) : (
                                    <div className="space-y-6">
                                        {(survey.questions || []).map((q, idx) => {
                                            const questionResponses = results[q.id] || [];
                                            return (
                                                <div key={q.id}>
                                                    <h4 className="font-medium text-primary mb-2">{idx + 1}. {q.question_text}</h4>
                                                    <p className="text-xs text-secondary mb-2">{questionResponses.length} response(s)</p>
                                                    {questionResponses.length === 0 ? (
                                                        <p className="text-sm text-secondary italic">No responses yet</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {questionResponses.map((r, rIdx) => (
                                                                <div key={r.id || rIdx} className="p-3 bg-elevated rounded-lg">
                                                                    <p className="text-sm text-primary">{r.response_text}</p>
                                                                    <p className="text-xs text-secondary mt-1">{r.user_name || r.user_email || `User #${r.user}`}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="flex justify-end mt-6">
                                    <Button variant="secondary" onClick={() => setShowResults(null)}>Close</Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );
            })()}
        </div>
    );
};

export default EventSurvey;
