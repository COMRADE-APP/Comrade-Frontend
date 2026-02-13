import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Updated import path
import storiesService from '../../services/stories.service';
import CreateStory from './CreateStory';
import StoryViewer from './StoryViewer';

export default function StoriesBar() {
    const { user } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingUserIndex, setViewingUserIndex] = useState(null);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const data = await storiesService.getAll();
            setStories(data);
        } catch (error) {
            console.error("Failed to fetch stories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryClick = (index) => {
        setViewingUserIndex(index);
    };

    const handleNextUser = () => {
        if (viewingUserIndex < stories.length - 1) {
            setViewingUserIndex(prev => prev + 1);
        } else {
            setViewingUserIndex(null);
        }
    };

    const handlePrevUser = () => {
        if (viewingUserIndex > 0) {
            setViewingUserIndex(prev => prev - 1);
        } else {
            setViewingUserIndex(null);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => setShowCreateModal(true)}>
                    <div className="relative w-16 h-16 rounded-full p-1 border-2 border-dashed border-gray-600 hover:border-primary transition-colors">
                        <img
                            src={user?.avatar || 'https://via.placeholder.com/60'}
                            alt="Your Story"
                            className="w-full h-full rounded-full object-cover opacity-50"
                        />
                        <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                            <Plus className="w-3 h-3" />
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Your Story</span>
                </div>

                {/* Stories List */}
                {stories.map((group, index) => (
                    <div
                        key={group.user.id}
                        className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
                        onClick={() => handleStoryClick(index)}
                    >
                        <div className={`w-16 h-16 rounded-full p-[2px] ${group.has_unviewed ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gray-700'}`}>
                            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                                <img
                                    src={group.user.avatar_url || 'https://via.placeholder.com/60'}
                                    alt={group.user.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-xs text-gray-300 font-medium max-w-[70px] truncate">
                            {group.user.first_name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateStory
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchStories}
                />
            )}

            {viewingUserIndex !== null && (
                <StoryViewer
                    stories={stories[viewingUserIndex].stories}
                    onClose={() => setViewingUserIndex(null)}
                    onNextUser={handleNextUser}
                    onPrevUser={handlePrevUser}
                />
            )}
        </div>
    );
}
