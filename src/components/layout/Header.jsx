import React from 'react';
import NotificationBell from '../notifications/NotificationBell';

const Header = () => {
    return (
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
            <div className="font-bold text-lg text-primary-600">Comrade</div>
            <NotificationBell />
        </header>
    );
};

export default Header;
