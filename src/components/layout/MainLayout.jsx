import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import MobileDrawer from './MobileDrawer';
import AccountSelectionModal from '../AccountSelectionModal';
import { useAuth } from '../../contexts/AuthContext';

import { Toaster } from 'react-hot-toast';

const MainLayout = ({ children }) => {
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
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
                {/* Mobile Header */}
                <Header onMenuToggle={() => setIsMobileDrawerOpen(true)} />

                {/* Page Content */}
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />

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
