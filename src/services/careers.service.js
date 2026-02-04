/**
 * Careers & Gigs Service
 * API integration for gigs, career opportunities, and recommendations
 */
import api from './api';

const API_BASE = '/careers';

// ==============================================================================
// GIGS
// ==============================================================================

export const gigsService = {
    /**
     * Get all gigs with optional filters
     */
    getAll: (params = {}) => api.get(`${API_BASE}/gigs/`, { params }),

    /**
     * Get recommended gigs for current user
     */
    getRecommended: () => api.get(`${API_BASE}/gigs/recommended/`),

    /**
     * Get gigs created by current user
     */
    getMyGigs: () => api.get(`${API_BASE}/gigs/my_gigs/`),

    /**
     * Get single gig by ID
     */
    getById: (id) => api.get(`${API_BASE}/gigs/${id}/`),

    /**
     * Create new gig
     */
    create: (data) => api.post(`${API_BASE}/gigs/`, data),

    /**
     * Update gig
     */
    update: (id, data) => api.patch(`${API_BASE}/gigs/${id}/`, data),

    /**
     * Delete gig
     */
    delete: (id) => api.delete(`${API_BASE}/gigs/${id}/`),

    /**
     * Apply to a gig
     */
    apply: (gigId, data) => api.post(`${API_BASE}/gig-applications/`, { gig: gigId, ...data }),

    /**
     * Get applications for a gig
     */
    getApplications: (gigId) => api.get(`${API_BASE}/gig-applications/`, { params: { gig_id: gigId } }),
};

// ==============================================================================
// CAREER OPPORTUNITIES
// ==============================================================================

export const careersService = {
    /**
     * Get all career opportunities with optional filters
     */
    getAll: (params = {}) => api.get(`${API_BASE}/careers/`, { params }),

    /**
     * Get recommended careers for current user
     */
    getRecommended: () => api.get(`${API_BASE}/careers/recommended/`),

    /**
     * Get careers posted by current user
     */
    getMyPostings: () => api.get(`${API_BASE}/careers/my_postings/`),

    /**
     * Get single career by ID
     */
    getById: (id) => api.get(`${API_BASE}/careers/${id}/`),

    /**
     * Create new career opportunity
     */
    create: (data) => api.post(`${API_BASE}/careers/`, data),

    /**
     * Update career opportunity
     */
    update: (id, data) => api.patch(`${API_BASE}/careers/${id}/`, data),

    /**
     * Delete career opportunity
     */
    delete: (id) => api.delete(`${API_BASE}/careers/${id}/`),

    /**
     * Apply to a career
     */
    apply: (careerId, data) => {
        const formData = new FormData();
        formData.append('career', careerId);
        formData.append('cover_letter', data.cover_letter);
        if (data.resume) {
            formData.append('resume', data.resume);
        }
        return api.post(`${API_BASE}/career-applications/`, formData, {
            headers: { 'Content-Type': undefined }
        });
    },

    /**
     * Get applications for a career
     */
    getApplications: (careerId) => api.get(`${API_BASE}/career-applications/`, { params: { career_id: careerId } }),
};

// ==============================================================================
// USER PREFERENCES
// ==============================================================================

export const careerPreferencesService = {
    /**
     * Get current user's career preferences
     */
    get: () => api.get(`${API_BASE}/preferences/`),

    /**
     * Create or update user's career preferences
     */
    save: (data) => api.post(`${API_BASE}/preferences/`, data),
};

export default {
    gigs: gigsService,
    careers: careersService,
    preferences: careerPreferencesService,
};
