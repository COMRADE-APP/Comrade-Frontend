/**
 * Entity Status Badge Component
 * Reusable badge for displaying entity verification status
 */
import React from 'react';
import './EntityStatusBadge.css';

const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        icon: '⏳',
        className: 'status-pending'
    },
    email_verified: {
        label: 'Email Verified',
        icon: '✉️',
        className: 'status-email-verified'
    },
    submitted: {
        label: 'Under Review',
        icon: '🔍',
        className: 'status-submitted'
    },
    verified: {
        label: 'Verified',
        icon: '✓',
        className: 'status-verified'
    },
    rejected: {
        label: 'Rejected',
        icon: '✗',
        className: 'status-rejected'
    }
};

const EntityStatusBadge = ({ status, showIcon = true, size = 'medium' }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <span className={`entity-status-badge ${config.className} size-${size}`}>
            {showIcon && <span className="status-icon">{config.icon}</span>}
            <span className="status-label">{config.label}</span>
        </span>
    );
};

export default EntityStatusBadge;
