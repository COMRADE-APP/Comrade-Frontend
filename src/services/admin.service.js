import api from './api';

const BASE = '/auth/admin';

const adminService = {
    // Dashboard
    getDashboardStats: () => api.get(`${BASE}/dashboard-stats/`),

    // User Management
    getUsers: (params = {}) => api.get(`${BASE}/users-management/`, { params }),
    toggleUserActive: (userId) => api.post(`${BASE}/users/${userId}/toggle-active/`),
    updateUserRole: (userId, role) => api.post(`${BASE}/users/${userId}/update-role/`, { role }),

    // Content Moderation
    getContent: (params = {}) => api.get(`${BASE}/content/`, { params }),
    deleteContent: (type, id) => api.post(`${BASE}/content/delete/`, { type, id }),

    // Role Change Requests (uses existing endpoint)
    getRoleRequests: (params = {}) => api.get('/auth/role-change-requests/', { params }),
    reviewRoleRequest: (id, action, notes = '') =>
        api.patch(`/auth/role-change-requests/${id}/`, { action, review_notes: notes }),

    // Deletion Requests (uses existing router-based endpoint)
    getDeletionRequests: (params = {}) => api.get('/auth/admin/deletion-requests/', { params }),
    approveDeletion: (id, notes = '') =>
        api.post(`/auth/admin/deletion-requests/${id}/approve/`, { review_notes: notes }),
    rejectDeletion: (id, notes = '') =>
        api.post(`/auth/admin/deletion-requests/${id}/reject/`, { review_notes: notes }),

    // Verifications (uses existing endpoints)
    getInstitutions: (params = {}) => api.get('/api/institutions/', { params }),
    reviewInstitution: (id, action, notes = '') =>
        api.patch(`/api/institutions/${id}/`, { status: action, review_notes: notes }),
    getOrganizations: (params = {}) => api.get('/api/organizations/', { params }),
    reviewOrganization: (id, action, notes = '') =>
        api.patch(`/api/organizations/${id}/`, { status: action, review_notes: notes }),

    // Analytics
    getAnalytics: (params = {}) => api.get(`${BASE}/analytics/`, { params }),

    // System
    getSystemInfo: () => api.get(`${BASE}/system-info/`),
};

export default adminService;
