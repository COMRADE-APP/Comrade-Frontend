import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Send, Bot, User, Sparkles, Loader2, AlertCircle,
    Trash2, Brain, Plus, MessageSquare, ChevronLeft,
    ChevronRight, Paperclip, Camera, X, Image as ImageIcon,
    FileText, Video, Settings, Check, Maximize2, Minimize2,
    Menu, Search, Mic, Globe, Microscope, ImagePlus, ChevronDown
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import qomaiService from '../services/qomai.service';

// Model Configurations
const AVAILABLE_MODELS = [
    {
        category: "Qwen Series",
        models: [
            { id: 'qwen-7b', name: 'Qwen 7B', description: 'Recommended balance' },
            { id: 'qwen-32b', name: 'Qwen 32B', description: 'Complex tasks' },
            { id: 'qwen-72b', name: 'Qwen 72B', description: 'Maximum intelligence' },
            { id: 'qwen-coder', name: 'Qwen Coder', description: 'Programming specialist' },
        ]
    },
    {
        category: "DeepSeek",
        models: [
            { id: 'deepseek-v3', name: 'DeepSeek V3', description: 'Advanced reasoning' },
            { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'Chain of thought' },
        ]
    },
    {
        category: "Llama & GPT",
        models: [
            { id: 'llama-3-8b', name: 'Llama 3', description: 'Meta general purpose' },
            { id: 'gpt-mistral', name: 'Mistral 7B', description: 'GPT-class efficiency' },
        ]
    },
    {
        category: "Specialized",
        models: [
            { id: 'kimi-yi', name: 'Kimi (Yi)', description: 'Long context specialist' },
        ]
    }
];

