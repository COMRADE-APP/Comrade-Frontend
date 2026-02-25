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

    // ---- Entity Portal Password Management ----

    // Organisation portal password
    setOrgPortalPassword: (orgId, data) =>
        api.post(`/api/organizations/organisation/${orgId}/set_portal_password/`, data),
    verifyOrgPortalPassword: (orgId, data) =>
        api.post(`/api/organizations/organisation/${orgId}/verify_portal_password/`, data),
    getMyOrganizations: () =>
        api.get('/api/organizations/organisation/my_organizations/'),

    // Institution portal password
    setInstPortalPassword: (instId, data) =>
        api.post(`/api/institutions/institutions/${instId}/set_portal_password/`, data),
    verifyInstPortalPassword: (instId, data) =>
        api.post(`/api/institutions/institutions/${instId}/verify_portal_password/`, data),
    getMyInstitutions: () =>
        api.get('/api/institutions/institutions/my_institutions/'),
};

export default portalService;
