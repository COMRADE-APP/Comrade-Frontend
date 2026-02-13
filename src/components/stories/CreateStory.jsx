import React, { useState, useRef } from 'react';
import { X, Image, Type, Send, Loader, Video, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import storiesService from '../../services/stories.service';

const BACKGROUND_COLORS = [
    '#1a1a2e', '#4a1e1e', '#1e4a1e', '#1e1e4a',
    '#4a1e4a', '#1e4a4a', '#4a4a1e', '#333333'
];

export default function CreateStory({ onClose, onSuccess }) {
    const [mode, setMode] = useState('media'); // 'media' or 'text'
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState('image'); // 'image', 'video'
    const [caption, setCaption] = useState('');
    const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size must be less than 10MB');
            return;
        }

        setError('');
        setMediaFile(file);

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setMediaType(type);

        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (mode === 'media' && !mediaFile) {
            setError('Please select an image or video');
            return;
        }
        if (mode === 'text' && !caption.trim()) {
            setError('Please enter some text');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();

            if (mode === 'media') {
                formData.append('media', mediaFile);
                formData.append('media_type', mediaType);
            } else {
                formData.append('media_type', 'text');
                formData.append('background_color', backgroundColor);
            }

            if (caption) {
                formData.append('caption', caption);
            }

            await storiesService.create(formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to create story. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                disabled={loading}
            >
                <X className="w-8 h-8" />
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh]"
            >
                {/* Header / Mode Switcher */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setMode('media')}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${mode === 'media' ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'
                            }`}
                        disabled={loading}
                    >
                        <Image className="w-4 h-4" />
                        Media
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${mode === 'text' ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'
                            }`}
                        disabled={loading}
                    >
                        <Type className="w-4 h-4" />
                        Text
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {mode === 'media' ? (
                        <>
                            {mediaPreview ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                                    {mediaType === 'video' ? (
                                        <video
                                            src={mediaPreview}
                                            className="max-w-full max-h-full object-contain"
                                            controls
                                            autoPlay
                                            loop
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={mediaPreview}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    )}
                                    <button
                                        onClick={() => {
                                            setMediaFile(null);
                                            setMediaPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        disabled={loading}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-32 h-32 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors border-2 border-dashed border-zinc-600 hover:border-primary"
                                    >
                                        <div className="text-center">
                                            <div className="flex justify-center gap-1 mb-1">
                                                <Image className="w-6 h-6 text-gray-400" />
                                                <Video className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-400">Upload</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">Click to upload photo or video</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*,video/*"
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center p-8 text-center"
                            style={{ backgroundColor }}
                        >
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Type something..."
                                className="w-full bg-transparent text-white text-2xl font-bold text-center placeholder-white/50 border-none focus:ring-0 resize-none outline-none overflow-hidden"
                                maxLength={200}
                                rows={4}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer / Controls */}
                <div className="p-4 bg-zinc-900 border-t border-white/10">
                    {error && (
                        <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
                    )}

                    {mode === 'text' && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {BACKGROUND_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setBackgroundColor(color)}
                                    className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${backgroundColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}

                    {mode === 'media' && mediaPreview && (
                        <div className="mb-4">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full bg-black/50 border-none rounded-lg text-white placeholder-gray-500 focus:ring-1 focus:ring-primary px-4 py-2 text-sm"
                                disabled={loading}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || (mode === 'media' && !mediaFile) || (mode === 'text' && !caption.trim())}
                        className="w-full py-3 bg-primary hover:bg-primary-600 disabled:bg-zinc-700 disabled:text-gray-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Share Story
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
