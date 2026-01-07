/**
 * Navigation Helper
 * Provides easy navigation to all new portal features
 */
import { useNavigate } from 'react-router-dom';

export const usePortalNavigation = () => {
    const navigate = useNavigate();

    return {
        // Institution Portal
        createInstitution: () => navigate('/institutions/portal/create'),
        verifyInstitution: (id) => navigate(`/institutions/portal/${id}/verify`),

        // Organization Portal
        createOrganization: () => navigate('/organizations/portal/create'),
        verifyOrganization: (id) => navigate(`/organizations/portal/${id}/verify`),

        // Security
        setupTOTP: () => navigate('/settings/security/totp'),

        // Payments
        checkout: (params) => navigate('/payments/checkout', { state: params }),

        // Announcements
        convertToAnnouncement: () => navigate('/announcements/convert'),

        // General
        dashboard: () => navigate('/dashboard'),
        settings: () => navigate('/settings'),
    };
};

export default usePortalNavigation;
