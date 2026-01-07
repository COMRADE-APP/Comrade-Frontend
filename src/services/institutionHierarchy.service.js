/**
 * Institution Hierarchy Service
 * Manage institution structure - branches, faculties, departments, etc.
 */
import api from './api';

const INSTITUTION_BASE_URL = '/api/institutions';

export const institutionHierarchyService = {
    // Branches
    async getBranches() {
        const response = await api.get('/api/branches/');
        return response.data;
    },

    async createBranch(branchData) {
        const response = await api.post('/api/branches/', branchData);
        return response.data;
    },

    // Faculties
    async getFaculties() {
        const response = await api.get('/api/faculties/');
        return response.data;
    },

    async createFaculty(facultyData) {
        const response = await api.post('/api/faculties/', facultyData);
        return response.data;
    },

    // Departments
    async getDepartments() {
        const response = await api.get('/api/departments/');
        return response.data;
    },

    async createDepartment(departmentData) {
        const response = await api.post('/api/departments/', departmentData);
        return response.data;
    },

    // Programs
    async getPrograms() {
        const response = await api.get('/api/programmes/');
        return response.data;
    },

    async createProgram(programData) {
        const response = await api.post('/api/programmes/', programData);
        return response.data;
    },

    // Administrative Units
    async getAdminDepartments() {
        const response = await api.get('/api/admin-departments/');
        return response.data;
    },

    async createAdminDepartment(data) {
        const response = await api.post('/api/admin-departments/', data);
        return response.data;
    },

    // Student Affairs
    async getStudentAffairs() {
        const response = await api.get('/api/student-affairs/');
        return response.data;
    },

    async createStudentAffairs(data) {
        const response = await api.post('/api/student-affairs/', data);
        return response.data;
    },

    // Support Services
    async getSupportServices() {
        const response = await api.get('/api/support-services/');
        return response.data;
    },

    async createSupportService(data) {
        const response = await api.post('/api/support-services/', data);
        return response.data;
    },
};

export default institutionHierarchyService;
