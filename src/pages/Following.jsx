import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Users, UserPlus, UserMinus, Search, Sparkles, ChevronRight } from 'lucide-react';
import opinionsService from '../services/opinions.service';

const Following = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('suggestions');
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'followers') {
                const data = await opinionsService.getFollowers();
                setFollowers(Array.isArray(data) ? data : []);
            } else if (activeTab === 'following') {
                const data = await opinionsService.getFollowing();
                setFollowing(Array.isArray(data) ? data : []);
            } else {
                const data = await opinionsService.getSuggestions();
                setSuggestions(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (userId, currentlyFollowing) => {
        try {
            await opinionsService.toggleFollow(userId);

            // Update local state
            if (activeTab === 'suggestions') {
                setSuggestions(suggestions.map(u =>
                    u.id === userId ? { ...u, is_following: !currentlyFollowing } : u
                ));
            } else if (activeTab === 'followers') {
                setFollowers(followers.map(u =>
                    u.id === userId ? { ...u, is_following: !currentlyFollowing } : u
                ));
            } else if (activeTab === 'following') {
                if (currentlyFollowing) {
                    // Remove from following list
                    setFollowing(following.filter(u => u.id !== userId));
                }
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const getCurrentList = () => {
        let list = [];
        if (activeTab === 'followers') list = followers;
        else if (activeTab === 'following') list = following;
        else list = suggestions;

        if (searchQuery) {
            return list.filter(u =>
                u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    };

    const filteredList = getCurrentList();

    const tabs = [
        { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
        { id: 'followers', label: 'Followers', icon: Users },
        { id: 'following', label: 'Following', icon: UserPlus },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Connect</h1>
                <p className="text-secondary">Discover people and grow your network</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-elevated/50 border border-theme rounded-xl">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                                ? 'bg-elevated text-primary shadow-sm border border-theme'
                                : 'text-secondary hover:text-primary hover:bg-secondary/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-elevated border border-theme rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-primary placeholder-secondary transition-all"
                />
            </div>

            {/* List */}
            <Card>
                <CardBody className="p-0 divide-y divide-theme">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <Users className="w-16 h-16 text-tertiary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-primary mb-2">
                                {activeTab === 'suggestions' ? 'No suggestions' :
                                    activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
                            </h3>
                            <p className="text-secondary">
                                {activeTab === 'suggestions'
                                    ? 'Check back later for new people to follow'
                                    : activeTab === 'followers'
                                        ? 'Share your opinions to attract followers'
                                        : 'Find interesting people to follow'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredList.map((person) => (
                            <UserCard
                                key={person.id}
                                user={person}
                                onFollow={() => handleFollow(person.id, person.is_following)}
                                currentUserId={user?.id}
                            />
                        ))
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

const UserCard = ({ user, onFollow, currentUserId }) => {
    const isOwnProfile = user.id === currentUserId;

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-secondary/5 transition-colors">
            {/* Avatar */}
            <Link to={`/profile/${user.id}`} className="shrink-0 relative">
                {user.avatar || user.profile_picture ? (
                    <img
                        src={user.avatar || user.profile_picture}
                        alt={user.first_name || 'User'}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl border-2 border-primary">
                        {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                )}
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.id}`} className="block">
                    <h3 className="font-bold text-primary hover:underline truncate">
                        {user.full_name || user.first_name || user.email}
                    </h3>
                    <p className="text-sm text-secondary truncate">@{user.email?.split('@')[0]}</p>
                </Link>
                {user.bio && (
                    <p className="text-sm text-secondary mt-1 line-clamp-2">{user.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-secondary">
                    <span><strong className="text-primary">{user.followers_count || 0}</strong> followers</span>
                    <span><strong className="text-primary">{user.following_count || 0}</strong> following</span>
                </div>
            </div>

            {/* Follow Button */}
            {!isOwnProfile && (
                <Button
                    variant={user.is_following ? 'outline' : 'primary'}
                    onClick={onFollow}
                    className="shrink-0 rounded-full px-5"
                >
                    {user.is_following ? (
                        <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            Unfollow
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Follow
                        </>
                    )}
                </Button>
            )}
        </div>
    );
};

export default Following;
