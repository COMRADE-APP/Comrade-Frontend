import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Bell, MessageSquare, Megaphone, User } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

/**
 * Mobile bottom navigation bar for phones and tablets (visible on screens smaller than md:)
 * Shows: Home, Opinions, Notifications, Messages, Announcements
 */
const MobileNav = () => {
    const location = useLocation();

    const navItems = [
        { path: ROUTES.DASHBOARD, label: 'Home', icon: Home },
        { path: ROUTES.OPINIONS, label: 'Opinions', icon: MessageCircle },
        { path: ROUTES.NOTIFICATIONS, label: 'Alerts', icon: Bell },
        { path: ROUTES.MESSAGES, label: 'Chats', icon: MessageSquare },
        { path: ROUTES.ANNOUNCEMENTS, label: 'News', icon: Megaphone },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${active ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
