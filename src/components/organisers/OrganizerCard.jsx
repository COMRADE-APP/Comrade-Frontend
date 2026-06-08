import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import { MapPin, Users, UserPlus, UserCheck, Bell, BellOff } from 'lucide-react';

const OrganizerCard = ({ organizer, isFollowing, notificationsEnabled, onToggleFollow, onToggleNotifications }) => {
    const navigate = useNavigate();

    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate(`/organiser/${organizer.id}`)}
        >
            {/* Cover photo */}
            <div className="h-20 bg-gradient-to-br from-primary/10 to-indigo-500/10 overflow-hidden">
                {organizer.cover_photo ? (
                    <img src={organizer.cover_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary/30" />
                    </div>
                )}
            </div>

            <CardBody className="px-4 pb-4">
                {/* Avatar - overlaps with cover */}
                <div className="flex justify-center -mt-12 mb-3">
                    <div className="w-20 h-20 rounded-full border-4 border-elevated bg-secondary flex items-center justify-center overflow-hidden shadow-md">
                        {organizer.avatar ? (
                            <img src={organizer.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Users className="w-8 h-8 text-primary/50" />
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center mb-3">
                    <h3 className="font-semibold text-primary text-base">
                        {organizer.business_name || 'Unnamed Organiser'}
                    </h3>
                    {organizer.location && (
                        <p className="text-xs text-secondary flex items-center justify-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {organizer.location}
                        </p>
                    )}
                </div>

                {/* Follower count */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-secondary mb-3">
                    <Users className="w-3.5 h-3.5" />
                    <span>{organizer.follower_count ?? 0} subscriber{(organizer.follower_count ?? 0) !== 1 ? 's' : ''}</span>
                </div>

                {/* Subscribe button */}
                <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollow(organizer.id);
                    }}
                >
                    {isFollowing ? (
                        <><UserCheck className="w-3.5 h-3.5 mr-1" /> Subscribed</>
                    ) : (
                        <><UserPlus className="w-3.5 h-3.5 mr-1" /> Subscribe</>
                    )}
                </Button>

                {/* Notification toggle - only show when subscribed */}
                {isFollowing && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleNotifications(organizer);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors py-1"
                        title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                    >
                        {notificationsEnabled ? (
                            <><Bell className="w-3.5 h-3.5 text-primary-500" /> Notifications on</>
                        ) : (
                            <><BellOff className="w-3.5 h-3.5" /> Notifications off</>
                        )}
                    </button>
                )}
            </CardBody>
        </Card>
    );
};

export default OrganizerCard;
