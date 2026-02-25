import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Plus, X, Calendar, FileText, Edit, Trash2, Search } from 'lucide-react';
import tasksService from '../services/tasks.service';
import { formatDate } from '../utils/dateFormatter';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('assigned'); // assigned or created
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTask, setNewTask] = useState({
        heading: '',
        description: '',
        due_date: '',
        visibility: 'private',
    });

    // All authenticated users can create tasks
    const canCreateTasks = true;

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const [allTasks, userTasks] = await Promise.all([
                tasksService.getAll().catch(() => []),
                tasksService.getMyTasks().catch(() => []),
            ]);
            setTasks(Array.isArray(allTasks) ? allTasks : []);
            setMyTasks(Array.isArray(userTasks) ? userTasks : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
            setMyTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await tasksService.create(newTask);
            setShowCreateModal(false);
            setNewTask({ heading: '', description: '', due_date: '', visibility: 'private' });
            // Show success message and switch to All Tasks tab
            alert('✓ Task created successfully!');
            setActiveTab('all');
            loadTasks();
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await tasksService.delete(taskId);
            loadTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Failed to delete task');
        }
    };

    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const getCurrentTasks = () => {
        const taskList = activeTab === 'assigned' ? myTasks : tasks;

        // First apply search
        let processedTasks = taskList.filter(task => {
            const query = searchQuery.toLowerCase();
            return task.heading?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query);
        });

        // Then apply status filter
        if (filter !== 'all') {
            processedTasks = processedTasks.filter(task => {
                const state = task.state || 'active';
                const status = task.status || 'pending';
                const dueDate = new Date(task.due_date);
                const now = new Date();
                const isOverdue = dueDate < now && status !== 'completed';

                switch (filter) {
                    case 'active':
                        return state === 'active' && !isOverdue;
                    case 'expired':
                        return state === 'expired' || isOverdue;
                    case 'pending':
                        return status === 'pending';
                    case 'completed':
                        return status === 'completed' || state === 'completed';
                    default:
                        return true;
                }
            });
        }

        // Sort newest first (by due date descending)
        return processedTasks.sort((a, b) => {
            return new Date(b.time_stamp || b.due_date) - new Date(a.time_stamp || a.due_date);
        });
    };

    const filteredTasks = getCurrentTasks();

    const getStatusIcon = (task) => {
        const status = task.status || task.state || 'pending';
        const dueDate = new Date(task.due_date);
        const isOverdue = dueDate < new Date() && status !== 'completed';

        if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (isOverdue) return <AlertCircle className="w-5 h-5 text-red-600" />;
        return <Clock className="w-5 h-5 text-orange-600" />;
    };

    const FILTERS = ['all', 'active', 'expired', 'pending', 'completed'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Tasks</h1>
                    <p className="text-secondary mt-1">Manage your assignments and submissions</p>
                </div>
                {canCreateTasks && (
                    <Button variant="primary" onClick={() => navigate('/tasks/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-theme">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'assigned'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        My Tasks
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'assigned'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary'
                            }`}>
                            {myTasks.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'all'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        All Tasks
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'all'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary'
                            }`}>
                            {tasks.length}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search tasks by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-elevated border border-theme text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>

            {/* Filters — Resource-style pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                            ? 'bg-primary-600 text-white'
                            : 'bg-elevated text-secondary border border-theme hover:bg-secondary'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <ClipboardList className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary mb-4">
                            {filter !== 'all'
                                ? `No ${filter} tasks found.`
                                : activeTab === 'assigned'
                                    ? "No tasks assigned to you yet."
                                    : "No tasks available."}
                        </p>
                        {canCreateTasks && (
                            <Button variant="outline" onClick={() => navigate('/tasks/create')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create a Task
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            statusIcon={getStatusIcon(task)}
                            onViewDetails={() => handleViewDetails(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            canDelete={canCreateTasks && task.user?.id === user?.id}
                        />
                    ))}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">Create New Task</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-primary">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <Input
                                    label="Task Title"
                                    value={newTask.heading}
                                    onChange={(e) => setNewTask({ ...newTask, heading: e.target.value })}
                                    required
                                    placeholder="Enter task title"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Describe the task..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            value={newTask.due_date}
                                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                        <select
                                            value={newTask.visibility}
                                            onChange={(e) => setNewTask({ ...newTask, visibility: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="private">Private</option>
                                            <option value="public">Public</option>
                                            <option value="institution">Institution</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Task
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <CardBody>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-primary">{selectedTask.heading}</h2>
                                    <p className="text-sm text-secondary mt-1">Due: {formatDate(selectedTask.due_date)}</p>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} className="text-secondary hover:text-primary">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-secondary mb-2">Description</h3>
                                    <div className="bg-secondary rounded-lg p-4 text-secondary">
                                        {selectedTask.description || 'No description provided.'}
                                    </div>
                                </div>

                                {selectedTask.questions && selectedTask.questions.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-secondary mb-2">
                                            Questions ({selectedTask.question_count || selectedTask.questions.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedTask.questions.map((question, index) => (
                                                <div key={question.id} className="bg-secondary rounded-lg p-4">
                                                    <p className="font-medium text-primary">
                                                        {index + 1}. {question.heading}
                                                    </p>
                                                    {question.description && (
                                                        <p className="text-sm text-secondary mt-1">{question.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                                        Close
                                    </Button>
                                    {(selectedTask.status !== 'completed' && selectedTask.state !== 'completed') && (
                                        <Button variant="primary" className="flex-1">
                                            Submit Response
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const TaskCard = ({ task, statusIcon, onViewDetails, onDelete, canDelete }) => {
    const status = task.status || task.state || 'pending';
    const dueDate = new Date(task.due_date);
    const isOverdue = dueDate < new Date() && status !== 'completed';

    const getStatusStyle = () => {
        if (status === 'completed') return 'bg-green-500/10 text-green-600';
        if (isOverdue) return 'bg-red-500/10 text-red-600';
        return 'bg-orange-500/10 text-orange-600';
    };

    const getStatusText = () => {
        if (status === 'completed') return 'Completed';
        if (isOverdue) return 'Overdue';
        return 'Pending';
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody>
                <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            {statusIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-primary truncate">{task.heading}</h3>
                            <p className="text-sm text-secondary mt-1 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Due: {formatDate(task.due_date)}
                            </p>
                            {task.description && (
                                <p className="mt-2 text-sm text-secondary line-clamp-2">{task.description}</p>
                            )}
                            {task.question_count > 0 && (
                                <p className="text-sm text-tertiary mt-2">
                                    {task.question_count} question{task.question_count > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-2 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}>
                            {getStatusText()}
                        </span>
                        {canDelete && (
                            <button
                                onClick={onDelete}
                                className="p-1 text-tertiary hover:text-red-600 transition-colors"
                                title="Delete task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={onViewDetails}>View Details</Button>
                    {status !== 'completed' && (
                        <Button variant="primary">Submit Work</Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default Tasks;
