import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ArrowLeft, Plus, Trash2, Save, Send, X } from 'lucide-react';
import tasksService from '../services/tasks.service';

const TaskCreation = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [task, setTask] = useState({
        heading: '',
        description: '',
        category: 'exam',
        difficulty: 'intermediate',
        visibility: 'private',
        due_date: '',
        questions: []
    });

    const categories = [
        { id: 'exam', label: 'Exam' },
        { id: 'test', label: 'Test' },
        { id: 'survey', label: 'Survey' },
        { id: 'questionnaire', label: 'Questionnaire' },
        { id: 'scheduling', label: 'Scheduling' },
        { id: 'other', label: 'Other' }
    ];

    const difficultyLevels = [
        { id: 'beginner', label: 'Beginner' },
        { id: 'intermediate', label: 'Intermediate' },
        { id: 'advanced', label: 'Advanced' },
        { id: 'none', label: 'Not Applicable' }
    ];

    const questionTypes = [
        { id: 'text', label: 'Text Answer' },
        { id: 'radio', label: 'Single Choice (Radio)' },
        { id: 'check', label: 'Multiple Choice (Checkboxes)' },
        { id: 'file', label: 'File Upload' }
    ];

    const addQuestion = () => {
        setTask({
            ...task,
            questions: [
                ...task.questions,
                {
                    heading: '',
                    description: '',
                    question_type: 'text',
                    position: task.questions.length + 1,
                    choices: []
                }
            ]
        });
    };

    const removeQuestion = (index) => {
        const newQuestions = task.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, position: i + 1 }));
        setTask({ ...task, questions: newQuestions });
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...task.questions];
        newQuestions[index][field] = value;
        setTask({ ...task, questions: newQuestions });
    };

    const addChoice = (qIndex) => {
        const newQuestions = [...task.questions];
        if (!newQuestions[qIndex].choices) newQuestions[qIndex].choices = [];
        newQuestions[qIndex].choices.push({ content: '', is_correct: false });
        setTask({ ...task, questions: newQuestions });
    };

    const removeChoice = (qIndex, cIndex) => {
        const newQuestions = [...task.questions];
        newQuestions[qIndex].choices = newQuestions[qIndex].choices.filter((_, i) => i !== cIndex);
        setTask({ ...task, questions: newQuestions });
    };

    const updateChoice = (qIndex, cIndex, field, value) => {
        const newQuestions = [...task.questions];
        newQuestions[qIndex].choices[cIndex][field] = value;
        setTask({ ...task, questions: newQuestions });
    };

    const handleSave = async (status) => {
        if (!task.heading || !task.due_date) {
            alert('Title and Due Date are required.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...task,
                status: status
            };
            await tasksService.create(payload);
            alert(`Task successfully ${status === 'draft' ? 'saved as draft' : 'published'}!`);
            navigate('/tasks');
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task. ' + (error.response?.data?.error || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/tasks')}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-secondary" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-primary flex-1">Create Task</h1>
            </div>

            <Card>
                <CardBody className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            label="Task Title"
                            value={task.heading}
                            onChange={(e) => setTask({ ...task, heading: e.target.value })}
                            required
                            placeholder="Enter task heading..."
                        />

                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Description</label>
                            <textarea
                                value={task.description}
                                onChange={(e) => setTask({ ...task, description: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Describe the overall task, syllabus, or instructions..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Category</label>
                                <select
                                    value={task.category}
                                    onChange={(e) => setTask({ ...task, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Difficulty</label>
                                <select
                                    value={task.difficulty}
                                    onChange={(e) => setTask({ ...task, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    {difficultyLevels.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={task.due_date}
                                    onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Visibility</label>
                                <select
                                    value={task.visibility}
                                    onChange={(e) => setTask({ ...task, visibility: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="private">Private</option>
                                    <option value="course">Course / Class</option>
                                    <option value="institutional">Institutional</option>
                                    <option value="public">Public</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary">Dynamic Questions</h2>
                    <Button variant="outline" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                    </Button>
                </div>

                {task.questions.map((q, qIndex) => (
                    <Card key={qIndex} className="border-l-4 border-l-primary-500">
                        <CardBody className="space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-primary">Question {qIndex + 1}</h3>
                                <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <Input
                                        placeholder="Question Title / Prompt"
                                        value={q.heading}
                                        onChange={(e) => updateQuestion(qIndex, 'heading', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={q.question_type}
                                        onChange={(e) => {
                                            updateQuestion(qIndex, 'question_type', e.target.value);
                                            if (e.target.value !== 'radio' && e.target.value !== 'check') {
                                                updateQuestion(qIndex, 'choices', []);
                                            }
                                        }}
                                        className="w-full px-4 py-[0.6rem] border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        {questionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <textarea
                                value={q.description}
                                onChange={(e) => updateQuestion(qIndex, 'description', e.target.value)}
                                rows="2"
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                placeholder="Additional details or formatting requirements..."
                            />

                            {(q.question_type === 'radio' || q.question_type === 'check') && (
                                <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium text-primary">Choices Options</p>
                                        <Button size="sm" variant="ghost" className="text-primary-600 border border-primary-600" onClick={() => addChoice(qIndex)}>
                                            <Plus className="w-3 h-3 mr-1" /> Add Choice
                                        </Button>
                                    </div>
                                    {q.choices?.map((c, cIndex) => (
                                        <div key={cIndex} className="flex items-center gap-2">
                                            <input
                                                type={q.question_type === 'radio' ? 'radio' : 'checkbox'}
                                                disabled
                                                className="w-4 h-4"
                                            />
                                            <input
                                                type="text"
                                                value={c.content}
                                                onChange={(e) => updateChoice(qIndex, cIndex, 'content', e.target.value)}
                                                className="flex-1 px-3 py-1 text-sm border border-theme bg-elevated text-primary rounded outline-none"
                                                placeholder={`Choice ${cIndex + 1}`}
                                            />
                                            <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={c.is_correct}
                                                    onChange={(e) => updateChoice(qIndex, cIndex, 'is_correct', e.target.checked)}
                                                /> Correct
                                            </label>
                                            <button onClick={() => removeChoice(qIndex, cIndex)} className="text-tertiary hover:text-red-500 p-1">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!q.choices || q.choices.length === 0) && (
                                        <p className="text-xs text-tertiary">No choices added yet.</p>
                                    )}
                                </div>
                            )}
                            {q.question_type === 'file' && (
                                <div className="bg-secondary/30 p-3 rounded-lg border border-dashed border-theme text-center text-sm text-secondary">
                                    User will see a file upload zone.
                                </div>
                            )}
                            {q.question_type === 'text' && (
                                <div className="bg-secondary/30 p-3 rounded-lg border border-theme text-sm text-secondary">
                                    User will see a multi-line text area.
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}

                {task.questions.length === 0 && (
                    <div className="text-center py-10 bg-elevated border border-dashed border-theme rounded-xl">
                        <p className="text-secondary mb-3">No questions added to this task.</p>
                        <Button variant="outline" onClick={addQuestion}>Create First Question</Button>
                    </div>
                )}
            </div>

            <div className="flex gap-4 justify-end pt-6 sticky bottom-4 bg-background/80 backdrop-blur pb-4">
                <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={loading}
                    className="flex items-center gap-2 min-w-[120px] justify-center"
                >
                    <Save className="w-4 h-4" /> Save as Draft
                </Button>
                <Button
                    variant="primary"
                    onClick={() => handleSave('pending')}
                    disabled={loading}
                    className="flex items-center gap-2 min-w-[140px] justify-center"
                >
                    <Send className="w-4 h-4" /> Publish Task
                </Button>
            </div>
        </div>
    );
};

export default TaskCreation;
