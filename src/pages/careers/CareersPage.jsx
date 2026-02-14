import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, DollarSign, MapPin, Filter, Plus,
    ChevronRight, Loader2, AlertCircle, Sparkles,
    Clock, Briefcase, GraduationCap, BarChart2, User
} from 'lucide-react';
import { careersService } from '../../services/careers.service';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

const CareersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [careers, setCareers] = useState([]);
    const [recommendedCareers, setRecommendedCareers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [filters, setFilters] = useState({
        industry: '',
        job_type: '',
        experience_level: '',
        is_remote: null
    });

    const industries = [
        { value: '', label: 'All Industries' },
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'writing', label: 'Writing & Content' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Finance & Accounting' },
        { value: 'education', label: 'Education' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'other', label: 'Other' },
    ];

    const jobTypes = [
        { value: '', label: 'All Types' },
        { value: 'full_time', label: 'Full-time' },
        { value: 'part_time', label: 'Part-time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' },
        { value: 'freelance', label: 'Freelance' },
    ];

    const experienceLevels = [
        { value: '', label: 'All Levels' },
        { value: 'entry', label: 'Entry Level' },
        { value: 'mid', label: 'Mid Level' },
        { value: 'senior', label: 'Senior Level' },
        { value: 'lead', label: 'Lead/Manager' },
        { value: 'executive', label: 'Executive' },
    ];

    useEffect(() => {
        fetchCareers();
        fetchRecommended();
    }, [filters]);

    const fetchCareers = async () => {
        try {
            setLoading(true);
            const params = { ...filters };
            Object.keys(params).forEach(key => {
                if (!params[key] || params[key] === null) delete params[key];
            });

            const response = await careersService.getAll(params);
            const data = response.data;
            setCareers(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError('Failed to load career opportunities');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommended = async () => {
        try {
            const response = await careersService.getRecommended();
            const data = response.data;
            setRecommendedCareers(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load recommendations:', err);
        }
    };

    const formatSalary = (career) => {
        if (career.salary_range) return career.salary_range;
        if (career.salary_min && career.salary_max) {
            return `${career.salary_currency || '$'}${career.salary_min.toLocaleString()} - ${career.salary_max.toLocaleString()}`;
        }
        return 'Salary negotiable';
    };

    const getJobTypeLabel = (type) => {
        const labels = {
            full_time: 'Full-time',
            part_time: 'Part-time',
            contract: 'Contract',
            internship: 'Internship',
            freelance: 'Freelance'
        };
        return labels[type] || type;
    };

    const getExperienceLabel = (level) => {
        const labels = {
            entry: 'Entry Level',
            mid: 'Mid Level',
            senior: 'Senior',
            lead: 'Lead/Manager',
            executive: 'Executive'
        };
        return labels[level] || level;
    };

    const CareerCard = ({ career, isRecommended = false }) => (
        <div
            className={`bg-elevated border border-theme rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer relative ${isRecommended ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => navigate(`/careers/${career.id}`)}
        >
            {(isRecommended || career.posted_by === user?.id) && (
                <div className="flex justify-end gap-2 mb-2">
                    {isRecommended && (
                        <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Sparkles size={14} />
                            <span>Recommended</span>
                        </div>
                    )}
                    {career.posted_by === user?.id && (
                        <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            <User size={12} />
                            <span>Created by You</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center text-primary">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-primary">{career.title}</h3>
                        <p className="text-sm text-secondary">{career.company_name}</p>
                    </div>
                </div>
                {!isRecommended && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                        {getJobTypeLabel(career.job_type)}
                    </span>
                )}
            </div>

            <p className="text-secondary text-sm mb-4 line-clamp-2">
                {career.description.substring(0, 120)}...
            </p>

            <div className="flex flex-wrap gap-4 mb-4 text-sm text-secondary">
                <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-tertiary" />
                    <span>{formatSalary(career)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-tertiary" />
                    <span>{career.is_remote ? 'Remote' : career.location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <GraduationCap size={16} className="text-tertiary" />
                    <span>{getExperienceLabel(career.experience_level)}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md">{career.industry}</span>
                {career.is_remote && <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-md">Remote</span>}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-theme">
                <span className="text-xs text-tertiary">
                    {career.applications_count || 0} applicants
                </span>
                <button
                    className="flex items-center gap-1 text-primary hover:text-primary-light font-medium text-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        careersService.incrementView(career.id);
                        navigate(`/careers/${career.id}`);
                    }}
                >
                    Apply Now <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary"><Building2 /> Career Opportunities</h1>
                    <p className="text-secondary mt-1">Find your next career move or recruit top talent</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/careers/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post a Job
                </Button>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => navigate('/careers/tracking')}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <BarChart2 size={16} />
                    Track your postings
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-theme mb-8 overflow-x-auto">
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'all' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Jobs
                </button>
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'recommended' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('recommended')}
                >
                    <Sparkles size={16} />
                    For You
                </button>
                <button
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'my-postings' ? 'text-primary border-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                    onClick={() => setActiveTab('my-postings')}
                >
                    My Postings
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-elevated p-4 rounded-xl border border-theme">
                <div className="flex items-center gap-2 bg-background border border-theme rounded-lg px-3 py-2 flex-grow md:flex-grow-0">
                    <Filter size={18} className="text-secondary" />
                    <select
                        value={filters.industry}
                        onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                        className="bg-transparent border-none outline-none text-primary text-sm min-w-[150px]"
                    >
                        {industries.map(ind => (
                            <option key={ind.value} value={ind.value}>{ind.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-background border border-theme rounded-lg px-3 py-2 flex-grow md:flex-grow-0">
                    <select
                        value={filters.job_type}
                        onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
                        className="bg-transparent border-none outline-none text-primary text-sm min-w-[120px]"
                    >
                        {jobTypes.map(jt => (
                            <option key={jt.value} value={jt.value}>{jt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-background border border-theme rounded-lg px-3 py-2 flex-grow md:flex-grow-0">
                    <select
                        value={filters.experience_level}
                        onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
                        className="bg-transparent border-none outline-none text-primary text-sm min-w-[120px]"
                    >
                        {experienceLevels.map(exp => (
                            <option key={exp.value} value={exp.value}>{exp.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.is_remote === true}
                            onChange={(e) => setFilters({ ...filters, is_remote: e.target.checked ? true : null })}
                            className="rounded border-theme text-primary focus:ring-primary"
                        />
                        Remote Only
                    </label>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {loading ? (
                    <div className="text-center py-20 text-secondary">
                        <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-primary" />
                        <p>Loading opportunities...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-100 p-8">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <p className="mb-4">{error}</p>
                        <button onClick={fetchCareers} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">Retry</button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'recommended' && recommendedCareers.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary"><Sparkles size={20} className="text-primary" /> Recommended for You</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendedCareers.map(career => (
                                        <CareerCard key={career.id} career={career} isRecommended />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(activeTab === 'all' ? careers : activeTab === 'recommended' ? recommendedCareers : careers)
                                .map(career => (
                                    <CareerCard key={career.id} career={career} />
                                ))
                            }
                        </div>

                        {careers.length === 0 && (
                            <div className="text-center py-20 flex flex-col items-center justify-center text-secondary">
                                <Building2 size={64} className="text-tertiary mb-4" />
                                <h3 className="text-lg font-medium text-primary mb-2">No opportunities found</h3>
                                <p>Try adjusting your filters or check back later</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CareersPage;
