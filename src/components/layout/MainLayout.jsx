import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

import { Toaster } from 'react-hot-toast';

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Toaster position="top-right" />
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
                {/* Mobile Header */}
                <Header />

                {/* Page Content */}
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    );
};

export default MainLayout;
