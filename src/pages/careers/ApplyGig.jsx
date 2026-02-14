import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { gigsService } from '../../services/careers.service';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

const ApplyGig = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        cover_letter: '',
        proposed_rate: ''
    });

    useEffect(() => {
        fetchGig();
    }, [id]);

    const fetchGig = async () => {
        try {
            setLoading(true);
            const response = await gigsService.getById(id);
            if (response.data.status !== 'open') {
                setError('This gig is no longer accepting applications.');
            }
            setGig(response.data);
            // Pre-fill rate with gig budget if empty
            if (!form.proposed_rate) {
                setForm(prev => ({ ...prev, proposed_rate: response.data.pay_amount }));
            }
        } catch (err) {
            setError('Failed to load gig details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await gigsService.apply(id, {
                cover_letter: form.cover_letter,
                proposed_rate: parseFloat(form.proposed_rate)
            });
            setSuccess(true);
            setTimeout(() => navigate('/gigs'), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
            <Card className="max-w-md w-full text-center p-8">
                <div className="flex justify-center mb-4">
                    <CheckCircle size={64} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">Proposal Sent!</h2>
                <p className="text-secondary mb-4">The client has been notified of your proposal.</p>
                <p className="text-sm text-tertiary">Redirecting to gigs...</p>
            </Card>
        </div>
    );

    if (error && !gig) return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-primary mb-2">Error</h2>
            <p className="text-secondary mb-6">{error}</p>
            <Button variant="outline" onClick={() => navigate('/gigs')}>
                Back to Gigs
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent text-secondary hover:text-primary"
                    onClick={() => navigate(`/gigs/${id}`)}
                >
                    <ArrowLeft size={20} className="mr-1" /> Back to Gig Details
                </Button>

                <Card>
                    <CardBody className="p-8">
                        <div className="mb-8 border-b border-theme pb-6">
                            <h1 className="text-2xl font-bold text-primary mb-1">Submit Proposal</h1>
                            <p className="text-secondary">for {gig?.title}</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Why are you the best fit?
                                </label>
                                <textarea
                                    value={form.cover_letter}
                                    onChange={(e) => setForm(prev => ({ ...prev, cover_letter: e.target.value }))}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                    placeholder="Describe your relevant experience and how you'd approach this gig..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Proposed Rate (USD)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                        <DollarSign size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        value={form.proposed_rate}
                                        onChange={(e) => setForm(prev => ({ ...prev, proposed_rate: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary"
                                        placeholder="0.00"
                                        min="1"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    Client's budget: ${parseFloat(gig?.pay_amount).toLocaleString()}
                                </p>
                            </div>

                            <div className="pt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-full justify-center py-3 text-lg"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Sending Proposal...' : 'Send Proposal'}
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default ApplyGig;
