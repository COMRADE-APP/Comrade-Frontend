import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const fundingService = {
    // Business Management
    createBusiness: async (data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.BUSINESSES, data);
        return response.data;
    },

    getMyBusinesses: async () => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.BUSINESSES}my_businesses/`);
        // Custom action returns simple array
        return response.data;
    },

    getAllBusinesses: async () => {
        const response = await api.get(API_ENDPOINTS.FUNDING.BUSINESSES);
        // ModelViewSet list returns paginated object { results: [...] }
        return response.data.results || response.data;
    },

    // Documents
    uploadDocument: async (formData) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.DOCUMENTS, formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },

    // Opportunities
    getOpportunities: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.FUNDING.OPPORTUNITIES, { params });
        // ModelViewSet list returns paginated object
        return response.data.results || response.data;
    },

    // Specific Categories
    getCharities: async () => {
        // Charities are Business objects with is_charity=True
        // We can either filter on frontend or use a specific endpoint if one exists.
        // The ViewSet supports filtering by is_charity.
        const response = await api.get(API_ENDPOINTS.FUNDING.BUSINESSES, {
            params: { is_charity: true }
        });
        return response.data.results || response.data;
    },

    getMMFs: () => fundingService.getOpportunities({ type: 'mmf' }),
    getStocks: () => fundingService.getOpportunities({ type: 'stock' }),
    getBondsDomestic: () => fundingService.getOpportunities({ type: 'bond_domestic' }),
    getBondsForeign: () => fundingService.getOpportunities({ type: 'bond_foreign' }),
    getAgencies: () => fundingService.getOpportunities({ type: 'agency' }),

    // Requests
    createRequest: async (data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.REQUESTS, data);
        return response.data;
    },

    getRequests: async () => {
        const response = await api.get(API_ENDPOINTS.FUNDING.REQUESTS);
        return response.data.results || response.data;
    },

    getRequestDetail: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.REQUESTS}${id}/`);
        return response.data;
    },

    // Get funding requests for current user's businesses (for tracking)
    getMyRequests: async () => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.REQUESTS}my_requests/`);
        return response.data;
    },

    // Get business detail
    getBusinessDetail: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.BUSINESSES}${id}/`);
        return response.data;
    },

    // ==================== CAPITAL VENTURES ====================

    // Get all capital ventures (funding organizations)
    getVentures: async () => {
        const response = await api.get(API_ENDPOINTS.FUNDING.VENTURES);
        return response.data.results || response.data;
    },

    // Get ventures user is associated with
    getMyVentures: async () => {
        const response = await api.get(`${API_ENDPOINTS.FUNDING.VENTURES}my_ventures/`);
        return response.data;
    },

    // Create a new capital venture (funding organization)
    createVenture: async (data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.VENTURES, data);
        return response.data;
    },

    // Get venture detail
    getVentureDetail: async (id) => {
        const response = await api.get(API_ENDPOINTS.FUNDING.VENTURE_DETAIL(id));
        return response.data;
    },

    // Get funding requests for a venture
    getVentureRequests: async (ventureId) => {
        const response = await api.get(API_ENDPOINTS.FUNDING.VENTURE_REQUESTS(ventureId));
        return response.data;
    },

    // Review a funding request (change status)
    reviewRequest: async (ventureId, data) => {
        const response = await api.post(API_ENDPOINTS.FUNDING.VENTURE_REVIEW(ventureId), data);
        return response.data;
    },

    // Create negotiation room for a funding request
    createNegotiationRoom: async (ventureId, fundingRequestId) => {
        const response = await api.post(`${API_ENDPOINTS.FUNDING.VENTURE_DETAIL(ventureId)}create_negotiation_room/`, {
            funding_request_id: fundingRequestId
        });
        return response.data;
    },
};

export default fundingService;

