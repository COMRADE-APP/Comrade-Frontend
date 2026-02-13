import React, { useState } from 'react';
import { Building2, GraduationCap, User, Check, ArrowRight } from 'lucide-react';

/**
 * AccountSelectionModal - Full-screen modal shown after login when user has multiple accounts
 * 
 * Props:
 * - isOpen: boolean - Controls visibility
 * - accounts: array - List of accounts: [{ id, name, type: 'personal'|'organisation'|'institution', avatar, role }]
 * - onSelect: function(account) - Called when user selects an account
 * - userName: string - User's name for greeting
 */
const AccountSelectionModal = ({ isOpen, accounts = [], onSelect, userName }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [rememberChoice, setRememberChoice] = useState(false);

    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'organisation':
                return <Building2 className="w-6 h-6" />;
            case 'institution':
                return <GraduationCap className="w-6 h-6" />;
            default:
                return <User className="w-6 h-6" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'organisation':
                return 'Organisation';
            case 'institution':
                return 'Institution';
            default:
                return 'Personal Account';
        }
    };

    const getTypeBgColor = (type, isSelected) => {
        if (isSelected) {
            switch (type) {
                case 'organisation':
                    return 'bg-blue-600 border-blue-600';
                case 'institution':
                    return 'bg-purple-600 border-purple-600';
                default:
                    return 'bg-emerald-600 border-emerald-600';
            }
        }
        switch (type) {
            case 'organisation':
                return 'bg-blue-50 border-blue-200 hover:border-blue-400';
            case 'institution':
                return 'bg-purple-50 border-purple-200 hover:border-purple-400';
            default:
                return 'bg-gray-50 border-gray-200 hover:border-gray-400';
        }
    };

    const getIconBgColor = (type) => {
        switch (type) {
            case 'organisation':
                return 'bg-blue-100 text-blue-600';
            case 'institution':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-emerald-100 text-emerald-600';
        }
    };

    const handleContinue = () => {
        const selected = accounts.find(a => a.id === selectedId);
        if (selected) {
            if (rememberChoice) {
                localStorage.setItem('defaultAccountId', selectedId);
                localStorage.setItem('skipAccountSelection', 'true');
            }
            onSelect(selected);
        }
    };

    // Auto-select personal account if only one exists
    React.useEffect(() => {
        if (accounts.length === 1) {
            setSelectedId(accounts[0].id);
        } else if (accounts.length > 0 && !selectedId) {
            // Default to personal account
            const personal = accounts.find(a => a.type === 'personal');
            if (personal) {
                setSelectedId(personal.id);
            }
        }
    }, [accounts]);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg">
                {/* Welcome Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back{userName ? `, ${userName}` : ''}! 👋
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Choose which account you'd like to use
                    </p>
                </div>

                {/* Account Cards */}
                <div className="space-y-3 mb-6">
                    {accounts.map((account) => {
                        const isSelected = selectedId === account.id;
                        return (
                            <button
                                key={account.id}
                                onClick={() => setSelectedId(account.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${getTypeBgColor(account.type, isSelected)}`}
                            >
                                {/* Avatar/Icon */}
                                <div className="relative flex-shrink-0">
                                    {account.avatar ? (
                                        <img
                                            src={account.avatar}
                                            alt={account.name}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : getIconBgColor(account.type)}`}>
                                            {getIcon(account.type)}
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="flex-1 text-left">
                                    <p className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        {account.name}
                                    </p>
                                    <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                        {getTypeLabel(account.type)}
                                        {account.role && account.role !== 'personal' && (
                                            <span className="ml-2 px-2 py-0.5 bg-black/10 rounded-full text-xs">
                                                {account.role}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Radio indicator */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                    ? 'border-white bg-white'
                                    : 'border-gray-300'
                                    }`}>
                                    {isSelected && (
                                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Remember Choice */}
                <label className="flex items-center gap-3 text-gray-400 mb-6 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={rememberChoice}
                        onChange={(e) => setRememberChoice(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Remember my choice and don't ask again</span>
                </label>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    disabled={!selectedId}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Skip for now link */}
                {accounts.length > 1 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                        You can switch accounts anytime from the sidebar
                    </p>
                )}
            </div>
        </div>
    );
};

export default AccountSelectionModal;
