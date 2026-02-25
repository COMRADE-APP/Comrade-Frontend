import React from 'react';
import { Building2, GraduationCap, User, ChevronRight, X, Lock } from 'lucide-react';

/**
 * SwitchAccountModal - Allows users to switch between personal and organization/institution accounts
 * 
 * Props:
 * - isOpen: boolean - Controls visibility
 * - onClose: function - Called when modal is closed
 * - accounts: array - List of accounts: [{ id, name, type: 'personal'|'organisation'|'institution', avatar, has_portal_password }]
 * - activeAccountId: string - Currently active account ID
 * - onSwitch: function(account) - Called when user selects an account
 */
const SwitchAccountModal = ({ isOpen, onClose, accounts = [], activeAccountId, onSwitch }) => {
    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'organisation':
                return <Building2 className="w-5 h-5" />;
            case 'institution':
                return <GraduationCap className="w-5 h-5" />;
            default:
                return <User className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'organisation':
                return 'Organisation';
            case 'institution':
                return 'Institution';
            default:
                return 'Personal';
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'organisation':
                return 'bg-blue-100 text-blue-700';
            case 'institution':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Switch Account</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Account List */}
                <div className="p-2 max-h-96 overflow-y-auto">
                    {accounts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No accounts available
                        </div>
                    ) : (
                        accounts.map((account) => (
                            <button
                                key={account.id}
                                onClick={() => {
                                    onSwitch(account);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeAccountId === account.id
                                    ? 'bg-purple-50 border-2 border-purple-500'
                                    : 'hover:bg-gray-50 border-2 border-transparent'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    {account.avatar ? (
                                        <img
                                            src={account.avatar}
                                            alt={account.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${account.type === 'organisation' ? 'bg-blue-100 text-blue-600' :
                                            account.type === 'institution' ? 'bg-purple-100 text-purple-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {getIcon(account.type)}
                                        </div>
                                    )}
                                    {activeAccountId === account.id && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                        {account.name}
                                        {account.has_portal_password && account.type !== 'personal' && (
                                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                                        )}
                                    </p>
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(account.type)}`}>
                                        {getTypeLabel(account.type)}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        Switching accounts will change the context for creating content.
                    </p>
                </div>
            </div>
        </div >
    );
};

export default SwitchAccountModal;
