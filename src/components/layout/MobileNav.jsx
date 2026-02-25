import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, ShoppingBag, MessageSquare, CreditCard } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import api from '../../services/api';

/**
 * Mobile bottom navigation bar (visible on screens smaller than md:)
 * Shows: Home, Opinions, Shop, Chats, Payments
 * Includes badge dots for pages with new content
 */
const MobileNav = () => {
    const location = useLocation();

    const navItems = [
        { path: ROUTES.DASHBOARD, label: 'Home', icon: Home },
        { path: ROUTES.OPINIONS, label: 'Opinions', icon: MessageCircle },
        { path: ROUTES.SHOP, label: 'Shop', icon: ShoppingBag },
        { path: ROUTES.MESSAGES, label: 'Chats', icon: MessageSquare },
        { path: ROUTES.PAYMENTS, label: 'Payments', icon: CreditCard },
    ];

    // Badge tracking — mirrors Sidebar logic
    const [hasUpdates, setHasUpdates] = useState({});
    const [visitedPages, setVisitedPages] = useState({});

    // Clear badge when user visits a page
    useEffect(() => {
        const currentPath = location.pathname;
        const badgedPaths = navItems.map(i => i.path);
        const matchedPath = badgedPaths.find(p => currentPath.startsWith(p));
        if (matchedPath) {
            setVisitedPages(prev => ({ ...prev, [matchedPath]: true }));
            setHasUpdates(prev => {
                const next = { ...prev };
                delete next[matchedPath];
                return next;
            });
        }
    }, [location.pathname]);

    // Poll for new content periodically
    useEffect(() => {
        const checkUpdates = async () => {
            try {
                const endpoints = [
                    { path: ROUTES.MESSAGES, url: '/api/rooms/rooms/unread_summary/' },
                ];
                const results = await Promise.allSettled(
                    endpoints.map(ep => api.get(ep.url).then(res => ({ path: ep.path, data: res.data })))
                );
                const updates = {};
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        const { path, data } = r.value;
                        const count = data?.total_unread || data?.count || (Array.isArray(data) ? data.length : 0);
                        if (count > 0 && !visitedPages[path]) {
                            updates[path] = true;
                        }
                    }
                });
                setHasUpdates(prev => ({ ...prev, ...updates }));
            } catch (err) {
                // Silently fail — badges are non-critical
            }
        };
        checkUpdates();
        const interval = setInterval(checkUpdates, 60000);
        return () => clearInterval(interval);
    }, [visitedPages]);

    const isActive = (path) => location.pathname === path;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 border-t border-theme z-50"
            style={{ backgroundColor: 'var(--bg-primary)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const showBadge = hasUpdates[item.path] && !active;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${active ? 'text-primary-600' : 'text-tertiary hover:text-primary'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]" />
                                )}
                            </div>
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
