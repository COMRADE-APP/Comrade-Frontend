import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import {
    MessageSquare, Users, Settings, ArrowLeft, Send, Paperclip,
    UserPlus, UserMinus, Shield, Crown, MoreVertical, X, Bell, BellOff
} from 'lucide-react';
import roomsService from '../services/rooms.service';
import { formatTimeAgo } from '../utils/dateFormatter';
import { ROUTES } from '../constants/routes';

const RoomDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [showMembersPanel, setShowMembersPanel] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Check user role in room
    const isAdmin = room?.admins?.some(a => a.id === user?.id);
    const isModerator = room?.moderators?.some(m => m.id === user?.id);
    const isMember = room?.members?.some(m => m.id === user?.id);
    const canManage = isAdmin || isModerator;

    useEffect(() => {
        if (id) {
            loadRoomData();
        }
    }, [id]);

    const loadRoomData = async () => {
        setLoading(true);
        try {
            const [roomData, messagesData, membersData] = await Promise.all([
                roomsService.getById(id),
                roomsService.getMessages(id).catch(() => []),
                roomsService.getMembers ? roomsService.getMembers(id).catch(() => []) : Promise.resolve([]),
            ]);
            setRoom(roomData);
            setMessages(Array.isArray(messagesData) ? messagesData : messagesData?.results || []);
            setMembers(Array.isArray(membersData) ? membersData : membersData?.results || roomData?.members || []);
        } catch (error) {
            console.error('Error loading room:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await roomsService.sendMessage?.(id, { content: newMessage });
            setNewMessage('');
            loadRoomData(); // Refresh messages
        } catch (error) {
            console.error('Failed to send message:', error);
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
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(ROUTES.ROOMS)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary-600" />
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
                        onClick={() => setShowMembersPanel(!showMembersPanel)}
                        className={`p-2 rounded-lg transition-colors ${showMembersPanel ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                    >
                        <Users className="w-5 h-5" />
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
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
                                    isOwn={message.sender?.id === user?.id}
                                />
                            ))
                        )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
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
                            <Button variant="primary" type="submit" disabled={!newMessage.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
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
                        <div className="p-4 space-y-3">
                            {/* Admins */}
                            {room.admins?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Admins</h4>
                                    {room.admins.map((admin) => (
                                        <MemberItem key={admin.id} member={admin} role="admin" />
                                    ))}
                                </div>
                            )}
                            {/* Moderators */}
                            {room.moderators?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Moderators</h4>
                                    {room.moderators.map((mod) => (
                                        <MemberItem key={mod.id} member={mod} role="moderator" />
                                    ))}
                                </div>
                            )}
                            {/* Members */}
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Members</h4>
                                {(members.length > 0 ? members : room.members || []).map((member) => (
                                    <MemberItem key={member.id} member={member} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Panel */}
                {showSettings && canManage && (
                    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Room Settings</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                <p className="text-gray-900">{room.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <p className="text-gray-600 text-sm">{room.description || 'No description'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{room.room_code}</code>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Code</label>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{room.invitation_code}</code>
                            </div>
                            <hr className="border-gray-200" />
                            <Button variant="outline" className="w-full" onClick={handleLeaveRoom}>
                                Leave Room
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
            {!isOwn && (
                <p className="text-xs text-gray-500 mb-1">
                    {message.sender?.first_name || 'Unknown'}
                </p>
            )}
            <div
                className={`px-4 py-2 rounded-2xl ${isOwn
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }`}
            >
                <p>{message.content}</p>
            </div>
            <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                {formatTimeAgo(message.time_stamp || message.created_at)}
            </p>
        </div>
    </div>
);

const MemberItem = ({ member, role }) => (
    <div className="flex items-center gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {member.first_name?.[0]}{member.last_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
                {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
        {role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
        {role === 'moderator' && <Shield className="w-4 h-4 text-blue-500" />}
    </div>
);

export default RoomDetail;
