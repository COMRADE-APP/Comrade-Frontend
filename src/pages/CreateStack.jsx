/**
 * CreateStack - Multi-step wizard for creating a new Stack
 * Uses same green progress bar pattern as CreateEvent
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, CheckCircle, AlertCircle,
    ChevronRight, ChevronLeft, GraduationCap, Link2, ListChecks
} from 'lucide-react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import specializationsService from '../services/specializations.service';

const STEPS = [
    { number: 1, title: 'Basics' },
    { number: 2, title: 'Content' },
    { number: 3, title: 'Review' },
];

const CreateStack = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [specializations, setSpecializations] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        specialization: '',
        difficulty_level: 'beginner',
        estimated_hours: '',
        resources_url: '',
        learning_objectives: '',
        order: 1,
    });

    useEffect(() => {
        loadSpecializations();
    }, []);

    const loadSpecializations = async () => {
        try {
            const data = await specializationsService.getAll();
            setSpecializations(Array.isArray(data) ? data : data?.results || []);
        } catch (err) {
            console.error('Error loading specializations:', err);
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setError('Stack name is required');
                return;
            }
        }
        setError(null);
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const prevStep = () => {
        setError(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
            };
            if (formData.specialization) payload.specialization = formData.specialization;
            if (formData.difficulty_level) payload.difficulty_level = formData.difficulty_level;
            if (formData.estimated_hours) payload.estimated_hours = parseInt(formData.estimated_hours) || 0;
            if (formData.resources_url) payload.resources_url = formData.resources_url;
            if (formData.learning_objectives) payload.learning_objectives = formData.learning_objectives;
            if (formData.order) payload.order = parseInt(formData.order) || 1;

            await specializationsService.createStack(payload);
            navigate('/specializations');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create stack');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/specializations')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Back to Learning Paths
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <BookOpen className="text-green-600" />
                        Create Stack
                    </h1>
                    <p className="text-secondary mt-2">Build a new learning stack with curated resources.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Green Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-green-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            ></div>

                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center relative z-10 px-2 group cursor-pointer"
                                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-elevated text-secondary border-theme group-hover:border-green-300'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-green-600' : 'text-secondary'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[300px]">
                            {/* STEP 1: Basics */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Stack Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="e.g., Python for Data Science"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Description *</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary resize-none"
                                            placeholder="Describe what this stack covers..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Specialization (optional)</label>
                                        <select
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                        >
                                            <option value="">Select a specialization</option>
                                            {specializations.map((spec) => (
                                                <option key={spec.id} value={spec.id}>{spec.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Content */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Difficulty Level</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['beginner', 'intermediate', 'advanced'].map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, difficulty_level: level })}
                                                    className={`p-3 rounded-lg border-2 text-center capitalize font-medium transition-all ${formData.difficulty_level === level
                                                            ? 'border-green-600 bg-green-50/10 text-green-600'
                                                            : 'border-theme text-secondary hover:border-green-300'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Estimated Hours</label>
                                        <input
                                            type="number"
                                            value={formData.estimated_hours}
                                            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="e.g., 20"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Resources URL</label>
                                        <input
                                            type="url"
                                            value={formData.resources_url}
                                            onChange={(e) => setFormData({ ...formData, resources_url: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="https://docs.example.com/..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Learning Objectives</label>
                                        <textarea
                                            value={formData.learning_objectives}
                                            onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary resize-none"
                                            placeholder="What learners will achieve by completing this stack..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Order in Specialization</label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Review */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                                        <CheckCircle className="text-green-600" /> Review Your Stack
                                    </h2>

                                    <div className="bg-secondary/5 rounded-xl p-6 space-y-4 border border-theme">
                                        <div>
                                            <span className="text-sm text-secondary">Name</span>
                                            <p className="text-primary font-medium text-lg">{formData.name || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-secondary">Description</span>
                                            <p className="text-primary">{formData.description || '—'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-secondary">Specialization</span>
                                                <p className="text-primary">
                                                    {specializations.find(s => String(s.id) === String(formData.specialization))?.name || 'None'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-secondary">Difficulty</span>
                                                <p className="text-primary capitalize">{formData.difficulty_level}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-secondary">Estimated Hours</span>
                                                <p className="text-primary">{formData.estimated_hours || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-secondary">Order</span>
                                                <p className="text-primary">{formData.order}</p>
                                            </div>
                                        </div>
                                        {formData.resources_url && (
                                            <div>
                                                <span className="text-sm text-secondary">Resources</span>
                                                <p className="text-primary-600 text-sm break-all">{formData.resources_url}</p>
                                            </div>
                                        )}
                                        {formData.learning_objectives && (
                                            <div>
                                                <span className="text-sm text-secondary">Learning Objectives</span>
                                                <p className="text-primary">{formData.learning_objectives}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                            <Button
                                variant="outline"
                                onClick={currentStep === 1 ? () => navigate('/specializations') : prevStep}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Back'}
                            </Button>

                            {currentStep < STEPS.length ? (
                                <Button variant="primary" onClick={nextStep}>
                                    Next
                                    <ChevronRight size={18} className="ml-1" />
                                </Button>
                            ) : (
                                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Stack'}
                                    <BookOpen size={18} className="ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateStack;
