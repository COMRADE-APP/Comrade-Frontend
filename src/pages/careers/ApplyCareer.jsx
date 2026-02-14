import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { careersService } from '../../services/careers.service';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';

const ApplyCareer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [career, setCareer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        cover_letter: '',
        resume: null
    });

    useEffect(() => {
        fetchCareer();
    }, [id]);

    const fetchCareer = async () => {
        try {
            setLoading(true);
            const response = await careersService.getById(id);
            if (!response.data.is_active) {
                setError('This job posting is no longer active.');
            }
            setCareer(response.data);
        } catch (err) {
            setError('Failed to load job details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File size too large. Max 5MB.");
                return;
            }
            setForm(prev => ({ ...prev, resume: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await careersService.apply(id, form);
            setSuccess(true);
            setTimeout(() => navigate('/careers'), 3000);
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
                <h2 className="text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
                <p className="text-secondary mb-4">Good luck! We've sent your application to {career?.company_name}.</p>
                <p className="text-sm text-tertiary">Redirecting to careers...</p>
            </Card>
        </div>
    );

    if (error && !career) return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-primary mb-2">Error</h2>
            <p className="text-secondary mb-6">{error}</p>
            <Button variant="outline" onClick={() => navigate('/careers')}>
                Back to Careers
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent text-secondary hover:text-primary"
                    onClick={() => navigate(`/careers/${id}`)}
                >
                    <ArrowLeft size={20} className="mr-1" /> Back to Job Details
                </Button>

                <Card>
                    <CardBody className="p-8">
                        <div className="mb-8 border-b border-theme pb-6">
                            <h1 className="text-2xl font-bold text-primary mb-1">Apply for {career?.title}</h1>
                            <p className="text-secondary">{career?.company_name}</p>
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
                                    Cover Letter / Note
                                </label>
                                <textarea
                                    value={form.cover_letter}
                                    onChange={(e) => setForm(prev => ({ ...prev, cover_letter: e.target.value }))}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-primary resize-y"
                                    placeholder="Explain why you're a good fit for this role..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Resume / CV
                                </label>
                                <div className={`border-2 border-dashed border-theme rounded-xl p-8 text-center transition-colors ${form.resume ? 'bg-primary/5 border-primary/30' : 'hover:bg-elevated'}`}>
                                    {form.resume ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText size={32} className="text-primary" />
                                            <div className="text-left">
                                                <p className="font-medium text-primary">{form.resume.name}</p>
                                                <p className="text-xs text-secondary">{(form.resume.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, resume: null }))}
                                                className="ml-4 text-xs text-red-500 hover:text-red-700 underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <Upload size={32} className="mx-auto text-tertiary mb-3" />
                                            <p className="text-primary font-medium mb-1">Click to upload or drag and drop</p>
                                            <p className="text-xs text-secondary">PDF, DOCX up to 5MB</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-full justify-center py-3 text-lg"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                                </Button>
                                <p className="text-center text-xs text-tertiary mt-4">
                                    By submitting, you agree to share your uploaded resume and profile data with {career?.company_name}.
                                </p>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default ApplyCareer;
