/**
 * EventActions Component
 * Provides reaction buttons, sharing, pinning, and more actions for events
 */
import React, { useState } from 'react';
import {
    Heart, ThumbsUp, Star, Calendar, Share2, Pin, MoreVertical,
    AlertCircle, Flag, Copy, Facebook, Twitter, Linkedin, Mail
} from 'lucide-react';
import eventsService from '../../services/events.service';

const EventActions = ({ event, onUpdate }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [userReaction, setUserReaction] = useState(null);
    const [isPinned, setIsPinned] = useState(false);
    const [isInterested, setIsInterested] = useState(false);

    const reactions = [
        { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-600' },
        { type: 'love', icon: Heart, label: 'Love', color: 'text-red-600' },
        { type: 'excited', icon: Star, label: 'Excited', color: 'text-yellow-600' },
        { type: 'attending', icon: Calendar, label: 'Attending', color: 'text-green-600' },
    ];

    const handleReaction = async (reactionType) => {
        try {
            if (userReaction === reactionType) {
                await eventsService.removeReaction(event.id);
                setUserReaction(null);
            } else {
                await eventsService.addReaction(event.id, reactionType);
                setUserReaction(reactionType);
            }
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update reaction:', error);
        }
    };

    const handleInterested = async () => {
        try {
            await eventsService.markInterested(event.id, { interested: !isInterested });
            setIsInterested(!isInterested);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to mark interested:', error);
        }
    };

    const handlePin = async () => {
        try {
            if (isPinned) {
                await eventsService.unpinEvent(event.id);
            } else {
                await eventsService.pinEvent(event.id);
            }
            setIsPinned(!isPinned);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to pin event:', error);
        }
    };

    const handleShare = async (platform) => {
        try {
            if (platform === 'link') {
                const link = await eventsService.generateShareLink(event.id);
                await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}?ref=${link.data.token}`);
                alert('Link copied to clipboard!');
            } else {
                await eventsService.shareEvent(event.id, { share_type: platform });
                // Handle platform-specific sharing
                const shareUrl = `${window.location.origin}/events/${event.id}`;
                const text = `Check out this event: ${event.name}`;

                const shareUrls = {
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
                    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                };

                if (shareUrls[platform]) {
                    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
                }
            }
            setShowShareMenu(false);
        } catch (error) {
            console.error('Failed to share event:', error);
        }
    };

    const handleReport = async () => {
        const reason = prompt('Please describe why you are reporting this event:');
        if (reason) {
            try {
                await eventsService.reportEvent(event.id, {
                    report_type: 'other',
                    description: reason
                });
                alert('Report submitted. Thank you for helping keep our community safe.');
                setShowMoreMenu(false);
            } catch (error) {
                alert('Failed to submit report');
            }
        }
    };

    const handleBlock = async () => {
        if (confirm('Are you sure you want to block this event from your feed?')) {
            try {
                await eventsService.blockEvent(event.id);
                alert('Event blocked from your feed');
                setShowMoreMenu(false);
                onUpdate?.();
            } catch (error) {
                alert('Failed to block event');
            }
        }
    };

    return (
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
            {/* Reactions */}
            <div className="flex items-center gap-2">
                {reactions.map(({ type, icon: Icon, label, color }) => (
                    <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${userReaction === type
                                ? `${color} bg-opacity-10`
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        title={label}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Interested */}
                <button
                    onClick={handleInterested}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isInterested
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Star className={`w-4 h-4 inline mr-1 ${isInterested ? 'fill-current' : ''}`} />
                    Interested
                </button>

                {/* Pin */}
                <button
                    onClick={handlePin}
                    className={`p-2 rounded-lg transition-all ${isPinned ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    title="Pin to dashboard"
                >
                    <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                </button>

                {/* Share */}
                <div className="relative">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                        title="Share event"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>

                    {showShareMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={() => handleShare('facebook')}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Facebook className="w-4 h-4 text-blue-600" />
                                <span>Facebook</span>
                            </button>
                            <button
                                onClick={() => handleShare('twitter')}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Twitter className="w-4 h-4 text-sky-500" />
                                <span>Twitter</span>
                            </button>
                            <button
                                onClick={() => handleShare('linkedin')}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Linkedin className="w-4 h-4 text-blue-700" />
                                <span>LinkedIn</span>
                            </button>
                            <button
                                onClick={() => handleShare('link')}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4 text-gray-600" />
                                <span>Copy Link</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* More Options */}
                <div className="relative">
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMoreMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={handleReport}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                            >
                                <Flag className="w-4 h-4" />
                                <span>Report Event</span>
                            </button>
                            <button
                                onClick={handleBlock}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span>Block Event</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventActions;
