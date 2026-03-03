import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle, ChevronRight, ChevronLeft, Plus, Trash2,
    Clock, DollarSign, Calendar, Briefcase, AlertCircle, Tag
} from 'lucide-react';
import shopService from '../../services/shop.service';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const SERVICE_CATEGORIES = [
    { value: 'legal', label: '⚖️ Legal Services', icon: '⚖️' },
    { value: 'consultancy', label: '💼 Consultancy', icon: '💼' },
    { value: 'fashion', label: '👗 Fashion & Styling', icon: '👗' },
    { value: 'hairdressing', label: '💇 Hairdressing', icon: '💇' },
    { value: 'beauty', label: '💅 Beauty & Skincare', icon: '💅' },
    { value: 'makeup', label: '💄 Makeup', icon: '💄' },
    { value: 'barbering', label: '✂️ Barbering', icon: '✂️' },
    { value: 'real_estate', label: '🏠 Real Estate', icon: '🏠' },
    { value: 'banking', label: '🏦 Banking & Finance', icon: '🏦' },
    { value: 'education', label: '🎓 College & Tertiary', icon: '🎓' },
    { value: 'tutoring', label: '📚 Tutoring', icon: '📚' },
    { value: 'electricals', label: '🔌 Electricals', icon: '🔌' },
    { value: 'phone_accessories', label: '📱 Phone & Accessories', icon: '📱' },
    { value: 'health', label: '🏥 Health & Wellness', icon: '🏥' },
    { value: 'fitness', label: '💪 Fitness & Training', icon: '💪' },
    { value: 'photography', label: '📷 Photography', icon: '📷' },
    { value: 'catering', label: '🍽️ Catering & Events', icon: '🍽️' },
    { value: 'cleaning', label: '🧹 Cleaning Services', icon: '🧹' },
    { value: 'delivery', label: '🚚 Delivery & Logistics', icon: '🚚' },
    { value: 'tech', label: '💻 Tech & IT', icon: '💻' },
    { value: 'other', label: '📦 Other', icon: '📦' },
];

const STEPS = [
    { number: 1, title: 'Service Info' },
    { number: 2, title: 'Scheduling' },
    { number: 3, title: 'Availability' },
    { number: 4, title: 'Review' },
];

