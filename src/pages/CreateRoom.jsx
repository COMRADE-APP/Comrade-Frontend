import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Lock, Globe, Image as ImageIcon, Save, Send, X,
    MessageSquare, Shield, UserPlus, Forward, Bell, ChevronDown, ChevronUp,
    CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Hash, Brush
} from 'lucide-react';
import api from '../services/api';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';

const STEPS = [
    { number: 1, title: 'Identity' },
    { number: 2, title: 'Appearance' },
    { number: 3, title: 'Settings' },
    { number: 4, title: 'Review' }
];

const CreateRoom = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        room_type: 'public',
        operation_state: 'active',
        tags: '',
    });

    const [settings, setSettings] = useState({
        chat_enabled: true,
        chat_permission: 'all_members',
        who_can_add_members: 'admins_only',
        who_can_edit_info: 'admins_only',
        who_can_send_media: 'all_members',
        allow_opinion_tagging: true,
        allow_message_forwarding: true,
        show_forward_source: true,
        is_discoverable: true,
        require_approval_to_join: false,
    });

    const permissionOptions = [
        { value: 'all_members', label: 'All Members' },
        { value: 'admins_moderators', label: 'Admins & Moderators' },
        { value: 'admins_only', label: 'Admins Only' },
    ];

    const nextStep = () => {
        setError(null);
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setError("Room Name is required");
                return;
            }
        }
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setError(null);
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async (action) => {
        setLoading(true);
        setError(null);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            if (avatar) submitData.append('avatar', avatar);
            if (coverImage) submitData.append('cover_image', coverImage);
            submitData.append('operation_state', action === 'draft' ? 'dormant' : 'active');

            const response = await api.post('/api/rooms/rooms/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const roomId = response.data.id;

            // Apply settings
            try {
                await api.patch(`/api/rooms/rooms/${roomId}/room_settings/`, settings);
            } catch (settingsError) {
                console.warn('Settings apply failed, using defaults:', settingsError);
            }

            alert(action === 'draft' ? 'Room saved as draft!' : 'Room created successfully!');
            navigate(`/rooms/${roomId}`);
        } catch (error) {
            console.error('Failed to create room:', error);
            setError(error.response?.data?.detail || 'Failed to create room');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/rooms')}
                        className="mb-4 text-gray-500 hover:text-gray-900"
                    >
                        <ChevronLeft size={20} className="mr-2" /> Back to Rooms
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                        <MessageSquare className="text-pink-600" />
                        Create Room
                    </h1>
                    <p className="text-gray-500 mt-2">Build a space for discussion, collaboration, and community.</p>
                </div>

                <Card>
                    <CardBody>
                        {/* Progress Bar */}
                        <div className="flex justify-between mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-pink-600 -z-0 -translate-y-1/2 transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                            ></div>

                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className="flex flex-col items-center relative z-10 px-2 group cursor-pointer"
                                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 ${currentStep >= step.number
                                            ? 'bg-pink-600 text-white border-pink-600'
                                            : 'bg-white text-gray-400 border-gray-300 group-hover:border-pink-300'
                                        }`}>
                                        {currentStep > step.number ? <CheckCircle size={16} /> : step.number}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-pink-600' : 'text-gray-500'
                                        }`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="mt-6 min-h-[300px]">
                            {/* STEP 1: Identity */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
                                            placeholder="Enter room name"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-y"
                                            placeholder="What is this room about?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.tags}
                                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
                                                placeholder="tech, music, gaming (comma separated)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Appearance */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        {/* Avatar */}
                                        <div className="w-full md:w-auto flex flex-col items-center">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Room Avatar</label>
                                            <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 hover:border-pink-500 transition-colors overflow-hidden group bg-gray-50 flex items-center justify-center">
                                                {avatar ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={URL.createObjectURL(avatar)} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setAvatar(null)}
                                                            className="absolute top-0 right-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                        >
                                                            <X size={24} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-pink-600">
                                                        <MessageSquare className="w-8 h-8 mb-2" />
                                                        <span className="text-xs font-medium">Upload Icon</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cover Image */}
                                        <div className="flex-1 w-full">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
                                            <div className="relative w-full h-48 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-500 transition-colors overflow-hidden group bg-gray-50 flex items-center justify-center">
                                                {coverImage ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={URL.createObjectURL(coverImage)} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setCoverImage(null)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-pink-600">
                                                        <ImageIcon className="w-10 h-10 mb-2" />
                                                        <span className="text-sm font-medium">Upload Cover Image</span>
                                                        <p className="text-xs text-gray-400 mt-1">Recommended: 1200x400px</p>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Settings */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.room_type === 'public'
                                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                                    : 'border-gray-200 hover:border-green-200'
                                                }`}>
                                                <input type="radio" name="room_type" value="public" checked={formData.room_type === 'public'} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })} className="mt-1" />
                                                <div>
                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                        <Globe size={18} className="text-green-600" /> Public Room
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">Anyone can find and join this room.</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.room_type === 'private'
                                                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                                    : 'border-gray-200 hover:border-orange-200'
                                                }`}>
                                                <input type="radio" name="room_type" value="private" checked={formData.room_type === 'private'} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })} className="mt-1" />
                                                <div>
                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                        <Lock size={18} className="text-orange-600" /> Private Room
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">Only invited members can join.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-white border boundary-gray-200 rounded-xl overflow-hidden">
                                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium flex items-center gap-2 text-gray-900">
                                            <Shield size={18} /> Permissions & Controls
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1">Who can send messages</label>
                                                    <select
                                                        value={settings.chat_permission}
                                                        onChange={(e) => setSettings({ ...settings, chat_permission: e.target.value })}
                                                        className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-gray-50/50"
                                                    >
                                                        {permissionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1">Who can send media</label>
                                                    <select
                                                        value={settings.who_can_send_media}
                                                        onChange={(e) => setSettings({ ...settings, who_can_send_media: e.target.value })}
                                                        className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-gray-50/50"
                                                    >
                                                        {permissionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1">Who can add members</label>
                                                    <select
                                                        value={settings.who_can_add_members}
                                                        onChange={(e) => setSettings({ ...settings, who_can_add_members: e.target.value })}
                                                        className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-gray-50/50"
                                                    >
                                                        {permissionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1">Who can edit info</label>
                                                    <select
                                                        value={settings.who_can_edit_info}
                                                        onChange={(e) => setSettings({ ...settings, who_can_edit_info: e.target.value })}
                                                        className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-gray-50/50"
                                                    >
                                                        {permissionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 my-2"></div>

                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <span className="text-sm text-gray-700">Require approval to join</span>
                                                    <input type="checkbox" checked={settings.require_approval_to_join} onChange={(e) => setSettings({ ...settings, require_approval_to_join: e.target.checked })} className="accent-pink-600 w-4 h-4" />
                                                </label>
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <span className="text-sm text-gray-700">Allow message forwarding</span>
                                                    <input type="checkbox" checked={settings.allow_message_forwarding} onChange={(e) => setSettings({ ...settings, allow_message_forwarding: e.target.checked })} className="accent-pink-600 w-4 h-4" />
                                                </label>
                                                <label className="flex items-center justify-between cursor-pointer">
                                                    <span className="text-sm text-gray-700">Room is discoverable</span>
                                                    <input type="checkbox" checked={settings.is_discoverable} onChange={(e) => setSettings({ ...settings, is_discoverable: e.target.checked })} className="accent-pink-600 w-4 h-4" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        {/* Cover Preview */}
                                        <div className="h-32 bg-gray-100 w-full relative">
                                            {coverImage ? (
                                                <img src={URL.createObjectURL(coverImage)} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-6 pb-6 relative">
                                            {/* Avatar Preview */}
                                            <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md absolute -top-10 left-6 overflow-hidden flex items-center justify-center">
                                                {avatar ? (
                                                    <img src={URL.createObjectURL(avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-xl">
                                                        {formData.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-12">
                                                <h3 className="text-2xl font-bold text-gray-900">{formData.name}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        {formData.room_type === 'public' ? <Globe size={14} className="text-green-500" /> : <Lock size={14} className="text-orange-500" />}
                                                        {formData.room_type === 'public' ? 'Public' : 'Private'} Group
                                                    </span>
                                                    <span>•</span>
                                                    <span>{settings.chat_enabled ? 'Chat Enabled' : 'Announcements Only'}</span>
                                                </div>

                                                <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                                                    {formData.description || <span className="text-gray-400 italic">No description provided.</span>}
                                                </p>

                                                {formData.tags && (
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {formData.tags.split(',').map((tag, i) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                                #{tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 flex items-start gap-3">
                                        <Bell className="text-pink-600 mt-0.5 shrink-0" size={18} />
                                        <div className="text-sm text-pink-800">
                                            You will be the <strong>Owner & Admin</strong> of this room. You can invite people and change settings at any time after creation.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <Button
                                variant="secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                <ChevronLeft size={18} className="mr-1" />
                                {currentStep === 1 ? 'Cancel' : 'Previous'}
                            </Button>

                            <div className="ml-auto flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <Button variant="primary" onClick={nextStep} className="bg-pink-600 hover:bg-pink-700 text-white border-transparent">
                                        Next <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading} className="border-gray-300 text-gray-700">
                                            <Save size={18} className="mr-2" /> Save Draft
                                        </Button>
                                        <Button variant="primary" onClick={() => handleSubmit('publish')} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white border-transparent">
                                            <Send size={18} className="mr-2" /> Create Room
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default CreateRoom;
