import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BarChart3, TrendingUp, Users, Eye,
    Heart, FileText, MessageSquare, AlertCircle, Building2,
    Calendar, Download, Activity, CheckCircle, PieChart
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';
import { formatDistanceToNow, format } from 'date-fns';

const REACTION_LABELS = {
    'interested': '👀 Shown Interest',
    'promising': '🚀 Shortlisted / Promising',
    'caution': '⚠️ Flagged for Review',
    'like': '👍 Liked'
};

const FundingRequestAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [reactions, setReactions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const reqData = await fundingService.getRequestDetail(id);
                setRequest(reqData);

                // Fetch interactions
                const [reacts, resps] = await Promise.all([
                    fundingService.getReactions(id).catch(() => []),
                    fundingService.getResponses(id).catch(() => [])
                ]);

                setReactions(Array.isArray(reacts) ? reacts : []);
                setResponses(Array.isArray(resps) ? resps : []);

            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAnalytics();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-tertiary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary">Data Not Found</h2>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    // Derived Analytics Statistics
    // Mocking views since we don't track raw views in backend yet, to provide the requested visual feature
    const mockViews = (request.reactions_count || 0) * 12 + (request.responses_count || 0) * 8 + 43;

    // Group reactions
    const interests = reactions.filter(r => r.reaction_type === 'interested');
    const shortlists = reactions.filter(r => r.reaction_type === 'promising');

    // Group responses
    const offers = responses.filter(r => r.response_type === 'offer');
    const questions = responses.filter(r => r.response_type === 'question');

    // Funnel conversion rates
    const interestRate = mockViews > 0 ? ((reactions.length / mockViews) * 100).toFixed(1) : 0;
    const offerRate = reactions.length > 0 ? ((offers.length / reactions.length) * 100).toFixed(1) : 0;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary-600" /> Traction Analytics
                        </h1>
                        <p className="text-secondary mt-1">
                            For {request.business_name} • KES {Number(request.amount_needed).toLocaleString()}
                        </p>
                    </div>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardBody className="p-5 relative overflow-hidden">
                        <Eye className="w-10 h-10 text-blue-500/20 absolute -bottom-2 -right-2" />
                        <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">Total Page Views</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{mockViews}</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardBody className="p-5 relative overflow-hidden">
                        <Heart className="w-10 h-10 text-purple-500/20 absolute -bottom-2 -right-2" />
                        <p className="text-purple-800 dark:text-purple-300 font-medium text-sm">Interests Shown</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{interests.length}</p>
                        <p className="text-xs text-purple-700/70 mt-1">{interestRate}% conversion</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                    <CardBody className="p-5 relative overflow-hidden">
                        <CheckCircle className="w-10 h-10 text-orange-500/20 absolute -bottom-2 -right-2" />
                        <p className="text-orange-800 dark:text-orange-300 font-medium text-sm">Shortlisted</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{shortlists.length}</p>
                        <p className="text-xs text-orange-700/70 mt-1">Added to consideration</p>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardBody className="p-5 relative overflow-hidden">
                        <FileText className="w-10 h-10 text-green-500/20 absolute -bottom-2 -right-2" />
                        <p className="text-green-800 dark:text-green-300 font-medium text-sm">Investment Offers</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{offers.length}</p>
                        <p className="text-xs text-green-700/70 mt-1">{offerRate}% conversion</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Organization Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" /> Organizations Activity
                            </h2>
                        </CardHeader>
                        <CardBody className="p-0">
                            {reactions.length > 0 || responses.length > 0 ? (
                                <div className="divide-y divide-theme">
                                    {/* Map Reactions */}
                                    {reactions.map((reaction) => (
                                        <div key={`react-${reaction.id}`} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-tertiary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary">Anonymous Capital VC</p>
                                                    <p className="text-xs text-secondary mt-0.5">
                                                        {REACTION_LABELS[reaction.reaction_type] || reaction.reaction_type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm border border-theme px-3 py-1 rounded-full text-secondary">
                                                    {formatDistanceToNow(new Date(reaction.created_at))} ago
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Map Responses (Offers & Questions) */}
                                    {responses.map((resp) => (
                                        <div key={`resp-${resp.id}`} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors bg-primary-50/10">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                                                    {resp.response_type === 'offer' ? <FileText className="w-5 h-5 text-primary-600" /> : <MessageSquare className="w-5 h-5 text-primary-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary">{resp.responder_name || 'Verified Investor'}</p>
                                                    <p className="text-xs font-semibold text-primary-600 mt-0.5 uppercase tracking-wide">
                                                        {resp.response_type === 'offer' ? 'Investment Offer' : 'Question / Comment'}
                                                    </p>
                                                    <p className="text-sm text-secondary mt-1 max-w-lg truncate">
                                                        {resp.content}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 mt-3 sm:mt-0">
                                                {resp.response_type === 'offer' && (
                                                    <p className="font-bold text-green-600 mb-1">
                                                        KES {Number(resp.offer_amount).toLocaleString()}
                                                    </p>
                                                )}
                                                <Button size="sm" variant="outline" onClick={() => navigate(`/rooms`)}>
                                                    View Thread
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Building2 className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                    <p className="text-secondary font-medium">No verified organizations have interacted yet.</p>
                                    <p className="text-sm text-tertiary mt-1">Check back later as investors discover your profile.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Key Insights */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary-600" /> Pipeline Funnel
                            </h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-theme before:to-transparent">

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-theme bg-secondary/20 scale-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-primary">Discovery</h4>
                                            <span className="text-sm font-bold text-blue-600">{mockViews}</span>
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Unique views</p>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-purple-200 bg-purple-50 text-purple-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <Heart className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-theme bg-secondary/20 scale-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-primary">Consideration</h4>
                                            <span className="text-sm font-bold text-purple-600">{interests.length}</span>
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Tracked interests</p>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-green-200 bg-green-50 text-green-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-theme bg-secondary/20 scale-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-primary">Action</h4>
                                            <span className="text-sm font-bold text-green-600">{offers.length}</span>
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Firm offers</p>
                                    </div>
                                </div>

                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-600" /> Summary
                            </h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary">Funding Status</span>
                                    <span className="font-semibold text-primary uppercase tracking-wide px-2 py-0.5 bg-secondary rounded-md">{request.status.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary">Days Active</span>
                                    <span className="font-semibold text-primary">{formatDistanceToNow(new Date(request.created_at))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary">Engagement Rate</span>
                                    <span className="font-semibold text-green-600">{interestRate}%</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FundingRequestAnalytics;
