import React, { useState, useEffect, useRef } from 'react';
import chatService from '../services/chat.service';
import permissionsService from '../services/permissions.service';

const ChatComponent = ({ roomId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasFilePermission, setHasFilePermission] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (roomId) {
            fetchMessages();
            checkFilePermission();
            const interval = setInterval(fetchTypingIndicators, 2000);
            return () => clearInterval(interval);
        }
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const data = await chatService.getMessages(roomId);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkFilePermission = async () => {
        try {
            const result = await permissionsService.checkPermission('files');
            setHasFilePermission(result.has_permission);
        } catch (error) {
            console.error('Error checking file permission:', error);
        }
    };

    const fetchTypingIndicators = async () => {
        try {
            const data = await chatService.getTypingIndicators(roomId);
            setTypingUsers(data);
        } catch (error) {
            console.error('Error fetching typing indicators:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const sentMessage = await chatService.sendMessage(roomId, newMessage.trim());
            setMessages([...messages, sentMessage]);
            setNewMessage('');
            await chatService.stopTyping(roomId);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleTyping = async () => {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Start typing indicator
        try {
            await chatService.startTyping(roomId);
        } catch (error) {
            console.error('Error starting typing:', error);
        }

        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(async () => {
            try {
                await chatService.stopTyping(roomId);
            } catch (error) {
                console.error('Error stopping typing:', error);
            }
        }, 3000);
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            await chatService.addReaction(messageId, emoji);
            fetchMessages(); // Refresh to show new reaction
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const handleFileUpload = async (e) => {
        if (!hasFilePermission) {
            const granted = await requestFilePermission();
            if (!granted) return;
        }

        // File upload logic would go here
        alert('File upload feature coming soon!');
    };

    const requestFilePermission = async () => {
        try {
            await permissionsService.requestPermission('files', 'Upload files in chat', 'Chat', window.location.pathname);
            setHasFilePermission(true);
            return true;
        } catch (error) {
            console.error('Error requesting file permission:', error);
            return false;
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (!roomId) {
        return <div className="p-4 text-center text-gray-500">Select a room to start chatting</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex flex-col">
                            <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                                        {message.sender_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline space-x-2">
                                        <span className="font-medium text-sm text-gray-900">{message.sender_name}</span>
                                        <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                                        {message.is_edited && <span className="text-xs text-gray-400">(edited)</span>}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{message.content}</p>

                                    {/* Reactions */}
                                    {message.reactions && message.reactions.length > 0 && (
                                        <div className="flex items-center space-x-1 mt-2">
                                            {message.reactions.map((reaction, idx) => (
                                                <span key={idx} className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                                                    {reaction.emoji}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Reactions */}
                                    <div className="flex items-center space-x-1 mt-2">
                                        {['👍', '❤️', '😂', '🎉'].map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(message.id, emoji)}
                                                className="text-sm hover:bg-gray-100 rounded px-1 transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 italic">
                    {typingUsers.map(u => u.user_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
            )}

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleFileUpload}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Attach file"
                    >
                        📎
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatComponent;
