import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import TypingIndicator from '../components/common/TypingIndicator';
import {
    MessageCircle, Send, Paperclip, Search, Plus, X, User, Lock,
    ChevronLeft, Check, CheckCheck, Image as ImageIcon, Users,
    Smile, Mic, MicOff, PlayCircle, Pause, Inbox, UserPlus
} from 'lucide-react';
import messagesService from '../services/messages.service';
import opinionsService from '../services/opinions.service';
import roomsService from '../services/rooms.service';
import { formatTimeAgo } from '../utils/dateFormatter';

// Common emojis for picker
const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😢', '😡', '🔥', '❤️', '👍', '👎', '🎉', '💯', '✨', '🙏', '👀', '💬', '🙂', '😎', '🤝'];

const Messages = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('chats'); // chats, requests, circles
    const [conversations, setConversations] = useState([]);
    const [circles, setCircles] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const lastTypingRef = useRef(0);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            // Mark as read
            messagesService.markRead(selectedConversation.id).catch(() => { });
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages and typing (Real-time feel)
    useEffect(() => {
        if (!selectedConversation) return;

        const interval = setInterval(() => {
            loadMessages(selectedConversation.id, false);
        }, 1000);

        // Poll for typing users
        const typingInterval = setInterval(async () => {
            try {
                const users = await roomsService.getTypingUsers(selectedConversation.id, 'dm');
                setTypingUsers(users);
            } catch (error) {
                console.error('Error fetching typing users:', error);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(typingInterval);
        };
    }, [selectedConversation]);

    // Play notification sound for new messages
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/message-notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'chats') {
                const data = await messagesService.getConversations();
                setConversations(Array.isArray(data) ? data : (data?.results || []));
            } else if (activeTab === 'requests') {
                const data = await messagesService.getRequests();
                setRequests(Array.isArray(data) ? data : []);
            } else if (activeTab === 'circles') {
                const data = await messagesService.getCircles();
                setCircles(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId, showLoading = true) => {
        if (showLoading) setMessagesLoading(true);
        try {
            const data = await messagesService.getConversation(conversationId);
            const newMsgs = data?.messages || [];
            // Check for new messages to play sound
            if (messages.length > 0 && newMsgs.length > messages.length) {
                playNotificationSound();
            }
            setMessages(newMsgs);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (showLoading) setMessagesLoading(false);
        }
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation) return null;

        // Backend might return other_participant directly
        if (conversation.other_participant) {
            return conversation.other_participant;
        }

        // Or participants_info array
        if (conversation.participants_info?.length > 0) {
            return conversation.participants_info.find(p => p.id !== user?.id);
        }

        // Or participants array
        if (conversation.participants?.length > 0) {
            // If it's an array of objects
            if (typeof conversation.participants[0] === 'object') {
                return conversation.participants.find(p => p.id !== user?.id);
            }
            // If it's an array of IDs, we can't get full user info
        }

        return null;
    };

    const getParticipantName = (participant) => {
        if (!participant) return 'Unknown User';

        // Handle full_name field
        if (participant.full_name) return participant.full_name;

        // Handle name field
        if (participant.name) return participant.name;

        // Handle first_name/last_name
        const name = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
        return name || participant.email || participant.username || 'User';
    };

    const handleTyping = () => {
        if (!selectedConversation) return;

        const now = Date.now();
        if (now - lastTypingRef.current > 2000) {
            roomsService.sendTyping(selectedConversation.id, 'dm').catch(err => console.error(err));
            lastTypingRef.current = now;
        }
    };

    const onInputChange = (e) => {
        setNewMessage(e.target.value);
        handleTyping();
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedMedia) || !selectedConversation) return;

        const otherUser = getOtherParticipant(selectedConversation);

        try {
            if (selectedMedia) {
                await messagesService.sendMediaMessage(
                    selectedConversation.id,
                    selectedMedia,
                    newMessage.trim(),
                    otherUser?.id
                );
                setSelectedMedia(null);
            } else {
                await messagesService.sendMessage(
                    selectedConversation.id,
                    newMessage.trim(),
                    otherUser?.id
                );
            }
            setNewMessage('');
            loadMessages(selectedConversation.id, false);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedMedia(file);
        }
        e.target.value = '';
    };

    // Voice recording handlers
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                setSelectedMedia(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const handleSearchUsers = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const results = await messagesService.searchUsers(query);
            setSearchResults(Array.isArray(results) ? results : []);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleStartConversation = async (userId) => {
        try {
            const dmRoom = await messagesService.getOrCreateDMRoom(userId);
            setShowNewConversation(false);
            setSearchQuery('');
            setSearchResults([]);
            await loadData();
            setSelectedConversation(dmRoom);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Failed to start conversation');
        }
    };

    const loadFollowers = async () => {
        try {
            const data = await opinionsService.getFollowers();
            setFollowers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading followers:', error);
            setFollowers([]);
        }
    };

    // Load followers when opening new conversation modal
    useEffect(() => {
        if (showNewConversation) {
            loadFollowers();
        }
    }, [showNewConversation]);

    const handleAcceptRequest = async (conversationId) => {
        try {
            await messagesService.acceptRequest(conversationId);
            loadData();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleDeclineRequest = async (conversationId) => {
        try {
            await messagesService.declineRequest(conversationId);
            loadData();
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-[calc(100vh-200px)] flex gap-4">
            {/* Conversations List */}
            <div className={`w-80 flex-shrink-0 flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <Card className="h-full flex flex-col">
                    <div className="p-4 border-b border-theme">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-primary">Messages</h2>
                            <button
                                onClick={() => setShowNewConversation(true)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="New conversation"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-secondary p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'chats'
                                    ? 'bg-elevated text-primary shadow-sm'
                                    : 'text-tertiary hover:text-primary'
                                    }`}
                            >
                                <MessageCircle size={16} />
                                Chats
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'requests'
                                    ? 'bg-elevated text-primary shadow-sm'
                                    : 'text-tertiary hover:text-primary'
                                    }`}
                            >
                                <Inbox size={16} />
                                Requests
                            </button>
                            <button
                                onClick={() => setActiveTab('circles')}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'circles'
                                    ? 'bg-elevated text-primary shadow-sm'
                                    : 'text-tertiary hover:text-primary'
                                    }`}
                            >
                                <Users size={16} />
                                Circles
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : activeTab === 'chats' ? (
                            conversations.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <MessageCircle className="w-12 h-12 text-tertiary mx-auto mb-2" />
                                    <p className="text-secondary text-sm mb-4">No conversations yet</p>
                                    <Button variant="outline" onClick={() => setShowNewConversation(true)} className="text-sm">
                                        Start a conversation
                                    </Button>
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const other = getOtherParticipant(conv);
                                    const lastMsg = conv.last_message || conv.messages?.[conv.messages.length - 1];
                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`p-4 flex items-start gap-3 cursor-pointer transition-colors border-b border-theme ${selectedConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-secondary/50'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                                {other?.avatar_url ? (
                                                    <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    other?.first_name?.[0] || 'U'
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-primary truncate">
                                                        {getParticipantName(other)}
                                                    </h4>
                                                    {lastMsg && (
                                                        <span className="text-xs text-secondary">
                                                            {formatTimeAgo(lastMsg.time_stamp || lastMsg.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-secondary truncate">
                                                    {lastMsg?.content || 'No messages yet'}
                                                </p>
                                                {conv.unread_count > 0 && (
                                                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 mt-1 text-xs font-medium bg-primary-600 text-white rounded-full">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        ) : activeTab === 'requests' ? (
                            requests.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Inbox className="w-12 h-12 text-tertiary mx-auto mb-2" />
                                    <p className="text-secondary text-sm">No message requests</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="p-4 border-b border-theme">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                {req.sender?.avatar_url ? (
                                                    <img src={req.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    req.sender?.first_name?.[0] || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-primary">{getParticipantName(req.sender)}</h4>
                                                <p className="text-xs text-secondary">Wants to send you a message</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptRequest(req.id)}
                                                className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDeclineRequest(req.id)}
                                                className="flex-1 px-3 py-1.5 bg-secondary text-primary text-sm rounded-lg hover:bg-tertiary"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            circles.length === 0 ? (
                                <div className="text-center py-8 px-4 text-secondary">
                                    <Users className="w-12 h-12 text-tertiary mx-auto mb-2" />
                                    <p>No circles yet</p>
                                    <p className="text-xs mt-1">Follow people who follow you back</p>
                                </div>
                            ) : (
                                circles.map((circle) => (
                                    <div
                                        key={circle.user?.id || circle.id}
                                        onClick={() => handleStartConversation(circle.user?.id || circle.id)}
                                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 border-b border-theme"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                            {circle.user?.avatar_url || circle.avatar_url ? (
                                                <img src={circle.user?.avatar_url || circle.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                circle.user?.first_name?.[0] || circle.first_name?.[0] || 'U'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-primary">
                                                {circle.user?.full_name || circle.full_name || getParticipantName(circle.user || circle)}
                                            </h4>
                                            <p className="text-sm text-secondary">Start chatting!</p>
                                        </div>
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Circle</span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </Card>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 ${!selectedConversation ? 'hidden md:block' : ''}`}>
                {selectedConversation ? (
                    <Card className="h-full flex flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-theme flex items-center gap-3">
                            <button
                                className="md:hidden p-1 text-secondary hover:bg-secondary rounded"
                                onClick={() => setSelectedConversation(null)}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            {(() => {
                                const other = getOtherParticipant(selectedConversation);
                                const isOnline = other?.is_online;
                                const lastSeen = other?.last_seen;

                                return (
                                    <>
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                {other?.avatar_url ? (
                                                    <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    other?.first_name?.[0] || 'U'
                                                )}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-elevated rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-primary">
                                                {getParticipantName(other)}
                                            </h3>
                                            <div className="text-xs text-secondary flex items-center gap-1">
                                                {isOnline ? (
                                                    <span className="text-green-600 font-medium">Online</span>
                                                ) : lastSeen ? (
                                                    <span>Last seen {formatTimeAgo(lastSeen)}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Direct Message</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-tertiary/5">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-secondary">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-tertiary" />
                                        <p>No messages yet. Say hello!</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message, idx) => {
                                        // Use backend is_own calculation if available, fallback to ID check
                                        const isOwn = message.is_own !== undefined
                                            ? message.is_own
                                            : (user?.id && String(typeof message.sender === 'object' ? message.sender.id : message.sender) === String(user.id));

                                        const messageDate = new Date(message.time_stamp || message.created_at);
                                        const isToday = new Date().toDateString() === messageDate.toDateString();
                                        const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const dateString = isToday ? timeString : `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeString}`;

                                        // Detailed styling from RoomDetail.jsx
                                        const bubbleClass = isOwn
                                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-sm ml-auto'
                                            : 'bg-elevated border border-theme text-primary rounded-bl-sm';

                                        const timeClass = isOwn ? 'text-primary-100' : 'text-secondary';

                                        // Read Receipt Component
                                        const MessageStatus = () => {
                                            if (!isOwn) return null;
                                            if (message.is_read || message.status === 'read') {
                                                return <CheckCheck size={14} className="text-blue-200" />;
                                            } else if (message.status === 'delivered') {
                                                return <CheckCheck size={14} className="text-primary-200" />;
                                            } else {
                                                return <Check size={14} className="text-primary-200" />;
                                            }
                                        };

                                        return (
                                            <div key={message.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group max-w-full mb-4`}>
                                                {/* Avatar for other users */}
                                                {!isOwn && (
                                                    <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 mr-2 overflow-hidden self-end mb-1">
                                                        {message.sender_info?.avatar_url ? (
                                                            <img src={message.sender_info.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-secondary">
                                                                {message.sender_info?.first_name?.[0] || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative ${bubbleClass}`}>
                                                    {message.file && (
                                                        <div className="mb-2">
                                                            {message.file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                <img src={message.file} alt="" className="rounded-lg max-h-60 w-full object-cover cursor-pointer" onClick={() => window.open(message.file, '_blank')} />
                                                            ) : message.file.match(/\.(mp3|wav|webm|ogg)$/i) ? (
                                                                <audio src={message.file} controls className="w-full" />
                                                            ) : (
                                                                <a href={message.file} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1 hover:opacity-80">
                                                                    <Paperclip size={14} />
                                                                    Attachment
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {message.content && (
                                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed min-w-[60px]">{message.content}</p>
                                                    )}
                                                    <div className={`flex items-center gap-1 mt-1 text-[10px] justify-end ${timeClass}`}>
                                                        <span>{dateString}</span>
                                                        <MessageStatus />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {typingUsers.length > 0 && (
                                        <div className="flex flex-col gap-2 mb-4 px-4">
                                            {typingUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-2">
                                                    <div className="flex items-end gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                                                            {u.avatar_url ? (
                                                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-secondary">
                                                                    {u.first_name?.[0] || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <TypingIndicator />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-theme bg-elevated">
                            {/* Media preview */}
                            {selectedMedia && (
                                <div className="mb-2 relative inline-block">
                                    {selectedMedia.type?.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(selectedMedia)} alt="" className="h-16 rounded-lg" />
                                    ) : selectedMedia.type?.startsWith('audio/') ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                                            <Mic size={18} className="text-primary-600" />
                                            <span className="text-sm text-primary">Voice note ready</span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2 bg-secondary rounded-lg text-sm text-primary">📎 {selectedMedia.name}</div>
                                    )}
                                    <button onClick={() => setSelectedMedia(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-black/80 text-white rounded-full text-xs">×</button>
                                </div>
                            )}



                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-secondary hover:bg-secondary rounded-lg transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                {/* Emoji picker */}
                                <div className="relative">
                                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-secondary hover:bg-secondary rounded-lg transition-colors">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full mb-2 left-0 bg-elevated border border-theme rounded-lg shadow-lg p-2 grid grid-cols-10 gap-1 z-30">
                                            {COMMON_EMOJIS.map(emoji => (
                                                <button key={emoji} type="button" onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="p-1 hover:bg-secondary rounded text-lg">
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Voice recording */}
                                {isRecording ? (
                                    <button type="button" onClick={stopRecording} className="p-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2">
                                        <MicOff className="w-5 h-5" />
                                        <span className="text-sm">{formatRecordingTime(recordingTime)}</span>
                                    </button>
                                ) : (
                                    <button type="button" onClick={startRecording} className="p-2 text-secondary hover:bg-secondary rounded-lg transition-colors">
                                        <Mic className="w-5 h-5" />
                                    </button>
                                )}

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={onInputChange}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-theme bg-secondary text-primary placeholder-tertiary rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                <button type="submit" className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50" disabled={!newMessage.trim() && !selectedMedia}>
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <CardBody className="text-center">
                            <MessageCircle className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-primary mb-2">Your Messages</h3>
                            <p className="text-secondary mb-4">Send messages to friends and connections</p>
                            <Button variant="primary" onClick={() => setShowNewConversation(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Message
                            </Button>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-primary">New Message</h2>
                                <button onClick={() => { setShowNewConversation(false); setSearchQuery(''); setSearchResults([]); }} className="text-tertiary hover:text-primary transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search users by name..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-theme bg-secondary text-primary placeholder-tertiary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {searchLoading ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                    </div>
                                ) : searchQuery.length >= 2 && searchResults.length > 0 ? (
                                    <>
                                        <p className="text-xs text-secondary mb-2 px-1">Search Results</p>
                                        {searchResults.map((searchUser) => (
                                            <button key={searchUser.id} onClick={() => handleStartConversation(searchUser.id)} className="w-full p-3 flex items-center gap-3 hover:bg-secondary/50 rounded-lg transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                    {searchUser.avatar_url ? <img src={searchUser.avatar_url} alt="" className="w-full h-full object-cover" /> : searchUser.first_name?.[0] || 'U'}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-primary">{searchUser.first_name} {searchUser.last_name}</p>
                                                    <p className="text-sm text-secondary">{searchUser.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                ) : searchQuery.length >= 2 ? (
                                    <p className="text-center text-secondary py-4">No users found</p>
                                ) : (
                                    <>
                                        {followers.length > 0 && (
                                            <>
                                                <p className="text-xs text-secondary mb-2 px-1 flex items-center gap-1"><UserPlus size={12} /> Your Followers</p>
                                                {followers.slice(0, 10).map((follower) => (
                                                    <button key={follower.id} onClick={() => handleStartConversation(follower.id)} className="w-full p-3 flex items-center gap-3 hover:bg-secondary/50 rounded-lg transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                            {follower.avatar_url ? <img src={follower.avatar_url} alt="" className="w-full h-full object-cover" /> : follower.first_name?.[0] || 'U'}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-primary">{follower.first_name} {follower.last_name}</p>
                                                            <p className="text-sm text-secondary">{follower.email || follower.user_type}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        <p className="text-center text-tertiary py-2 text-sm">Type to search more users</p>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Messages;
