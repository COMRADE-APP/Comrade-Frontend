import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import { MapPin, Users, UserPlus, UserCheck, Bell, BellOff, Building2 } from 'lucide-react';

const SponsorCard = ({ sponsor, isFollowing, notificationsEnabled, onToggleFollow, onToggleNotifications }) => {
    const navigate = useNavigate();

    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate(`/sponsor/${sponsor.id}`)}
        >
            <CardBody className="px-4 pt-6 pb-4">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden shadow-md">
                        {sponsor.logo ? (
                            <img src={sponsor.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary/50" />
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center mb-3">
                    <h3 className="font-semibold text-primary text-base">
                        {sponsor.company_name || 'Unnamed Sponsor'}
                    </h3>
                    {sponsor.industry && (
                        <p className="text-xs text-secondary mt-0.5">{sponsor.industry}</p>
                    )}
                    {sponsor.location && (
                        <p className="text-xs text-secondary flex items-center justify-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {sponsor.location}
                        </p>
                    )}
                </div>

                {/* Follower count */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-secondary mb-3">
                    <Users className="w-3.5 h-3.5" />
                    <span>{sponsor.follower_count ?? 0} subscriber{(sponsor.follower_count ?? 0) !== 1 ? 's' : ''}</span>
                </div>

                {/* Subscribe button */}
                <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollow(sponsor.id);
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
                            onToggleNotifications(sponsor);
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

export default SponsorCard;
