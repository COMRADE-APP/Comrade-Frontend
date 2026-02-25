import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Video, FileText, X, Send, Globe, Users, Lock, Hash, MessageSquare, Search, Building2, GraduationCap, User, EyeOff, Eye, AtSign, Quote } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import roomsService from '../../services/rooms.service';
import api from '../../services/api';

/**
 * OpinionComposer - Create new opinions with media upload, room tagging, and @-mentions
 * Supports entity authorship (post as personal, organisation, or institution)
 */
const OpinionComposer = ({ onSubmit, maxChars = 500, isPremium = false, quotedOpinion = null, onClearQuote = null }) => {
    const { user, activeProfile } = useAuth();
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [visibility, setVisibility] = useState('public');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVisibility, setShowVisibility] = useState(false);
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [taggedRooms, setTaggedRooms] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [roomSearchQuery, setRoomSearchQuery] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // @-mention state
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionResults, setMentionResults] = useState([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionLoading, setMentionLoading] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionStartPos, setMentionStartPos] = useState(-1);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const mentionDebounceRef = useRef(null);

    const characterLimit = isPremium ? 5000 : 500;
    const remainingChars = characterLimit - content.length;

    // Get profile icon based on type
    const getProfileIcon = () => {
        if (activeProfile?.type === 'organisation') return Building2;
        if (activeProfile?.type === 'institution') return GraduationCap;
        return User;
    };
    const ProfileIcon = getProfileIcon();

    // Get avatar display
    const getAvatarDisplay = () => {
        if (activeProfile?.avatar) {
            return <img src={activeProfile.avatar} alt="" className="w-full h-full object-cover" />;
        }
        if (activeProfile?.type !== 'personal') {
            return <ProfileIcon className="w-5 h-5" />;
        }
        if (user?.avatar_url) {
            return <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />;
        }
        return (user?.first_name?.[0] || 'U').toUpperCase();
    };

    // Load user's rooms for tagging
    useEffect(() => {
        const loadRooms = async () => {
            setLoadingRooms(true);
            try {
                const rooms = await roomsService.getMyRooms();
                setAvailableRooms(Array.isArray(rooms) ? rooms : rooms?.results || []);
            } catch (error) {
                console.error('Failed to load rooms:', error);
            } finally {
                setLoadingRooms(false);
            }
        };
        loadRooms();
    }, []);

    // @-mention search
    const searchMentions = useCallback(async (query) => {
        if (!query || query.length < 1) {
            setMentionResults([]);
            setShowMentionDropdown(false);
            return;
        }
        setMentionLoading(true);
        try {
            const response = await api.get('/auth/users/search/', { params: { q: query } });
            const results = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setMentionResults(results.slice(0, 8));
            setShowMentionDropdown(results.length > 0);
            setMentionIndex(0);
        } catch (err) {
            console.error('Mention search error:', err);
            setMentionResults([]);
        } finally {
            setMentionLoading(false);
        }
    }, []);

    // Detect @ trigger in the textarea
    const handleContentChange = (e) => {
        const value = e.target.value;
        setContent(value);

        const cursorPos = e.target.selectionStart;
        // Look backwards from cursor for an @ that starts a mention
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex >= 0) {
            const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
            // @ must be at start or preceded by whitespace
            if (lastAtIndex === 0 || /\s/.test(charBeforeAt)) {
                const query = textBeforeCursor.substring(lastAtIndex + 1);
                // Only trigger if query has no spaces (single word)
                if (query.length >= 1 && !/\s/.test(query)) {
                    setMentionStartPos(lastAtIndex);
                    setMentionQuery(query);
                    // Debounce the API call
                    if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current);
                    mentionDebounceRef.current = setTimeout(() => searchMentions(query), 250);
                    return;
                }
            }
        }

        // No active mention
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionStartPos(-1);
    };

    // Insert mention into content
    const insertMention = (mentionUser) => {
        const displayName = mentionUser.username || mentionUser.first_name || mentionUser.email?.split('@')[0] || 'user';
        const before = content.substring(0, mentionStartPos);
        const after = content.substring(mentionStartPos + 1 + mentionQuery.length);
        const newContent = `${before}@${displayName} ${after}`;
        setContent(newContent);

        // Track tagged user
        if (!taggedUsers.find(u => u.id === mentionUser.id)) {
            setTaggedUsers(prev => [...prev, { id: mentionUser.id, username: displayName, name: `${mentionUser.first_name || ''} ${mentionUser.last_name || ''}`.trim() }]);
        }

        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionStartPos(-1);

        // Re-focus textarea
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = mentionStartPos + displayName.length + 2; // +@ and space
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    // Keyboard nav for mention dropdown
    const handleTextareaKeyDown = (e) => {
        if (showMentionDropdown && mentionResults.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % mentionResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(mentionResults[mentionIndex]);
            } else if (e.key === 'Escape') {
                setShowMentionDropdown(false);
            }
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.slice(0, 4 - mediaFiles.length);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setMediaFiles(prev => [...prev, {
                    file,
                    preview: e.target.result,
                    type: file.type.startsWith('video') ? 'video' :
                        file.type.includes('gif') ? 'gif' :
                            file.type.startsWith('image') ? 'image' : 'file',
                    name: file.name
                }]);
            };
            if (file.type.startsWith('image') || file.type.startsWith('video')) {
                reader.readAsDataURL(file);
            } else {
                setMediaFiles(prev => [...prev, {
                    file, preview: null, type: 'file', name: file.name
                }]);
            }
        });
    };

    const removeFile = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleRoomTag = (room) => {
        if (taggedRooms.find(r => r.id === room.id)) {
            setTaggedRooms(prev => prev.filter(r => r.id !== room.id));
        } else {
            setTaggedRooms(prev => [...prev, room]);
        }
    };

    const removeRoomTag = (roomId) => {
        setTaggedRooms(prev => prev.filter(r => r.id !== roomId));
    };

    const removeTaggedUser = (userId) => {
        setTaggedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const filteredRooms = roomSearchQuery
        ? availableRooms.filter(room =>
            room.name.toLowerCase().includes(roomSearchQuery.toLowerCase())
        )
        : availableRooms;

    const handleSubmit = async () => {
        if (!content.trim() || content.length > characterLimit) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('visibility', visibility);
            mediaFiles.forEach((media) => {
                formData.append('media', media.file);
            });

            // Add tagged room IDs
            if (taggedRooms.length > 0) {
                taggedRooms.forEach(room => {
                    formData.append('tagged_rooms', room.id);
                });
            }

            // Add tagged user IDs (for @-mentions / notifications)
            if (taggedUsers.length > 0) {
                taggedUsers.forEach(u => {
                    formData.append('mentioned_users', u.id);
                });
            }

            // Add entity authorship based on active profile
            if (activeProfile?.type === 'organisation') {
                formData.append('organisation', activeProfile.id);
            } else if (activeProfile?.type === 'institution') {
                formData.append('institution', activeProfile.id);
            }

            if (isAnonymous) {
                formData.append('is_anonymous', 'true');
            }

            // Add quoted opinion
            if (quotedOpinion) {
                formData.append('quoted_opinion', quotedOpinion.id);
            }

            await onSubmit(formData);
            setContent('');
            setMediaFiles([]);
            setTaggedRooms([]);
            setTaggedUsers([]);
            setIsAnonymous(false);
        } catch (error) {
            console.error('Failed to post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibilityOptions = [
        { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can see' },
        { value: 'followers', label: 'Followers', icon: Users, desc: 'Only followers' },
        { value: 'only_me', label: 'Only me', icon: Lock, desc: 'Private' },
    ];

    const VisibilityIcon = visibilityOptions.find(v => v.value === visibility)?.icon || Globe;

    return (
        <div className="bg-elevated rounded-xl border border-theme p-4">
            {/* Posting as indicator */}
            {activeProfile && activeProfile.type !== 'personal' && (
                <div className="mb-3 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center gap-2 text-sm">
                    <ProfileIcon className="w-4 h-4 text-primary-600" />
                    <span className="text-primary-700 dark:text-primary-300">
                        Posting as <strong>{activeProfile.name}</strong>
                    </span>
                </div>
            )}

            {/* User avatar and input */}
            <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 overflow-hidden ${activeProfile?.type === 'organisation' ? 'bg-blue-500' :
                    activeProfile?.type === 'institution' ? 'bg-purple-500' :
                        'bg-gradient-to-br from-purple-400 to-blue-500'
                    }`}>
                    {getAvatarDisplay()}
                </div>

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={activeProfile?.type !== 'personal'
                            ? `What does ${activeProfile?.name} want to share?`
                            : "What's on your mind? Use @ to mention people"}
                        className="w-full resize-none border-0 focus:ring-0 text-primary placeholder-tertiary text-lg min-h-[80px] bg-transparent"
                        rows={3}
                    />

                    {/* @-mention dropdown */}
                    {showMentionDropdown && (
                        <div className="absolute left-0 right-0 z-30 bg-elevated rounded-lg shadow-lg border border-theme max-h-60 overflow-y-auto">
                            {mentionLoading ? (
                                <div className="p-3 text-center text-secondary text-sm">Searching...</div>
                            ) : (
                                mentionResults.map((u, idx) => (
                                    <button
                                        key={u.id}
                                        onClick={() => insertMention(u)}
                                        className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-secondary transition-colors ${idx === mentionIndex ? 'bg-secondary' : ''
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (u.first_name?.[0] || 'U').toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">
                                                {u.first_name} {u.last_name}
                                            </p>
                                            <p className="text-xs text-secondary truncate">
                                                @{u.username || u.email?.split('@')[0]}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tagged Rooms */}
                    {taggedRooms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {taggedRooms.map(room => (
                                <span
                                    key={room.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full text-sm"
                                >
                                    <MessageSquare size={14} />
                                    {room.name}
                                    <button onClick={() => removeRoomTag(room.id)} className="ml-1 hover:text-primary-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tagged Users (mentions) */}
                    {taggedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {taggedUsers.map(u => (
                                <span
                                    key={u.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm"
                                >
                                    <AtSign size={14} />
                                    {u.username}
                                    <button onClick={() => removeTaggedUser(u.id)} className="ml-1 hover:text-blue-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media previews */}
                    {mediaFiles.length > 0 && (
                        <div className={`grid gap-2 mt-2 ${mediaFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {mediaFiles.map((media, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden bg-secondary">
                                    {media.type === 'video' ? (
                                        <video src={media.preview} className="w-full h-32 object-cover" />
                                    ) : media.type === 'file' ? (
                                        <div className="flex items-center gap-2 p-3 bg-secondary">
                                            <FileText size={20} className="text-secondary" />
                                            <span className="text-sm text-primary truncate">{media.name}</span>
                                        </div>
                                    ) : (
                                        <img src={media.preview} alt="" className="w-full h-32 object-cover" />
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quoted Opinion Preview */}
            {quotedOpinion && (
                <div className="mt-3 border border-theme rounded-xl p-3 bg-secondary/30 relative">
                    <div className="flex items-center gap-2 mb-1">
                        <Quote size={14} className="text-primary-500" />
                        <span className="text-xs font-semibold text-primary-500">Quoting</span>
                        {onClearQuote && (
                            <button
                                onClick={onClearQuote}
                                className="ml-auto p-1 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                            {quotedOpinion.user?.avatar_url ? (
                                <img src={quotedOpinion.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                quotedOpinion.user?.first_name?.[0] || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary">
                                {quotedOpinion.user?.first_name} {quotedOpinion.user?.last_name}
                            </p>
                            <p className="text-xs text-secondary line-clamp-2 mt-0.5">
                                {quotedOpinion.content}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions row */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme">
                <div className="flex items-center gap-2">
                    {/* Media buttons */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        multiple
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={mediaFiles.length >= 4}
                        className="p-2 rounded-full hover:bg-secondary text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add media"
                    >
                        <Image size={20} />
                    </button>

                    {/* Room tagging button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowRoomPicker(!showRoomPicker)}
                            className={`p-2 rounded-full hover:bg-secondary ${taggedRooms.length > 0 ? 'text-primary-600' : 'text-secondary'}`}
                            title="Tag room"
                        >
                            <Hash size={20} />
                            {taggedRooms.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                    {taggedRooms.length}
                                </span>
                            )}
                        </button>

                        {showRoomPicker && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowRoomPicker(false)} />
                                <div className="absolute left-0 bottom-10 z-20 bg-elevated rounded-lg shadow-lg border border-theme w-64 max-h-80 overflow-hidden">
                                    <div className="p-2 border-b border-theme">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-tertiary" />
                                            <input
                                                type="text"
                                                value={roomSearchQuery}
                                                onChange={(e) => setRoomSearchQuery(e.target.value)}
                                                placeholder="Search rooms..."
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-theme rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-primary text-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-60">
                                        {loadingRooms ? (
                                            <div className="p-4 text-center text-secondary text-sm">Loading rooms...</div>
                                        ) : filteredRooms.length === 0 ? (
                                            <div className="p-4 text-center text-secondary text-sm">
                                                {roomSearchQuery ? 'No matching rooms' : 'No rooms available'}
                                            </div>
                                        ) : (
                                            filteredRooms.map(room => (
                                                <button
                                                    key={room.id}
                                                    onClick={() => toggleRoomTag(room)}
                                                    className={`w-full px-3 py-2 text-left hover:bg-secondary flex items-center gap-2 ${taggedRooms.find(r => r.id === room.id) ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                        <MessageSquare size={16} className="text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-primary truncate">{room.name}</p>
                                                        <p className="text-xs text-secondary">{room.member_count || 0} members</p>
                                                    </div>
                                                    {taggedRooms.find(r => r.id === room.id) && (
                                                        <span className="text-primary-600">✓</span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Visibility selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowVisibility(!showVisibility)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm text-secondary hover:bg-secondary"
                        >
                            <VisibilityIcon size={16} />
                            <span className="hidden sm:inline">{visibilityOptions.find(v => v.value === visibility)?.label}</span>
                        </button>

                        {showVisibility && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowVisibility(false)} />
                                <div className="absolute left-0 bottom-10 z-20 bg-elevated rounded-lg shadow-lg border border-theme py-1 w-48">
                                    {visibilityOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setVisibility(opt.value); setShowVisibility(false); }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-3 ${visibility === opt.value ? 'text-purple-600' : 'text-primary'}`}
                                        >
                                            <opt.icon size={16} />
                                            <div>
                                                <div className="font-medium">{opt.label}</div>
                                                <div className="text-xs text-secondary">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Anonymous toggle */}
                    <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isAnonymous
                            ? 'bg-gray-700 text-white'
                            : 'text-secondary hover:bg-secondary'
                            }`}
                        title={isAnonymous ? 'Posting anonymously' : 'Post with your identity'}
                    >
                        {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span className="hidden sm:inline">{isAnonymous ? 'Anonymous' : 'Visible'}</span>
                    </button>
                </div>

                {/* Character count and submit */}
                <div className="flex items-center gap-3">
                    <span className={`text-sm ${remainingChars < 50 ? remainingChars < 0 ? 'text-red-500' : 'text-yellow-500' : 'text-gray-400'}`}>
                        {remainingChars}
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || content.length > characterLimit || isSubmitting}
                        className="px-4 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Posting...' : (
                            <>
                                <Send size={16} />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpinionComposer;
