import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import { MessageCircle, Send, Paperclip, Search } from 'lucide-react';
import messagesService from '../services/messages.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

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

    const loadMessages = async (userId) => {
        try {
            const data = await messagesService.getConversation(userId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await messagesService.sendDirectMessage(selectedConversation.id, newMessage);
            setNewMessage('');
            loadMessages(selectedConversation.id);
        } catch (error) {
            alert('Failed to send message');
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] flex gap-4">
            {/* Conversations List */}
            <div className="w-80 flex-shrink-0 hidden md:block">
                <Card className="h-full">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-60px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No conversations yet</p>
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
                                {selectedConversation.name?.[0] || 'U'}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedConversation.name || 'User'}</h3>
                                <p className="text-xs text-gray-500">Active now</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message, idx) => (
                                <MessageBubble
                                    key={idx}
                                    message={message}
                                    isOwn={message.sender?.id === user?.id}
                                />
                            ))}
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
                                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
                            <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

const ConversationItem = ({ conversation, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
    >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 truncate">{conversation.name || 'User'}</h4>
                <span className="text-xs text-gray-500">{formatTimeAgo(conversation.time_stamp)}</span>
            </div>
            <p className="text-sm text-gray-600 truncate">{conversation.last_message || 'No messages yet'}</p>
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
            <p className="text-sm">{message.content}</p>
            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                {formatTimeAgo(message.time_stamp)}
            </p>
        </div>
    </div>
);

export default Messages;
