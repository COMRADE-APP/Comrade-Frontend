import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Bell, Users, Calendar, Zap, MessageSquare, FileText, ClipboardList,
    Building2, Briefcase, CreditCard, GraduationCap, Settings as SettingsIcon,
    MessageCircle, ShoppingBag, Search, BookOpen, UserPlus, Megaphone, Brain, TrendingUp,
    Sparkles, X, User
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';

/**
 * MobileDrawer – Full-height slide-out navigation for mobile.
 * Mirrors the desktop Sidebar nav items.
 */
const MobileDrawer = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { user, activeProfile } = useAuth();

    const navItems = [
        { path: ROUTES.DASHBOARD, label: 'Home', icon: Home },
        { path: ROUTES.QOMAI, label: 'QomAI', icon: Brain },
        { path: ROUTES.OPINIONS, label: 'Opinions', icon: MessageCircle },
        { path: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell },
        { path: ROUTES.MESSAGES, label: 'Messages', icon: MessageSquare },
        { path: ROUTES.ROOMS, label: 'Rooms', icon: Users },
        { path: ROUTES.ANNOUNCEMENTS, label: 'Announcements', icon: Megaphone },
        { path: ROUTES.EVENTS, label: 'Events', icon: Calendar },
        { path: ROUTES.TASKS, label: 'Tasks', icon: ClipboardList },
        { path: ROUTES.RESOURCES, label: 'Resources', icon: FileText },
        { path: ROUTES.RESEARCH, label: 'Research', icon: Search },
        { path: ROUTES.ARTICLES, label: 'Articles', icon: BookOpen },
        { path: ROUTES.FUNDING, label: 'Funding Hub', icon: TrendingUp },
        { path: ROUTES.GIGS, label: 'Gigs', icon: Sparkles },
        { path: ROUTES.CAREERS, label: 'Careers', icon: Briefcase },
        { path: ROUTES.SHOP, label: 'Shop', icon: ShoppingBag },
        { path: ROUTES.SPECIALIZATIONS, label: 'Learning Paths', icon: GraduationCap },
        { path: ROUTES.FOLLOWING, label: 'Connect', icon: UserPlus },
        { path: ROUTES.PAYMENTS, label: 'Payments', icon: CreditCard },
        { path: ROUTES.INSTITUTIONS, label: 'Institutions', icon: Building2 },
        { path: ROUTES.ORGANIZATIONS, label: 'Organizations', icon: Briefcase },
        { path: ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer panel */}
            <aside
                className={`md:hidden fixed top-0 left-0 h-full w-72 bg-primary border-r border-theme z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-theme">
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
                        <Zap className="w-6 h-6" />
                        Qomrade
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User info */}
                <div className="px-4 py-3 border-b border-theme">
                    <Link
                        to={activeProfile?.type === 'personal'
                            ? (activeProfile?.id || user?.id ? `/profile/${activeProfile?.id || user?.id}` : '/profile')
                            : activeProfile?.type === 'organisation' ? `/organizations/${activeProfile?.id}`
                                : activeProfile?.type === 'institution' ? `/institutions/${activeProfile?.id}`
                                    : '/profile'}
                        onClick={onClose}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold overflow-hidden flex-shrink-0">
                            {activeProfile?.avatar ? (
                                <img src={activeProfile.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <>{user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}</>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                                {activeProfile?.name || user?.first_name || user?.email || 'User'}
                            </p>
                            <p className="text-xs text-secondary">View Profile</p>
                        </div>
                    </Link>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive(item.path)
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-secondary hover:bg-secondary hover:text-primary'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default MobileDrawer;
