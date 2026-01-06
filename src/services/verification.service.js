import api from './api';

const verificationService = {
    // Institution Verification
    createInstitution: async (data) => {
        return api.post('/api/verification/institutions/', data);
    },

    getInstitution: async (id) => {
        return api.get(`/api/verification/institutions/${id}/`);
    },

    listInstitutions: async (params) => {
        return api.get('/api/verification/institutions/', { params });
    },

    uploadInstitutionDocument: async (id, file, documentType) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        return api.post(`/api/verification/institutions/${id}/upload_document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    sendInstitutionEmailVerification: async (id) => {
        return api.post(`/api/verification/institutions/${id}/send_email_verification/`);
    },

    verifyInstitutionEmail: async (id, code) => {
        return api.post(`/api/verification/institutions/${id}/verify_email/`, {
            verification_code: code
        });
    },

    verifyInstitutionWebsite: async (id, method) => {
        return api.post(`/api/verification/institutions/${id}/verify_website/`, {
            verification_method: method
        });
    },

    submitInstitution: async (id) => {
        return api.post(`/api/verification/institutions/${id}/submit/`);
    },

    approveInstitution: async (id, notes) => {
        return api.post(`/api/verification/institutions/${id}/approve/`, { notes });
    },

    rejectInstitution: async (id, reason, notes) => {
        return api.post(`/api/verification/institutions/${id}/reject/`, { reason, notes });
    },

    // Organization Verification
    createOrganization: async (data) => {
        return api.post('/api/verification/organizations/', data);
    },

    getOrganization: async (id) => {
        return api.get(`/api/verification/organizations/${id}/`);
    },

    listOrganizations: async (params) => {
        return api.get('/api/verification/organizations/', { params });
    },

    uploadOrganizationDocument: async (id, file, documentType) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        return api.post(`/api/verification/organizations/${id}/upload_document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    sendOrganizationEmailVerification: async (id) => {
        return api.post(`/api/verification/organizations/${id}/send_email_verification/`);
    },

    verifyOrganizationEmail: async (id, code) => {
        return api.post(`/api/verification/organizations/${id}/verify_email/`, {
            verification_code: code
        });
    },

    verifyOrganizationWebsite: async (id, method) => {
        return api.post(`/api/verification/organizations/${id}/verify_website/`, {
            verification_method: method
        });
    },

    submitOrganization: async (id) => {
        return api.post(`/api/verification/organizations/${id}/submit/`);
    },

    approveOrganization: async (id, notes) => {
        return api.post(`/api/verification/organizations/${id}/approve/`, { notes });
    },

    rejectOrganization: async (id, reason, notes) => {
        return api.post(`/api/verification/organizations/${id}/reject/`, { reason, notes });
    }
};

export default verificationService;
