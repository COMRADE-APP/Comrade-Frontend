import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Calendar, Users, FileText, Save, Send, Megaphone, X, Plus } from 'lucide-react';
import api from '../services/api';

const CreateTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
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
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            const submitData = {
                ...formData,
                status: confirmAction === 'draft' ? 'draft' : 'pending',
                subtasks: subtasks.map(s => s.text),
            };

            const response = await api.post('/api/announcements/tasks/', submitData);

            if (confirmAction === 'announcement') {
                await api.post('/api/announcements/requests/', {
                    content_type: 'task',
                    content_id: response.data.id,
                    heading: `📋 Task: ${formData.heading}`,
                    content: formData.description?.substring(0, 500),
                    request_type: 'task_notification'
                });
                alert('Task created and announcement requested!');
            } else if (confirmAction === 'draft') {
                alert('Task saved as draft!');
            } else {
                alert('Task published successfully!');
            }

            navigate('/tasks');
        } catch (error) {
            console.error('Failed to create task:', error);
            alert(error.response?.data?.detail || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/tasks')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                        <input
                            type="text"
                            value={formData.heading}
                            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter task title"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Describe the task..."
                        />
                    </div>

                    {/* Priority & Due Date */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                            <input type="time" value={formData.due_time} onChange={(e) => setFormData({ ...formData, due_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>

                    {/* Subtasks */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="Add a subtask..."
                            />
                            <button onClick={addSubtask} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                <Plus size={18} />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {subtasks.map((subtask, idx) => (
                                <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <Check size={16} className="text-gray-400" />
                                    <span className="flex-1">{subtask.text}</span>
                                    <button onClick={() => removeSubtask(idx)} className="text-red-500 hover:text-red-700">
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/tasks')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('announcement')} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                            <Megaphone size={18} /> Request Announcement
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.heading} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                            <Send size={18} /> Publish
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {confirmAction === 'draft' && '💾 Save as Draft?'}
                            {confirmAction === 'publish' && '✅ Create Task?'}
                            {confirmAction === 'announcement' && '📢 Request Announcement?'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {confirmAction === 'draft' && 'Your task will be saved as a draft.'}
                            {confirmAction === 'publish' && 'Your task will be created and assigned.'}
                            {confirmAction === 'announcement' && 'Your task will be created and an announcement request sent for approval.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                            <button onClick={confirmSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTask;
