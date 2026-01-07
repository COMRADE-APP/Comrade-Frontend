/**
 * Quick Action Menu Component
 * Floating action button with shortcuts to create entities
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickActionMenu.css';

const QuickActionMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            id: 'create-institution',
            label: 'Create Institution',
            icon: '🏫',
            onClick: () => navigate('/institutions/portal/create')
        },
        {
            id: 'create-organization',
            label: 'Create Organization',
            icon: '🏢',
            onClick: () => navigate('/organizations/portal/create')
        },
        {
            id: 'setup-2fa',
            label: 'Setup 2FA',
            icon: '🔐',
            onClick: () => navigate('/settings/security/totp')
        },
        {
            id: 'make-payment',
            label: 'Make Payment',
            icon: '💳',
            onClick: () => navigate('/payments/checkout')
        }
    ];

    return (
        <div className="quick-action-menu">
            {isOpen && (
                <div className="action-items">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            className="action-item"
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                            title={action.label}
                        >
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <button
                className={`fab-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Quick Actions"
            >
                {isOpen ? '×' : '+'}
            </button>
        </div>
    );
};

export default QuickActionMenu;
