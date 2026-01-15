import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Heart, MessageCircle, Repeat, Share, MoreHorizontal, Image as ImageIcon,
    Smile, MapPin, Globe, Lock, Users, Send, Bookmark, Sparkles, TrendingUp
} from 'lucide-react';
import opinionsService from '../services/opinions.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Everyone', icon: Globe },
    { value: 'followers', label: 'Followers', icon: Users },
    { value: 'only_me', label: 'Only me', icon: Lock },
];

const Opinions = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('for_you');
    const [opinions, setOpinions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [newOpinion, setNewOpinion] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const textareaRef = useRef(null);

    const MAX_CHARS = 500;

    useEffect(() => {
        loadOpinions();
    }, [activeTab]);

    const loadOpinions = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === 'following' && isAuthenticated) {
                data = await opinionsService.getFeed();
            } else if (activeTab === 'trending') {
                data = await opinionsService.getTrending();
            } else {
                data = await opinionsService.getAll();
            }
            const opinionsList = Array.isArray(data) ? data : (data?.results || []);
            setOpinions(opinionsList);
        } catch (error) {
            console.error('Error loading opinions:', error);
            setOpinions([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newOpinion.trim() || posting) return;

        setPosting(true);
        try {
            const response = await opinionsService.create({
                content: newOpinion.trim(),
                visibility,
            });
            setOpinions([response, ...opinions]);
            setNewOpinion('');
            setVisibility('public');
        } catch (error) {
            console.error('Error posting opinion:', error);
            alert('Failed to post opinion');
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (opinionId) => {
        try {
            const response = await opinionsService.toggleLike(opinionId);
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_liked: response.liked, likes_count: response.likes_count }
                    : op
            ));
        } catch (error) {
            console.error('Error liking:', error);
        }
    };

    const handleRepost = async (opinionId) => {
        try {
            const response = await opinionsService.toggleRepost(opinionId);
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_reposted: response.reposted, reposts_count: response.reposts_count }
                    : op
            ));
        } catch (error) {
            console.error('Error reposting:', error);
        }
    };

    const handleBookmark = async (opinionId) => {
        try {
            const response = await opinionsService.toggleBookmark(opinionId);
            setOpinions(opinions.map(op =>
                op.id === opinionId
                    ? { ...op, is_bookmarked: response.bookmarked }
                    : op
            ));
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const charactersLeft = MAX_CHARS - newOpinion.length;
    const isOverLimit = charactersLeft < 0;

    return (
        <div className="max-w-2xl mx-auto space-y-0">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex">
                    {[
                        { id: 'for_you', label: 'For You', icon: Sparkles },
                        { id: 'following', label: 'Following', icon: Users },
                        { id: 'trending', label: 'Trending', icon: TrendingUp },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 text-sm font-medium relative transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Composer */}
            {isAuthenticated && (
                <div className="bg-white border-b border-gray-100 p-4">
                    <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {user?.first_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                            <textarea
                                ref={textareaRef}
                                value={newOpinion}
                                onChange={(e) => {
                                    setNewOpinion(e.target.value);
                                    autoResize();
                                }}
                                placeholder="What's on your mind?"
                                className="w-full resize-none border-0 focus:ring-0 text-xl placeholder-gray-400 outline-none min-h-[80px]"
                                rows={1}
                            />

                            {/* Visibility selector */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                                <div className="flex items-center gap-1">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                                            className="flex items-center gap-1 text-primary-500 text-sm font-medium hover:bg-primary-50 px-2 py-1 rounded-full"
                                        >
                                            {VISIBILITY_OPTIONS.find(v => v.value === visibility)?.icon && (
                                                React.createElement(VISIBILITY_OPTIONS.find(v => v.value === visibility).icon, { className: 'w-4 h-4' })
                                            )}
                                            {VISIBILITY_OPTIONS.find(v => v.value === visibility)?.label}
                                        </button>
                                        {showVisibilityMenu && (
                                            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-48">
                                                {VISIBILITY_OPTIONS.map((option) => {
                                                    const Icon = option.icon;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => {
                                                                setVisibility(option.value);
                                                                setShowVisibilityMenu(false);
                                                            }}
                                                            className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${visibility === option.value ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                                                                }`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-full">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-full">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-sm ${isOverLimit ? 'text-red-500' : charactersLeft < 50 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                        {charactersLeft}
                                    </span>
                                    <Button
                                        variant="primary"
                                        onClick={handlePost}
                                        disabled={!newOpinion.trim() || isOverLimit || posting}
                                        className="rounded-full px-5"
                                    >
                                        {posting ? 'Posting...' : 'Post'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Opinions Feed */}
            <div className="divide-y divide-gray-100">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : opinions.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No opinions yet</h3>
                        <p className="text-gray-500">
                            {activeTab === 'following'
                                ? "Follow people to see their opinions here"
                                : "Be the first to share your thoughts!"
                            }
                        </p>
                    </div>
                ) : (
                    opinions.map((opinion) => (
                        <OpinionCard
                            key={opinion.id}
                            opinion={opinion}
                            onLike={handleLike}
                            onRepost={handleRepost}
                            onBookmark={handleBookmark}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const OpinionCard = ({ opinion, onLike, onRepost, onBookmark }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <article className="bg-white hover:bg-gray-50/50 transition-colors px-4 py-4">
            <div className="flex gap-3">
                {/* Avatar */}
                <Link to={`/profile/${opinion.user?.id}`} className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {opinion.user?.first_name?.[0] || 'U'}
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/profile/${opinion.user?.id}`} className="font-bold text-gray-900 hover:underline">
                                {opinion.user?.full_name || opinion.user?.first_name || 'User'}
                            </Link>
                            <span className="text-gray-500">·</span>
                            <span className="text-gray-500 text-sm">
                                {opinion.time_ago || formatTimeAgo(opinion.created_at)}
                            </span>
                            {opinion.visibility !== 'public' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                                    {opinion.visibility === 'followers' ? <Users className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {opinion.visibility}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Opinion Content */}
                    <Link to={`/opinions/${opinion.id}`}>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                            {opinion.content}
                        </p>
                    </Link>

                    {/* Media */}
                    {opinion.media_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
                            <img
                                src={opinion.media_url}
                                alt=""
                                className="w-full max-h-96 object-cover"
                            />
                        </div>
                    )}

                    {/* Quoted Opinion */}
                    {opinion.quoted_opinion && (
                        <div className="mt-3 p-3 border border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">{opinion.quoted_opinion.user?.first_name}</span>
                                {' · '}
                                {opinion.quoted_opinion.content}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 -ml-2 max-w-md">
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-primary-500 group p-2 rounded-full hover:bg-primary-50 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{opinion.comments_count || ''}</span>
                        </button>
                        <button
                            onClick={() => onRepost(opinion.id)}
                            className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_reposted
                                    ? 'text-green-500 hover:bg-green-50'
                                    : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
                                }`}
                        >
                            <Repeat className="w-5 h-5" />
                            <span className="text-sm">{opinion.reposts_count || ''}</span>
                        </button>
                        <button
                            onClick={() => onLike(opinion.id)}
                            className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${opinion.is_liked
                                    ? 'text-red-500 hover:bg-red-50'
                                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${opinion.is_liked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{opinion.likes_count || ''}</span>
                        </button>
                        <button
                            onClick={() => onBookmark(opinion.id)}
                            className={`p-2 rounded-full transition-colors ${opinion.is_bookmarked
                                    ? 'text-primary-500 hover:bg-primary-50'
                                    : 'text-gray-500 hover:text-primary-500 hover:bg-primary-50'
                                }`}
                        >
                            <Bookmark className={`w-5 h-5 ${opinion.is_bookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors">
                            <Share className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default Opinions;
