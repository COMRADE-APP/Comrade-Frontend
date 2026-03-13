import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ApplyResearcher = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        qualifications: ''
    });
    const [files, setFiles] = useState({
        resume: null,
        verification_doc: null
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submitData = new FormData();
            submitData.append('qualifications', formData.qualifications);
            if (files.resume) submitData.append('resume', files.resume);
            if (files.verification_doc) submitData.append('verification_doc', files.verification_doc);

            await api.post('/research/researcher_applications/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess(true);
            await refreshUser(); // refresh context user
        } catch (err) {
            console.error('Failed to submit application:', err);
            setError(err.response?.data?.detail || 'Failed to submit application. You might already have a pending one.');
        } finally {
            setLoading(false);
        }
    };

    if (user?.is_researcher) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary">You are already a Researcher</h2>
                <p className="text-secondary mt-2 mb-6">You have the necessary permissions to create research projects.</p>
                <Button onClick={() => navigate('/research')} variant="primary">Go to Research Hub</Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <Card>
                    <CardBody className="py-12">
                        <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
                        <p className="text-secondary mb-6">Your application to become a verified researcher is pending review. We will notify you once a decision is made.</p>
                        <Button onClick={() => navigate('/research')} variant="primary">Return to Research Hub</Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Apply as a Researcher</h1>
                    <p className="text-secondary">Submit your credentials to publish research projects on Comrade.</p>
                </div>
            </div>

            <Card>
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Academic & Professional Qualifications *</label>
                            <textarea
                                name="qualifications"
                                required
                                rows={5}
                                value={formData.qualifications}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Describe your educational background, current institution, prior research experience, etc."
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-theme">
                            <h3 className="font-medium text-primary flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Supporting Documents
                            </h3>

                            <div className="bg-secondary/30 p-4 border border-theme rounded-xl border-dashed">
                                <label className="block text-sm font-medium text-secondary mb-2">Resume / CV</label>
                                <input
                                    type="file"
                                    name="resume"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    accept=".pdf,.doc,.docx"
                                />
                            </div>

                            <div className="bg-secondary/30 p-4 border border-theme rounded-xl border-dashed">
                                <label className="block text-sm font-medium text-secondary mb-2">Verification Document (Optional)</label>
                                <p className="text-xs text-tertiary mb-3">E.g., Institutional ID card, letter of affiliation, or degree certificate.</p>
                                <input
                                    type="file"
                                    name="verification_doc"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-theme flex justify-end">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading || !formData.qualifications.trim()}
                                className="w-full sm:w-auto min-w-[150px]"
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default ApplyResearcher;
