import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import { useToast } from '../../contexts/ToastContext';
import eventsService from '../../services/events.service';
import { ClipboardList, Plus, X, Check, Send, BarChart3 } from 'lucide-react';

const EventSurvey = ({ event, isOrganizer }) => {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRespond, setShowRespond] = useState(null);
  const [showResults, setShowResults] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [responses, setResponses] = useState({});
  const [results, setResults] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => { loadSurveys(); }, [event.id]);

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

  const handleAddQuestion = () => setQuestions([...questions, '']);
  const handleRemoveQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
  const handleQuestionChange = (idx, val) => {
    const updated = [...questions];
    updated[idx] = val;
    setQuestions(updated);
  };

  const handleCreateSurvey = async () => {
    if (!title.trim() || questions.some(q => !q.trim())) return;
    setSubmitting(true);
    try {
      const surveyRes = await eventsService.createSurvey({
        event: event.id,
        survey_title: title,
        survey_description: description,
      });
      const surveyId = surveyRes.data.id;
      for (const qText of questions) {
        await eventsService.createSurveyQuestion({
          survey: surveyId,
          question_text: qText,
        });
      }
      showToast('Survey created successfully!', 'success');
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setQuestions(['']);
      loadSurveys();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create survey', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (survey) => {
    const unanswered = (survey.questions || []).filter(q => !responses[q.id]?.trim());
    if (unanswered.length > 0) {
      showToast('Please answer all questions', 'error');
      return;
    }
    setSubmitting(true);
    try {
      for (const q of survey.questions || []) {
        await eventsService.submitSurveyResponse({
          question: q.id,
          user: event.created_by,
          response_text: responses[q.id],
        });
      }
      showToast('Survey responses submitted!', 'success');
      setShowRespond(null);
      setResponses({});
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit responses', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary">Surveys</h3>
        {isOrganizer && (
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
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
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="mt-3">
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
                    <Button variant="ghost" size="sm" onClick={() => loadResults(survey)}>
                      <BarChart3 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {survey.questions?.length > 0 && (
                <p className="text-xs text-secondary mb-3">{survey.questions.length} question(s)</p>
              )}

              {!isOrganizer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowRespond(survey.id); setResponses({}); }}
                >
                  <ClipboardList size={16} className="mr-1" /> Answer Survey
                </Button>
              )}
            </CardBody>
          </Card>
        ))
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">Create Survey</h3>
                <button onClick={() => setShowCreate(false)}><X size={20} className="text-secondary" /></button>
              </div>
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
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input value={q} onChange={e => handleQuestionChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary"
                        placeholder={`Question ${idx + 1}`} />
                      {questions.length > 1 && (
                        <button onClick={() => handleRemoveQuestion(idx)} className="text-red-400 hover:text-red-300">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={handleAddQuestion} className="mt-1">
                    <Plus size={16} className="mr-1" /> Add Question
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateSurvey}
                  disabled={submitting || !title.trim() || questions.some(q => !q.trim())}>
                  {submitting ? 'Creating...' : <><Check size={16} className="mr-1" /> Create</>}
                </Button>
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
                {survey.survey_description && (
                  <p className="text-sm text-secondary mb-4">{survey.survey_description}</p>
                )}
                <div className="space-y-4">
                  {(survey.questions || []).map((q, idx) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-primary mb-1">
                        {idx + 1}. {q.question_text}
                      </label>
                      <textarea
                        value={responses[q.id] || ''}
                        onChange={e => setResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary resize-y"
                        rows={3} placeholder="Your answer..."
                      />
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
                          <h4 className="font-medium text-primary mb-2">
                            {idx + 1}. {q.question_text}
                          </h4>
                          <p className="text-xs text-secondary mb-2">{questionResponses.length} response(s)</p>
                          {questionResponses.length === 0 ? (
                            <p className="text-sm text-secondary italic">No responses yet</p>
                          ) : (
                            <div className="space-y-2">
                              {questionResponses.map((r, rIdx) => (
                                <div key={r.id || rIdx} className="p-3 bg-elevated rounded-lg">
                                  <p className="text-sm text-primary">{r.response_text}</p>
                                  <p className="text-xs text-secondary mt-1">
                                    {r.user_name || r.user_email || `User #${r.user}`}
                                  </p>
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
