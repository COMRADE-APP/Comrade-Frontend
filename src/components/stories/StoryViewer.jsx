import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, MoreVertical, Heart, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import storiesService from '../../services/stories.service';

export default function StoryViewer({ stories, initialStoryIndex = 0, onClose, onNextUser, onPrevUser }) {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const videoRef = useRef(null);
    const progressInterval = useRef(null);

    const currentStory = stories[currentIndex];
    const user = currentStory?.user;

    useEffect(() => {
        // Mark as viewed
        if (currentStory && !currentStory.has_viewed) {
            storiesService.view(currentStory.id).catch(console.error);
        }
    }, [currentStory]);

    useEffect(() => {
        setProgress(0);

        if (currentStory.media_type === 'video') {
            // Video handles its own progress
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
            }
        } else {
            // Image/Text: Auto-advance after 5s
            startProgressTimer(5000);
        }

        return () => stopProgressTimer();
    }, [currentIndex, currentStory]);

    const startProgressTimer = (duration) => {
        stopProgressTimer();
        const interval = 50; // Update every 50ms
        const step = 100 / (duration / interval);

        progressInterval.current = setInterval(() => {
            if (!paused) {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 100;
                    }
                    return prev + step;
                });
            }
        }, interval);
    };

    const stopProgressTimer = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onNextUser?.();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            onPrevUser?.();
        }
    };

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const { currentTime, duration } = videoRef.current;
            if (duration) {
                setProgress((currentTime / duration) * 100);
            }
        }
    };

    const handleVideoEnded = () => {
        handleNext();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
            {/* Navigation Areas */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={handleNext} />

            {/* Center Content */}
            <div
                className="relative w-full max-w-md h-full md:h-[90vh] bg-black md:rounded-2xl overflow-hidden shadow-2xl"
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
            >
                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
                    {stories.map((story, idx) => (
                        <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                                animate={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
                                transition={{ duration: 0, ease: 'linear' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar_url || 'https://via.placeholder.com/40'}
                            alt={user?.full_name}
                            className="w-8 h-8 rounded-full border border-white/20"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none">{user?.full_name}</span>
                            <span className="text-xs opacity-70 leading-none mt-1">{currentStory.time_ago}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 z-40"> {/* Ensure buttons are above tap areas */}
                        <button className="p-2 hover:bg-white/10 rounded-full">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    {currentStory.media_type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentStory.media_url}
                            className="w-full h-full object-contain"
                            playsInline
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                            muted={false} // Start unmuted if possible, or handle via user interaction
                        />
                    ) : currentStory.media_type === 'image' ? (
                        <img
                            src={currentStory.media_url}
                            alt="Story"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center p-8 text-center"
                            style={{ backgroundColor: currentStory.background_color || '#1a1a2e' }}
                        >
                            <p className="text-white text-2xl font-bold">{currentStory.caption}</p>
                        </div>
                    )}
                </div>

                {/* Footer / Caption */}
                {(currentStory.media_type !== 'text' && currentStory.caption) && (
                    <div className="absolute bottom-20 left-4 right-4 z-30 text-center">
                        <p className="text-white text-center bg-black/50 inline-block px-4 py-2 rounded-xl text-sm backdrop-blur-sm">
                            {currentStory.caption}
                        </p>
                    </div>
                )}

                {/* Reply Bar */}
                <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Send message..."
                        className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/50 focus:border-white focus:outline-none backdrop-blur-sm"
                    />
                    <button className="p-2 text-white hover:bg-white/10 rounded-full">
                        <Heart className="w-6 h-6" />
                    </button>
                    <button className="p-2 text-white hover:bg-white/10 rounded-full">
                        <Send className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
