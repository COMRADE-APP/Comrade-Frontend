import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Store, LayoutDashboard, Package, CreditCard, Users, Settings, LogOut, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

const ProviderLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
    };

    const navItems = [
        { path: ROUTES.PROVIDER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.PROVIDER_PRODUCTS, label: 'My Products', icon: Package },
        { path: ROUTES.PROVIDER_ORDERS, label: 'Orders/Apps', icon: ClipboardList },
        { path: ROUTES.PROVIDER_TRANSACTIONS, label: 'Transactions', icon: CreditCard },
        { path: ROUTES.PROVIDER_QUERIES, label: 'Customer Queries', icon: MessageSquare },
        { path: ROUTES.PROVIDER_STAFF, label: 'Staff', icon: Users },
        { path: ROUTES.PROVIDER_SETTINGS, label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-primary overflow-hidden">
            <div className="w-64 bg-elevated border-r border flex-col hidden md:flex">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-primary tracking-tight">Provider Portal</span>
                </div>
                <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-secondary hover:bg-secondary/10'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
                <div className="p-4 border-t border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-50 w-full transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 bg-elevated border-b border flex items-center justify-between px-6 md:px-8">
                    <h2 className="font-bold text-primary text-lg md:hidden">Provider Portal</h2>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-primary font-bold">P</div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-secondary/5">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ProviderLayout;
