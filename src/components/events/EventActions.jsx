import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Heart, Star, Bell, Send, Pin, MoreVertical,
    AlertCircle, Flag, Copy, MessageCircle, Bird, Briefcase, CheckCircle2
} from 'lucide-react';
import eventsService from '../../services/events.service';
import { useToast } from '../../contexts/ToastContext';

const REMINDER_OPTIONS = [
    { value: '1h', label: '1 hour before' },
    { value: '2h', label: '2 hours before' },
    { value: '3h', label: '3 hours before' },
    { value: '6h', label: '6 hours before' },
    { value: '12h', label: '12 hours before' },
    { value: '1d', label: '1 day before' },
    { value: '2d', label: '2 days before' },
    { value: '1w', label: '1 week before' },
];

const EventActions = ({ event, onUpdate, onOpenReminders, compact = false }) => {
    const toast = useToast();
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showReminderMenu, setShowReminderMenu] = useState(false);
    const [userReaction, setUserReaction] = useState(event?.user_reaction || null);
    const [isPinned, setIsPinned] = useState(event?.is_pinned || false);
    const [isInterested, setIsInterested] = useState(event?.is_interested || false);
    const [breakdown, setBreakdown] = useState(event?.reactions_breakdown || {});
    const [interestedCount, setInterestedCount] = useState(event?.interested_count || 0);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [reminderSuccess, setReminderSuccess] = useState(null);

    const shareBtnRef = useRef(null);
    const moreBtnRef = useRef(null);
    const remindBtnRef = useRef(null);
    const [sharePos, setSharePos] = useState({ top: 0, left: 0 });
    const [morePos, setMorePos] = useState({ top: 0, left: 0 });
    const [remindPos, setRemindPos] = useState({ top: 0, left: 0 });

    const existingReminders = event?.user_reminder || [];
    const hasReminders = existingReminders.length > 0;
    const isReactionActive = (type) => type === 'remind_me' ? hasReminders : userReaction === type;

    useEffect(() => {
        if (!showReminderMenu && !showShareMenu && !showMoreMenu) return;
        const closeAll = () => {
            setShowReminderMenu(false);
            setShowShareMenu(false);
            setShowMoreMenu(false);
        };
        window.addEventListener('scroll', closeAll, true);
        return () => window.removeEventListener('scroll', closeAll, true);
    }, [showReminderMenu, showShareMenu, showMoreMenu]);

    const reactions = [
        { type: 'love', icon: Heart, label: 'Love', color: 'text-red-500', activeBg: 'bg-red-500/10' },
        { type: 'excited', icon: Star, label: 'Interested', color: 'text-yellow-500', activeBg: 'bg-yellow-500/10' },
        { type: 'remind_me', icon: Bell, label: 'Remind Me', color: 'text-blue-500', activeBg: 'bg-blue-500/10' },
    ];

    const handleReaction = async (reactionType, e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        if (reactionType === 'remind_me') {
            toggleReminderMenu();
            return;
        }

        const prevReaction = userReaction;
        const isRemoving = prevReaction === reactionType;
        setUserReaction(isRemoving ? null : reactionType);
        setBreakdown(prev => {
            const next = { ...prev };
            if (prevReaction) {
                next[prevReaction] = Math.max(0, (next[prevReaction] || 1) - 1);
            }
            if (!isRemoving) {
                next[reactionType] = (next[reactionType] || 0) + 1;
            }
            return next;
        });

        try {
            if (isRemoving) {
                await eventsService.removeReaction(event.id);
            } else {
                await eventsService.addReaction(event.id, reactionType);
            }
        } catch (error) {
            setUserReaction(prevReaction);
            setBreakdown({ ...(event?.reactions_breakdown || {}) });
            console.error('Failed to update reaction:', error);
        }
    };

    const toggleReminderMenu = () => {
        if (!showReminderMenu && remindBtnRef.current) {
            const rect = remindBtnRef.current.getBoundingClientRect();
            const left = Math.min(rect.right - 208, window.innerWidth - 216);
            setRemindPos({ top: rect.bottom + 8, left });
        }
        setShowReminderMenu(!showReminderMenu);
        setReminderSuccess(null);
    };

    const handleSetReminder = async (timeBefore) => {
        setReminderLoading(true);
        try {
            await eventsService.setUserReminder(event.id, timeBefore);
            setReminderSuccess(timeBefore);
            toast.success(`Reminder set for ${REMINDER_OPTIONS.find(o => o.value === timeBefore)?.label}`);
            setTimeout(() => setShowReminderMenu(false), 1500);
        } catch (err) {
            toast.error('Failed to set reminder');
        } finally {
            setReminderLoading(false);
        }
    };

    const handleInterested = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const next = !isInterested;
        setIsInterested(next);
        setInterestedCount(prev => next ? prev + 1 : Math.max(0, prev - 1));
        try {
            await eventsService.markInterested(event.id, { interested: next });
        } catch (error) {
            setIsInterested(!next);
            setInterestedCount(event?.interested_count || 0);
            console.error('Failed to mark interested:', error);
        }
    };

    const handlePin = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
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

    const toggleShareMenu = () => {
        if (!showShareMenu && shareBtnRef.current) {
            const rect = shareBtnRef.current.getBoundingClientRect();
            const left = Math.min(rect.right - 192, window.innerWidth - 208);
            setSharePos({ top: rect.bottom + 8, left });
        }
        setShowShareMenu(!showShareMenu);
        if (showMoreMenu) setShowMoreMenu(false);
        if (showReminderMenu) setShowReminderMenu(false);
    };

    const toggleMoreMenu = () => {
        if (!showMoreMenu && moreBtnRef.current) {
            const rect = moreBtnRef.current.getBoundingClientRect();
            const left = Math.min(rect.right - 192, window.innerWidth - 208);
            setMorePos({ top: rect.bottom + 8, left });
        }
        setShowMoreMenu(!showMoreMenu);
        if (showShareMenu) setShowShareMenu(false);
        if (showReminderMenu) setShowReminderMenu(false);
    };

    const handleShare = async (platform) => {
        try {
            if (platform === 'link') {
                const link = await eventsService.generateShareLink(event.id);
                const shareLink = `${window.location.origin}/events/${event.id}?ref=${link.data.token}`;
                try {
                    await navigator.clipboard.writeText(shareLink);
                } catch (err) {
                    const textArea = document.createElement('textarea');
                    textArea.value = shareLink;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
                toast.success('Link copied to clipboard!');
            } else {
                await eventsService.shareEvent(event.id, { share_type: platform });
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
                toast.success('Report submitted. Thank you for helping keep our community safe.');
                setShowMoreMenu(false);
            } catch (error) {
                toast.error('Failed to submit report');
            }
        }
    };

    const handleBlock = async () => {
        if (confirm('Are you sure you want to block this event from your feed?')) {
            try {
                await eventsService.blockEvent(event.id);
                toast.success('Event blocked from your feed');
                setShowMoreMenu(false);
                onUpdate?.();
            } catch (error) {
                toast.error('Failed to block event');
            }
        }
    };

    const reminderPicker = showReminderMenu && createPortal(
        <div
            className="fixed w-52 bg-elevated rounded-lg shadow-lg border border-theme py-2"
            style={{ top: remindPos.top, left: remindPos.left, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            <p className="px-3 py-1 text-xs font-semibold text-tertiary uppercase tracking-wide">Set Reminder</p>
            {reminderSuccess ? (
                <div className="flex items-center gap-2 px-3 py-4 text-primary-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Reminder set!</span>
                </div>
            ) : (
                REMINDER_OPTIONS.map(opt => {
                    const isSet = existingReminders.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleSetReminder(opt.value)}
                            disabled={reminderLoading || isSet}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center justify-between transition-colors ${isSet ? 'text-primary-600' : 'text-primary'}`}
                        >
                            <span>{opt.label}</span>
                            {isSet && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                        </button>
                    );
                })
            )}
        </div>,
        document.body
    );

    if (compact) {
        return (
            <div className="flex items-center gap-1 pt-2 border-t border-theme/20">
                {reactions.map(({ type, icon: Icon, label, color, activeBg }) => (
                    <button
                        key={type}
                        onClick={(e) => handleReaction(type, e)}
                        ref={type === 'remind_me' ? remindBtnRef : undefined}
                        className={`flex items-center gap-0.5 px-2 py-1 rounded-md transition-all text-xs ${isReactionActive(type)
                            ? `${color} ${activeBg}`
                            : 'text-tertiary hover:bg-secondary/40'
                            }`}
                        title={label}
                    >
                        <Icon className={`w-3.5 h-3.5 ${isReactionActive(type) ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">{label}</span>
                        {(breakdown[type] || 0) > 0 && (
                            <span className="text-[10px] font-medium">{breakdown[type]}</span>
                        )}
                    </button>
                ))}
                {reminderPicker}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between py-3 border-t border-b border-theme/30">
            <div className="flex items-center gap-2">
                {reactions.map(({ type, icon: Icon, label, color, activeBg }) => (
                    <button
                        key={type}
                        onClick={(e) => handleReaction(type, e)}
                        ref={type === 'remind_me' ? remindBtnRef : undefined}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${isReactionActive(type)
                            ? `${color} ${activeBg}`
                            : 'text-secondary hover:bg-secondary/50'
                            }`}
                        title={label}
                    >
                        <Icon className={`w-4 h-4 ${isReactionActive(type) ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium hidden sm:inline">{label}</span>
                        {(breakdown[type] || 0) > 0 && (
                            <span className="text-xs font-semibold ml-0.5">{breakdown[type]}</span>
                        )}
                    </button>
                ))}
                {reminderPicker}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePin}
                    className={`p-2 rounded-lg transition-all ${isPinned ? 'text-primary-600 bg-primary-500/10' : 'text-secondary hover:bg-secondary/50'
                        }`}
                    title="Pin to dashboard"
                >
                    <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                    ref={shareBtnRef}
                    onClick={toggleShareMenu}
                    className="p-2 rounded-lg text-secondary hover:bg-secondary/50 transition-all"
                    title="Share event"
                >
                    <Send className="w-4 h-4 -rotate-12" />
                </button>

                {showShareMenu && createPortal(
                    <div
                        className="fixed w-48 bg-elevated rounded-lg shadow-lg border border-theme py-1"
                        style={{ top: sharePos.top, left: sharePos.left, zIndex: 9999 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => handleShare('facebook')} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span>Facebook</span>
                        </button>
                        <button onClick={() => handleShare('twitter')} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2">
                            <Bird className="w-4 h-4 text-sky-500" />
                            <span>Twitter</span>
                        </button>
                        <button onClick={() => handleShare('linkedin')} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-700" />
                            <span>LinkedIn</span>
                        </button>
                        <button onClick={() => handleShare('link')} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2">
                            <Copy className="w-4 h-4 text-gray-600" />
                            <span>Copy Link</span>
                        </button>
                    </div>,
                    document.body
                )}

                <button
                    ref={moreBtnRef}
                    onClick={toggleMoreMenu}
                    className="p-2 rounded-lg text-secondary hover:bg-secondary/50 transition-all"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {showMoreMenu && createPortal(
                    <div
                        className="fixed w-48 bg-elevated rounded-lg shadow-lg border border-theme py-1"
                        style={{ top: morePos.top, left: morePos.left, zIndex: 9999 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={handleReport} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-orange-500">
                            <Flag className="w-4 h-4" />
                            <span>Report Event</span>
                        </button>
                        <button onClick={handleBlock} className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>Block Event</span>
                        </button>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default EventActions;
