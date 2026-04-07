import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle, ChevronRight, ChevronLeft, Briefcase, AlertCircle, Tag, Clock, Calendar, DollarSign, MonitorSmartphone, Users, CalendarCheck2
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

const SERVICE_TYPES = [
    { value: 'appointment', label: 'In-person Appointment', desc: 'Clients meet you at your location', icon: CalendarCheck2 },
    { value: 'call_service', label: 'Virtual / Call Service', desc: 'Phone, Video, or Remote Consultation', icon: MonitorSmartphone },
    { value: 'online_sale', label: 'Online Service Delivery', desc: 'Digital tasks delivered offline (no strict slot)', icon: Users },
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
        service_type: 'appointment',
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

    const isSchedulingRequired = formData.service_type === 'appointment' || formData.service_type === 'call_service';

    const getSteps = () => {
        const baseSteps = [{ number: 1, title: 'Service Type' }];
        baseSteps.push({ number: 2, title: 'Details' });
        if (isSchedulingRequired) {
            baseSteps.push({ number: 3, title: 'Scheduling' });
            baseSteps.push({ number: 4, title: 'Availability' });
            baseSteps.push({ number: 5, title: 'Review' });
        } else {
            baseSteps.push({ number: 3, title: 'Review' });
        }
        return baseSteps;
    };

    const STEPS = getSteps();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleServiceTypeChange = (type) => {
        setFormData(prev => ({ ...prev, service_type: type }));
    };

    const updateSlot = (idx, field, value) => {
        setTimeSlots(prev => {
            const slots = [...prev];
            slots[idx] = { ...slots[idx], [field]: value };
            return slots;
        });
    };

    const handleNext = () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!formData.name || !formData.description || !formData.price || !formData.category) {
                setError('Please fill all required fields');
                return;
            }
            setError(null);
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        } else if (currentStep === 4) {
            setCurrentStep(5);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => prev - 1);
        setError(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            };

            // Setup data maps to `setup_data` JSONField for extra custom configs
            payload.setup_data = {
                duration_minutes: formData.duration_minutes,
                delay_minutes: formData.delay_minutes,
                break_minutes: formData.break_minutes,
                max_bookings_per_day: formData.max_bookings_per_day,
            };

            if (isSchedulingRequired) {
                payload.time_slots = timeSlots.filter(s => s.enabled).map(({ enabled, ...rest }) => rest);
            } else {
                payload.time_slots = [];
            }

            await shopService.createService(payload);
            setSuccess(true);
            setTimeout(() => navigate('/shop'), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create service. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-8 border-0 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <CheckCircle size={80} className="text-green-500" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Service Created!</h2>
                    <p className="text-gray-500">Your new service is live and ready for bookings.</p>
                </Card>
            </div>
        );
    }

    // Step logic mapping
    // Step 1: Type
    // Step 2: Info
    // Step 3: Scheduling (if req) OR Review (if not)
    // Step 4: Availability (if req)
    // Step 5: Review (if req)

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={() => navigate('/shop')} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={16} className="mr-1.5" /> Back to Shop
                    </button>
                    <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wide">
                        New Service
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 sm:p-10">
                        {/* Progress Stepper */}
                        <div className="flex items-center justify-center mb-10">
                            {STEPS.map((step, idx) => (
                                <React.Fragment key={step.number}>
                                    <div className="flex flex-col items-center relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep > idx + 1 ? 'bg-primary-600 text-white' : currentStep === idx + 1 ? 'bg-white border-2 border-primary-600 text-primary-600 shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                            {currentStep > idx + 1 ? <CheckCircle size={18} strokeWidth={3} /> : step.number}
                                        </div>
                                        <span className={`absolute -bottom-6 text-xs font-semibold whitespace-nowrap ${currentStep >= idx + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className="w-16 sm:w-24 h-1 bg-gray-100 mx-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-600 transition-all duration-500" style={{ width: currentStep > idx + 1 ? '100%' : '0%' }} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-in fade-in">
                                <AlertCircle size={20} className="shrink-0" /> {error}
                            </div>
                        )}

                        {/* Form Views */}
                        <div className="mt-12">
                            {/* STEP 1: SERVICE TYPE */}
                            {currentStep === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
                                    <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">What kind of service are you offering?</h3>
                                    <div className="space-y-4">
                                        {SERVICE_TYPES.map((type) => {
                                            const active = formData.service_type === type.value;
                                            return (
                                                <div 
                                                    key={type.value} 
                                                    onClick={() => handleServiceTypeChange(type.value)}
                                                    className={`cursor-pointer p-5 border-2 rounded-2xl flex items-center gap-5 transition-all duration-200 ${
                                                        active ? 'border-primary-600 bg-primary-50 shadow-md' : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className={`p-3 rounded-xl ${active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                        <type.icon size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-lg font-bold ${active ? 'text-primary-900' : 'text-gray-900'}`}>{type.label}</h4>
                                                        <p className={`text-sm mt-1 ${active ? 'text-primary-700' : 'text-gray-500'}`}>{type.desc}</p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary-600' : 'border-gray-300'}`}>
                                                            {active && <div className="w-3 h-3 bg-primary-600 rounded-full" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SERVICE INFO */}
                            {currentStep === 2 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Basic Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Name *</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                                placeholder="e.g. 1-on-1 Legal Consultation"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 font-medium transition-all" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                                                <select name="category" value={formData.category} onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 font-medium transition-all">
                                                    {SERVICE_CATEGORIES.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fixed Price ($) *</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                                    <input type="number" name="price" value={formData.price} onChange={handleChange} required
                                                        placeholder="50.00" step="0.01" min="0"
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 font-medium transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (comma-separated)</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                                <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                                                    placeholder="e.g. premium, quick, certified"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 font-medium transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                                            <textarea name="description" value={formData.description} onChange={handleChange} required
                                                rows={4} placeholder="Describe what the client will receive..."
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 font-medium transition-all resize-y" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 (If Scheduling) : SCHEDULING SETTINGS */}
                            {currentStep === 3 && isSchedulingRequired && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3"><Clock className="text-primary-600" /> Booking Constraints</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-primary-200 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-1">Session Duration</h4>
                                            <p className="text-sm text-gray-500 mb-4">How long each appointment takes</p>
                                            <div className="flex items-center gap-3">
                                                <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} min="15" step="15"
                                                    className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-center outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                                                <span className="text-gray-600 font-medium">Minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-primary-200 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-1">Advance Notice</h4>
                                            <p className="text-sm text-gray-500 mb-4">Minimum delay before a booking</p>
                                            <div className="flex items-center gap-3">
                                                <input type="number" name="delay_minutes" value={formData.delay_minutes} onChange={handleChange} min="0" step="15"
                                                    className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-center outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                                                <span className="text-gray-600 font-medium">Minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-primary-200 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-1">Buffer / Break</h4>
                                            <p className="text-sm text-gray-500 mb-4">Rest time required between slots</p>
                                            <div className="flex items-center gap-3">
                                                <input type="number" name="break_minutes" value={formData.break_minutes} onChange={handleChange} min="0" step="5"
                                                    className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-center outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                                                <span className="text-gray-600 font-medium">Minutes</span>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-primary-200 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-1">Daily Capacity</h4>
                                            <p className="text-sm text-gray-500 mb-4">Max appointments accepted per day</p>
                                            <div className="flex items-center gap-3">
                                                <input type="number" name="max_bookings_per_day" value={formData.max_bookings_per_day} onChange={handleChange} min="1"
                                                    className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-center outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                                                <span className="text-gray-600 font-medium">Slots</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: AVAILABILITY (If Scheduling) */}
                            {currentStep === 4 && isSchedulingRequired && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"><Calendar className="text-primary-600" /> Weekly Availability</h3>
                                    <p className="text-sm text-gray-500 mb-8">Define standard hours for bookings.</p>
                                    
                                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                                        {timeSlots.map((slot, idx) => (
                                            <div key={slot.day} className={`flex items-center p-4 sm:p-5 transition-colors ${slot.enabled ? 'bg-primary-50/30' : 'bg-gray-50/50'}`}>
                                                <label className="flex items-center gap-4 cursor-pointer min-w-[140px]">
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${slot.enabled ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                                                        {slot.enabled && <Check size={14} className="text-white shrink-0" />}
                                                    </div>
                                                    <input type="checkbox" checked={slot.enabled} onChange={(e) => updateSlot(idx, 'enabled', e.target.checked)} className="hidden" />
                                                    <span className={`font-bold capitalize ${slot.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{slot.day}</span>
                                                </label>
                                                
                                                <div className="flex-1 flex justify-end sm:justify-start">
                                                    {slot.enabled ? (
                                                        <div className="flex items-center gap-2 sm:gap-4">
                                                            <input type="time" value={slot.start_time} onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                                                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-sm outline-none focus:border-primary-500" />
                                                            <span className="text-gray-400 font-medium text-sm">to</span>
                                                            <input type="time" value={slot.end_time} onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                                                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-sm outline-none focus:border-primary-500" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-400 px-4">Unavailable</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FINAL STEP: REVIEW */}
                            {(currentStep === STEPS.length) && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Review your new service</h3>
                                    
                                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-2xl font-bold text-gray-900">{formData.name}</h4>
                                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                                        {SERVICE_CATEGORIES.find(c => c.value === formData.category)?.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium flex items-center gap-1.5 text-gray-500 mb-2">
                                                    <Briefcase size={14}/> {SERVICE_TYPES.find(t=>t.value===formData.service_type)?.label}
                                                </p>
                                                <p className="text-gray-600 leading-relaxed">{formData.description}</p>
                                            </div>
                                            <div className="shrink-0 text-left sm:text-right">
                                                <div className="text-3xl font-extrabold text-green-600">${formData.price}</div>
                                                <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">Fixed Quote</div>
                                            </div>
                                        </div>

                                        {isSchedulingRequired && (
                                            <>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                                                        <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Duration</span>
                                                        <span className="text-gray-900 font-extrabold text-lg">{formData.duration_minutes}m</span>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                                                        <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Advance</span>
                                                        <span className="text-gray-900 font-extrabold text-lg">{formData.delay_minutes}m</span>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                                                        <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Break</span>
                                                        <span className="text-gray-900 font-extrabold text-lg">{formData.break_minutes}m</span>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                                                        <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Max / Day</span>
                                                        <span className="text-gray-900 font-extrabold text-lg">{formData.max_bookings_per_day}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-gray-200">
                                                    <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Calendar size={16} className="text-primary-600"/> Available Hours
                                                    </h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {timeSlots.filter(s => s.enabled).map(s => (
                                                            <div key={s.day} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm flex items-center gap-2">
                                                                <span className="capitalize text-primary-700">{s.day.substring(0,3)}</span>
                                                                <span className="text-gray-300">|</span>
                                                                <span>{s.start_time} - {s.end_time}</span>
                                                            </div>
                                                        ))}
                                                        {timeSlots.filter(s => s.enabled).length === 0 && (
                                                            <span className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">No slots enabled! You won't receive bookings.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        {!isSchedulingRequired && (
                                            <div className="pt-6 border-t border-gray-200">
                                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm font-medium">
                                                    <AlertCircle className="shrink-0 w-5 h-5 text-blue-600" />
                                                    <p>This service does not require time slots. Clients will purchase the service and you will deliver the results directly to them.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 relative z-20">
                            {currentStep > 1 ? (
                                <button type="button" onClick={handlePrevious} className="text-gray-500 hover:text-gray-900 font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center">
                                    <ChevronLeft size={18} className="mr-1" /> Back
                                </button>
                            ) : <div></div>}
                            
                            {currentStep < STEPS.length ? (
                                <Button onClick={handleNext} className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md">
                                    Continue <ChevronRight size={18} />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-200 transition-all transform hover:scale-105">
                                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={18} /> Publish Service</>}
                                </Button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateService;
