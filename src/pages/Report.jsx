/**
 * Universal Report Page
 * Unified form for reporting any content type: announcements, events, tasks, resources, research, articles
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Flag, AlertTriangle, Shield, Send, ArrowLeft,
    CheckCircle, MessageSquare, Eye, Ban
} from 'lucide-react';
import api from '../services/api';

const REPORT_CATEGORIES = [
    { value: 'spam', label: 'Spam or misleading', icon: Ban, description: 'Content is repetitive, misleading, or promotional' },
    { value: 'harassment', label: 'Harassment or bullying', icon: AlertTriangle, description: 'Abusive, threatening, or intimidating behavior' },
    { value: 'hate_speech', label: 'Hate speech', icon: Shield, description: 'Content promoting discrimination or violence against groups' },
    { value: 'misinformation', label: 'Misinformation', icon: Eye, description: 'False or misleading information presented as fact' },
    { value: 'copyright', label: 'Copyright violation', icon: Flag, description: 'Unauthorized use of copyrighted material' },
    { value: 'inappropriate', label: 'Inappropriate content', icon: AlertTriangle, description: 'Content that is obscene, vulgar, or inappropriate' },
    { value: 'privacy', label: 'Privacy concern', icon: Shield, description: 'Unauthorized sharing of personal information' },
    { value: 'other', label: 'Other', icon: MessageSquare, description: 'Something else not listed above' },
];

const Report = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const contentType = searchParams.get('type') || 'content';
    const contentId = searchParams.get('id') || '';
    const contentTitle = searchParams.get('title') || '';

    const [selectedCategory, setSelectedCategory] = useState('');
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedCategory) {
            setError('Please select a report category');
            return;
        }
        if (!details.trim()) {
            setError('Please provide details about the issue');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.post('/api/reports/', {
                content_type: contentType,
                content_id: contentId,
                category: selectedCategory,
                description: details,
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Failed to submit report:', err);
            setError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardBody className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Report Submitted</h2>
                        <p className="text-secondary">
                            Thank you for helping keep our community safe. Our moderation team will review your report within 24 hours.
                        </p>
                        <Button variant="primary" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                            <Flag className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Report {contentType}</h1>
                            <p className="text-secondary text-sm">Help us understand what's happening</p>
                        </div>
                    </div>
                </div>

                {/* Content being reported */}
                {contentTitle && (
                    <Card>
                        <CardBody className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-secondary">Reporting:</p>
                                <p className="font-medium text-primary">{contentTitle}</p>
                                <p className="text-xs text-tertiary mt-1 capitalize">{contentType} • ID: {contentId}</p>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Category Selection */}
                <Card>
                    <CardBody className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary">What's the issue?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {REPORT_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => { setSelectedCategory(cat.value); setError(null); }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCategory === cat.value
                                            ? 'border-red-500 bg-red-500/5'
                                            : 'border-theme/50 hover:border-theme hover:bg-secondary/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <cat.icon className={`w-5 h-5 ${selectedCategory === cat.value ? 'text-red-500' : 'text-secondary'}`} />
                                        <span className="font-medium text-primary text-sm">{cat.label}</span>
                                    </div>
                                    <p className="text-xs text-tertiary ml-8">{cat.description}</p>
                                </button>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Details */}
                <Card>
                    <CardBody className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary">Tell us more</h3>
                        <p className="text-sm text-secondary">
                            Please provide specific details to help our moderation team understand the issue.
                            Include any relevant context, timestamps, or screenshots.
                        </p>
                        <textarea
                            value={details}
                            onChange={(e) => { setDetails(e.target.value); setError(null); }}
                            rows={5}
                            className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none text-primary placeholder-tertiary resize-y"
                            placeholder="Describe the issue in detail..."
                        />
                    </CardBody>
                </Card>

                {/* Community Guidelines Note */}
                <div className="p-4 bg-primary/5 border border-theme/30 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-primary font-medium">Community Guidelines</p>
                        <p className="text-xs text-secondary mt-1">
                            Reports are confidential. False reports may result in action against your account.
                            Our team reviews all reports within 24 hours.
                        </p>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 justify-end pb-8">
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading || !selectedCategory || !details.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? (
                            'Submitting...'
                        ) : (
                            <>
                                <Send size={16} className="mr-2" />
                                Submit Report
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Report;
