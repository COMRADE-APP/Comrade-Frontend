import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import researchService from '../services/research.service';

const ResearchApplication = () => {
    const { projectId, postId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [post, setPost] = useState(null);
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Multi-step state
    const [currentStep, setCurrentStep] = useState(1);

    // Form data state
    const [basicInfo, setBasicInfo] = useState({
        cover_letter: '',
        relevant_experience: '',
        availability: '',
        position_id: ''
    });

    const [customAnswers, setCustomAnswers] = useState({});

    useEffect(() => {
        loadData();
    }, [projectId, postId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [projectData, postsData] = await Promise.all([
                researchService.getProjectById(projectId),
                researchService.getRecruitmentPosts({ research: projectId })
            ]);

            setProject(projectData);

            const currentPost = (postsData.results || postsData).find(p => p.id === parseInt(postId));
            if (!currentPost) {
                setError('Recruitment post not found or is no longer active.');
            } else {
                setPost(currentPost);
                // Pre-select first position if available
                if (currentPost.positions && currentPost.positions.length > 0) {
                    setBasicInfo(prev => ({ ...prev, position_id: currentPost.positions[0].id }));
                }
            }
        } catch (err) {
            console.error('Error loading application data:', err);
            setError('Failed to load application details. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleBasicInfoChange = (e) => {
        const { name, value } = e.target;
        setBasicInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomAnswerChange = (questionId, value) => {
        setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!basicInfo.position_id) {
            alert('Please select a position to apply for.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                position_id: basicInfo.position_id,
                cover_letter: basicInfo.cover_letter,
                relevant_experience: basicInfo.relevant_experience,
                availability: basicInfo.availability,
                form_data: customAnswers // The dynamic schema answers
            };

            await researchService.applyToRecruitmentPost(postId, payload);
            setSuccess(true);
        } catch (err) {
            console.error('Submit error:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit application.';
            alert(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const customQuestions = post?.application_form_schema?.questions || [];
    const totalSteps = customQuestions.length > 0 ? 3 : 2;

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h2 className="text-2xl font-bold text-primary">Application Error</h2>
                <p className="text-secondary">{error}</p>
                <Button onClick={() => navigate(`/research/${projectId}`)}>Back to Research</Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-3xl mx-auto p-8 mt-12 text-center space-y-6">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                <h2 className="text-3xl font-bold text-primary">Application Submitted Successfully!</h2>
                <p className="text-secondary text-lg">
                    Thank you for applying to <strong>{post?.title}</strong> for <strong>{project?.title}</strong>.
                    The principal investigator will review your application and get back to you.
                </p>
                <div className="pt-8">
                    <Button variant="primary" onClick={() => navigate(`/research/${projectId}`)}>
                        Return to Research Project
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-6">
            <Button variant="ghost" onClick={() => navigate(`/research/${projectId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
            </Button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-2">Apply: {post.title}</h1>
                <p className="text-secondary">Research: {project.title}</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center mb-10">
                <div className="flex items-center w-full max-w-2xl">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                        1
                    </div>
                    <div className={`flex-1 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>

                    {totalSteps === 3 && (
                        <>
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                                2
                            </div>
                            <div className={`flex-1 h-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                        </>
                    )}

                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep === totalSteps ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                        {totalSteps}
                    </div>
                </div>
            </div>

            <Card className="shadow-lg border-theme/50">
                <CardBody className="p-8">
                    {/* STEP 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-primary mb-6">Basic Information</h2>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Select Position <span className="text-red-500">*</span></label>
                                <select
                                    name="position_id"
                                    value={basicInfo.position_id}
                                    onChange={handleBasicInfoChange}
                                    className="w-full p-3 bg-elevated border border-theme rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="" disabled>Select a position to apply for</option>
                                    {post.positions?.map(pos => (
                                        <option key={pos.id} value={pos.id} disabled={pos.is_full}>
                                            {pos.title} {pos.is_full ? '(Full)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Cover Letter</label>
                                <textarea
                                    name="cover_letter"
                                    value={basicInfo.cover_letter}
                                    onChange={handleBasicInfoChange}
                                    placeholder="Briefly describe why you are interested in this position..."
                                    className="w-full p-3 bg-elevated border border-theme rounded-xl min-h-[120px] focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Relevant Experience</label>
                                <textarea
                                    name="relevant_experience"
                                    value={basicInfo.relevant_experience}
                                    onChange={handleBasicInfoChange}
                                    placeholder="Highlight any skills or experience relevant to this research..."
                                    className="w-full p-3 bg-elevated border border-theme rounded-xl min-h-[100px] focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Availability</label>
                                <input
                                    type="text"
                                    name="availability"
                                    value={basicInfo.availability}
                                    onChange={handleBasicInfoChange}
                                    placeholder="e.g., 10 hours/week, Mon-Wed afternoons"
                                    className="w-full p-3 bg-elevated border border-theme rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Custom Questions (if any) */}
                    {currentStep === 2 && totalSteps === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-primary mb-2">Additional Questions</h2>
                            <p className="text-secondary text-sm mb-6">The research team has a few specific questions for applicants.</p>

                            {customQuestions.map((q, idx) => (
                                <div key={idx} className="bg-secondary/5 p-5 rounded-xl border border-theme/30">
                                    <label className="block text-sm font-medium text-primary mb-3">
                                        {q.label} {q.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {q.type === 'text' || q.type === 'textarea' ? (
                                        <textarea
                                            value={customAnswers[q.id] || ''}
                                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                            placeholder={q.placeholder || "Your answer..."}
                                            required={q.required}
                                            className="w-full p-3 bg-elevated border border-theme rounded-xl min-h-[80px] focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                    ) : q.type === 'select' ? (
                                        <select
                                            value={customAnswers[q.id] || ''}
                                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                            required={q.required}
                                            className="w-full p-3 bg-elevated border border-theme rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                        >
                                            <option value="" disabled>Select an option</option>
                                            {q.options?.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={customAnswers[q.id] || ''}
                                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                            required={q.required}
                                            className="w-full p-3 bg-elevated border border-theme rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 3 (or 2): Review & Submit */}
                    {currentStep === totalSteps && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-semibold text-primary mb-6">Review & Submit</h2>

                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                                <h3 className="font-semibold text-lg text-primary mb-4">Application Summary</h3>

                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3 gap-4 border-b border-theme/50 pb-2">
                                        <span className="text-secondary font-medium">Position:</span>
                                        <span className="col-span-2 text-primary font-semibold">
                                            {post.positions?.find(p => p.id === parseInt(basicInfo.position_id))?.title || 'Not selected'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-b border-theme/50 pb-2">
                                        <span className="text-secondary font-medium">Availability:</span>
                                        <span className="col-span-2 text-primary">{basicInfo.availability || 'Not provided'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-b border-theme/50 pb-2">
                                        <span className="text-secondary font-medium">Cover Letter:</span>
                                        <span className="col-span-2 text-primary line-clamp-3">{basicInfo.cover_letter || 'Not provided'}</span>
                                    </div>

                                    {totalSteps === 3 && customQuestions.length > 0 && (
                                        <div className="pt-4">
                                            <h4 className="font-medium text-secondary mb-2">Custom Answers:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-primary">
                                                {customQuestions.map((q, i) => (
                                                    <li key={i}>{q.label}: {customAnswers[q.id] ? 'Answered' : 'Not answered'}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-tertiary text-center mt-6">
                                By submitting this application, you agree to share your profile information with the research team.
                            </p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-theme">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1 || submitting}
                        >
                            Previous
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button
                                variant="primary"
                                onClick={nextStep}
                            >
                                Next Step <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={submitting || !basicInfo.position_id}
                                className="bg-primary-600 hover:bg-primary-700"
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ResearchApplication;
