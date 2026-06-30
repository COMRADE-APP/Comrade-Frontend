import React, { useState, useEffect } from 'react';
import { Settings, RefreshCcw } from 'lucide-react';
import Button from '../../components/common/Button';
import providerService from '../../services/provider.service';
import SettingsTab from './tabs/SettingsTab';

const ProviderSettingsPage = () => {
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProvider = async () => {
        setLoading(true);
        try {
            const regs = await providerService.getMyRegistrations();
            if (regs?.length > 0) {
                const p = regs[0];
                const detail = await providerService.getRegistrationDetail(p.id);
                setProvider(detail || p);
            }
        } catch (err) {
            console.error('Failed to load provider:', err);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadProvider(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="text-center py-20">
                <Settings size={48} className="text-secondary/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-primary mb-2">No Provider Found</h2>
                <p className="text-secondary">Register a provider to manage settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                        <Settings size={24} className="text-gray-500" /> Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-secondary mt-0.5">{provider.business_name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadProvider}>
                    <RefreshCcw size={14} className="mr-1.5" /> Refresh
                </Button>
            </div>
            <SettingsTab provider={provider} onRefresh={loadProvider} />
        </div>
    );
};

export default ProviderSettingsPage;
