import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROUTES } from '../constants/routes';

const VoiceAssistantContext = createContext(null);

export const useVoiceAssistant = () => {
    const context = useContext(VoiceAssistantContext);
    if (!context) {
        throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
    }
    return context;
};

// Default settings
const DEFAULT_WAKE_PHRASE = 'hey comrade';
const WAKE_PHRASE_OPTIONS = ['hey comrade', 'ok comrade', 'comrade'];

// Route name map for voice navigation
const ROUTE_MAP = {
    'home': '/',
    'dashboard': '/',
    'messages': '/messages',
    'notifications': '/notifications',
    'events': '/events',
    'tasks': '/tasks',
    'announcements': '/announcements',
    'resources': '/resources',
    'opinions': '/opinions',
    'profile': '/profile',
    'settings': '/settings',
    'payments': '/admin/payments',
    'rooms': '/rooms',
    'research': '/research',
    'ml dashboard': '/admin/ml-dashboard',
    'scraping': '/admin/ml/scraping',
    'qomai': '/qomai',
};

export const VoiceAssistantProvider = ({ children }) => {
    const { user, justLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ---- State ----
    const [isEnabled, setIsEnabled] = useState(() => {
        const stored = localStorage.getItem('voiceAssistantEnabled');
        return stored !== null ? stored === 'true' : true; // On by default
    });
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastCommand, setLastCommand] = useState('');
    const [lastResponse, setLastResponse] = useState('');
    const [hasGreeted, setHasGreeted] = useState(false);
    const [wakePhrase, setWakePhraseState] = useState(() => {
        return localStorage.getItem('voiceWakePhrase') || DEFAULT_WAKE_PHRASE;
    });
    const [voiceSpeed, setVoiceSpeedState] = useState(() => {
        return parseFloat(localStorage.getItem('voiceSpeed') || '1.0');
    });
    const [selectedVoice, setSelectedVoiceState] = useState(() => {
        return localStorage.getItem('voiceSelectedVoice') || '';
    });
    const [availableVoices, setAvailableVoices] = useState([]);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const greetedRef = useRef(false);

    // ---- Persistence helpers ----
    const setWakePhrase = useCallback((phrase) => {
        const cleaned = phrase.toLowerCase().trim();
        setWakePhraseState(cleaned);
        localStorage.setItem('voiceWakePhrase', cleaned);
    }, []);

    const setVoiceSpeed = useCallback((speed) => {
        setVoiceSpeedState(speed);
        localStorage.setItem('voiceSpeed', String(speed));
    }, []);

    const setSelectedVoice = useCallback((voiceName) => {
        setSelectedVoiceState(voiceName);
        localStorage.setItem('voiceSelectedVoice', voiceName);
    }, []);

    useEffect(() => {
        localStorage.setItem('voiceAssistantEnabled', String(isEnabled));
    }, [isEnabled]);

    // ---- Load system voices ----
    useEffect(() => {
        const loadVoices = async () => {
            const browserVoices = synthRef.current?.getVoices() || [];

            // Default premium fallbacks (before network completes)
            let premiumVoices = [
                { name: 'Free: Christopher (Deep Male)', lang: 'en-US', localService: false, premium: true, provider: 'edgetts', voice_id: 'en-US-ChristopherNeural' },
                { name: 'ElevenLabs (Ezra Klein Clone)', lang: 'en-US', localService: false, premium: true, provider: 'elevenlabs', voice_id: '' },
                { name: 'OpenAI (Deep Male)', lang: 'en-US', localService: false, premium: true, provider: 'openai', voice_id: 'onyx' }
            ];

            try {
                // Fetch user's custom clones from the backend
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/qomai/voice/tts/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.voices && data.voices.length > 0) {
                        // Override defaults with the dynamic API list
                        premiumVoices = data.voices.map(v => ({
                            name: v.name,
                            lang: 'en-US', // API voices are generally multilingual now
                            localService: false,
                            premium: true,
                            provider: v.provider,
                            voice_id: v.id
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to load custom API voices:", error);
            }

            // Merge dynamic premium voices with local OS ones, avoiding duplicates
            if (browserVoices.length > 0) {
                setAvailableVoices([...premiumVoices, ...browserVoices]);
            } else {
                setAvailableVoices(premiumVoices);
            }
        };

        // Standard local browser load triggers
        setTimeout(loadVoices, 100);

        if (synthRef.current?.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = () => {
                const browserVoices = synthRef.current.getVoices();
                setAvailableVoices(prev => {
                    const premium = prev.filter(v => v.premium);
                    return [...premium, ...browserVoices];
                });
            };
        }
    }, []);

    // ---- Speech Synthesis (TTS) ----
    // ---- Audio Player Ref ----
    const audioRef = useRef(null);

    // ---- Speech Synthesis (TTS) ----
    const speak = useCallback(async (text, options = {}) => {
        if (!text) return;

        // Cancel any ongoing speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (synthRef.current) {
            synthRef.current.cancel();
        }

        setIsSpeaking(true);
        setLastResponse(text);

        // Find the selected voice object to get its provider and ID
        const selectedVoiceObj = availableVoices.find(v => v.name === selectedVoice);

        // Define if user picked a premium cloud voice vs a local browser voice
        const isPremiumSelected = selectedVoice === '' || selectedVoiceObj?.premium;

        // Default to ElevenLabs Ezra clone if nothing is selected or no specific provider is found but it's marked premium
        const requestedProvider = selectedVoiceObj?.provider || 'elevenlabs';
        const requestedVoiceId = selectedVoiceObj?.voice_id || '';

        if (isPremiumSelected) {
            try {
                // High-Fidelity Voice Cloning (Backend API)
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/qomai/voice/tts/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text,
                        provider: requestedProvider,
                        voice_id: requestedVoiceId
                    })
                });

                if (response.ok) {
                    // Play the returned audio stream
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audioRef.current = audio;

                    audio.onended = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(url);
                    };
                    audio.onerror = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(url);
                    };

                    // Allow volume manipulation via options
                    audio.volume = options.volume || 1.0;

                    // Change playback rate if voiceSpeed settings are adjusted significantly
                    if (voiceSpeed !== 1.0) {
                        audio.playbackRate = voiceSpeed;
                    }

                    // Play and catch errors to let fallback handle them if it strictly refuses
                    try {
                        await audio.play();
                        return; // Success, skip fallback
                    } catch (e) {
                        console.error('[VoiceAssistant] Audio playback blocked or failed', e);
                    }
                } else {
                    let errorMessage = 'Unknown Server Error';
                    try {
                        const errData = await response.json();
                        errorMessage = errData.error || errorMessage;
                    } catch (e) { }
                    throw new Error(errorMessage);
                }
            } catch (error) {
                console.error('[VoiceAssistant] Backend TTS failed, falling back to browser synthesis. Reason:', error.message);
                // Optionally let the primitive voice read the reason instead if it's a hard API block
                if (error.message.includes("API Error")) {
                    text = "My custom voice engine is currently unavailable. " + error.message.replace("ElevenLabs API Error: ", "");
                }
            }
        } // Close isPremiumSelected block

        // FALLBACK: If backend fails or is missing API keys, use browser browser TTS
        if (!synthRef.current) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.speed || voiceSpeed || 0.95;
        utterance.pitch = options.pitch || 0.85;
        utterance.volume = options.volume || 1.0;

        const voices = synthRef.current.getVoices();
        let ezraVoice = voices.find(v => v.name.includes('Microsoft Christopher Online') || v.name.includes('Google US English Male'));
        if (!ezraVoice) ezraVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('male')) || voices.find(v => v.lang.startsWith('en'));
        if (ezraVoice) utterance.voice = ezraVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [voiceSpeed, selectedVoice]);

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // ---- Command Parser ----
    const processCommand = useCallback(async (command) => {
        const cmd = command.toLowerCase().trim();
        setIsProcessing(true);
        setLastCommand(cmd);

        try {
            // Navigation commands
            if (cmd.startsWith('go to ') || cmd.startsWith('open ') || cmd.startsWith('navigate to ')) {
                const target = cmd.replace(/^(go to |open |navigate to )/, '').trim();
                const route = ROUTE_MAP[target];
                if (route) {
                    speak(`Navigating to ${target}.`);
                    setTimeout(() => navigate(route), 500);
                } else {
                    speak(`Sorry, I don't know the page called "${target}". You can say things like "go to messages" or "open tasks".`);
                }
                return;
            }

            // Read page content
            if (cmd.includes('read') && (cmd.includes('page') || cmd.includes('this') || cmd.includes('content'))) {
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    const text = mainContent.innerText.substring(0, 1000);
                    speak(`Here's what's on this page: ${text}`);
                } else {
                    speak("I couldn't find the main content on this page.");
                }
                return;
            }

            // Briefing / What's new
            if (cmd.includes("what's new") || cmd.includes('whats new') || cmd.includes('briefing') || cmd.includes('brief me') || cmd.includes('updates')) {
                speak("Let me check what's new for you...");
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/qomai/voice/briefing/`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        let briefing = "Here's your briefing: ";
                        if (data.unread_messages > 0) briefing += `You have ${data.unread_messages} unread messages. `;
                        if (data.pending_tasks > 0) briefing += `${data.pending_tasks} tasks pending. `;
                        if (data.upcoming_events?.length > 0) briefing += `Upcoming: ${data.upcoming_events[0]}. `;
                        if (data.new_announcements?.length > 0) briefing += `Latest announcement: ${data.new_announcements[0]}. `;
                        if (data.platform_updates) briefing += data.platform_updates;
                        if (briefing === "Here's your briefing: ") briefing += "Everything is quiet right now. No new updates!";
                        speak(briefing);
                    } else {
                        speak("I couldn't fetch your briefing right now. The server might be busy.");
                    }
                } catch {
                    speak("I couldn't connect to the server for your briefing. Please try again later.");
                }
                return;
            }

            // Create actions
            if (cmd.startsWith('create ') || cmd.startsWith('new ')) {
                const item = cmd.replace(/^(create |new )/, '').replace(/^a /, '').trim();
                if (item.includes('task')) {
                    speak("Opening the tasks page for you to create a new task.");
                    setTimeout(() => navigate('/tasks'), 500);
                } else if (item.includes('event')) {
                    speak("Opening the events page for you to create a new event.");
                    setTimeout(() => navigate('/events'), 500);
                } else if (item.includes('announcement')) {
                    speak("Opening announcements for you.");
                    setTimeout(() => navigate('/announcements'), 500);
                } else if (item.includes('message')) {
                    speak("Opening messages.");
                    setTimeout(() => navigate('/messages'), 500);
                } else {
                    speak(`I'm not sure how to create a "${item}". Try "create a task" or "new event".`);
                }
                return;
            }

            // Send message
            if (cmd.startsWith('send message') || cmd.startsWith('message ')) {
                speak("Opening your messages.");
                setTimeout(() => navigate('/messages'), 500);
                return;
            }

            // Toggle off
            if (cmd.includes('turn off') || cmd.includes('stop listening') || cmd.includes('disable') || cmd.includes('go away') || cmd.includes('shut down')) {
                speak("Turning off voice assistant. You can re-enable me from settings or the floating button.");
                setTimeout(() => setIsEnabled(false), 2000);
                return;
            }

            // Help
            if (cmd.includes('help') || cmd.includes('what can you do')) {
                speak("I can navigate pages for you. Try 'go to messages'. I can read this page. I can brief you on updates, say 'what's new'. I can create tasks or events. And you can turn me off by saying 'turn off'.");
                return;
            }

            // Current page
            if (cmd.includes('where am i') || cmd.includes('what page')) {
                const path = location.pathname;
                speak(`You are currently on ${path === '/' ? 'the home page' : path.replace(/\//g, ' ').trim()}.`);
                return;
            }

            // Fallback
            speak(`I heard "${command}" but I'm not sure how to help with that. Say "help" to learn what I can do.`);

        } finally {
            setIsProcessing(false);
        }
    }, [speak, navigate, location]);

    // ---- Speech Recognition (STT) ----
    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition not supported in this browser.');
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            if (!lastResult.isFinal) return;

            const transcript = lastResult[0].transcript.toLowerCase().trim();
            console.log('[VoiceAssistant] Heard:', transcript);

            // Check if transcript contains the wake phrase
            if (transcript.includes(wakePhrase)) {
                // Extract the command after the wake phrase
                const commandPart = transcript.split(wakePhrase).pop()?.trim();
                if (commandPart && commandPart.length > 2) {
                    processCommand(commandPart);
                } else {
                    speak("Yes? How can I help you?");
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn('[VoiceAssistant] Recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setIsEnabled(false);
                setIsListening(false);
            } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
                // Auto-restart on non-critical errors
                setTimeout(() => {
                    if (isEnabled) startListening();
                }, 1000);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Auto-restart continuous listening if still enabled
            if (isEnabled) {
                setTimeout(() => {
                    if (isEnabled) startListening();
                }, 500);
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e) {
            console.warn('[VoiceAssistant] Failed to start recognition:', e);
        }
    }, [wakePhrase, isEnabled, processCommand, speak]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // ---- Enable/Disable toggle ----
    const toggleAssistant = useCallback(() => {
        setIsEnabled(prev => !prev);
    }, []);

    // ---- Start/stop listening based on enabled state ----
    useEffect(() => {
        if (isEnabled && user) {
            startListening();
        } else {
            stopListening();
            stopSpeaking();
        }

        return () => {
            stopListening();
        };
    }, [isEnabled, user]);

    // ---- Welcome greeting on fresh login ----
    useEffect(() => {
        if (justLoggedIn && user && isEnabled && !greetedRef.current) {
            greetedRef.current = true;
            const firstName = user.first_name || user.email?.split('@')[0] || 'there';
            const phraseDisplay = wakePhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            // Small delay so the UI settles first
            const timer = setTimeout(() => {
                speak(
                    `Welcome back, ${firstName}! I'm Comrade, your AI assistant. ` +
                    `I'll keep you updated on what's happening. ` +
                    `Say "${phraseDisplay}" anytime you need help. ` +
                    `You can ask me to navigate pages, read content, or brief you on updates.`
                );
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [justLoggedIn, user, isEnabled, speak, wakePhrase]);

    // Reset greet flag on logout
    useEffect(() => {
        if (!user) {
            greetedRef.current = false;
        }
    }, [user]);

    // ---- Screen Reader announcements for route changes ----
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        // Announce page changes for screen readers
        const pageName = location.pathname === '/' ? 'Home' :
            location.pathname.replace(/\//g, ' ').replace(/-/g, ' ').trim();
        setAnnouncement(`Navigated to ${pageName}`);
    }, [location.pathname]);

    // ---- Context value ----
    const value = {
        // State
        isEnabled,
        setIsEnabled,
        isListening,
        isProcessing,
        isSpeaking,
        lastCommand,
        lastResponse,

        // Preferences
        wakePhrase,
        setWakePhrase,
        voiceSpeed,
        setVoiceSpeed,
        selectedVoice,
        setSelectedVoice,
        availableVoices,
        wakePhraseOptions: WAKE_PHRASE_OPTIONS,

        // Actions
        speak,
        stopSpeaking,
        toggleAssistant,
        processCommand,

        // Screen reader
        announcement,
    };

    return (
        <VoiceAssistantContext.Provider value={value}>
            {children}
            {/* Global screen reader live region */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0e0e0e0)',
                    whiteSpace: 'nowrap',
                    borderWidth: 0,
                }}
            >
                {announcement}
            </div>
        </VoiceAssistantContext.Provider>
    );
};

export default VoiceAssistantContext;
