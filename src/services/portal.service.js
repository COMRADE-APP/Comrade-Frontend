import api from './api';

const BASE = '/auth/portal';

const portalService = {
    // Staff Portal
    getStaffDashboard: () => api.get(`${BASE}/staff/dashboard/`),
    getStaffUsers: (params = {}) => api.get(`${BASE}/staff/users/`, { params }),

    // Author / Editor Portal
    getAuthorDashboard: () => api.get(`${BASE}/author/dashboard/`),

    // Moderator Portal
    getModeratorDashboard: () => api.get(`${BASE}/moderator/dashboard/`),
    getModeratorContent: (params = {}) => api.get(`${BASE}/moderator/content/`, { params }),

    // Lecturer Portal
    getLecturerDashboard: () => api.get(`${BASE}/lecturer/dashboard/`),

    // Institutional Admin Portal
    getInstitutionDashboard: () => api.get(`${BASE}/institution/dashboard/`),

    // Organisational Admin Portal
    getOrganisationDashboard: () => api.get(`${BASE}/organisation/dashboard/`),

    // Partner Portal
    getPartnerDashboard: () => api.get(`${BASE}/partner/dashboard/`),
};

export default portalService;
