import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart2, Eye, Share2, MousePointer, Briefcase, Building2,
    Calendar, Clock, ArrowLeft, Loader2
} from 'lucide-react';
import { gigsService, careersService } from '../../services/careers.service';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import './Careers.css';

const TrackingPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('gigs');
    const [gigs, setGigs] = useState([]);
    const [careers, setCareers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gigsRes, careersRes] = await Promise.all([
                gigsService.getMyGigs(),
                careersService.getMyPostings()
            ]);
            setGigs(gigsRes.data);
            setCareers(careersRes.data);
        } catch (error) {
            console.error('Failed to load tracking data', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            open: 'bg-green-100 text-green-800',
            active: 'bg-green-100 text-green-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-gray-100 text-gray-800',
            closed: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-background p-4 rounded-xl border border-theme flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-secondary text-xs font-medium">{label}</p>
                <p className="text-xl font-bold text-primary">{value}</p>
            </div>
        </div>
    );

    const TrackingCard = ({ item, type }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-primary mb-1">{item.title}</h3>
                        <p className="text-sm text-secondary flex items-center gap-2">
                            <Calendar size={14} />
                            Posted on {new Date(item.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <StatusBadge status={item.status || (item.is_active ? 'active' : 'closed')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard
                        icon={Eye}
                        label="Views"
                        value={item.views_count || 0}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={Share2}
                        label="Shares"
                        value={item.shares_count || 0}
                        color="bg-purple-50 text-purple-600"
                    />
                    <StatCard
                        icon={MousePointer}
                        label="Clicks"
                        value={item.clicks_count || 0}
                        color="bg-orange-50 text-orange-600"
                    />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-theme">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                        <Clock size={16} />
                        <span>
                            {new Date(item.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                ? 'Posted today'
                                : `${Math.floor((new Date() - new Date(item.created_at)) / (1000 * 60 * 60 * 24))} days ago`}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/${type === 'gig' ? 'gigs' : 'careers'}/${item.id}`)}
                        className="text-primary hover:text-primary-dark font-medium text-sm"
                    >
                        View Details
                    </Button>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent text-secondary hover:text-primary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <BarChart2 /> Performance Tracking
                        </h1>
                        <p className="text-secondary">Monitor your posts and engagement</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-8 border-b border-theme">
                    <button
                        className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'gigs'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                        onClick={() => setActiveTab('gigs')}
                    >
                        My Gigs ({gigs.length})
                    </button>
                    <button
                        className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'careers'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                        onClick={() => setActiveTab('careers')}
                    >
                        My Job Postings ({careers.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === 'gigs' && (
                            gigs.length > 0 ? (
                                gigs.map(gig => <TrackingCard key={gig.id} item={gig} type="gig" />)
                            ) : (
                                <Card>
                                    <CardBody className="text-center py-12">
                                        <Briefcase className="mx-auto text-tertiary mb-4" size={48} />
                                        <h3 className="text-lg font-medium text-primary mb-2">No gigs posted yet</h3>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/gigs/create')}
                                            className="text-primary hover:underline"
                                        >
                                            Post your first gig
                                        </Button>
                                    </CardBody>
                                </Card>
                            )
                        )}

                        {activeTab === 'careers' && (
                            careers.length > 0 ? (
                                careers.map(career => <TrackingCard key={career.id} item={career} type="career" />)
                            ) : (
                                <Card>
                                    <CardBody className="text-center py-12">
                                        <Building2 className="mx-auto text-tertiary mb-4" size={48} />
                                        <h3 className="text-lg font-medium text-primary mb-2">No jobs posted yet</h3>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/careers/create')}
                                            className="text-primary hover:underline"
                                        >
                                            Post your first job opportunity
                                        </Button>
                                    </CardBody>
                                </Card>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingPage;
