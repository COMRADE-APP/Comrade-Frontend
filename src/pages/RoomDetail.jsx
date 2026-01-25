import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    MessageSquare, Users, Settings, ArrowLeft, Send, Paperclip, Image, File, Mic,
    UserPlus, UserMinus, Shield, Crown, MoreVertical, X, Bell, BellOff, Check, CheckCheck,
    Forward, Reply, Trash2, Calendar, ClipboardList, BookOpen, Megaphone, ChevronDown,
    Eye, UserCheck, AlertCircle, Download
} from 'lucide-react';
import roomsService from '../services/rooms.service';
import { formatTimeAgo } from '../utils/dateFormatter';
import { ROUTES } from '../constants/routes';

// Message status tick component
const MessageTicks = ({ status, isOwn }) => {
    if (!isOwn) return null;

    const getTickColor = () => {
        switch (status) {
            case 'read': return 'text-blue-500';
            case 'delivered': return 'text-gray-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <span className={`ml-1 ${getTickColor()}`}>
            {status === 'pending' ? (
                <Check className="w-3 h-3 inline" />
            ) : (
                <CheckCheck className="w-3.5 h-3.5 inline" />
            )}
        </span>
    );
};

// Forwarded message indicator
const ForwardedIndicator = ({ message }) => {
    if (!message.is_forwarded) return null;

    return (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 italic">
            <Forward className="w-3 h-3" />
            {message.forwarded_from_room_name ? (
                <span>Forwarded from <Link to={`/rooms/${message.forwarded_from_room}`} className="text-primary-600 hover:underline">{message.forwarded_from_room_name}</Link></span>
            ) : (
                <span>Forwarded</span>
            )}
        </div>
    );
};

// Reply preview component
const ReplyPreview = ({ replyTo, onClear }) => {
    if (!replyTo) return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-l-4 border-primary-500">
            <Reply className="w-4 h-4 text-gray-500" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary-600">{replyTo.sender_name}</p>
                <p className="text-sm text-gray-600 truncate">{replyTo.content}</p>
            </div>
            <button onClick={onClear} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Enhanced Message Bubble with WhatsApp-like features
const MessageBubble = ({ message, isOwn, onReply, onForward, onDelete, canDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const bubbleClass = isOwn
        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md ml-auto'
        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md';

    const timeClass = isOwn ? 'text-primary-100' : 'text-gray-400';

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            {/* Avatar for other users */}
            {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mr-2 overflow-hidden">
                    {message.sender_avatar ? (
                        <img src={message.sender_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600">
                            {message.sender_info?.first_name?.[0]}{message.sender_info?.last_name?.[0]}
                        </div>
                    )}
                </div>
            )}

            <div className={`max-w-[70%] relative`}>
                {/* Sender name for group chat */}
                {!isOwn && (
                    <p className="text-xs font-medium text-primary-600 mb-1">
                        {message.sender_info?.first_name} {message.sender_info?.last_name}
                    </p>
                )}

                {/* Forwarded indicator */}
                <ForwardedIndicator message={message} />

                {/* Reply preview */}
                {message.reply_to_preview && (
                    <div className="px-2 py-1 mb-1 rounded bg-black/10 border-l-2 border-primary-300">
                        <p className="text-xs font-medium">{message.reply_to_preview.sender_name}</p>
                        <p className="text-xs opacity-80 truncate">{message.reply_to_preview.content}</p>
                    </div>
                )}

                {/* Message content */}
                <div className={`px-4 py-2 rounded-2xl shadow-sm ${bubbleClass}`}>
                    {/* File attachments - inline preview for images/videos */}
                    {message.files && message.files.length > 0 && (
                        <div className="mb-2 space-y-2">
                            {message.files.map((file, idx) => {
                                if (file.file_type === 'image') {
                                    return (
                                        <div key={idx} className="relative group/img cursor-pointer" onClick={() => window.openMediaModal && window.openMediaModal(file)}>
                                            <img
                                                src={file.file}
                                                alt={file.file_name}
                                                className="max-w-full rounded-lg max-h-64 object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                <Eye className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    );
                                } else if (file.file_type === 'video') {
                                    return (
                                        <div key={idx} className="relative">
                                            <video
                                                src={file.file}
                                                controls
                                                className="max-w-full rounded-lg max-h-64"
                                                preload="metadata"
                                            />
                                        </div>
                                    );
                                } else if (file.file_type === 'audio') {
                                    return (
                                        <div key={idx} className={`p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-gray-100'}`}>
                                            <audio src={file.file} controls className="w-full" />
                                            <p className="text-xs mt-1 opacity-70">{file.file_name}</p>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <a key={idx} href={file.file} target="_blank" rel="noopener noreferrer"
                                            className={`flex items-center gap-2 p-2 rounded ${isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                                            <File className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm truncate flex-1">{file.file_name}</span>
                                            <Download className="w-4 h-4 flex-shrink-0" />
                                        </a>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {/* Text content */}
                    {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

                    {/* Entity references */}
                    {message.event && (
                        <div className={`mt-2 p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-primary-50'} flex items-center gap-2`}>
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Event shared</span>
                        </div>
                    )}
                    {message.task && (
                        <div className={`mt-2 p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-primary-50'} flex items-center gap-2`}>
                            <ClipboardList className="w-4 h-4" />
                            <span className="text-sm">Task shared</span>
                        </div>
                    )}
                    {message.resource && (
                        <div className={`mt-2 p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-primary-50'} flex items-center gap-2`}>
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm">Resource shared</span>
                        </div>
                    )}
                    {message.announcement && (
                        <div className={`mt-2 p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-primary-50'} flex items-center gap-2`}>
                            <Megaphone className="w-4 h-4" />
                            <span className="text-sm">Announcement shared</span>
                        </div>
                    )}

                    {/* Time and status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${timeClass}`}>
                        <span>{formatTimeAgo(message.created_at)}</span>
                        <MessageTicks status={message.status} isOwn={isOwn} />
                    </div>
                </div>

                {/* Message actions dropdown */}
                <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {showMenu && (
                            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                <button
                                    onClick={() => { onReply(message); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <Reply className="w-4 h-4" /> Reply
                                </button>
                                <button
                                    onClick={() => { onForward(message); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <Forward className="w-4 h-4" /> Forward
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={() => { onDelete(message.id); setShowMenu(false); }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

// Member Item with follow button
const MemberItem = ({ member, role, roomId, currentUserId, onFollow }) => {
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);
        try {
            await onFollow(member.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {member.first_name} {member.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
                {role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                {role === 'moderator' && <Shield className="w-4 h-4 text-blue-500" />}
                {member.id !== currentUserId && (
                    <button
                        onClick={handleFollow}
                        disabled={loading}
                        className={`p-1.5 rounded-full transition-colors ${member.is_following ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                    >
                        {member.is_following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// Settings Panel Component
const SettingsPanel = ({ settings, onUpdate, isAdmin, onClose }) => {
    const [localSettings, setLocalSettings] = useState(settings || {});
    const [saving, setSaving] = useState(false);

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(localSettings);
        } finally {
            setSaving(false);
        }
    };

    const selectOptions = [
        { value: 'all_members', label: 'All Members' },
        { value: 'admins_moderators', label: 'Admins & Moderators' },
        { value: 'admins_only', label: 'Admins Only' },
    ];

    return (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Room Settings</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-5">
                {/* Chat Settings */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Chat Settings</h4>

                    <label className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Enable Chat</span>
                        <input
                            type="checkbox"
                            checked={localSettings.chat_enabled ?? true}
                            onChange={(e) => handleChange('chat_enabled', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded"
                            disabled={!isAdmin}
                        />
                    </label>

                    <div className="py-2">
                        <label className="block text-sm text-gray-700 mb-1">Who can send messages</label>
                        <select
                            value={localSettings.chat_permission || 'all_members'}
                            onChange={(e) => handleChange('chat_permission', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={!isAdmin}
                        >
                            {selectOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="py-2">
                        <label className="block text-sm text-gray-700 mb-1">Who can send media</label>
                        <select
                            value={localSettings.who_can_send_media || 'all_members'}
                            onChange={(e) => handleChange('who_can_send_media', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={!isAdmin}
                        >
                            {selectOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Member Settings */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Member Permissions</h4>

                    <div className="py-2">
                        <label className="block text-sm text-gray-700 mb-1">Who can add members</label>
                        <select
                            value={localSettings.who_can_add_members || 'admins_only'}
                            onChange={(e) => handleChange('who_can_add_members', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={!isAdmin}
                        >
                            {selectOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="py-2">
                        <label className="block text-sm text-gray-700 mb-1">Who can edit room info</label>
                        <select
                            value={localSettings.who_can_edit_info || 'admins_only'}
                            onChange={(e) => handleChange('who_can_edit_info', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={!isAdmin}
                        >
                            {selectOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tagging & Forwarding */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Tagging & Forwarding</h4>

                    <label className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Allow opinion tagging</span>
                        <input
                            type="checkbox"
                            checked={localSettings.allow_opinion_tagging ?? true}
                            onChange={(e) => handleChange('allow_opinion_tagging', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded"
                            disabled={!isAdmin}
                        />
                    </label>

                    <label className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Allow message forwarding</span>
                        <input
                            type="checkbox"
                            checked={localSettings.allow_message_forwarding ?? true}
                            onChange={(e) => handleChange('allow_message_forwarding', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded"
                            disabled={!isAdmin}
                        />
                    </label>

                    <label className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Show forward source</span>
                        <input
                            type="checkbox"
                            checked={localSettings.show_forward_source ?? true}
                            onChange={(e) => handleChange('show_forward_source', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded"
                            disabled={!isAdmin}
                        />
                    </label>
                </div>

                {isAdmin && (
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                )}
            </div>
        </div>
    );
};

// Content Section tabs
const ContentTabs = ({ room, activeTab, onTabChange }) => {
    const tabs = [
        { id: 'chat', label: 'Chat', icon: MessageSquare, count: null },
        { id: 'resources', label: 'Resources', icon: BookOpen, count: room?.resources?.length || 0 },
        { id: 'events', label: 'Events', icon: Calendar, count: room?.events?.length || 0 },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, count: room?.tasks?.length || 0 },
        { id: 'announcements', label: 'Announcements', icon: Megaphone, count: room?.announcements?.length || 0 },
    ];

    return (
        <div className="flex gap-1 p-2 bg-gray-100 overflow-x-auto">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:bg-white/50'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                            <span className="text-xs bg-gray-200 px-1.5 rounded-full">{tab.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// Main RoomDetail Component
const RoomDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [showMembersPanel, setShowMembersPanel] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [messageFilter, setMessageFilter] = useState(null);

    // Check user role in room
    const isAdmin = room?.admins?.some(a => a.id === user?.id);
    const isModerator = room?.moderators?.some(m => m.id === user?.id);
    const isMember = room?.members?.some(m => m.id === user?.id);
    const canManage = isAdmin || isModerator;

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (id) {
            loadRoomData();
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!id || activeTab !== 'chat') return;

        const interval = setInterval(() => {
            loadChats();
        }, 3000);

        return () => clearInterval(interval);
    }, [id, activeTab, messageFilter]);

    const loadRoomData = async () => {
        setLoading(true);
        try {
            const [roomData, membersData, settingsData] = await Promise.all([
                roomsService.getById(id),
                roomsService.getMembersDetail(id).catch(() => []),
                roomsService.getSettings(id).catch(() => ({})),
            ]);
            setRoom(roomData);
            setMembers(Array.isArray(membersData) ? membersData : []);
            setSettings(settingsData);

            // Load chats
            await loadChats();
        } catch (error) {
            console.error('Error loading room:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChats = async () => {
        try {
            const filters = messageFilter ? { type: messageFilter } : {};
            const chatsData = await roomsService.getChats(id, filters);
            setMessages(Array.isArray(chatsData) ? chatsData : chatsData?.results || []);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && selectedFiles.length === 0) return;

        try {
            await roomsService.sendChat(id, {
                content: newMessage,
                files: selectedFiles,
                reply_to: replyTo?.id,
            });
            setNewMessage('');
            setSelectedFiles([]);
            setReplyTo(null);
            await loadChats();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleReply = (message) => {
        setReplyTo({
            id: message.id,
            content: message.content,
            sender_name: `${message.sender_info?.first_name} ${message.sender_info?.last_name}`
        });
    };

    const handleForward = async (message) => {
        // TODO: Show room picker modal
        const targetRoomId = prompt('Enter target room ID:');
        if (targetRoomId) {
            try {
                await roomsService.forwardChat(id, message.id, targetRoomId);
                alert('Message forwarded!');
            } catch (error) {
                console.error('Failed to forward message:', error);
            }
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return;
        try {
            await roomsService.deleteChat(id, messageId);
            await loadChats();
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleFollowMember = async (userId) => {
        try {
            const result = await roomsService.followMember(id, userId);
            // Update member list
            setMembers(prev => prev.map(m =>
                m.id === userId ? { ...m, is_following: result.is_following } : m
            ));
        } catch (error) {
            console.error('Failed to follow/unfollow:', error);
        }
    };

    const handleUpdateSettings = async (newSettings) => {
        try {
            const updated = await roomsService.updateSettings(id, newSettings);
            setSettings(updated);
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    const handleLeaveRoom = async () => {
        if (!confirm('Are you sure you want to leave this room?')) return;
        try {
            await roomsService.leaveRoom(id);
            navigate(ROUTES.ROOMS);
        } catch (error) {
            alert('Failed to leave room');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!room) {
        return (
            <Card>
                <CardBody className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Room not found</p>
                    <Button variant="outline" onClick={() => navigate(ROUTES.ROOMS)} className="mt-4">
                        Back to Rooms
                    </Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(ROUTES.ROOMS)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden">
                        {room.avatar ? (
                            <img src={room.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <MessageSquare className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900">{room.name}</h1>
                        <p className="text-sm text-gray-500">
                            {members.length || room.members?.length || 0} members
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowMembersPanel(!showMembersPanel); setShowSettings(false); }}
                        className={`p-2 rounded-lg transition-colors ${showMembersPanel ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                    >
                        <Users className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setShowSettings(!showSettings); setShowMembersPanel(false); }}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            <ContentTabs room={room} activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat/Content Area */}
                <div className="flex-1 flex flex-col">
                    {activeTab === 'chat' ? (
                        <>
                            {/* Message Filter */}
                            <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Filter:</span>
                                {['all', 'text', 'file', 'event', 'task'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setMessageFilter(filter === 'all' ? null : filter)}
                                        className={`px-2 py-1 text-xs rounded ${(filter === 'all' && !messageFilter) || messageFilter === filter
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwn={message.is_own || message.sender === user?.id}
                                            onReply={handleReply}
                                            onForward={handleForward}
                                            onDelete={handleDeleteMessage}
                                            canDelete={message.sender === user?.id || isAdmin}
                                        />
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Preview */}
                            {replyTo && <ReplyPreview replyTo={replyTo} onClear={() => setReplyTo(null)} />}

                            {/* Selected Files Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="px-4 py-2 bg-gray-100 flex flex-wrap gap-2">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white px-2 py-1 rounded text-sm">
                                            <File className="w-4 h-4" />
                                            <span className="truncate max-w-[100px]">{file.name}</span>
                                            <button
                                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        multiple
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                    <Button variant="primary" type="submit" disabled={!newMessage.trim() && selectedFiles.length === 0}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Other content tabs placeholder */
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Content for "{activeTab}" coming soon</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Members Panel */}
                {showMembersPanel && (
                    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Members</h3>
                            <button
                                onClick={() => setShowMembersPanel(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 space-y-1">
                            {members.map((member) => (
                                <MemberItem
                                    key={member.id}
                                    member={member}
                                    role={member.role}
                                    roomId={id}
                                    currentUserId={user?.id}
                                    onFollow={handleFollowMember}
                                />
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <Button variant="outline" className="w-full" onClick={handleLeaveRoom}>
                                Leave Room
                            </Button>
                        </div>
                    </div>
                )}

                {/* Settings Panel */}
                {showSettings && (
                    <SettingsPanel
                        settings={settings}
                        onUpdate={handleUpdateSettings}
                        isAdmin={isAdmin}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default RoomDetail;
