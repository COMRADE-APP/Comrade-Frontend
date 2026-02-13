import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2, FileText, MessageSquare, Settings, Users, DollarSign,
    ArrowLeft, CheckCircle, XCircle, Clock, ArrowRight, Plus, Eye, Filter,
    Shield, TrendingUp, Briefcase, Globe, Calendar, Award,
    BarChart3, Target, PieChart
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';

const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    due_diligence: 'bg-orange-100 text-orange-700',
    negotiating: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    funded: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-600',
    closed: 'bg-gray-200 text-gray-700',
};

const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    due_diligence: 'Due Diligence',
    negotiating: 'Negotiating',
    approved: 'Approved',
    funded: 'Funded',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    closed: 'Closed',
};

const FundingRequestCard = ({ request, onView, onReview }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardBody className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-primary">{request.business_name || 'Business'}</h3>
                        <p className="text-sm text-secondary mt-1">{request.use_of_funds?.substring(0, 100)}...</p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="text-lg font-bold text-primary-600">
                                {formatCurrency(request.amount_needed)}
                            </span>
                            <span className="text-sm text-secondary">
                                {request.equity_offered}% equity
                            </span>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[request.status] || request.status}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-theme">
                    <Button variant="outline" size="sm" onClick={() => onView(request)}>
                        <Eye className="w-4 h-4 mr-1" /> View Details
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => onReview(request)}>
                        <ArrowRight className="w-4 h-4 mr-1" /> Review
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

