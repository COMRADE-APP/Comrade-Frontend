import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody, CardFooter, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Megaphone, ThumbsUp, MessageSquare, Share2, Plus, X } from 'lucide-react';
import announcementsService from '../services/announcements.service';
import { formatTimeAgo } from '../utils/dateFormatter';

const Announcements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // All authenticated users can create announcements
    const canCreate = true;

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Announcements</h1>
                    <p className="text-gray-600 mt-1">Stay updated with important announcements</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/announcements/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Announcement
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : announcements.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No announcements yet. Check back later!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-6">
                    {announcements.map((announcement) => (
                        <AnnouncementCard key={announcement.id} announcement={announcement} />
                    ))}
                </div>
            )}
        </div>
    );
};

const AnnouncementCard = ({ announcement }) => (
    <Card>
        <CardBody>
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{announcement.heading}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{announcement.user?.first_name || 'Admin'}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(announcement.time_stamp)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-gray-600">{announcement.content}</p>
        </CardBody>
        <CardFooter className="flex items-center justify-between">
            <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                    +5
                </div>
            </div>
            <div className="flex gap-3">
                <button className="text-gray-500 hover:text-primary-600 transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-primary-600 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-primary-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </CardFooter>
    </Card>
);

export default Announcements;
