import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Settings, HelpCircle } from 'lucide-react';
import { useVoiceAssistant } from '../../contexts/VoiceAssistantContext';
import { useNavigate } from 'react-router-dom';

/**
 * Floating Voice Assistant Widget
 * Renders a glowing orb in the bottom-right corner.
 * - Green pulse when listening
 * - Blue spin when processing
 * - Purple glow when speaking
 * - Click to toggle, expand for quick actions
 */
const VoiceAssistantWidget = () => {
    const {
        isEnabled,
        isListening,
        isProcessing,
        isSpeaking,
        lastResponse,
        toggleAssistant,
        stopSpeaking,
        speak,
        wakePhrase,
    } = useVoiceAssistant();

    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const bubbleTimeout = useRef(null);

    // Show speech bubble when assistant responds
    useEffect(() => {
        if (lastResponse) {
            setShowBubble(true);
            if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
            bubbleTimeout.current = setTimeout(() => setShowBubble(false), 8000);
        }
        return () => {
            if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
        };
    }, [lastResponse]);

    // Determine orb state
    const getOrbClass = () => {
        if (!isEnabled) return 'va-orb va-orb--disabled';
        if (isProcessing) return 'va-orb va-orb--processing';
        if (isSpeaking) return 'va-orb va-orb--speaking';
        if (isListening) return 'va-orb va-orb--listening';
        return 'va-orb va-orb--idle';
    };

    const getStatusText = () => {
        if (!isEnabled) return 'Off';
        if (isProcessing) return 'Thinking...';
        if (isSpeaking) return 'Speaking';
        if (isListening) return 'Listening';
        return 'Ready';
    };

    const phraseDisplay = wakePhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <>
            {/* Speech Bubble */}
            {showBubble && lastResponse && isEnabled && (
                <div
                    className="va-speech-bubble"
                    role="alert"
                    aria-live="assertive"
                    onClick={() => setShowBubble(false)}
                >
                    <button
                        className="va-bubble-close"
                        onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
                        aria-label="Dismiss assistant message"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    <p className="va-bubble-text">{lastResponse.substring(0, 200)}{lastResponse.length > 200 ? '...' : ''}</p>
                </div>
            )}

            {/* Expanded Menu */}
            {isExpanded && (
                <div className="va-expanded-menu" role="menu" aria-label="Voice assistant actions">
                    <button
                        className="va-menu-item"
                        onClick={() => { toggleAssistant(); setIsExpanded(false); }}
                        role="menuitem"
                    >
                        {isEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>{isEnabled ? 'Turn Off' : 'Turn On'}</span>
                    </button>
                    {isSpeaking && (
                        <button
                            className="va-menu-item"
                            onClick={() => { stopSpeaking(); setIsExpanded(false); }}
                            role="menuitem"
                        >
                            <VolumeX className="w-4 h-4" />
                            <span>Stop Speaking</span>
                        </button>
                    )}
                    <button
                        className="va-menu-item"
                        onClick={() => { speak("I can help you navigate, read pages, get briefings, and manage tasks. Just say " + phraseDisplay + " followed by your command."); setIsExpanded(false); }}
                        role="menuitem"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Help</span>
                    </button>
                    <button
                        className="va-menu-item"
                        onClick={() => { navigate('/settings/voice'); setIsExpanded(false); }}
                        role="menuitem"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                </div>
            )}

            {/* Main Orb */}
            <div className="va-container" role="complementary" aria-label="Voice assistant">
                <button
                    className={getOrbClass()}
                    onClick={() => setIsExpanded(!isExpanded)}
                    onDoubleClick={() => !isProcessing && toggleAssistant()}
                    aria-label={`Voice assistant - ${getStatusText()}. Click for menu, double click to toggle`}
                    aria-pressed={isEnabled}
                    title={`Comrade Voice Assistant: ${getStatusText()}\nSay "${phraseDisplay}" to activate`}
                >
                    {isEnabled ? (
                        <Mic className="va-icon" aria-hidden="true" />
                    ) : (
                        <MicOff className="va-icon" aria-hidden="true" />
                    )}

                    {/* Ripple rings for listening state */}
                    {isListening && isEnabled && (
                        <>
                            <span className="va-ripple va-ripple--1" aria-hidden="true" />
                            <span className="va-ripple va-ripple--2" aria-hidden="true" />
                        </>
                    )}
                </button>

                {/* Status indicator dot */}
                <span
                    className={`va-status-dot ${isEnabled ? (isListening ? 'va-status-dot--active' : 'va-status-dot--ready') : 'va-status-dot--off'}`}
                    aria-hidden="true"
                />
            </div>

            <style>{`
                .va-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .va-container {
                        bottom: 80px;
                        right: 16px;
                    }
                }

                .va-orb {
                    position: relative;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
                    outline: none;
                }

                .va-orb:focus-visible {
                    outline: 3px solid #60a5fa;
                    outline-offset: 3px;
                }

                .va-orb--disabled {
                    background: linear-gradient(135deg, #374151, #4b5563);
                    opacity: 0.7;
                }

                .va-orb--idle {
                    background: linear-gradient(135deg, #1e40af, #3b82f6);
                }

                .va-orb--listening {
                    background: linear-gradient(135deg, #059669, #10b981);
                    animation: va-glow-green 2s infinite;
                }

                .va-orb--processing {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    animation: va-spin-glow 1s linear infinite;
                }

                .va-orb--speaking {
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    animation: va-glow-purple 1.5s infinite;
                }

                .va-orb:hover {
                    transform: scale(1.1);
                }

                .va-icon {
                    width: 24px;
                    height: 24px;
                    color: white;
                    z-index: 1;
                }

                /* Ripple animations */
                .va-ripple {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid rgba(16, 185, 129, 0.4);
                    animation: va-ripple-expand 2s infinite;
                    pointer-events: none;
                }
                .va-ripple--2 {
                    animation-delay: 0.7s;
                }

                @keyframes va-ripple-expand {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.5); opacity: 0; }
                }

                @keyframes va-glow-green {
                    0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.7); }
                }

                @keyframes va-glow-purple {
                    0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.7); }
                }

                @keyframes va-spin-glow {
                    0% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); transform: rotate(0deg); }
                    50% { box-shadow: 0 0 35px rgba(139, 92, 246, 0.7); }
                    100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); transform: rotate(360deg); }
                }

                .va-status-dot {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid var(--color-bg-primary, #1f2937);
                    transition: background 0.3s;
                }
                .va-status-dot--active { background: #10b981; }
                .va-status-dot--ready  { background: #3b82f6; }
                .va-status-dot--off    { background: #6b7280; }

                /* Speech Bubble */
                .va-speech-bubble {
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    max-width: 320px;
                    background: var(--color-bg-primary, #1f2937);
                    border: 1px solid var(--color-border, #374151);
                    border-radius: 16px;
                    border-bottom-right-radius: 4px;
                    padding: 12px 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 9998;
                    animation: va-bubble-in 0.3s ease-out;
                    cursor: pointer;
                }
                @media (max-width: 768px) {
                    .va-speech-bubble {
                        bottom: 150px;
                        right: 16px;
                        max-width: 280px;
                    }
                }

                .va-bubble-text {
                    color: var(--color-text-primary, #e5e7eb);
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 0;
                }

                .va-bubble-close {
                    position: absolute;
                    top: 4px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: var(--color-text-secondary, #9ca3af);
                    cursor: pointer;
                    padding: 2px;
                }

                @keyframes va-bubble-in {
                    0% { opacity: 0; transform: translateY(10px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Expanded Menu */
                .va-expanded-menu {
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    background: var(--color-bg-primary, #1f2937);
                    border: 1px solid var(--color-border, #374151);
                    border-radius: 12px;
                    padding: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    z-index: 9998;
                    animation: va-bubble-in 0.2s ease-out;
                    min-width: 180px;
                }

                @media (max-width: 768px) {
                    .va-expanded-menu {
                        bottom: 150px;
                        right: 16px;
                    }
                }

                .va-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    background: none;
                    border: none;
                    border-radius: 8px;
                    color: var(--color-text-primary, #e5e7eb);
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.15s;
                    text-align: left;
                }

                .va-menu-item:hover {
                    background: var(--color-bg-secondary, #374151);
                }

                .va-menu-item:focus-visible {
                    outline: 2px solid #60a5fa;
                    outline-offset: -2px;
                }

                /* Screen reader only utility */
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }
            `}</style>
        </>
    );
};

export default VoiceAssistantWidget;
