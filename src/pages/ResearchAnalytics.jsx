import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { ArrowLeft, TrendingUp, Users, Eye, CheckCircle, BarChart2, FileText, ClipboardList } from 'lucide-react';
import api from '../services/api';

const ResearchAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, [id]);

    const loadAnalytics = async () => {
        try {
            const data = await api.get(`/research/projects/${id}/analytics/`);
            setAnalytics(data.data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
            setError('Could not load analytics or you do not have permission.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <Card>
                    <CardBody className="py-12">
                        <BarChart2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
                        <p className="text-secondary mb-6">{error}</p>
                        <Button onClick={() => navigate(`/research/${id}`)} variant="primary">Back to Project</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(`/research/${id}`)} className="p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Research Analytics</h1>
                    <p className="text-secondary">Performance and engagement metrics for this project</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Total Views</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.views || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Eye className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Applications</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.total_applications || 0}</h3>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-lg">
                                <Users className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Accepted</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.accepted_applications || 0}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Positions</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.positions_count || 0}</h3>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Surveys</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.total_tasks || 0}</h3>
                            </div>
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <ClipboardList className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-secondary">Survey Responses</p>
                                <h3 className="text-3xl font-bold text-primary mt-1">{analytics?.total_survey_responses || 0}</h3>
                            </div>
                            <div className="p-3 bg-teal-100 rounded-lg">
                                <FileText className="w-6 h-6 text-teal-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Detailed Charts/Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-primary mb-4">Action Summary</h3>
                        <div className="space-y-4">
                            {analytics?.action_counts && Object.entries(analytics.action_counts).length > 0 ? (
                                Object.entries(analytics.action_counts).map(([action, count]) => (
                                    <div key={action} className="flex justify-between items-center py-3 border-b border-theme last:border-0">
                                        <span className="text-secondary capitalize">{action.replace('_', ' ')}</span>
                                        <span className="font-semibold text-primary">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-secondary italic">No actions recorded yet.</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-theme">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-primary mb-4">Daily Views (Last 30 Days)</h3>
                        <div className="space-y-4">
                            {analytics?.daily_views?.length > 0 ? (
                                analytics.daily_views.map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-theme last:border-0">
                                        <span className="text-secondary">{new Date(stat.date).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(stat.count * 10, 100)}px` }} />
                                            <span className="font-semibold text-primary text-sm">{stat.count}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-secondary italic">No daily view data available.</p>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Data Collection Metrics */}
            {(analytics?.total_tasks > 0 || analytics?.total_survey_responses > 0) && (
                <Card className="border border-theme mt-6">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5" /> Data Collection Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-secondary/10 rounded-xl">
                                <div className="text-3xl font-bold text-primary">{analytics?.total_tasks || 0}</div>
                                <div className="text-sm text-secondary mt-1">Linked Surveys</div>
                            </div>
                            <div className="text-center p-4 bg-secondary/10 rounded-xl">
                                <div className="text-3xl font-bold text-primary">{analytics?.total_survey_responses || 0}</div>
                                <div className="text-sm text-secondary mt-1">Total Responses Collected</div>
                            </div>
                            <div className="text-center p-4 bg-secondary/10 rounded-xl">
                                <div className="text-3xl font-bold text-primary">
                                    {analytics?.total_tasks > 0
                                        ? Math.round(analytics.total_survey_responses / analytics.total_tasks)
                                        : 0}
                                </div>
                                <div className="text-sm text-secondary mt-1">Avg Responses per Survey</div>
                            </div>
                        </div>
                        {analytics?.total_tasks > 0 && analytics?.total_participants > 0 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                <strong>Completion Rate:</strong> {Math.round((analytics.total_survey_responses / (analytics.total_participants * analytics.total_tasks)) * 100)}% of participants have responded across all surveys.
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default ResearchAnalytics;
