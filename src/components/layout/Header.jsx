import React from 'react';
import { Bell } from 'lucide-react';

const Header = () => {
    return (
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
            <div className="font-bold text-lg text-primary-600">Comrade</div>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
            </button>
        </header>
    );
};

export default Header;
