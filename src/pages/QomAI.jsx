import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Send, Bot, User, Sparkles, Loader2, AlertCircle,
    Trash2, Brain, Plus, MessageSquare, ChevronLeft,
    ChevronRight, Paperclip, Camera, X, Image as ImageIcon,
    FileText, Video, Settings, Check, Maximize2, Minimize2,
    Menu, Search
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import qomaiService from '../services/qomai.service';

// Available Qwen models
const QWEN_MODELS = [
    { id: 'qwen-0.5b', name: 'Qwen 0.5B', description: 'Fastest, basic tasks' },
    { id: 'qwen-1.5b', name: 'Qwen 1.5B', description: 'Fast, simple queries' },
    { id: 'qwen-3b', name: 'Qwen 3B', description: 'Balanced speed/quality' },
    { id: 'qwen-7b', name: 'Qwen 7B', description: 'Recommended', recommended: true },
    { id: 'qwen-14b', name: 'Qwen 14B', description: 'Higher quality' },
    { id: 'qwen-32b', name: 'Qwen 32B', description: 'Complex tasks' },
    { id: 'qwen-72b', name: 'Qwen 72B', description: 'Best quality, slower' },
    { id: 'qwen-coder', name: 'Qwen Coder', description: 'Code specialized' },
];

const QomAI = () => {
    const { user } = useAuth();

    // UI State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModelSelector, setShowModelSelector] = useState(false);

    // Chat State
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Model State
    const [selectedModel, setSelectedModel] = useState('qwen-7b');

    // File Upload State
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Initial welcome message
    const getWelcomeMessage = () => ({
        role: 'assistant',
        content: `Hello${user?.first_name ? `, ${user.first_name}` : ''}! I'm QomAI, your intelligent assistant.\n\nI can help you with:\n\n- **Platform Navigation** - Find features, rooms, events\n- **Content Analysis** - Analyze articles and research\n- **Learning Assistance** - Help with learning paths\n- **Recommendations** - Suggest content and connections\n- **General Questions** - Answer anything you ask\n\nHow can I assist you today?`,
        timestamp: new Date()
    });

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load conversations from API
    const loadConversations = async () => {
        try {
            const response = await qomaiService.getConversations();
            setConversations(response || []);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    };

    // Start new chat
    const startNewChat = () => {
        setCurrentConversationId(null);
        setMessages([getWelcomeMessage()]);
        setError('');
        setAttachments([]);
        inputRef.current?.focus();
    };

    // Load specific conversation
    const loadConversation = async (conversationId) => {
        try {
            setIsLoading(true);
            const conversation = await qomaiService.getConversation(conversationId);
            setCurrentConversationId(conversationId);
            // Map created_at to timestamp for consistency
            const mappedMessages = (conversation.messages || []).map(msg => ({
                ...msg,
                timestamp: msg.created_at || new Date()
            }));
            setMessages(mappedMessages.length > 0 ? mappedMessages : [getWelcomeMessage()]);
            setError('');
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        } catch (err) {
            console.error('Failed to load conversation:', err);
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle message submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!input.trim() && attachments.length === 0) || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input.trim(),
            attachments: attachments.map(a => ({ name: a.name, type: a.type })),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);
        setError('');

        try {
            const response = await qomaiService.sendMessage(
                input.trim(),
                messages,
                currentConversationId,
                selectedModel,
                attachments
            );

            if (response.conversation_id && !currentConversationId) {
                setCurrentConversationId(response.conversation_id);
                loadConversations(); // Refresh sidebar
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message || response.content,
                model: response.model,
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error('QomAI Error:', err);
            setError(err.response?.data?.error || 'Failed to get response');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I apologize, but I encountered an error. Please try again.',
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // File handling
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        addAttachments(files);
    };

    const addAttachments = (files) => {
        const newAttachments = files.map(file => ({
            file,
            name: file.name,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));
        setAttachments(prev => [...prev, ...newAttachments].slice(0, 5)); // Max 5 files
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        addAttachments(files);
    };

    // Delete conversation
    const deleteConversation = async (conversationId, e) => {
        e.stopPropagation();
        try {
            await qomaiService.deleteConversation(conversationId);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversationId === conversationId) {
                startNewChat();
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    };

    // Group conversations by date
    const groupedConversations = conversations.reduce((groups, conv) => {
        const date = new Date(conv.updated_at || conv.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let group;
        if (date.toDateString() === today.toDateString()) {
            group = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = 'Yesterday';
        } else if (date > new Date(today.setDate(today.getDate() - 7))) {
            group = 'This Week';
        } else {
            group = 'Older';
        }

        if (!groups[group]) groups[group] = [];
        groups[group].push(conv);
        return groups;
    }, {});

    // Get file icon based on type
    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    const suggestedPrompts = [
        "What events are happening this week?",
        "Recommend learning paths for me",
        "Help me find research on AI",
        "What rooms should I join?",
    ];

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([getWelcomeMessage()]);
        }
    }, []);

    return (
        <div className={`flex h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950`}>
            {/* Chat History Sidebar */}
            <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-900/80 border-r border-gray-800 flex flex-col`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-800">
                    <Button
                        onClick={startNewChat}
                        className="w-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </Button>
                </div>

                {/* Search */}
                <div className="px-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {Object.entries(groupedConversations).map(([group, convs]) => (
                        <div key={group} className="mt-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">{group}</h3>
                            {convs.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 group transition-colors flex items-center gap-2 ${currentConversationId === conv.id
                                        ? 'bg-violet-600/20 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 truncate text-sm">{conv.title || 'New Chat'}</span>
                                    <button
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </button>
                            ))}
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="text-center text-gray-500 text-sm mt-8 px-4">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No conversations yet</p>
                            <p className="text-xs mt-1">Start a new chat to begin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white flex items-center gap-1">
                                    QomAI <Sparkles className="w-4 h-4 text-yellow-400" />
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Model Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowModelSelector(!showModelSelector)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">{QWEN_MODELS.find(m => m.id === selectedModel)?.name}</span>
                            </button>

                            {showModelSelector && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-2 border-b border-gray-700">
                                        <p className="text-xs text-gray-400 px-2">Select Model</p>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto py-1">
                                        {QWEN_MODELS.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setSelectedModel(model.id);
                                                    setShowModelSelector(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 hover:bg-gray-700 flex items-center justify-between ${selectedModel === model.id ? 'bg-violet-600/20' : ''
                                                    }`}
                                            >
                                                <div>
                                                    <div className="text-sm text-white flex items-center gap-2">
                                                        {model.name}
                                                        {model.recommended && (
                                                            <span className="text-xs bg-violet-500 px-1.5 py-0.5 rounded">Recommended</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{model.description}</div>
                                                </div>
                                                {selectedModel === model.id && (
                                                    <Check className="w-4 h-4 text-violet-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-5 h-5 text-gray-400" />
                            ) : (
                                <Maximize2 className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDragging ? 'bg-violet-500/10' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 pointer-events-none">
                            <div className="text-center">
                                <Paperclip className="w-12 h-12 text-violet-400 mx-auto mb-2" />
                                <p className="text-white font-medium">Drop files here</p>
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                                ? 'bg-violet-500'
                                : message.isError
                                    ? 'bg-red-500/20'
                                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                }`}>
                                {message.role === 'user' ? (
                                    <User className="w-4 h-4 text-white" />
                                ) : (
                                    <Bot className={`w-4 h-4 ${message.isError ? 'text-red-400' : 'text-white'}`} />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-violet-600 text-white'
                                : message.isError
                                    ? 'bg-red-900/90 border border-red-500/50 text-white'
                                    : 'bg-gray-800 text-gray-100'
                                }`}>
                                {/* Markdown Content */}
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                            code: ({ children }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-violet-300">{children}</code>,
                                            pre: ({ children }) => <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-2">{children}</pre>,
                                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Attachments preview */}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-700">
                                        {message.attachments.map((att, i) => (
                                            <div key={i} className="flex items-center gap-1 text-xs bg-gray-700 px-2 py-1 rounded">
                                                {getFileIcon(att.type)}
                                                <span className="truncate max-w-[100px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs opacity-50">
                                        {new Date(message.timestamp || message.created_at || new Date()).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {message.model && (
                                        <span className="text-xs opacity-30">{message.model}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-800 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Prompts */}
                {messages.length === 1 && (
                    <div className="px-4 pb-2">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestedPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(prompt)}
                                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-gray-700"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="px-4 pb-2">
                        <div className="flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded-lg">
                            {attachments.map((att, index) => (
                                <div key={index} className="relative group">
                                    {att.preview ? (
                                        <img src={att.preview} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                                            {getFileIcon(att.type)}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeAttachment(index)}
                                        className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                    <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-black/50 truncate px-1 rounded-b-lg">
                                        {att.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="px-4 pb-2">
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        {/* File Upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
                            title="Attach file"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>

                        {/* Camera */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*,video/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="p-3 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
                            title="Take photo"
                        >
                            <Camera className="w-5 h-5" />
                        </button>

                        {/* Text Input */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask QomAI anything..."
                                rows={1}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none min-h-[48px] max-h-32"
                                disabled={isLoading}
                                style={{ height: 'auto' }}
                            />
                        </div>

                        {/* Send Button */}
                        <Button
                            type="submit"
                            disabled={(!input.trim() && attachments.length === 0) || isLoading}
                            className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500 text-center mt-2">
                        QomAI is powered by Qwen AI via HuggingFace. Responses may not always be accurate.
                    </p>
                </div>
            </div>

            {/* Click outside to close model selector */}
            {showModelSelector && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModelSelector(false)}
                />
            )}
        </div>
    );
};

export default QomAI;
