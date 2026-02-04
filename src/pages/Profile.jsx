import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import {
    Camera, MapPin, Briefcase, Mail, Phone, Globe, LogOut,
    Edit2, MoreHorizontal, UserPlus, UserMinus, MessageCircle,
    Shield, Settings, Share2, Flag, Ban, X, Check, Loader2,
    Heart, MessageSquare, Repeat2, Bookmark, Users
} from 'lucide-react';
import profileService from '../services/profile.service';
import opinionsService from '../services/opinions.service';

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
    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState([]);
    const [followSuggestions, setFollowSuggestions] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

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
        { id: 'posts', label: 'Posts', count: userPosts.length },
        { id: 'replies', label: 'Replies' },
        { id: 'likes', label: 'Likes' },
        { id: 'media', label: 'Media' },
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
                    <div className="flex">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 px-4 text-sm font-medium text-center transition-colors ${activeTab === tab.id
                                    ? 'text-primary-600 border-b-2 border-primary-600'
                                    : 'text-tertiary hover:text-primary'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className="ml-1 text-xs text-tertiary">({tab.count})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <CardBody className="p-0">
                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                        <div className="divide-y divide-theme">
                            {loadingPosts ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                </div>
                            ) : userPosts.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-tertiary" />
                                    <p className="font-medium">No posts yet</p>
                                    <p className="text-sm">
                                        {isOwner ? "Share your first opinion!" : "This user hasn't posted anything yet."}
                                    </p>
                                </div>
                            ) : (
                                userPosts.map((post) => (
                                    <div key={post.id} className="p-4 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                                {profile.first_name?.[0]}{profile.last_name?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-primary">{profile.full_name}</span>
                                                    <span className="text-tertiary text-sm">·</span>
                                                    <span className="text-secondary text-sm">
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-primary mt-1">{post.content}</p>
                                                {post.media_url && (
                                                    <img
                                                        src={post.media_url}
                                                        alt="Post media"
                                                        className="mt-3 rounded-xl max-h-80 object-cover"
                                                    />
                                                )}
                                                <div className="flex items-center gap-6 mt-3 text-secondary">
                                                    <button
                                                        onClick={() => handleLikePost(post.id)}
                                                        className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.is_liked ? 'text-red-500' : ''}`}
                                                    >
                                                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                                        <span className="text-sm">{post.likes_count || 0}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span className="text-sm">{post.comments_count || 0}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                                                        <Repeat2 className="w-4 h-4" />
                                                        <span className="text-sm">{post.reposts_count || 0}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                                                        <Bookmark className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {activeTab !== 'posts' && (
                        <div className="text-center py-12 text-secondary">
                            <p>Coming soon</p>
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
