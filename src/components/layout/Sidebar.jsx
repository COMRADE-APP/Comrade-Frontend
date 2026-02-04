import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Bell, Users, Calendar, Zap, MessageSquare, FileText, ClipboardList,
    Building2, Briefcase, CreditCard, GraduationCap, Settings as SettingsIcon,
    MessageCircle, ShoppingBag, Search, BookOpen, UserPlus, Megaphone, Brain, TrendingUp,
    Sparkles
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

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
        <aside className="hidden md:flex flex-col w-64 bg-primary border-r border-theme h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
                    <Zap className="w-6 h-6" />
                    Comrade
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive(item.path)
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-secondary hover:bg-secondary hover:text-primary'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-theme">
                <Link to={ROUTES.PROFILE} className="flex items-center gap-3 hover:bg-secondary p-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-secondary">View Profile</p>
                    </div>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
