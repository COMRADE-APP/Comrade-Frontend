import React from 'react';

/**
 * Reusable VerificationBadge component
 * Displays a colored checkmark badge based on user type.
 * 
 * @param {string} userType - The type of user (student, staff, lecturer, org_admin, inst_admin, etc.)
 * @param {boolean} isVerified - Whether the user/entity is verified
 * @param {number} size - Badge size in pixels (default: 16)
 * @param {string} className - Additional CSS classes
 */
const VerificationBadge = ({ userType, isVerified = false, size = 16, className = '' }) => {
    if (!isVerified) return null;

    // Different badge colors per user type
    const badgeColors = {
        student: 'bg-blue-500',
        staff: 'bg-primary-600',
        lecturer: 'bg-indigo-500',
        org_admin: 'bg-green-500',
        org_staff: 'bg-emerald-500',
        inst_admin: 'bg-amber-500',
        inst_staff: 'bg-orange-500',
        admin: 'bg-red-500',
        superadmin: 'bg-red-600',
        organization: 'bg-green-500',
        institution: 'bg-amber-500',
        establishment: 'bg-teal-500',
        default: 'bg-blue-500',
    };

    const badgeLabels = {
        student: 'Verified Student',
        staff: 'Verified Staff',
        lecturer: 'Verified Lecturer',
        org_admin: 'Verified Org Admin',
        org_staff: 'Verified Org Staff',
        inst_admin: 'Verified Institution',
        inst_staff: 'Verified Inst Staff',
        admin: 'Platform Admin',
        superadmin: 'Super Admin',
        organization: 'Verified Organization',
        institution: 'Verified Institution',
        establishment: 'Verified Business',
        default: 'Verified',
    };

    const color = badgeColors[userType] || badgeColors.default;
    const label = badgeLabels[userType] || badgeLabels.default;
    const badgeSize = size;

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${color} ${className}`}
            style={{ width: badgeSize, height: badgeSize }}
            title={label}
        >
            <svg
                className="text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={{ width: badgeSize * 0.7, height: badgeSize * 0.7 }}
            >
                <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                />
            </svg>
        </span>
    );
};

export default VerificationBadge;