const CreateService = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'consultancy',
        price: '',
        duration_minutes: 60,
        delay_minutes: 30,
        break_minutes: 15,
        max_bookings_per_day: 5,
        is_active: true,
        tags: '',
    });

    const [timeSlots, setTimeSlots] = useState([
        { day: 'monday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'tuesday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'wednesday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'thursday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'friday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'saturday', start_time: '10:00', end_time: '14:00', enabled: false },
        { day: 'sunday', start_time: '10:00', end_time: '14:00', enabled: false },
    ]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const updateSlot = (idx, field, value) => {
        setTimeSlots(prev => {
            const slots = [...prev];
            slots[idx] = { ...slots[idx], [field]: value };
            return slots;
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                time_slots: timeSlots.filter(s => s.enabled).map(({ enabled, ...rest }) => rest),
            };
            await shopService.createService(payload);
            setSuccess(true);
            setTimeout(() => navigate('/shop'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create service. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="flex justify-center mb-4">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Service Created!</h2>
                    <p className="text-secondary">Redirecting to your shop...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-secondary hover:text-primary mb-4">
                        <ArrowLeft size={18} /> Back to Shop
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
                        <Briefcase className="text-primary" />
                        Add a New Service
                    </h1>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-theme -z-10 -translate-y-1/2"></div>
                            {STEPS.map(step => (
                                <div key={step.number} className="flex flex-col items-center bg-elevated relative z-10 px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${currentStep >= step.number ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'}`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-primary' : 'text-secondary'}`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-center gap-2">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}

                        <div className="mt-8">
                            {/* Step 1: Service Info */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Service Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Service Name *</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange}
                                                placeholder="e.g. Legal Consultation" required
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Description *</label>
                                            <textarea name="description" value={formData.description} onChange={handleChange}
                                                rows={4} placeholder="Describe your service..."
                                                className="w-full px-4 py-2 bg-background border border-theme rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-primary resize-y" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Category *</label>
                                                <select name="category" value={formData.category} onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-background border border-theme rounded-lg text-primary outline-none">
                                                    {SERVICE_CATEGORIES.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-primary mb-1">Price ($) *</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary w-4 h-4" />
                                                    <input type="number" name="price" value={formData.price} onChange={handleChange}
                                                        placeholder="50.00" step="0.01"
                                                        className="w-full pl-8 pr-4 py-2 bg-background border border-theme rounded-lg text-primary outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-1">Tags (comma-separated)</label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary w-4 h-4" />
                                                <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                                                    placeholder="e.g. premium, quick, certified"
                                                    className="w-full pl-8 pr-4 py-2 bg-background border border-theme rounded-lg text-primary outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Scheduling */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Scheduling Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-background border border-theme rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-5 h-5 text-primary" />
                                                <h4 className="font-medium text-primary">Service Duration</h4>
                                            </div>
                                            <p className="text-xs text-secondary mb-2">How long each session lasts</p>
                                            <div className="flex items-center gap-2">
                                                <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleChange}
                                                    min="15" step="15"
                                                    className="w-20 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary text-center outline-none" />
                                                <span className="text-sm text-secondary">minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-background border border-theme rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Calendar className="w-5 h-5 text-primary" />
                                                <h4 className="font-medium text-primary">Delay Before Booking</h4>
                                            </div>
                                            <p className="text-xs text-secondary mb-2">Minimum advance notice required</p>
                                            <div className="flex items-center gap-2">
                                                <input type="number" name="delay_minutes" value={formData.delay_minutes} onChange={handleChange}
                                                    min="0" step="15"
                                                    className="w-20 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary text-center outline-none" />
                                                <span className="text-sm text-secondary">minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-background border border-theme rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-5 h-5 text-primary" />
                                                <h4 className="font-medium text-primary">Break Between Slots</h4>
                                            </div>
                                            <p className="text-xs text-secondary mb-2">Buffer time between appointments</p>
                                            <div className="flex items-center gap-2">
                                                <input type="number" name="break_minutes" value={formData.break_minutes} onChange={handleChange}
                                                    min="0" step="5"
                                                    className="w-20 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary text-center outline-none" />
                                                <span className="text-sm text-secondary">minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-background border border-theme rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Briefcase className="w-5 h-5 text-primary" />
                                                <h4 className="font-medium text-primary">Max Bookings/Day</h4>
                                            </div>
                                            <p className="text-xs text-secondary mb-2">Maximum appointments per day</p>
                                            <div className="flex items-center gap-2">
                                                <input type="number" name="max_bookings_per_day" value={formData.max_bookings_per_day}
                                                    onChange={handleChange} min="1"
                                                    className="w-20 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary text-center outline-none" />
                                                <span className="text-sm text-secondary">appointments</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Availability */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Weekly Availability</h3>
                                    <p className="text-sm text-secondary">Set the days and times when you're available for bookings</p>
                                    <div className="space-y-3">
                                        {timeSlots.map((slot, idx) => (
                                            <div key={slot.day}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${slot.enabled ? 'bg-background border-primary/30' : 'bg-secondary/5 border-theme'}`}>
                                                <label className="flex items-center gap-3 cursor-pointer min-w-[130px]">
                                                    <input type="checkbox" checked={slot.enabled}
                                                        onChange={(e) => updateSlot(idx, 'enabled', e.target.checked)}
                                                        className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300" />
                                                    <span className={`font-medium capitalize ${slot.enabled ? 'text-primary' : 'text-tertiary'}`}>{slot.day}</span>
                                                </label>
                                                {slot.enabled && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <input type="time" value={slot.start_time}
                                                            onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                                                            className="px-3 py-1.5 bg-elevated border border-theme rounded-lg text-primary outline-none" />
                                                        <span className="text-secondary">to</span>
                                                        <input type="time" value={slot.end_time}
                                                            onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                                                            className="px-3 py-1.5 bg-elevated border border-theme rounded-lg text-primary outline-none" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold text-primary mb-4">Review & Publish</h3>
                                    <div className="bg-background border border-theme rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-2xl font-bold text-primary">{formData.name}</h4>
                                                <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full mt-1 inline-block">
                                                    {SERVICE_CATEGORIES.find(c => c.value === formData.category)?.label}
                                                </span>
                                            </div>
                                            <span className="text-2xl font-bold text-green-600">${formData.price}</span>
                                        </div>
                                        <p className="text-secondary mb-6">{formData.description}</p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                                            <div className="bg-secondary/5 rounded-lg p-3">
                                                <span className="text-tertiary block text-xs mb-1">Duration</span>
                                                <span className="text-primary font-medium">{formData.duration_minutes} min</span>
                                            </div>
                                            <div className="bg-secondary/5 rounded-lg p-3">
                                                <span className="text-tertiary block text-xs mb-1">Advance Notice</span>
                                                <span className="text-primary font-medium">{formData.delay_minutes} min</span>
                                            </div>
                                            <div className="bg-secondary/5 rounded-lg p-3">
                                                <span className="text-tertiary block text-xs mb-1">Break</span>
                                                <span className="text-primary font-medium">{formData.break_minutes} min</span>
                                            </div>
                                            <div className="bg-secondary/5 rounded-lg p-3">
                                                <span className="text-tertiary block text-xs mb-1">Max/Day</span>
                                                <span className="text-primary font-medium">{formData.max_bookings_per_day}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-theme">
                                            <h5 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3">Available Days</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {timeSlots.filter(s => s.enabled).map(s => (
                                                    <span key={s.day} className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm capitalize">
                                                        {s.day}: {s.start_time} - {s.end_time}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between mt-8 pt-6 border-t border-theme">
                                <Button variant="secondary" onClick={() => currentStep === 1 ? navigate('/shop') : setCurrentStep(prev => prev - 1)}>
                                    <ChevronLeft size={18} className="mr-1" />
                                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                                </Button>
                                <div className="ml-auto">
                                    {currentStep < STEPS.length ? (
                                        <Button variant="primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                                            Next <ChevronRight size={18} className="ml-1" />
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : 'Publish Service'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateService;
