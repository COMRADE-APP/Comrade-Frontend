import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, MapPin, DollarSign, Clock, Calendar,
    ChevronLeft, Share2, User, Check
} from 'lucide-react';
import { gigsService } from '../../services/careers.service';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

const GigDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchGig();
    }, [id]);

    const fetchGig = async () => {
        try {
            setLoading(true);
            const response = await gigsService.getById(id);
            setGig(response.data);

            // Increment view count
            gigsService.incrementView(id);
        } catch (err) {
            setError('Failed to load gig details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            gigsService.incrementShare(id);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const getPayTimingLabel = (timing) => {
        const labels = {
            before: 'Payment Upfront',
            after: 'Payment on Completion',
            milestone: 'Milestone-based',
            negotiable: 'Negotiable'
        };
        return labels[timing] || timing;
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !gig) return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Gig Not Found</h2>
            <p className="text-secondary mb-6">{error || "The gig you're looking for doesn't exist or has been removed."}</p>
            <Button variant="outline" onClick={() => navigate('/gigs')}>
                Back to Gigs
            </Button>
        </div>
    );

    const isOwner = user?.id === gig.creator;
    const isOpen = gig.status === 'open';

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent text-secondary hover:text-primary"
                    onClick={() => navigate('/gigs')}
                >
                    <ChevronLeft size={20} className="mr-1" /> Back to Gigs
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardBody className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Briefcase size={32} />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-primary mb-2">{gig.title}</h1>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${gig.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-secondary/10 text-secondary'
                                                    }`}>
                                                    {gig.status}
                                                </span>
                                                <span className="text-tertiary">•</span>
                                                <span className="text-secondary text-sm capitalize">{gig.industry}</span>
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
                                        {gig.is_remote ? 'Remote' : gig.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={18} className="text-tertiary" />
                                        ${parseFloat(gig.pay_amount).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-tertiary" />
                                        {getPayTimingLabel(gig.pay_timing)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-tertiary" />
                                        Due {gig.deadline ? new Date(gig.deadline).toLocaleDateString() : 'ASAP'}
                                    </div>
                                </div>

                                <div className="prose max-w-none">
                                    <h3 className="text-lg font-semibold text-primary mb-3">Gig Description</h3>
                                    <p className="text-secondary whitespace-pre-wrap mb-6">{gig.description}</p>

                                    <h3 className="text-lg font-semibold text-primary mb-3">Requirements</h3>
                                    <p className="text-secondary whitespace-pre-wrap mb-6">{gig.requirements}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardBody className="p-6">
                                <h3 className="font-semibold text-primary mb-4">Action</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="p-4 bg-background border border-theme rounded-lg">
                                        <span className="block text-xs text-tertiary uppercase tracking-wider mb-1">Budget</span>
                                        <span className="text-xl font-bold text-primary">${parseFloat(gig.pay_amount).toLocaleString()}</span>
                                    </div>
                                </div>

                                {isOwner ? (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                                        <p className="text-sm text-blue-800 font-medium mb-2">This is your gig</p>
                                        <div className="space-y-1 text-xs text-blue-600">
                                            <div className="flex justify-between">
                                                <span>Views</span>
                                                <span className="font-bold">{gig.views_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Applications</span>
                                                <span className="font-bold">{gig.applications_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        disabled={!isOpen}
                                        onClick={() => navigate(`/gigs/${id}/apply`)}
                                    >
                                        {isOpen ? 'Apply Now' : 'Applications Closed'}
                                    </Button>
                                )}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="p-6">
                                <h3 className="font-semibold text-primary mb-4">Posted By</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-primary">{gig.creator_name}</p>
                                        <p className="text-xs text-secondary">Joined {new Date(gig.created_at).getFullYear()}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GigDetail;
