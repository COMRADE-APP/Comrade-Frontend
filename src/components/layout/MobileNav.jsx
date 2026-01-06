import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, FileText, User } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const MobileNav = () => {
    const location = useLocation();

    const navItems = [
        { path: ROUTES.DASHBOARD, label: 'Home', icon: Home },
        { path: ROUTES.MESSAGES, label: 'Messages', icon: MessageSquare },
        { path: ROUTES.RESOURCES, label: 'Resources', icon: FileText },
        { path: ROUTES.PROFILE, label: 'Profile', icon: User },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-20">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center gap-1 ${isActive(item.path) ? 'text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <Icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default MobileNav;
