import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import OpinionCard from '../components/feed/OpinionCard';
import {
    Camera, MapPin, Briefcase, Mail, Phone, Globe, LogOut,
    Edit2, MoreHorizontal, UserPlus, UserMinus, MessageCircle,
    Shield, Settings, Share2, Flag, Ban, X, Check, Loader2,
    Heart, MessageSquare, Repeat2, Bookmark, Users,
    FileText, Layers, PenLine, Calendar, ClipboardList
} from 'lucide-react';
import profileService from '../services/profile.service';
import opinionsService from '../services/opinions.service';
import api from '../services/api';

const Profile = () => {
    const { id: urlUserId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [activeTab, setActiveTab] = useState('opinions');
    const [userPosts, setUserPosts] = useState([]);
    const [userReposts, setUserReposts] = useState([]);
    const [userLiked, setUserLiked] = useState([]);
    const [userCreated, setUserCreated] = useState([]);
    const [userDrafts, setUserDrafts] = useState([]);
    const [followSuggestions, setFollowSuggestions] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingTabData, setLoadingTabData] = useState(false);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        location: '',
        occupation: '',
        website: '',
        interests: [],
        show_email: 'followers',
        show_phone: 'private',
        allow_messages: 'followers',
        show_activity_status: true,
    });

    // Determine if viewing own profile
    const isOwner = !urlUserId || (currentUser && parseInt(urlUserId) === currentUser.id);

    useEffect(() => {
        loadProfile();
    }, [urlUserId, currentUser]);

    useEffect(() => {
        if (profile) {
            loadUserPosts();
            if (!isOwner) {
                loadFollowSuggestions();
            }
        }
    }, [profile, activeTab]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            let data;
            if (isOwner) {
                data = await profileService.getMyProfile();
            } else {
                data = await profileService.getProfile(urlUserId);
            }
            setProfile(data);
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                bio: data.bio || '',
                location: data.location || '',
                occupation: data.occupation || '',
                website: data.website || '',
                interests: data.interests || [],
                show_email: data.show_email || 'followers',
                show_phone: data.show_phone || 'private',
                allow_messages: data.allow_messages || 'followers',
                show_activity_status: data.show_activity_status ?? true,
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserPosts = async () => {
        if (!profile?.user_id) return;
        setLoadingPosts(true);
        try {
            const data = await opinionsService.getUserOpinions(profile.user_id);
            setUserPosts(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error loading user posts:', error);
            setUserPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadTabData = async (tab) => {
        if (!profile?.user_id) return;
        setLoadingTabData(true);
        try {
            switch (tab) {
                case 'reposts': {
                    const data = await api.get('/api/opinions/opinions/', { params: { user_id: profile.user_id, is_repost: true } });
                    const list = Array.isArray(data.data) ? data.data : data.data?.results || [];
                    setUserReposts(list);
                    break;
                }
                case 'likes': {
                    if (isOwner) {
                        const data = await opinionsService.getBookmarks();
                        setUserLiked(Array.isArray(data) ? data : data?.results || []);
                    } else {
                        setUserLiked([]);
                    }
                    break;
                }
                case 'created': {
                    const results = [];
                    try {
                        const [eventsRes, tasksRes, roomsRes] = await Promise.allSettled([
                            api.get('/api/events/events/', { params: { created_by: profile.user_id } }),
                            api.get('/api/tasks/tasks/', { params: { created_by: profile.user_id } }),
                            api.get('/api/rooms/rooms/', { params: { created_by: profile.user_id } }),
                        ]);
                        if (eventsRes.status === 'fulfilled') {
                            const events = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : eventsRes.value.data?.results || [];
                            results.push(...events.map(e => ({ ...e, _type: 'event' })));
                        }
                        if (tasksRes.status === 'fulfilled') {
                            const tasks = Array.isArray(tasksRes.value.data) ? tasksRes.value.data : tasksRes.value.data?.results || [];
                            results.push(...tasks.map(t => ({ ...t, _type: 'task' })));
                        }
                        if (roomsRes.status === 'fulfilled') {
                            const rooms = Array.isArray(roomsRes.value.data) ? roomsRes.value.data : roomsRes.value.data?.results || [];
                            results.push(...rooms.map(r => ({ ...r, _type: 'room' })));
                        }
                    } catch (err) { /* partial results are fine */ }
                    setUserCreated(results);
                    break;
                }
                case 'drafts': {
                    if (isOwner) {
                        try {
                            const data = await api.get('/api/opinions/opinions/', { params: { status: 'draft' } });
                            setUserDrafts(Array.isArray(data.data) ? data.data : data.data?.results || []);
                        } catch (err) { setUserDrafts([]); }
                    }
                    break;
                }
                default: break;
            }
        } catch (error) {
            console.error(`Error loading ${tab} data:`, error);
        } finally {
            setLoadingTabData(false);
        }
    };

    useEffect(() => {
        if (profile && activeTab !== 'opinions') {
            loadTabData(activeTab);
        }
    }, [activeTab, profile]);

    // Interaction handlers for OpinionCard on profile
    const handleRepost = async (opinionId, isCurrentlyReposted) => {
        if (isCurrentlyReposted) {
            if (!window.confirm('Undo repost?')) return;
        }
        try {
            const response = await opinionsService.toggleRepost(opinionId);
            const updateList = (list) => list.map(op => op.id === opinionId ? { ...op, is_reposted: response.reposted, reposts_count: response.reposts_count } : op);
            setUserPosts(updateList);
            setUserReposts(updateList);
            setUserLiked(updateList);
        } catch (error) { console.error('Error reposting:', error); }
    };

    const handleBookmark = async (opinionId) => {
        try {
            const response = await opinionsService.toggleBookmark(opinionId);
            const updateList = (list) => list.map(op => op.id === opinionId ? { ...op, is_bookmarked: response.bookmarked } : op);
            setUserPosts(updateList);
            setUserReposts(updateList);
            setUserLiked(updateList);
        } catch (error) { console.error('Error bookmarking:', error); }
    };

    const handleFollowUser = async (userId) => {
        try {
            await api.post('/api/opinions/follow/toggle/', { user_id: userId });
            const updateList = (list) => list.map(op => op.user?.id === userId ? { ...op, user: { ...op.user, is_following: !op.user.is_following } } : op);
            setUserPosts(updateList);
            setUserReposts(updateList);
            setUserLiked(updateList);
        } catch (error) { console.error('Error following:', error); }
    };

    const handleShare = async (opinion) => {
        const url = `${window.location.origin}/opinions/${opinion.id}`;
        if (navigator.share) {
            try { await navigator.share({ title: 'Check this out', text: opinion.content?.substring(0, 100), url }); } catch (err) { }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied!');
        }
    };

    const handleHide = async (opinionId) => {
        try {
            await api.post(`/api/opinions/opinions/${opinionId}/hide/`);
            setUserPosts(prev => prev.filter(op => op.id !== opinionId));
            setUserReposts(prev => prev.filter(op => op.id !== opinionId));
            setUserLiked(prev => prev.filter(op => op.id !== opinionId));
        } catch (error) { console.error('Error hiding:', error); }
    };

    const handleReport = async (opinionId) => {
        const reason = prompt('Why are you reporting this?');
        if (reason) {
            try { await api.post(`/api/opinions/opinions/${opinionId}/report/`, { reason: 'other', description: reason }); alert('Reported. Thank you.'); } catch (err) { }
        }
    };

    const handleBlock = async (userId) => {
        if (!confirm('Block this user?')) return;
        try {
            await api.post('/api/opinions/block/toggle/', { user_id: userId });
            setUserPosts(prev => prev.filter(op => op.user?.id !== userId));
        } catch (error) { console.error('Error blocking:', error); }
    };

    const handleOpenComments = (opinionId) => navigate(`/opinions/${opinionId}?focus=comment`);

    const loadFollowSuggestions = async () => {
        try {
            const data = await opinionsService.getFollowSuggestions();
            setFollowSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch (error) {
            console.error('Error loading follow suggestions:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await profileService.updateProfile(formData);
            setProfile(data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await profileService.uploadAvatar(file);
            setProfile(data);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar');
        }
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await profileService.uploadCover(file);
            setProfile(data);
        } catch (error) {
            console.error('Error uploading cover:', error);
            alert('Failed to upload cover');
        }
    };

    const handleFollow = async () => {
        if (!profile) return;
        try {
            await opinionsService.toggleFollow(profile.user_id);
            setProfile(prev => ({
                ...prev,
                is_following: !prev.is_following,
                followers_count: prev.is_following ? prev.followers_count - 1 : prev.followers_count + 1
            }));
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleFollowSuggestion = async (userId) => {
        try {
            await opinionsService.toggleFollow(userId);
            setFollowSuggestions(prev => prev.filter(s => s.id !== userId));
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const handleMessage = () => {
        if (profile?.allow_messages === 'none') {
            alert('This user does not accept messages');
            return;
        }
        navigate(`/messages?user=${profile.user_id}`);
    };

    const handleLikePost = async (postId) => {
        try {
            await opinionsService.toggleLike(postId);
            setUserPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked: !post.is_liked,
                        likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-bold text-gray-900">Profile not found</h2>
            </div>
        );
    }

    const TABS = [
        { id: 'opinions', label: 'Opinions', icon: PenLine, description: 'Thoughts & takes' },
        { id: 'reposts', label: 'Reposts', icon: Repeat2, description: 'Shared content' },
        { id: 'likes', label: 'Likes', icon: Heart, description: 'Liked posts' },
        { id: 'created', label: 'Created', icon: Layers, description: 'Events, tasks & more' },
        { id: 'drafts', label: 'Drafts', icon: FileText, description: 'Unpublished work' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Cover & Avatar Section */}
            <Card className="overflow-hidden">
                <div className="relative">
                    {/* Cover Photo */}
                    <div
                        className="h-48 md:h-64 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 relative"
                        style={profile.cover_url ? {
                            backgroundImage: `url(${profile.cover_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } : {}}
                    >
                        {isOwner && (
                            <>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    onChange={handleCoverUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-white" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Avatar */}
                    <div className="absolute -bottom-16 left-6 md:left-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-elevated p-1 shadow-xl">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 rounded-full transition-colors shadow-lg"
                                    >
                                        <Camera className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions (top right) */}
                    <div className="absolute -bottom-6 right-4 flex items-center gap-2">
                        {isOwner ? (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                            <X className="w-4 h-4 mr-1" /> Cancel
                                        </Button>
                                        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button
                                    variant={profile.is_following ? 'outline' : 'primary'}
                                    size="sm"
                                    onClick={handleFollow}
                                >
                                    {profile.is_following ? (
                                        <><UserMinus className="w-4 h-4 mr-1" /> Unfollow</>
                                    ) : (
                                        <><UserPlus className="w-4 h-4 mr-1" /> Follow</>
                                    )}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleMessage}>
                                    <MessageCircle className="w-4 h-4 mr-1" /> Message
                                </Button>
                            </>
                        )}

                        {/* Three-dot menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                                <MoreHorizontal className="w-5 h-5 text-secondary" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-elevated rounded-xl shadow-lg border border-theme py-2 z-50">
                                    {isOwner ? (
                                        <>
                                            <button
                                                onClick={() => { setShowPrivacySettings(true); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2"
                                            >
                                                <Shield className="w-4 h-4" /> Privacy Settings
                                            </button>
                                            <button
                                                onClick={() => { navigate('/settings'); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2"
                                            >
                                                <Settings className="w-4 h-4" /> Account Settings
                                            </button>
                                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2">
                                                <Share2 className="w-4 h-4" /> Share Profile
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2">
                                                <Share2 className="w-4 h-4" /> Share Profile
                                            </button>
                                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-secondary flex items-center gap-2">
                                                <Ban className="w-4 h-4" /> Block User
                                            </button>
                                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-red-600">
                                                <Flag className="w-4 h-4" /> Report
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <CardBody className="pt-20">
                    {/* Name & User Type */}
                    <div className="mb-4">
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Input
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-primary">
                                    {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                                </h1>
                                <p className="text-primary-600 font-medium capitalize">{profile.user_type?.replace('_', ' ')}</p>
                            </>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mb-4">
                        {profile.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span className="text-primary">{profile.email}</span>
                            </div>
                        )}
                        {profile.phone_number && (
                            <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span className="text-primary">{profile.phone_number}</span>
                            </div>
                        )}
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-primary">{profile.location}</span>
                            </div>
                        )}
                        {profile.occupation && (
                            <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span className="text-primary">{profile.occupation}</span>
                            </div>
                        )}
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                                <Globe className="w-4 h-4" />
                                <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                        )}
                    </div>

                    {/* Follower counts */}
                    <div className="flex items-center gap-6 text-sm mb-4">
                        <button className="hover:underline">
                            <span className="font-bold text-primary">{profile.following_count || 0}</span>
                            <span className="text-secondary ml-1">Following</span>
                        </button>
                        <button className="hover:underline">
                            <span className="font-bold text-primary">{profile.followers_count || 0}</span>
                            <span className="text-secondary ml-1">Followers</span>
                        </button>
                    </div>

                    {/* Bio */}
                    {isEditing ? (
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="3"
                            maxLength={500}
                            placeholder="Tell us about yourself..."
                            className="w-full px-4 py-3 border border-theme bg-primary text-primary placeholder-tertiary rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    ) : profile.bio ? (
                        <p className="text-primary">{profile.bio}</p>
                    ) : isOwner ? (
                        <p className="text-tertiary italic">Add a bio to tell people about yourself</p>
                    ) : null}

                    {/* Interests */}
                    {profile.interests?.length > 0 && !isEditing && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-tertiary uppercase mb-2">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest, i) => (
                                    <span key={i} className="px-3 py-1 bg-secondary text-primary rounded-full text-sm">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit fields for location, occupation, website */}
                    {isEditing && (
                        <div className="mt-4 space-y-4">
                            <Input
                                label="Location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, Country"
                            />
                            <Input
                                label="Occupation"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                placeholder="Your profession"
                            />
                            <Input
                                label="Website"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Content Tabs */}
            <Card>
                <div className="border-b border-theme">
                    <div className="flex overflow-x-auto">
                        {TABS.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 px-3 text-center transition-colors min-w-0 ${activeTab === tab.id
                                        ? 'text-primary-600 border-b-2 border-primary-600'
                                        : 'text-tertiary hover:text-primary'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 mx-auto mb-1" />
                                    <span className="text-xs font-medium block">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <CardBody className="p-0">
                    {/* Opinions Tab */}
                    {activeTab === 'opinions' && (
                        <div className="divide-y divide-theme">
                            {loadingPosts ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userPosts.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <PenLine className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">No opinions yet</p>
                                    <p className="text-sm">
                                        {isOwner ? "Share your first opinion!" : "This user hasn't posted anything yet."}
                                    </p>
                                </div>
                            ) : (
                                userPosts.map((post) => (
                                    <OpinionCard
                                        key={post.id}
                                        opinion={post}
                                        currentUser={currentUser}
                                        onLike={handleLikePost}
                                        onRepost={handleRepost}
                                        onBookmark={handleBookmark}
                                        onFollow={handleFollowUser}
                                        onShare={handleShare}
                                        onHide={handleHide}
                                        onReport={handleReport}
                                        onBlock={handleBlock}
                                        onOpenComments={handleOpenComments}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Reposts Tab */}
                    {activeTab === 'reposts' && (
                        <div className="divide-y divide-theme">
                            {loadingTabData ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userReposts.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Repeat2 className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">No reposts yet</p>
                                    <p className="text-sm">Content shared by {isOwner ? 'you' : 'this user'}</p>
                                </div>
                            ) : (
                                userReposts.map((post) => (
                                    <OpinionCard
                                        key={post.id}
                                        opinion={post}
                                        currentUser={currentUser}
                                        onLike={handleLikePost}
                                        onRepost={handleRepost}
                                        onBookmark={handleBookmark}
                                        onFollow={handleFollowUser}
                                        onShare={handleShare}
                                        onHide={handleHide}
                                        onReport={handleReport}
                                        onBlock={handleBlock}
                                        onOpenComments={handleOpenComments}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Likes Tab */}
                    {activeTab === 'likes' && (
                        <div className="divide-y divide-theme">
                            {!isOwner ? (
                                <div className="text-center py-12 text-secondary">
                                    <Heart className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">Likes are private</p>
                                    <p className="text-sm">Only the owner can see their liked posts</p>
                                </div>
                            ) : loadingTabData ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userLiked.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Heart className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">No liked posts</p>
                                    <p className="text-sm">Posts you've liked will appear here</p>
                                </div>
                            ) : (
                                userLiked.map((item) => {
                                    const post = item.opinion || item;
                                    return (
                                        <OpinionCard
                                            key={post.id}
                                            opinion={post}
                                            currentUser={currentUser}
                                            onLike={handleLikePost}
                                            onRepost={handleRepost}
                                            onBookmark={handleBookmark}
                                            onFollow={handleFollowUser}
                                            onShare={handleShare}
                                            onHide={handleHide}
                                            onReport={handleReport}
                                            onBlock={handleBlock}
                                            onOpenComments={handleOpenComments}
                                        />
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Created Tab */}
                    {activeTab === 'created' && (
                        <div className="divide-y divide-theme">
                            {loadingTabData ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userCreated.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <Layers className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">Nothing created yet</p>
                                    <p className="text-sm">Events, tasks, rooms created by {isOwner ? 'you' : 'this user'} will appear here</p>
                                </div>
                            ) : (
                                userCreated.map((item) => (
                                    <div key={`${item._type}-${item.id}`} className="p-4 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${item._type === 'event' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                                    item._type === 'task' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                                        'bg-gradient-to-br from-purple-500 to-violet-600'
                                                }`}>
                                                {item._type === 'event' ? <Calendar size={18} /> :
                                                    item._type === 'task' ? <ClipboardList size={18} /> :
                                                        <MessageSquare size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item._type === 'event' ? 'bg-blue-100 text-blue-700' :
                                                            item._type === 'task' ? 'bg-green-100 text-green-700' :
                                                                'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {item._type.charAt(0).toUpperCase() + item._type.slice(1)}
                                                    </span>
                                                    <span className="text-secondary text-xs">
                                                        {new Date(item.created_at || item.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-primary mt-1">{item.title || item.name}</p>
                                                {item.description && (
                                                    <p className="text-secondary text-sm mt-0.5 line-clamp-2">{item.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Drafts Tab */}
                    {activeTab === 'drafts' && (
                        <div className="divide-y divide-theme">
                            {!isOwner ? (
                                <div className="text-center py-12 text-secondary">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">Drafts are private</p>
                                </div>
                            ) : loadingTabData ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userDrafts.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">No drafts</p>
                                    <p className="text-sm">Your unpublished opinions will appear here</p>
                                </div>
                            ) : (
                                userDrafts.map((draft) => (
                                    <div key={draft.id} className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate(`/opinions/${draft.id}/edit`)}>
                                        <p className="text-primary font-medium line-clamp-2">{draft.content || 'Untitled draft'}</p>
                                        <p className="text-secondary text-xs mt-1">
                                            Last edited {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Follow Suggestions (for viewers) */}
            {!isOwner && followSuggestions.length > 0 && (
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            You might also like
                        </h2>
                        <div className="space-y-3">
                            {followSuggestions.map((user) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-primary">{user.first_name} {user.last_name}</p>
                                            <p className="text-sm text-secondary capitalize">{user.user_type?.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFollowSuggestion(user.id)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Follow
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Account Actions (Owner only) */}
            {isOwner && (
                <Card>
                    <CardBody>
                        <h2 className="text-lg font-semibold text-primary mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button variant="outline" onClick={() => navigate('/settings')}>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                            <Button variant="outline" onClick={() => setShowPrivacySettings(true)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Privacy
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/activity')}>
                                Activity
                            </Button>
                            <Button variant="danger" onClick={logout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Privacy Settings Modal */}
            {showPrivacySettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-theme">
                        <div className="p-6 border-b border-theme flex items-center justify-between">
                            <h2 className="text-xl font-bold text-primary">Privacy Settings</h2>
                            <button onClick={() => setShowPrivacySettings(false)} className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Who can see your email?</label>
                                <select
                                    name="show_email"
                                    value={formData.show_email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-theme bg-secondary text-primary rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="public">Everyone</option>
                                    <option value="followers">Followers Only</option>
                                    <option value="private">Only Me</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Who can see your phone?</label>
                                <select
                                    name="show_phone"
                                    value={formData.show_phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-theme bg-secondary text-primary rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="public">Everyone</option>
                                    <option value="followers">Followers Only</option>
                                    <option value="private">Only Me</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Who can message you?</label>
                                <select
                                    name="allow_messages"
                                    value={formData.allow_messages}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-theme bg-secondary text-primary rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="anyone">Anyone</option>
                                    <option value="followers">Followers Only</option>
                                    <option value="none">No One</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-primary">Show activity status</span>
                                <input
                                    type="checkbox"
                                    name="show_activity_status"
                                    checked={formData.show_activity_status}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-primary-600 rounded"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-theme flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowPrivacySettings(false)}>Cancel</Button>
                            <Button variant="primary" onClick={() => { handleSave(); setShowPrivacySettings(false); }} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
