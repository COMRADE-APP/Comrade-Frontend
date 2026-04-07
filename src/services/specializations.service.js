import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const specializationsService = {
    // ============ CATALOG ============
    async getAll() {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATIONS);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATION_DETAIL(id));
        return response.data;
    },

    async create(data) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATIONS, data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.patch(API_ENDPOINTS.SPECIALIZATION_DETAIL(id), data);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(API_ENDPOINTS.SPECIALIZATION_DETAIL(id));
        return response.data;
    },

    // ============ STACKS ============
    async getAllStacks() {
        const response = await api.get(API_ENDPOINTS.STACKS);
        return response.data;
    },

    async getStackById(id) {
        const response = await api.get(API_ENDPOINTS.STACK_DETAIL(id));
        return response.data;
    },

    async createStack(data) {
        const response = await api.post(API_ENDPOINTS.STACKS, data);
        return response.data;
    },

    async completeStack(id) {
        const response = await api.post(API_ENDPOINTS.STACK_COMPLETE(id));
        return response.data;
    },

    // ============ ENROLLMENT ============
    async enroll(id) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATION_ENROLL(id));
        return response.data;
    },

    async enrollWithPayment(id, paymentData) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATION_ENROLL(id), paymentData);
        return response.data;
    },

    async groupEnroll(id, groupData) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATION_DETAIL(id) + 'group_enroll/', groupData);
        return response.data;
    },

    async getMyEnrollments(statusFilter) {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await api.get(API_ENDPOINTS.MY_ENROLLMENTS, { params });
        return response.data;
    },

    async dropEnrollment(id) {
        const response = await api.post(API_ENDPOINTS.ENROLLMENT_DROP(id));
        return response.data;
    },

    async unlockEnrollment(id) {
        const response = await api.post(API_ENDPOINTS.ENROLLMENT_UNLOCK(id));
        return response.data;
    },

    // ============ PROGRESS ============
    async getProgress(specializationId) {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATION_PROGRESS(specializationId));
        return response.data;
    },

    // ============ LESSONS ============
    async getLessons(stackId) {
        const response = await api.get(API_ENDPOINTS.LESSONS, { params: { stack_id: stackId } });
        return response.data;
    },

    async getLessonById(id) {
        const response = await api.get(API_ENDPOINTS.LESSON_DETAIL(id));
        return response.data;
    },

    async createLesson(data) {
        const response = await api.post(API_ENDPOINTS.LESSONS, data);
        return response.data;
    },

    async updateLesson(id, data) {
        const response = await api.patch(API_ENDPOINTS.LESSON_DETAIL(id), data);
        return response.data;
    },

    async completeLesson(id) {
        const response = await api.post(API_ENDPOINTS.LESSON_COMPLETE(id));
        return response.data;
    },

    // ============ QUIZZES ============
    async getQuizzes(params) {
        const response = await api.get(API_ENDPOINTS.QUIZZES, { params });
        return response.data;
    },

    async getQuizById(id) {
        const response = await api.get(API_ENDPOINTS.QUIZ_DETAIL(id));
        return response.data;
    },

    async createQuiz(data) {
        const response = await api.post(API_ENDPOINTS.QUIZZES, data);
        return response.data;
    },

    async submitQuizAttempt(quizId, answers) {
        const response = await api.post(API_ENDPOINTS.QUIZ_SUBMIT(quizId), { answers });
        return response.data;
    },

    async getMyAttempts(quizId) {
        const response = await api.get(API_ENDPOINTS.QUIZ_MY_ATTEMPTS(quizId));
        return response.data;
    },

    // ============ QUIZ QUESTIONS ============
    async createQuizQuestion(data) {
        const response = await api.post(API_ENDPOINTS.QUIZ_QUESTIONS, data);
        return response.data;
    },

    // ============ CERTIFICATES ============
    async getCertificates() {
        const response = await api.get(API_ENDPOINTS.CERTIFICATES);
        return response.data;
    },

    async getIssuedCertificates() {
        const response = await api.get(API_ENDPOINTS.ISSUED_CERTIFICATES);
        return response.data;
    },

    async verifyCertificate(code) {
        const response = await api.get(API_ENDPOINTS.VERIFY_CERTIFICATE, { params: { code } });
        return response.data;
    },

    // ============ ANALYTICS ============
    async getAnalytics(id) {
        const response = await api.get(API_ENDPOINTS.SPECIALIZATION_DETAIL(id) + 'analytics/');
        return response.data;
    },

    async generateFromFiles(formData) {
        const response = await api.post(
            API_ENDPOINTS.SPECIALIZATIONS + 'generate_from_files/',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    // Legacy
    async join(id) {
        const response = await api.post(API_ENDPOINTS.SPECIALIZATION_ENROLL(id));
        return response.data;
    },
};

export default specializationsService;
