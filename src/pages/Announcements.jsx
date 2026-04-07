import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardFooter, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { Megaphone, ThumbsUp, Heart, MessageSquare, Send, Plus, Search, Eye, MoreHorizontal, Flag, EyeOff } from 'lucide-react';
import announcementsService from '../services/announcements.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'subscribed', label: 'Subscribed' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
];

const Announcements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await announcementsService.getAll();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading announcements:', error);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredAnnouncements = announcements
        .filter(a =>
            a.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(a => {
            if (sortBy === 'subscribed') {
                return a.is_subscribed === true;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'oldest') return new Date(a.time_stamp) - new Date(b.time_stamp);
            return new Date(b.time_stamp) - new Date(a.time_stamp); // newest default
        });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Announcements</h1>
                    <p className="text-secondary mt-1">Stay updated with important announcements</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/announcements/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Announcement
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-theme rounded-lg text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Pill Filters */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setSortBy(f.value === 'all' ? 'newest' : f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${(f.value === 'all' && sortBy === 'newest') || sortBy === f.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary text-secondary hover:bg-tertiary/20 hover:text-primary'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredAnnouncements.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Megaphone className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">No announcements yet. Check back later!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredAnnouncements.map((announcement) => (
                        <AnnouncementCard key={announcement.id} announcement={announcement} />
                    ))}
                </div>
            )}
        </div>
    );
};

const AnnouncementCard = ({ announcement }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [likes, setLikes] = useState(announcement.likes_count || announcement.reactions_count || 0);
    const [hasLiked, setHasLiked] = useState(announcement.is_liked || false);
    const [views, setViews] = useState(announcement.view_count || announcement.views || 0);
    const [showOptions, setShowOptions] = useState(false);

    const handleCardClick = () => {
        // Record view then navigate
        announcementsService.recordView(announcement.id).catch(console.error);
        navigate(`/announcements/${announcement.id}`);
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            await announcementsService.addReaction(announcement.id, 'like');
            setHasLiked(!hasLiked);
            setLikes(prev => hasLiked ? prev - 1 : prev + 1);
        } catch (error) {
            console.error('Error liking announcement:', error);
        }
    };

    const handleCommentClick = (e) => {
        e.stopPropagation();
        navigate(`/announcements/${announcement.id}?tab=discussion`);
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        try {
            if (navigator.share) {
                await navigator.share({
                    title: announcement.heading,
                    text: announcement.content?.substring(0, 100),
                    url: `${window.location.origin}/announcements/${announcement.id}`,
                });
            } else {
                await navigator.clipboard.writeText(`${window.location.origin}/announcements/${announcement.id}`);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const toggleOptions = (e) => {
        e.stopPropagation();
        setShowOptions(!showOptions);
    };

    const content = announcement.content || '';
    const isLong = content.length > 200;
    const displayText = isExpanded ? content : (isLong ? content.substring(0, 200) + '...' : content);

    return (
        <Card className="cursor-pointer hover:border-primary-500 transition-colors" onClick={handleCardClick}>
            <CardBody>
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shrink-0 overflow-hidden cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (announcement.user?.id) navigate(`/profile/${announcement.user.id}`);
                            }}
                            title="View Publisher Profile"
                        >
                            {announcement.user?.avatar_url || announcement.created_by_avatar ? (
                                <img src={announcement.user?.avatar_url || announcement.created_by_avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-semibold text-lg">
                                    {announcement.user?.first_name?.[0] || announcement.user?.username?.[0] || 'A'}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary">{announcement.heading}</h3>
                            <div className="flex items-center gap-2 text-sm text-tertiary">
                                <span
                                    className="hover:underline cursor-pointer hover:text-primary-600 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (announcement.user?.id) navigate(`/profile/${announcement.user.id}`);
                                    }}
                                >
                                    {announcement.user?.first_name || announcement.user?.username || 'Admin'}
                                </span>
                                <span>•</span>
                                <span>{formatTimeAgo(announcement.time_stamp)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button onClick={toggleOptions} className="p-2 text-tertiary hover:text-primary hover:bg-secondary rounded-full transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showOptions && (
                            <div className="absolute right-0 mt-2 w-48 bg-elevated border border-theme rounded-xl shadow-lg z-10 py-1" onClick={e => e.stopPropagation()}>
                                <button className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-secondary flex items-center gap-2">
                                    <EyeOff className="w-4 h-4" /> Not Interested
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                    <Flag className="w-4 h-4" /> Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-secondary whitespace-pre-wrap">
                    {displayText}
                    {isLong && !isExpanded && (
                        <span
                            className="text-primary-600 font-medium ml-1 hover:underline cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                        >
                            Read more
                        </span>
                    )}
                    {isLong && isExpanded && (
                        <span
                            className="text-primary-600 font-medium ml-1 hover:underline cursor-pointer block mt-1"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        >
                            Show less
                        </span>
                    )}
                </div>
            </CardBody>

            <CardFooter className="flex items-center justify-between border-t border-theme pt-3">
                <div className="flex items-center gap-4 text-sm text-tertiary">
                    <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {likes}
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> {announcement.comments_count || (announcement.comments || []).length || 0}
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {views}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleLike}
                        className={`p-2 rounded-full transition-colors flex items-center gap-1 ${hasLiked ? 'text-red-500 bg-red-500/10' : 'text-secondary hover:bg-secondary hover:text-red-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleCommentClick}
                        className="p-2 text-secondary hover:bg-secondary hover:text-primary rounded-full transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 text-secondary hover:bg-secondary hover:text-primary rounded-full transition-colors"
                    >
                        <Send className="w-5 h-5 -rotate-12" />
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default Announcements;
