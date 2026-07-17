import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import MobileDrawer from './MobileDrawer';
import AccountSelectionModal from '../AccountSelectionModal';
import { useAuth } from '../../contexts/AuthContext';

import { Toaster } from 'react-hot-toast';

const FULLSCREEN_PATHS = ['/qnotes'];

const MainLayout = ({ children }) => {
    const { pathname } = useLocation();
    const isFullscreen = FULLSCREEN_PATHS.some(p => pathname.startsWith(p));

    const {
        user,
        availableAccounts,
        showAccountSelection,
        handleAccountSelected
    } = useAuth();

    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-secondary">
            <Toaster position="top-right" />

            {/* Skip to content link for screen readers */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[10000] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
            >
                Skip to main content
            </a>

            {/* Desktop Sidebar — hidden on mobile, hidden on fullscreen pages */}
            <div className={isFullscreen ? 'hidden lg:block' : ''}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <main
                id="main-content"
                className={`flex-1 overflow-y-auto relative pb-20 md:pb-0 ${isFullscreen ? 'md:pb-0' : ''}`}
                role="main"
                aria-label="Page content"
            >
                {/* Mobile Header — hidden on mobile for fullscreen pages */}
                {isFullscreen ? (
                    <div className="hidden md:block">
                        <Header onMenuToggle={() => setIsMobileDrawerOpen(true)} />
                    </div>
                ) : (
                    <Header onMenuToggle={() => setIsMobileDrawerOpen(true)} />
                )}

                {/* Page Content */}
                <div className={isFullscreen ? 'h-full' : 'max-w-5xl mx-auto p-4 md:p-8'}>
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation — hidden on md+ for fullscreen pages */}
            {isFullscreen ? (
                <div className="md:hidden">
                    <MobileNav />
                </div>
            ) : (
                <MobileNav />
            )}

            {/* Mobile Slide-out Drawer */}
            <MobileDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
            />

            {/* Post-Login Account Selection Modal */}
            <AccountSelectionModal
                isOpen={showAccountSelection}
                accounts={availableAccounts}
                onSelect={handleAccountSelected}
                userName={user?.first_name}
            />
        </div>
    );
};

export default MainLayout;
