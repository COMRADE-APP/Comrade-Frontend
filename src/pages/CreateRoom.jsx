import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Lock, Globe, Image as ImageIcon, Save, Send, X,
    MessageSquare, Shield, UserPlus, Forward, Bell, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

const CreateRoom = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        room_type: 'public',
        operation_state: 'active',
        tags: '',
    });

    // Initial room settings (WhatsApp-like)
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

    const handleSubmit = async (action) => {
        setConfirmAction(action);
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmation(false);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            // Add avatar and cover image with correct field names
            if (avatar) {
                submitData.append('avatar', avatar);
            }
            if (coverImage) {
                submitData.append('cover_image', coverImage);
            }

            submitData.append('operation_state', confirmAction === 'draft' ? 'dormant' : 'active');

            // Create the room
            const response = await api.post('/api/rooms/rooms/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const roomId = response.data.id;

            // Apply initial settings
            try {
                await api.patch(`/api/rooms/rooms/${roomId}/room_settings/`, settings);
            } catch (settingsError) {
                console.log('Settings will use defaults:', settingsError);
            }

            alert(confirmAction === 'draft' ? 'Room saved as draft!' : 'Room created successfully! You are now the admin.');
            navigate(`/rooms/${roomId}`);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert(error.response?.data?.detail || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const permissionOptions = [
        { value: 'all_members', label: 'All Members' },
        { value: 'admins_moderators', label: 'Admins & Moderators' },
        { value: 'admins_only', label: 'Admins Only' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/rooms')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create Room</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* Avatar and Cover Image */}
                    <div className="mb-6 flex gap-6">
                        {/* Room Avatar */}
                        <div className="flex-shrink-0">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Room Avatar</label>
                            <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors overflow-hidden">
                                {avatar ? (
                                    <>
                                        <img src={URL.createObjectURL(avatar)} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setAvatar(null)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow"
                                        >
                                            <X size={12} />
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-primary-500">
                                        <MessageSquare className="w-8 h-8 mb-1" />
                                        <span className="text-xs">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0])} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-500 transition-colors h-24 flex items-center justify-center">
                                {coverImage ? (
                                    <div className="relative w-full h-full">
                                        <img src={URL.createObjectURL(coverImage)} alt="" className="h-full mx-auto rounded-lg object-cover" />
                                        <button onClick={() => setCoverImage(null)} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer text-gray-400 hover:text-primary-500 flex items-center gap-2">
                                        <ImageIcon className="w-6 h-6" />
                                        <span>Upload cover image</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0])} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Enter room name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Describe the room..."
                        />
                    </div>

                    {/* Room Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                <input type="radio" name="room_type" value="public" checked={formData.room_type === 'public'} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })} />
                                <Globe size={20} className="text-green-500" />
                                <div>
                                    <p className="font-medium">Public</p>
                                    <p className="text-xs text-gray-500">Anyone can join</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                <input type="radio" name="room_type" value="private" checked={formData.room_type === 'private'} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })} />
                                <Lock size={20} className="text-orange-500" />
                                <div>
                                    <p className="font-medium">Private</p>
                                    <p className="text-xs text-gray-500">Invite only</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="e.g., tech, study, networking"
                        />
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <Shield size={18} />
                            Advanced Settings
                            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>

                    {/* Advanced Settings Panel */}
                    {showAdvanced && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                <MessageSquare size={18} /> Chat Settings
                            </h3>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Enable Chat</span>
                                <input
                                    type="checkbox"
                                    checked={settings.chat_enabled}
                                    onChange={(e) => setSettings({ ...settings, chat_enabled: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>

                            <div className="py-2">
                                <label className="block text-sm text-gray-700 mb-1">Who can send messages</label>
                                <select
                                    value={settings.chat_permission}
                                    onChange={(e) => setSettings({ ...settings, chat_permission: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    {permissionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="py-2">
                                <label className="block text-sm text-gray-700 mb-1">Who can send media</label>
                                <select
                                    value={settings.who_can_send_media}
                                    onChange={(e) => setSettings({ ...settings, who_can_send_media: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    {permissionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <hr className="border-gray-200" />

                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                <UserPlus size={18} /> Member Permissions
                            </h3>

                            <div className="py-2">
                                <label className="block text-sm text-gray-700 mb-1">Who can add members</label>
                                <select
                                    value={settings.who_can_add_members}
                                    onChange={(e) => setSettings({ ...settings, who_can_add_members: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    {permissionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="py-2">
                                <label className="block text-sm text-gray-700 mb-1">Who can edit room info</label>
                                <select
                                    value={settings.who_can_edit_info}
                                    onChange={(e) => setSettings({ ...settings, who_can_edit_info: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    {permissionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Require approval to join</span>
                                <input
                                    type="checkbox"
                                    checked={settings.require_approval_to_join}
                                    onChange={(e) => setSettings({ ...settings, require_approval_to_join: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>

                            <hr className="border-gray-200" />

                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                <Forward size={18} /> Sharing & Forwarding
                            </h3>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Allow opinion tagging</span>
                                <input
                                    type="checkbox"
                                    checked={settings.allow_opinion_tagging}
                                    onChange={(e) => setSettings({ ...settings, allow_opinion_tagging: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Allow message forwarding</span>
                                <input
                                    type="checkbox"
                                    checked={settings.allow_message_forwarding}
                                    onChange={(e) => setSettings({ ...settings, allow_message_forwarding: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Show forward source</span>
                                <input
                                    type="checkbox"
                                    checked={settings.show_forward_source}
                                    onChange={(e) => setSettings({ ...settings, show_forward_source: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>

                            <label className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-700">Room is discoverable</span>
                                <input
                                    type="checkbox"
                                    checked={settings.is_discoverable}
                                    onChange={(e) => setSettings({ ...settings, is_discoverable: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                            </label>
                        </div>
                    )}

                    {/* Info box */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> You will automatically become the admin of this room.
                            As admin, you can manage members, settings, and content.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end border-t pt-6">
                        <button onClick={() => navigate('/rooms')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => handleSubmit('publish')} disabled={loading || !formData.name} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                            <Send size={18} /> Create Room
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {confirmAction === 'draft' ? '💾 Save as Draft?' : '🏠 Create Room?'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {confirmAction === 'draft'
                                ? 'Your room will be saved as dormant. You can activate it later.'
                                : 'Your room will be created and you will become the admin. Members can join based on your settings.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                            <button onClick={confirmSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateRoom;