const MODES = [
    { id: 'chat', name: 'Chat', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'reasoning', name: 'Deep Reasoning', icon: Brain, color: 'text-pink-400' },
    { id: 'research', name: 'Deep Research', icon: Microscope, color: 'text-cyan-400' },
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

    // Settings State
    const [selectedModel, setSelectedModel] = useState('qwen-7b');
    const [currentMode, setCurrentMode] = useState('chat');
    const [enableSearch, setEnableSearch] = useState(true);

    // File/Media State
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    // Initial welcome message
    const getWelcomeMessage = () => ({
        role: 'assistant',
        content: `Hello${user?.first_name ? `, ${user.first_name}` : ''}! I'm QomAI, your advanced AI assistant.\n\n### Available Modes:\n- **Chat 💬** - Standard conversation with web search\n- **Deep Reasoning 🧠** - Complex logic & coding\n- **Deep Research 🔬** - Comprehensive reports\n\n### Capabilities:\n- **Generation 🎨** - "Generate an image of..."\n- **Voice 🎤** - Speak to interact\n- **Analysis 📁** - Upload documents/images\n\nHow can I help you?`,
        timestamp: new Date()
    });

    useEffect(() => {
        loadConversations();
        // Load preference
        qomaiService.getPreferences().then(pref => {
            if (pref.preferred_model) setSelectedModel(pref.preferred_model);
        });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const response = await qomaiService.getConversations();
            setConversations(response || []);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    };

    const startNewChat = () => {
        setCurrentConversationId(null);
        setMessages([getWelcomeMessage()]);
        setError('');
        setAttachments([]);
        setInput('');
        inputRef.current?.focus();
    };

    const loadConversation = async (conversationId) => {
        try {
            setIsLoading(true);
            const conversation = await qomaiService.getConversation(conversationId);
            setCurrentConversationId(conversationId);
            const mappedMessages = (conversation.messages || []).map(msg => ({
                ...msg,
                timestamp: msg.created_at || new Date()
            }));
            setMessages(mappedMessages.length > 0 ? mappedMessages : [getWelcomeMessage()]);
            setError('');
            if (window.innerWidth < 768) setSidebarOpen(false);
        } catch (err) {
            console.error('Failed to load conversation:', err);
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceRecord = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setIsLoading(true);
                try {
                    const text = await qomaiService.transcribeAudio(blob);
                    setInput(prev => (prev ? `${prev} ${text}` : text));
                } catch (err) {
                    setError('Voice transcription failed');
                } finally {
                    setIsLoading(false);
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (err) {
            setError('Could not access microphone');
        }
    };

    const handleGenerateImage = async () => {
        const prompt = input.trim();
        if (!prompt) {
            setError('Please enter a description for the image first');
            return;
        }

        setIsLoading(true);
        setMessages(prev => [...prev, {
            role: 'user',
            content: `Generate image: ${prompt}`,
            timestamp: new Date()
        }]);
        setInput('');

        try {
            const imageUrl = await qomaiService.generateImage(prompt);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Here is your generated image for: "${prompt}"`,
                timestamp: new Date(),
                attachments: [{ name: 'generated.jpg', type: 'image/jpeg', preview: imageUrl }]
            }]);
        } catch (err) {
            setError('Image generation failed');
            setMessages(prev => [...prev, {
                role: 'assistant',
                isError: true,
                content: 'Failed to generate image. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!input.trim() && attachments.length === 0) || isLoading) return;

        const userMsg = {
            role: 'user',
            content: input.trim(),
            attachments: attachments.map(a => ({ name: a.name, type: a.type })),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);
        setError('');

        try {
            const response = await qomaiService.sendMessage(
                userMsg.content,
                messages,
                currentConversationId,
                selectedModel,
                attachments,
                currentMode,
                enableSearch
            );

            if (response.conversation_id && !currentConversationId) {
                setCurrentConversationId(response.conversation_id);
                loadConversations();
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

    // File helpers (same as before)
    const handleFileSelect = (e) => addAttachments(Array.from(e.target.files));
    const addAttachments = (files) => {
        const newAtts = files.map(file => ({
            file,
            name: file.name,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));
        setAttachments(prev => [...prev, ...newAtts].slice(0, 5));
    };

    // Group conversations helper (same logic)
    const groupedConversations = conversations.reduce((groups, conv) => {
        const date = new Date(conv.updated_at || conv.created_at);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        let group = date.toDateString() === today.toDateString() ? 'Today' :
            date.toDateString() === yesterday.toDateString() ? 'Yesterday' :
                date > new Date(today.setDate(today.getDate() - 7)) ? 'This Week' : 'Older';
        if (!groups[group]) groups[group] = [];
        groups[group].push(conv);
        return groups;
    }, {});

    const getModeIcon = (modeId) => {
        const mode = MODES.find(m => m.id === modeId);
        const Icon = mode ? mode.icon : MessageSquare;
        return <Icon className={`w-4 h-4 ${mode?.color}`} />;
    };

    return (
        <div className={`flex h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950`}>
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-900/80 border-r border-gray-800 flex flex-col`}>
                <div className="p-4 border-b border-gray-800">
                    <Button onClick={startNewChat} className="w-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> New Chat
                    </Button>
                </div>
                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {/* (List implementation same as before but compacted) */}
                    {Object.entries(groupedConversations).map(([group, convs]) => (
                        <div key={group} className="mt-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">{group}</h3>
                            {convs.map(conv => (
                                <button key={conv.id} onClick={() => loadConversation(conv.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 group transition-colors flex items-center gap-2 ${currentConversationId === conv.id ? 'bg-violet-600/20 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 truncate text-sm">{conv.title || 'New Chat'}</span>
                                    <Trash2 onClick={(e) => { e.stopPropagation(); qomaiService.deleteConversation(conv.id).then(() => loadConversations()); }} className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-400" />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
                            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-semibold text-white flex items-center gap-1">QomAI <Sparkles className="w-4 h-4 text-yellow-400" /></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mode Toggles */}
                        <div className="hidden md:flex bg-gray-800 rounded-lg p-1">
                            {MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setCurrentMode(mode.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${currentMode === mode.id
                                            ? 'bg-gray-700 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                    title={mode.name}
                                >
                                    <mode.icon className={`w-3.5 h-3.5 ${currentMode === mode.id ? mode.color : ''}`} />
                                    {mode.name}
                                </button>
                            ))}
                        </div>

                        {/* Search Toggle */}
                        <button
                            onClick={() => setEnableSearch(!enableSearch)}
                            className={`p-2 rounded-lg transition-colors ${enableSearch ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
                            title="Web Search"
                        >
                            <Globe className="w-5 h-5" />
                        </button>

                        {/* Model Selector */}
                        <div className="relative">
                            <button onClick={() => setShowModelSelector(!showModelSelector)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300">
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    {AVAILABLE_MODELS.flatMap(c => c.models).find(m => m.id === selectedModel)?.name}
                                </span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {showModelSelector && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                                    {AVAILABLE_MODELS.map((category, idx) => (
                                        <div key={idx}>
                                            <div className="px-3 py-2 bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">{category.category}</div>
                                            {category.models.map(model => (
                                                <button key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelSelector(false); qomaiService.setPreferredModel(model.id); }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700/50 last:border-0 ${selectedModel === model.id ? 'bg-violet-600/10' : ''}`}>
                                                    <div className="flex-1">
                                                        <div className="text-sm text-white font-medium flex items-center justify-between">
                                                            {model.name}
                                                            {selectedModel === model.id && <Check className="w-4 h-4 text-violet-400" />}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-0.5">{model.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <Sparkles className="w-12 h-12 text-violet-500/50 mb-4" />
                            <p>Select a mode and start chatting!</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-violet-500' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                                {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                            </div>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-violet-600 text-white' : message.isError ? 'bg-red-900/90 border border-red-500/50 text-white' : 'bg-gray-800 text-gray-100'}`}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                                {message.attachments && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-700/50">
                                        {message.attachments.map((att, i) => (
                                            <div key={i} className="flex items-center gap-1 text-xs bg-gray-700/50 px-2 py-1 rounded">
                                                {att.preview ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                                <span className="truncate max-w-[150px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs opacity-50">
                                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {message.model && <span>• {message.model}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                            <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">
                                    {currentMode === 'reasoning' ? 'Thinking deeply...' :
                                        currentMode === 'research' ? 'Researching web sources...' :
                                            'Typing...'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                    {/* Mode Indicator (Mobile) */}
                    <div className="md:hidden flex gap-2 mb-2 overflow-x-auto pb-1">
                        {MODES.map(mode => (
                            <button key={mode.id} onClick={() => setCurrentMode(mode.id)}
                                className={`px-2 py-1 rounded text-xs whitespace-nowrap ${currentMode === mode.id ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>
                                {mode.name}
                            </button>
                        ))}
                    </div>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 bg-gray-800/50 p-2 rounded-lg">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative group w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {att.preview ? <img src={att.preview} className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-gray-400" />}
                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        {/* Tools */}
                        <div className="flex gap-1">
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white" title="Upload File">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <button type="button" onClick={handleGenerateImage} className="p-3 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-purple-400" title="Generate Image">
                                <ImagePlus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                                placeholder={isRecording ? "Listening..." : `Ask QomAI (${currentMode} mode)...`}
                                rows={1}
                                className={`w-full bg-gray-800 border-2 rounded-xl px-4 py-3 text-white focus:outline-none transition-all resize-none max-h-32 ${isRecording ? 'border-red-500 animate-pulse' :
                                        currentMode === 'reasoning' ? 'border-pink-500/30 focus:border-pink-500' :
                                            currentMode === 'research' ? 'border-cyan-500/30 focus:border-cyan-500' :
                                                'border-gray-700 focus:border-violet-500'
                                    }`}
                                disabled={isLoading}
                                style={{ height: 'auto', minHeight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={handleVoiceRecord}
                                className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white animate-bounce' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                                title="Voice Input"
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>

                        <Button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading}
                            className={`p-3 rounded-xl transition-all ${currentMode === 'reasoning' ? 'bg-pink-600 hover:bg-pink-700' :
                                    currentMode === 'research' ? 'bg-cyan-600 hover:bg-cyan-700' :
                                        'bg-violet-600 hover:bg-violet-700'
                                }`}>
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </form>
                    <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-2">
                        <span>Powered by {AVAILABLE_MODELS.flatMap(c => c.models).find(m => m.id === selectedModel)?.name}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span className={enableSearch ? "text-blue-400" : "text-gray-600"}>{enableSearch ? "Web Search ON" : "Web Search OFF"}</span>
                    </p>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && window.innerWidth < 768 && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
};

export default QomAI;
