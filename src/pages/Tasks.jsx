import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import tasksService from '../services/tasks.service';
import { formatDate } from '../utils/dateFormatter';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await tasksService.getAll();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-orange-600" />;
            case 'overdue':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <ClipboardList className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-50 text-green-700';
            case 'pending':
                return 'bg-orange-50 text-orange-700';
            case 'overdue':
                return 'bg-red-50 text-red-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-600 mt-1">Manage your assignments and submissions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'completed', 'overdue'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${filter === f
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
            ) : tasks.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks found. You're all caught up!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
};

const TaskCard = ({ task }) => {
    const status = task.status || 'pending';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody>
                <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{task.heading}</h3>
                            <p className="text-sm text-gray-500 mt-1">Due: {formatDate(task.due_date)}</p>
                            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                                {task.description}
                            </div>
                        </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'pending' ? 'bg-orange-50 text-orange-700' :
                            status === 'completed' ? 'bg-green-50 text-green-700' :
                                'bg-red-50 text-red-700'
                        }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${status === 'pending' ? 'text-orange-600' :
                                status === 'completed' ? 'text-green-600' :
                                    'text-red-600'
                            }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline">View Details</Button>
                        {status !== 'completed' && (
                            <Button variant="primary">Submit Work</Button>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default Tasks;
