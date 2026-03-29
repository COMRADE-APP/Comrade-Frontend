import React, { useState } from 'react';
import { Users, CreditCard, Compass } from 'lucide-react';
import Rooms from '../Rooms';
import PaymentGroups from '../payments/PaymentGroups';
import GroupJoinDiscourse from './GroupJoinDiscourse';

const GroupsHub = () => {
    const [activeTab, setActiveTab] = useState('rooms');

    const tabs = [
        { id: 'rooms', label: 'Rooms', icon: Users },
        { id: 'payment_groups', label: 'Payment Groups', icon: CreditCard },
        { id: 'discover', label: 'Discover', icon: Compass },
    ];

    return (
        <div className="space-y-6">
            <div className="border-b border-theme">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    isActive
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'rooms' && <Rooms />}
                {activeTab === 'payment_groups' && <PaymentGroups />}
                {activeTab === 'discover' && <GroupJoinDiscourse />}
            </div>
        </div>
    );
};

export default GroupsHub;
