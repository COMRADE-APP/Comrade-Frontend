import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, DollarSign, Clock, Briefcase,
    ChevronLeft, Share2, Globe, GraduationCap, Copy, Check
} from 'lucide-react';
import { careersService } from '../../services/careers.service';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';


const CareerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [career, setCareer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchCareer();
    }, [id]);

    const fetchCareer = async () => {
        try {
            setLoading(true);
            const response = await careersService.getById(id);
            setCareer(response.data);

            // Increment view count
            careersService.incrementView(id);
        } catch (err) {
            setError('Failed to load career details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            careersService.incrementShare(id);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const formatSalary = (c) => {
        if (c.salary_range) return c.salary_range;
        if (c.salary_min && c.salary_max) {
            return `${c.salary_currency || '$'} ${c.salary_min.toLocaleString()} - ${c.salary_max.toLocaleString()}`;
        }
        return 'Negotiable';
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

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !career) return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Job Not Found</h2>
            <p className="text-secondary mb-6">{error || "The job posting you're looking for doesn't exist or has been removed."}</p>
            <Button variant="outline" onClick={() => navigate('/careers')}>
                Back to Careers
            </Button>
        </div>
    );

    const isOwner = user?.id === career.posted_by;
    const isActive = career.is_active;

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent text-secondary hover:text-primary"
                    onClick={() => navigate('/careers')}
                >
                    <ChevronLeft size={20} className="mr-1" /> Back to Careers
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardBody className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Building2 size={32} />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-primary mb-1">{career.title}</h1>
                                            <div className="flex items-center text-secondary font-medium">
                                                {career.company_name}
                                                <span className="mx-2">•</span>
                                                <span className="text-sm bg-secondary/10 px-2 py-0.5 rounded">
                                                    {getJobTypeLabel(career.job_type)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleShare}
                                            className="p-2 text-secondary hover:text-primary hover:bg-secondary/10 rounded-lg transition-colors"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-y-2 gap-x-6 mb-8 text-sm text-secondary">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-tertiary" />
                                        {career.is_remote ? 'Remote' : career.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={18} className="text-tertiary" />
                                        {formatSalary(career)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={18} className="text-tertiary" />
                                        {career.experience_level?.replace('_', ' ')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-tertiary" />
                                        Posted {new Date(career.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="prose max-w-none">
                                    <h3 className="text-lg font-semibold text-primary mb-3">About the Role</h3>
                                    <p className="text-secondary whitespace-pre-wrap mb-6">{career.description}</p>

                                    <h3 className="text-lg font-semibold text-primary mb-3">Requirements</h3>
                                    <p className="text-secondary whitespace-pre-wrap mb-6">{career.requirements}</p>

                                    {career.responsibilities && (
                                        <>
                                            <h3 className="text-lg font-semibold text-primary mb-3">Responsibilities</h3>
                                            <p className="text-secondary whitespace-pre-wrap mb-6">{career.responsibilities}</p>
                                        </>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardBody className="p-6">
                                <h3 className="font-semibold text-primary mb-4">Job Overview</h3>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-xs font-semibold text-tertiary uppercase tracking-wider">Deadline</label>
                                        <p className="text-primary font-medium">
                                            {career.application_deadline ? new Date(career.application_deadline).toLocaleDateString() : 'Until Filled'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-tertiary uppercase tracking-wider">Industry</label>
                                        <p className="text-primary font-medium capitalize">{career.industry}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-tertiary uppercase tracking-wider">Job Type</label>
                                        <p className="text-primary font-medium">{getJobTypeLabel(career.job_type)}</p>
                                    </div>
                                </div>

                                {isOwner ? (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                                        <p className="text-sm text-blue-800 font-medium mb-2">This is your posting</p>
                                        <div className="space-y-1 text-xs text-blue-600">
                                            <div className="flex justify-between">
                                                <span>Views</span>
                                                <span className="font-bold">{career.views_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Applications</span>
                                                <span className="font-bold">{career.applications_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        disabled={!isActive}
                                        onClick={() => navigate(`/careers/${id}/apply`)}
                                    >
                                        {isActive ? 'Apply Now' : 'Applications Closed'}
                                    </Button>
                                )}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="p-6">
                                <h3 className="font-semibold text-primary mb-4">About the Company</h3>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                                        <Building2 size={20} />
                                    </div>
                                    <span className="font-medium text-primary">{career.company_name}</span>
                                </div>
                                {/* Placeholder for company description or link */}
                                <p className="text-sm text-secondary">
                                    {career.company_name} is hiring for this role.
                                </p>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerDetail;
