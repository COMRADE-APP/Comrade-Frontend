import React, { useState } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, Zap, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoiceAssistant } from '../../contexts/VoiceAssistantContext';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';

const VoiceSettings = () => {
    const navigate = useNavigate();
    const {
        isEnabled,
        setIsEnabled,
        isListening,
        wakePhrase,
        setWakePhrase,
        voiceSpeed,
        setVoiceSpeed,
        selectedVoice,
        setSelectedVoice,
        availableVoices,
        wakePhraseOptions,
        speak,
    } = useVoiceAssistant();

    const [customPhrase, setCustomPhrase] = useState('');
    const [showCustom, setShowCustom] = useState(!wakePhraseOptions.includes(wakePhrase));

    const handleTestVoice = () => {
        const phraseDisplay = wakePhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        speak(`Hello! I'm Comrade, your AI assistant. Say "${phraseDisplay}" to activate me.`);
    };

    const handleSetCustomPhrase = () => {
        if (customPhrase.trim().length >= 2) {
            setWakePhrase(customPhrase.trim());
        }
    };

    return (
        <div className="space-y-6" role="main" aria-label="Voice Assistant Settings">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="border-theme text-secondary hover:text-primary"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                        <Mic className="w-8 h-8 mr-3 text-emerald-500" />
                        Voice Assistant Settings
                    </h1>
                    <p className="text-secondary mt-1">Configure your Comrade AI voice assistant preferences.</p>
                </div>
            </div>

            {/* Enable/Disable Toggle */}
            <Card>
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {isEnabled ? (
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Mic className="w-6 h-6 text-emerald-500" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center">
                                    <MicOff className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-primary">Voice Assistant</h2>
                                <p className="text-sm text-secondary">
                                    {isEnabled ? (isListening ? 'Active and listening for your wake phrase' : 'Enabled but not actively listening') : 'Disabled — enable to use voice commands'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEnabled(!isEnabled)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${isEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            role="switch"
                            aria-checked={isEnabled}
                            aria-label="Toggle voice assistant"
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-8' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </CardBody>
            </Card>

            {/* Wake Phrase */}
            <Card>
                <CardHeader className="p-4 border-b border-theme">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Activation Phrase
                    </h2>
                    <p className="text-sm text-secondary mt-1">
                        Choose the phrase you say to activate the assistant. Say it followed by your command.
                    </p>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                    {wakePhraseOptions.map((phrase) => {
                        const display = phrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        return (
                            <label key={phrase} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                                <input
                                    type="radio"
                                    name="wakePhrase"
                                    checked={wakePhrase === phrase && !showCustom}
                                    onChange={() => { setWakePhrase(phrase); setShowCustom(false); }}
                                    className="w-4 h-4 text-emerald-500 accent-emerald-500"
                                    aria-label={`Set wake phrase to ${display}`}
                                />
                                <span className="text-primary font-medium">"{display}"</span>
                            </label>
                        );
                    })}

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                        <input
                            type="radio"
                            name="wakePhrase"
                            checked={showCustom}
                            onChange={() => setShowCustom(true)}
                            className="w-4 h-4 text-emerald-500 accent-emerald-500"
                            aria-label="Use a custom wake phrase"
                        />
                        <span className="text-primary font-medium">Custom phrase</span>
                    </label>

                    {showCustom && (
                        <div className="flex gap-2 pl-7">
                            <input
                                type="text"
                                value={customPhrase}
                                onChange={(e) => setCustomPhrase(e.target.value)}
                                placeholder="Enter your custom phrase..."
                                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Custom wake phrase"
                            />
                            <Button
                                onClick={handleSetCustomPhrase}
                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                                disabled={customPhrase.trim().length < 2}
                            >
                                Set
                            </Button>
                        </div>
                    )}

                    <p className="text-xs text-secondary px-3">
                        Current phrase: <strong className="text-primary">{wakePhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong>
                    </p>
                </CardBody>
            </Card>

            {/* Voice Selection */}
            <Card>
                <CardHeader className="p-4 border-b border-theme">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-500" />
                        Voice & Speed
                    </h2>
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    {/* Voice selector */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1" htmlFor="voice-select">
                            Assistant Voice
                        </label>
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Select assistant voice"
                        >
                            <option value="">System Default</option>
                            {availableVoices
                                .filter(v => v.lang.startsWith('en'))
                                .map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Speed slider */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1" htmlFor="voice-speed">
                            Speech Speed: {voiceSpeed.toFixed(1)}x
                        </label>
                        <input
                            id="voice-speed"
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={voiceSpeed}
                            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            aria-label={`Speech speed: ${voiceSpeed.toFixed(1)}x`}
                        />
                        <div className="flex justify-between text-xs text-secondary">
                            <span>0.5x (Slow)</span>
                            <span>1.0x</span>
                            <span>2.0x (Fast)</span>
                        </div>
                    </div>

                    {/* Test button */}
                    <Button
                        onClick={handleTestVoice}
                        className="bg-purple-600 text-white hover:bg-purple-700 mt-2"
                        aria-label="Test voice"
                    >
                        <Zap className="w-4 h-4 mr-2" /> Test Voice
                    </Button>
                </CardBody>
            </Card>

            {/* Quick Commands Reference */}
            <Card>
                <CardHeader className="p-4 border-b border-theme">
                    <h2 className="text-lg font-bold text-primary">Voice Commands Reference</h2>
                </CardHeader>
                <CardBody className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" role="table" aria-label="List of voice commands">
                            <thead>
                                <tr className="border-b border-theme">
                                    <th className="text-left p-2 text-secondary font-semibold">Command</th>
                                    <th className="text-left p-2 text-secondary font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-primary">
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Go to [page]"</td><td className="p-2">Navigate to any page</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Read this page"</td><td className="p-2">Read aloud current page content</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"What's new?"</td><td className="p-2">Get briefing on messages, tasks, events</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Create a task"</td><td className="p-2">Open task creation</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Create an event"</td><td className="p-2">Open event creation</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Where am I?"</td><td className="p-2">Tell you which page you're on</td></tr>
                                <tr className="border-b border-theme/50"><td className="p-2 font-mono text-xs">"Help"</td><td className="p-2">List available commands</td></tr>
                                <tr><td className="p-2 font-mono text-xs">"Turn off"</td><td className="p-2">Disable voice assistant</td></tr>
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default VoiceSettings;
