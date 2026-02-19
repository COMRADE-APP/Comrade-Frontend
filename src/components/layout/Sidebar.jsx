import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Bell, Users, Calendar, Zap, MessageSquare, FileText, ClipboardList,
    Building2, Briefcase, CreditCard, GraduationCap, Settings as SettingsIcon,
    MessageCircle, ShoppingBag, Search, BookOpen, UserPlus, Megaphone, Brain, TrendingUp,
    Sparkles, ChevronDown, ChevronLeft, ChevronRight, Check, User, PanelLeftClose, PanelLeftOpen, Shield
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';
import SwitchAccountModal from '../SwitchAccountModal';

const Sidebar = () => {
    const location = useLocation();
    const { user, activeProfile, availableAccounts, switchAccount } = useAuth();
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem('sidebar_collapsed', String(isCollapsed)); } catch { }
    }, [isCollapsed]);

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
        // Admin Portal - only visible for admin/staff users
        ...(user?.is_admin || user?.is_staff || user?.is_superuser ? [
            { path: ROUTES.ADMIN_PORTAL, label: 'Admin Portal', icon: Shield },
        ] : []),
        // Role-Specific Portals
        ...(user?.is_staff || user?.user_type === 'staff' ? [
            { path: ROUTES.STAFF_PORTAL, label: 'Staff Portal', icon: Zap },
        ] : []),
        ...(['author', 'editor'].includes(user?.user_type) ? [
            { path: ROUTES.AUTHOR_PORTAL, label: 'Author Portal', icon: FileText },
        ] : []),
        ...(user?.user_type === 'moderator' ? [
            { path: ROUTES.MODERATOR_PORTAL, label: 'Moderator Portal', icon: Shield },
        ] : []),
        ...(user?.user_type === 'lecturer' ? [
            { path: ROUTES.LECTURER_PORTAL, label: 'Lecturer Portal', icon: GraduationCap },
        ] : []),
        ...(['institutional_admin', 'institutional_staff', 'organisational_admin', 'organisational_staff', 'partner'].includes(user?.user_type) ? [
            { path: ROUTES.INSTITUTION_PORTAL, label: 'My Portal', icon: Building2 },
        ] : []),
        { path: ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
    ];

    const isActive = (path) => location.pathname === path;

    const getProfileIcon = () => {
        if (activeProfile?.type === 'organisation') return Building2;
        if (activeProfile?.type === 'institution') return GraduationCap;
        return null;
    };

    const ProfileIcon = getProfileIcon();

    return (
        <>
            <aside
                className={`hidden md:flex flex-col bg-primary border-r border-theme h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo + Collapse Toggle */}
                <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
                            <Zap className="w-6 h-6 flex-shrink-0" />
                            Qomrade
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(prev => !prev)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? item.label : undefined}
                                className={`flex items-center gap-3 text-sm font-medium rounded-lg transition-colors duration-150 ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                                    } ${isActive(item.path)
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-secondary hover:bg-secondary hover:text-primary'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Active Profile Indicator (if not personal) */}
                {activeProfile && activeProfile.type !== 'personal' && (
                    <div className="px-4 py-2 border-t border-theme">
                        {isCollapsed ? (
                            <div className="flex justify-center" title={`Posting as: ${activeProfile.name}`}>
                                {ProfileIcon && <ProfileIcon className="w-5 h-5 text-primary-600" />}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg text-sm">
                                {ProfileIcon && <ProfileIcon className="w-4 h-4 text-primary-600" />}
                                <span className="text-primary-700 font-medium truncate">
                                    Posting as: {activeProfile.name}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* User Profile + Account Switcher */}
                <div className="p-4 border-t border-theme">
                    <button
                        onClick={() => setShowAccountModal(true)}
                        className={`w-full flex items-center gap-3 hover:bg-secondary p-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''
                            }`}
                        title={isCollapsed ? (activeProfile?.name || user?.email || 'Switch account') : undefined}
                    >
                        <div className="relative flex-shrink-0">
                            {activeProfile?.avatar ? (
                                <img
                                    src={activeProfile.avatar}
                                    alt={activeProfile.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}{user?.last_name?.[0] || ''}
                                </div>
                            )}
                            {availableAccounts.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold">{availableAccounts.length}</span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium text-primary truncate">
                                    {activeProfile?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'User')}
                                </p>
                                <p className="text-xs text-secondary">
                                    {activeProfile?.type === 'personal' ? 'Personal Account' :
                                        activeProfile?.type === 'organisation' ? 'Organization' :
                                            activeProfile?.type === 'institution' ? 'Institution' : 'Switch Account'}
                                </p>
                            </div>
                        )}
                        {!isCollapsed && <ChevronDown className="w-4 h-4 text-secondary flex-shrink-0" />}
                    </button>

                    {/* View Profile Link */}
                    {!isCollapsed && (
                        <Link
                            to={activeProfile?.type === 'personal'
                                ? (activeProfile?.id || user?.id ? `/profile/${activeProfile?.id || user?.id}` : '/profile')
                                : activeProfile?.type === 'organisation' ? `/organizations/${activeProfile?.id}`
                                    : activeProfile?.type === 'institution' ? `/institutions/${activeProfile?.id}`
                                        : (activeProfile?.id || user?.id ? `/profile/${activeProfile?.id || user?.id}` : '/profile')}
                            className="flex items-center gap-2 mt-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            View Profile
                        </Link>
                    )}
                </div>
            </aside>

            {/* Account Switch Modal */}
            <SwitchAccountModal
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
                accounts={availableAccounts}
                activeAccountId={activeProfile?.id}
                onSwitch={switchAccount}
            />
        </>
    );
};

export default Sidebar;
