import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

const Header = ({ onMenuToggle }) => {
    return (
        <header className="md:hidden bg-primary border-b border-theme p-4 flex justify-between items-center sticky top-0 z-40">
            <button
                onClick={onMenuToggle}
                className="p-1 text-secondary hover:text-primary transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="w-6 h-6" />
            </button>
            <div className="font-bold text-lg text-primary-600">Qomrade</div>
            <NotificationBell />
        </header>
    );
};

export default Header;
