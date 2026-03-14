import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Plus, X, Calendar, FileText, Edit, Trash2, Search, Heart, Flag, ShieldAlert, Activity, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import tasksService from '../services/tasks.service';
import { formatDate } from '../utils/dateFormatter';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [createdResponses, setCreatedResponses] = useState([]); // Added state for created responses
    const [expandedResponsesTask, setExpandedResponsesTask] = useState(null);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('assigned'); // assigned or created
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        heading: '',
        description: '',
        due_date: '',
        visibility: 'private',
    });

    // All authenticated users can create tasks
    const canCreateTasks = true;

    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('all_tasks')) setActiveTab('all');
        else if (path.includes('submissions')) setActiveTab('submissions');
        else if (path.includes('responses')) setActiveTab('responses'); // Added for responses tab
        else setActiveTab('assigned');
    }, [location.pathname]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const [allTasks, userTasks, myCreatedRespData, compTasks] = await Promise.all([
                tasksService.getAll().catch(() => []),
                tasksService.getMyTasks().catch(() => []),
                tasksService.getMyCreatedSubmissions().catch(() => []),
                tasksService.getCompletedTasks().catch(() => []),
            ]);
            setTasks(Array.isArray(allTasks) ? allTasks : []);
            setMyTasks(Array.isArray(userTasks) ? userTasks : []);
            setSubmissions(Array.isArray(myCreatedRespData) ? myCreatedRespData : []);
            setCreatedResponses(Array.isArray(myCreatedRespData) ? myCreatedRespData : []);
            setCompletedTasks(Array.isArray(compTasks) ? compTasks : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
            setMyTasks([]);
            setSubmissions([]);
            setCreatedResponses([]);
            setCompletedTasks([]);
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
            toast.success('Task created successfully!');
            setActiveTab('all');
            loadTasks();
        } catch (error) {
            console.error('Failed to create task:', error);
            toast.error('Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await tasksService.delete(taskId);
            toast.success('Task deleted');
            loadTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        }
    };

    const handleViewDetails = (task, isSubmission) => {
        if (isSubmission) {
            navigate(`/tasks/${task.id}?view=submission`);
        } else {
            navigate(`/tasks/${task.id}`);
        }
    };

    const getCurrentTasks = () => {
        const taskList = activeTab === 'assigned' ? myTasks :
            activeTab === 'submissions' ? submissions :
                activeTab === 'responses' ? createdResponses : tasks; // Use createdResponses for 'responses' tab

        // First apply search
        let processedTasks = taskList.filter(item => {
            const isSubOrResp = activeTab === 'submissions' || activeTab === 'responses';
            const taskObj = isSubOrResp ? item.task : item;
            const query = searchQuery.toLowerCase();
            return taskObj && (taskObj.heading?.toLowerCase().includes(query) ||
                taskObj.description?.toLowerCase().includes(query));
        });

        // Then apply status filter
        if (filter !== 'all') {
            processedTasks = processedTasks.filter(item => {
                const isSubView = activeTab === 'submissions';
                const isRespView = activeTab === 'responses';
                const taskObj = (isSubView || isRespView) ? item.task : item;
                if (!taskObj) return false;

                const isCompletedByUser = !isSubView && !isRespView && completedTasks.some(ct => ct.task?.id === taskObj.id);
                const state = taskObj.state || 'active';
                const status = (isSubView || isRespView) ? item.status : (isCompletedByUser ? 'completed' : (item.status || 'pending'));
                const dueDate = new Date(taskObj.due_date);
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
                    case 'activities':
                        return taskObj.is_activity === true;
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

    const getStatusIcon = (statusOrTask) => {
        // Handle if full task object is passed or just a string status
        const isStr = typeof statusOrTask === 'string';
        const status = isStr ? statusOrTask : (statusOrTask.status || statusOrTask.state || 'pending');
        const dueDate = isStr ? null : (statusOrTask.due_date ? new Date(statusOrTask.due_date) : null);
        const isOverdue = dueDate && dueDate < new Date() && status !== 'completed';

        if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (isOverdue) return <AlertCircle className="w-5 h-5 text-red-600" />;
        return <Clock className="w-5 h-5 text-orange-600" />;
    };

    const FILTERS = ['all', 'active', 'expired', 'pending', 'completed', 'activities'];

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
                        onClick={() => { setActiveTab('assigned'); navigate('/tasks/my_tasks'); }}
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
                        onClick={() => { setActiveTab('all'); navigate('/tasks/all_tasks'); }}
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
                    <button
                        onClick={() => { setActiveTab('submissions'); navigate('/tasks/submissions'); }}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'submissions'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        My Submissions
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'submissions'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary'
                            }`}>
                            {submissions.length}
                        </span>
                    </button>
                    {canCreateTasks && (
                        <button
                            onClick={() => { setActiveTab('responses'); navigate('/tasks/responses'); }}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'responses'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Responses
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'responses'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-secondary'
                                }`}>
                                {createdResponses.length}
                            </span>
                        </button>
                    )}
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
            ) : activeTab === 'responses' ? (
                /* ── Responses Tab: Group submissions by task ── */
                (() => {
                    // Group createdResponses by task ID
                    const grouped = {};
                    createdResponses.forEach(resp => {
                        const taskId = resp.task?.id;
                        if (!taskId) return;
                        if (!grouped[taskId]) {
                            grouped[taskId] = { task: resp.task, responses: [] };
                        }
                        grouped[taskId].responses.push(resp);
                    });

                    // Apply search filter
                    let groupedEntries = Object.values(grouped).filter(g => {
                        const query = searchQuery.toLowerCase();
                        return g.task.heading?.toLowerCase().includes(query) ||
                            g.task.description?.toLowerCase().includes(query);
                    });

                    // Sort newest first
                    groupedEntries.sort((a, b) => new Date(b.task.due_date || 0) - new Date(a.task.due_date || 0));

                    if (groupedEntries.length === 0) {
                        return (
                            <Card>
                                <CardBody className="text-center py-12">
                                    <Users className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                    <p className="text-secondary mb-2">No responses to review yet.</p>
                                    <p className="text-sm text-tertiary">Responses will appear here when users submit answers to your tasks.</p>
                                </CardBody>
                            </Card>
                        );
                    }

                    return (
                        <div className="space-y-4">
                            {groupedEntries.map(({ task: taskObj, responses: respList }) => {
                                const dueDate = taskObj.due_date ? new Date(taskObj.due_date) : null;
                                const isOverdue = dueDate && dueDate < new Date();
                                const gradedCount = respList.filter(r => r.status === 'graded').length;
                                const pendingCount = respList.length - gradedCount;

                                return (
                                    <Card key={`resp-task-${taskObj.id}`} className="hover:shadow-md transition-shadow">
                                        <CardBody>
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center shrink-0">
                                                        <ClipboardList className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            {taskObj.category && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary-700 capitalize">
                                                                    {taskObj.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-primary truncate">
                                                            {taskObj.heading}
                                                        </h3>
                                                        <p className="text-sm text-secondary mt-1 flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            Due: {formatDate(taskObj.due_date)}
                                                        </p>
                                                        {taskObj.description && (
                                                            <p className="mt-2 text-sm text-secondary line-clamp-1">{taskObj.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Response count badge */}
                                                <div className="flex flex-col items-end gap-2 ml-4">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                                        <Users className="w-4 h-4" />
                                                        {respList.length} Response{respList.length !== 1 ? 's' : ''}
                                                    </div>
                                                    {isOverdue && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Grading progress bar */}
                                            <div className="mt-4 pt-4 border-t border-theme">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1.5 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            {gradedCount} Graded
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-orange-500">
                                                            <Clock className="w-4 h-4" />
                                                            {pendingCount} Pending
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => navigate(`/tasks/responses/${taskObj.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Responses
                                                    </Button>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="w-full bg-secondary rounded-full h-1.5">
                                                    <div
                                                        className="bg-green-500 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${respList.length > 0 ? (gradedCount / respList.length) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </CardBody>
                                        {/* Expandable Responses List */}
                                        {expandedResponsesTask === taskObj.id && (
                                            <div className="border-t border-theme/50 bg-secondary/5 rounded-b-xl divide-y divide-theme/30">
                                                {respList.map(resp => (
                                                    <div key={resp.id} className="px-6 py-4 hover:bg-secondary/10 transition-colors flex items-center justify-between cursor-pointer"
                                                         onClick={() => navigate(`/tasks/responses/${taskObj.id}?responseId=${resp.id}`)}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-primary text-sm">{resp.user_name || 'User'}</span>
                                                            <span className="text-xs text-secondary">{formatDate(resp.created_at || resp.time_stamp)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {resp.total_score != null && (
                                                                <span className="text-sm font-semibold text-primary hidden sm:inline-block">Score: {resp.total_score}</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                                ['complete', 'graded', 'confirmed'].includes(resp.review_status || resp.status) 
                                                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                            }`}>
                                                                {resp.review_status || resp.status || 'Received'}
                                                            </span>
                                                            <Eye className="w-4 h-4 text-tertiary" />
                                                        </div>
                                                    </div>
                                                ))}
                                                {respList.length === 0 && (
                                                    <div className="p-6 text-center text-secondary text-sm">
                                                        No responses yet
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    );
                })()
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
                    {filteredTasks.map((item) => {
                        const isSubmissionOrResponseView = activeTab === 'submissions';
                        const originalTaskObj = isSubmissionOrResponseView ? item.task : item;
                        if (!originalTaskObj) return null;

                        const isCompletedByUser = !isSubmissionOrResponseView && completedTasks.some(ct => ct.task?.id === originalTaskObj.id);
                        const taskObj = isCompletedByUser
                            ? { ...originalTaskObj, status: 'completed' }
                            : originalTaskObj;

                        return (
                                <TaskCard
                                key={isSubmissionOrResponseView ? `sub-${item.id}` : `task-${taskObj.id}`}
                                task={taskObj}
                                submission={isSubmissionOrResponseView ? item : null}
                                statusIcon={getStatusIcon(item)}
                                onViewDetails={() => handleViewDetails(taskObj, isSubmissionOrResponseView)}
                                onDelete={() => handleDeleteTask(taskObj.id)}
                                canDelete={!isSubmissionOrResponseView && canCreateTasks && taskObj.user?.id === user?.id}
                                isSubmissionView={isSubmissionOrResponseView}
                                onMarkCompleted={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await tasksService.markCompleted(taskObj.id);
                                        loadTasks();
                                        toast.success('Activity marked as completed!');
                                    } catch (error) {
                                        console.error('Error marking completed:', error);
                                        toast.error('Failed to mark as completed');
                                    }
                                }}
                            />
                        );
                    })}
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
        </div>
    );
};

const TaskCard = ({ task, submission, statusIcon, onViewDetails, onDelete, canDelete, isSubmissionView, onMarkCompleted }) => {
    const [liked, setLiked] = useState(false);
    const status = task.status || task.state || 'pending';
    const dueDate = new Date(task.due_date);
    const isOverdue = dueDate < new Date() && status !== 'completed';

    const getStatusStyle = () => {
        if (isSubmissionView) return submission?.is_late ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600';
        if (status === 'completed' || task.status === 'completed') return 'bg-green-500/10 text-green-600';
        if (status === 'draft') return 'bg-gray-500/10 text-gray-600';
        if (isOverdue) return 'bg-red-500/10 text-red-600';
        return status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-600';
    };

    const getStatusText = () => {
        if (isSubmissionView) return submission?.is_late ? 'Late Submission' : 'Submitted';
        if (status === 'completed' || task.status === 'completed') return 'Completed';
        if (status === 'draft') return 'Draft';
        if (isOverdue) return 'Overdue';
        return status === 'active' ? 'Active' : 'Pending';
    };

    const creatorName = task.organisation?.name || task.institution?.name || task.user?.first_name || 'Creator';
    const submitterName = submission?.user?.first_name || submission?.user?.username || 'User';
    const creatorInitial = creatorName.charAt(0).toUpperCase();

    const handleReaction = async (e) => {
        e.stopPropagation();
        try {
            await tasksService.addReaction(task.id, 'like');
            setLiked(!liked);
        } catch (error) {
            console.error('Failed to react:', error);
        }
    };

    const handleReport = async (e) => {
        e.stopPropagation();
        try {
            await tasksService.report(task.id);
            alert('Task reported successfully.');
        } catch (error) {
            console.error('Error reporting task:', error);
        }
    };

    const handleBlock = async (e) => {
        e.stopPropagation();
        if (window.confirm("Mark as Not Interested? You will see fewer tasks like this.")) {
            try {
                await tasksService.block(task.id);
                alert('Task preference recorded.');
            } catch (error) {
                console.error('Error blocking task:', error);
            }
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody>
                <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                        {task.image_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative border border-theme bg-secondary">
                                <img src={task.image_url} alt="Task Image" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                {/* Removed statusIcon prop, will render badges instead */}
                                {task.is_activity ? <Activity className="w-5 h-5 text-primary" /> : <ClipboardList className="w-5 h-5 text-primary" />}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {task.category && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary-700 capitalize">
                                        {task.category}
                                    </span>
                                )}
                                {task.is_activity && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-600 capitalize">
                                        Activity
                                    </span>
                                )}
                                {task.difficulty && task.difficulty !== 'none' && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                                        {task.difficulty}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-primary truncate hover:text-primary-600 cursor-pointer" onClick={onViewDetails}>
                                {task.heading}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary-600">
                                    {isSubmissionView ? submitterName.charAt(0).toUpperCase() : creatorInitial}
                                </div>
                                {isSubmissionView ? (
                                    <p className="text-xs font-medium text-primary-600">Submitted by {submitterName}</p>
                                ) : (
                                    <p className="text-xs font-medium text-primary-600">By {creatorName}</p>
                                )}
                            </div>
                            <p className="text-sm text-secondary mt-2 flex items-center gap-2">
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
                    <div className="flex items-start gap-2 ml-4 flex-col items-end">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}>
                            {getStatusText()}
                        </span>
                        {canDelete && (
                            <button
                                onClick={onDelete}
                                className="p-1 mt-2 text-tertiary hover:text-red-600 transition-colors"
                                title="Delete task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-theme pt-4">
                    <div className="flex gap-2">
                        <button onClick={handleReaction} className={`p-1.5 flex items-center gap-1 rounded hover:bg-secondary ${liked ? 'text-red-500' : 'text-tertiary hover:text-red-500'}`}>
                            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                            <span className="text-xs">Like</span>
                        </button>
                        <button onClick={handleReport} className="p-1.5 flex items-center gap-1 rounded hover:bg-secondary text-tertiary hover:text-orange-500">
                            <Flag className="w-4 h-4" />
                            <span className="text-xs">Report</span>
                        </button>
                        <button onClick={handleBlock} className="p-1.5 flex items-center gap-1 rounded hover:bg-secondary text-tertiary hover:text-primary-500">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-xs">Not Interested</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onViewDetails}>View Details</Button>
                        {isSubmissionView ? (
                            <Button variant="primary" onClick={onViewDetails}>Review Submission</Button>
                        ) : task.is_activity ? (
                            status !== 'completed' && (
                                <Button variant="primary" onClick={onMarkCompleted}>Mark as Done</Button>
                            )
                        ) : (
                            status !== 'completed' && status !== 'draft' && (
                                <Button variant="primary" onClick={onViewDetails}>Submit Work</Button>
                            )
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default Tasks;
