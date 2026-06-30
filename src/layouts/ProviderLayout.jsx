import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Store, LayoutDashboard, Package, CreditCard, Users, Settings, MessageSquare, ClipboardList, Menu, ArrowLeftRight, User, BarChart3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import SwitchAccountModal from '../components/SwitchAccountModal';
import MobileDrawer from '../components/layout/MobileDrawer';

const ProviderLayout = () => {
    const { logout, availableAccounts, activeProfile, switchAccount, requestAccountSwitch } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const personalAccount = availableAccounts.find(a => a.type === 'personal');

    const handleSwitchToUserMode = () => {
        if (personalAccount) {
            switchAccount(personalAccount);
            navigate(ROUTES.DASHBOARD);
        } else {
            logout();
        }
    };

    const navItems = [
        { path: ROUTES.PROVIDER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.PROVIDER_ANALYTICS, label: 'Kitty Analytics', icon: BarChart3 },
        { path: ROUTES.PROVIDER_PRODUCTS, label: 'My Products', icon: Package },
        { path: ROUTES.PROVIDER_ORDERS, label: 'Orders/Apps', icon: ClipboardList },
        { path: ROUTES.PROVIDER_TRANSACTIONS, label: 'Transactions', icon: CreditCard },
        { path: ROUTES.PROVIDER_QUERIES, label: 'Customer Queries', icon: MessageSquare },
        { path: ROUTES.PROVIDER_STAFF, label: 'Staff', icon: Users },
        { path: ROUTES.PROVIDER_SETTINGS, label: 'Settings', icon: Settings },
    ];

    const activeProviderName = activeProfile?.type === 'provider' ? activeProfile.name : null;
    const activeProviderType = activeProfile?.type === 'provider' ? activeProfile.provider_type : null;
    const providerAvatarLetter = activeProviderName ? activeProviderName.charAt(0).toUpperCase() : 'P';

    return (
        <div className="flex h-screen bg-primary overflow-hidden">
            <aside className={`hidden md:flex flex-col bg-elevated border-r border h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
                <div className={`p-4 flex items-center border-b border-theme ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                                <Store className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-primary tracking-tight">Provider</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(prev => !prev)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-secondary/10 rounded-lg transition-colors shrink-0"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                </div>

                {activeProviderName && !isCollapsed && (
                    <div className="px-4 py-3 border-b border-theme">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">Active Provider</p>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                {providerAvatarLetter}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary truncate">{activeProviderName}</p>
                                {activeProviderType && (
                                    <p className="text-[10px] text-secondary capitalize">{activeProviderType.replace(/_/g, ' ')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={isCollapsed ? item.label : undefined}
                                className={`flex items-center gap-3 text-sm font-medium rounded-xl transition-all ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-secondary hover:bg-secondary/10'} w-full`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className={`border-t border space-y-1 ${isCollapsed ? 'px-1 py-2' : 'p-4'}`}>
                    <button
                        onClick={() => setShowAccountSwitcher(true)}
                        title={isCollapsed ? 'Switch Account' : undefined}
                        className={`flex items-center gap-3 text-sm font-medium text-secondary hover:bg-secondary/10 rounded-xl w-full transition-all ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
                    >
                        <ArrowLeftRight className="w-5 h-5 shrink-0" />
                        {!isCollapsed && 'Switch Account'}
                    </button>
                    <button
                        onClick={handleSwitchToUserMode}
                        title={isCollapsed ? 'Back to Qomrade' : undefined}
                        className={`flex items-center gap-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl w-full transition-all ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
                    >
                        <User className="w-5 h-5 shrink-0" />
                        {!isCollapsed && 'Back to Qomrade'}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 bg-elevated border-b border flex items-center justify-between px-4 md:px-6 shrink-0">
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-secondary/10 text-primary"
                        onClick={() => setMobileDrawerOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-primary text-lg md:hidden">Provider Portal</h2>
                    <div className="flex-1 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAccountSwitcher(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-secondary/10 text-secondary"
                            title="Switch Account"
                        >
                            <ArrowLeftRight className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                            {providerAvatarLetter}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-secondary/5">
                    <Outlet />
                </main>
            </div>

            <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

            <SwitchAccountModal
                isOpen={showAccountSwitcher}
                onClose={() => setShowAccountSwitcher(false)}
                accounts={availableAccounts}
                activeAccountId={activeProfile?.id}
                onSwitch={(account) => {
                    requestAccountSwitch(account);
                    if (account.type === 'personal') {
                        navigate(ROUTES.DASHBOARD);
                    } else if (account.type === 'provider') {
                        navigate(ROUTES.PROVIDER_DASHBOARD);
                    } else {
                        navigate(ROUTES.DASHBOARD);
                    }
                }}
            />
        </div>
    );
};

export default ProviderLayout;
