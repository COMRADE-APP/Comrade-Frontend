import React, { useState, useRef, useEffect } from 'react';
import { Image, Video, FileText, X, Send, Globe, Users, Lock, Hash, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import roomsService from '../../services/rooms.service';

/**
 * OpinionComposer - Create new opinions with media upload and room tagging
 */
const OpinionComposer = ({ onSubmit, maxChars = 500, isPremium = false }) => {
    const { user } = useAuth();
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
    const fileInputRef = useRef(null);

    const characterLimit = isPremium ? 5000 : 500;
    const remainingChars = characterLimit - content.length;

    // Load user's rooms for tagging
    useEffect(() => {
        const loadRooms = async () => {
            setLoadingRooms(true);
            try {
                const rooms = await roomsService.getMyRooms();
                // Filter rooms that allow opinion tagging
                setAvailableRooms(Array.isArray(rooms) ? rooms : rooms?.results || []);
            } catch (error) {
                console.error('Failed to load rooms:', error);
            } finally {
                setLoadingRooms(false);
            }
        };
        loadRooms();
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.slice(0, 4 - mediaFiles.length); // Max 4 files

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
                    file,
                    preview: null,
                    type: 'file',
                    name: file.name
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
            mediaFiles.forEach((media, i) => {
                formData.append('media', media.file);
            });

            // Add tagged room IDs
            if (taggedRooms.length > 0) {
                taggedRooms.forEach(room => {
                    formData.append('tagged_rooms', room.id);
                });
            }

            await onSubmit(formData);
            setContent('');
            setMediaFiles([]);
            setTaggedRooms([]);
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
            {/* User avatar and input */}
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0 overflow-hidden">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        (user?.first_name?.[0] || 'U').toUpperCase()
                    )}
                </div>

                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full resize-none border-0 focus:ring-0 text-primary placeholder-tertiary text-lg min-h-[80px] bg-transparent"
                        rows={3}
                    />

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
                                    <button
                                        onClick={() => removeRoomTag(room.id)}
                                        className="ml-1 hover:text-primary-900"
                                    >
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
                                                <div className="text-xs text-gray-400">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
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
