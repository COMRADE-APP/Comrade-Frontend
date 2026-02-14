import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, FileText, Upload, Save, Send, Megaphone, X, Plus,
    Beaker, Calendar, Users, CheckCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import api from '../services/api';
import researchService from '../services/research.service';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const CreateResearch = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        description: '',
        research_type: 'paper',
        start_date: '',
        end_date: '',
        status: 'draft',
    });

    const [milestones, setMilestones] = useState([
        { title: 'Project Planning', description: 'Initial planning phase', due_date: '' }
    ]);

    const [requirements, setRequirements] = useState({
        min_age: '',
        max_age: '',
        gender: 'any',
        min_education_level: 'any',
        required_skills: [],
        location_requirements: ''
    });

    const [skillInput, setSkillInput] = useState('');

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequirementChange = (e) => {
        const { name, value } = e.target;
        setRequirements(prev => ({ ...prev, [name]: value }));
    };

    const addMilestone = () => {
        setMilestones([...milestones, { title: '', description: '', due_date: '' }]);
    };

    const updateMilestone = (idx, field, value) => {
        const updated = [...milestones];
        updated[idx][field] = value;
        setMilestones(updated);
    };

    const removeMilestone = (idx) => {
        setMilestones(milestones.filter((_, i) => i !== idx));
    };

    const addSkill = () => {
        if (skillInput.trim()) {
            setRequirements(prev => ({
                ...prev,
                required_skills: [...prev.required_skills, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setRequirements(prev => ({
            ...prev,
            required_skills: prev.required_skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Create Project
            const projectData = {
                ...formData,
                authors: [] // Authors logic can be added later or PI is auto-added
            };

            // In a real app, you might want to send everything in one go or use transactions
            // For now, we'll create the project first
            const project = await researchService.createProject(projectData);

            // 2. Add Milestones (if endpoint exists/supports it)
            // Currently backend creates empty project. We might need specific endpoints or update serializer to handle nested writes.
            // Assuming simplified flow or nested creation in backend for now.

            // For this demo, we'll just navigate back
            alert('Research project created successfully!');
            navigate(`/research/${project.id}`);
        } catch (error) {
            console.error('Error creating research:', error);
            alert('Failed to create research project.');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary mb-4">Basic Information</h3>
            <Input
                label="Research Title *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="E.g., The Impact of AI on Healthcare"
            />

            <div>
                <label className="block text-sm font-medium text-secondary mb-1">Abstract *</label>
                <textarea
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brief summary of your research..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary mb-1">Detailed Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Full description of methodology, goals, etc."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="date"
                    label="Start Date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                />
                <Input
                    type="date"
                    label="Target End Date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-primary">Project Milestones</h3>
                <Button size="sm" onClick={addMilestone} variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> Add Milestone
                </Button>
            </div>

            <div className="space-y-4">
                {milestones.map((milestone, idx) => (
                    <div key={idx} className="p-4 bg-elevated rounded-xl border border-theme relative">
                        <button
                            onClick={() => removeMilestone(idx)}
                            className="absolute top-2 right-2 text-secondary hover:text-red-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Milestone Title"
                                value={milestone.title}
                                onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                placeholder="E.g., Literature Review"
                            />
                            <Input
                                type="date"
                                label="Due Date"
                                value={milestone.due_date}
                                onChange={(e) => updateMilestone(idx, 'due_date', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                <textarea
                                    value={milestone.description}
                                    onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Deliverables for this milestone..."
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary mb-4">Participant Requirements</h3>
            <p className="text-secondary text-sm mb-4">Define who can participate in your research studies.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="number"
                    label="Min Age"
                    name="min_age"
                    value={requirements.min_age}
                    onChange={handleRequirementChange}
                />
                <Input
                    type="number"
                    label="Max Age"
                    name="max_age"
                    value={requirements.max_age}
                    onChange={handleRequirementChange}
                />

                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Gender Requirement</label>
                    <select
                        name="gender"
                        value={requirements.gender}
                        onChange={handleRequirementChange}
                        className="w-full px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="any">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-Binary</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Education Level</label>
                    <select
                        name="min_education_level"
                        value={requirements.min_education_level}
                        onChange={handleRequirementChange}
                        className="w-full px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="any">Any</option>
                        <option value="high_school">High School</option>
                        <option value="bachelor">Bachelor Degree</option>
                        <option value="master">Master Degree</option>
                        <option value="doctoral">Doctoral Degree</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary mb-1">Required Skills</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        className="flex-1 px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Type a skill and press Enter..."
                    />
                    <Button onClick={addSkill} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {requirements.required_skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)}><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary mb-1">Location Requirements</label>
                <textarea
                    name="location_requirements"
                    value={requirements.location_requirements}
                    onChange={handleRequirementChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-elevated border border-theme rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Specific countries, cities, or remote..."
                />
            </div>
        </div>
    );

    const renderReview = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary mb-4">Review & Submit</h3>

            <div className="space-y-6">
                <section>
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wide mb-2">Research Details</h4>
                    <div className="bg-elevated p-4 rounded-xl border border-theme">
                        <h2 className="text-lg font-bold text-primary">{formData.title}</h2>
                        <p className="text-secondary mt-2">{formData.abstract}</p>
                        <div className="mt-4 flex gap-4 text-sm text-secondary">
                            <span>Start: {formData.start_date || 'TBD'}</span>
                            <span>End: {formData.end_date || 'TBD'}</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wide mb-2">Milestones ({milestones.length})</h4>
                    <div className="bg-elevated p-4 rounded-xl border border-theme space-y-2">
                        {milestones.map((m, i) => (
                            <div key={i} className="flex justify-between border-b last:border-0 border-theme pb-2 last:pb-0">
                                <span className="font-medium text-primary">{m.title || 'Untitled'}</span>
                                <span className="text-secondary text-sm">{m.due_date || 'No date'}</span>
                            </div>
                        ))}
                        {milestones.length === 0 && <p className="text-secondary italic">No milestones added.</p>}
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wide mb-2">Requirements</h4>
                    <div className="bg-elevated p-4 rounded-xl border border-theme">
                        <ul className="list-disc list-inside text-sm text-secondary space-y-1">
                            <li>Age: {requirements.min_age || '?'} - {requirements.max_age || '?'}</li>
                            <li>Gender: {requirements.gender}</li>
                            <li>Education: {requirements.min_education_level}</li>
                            <li>Skills: {requirements.required_skills.join(', ') || 'None'}</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="rounded-full p-2" onClick={() => navigate('/research')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Create New Research Project</h1>
                    <p className="text-secondary">Plan, execute, and publish your research</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between px-8 py-4 bg-elevated rounded-xl border border-theme">
                {[
                    { num: 1, label: 'Basic Info', icon: Beaker },
                    { num: 2, label: 'Milestones', icon: Calendar },
                    { num: 3, label: 'Requirements', icon: Users },
                    { num: 4, label: 'Review', icon: CheckCircle },
                ].map((s) => {
                    const Icon = s.icon;
                    const isActive = step === s.num;
                    const isCompleted = step > s.num;

                    return (
                        <div key={s.num} className="flex flex-col items-center relative z-10">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                        isCompleted ? 'bg-green-500 text-white' : 'bg-secondary/20 text-secondary'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={`text-sm mt-2 font-medium ${isActive ? 'text-primary' : 'text-secondary'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
                {/* Progress Bar Background (could be added with absolute positioning but simplified here) */}
            </div>

            {/* Content */}
            <Card>
                <CardBody className="p-6 min-h-[400px]">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderReview()}
                </CardBody>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                    className="w-32"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                {step < 4 ? (
                    <Button
                        variant="primary"
                        onClick={() => setStep(step + 1)}
                        className="w-32"
                    >
                        Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-40 bg-green-600 hover:bg-green-700"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                        {!loading && <CheckCircle className="w-4 h-4 ml-2" />}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CreateResearch;
