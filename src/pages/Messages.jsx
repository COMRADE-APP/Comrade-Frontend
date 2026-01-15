import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MessageCircle, Send, Paperclip, Search, Plus, X, User, Lock } from 'lucide-react';
import messagesService from '../services/messages.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            // Mark messages as read
            messagesService.markAllRead(selectedConversation.id).catch(() => { });
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        setLoading(true);
        try {
            const data = await messagesService.getAll();
            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading conversations:', error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (dmRoomId) => {
        setMessagesLoading(true);
        try {
            const data = await messagesService.getConversation(dmRoomId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const otherParticipant = selectedConversation.other_participant;
        if (!otherParticipant) return;

        try {
            await messagesService.sendDirectMessage(
                otherParticipant.id,
                newMessage,
                null,
                selectedConversation.id
            );
            setNewMessage('');
            loadMessages(selectedConversation.id);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
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
            await loadConversations();
            setSelectedConversation(dmRoom);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Failed to start conversation');
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] flex gap-4">
            {/* Conversations List */}
            <div className="w-80 flex-shrink-0 hidden md:flex flex-col">
                <Card className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                        <button
                            onClick={() => setShowNewConversation(true)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="New conversation"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewConversation(true)}
                                    className="text-sm"
                                >
                                    Start a conversation
                                </Button>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isSelected={selectedConversation?.id === conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                />
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Chat Area */}
            <div className="flex-1">
                {selectedConversation ? (
                    <Card className="h-full flex flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                                {selectedConversation.other_participant?.name?.[0] || 'U'}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                    {selectedConversation.other_participant?.name || 'User'}
                                </h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Encrypted conversation
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p>No messages yet. Say hello!</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message, idx) => (
                                        <MessageBubble
                                            key={message.id || idx}
                                            message={message}
                                            isOwn={message.sender === user?.id || message.sender_info?.id === user?.id}
                                        />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
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
                                <button
                                    type="submit"
                                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <CardBody className="text-center">
                            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                            <p className="text-gray-500 mb-4">Choose a conversation from the list to start messaging</p>
                            <Button variant="primary" onClick={() => setShowNewConversation(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Conversation
                            </Button>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
                                <button
                                    onClick={() => {
                                        setShowNewConversation(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {searchLoading ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((searchUser) => (
                                        <button
                                            key={searchUser.id}
                                            onClick={() => handleStartConversation(searchUser.id)}
                                            className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {searchUser.first_name} {searchUser.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500">{searchUser.email}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : searchQuery.length >= 2 ? (
                                    <p className="text-center text-gray-500 py-4">No users found</p>
                                ) : (
                                    <p className="text-center text-gray-500 py-4">
                                        Type at least 2 characters to search
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const ConversationItem = ({ conversation, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 flex items-start gap-3 cursor-pointer transition-colors border-b border-gray-100 ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
    >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 truncate">
                    {conversation.other_participant?.name || 'User'}
                </h4>
                {conversation.last_message && (
                    <span className="text-xs text-gray-500">
                        {formatTimeAgo(conversation.last_message.time_stamp)}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-600 truncate">
                {conversation.last_message?.content || 'No messages yet'}
            </p>
            {conversation.unread_count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 mt-1 text-xs font-medium bg-primary-600 text-white rounded-full">
                    {conversation.unread_count}
                </span>
            )}
        </div>
    </div>
);

const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${isOwn
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
        >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                {formatTimeAgo(message.time_stamp)}
            </p>
        </div>
    </div>
);

export default Messages;
