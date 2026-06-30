import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, RefreshCcw, Plus, CheckCircle, Clock, BookMarked } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../services/api';
import { formatMoneySimple } from '../../../utils/moneyUtils.jsx';

const CoursesTab = ({ provider, onRefresh }) => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => { loadData(); }, [provider?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/v1/specializations/enrollments/');
            setEnrollments(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) { console.error('Failed to load course data:', err); }
        finally { setLoading(false); }
    };

    const totalEnrollments = enrollments.length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;
    const activeCount = enrollments.filter(e => e.status === 'active').length;
    const totalRevenue = enrollments.filter(e => e.status === 'completed' && e.amount_paid).reduce((s, e) => s + (parseFloat(e.amount_paid) || 0), 0);

    const filtered = enrollments.filter(e => {
        const ms = !search || e.specialization_name?.toLowerCase().includes(search.toLowerCase()) || e.course_name?.toLowerCase().includes(search.toLowerCase()) || e.user_name?.toLowerCase().includes(search.toLowerCase());
        const mst = !filterStatus || e.status === filterStatus;
        return ms && mst;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <BookOpen size={20} className="text-sky-500" /> My Courses
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">Enrollment analytics and course management</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RefreshCcw size={14} className="mr-1.5" /> Refresh
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/specializations/create')}>
                        <Plus size={14} className="mr-1.5" /> Create Course
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Total Enrollments</p>
                    <p className="text-xl font-bold text-sky-600">{totalEnrollments}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Active</p>
                    <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Completed</p>
                    <p className="text-xl font-bold text-blue-600">{completedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-200">
                    <p className="text-xs text-secondary uppercase tracking-wider mb-0.5">Revenue</p>
                    <p className="text-xl font-bold text-primary">{formatMoneySimple(totalRevenue)}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input type="text" placeholder="Search enrollments..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-theme bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="dropped">Dropped</option>
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-3 border-secondary/20 border-t-primary-600 animate-spin" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-12 bg-elevated rounded-2xl border border-theme">
                    <BookMarked size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Enrollments Yet</h4>
                    <p className="text-sm text-secondary mb-6">Create courses from the Specializations page to start attracting learners.</p>
                    <Button variant="primary" size="sm" onClick={() => navigate('/specializations/create')}>
                        <Plus size={14} className="mr-1.5" /> Create Your First Course
                    </Button>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-2">
                    {filtered.slice(0, 20).map(enrollment => (
                        <Card key={enrollment.id} className="border-theme">
                            <CardBody className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${enrollment.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : enrollment.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {enrollment.status === 'completed' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{enrollment.specialization_name || enrollment.course_name || `Enrollment #${enrollment.id?.substring(0, 8)}`}</p>
                                        <p className="text-xs text-secondary">{enrollment.user_name || 'Learner'} • {enrollment.status}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {enrollment.amount_paid > 0 && <p className="font-bold text-primary text-sm">{formatMoneySimple(enrollment.amount_paid)}</p>}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enrollment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : enrollment.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                                        {enrollment.status}
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoursesTab;
