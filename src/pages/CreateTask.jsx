import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check, Calendar, Users, FileText, Save, Send, Megaphone, X, Plus,
    ArrowLeft, Clock, AlertCircle, ChevronRight, ChevronLeft, CheckCircle, Flag
} from 'lucide-react';
import api from '../services/api';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Task Details' },
    { number: 2, title: 'Schedule' },
    { number: 3, title: 'Subtasks' },
    { number: 4, title: 'Review' }
];

const CreateTask = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');

    const [formData, setFormData] = useState({
        heading: '',
        description: '',
        priority: 'medium',
        due_date: '',
        due_time: '',
        visibility: 'public',
        assigned_to: '',
    });

    const nextStep = () => {
        setError(null);
        if (currentStep === 1) {
            if (!formData.heading.trim()) {
                setError("Task Title is required");
                return;
            }
        }
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const addSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, { text: newSubtask, completed: false }]);
            setNewSubtask('');
        }
    };

    const removeSubtask = (idx) => {
        setSubtasks(subtasks.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (action) => {
        setLoading(true);
        setError(null);

        try {
            const submitData = {
                ...formData,
                status: action === 'draft' ? 'draft' : 'pending',
                subtasks: subtasks.map(s => s.text),
            };

            const response = await api.post('/api/tasks/tasks/', submitData);

            if (action === 'announcement') {
                await api.post('/api/announcements/requests/', {
                    content_type: 'task',
                    content_id: response.data.id,
                    heading: `📋 Task: ${formData.heading}`,
                    content: formData.description?.substring(0, 500),
                    request_type: 'task_notification'
                });
                alert('Task created and announcement requested!');
            } else if (action === 'draft') {
                alert('Task saved as draft!');
            } else {
                alert('Task published successfully!');
            }

            navigate('/tasks');
        } catch (error) {
            console.error('Failed to create task:', error);
            setError(error.response?.data?.detail || 'Failed to create task');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/tasks')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Back to Tasks
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <CheckCircle className="text-green-600" />
                        Create Task
                    </h1>
                    <p className="text-secondary mt-2">Assign, track, and manage your work efficiently.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-green-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            ></div>

                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center relative z-10 px-2 group cursor-pointer"
                                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-elevated text-secondary border-theme group-hover:border-green-300'
                                        }`}>
                                        {currentStep > step.number ? <Check size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-green-600' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[300px]">
                            {/* STEP 1: Task Details */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Task Title *</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="text"
                                                value={formData.heading}
                                                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                placeholder="Enter task title"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y text-primary"
                                            placeholder="Describe the task..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Priority</label>
                                        <div className="flex gap-4">
                                            {['low', 'medium', 'high', 'urgent'].map(priority => (
                                                <button
                                                    key={priority}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, priority })}
                                                    className={`flex-1 py-2 px-4 rounded-lg border capitalize transition-all ${formData.priority === priority
                                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                                        : 'border-theme hover:border-primary/50 text-secondary'
                                                        }`}
                                                >
                                                    {priority}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Schedule */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Due Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="date"
                                                    value={formData.due_date}
                                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">Due Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                                <input
                                                    type="time"
                                                    value={formData.due_time}
                                                    onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Visibility</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <select
                                                value={formData.visibility}
                                                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            >
                                                <option value="public">Public</option>
                                                <option value="private">Private</option>
                                                <option value="institutional">Institution Only</option>
                                                <option value="organisational">Organization Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Subtasks */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-primary mb-4">Break it down</h3>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                            className="flex-1 px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="Add a subtask..."
                                            autoFocus
                                        />
                                        <button
                                            onClick={addSubtask}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <div className="bg-secondary/5 rounded-xl p-4 min-h-[200px] border border-theme">
                                        {subtasks.length === 0 ? (
                                            <div className="text-center text-secondary py-8">
                                                <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                                                <p>No subtasks yet. Add one above!</p>
                                            </div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {subtasks.map((subtask, idx) => (
                                                    <li key={idx} className="flex items-center gap-3 p-3 bg-elevated rounded-lg border border-theme shadow-sm group">
                                                        <div className="w-5 h-5 rounded-full border-2 border-theme"></div>
                                                        <span className="flex-1 text-primary">{subtask.text}</span>
                                                        <button
                                                            onClick={() => removeSubtask(idx)}
                                                            className="text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Post</h3>

                                    <div className="bg-secondary/5 border border-theme rounded-xl p-6 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-primary">{formData.heading}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase
                                                ${formData.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                    formData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        formData.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {formData.priority}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-secondary mb-6 pb-4 border-b border-theme">
                                            {formData.due_date && (
                                                <span className="flex items-center gap-1 text-orange-600">
                                                    <Calendar size={14} /> Due: {new Date(formData.due_date).toLocaleDateString()} {formData.due_time}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Users size={14} /> {formData.visibility}
                                            </span>
                                        </div>

                                        <p className="text-primary whitespace-pre-wrap mb-6">
                                            {formData.description || <span className="text-secondary italic">No description provided.</span>}
                                        </p>

                                        {subtasks.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-secondary" /> Subtasks ({subtasks.length})
                                                </h4>
                                                <ul className="space-y-2">
                                                    {subtasks.map((subtask, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-sm text-secondary">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                                            {subtask.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                            <Button
                                variant="secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Previous'}
                            </Button>

                            <div className="ml-auto flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <Button variant="primary" onClick={nextStep}>
                                        Next <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading} className="border-theme text-secondary">
                                            <Save size={18} className="mr-2" /> Draft
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleSubmit('announcement')} disabled={loading}>
                                            <Megaphone size={18} className="mr-2" /> Announce
                                        </Button>
                                        <Button variant="primary" onClick={() => handleSubmit('publish')} disabled={loading}>
                                            <Send size={18} className="mr-2" /> Create Task
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateTask;
