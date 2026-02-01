import api from './api';

// Unit types for Institution hierarchy
const INST_UNIT_TYPES = {
    branch: 'inst-branches',
    faculty: 'faculties',
    department: 'inst-departments',
    programme: 'programmes',
    admin_dep: 'admin-departments',
    vc_office: 'vc-offices',
    student_affairs: 'student-affairs',
    support_services: 'support-services',
};

// Unit types for Organisation hierarchy
const ORG_UNIT_TYPES = {
    division: 'divisions',
    department: 'departments',
    section: 'sections',
    unit: 'units',
    team: 'teams',
};

const unitsService = {
    // ======================================
    // Institution Units
    // ======================================

    /**
     * Get all units of a specific type for an institution
     */
    async getInstitutionUnits(institutionId, unitType = 'branch') {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.get(`/api/institutions/${endpoint}/`, {
            params: { institution: institutionId }
        });
        return response.data.results || response.data;
    },

    /**
     * Get pending units for an institution (admin only)
     */
    async getPendingInstitutionUnits(institutionId, unitType = 'branch') {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.get(`/api/institutions/${endpoint}/pending_units/`, {
            params: { institution: institutionId }
        });
        return response.data.results || response.data;
    },

    /**
     * Create a new unit for an institution
     */
    async createInstitutionUnit(institutionId, unitType, data) {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const payload = { ...data, institution: institutionId };
        const response = await api.post(`/api/institutions/${endpoint}/`, payload);
        return response.data;
    },

    /**
     * Approve a pending unit
     */
    async approveInstitutionUnit(unitId, unitType = 'branch') {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.post(`/api/institutions/${endpoint}/${unitId}/approve/`);
        return response.data;
    },

    /**
     * Reject a pending unit
     */
    async rejectInstitutionUnit(unitId, unitType, reason = '') {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.post(`/api/institutions/${endpoint}/${unitId}/reject/`, { reason });
        return response.data;
    },

    /**
     * Get a single unit by ID
     */
    async getInstitutionUnit(unitId, unitType = 'branch') {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.get(`/api/institutions/${endpoint}/${unitId}/`);
        return response.data;
    },

    /**
     * Update a unit
     */
    async updateInstitutionUnit(unitId, unitType, data) {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        const response = await api.patch(`/api/institutions/${endpoint}/${unitId}/`, data);
        return response.data;
    },

    /**
     * Delete a unit
     */
    async deleteInstitutionUnit(unitId, unitType) {
        const endpoint = INST_UNIT_TYPES[unitType] || 'inst-branches';
        await api.delete(`/api/institutions/${endpoint}/${unitId}/`);
    },

    // ======================================
    // Organisation Units
    // ======================================

    /**
     * Get all units of a specific type for an organisation
     */
    async getOrganisationUnits(organisationId, unitType = 'division') {
        const endpoint = ORG_UNIT_TYPES[unitType] || 'divisions';
        const response = await api.get(`/api/organizations/${endpoint}/`, {
            params: { organisation: organisationId }
        });
        return response.data.results || response.data;
    },

    /**
     * Create a new unit for an organisation
     */
    async createOrganisationUnit(organisationId, unitType, data) {
        const endpoint = ORG_UNIT_TYPES[unitType] || 'divisions';
        const payload = { ...data, organisation: organisationId };
        const response = await api.post(`/api/organizations/${endpoint}/`, payload);
        return response.data;
    },

    // ======================================
    // Helper Methods
    // ======================================

    /**
     * Get all unit types available for institutions
     */
    getInstitutionUnitTypes() {
        return [
            { key: 'branch', label: 'Branch/Campus', endpoint: 'inst-branches' },
            { key: 'faculty', label: 'Faculty/School', endpoint: 'faculties' },
            { key: 'department', label: 'Department', endpoint: 'inst-departments' },
            { key: 'programme', label: 'Programme/Course', endpoint: 'programmes' },
            { key: 'admin_dep', label: 'Administrative Department', endpoint: 'admin-departments' },
            { key: 'vc_office', label: 'VC Office', endpoint: 'vc-offices' },
            { key: 'student_affairs', label: 'Student Affairs', endpoint: 'student-affairs' },
            { key: 'support_services', label: 'Support Services', endpoint: 'support-services' },
        ];
    },

    /**
     * Get all unit types available for organisations
     */
    getOrganisationUnitTypes() {
        return [
            { key: 'division', label: 'Division', endpoint: 'divisions' },
            { key: 'department', label: 'Department', endpoint: 'departments' },
            { key: 'section', label: 'Section', endpoint: 'sections' },
            { key: 'unit', label: 'Unit', endpoint: 'units' },
            { key: 'team', label: 'Team', endpoint: 'teams' },
        ];
    },
};

export default unitsService;
