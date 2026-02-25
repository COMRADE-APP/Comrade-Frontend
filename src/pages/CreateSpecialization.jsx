/**
 * CreateSpecialization - Multi-step wizard for creating a new Specialization
 * Uses same green progress bar pattern as CreateEvent
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, GraduationCap, CheckCircle, AlertCircle,
    ChevronRight, ChevronLeft, BookOpen, Target, Tag, Users
} from 'lucide-react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import specializationsService from '../services/specializations.service';

const STEPS = [
    { number: 1, title: 'Basics' },
    { number: 2, title: 'Details' },
    { number: 3, title: 'Review' },
];

const CreateSpecialization = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        difficulty_level: 'beginner',
        estimated_duration: '',
        prerequisites: '',
        tags: '',
    });

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setError('Specialization name is required');
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
            if (formData.category) payload.category = formData.category;
            if (formData.difficulty_level) payload.difficulty_level = formData.difficulty_level;
            if (formData.estimated_duration) payload.estimated_duration = formData.estimated_duration;
            if (formData.prerequisites) payload.prerequisites = formData.prerequisites;
            if (formData.tags) payload.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

            await specializationsService.create(payload);
            navigate('/specializations');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create specialization');
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
                        <GraduationCap className="text-green-600" />
                        Create Specialization
                    </h1>
                    <p className="text-secondary mt-2">Define a new learning specialization for the community.</p>
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
                                        <label className="block text-sm font-medium text-primary mb-2">Specialization Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="e.g., Data Science, Full-Stack Web Development"
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
                                            placeholder="Describe what learners will achieve with this specialization..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                        >
                                            <option value="">Select a category</option>
                                            <option value="technology">Technology</option>
                                            <option value="business">Business</option>
                                            <option value="science">Science</option>
                                            <option value="arts">Arts & Design</option>
                                            <option value="health">Health & Medicine</option>
                                            <option value="engineering">Engineering</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Details */}
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
                                        <label className="block text-sm font-medium text-primary mb-2">Estimated Duration</label>
                                        <input
                                            type="text"
                                            value={formData.estimated_duration}
                                            onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="e.g., 3 months, 6 weeks"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Prerequisites</label>
                                        <textarea
                                            value={formData.prerequisites}
                                            onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary resize-none"
                                            placeholder="Any prior knowledge or courses required..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Tags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full px-4 py-2 bg-transparent border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary"
                                            placeholder="python, machine-learning, data"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Review */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                                        <CheckCircle className="text-green-600" /> Review Your Specialization
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
                                                <span className="text-sm text-secondary">Category</span>
                                                <p className="text-primary capitalize">{formData.category || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-secondary">Difficulty</span>
                                                <p className="text-primary capitalize">{formData.difficulty_level}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-secondary">Duration</span>
                                                <p className="text-primary">{formData.estimated_duration || 'Not set'}</p>
                                            </div>
                                        </div>
                                        {formData.prerequisites && (
                                            <div>
                                                <span className="text-sm text-secondary">Prerequisites</span>
                                                <p className="text-primary">{formData.prerequisites}</p>
                                            </div>
                                        )}
                                        {formData.tags && (
                                            <div>
                                                <span className="text-sm text-secondary">Tags</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {formData.tags.split(',').map((tag, i) => (
                                                        <span key={i} className="px-2 py-1 rounded-full bg-green-100/20 text-green-600 text-xs font-medium">
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
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
                                    {loading ? 'Creating...' : 'Create Specialization'}
                                    <GraduationCap size={18} className="ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateSpecialization;