const ReviewModal = ({ request, onClose, onSubmit }) => {
    const [newStatus, setNewStatus] = useState(request?.status || '');
    const [notes, setNotes] = useState('');
    const [documentsRequested, setDocumentsRequested] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                funding_request_id: request.id,
                status: newStatus,
                notes,
                documents_requested: documentsRequested
            });
            onClose();
        } catch (error) {
            console.error('Review failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-elevated rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-theme">
                    <h2 className="text-lg font-semibold text-primary">Review Funding Request</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">New Status</label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                            required
                        >
                            <option value="">Select status...</option>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Review Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your review comments..."
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary h-24 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Documents Requested (optional)</label>
                        <textarea
                            value={documentsRequested}
                            onChange={(e) => setDocumentsRequested(e.target.value)}
                            placeholder="List any additional documents needed..."
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary h-20 resize-none"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading || !newStatus} className="flex-1">
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ==================== PUBLIC VIEW ====================
const VenturePublicView = ({ venture, navigate }) => {
    // Sample portfolio and achievements
    const portfolio = [
        { name: 'TechStartup KE', stage: 'Series A', amount: 'KES 5M', status: 'Active' },
        { name: 'AgriGrow Africa', stage: 'Seed', amount: 'KES 2M', status: 'Active' },
        { name: 'FinPay Solutions', stage: 'Pre-Seed', amount: 'KES 1M', status: 'Exited' },
    ];

    const achievements = [
        { icon: '🏆', title: 'Top 10 VC in East Africa 2025', subtitle: 'Recognized by Africa Innovation Report' },
        { icon: '📈', title: `${venture?.received_requests_count || 0} Funded Proposals`, subtitle: 'Across multiple sectors' },
        { icon: '🌍', title: 'Pan-African Focus', subtitle: 'Investments across 4+ countries' },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{venture?.name}</h1>
                            {venture?.is_verified && <Shield className="w-6 h-6 text-green-300" />}
                        </div>
                        <p className="text-white/80 mt-1">{venture?.investment_focus || 'Investment Fund'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Total Fund</p>
                        <p className="text-2xl font-bold">KES {Number(venture?.total_fund || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Investment Range</p>
                        <p className="text-lg font-bold">
                            KES {Number(venture?.min_investment || 0).toLocaleString()} - {Number(venture?.max_investment || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-white/60 text-sm">Proposals Received</p>
                        <p className="text-2xl font-bold">{venture?.received_requests_count || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardBody className="p-6">
                            <h2 className="font-bold text-lg text-primary mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5" /> About This Fund
                            </h2>
                            <p className="text-secondary leading-relaxed">{venture?.description || 'This funding organization is dedicated to empowering innovative startups and businesses through strategic investment and mentorship.'}</p>
                            {venture?.investment_criteria && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-semibold text-blue-700 mb-1">Investment Criteria</h4>
                                    <p className="text-sm text-blue-600">{venture.investment_criteria}</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Portfolio */}
                    <Card>
                        <CardBody className="p-6">
                            <h2 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                <PieChart className="w-5 h-5" /> Portfolio
                            </h2>
                            <div className="space-y-3">
                                {portfolio.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-secondary/5 rounded-xl border border-theme">
                                        <div>
                                            <p className="font-semibold text-primary">{item.name}</p>
                                            <p className="text-xs text-secondary">{item.stage}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{item.amount}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* History */}
                    <Card>
                        <CardBody className="p-6">
                            <h2 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> History
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-primary">Organization founded</p>
                                        <p className="text-xs text-secondary">{new Date(venture?.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-primary">Fund established with KES {Number(venture?.total_fund || 0).toLocaleString()}</p>
                                        <p className="text-xs text-secondary">Initial capital raised</p>
                                    </div>
                                </div>
                                {venture?.is_verified && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="text-sm font-medium text-primary">Verified by platform</p>
                                            <p className="text-xs text-secondary">Passed due diligence review</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Achievements */}
                    <Card>
                        <CardBody className="p-5">
                            <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                                <Award className="w-5 h-5" /> Achievements
                            </h3>
                            <div className="space-y-3">
                                {achievements.map((a, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="text-xl">{a.icon}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-primary">{a.title}</p>
                                            <p className="text-xs text-secondary">{a.subtitle}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quick Info */}
                    <Card>
                        <CardBody className="p-5 space-y-3">
                            <h3 className="font-bold text-primary">Quick Info</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Organization</span>
                                    <span className="text-primary">{venture?.organisation_name || 'Independent'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Min Investment</span>
                                    <span className="text-primary">KES {Number(venture?.min_investment || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Max Investment</span>
                                    <span className="text-primary">KES {Number(venture?.max_investment || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${venture?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {venture?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN DASHBOARD ====================
const FundingOrgDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [venture, setVenture] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (id) {
            loadVenture();
        }
    }, [id]);

    const loadVenture = async () => {
        setLoading(true);
        try {
            const ventureData = await fundingService.getVentureDetail(id);
            setVenture(ventureData);

            // Check if user is the creator to determine view
            try {
                const myVentures = await fundingService.getMyVentures();
                const owned = myVentures.some(v => v.id === parseInt(id) || v.id === id);
                setIsOwner(owned);

                if (owned) {
                    const requestsData = await fundingService.getVentureRequests(id);
                    setRequests(requestsData);
                }
            } catch {
                setIsOwner(false);
            }
        } catch (error) {
            console.error('Failed to load venture:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (reviewData) => {
        try {
            await fundingService.reviewRequest(id, reviewData);
            await loadVenture(); // Reload data
        } catch (error) {
            console.error('Review failed:', error);
            throw error;
        }
    };

    const handleCreateNegotiationRoom = async (request) => {
        try {
            const result = await fundingService.createNegotiationRoom(id, request.id);
            if (result.room_id) {
                navigate(`/rooms/${result.room_id}`);
            }
        } catch (error) {
            console.error('Failed to create negotiation room:', error);
        }
    };

    const filteredRequests = statusFilter === 'all'
        ? requests
        : requests.filter(r => r.status === statusFilter);

    const tabs = [
        { id: 'requests', label: 'Funding Requests', icon: FileText, count: requests.length },
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Show public view for non-owners
    if (!isOwner) {
        return <VenturePublicView venture={venture} navigate={navigate} />;
    }

    // Show management dashboard for owners
    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary">{venture?.name || 'Funding Organization'}</h1>
                    <p className="text-secondary">{venture?.investment_focus || 'Investment Fund'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm text-secondary">Available Fund</p>
                        <p className="font-bold text-lg text-primary-600">
                            KES {venture?.available_fund?.toLocaleString()}
                        </p>
                    </div>
                    {venture?.is_verified && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-theme">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-secondary hover:text-primary'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{tab.count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <Filter className="w-4 h-4 text-secondary" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-theme rounded-lg bg-secondary text-primary text-sm"
                        >
                            <option value="all">All Requests</option>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <span className="text-sm text-secondary">
                            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Requests Grid */}
                    {filteredRequests.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredRequests.map(request => (
                                <FundingRequestCard
                                    key={request.id}
                                    request={request}
                                    onView={(r) => navigate(`/funding/requests/${r.id}`)}
                                    onReview={(r) => setReviewingRequest(r)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardBody className="text-center py-12">
                                <FileText className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <p className="text-secondary">No funding requests found</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardBody className="text-center p-6">
                            <p className="text-3xl font-bold text-primary-600">{requests.length}</p>
                            <p className="text-secondary">Total Requests</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center p-6">
                            <p className="text-3xl font-bold text-green-600">
                                {requests.filter(r => r.status === 'funded').length}
                            </p>
                            <p className="text-secondary">Funded</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center p-6">
                            <p className="text-3xl font-bold text-yellow-600">
                                {requests.filter(r => ['under_review', 'due_diligence', 'negotiating'].includes(r.status)).length}
                            </p>
                            <p className="text-secondary">In Progress</p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {activeTab === 'settings' && (
                <Card>
                    <CardBody className="p-6">
                        <h3 className="font-semibold text-primary mb-4">Venture Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-secondary">Investment Focus</label>
                                <p className="text-primary">{venture?.investment_focus || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-secondary">Investment Criteria</label>
                                <p className="text-primary">{venture?.investment_criteria || 'Not specified'}</p>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-sm text-secondary">Min Investment</label>
                                    <p className="text-primary">KES {venture?.min_investment?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-secondary">Max Investment</label>
                                    <p className="text-primary">KES {venture?.max_investment?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Review Modal */}
            {reviewingRequest && (
                <ReviewModal
                    request={reviewingRequest}
                    onClose={() => setReviewingRequest(null)}
                    onSubmit={handleReviewSubmit}
                />
            )}
        </div>
    );
};

export default FundingOrgDashboard;
