import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

const shopService = {
    // Products (existing)
    getProducts: async () => {
        const response = await api.get(API_ENDPOINTS.PRODUCTS);
        return response.data;
    },
    getProduct: async (id) => {
        const response = await api.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
        return response.data;
    },

    // Establishments
    getEstablishments: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENTS, { params });
        return response.data;
    },
    getEstablishment: async (id) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENT_DETAIL(id));
        return response.data;
    },
    createEstablishment: async (data) => {
        const response = await api.post(API_ENDPOINTS.ESTABLISHMENTS, data);
        return response.data;
    },
    getMyEstablishments: async () => {
        const response = await api.get(API_ENDPOINTS.MY_ESTABLISHMENTS);
        return response.data;
    },
    getEstablishmentMenu: async (id) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENT_MENU(id));
        return response.data;
    },
    getEstablishmentRooms: async (id) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENT_ROOMS(id));
        return response.data;
    },
    getEstablishmentServices: async (id) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENT_SERVICES(id));
        return response.data;
    },
    getEstablishmentReviews: async (id) => {
        const response = await api.get(API_ENDPOINTS.ESTABLISHMENT_REVIEWS(id));
        return response.data;
    },

    // Menu Items
    createMenuItem: async (data) => {
        const response = await api.post(API_ENDPOINTS.MENU_ITEMS, data);
        return response.data;
    },
    updateMenuItem: async (id, data) => {
        const response = await api.patch(API_ENDPOINTS.MENU_ITEM_DETAIL(id), data);
        return response.data;
    },
    deleteMenuItem: async (id) => {
        await api.delete(API_ENDPOINTS.MENU_ITEM_DETAIL(id));
    },

    // Hotel Rooms
    createHotelRoom: async (data) => {
        const response = await api.post(API_ENDPOINTS.HOTEL_ROOMS, data);
        return response.data;
    },

    // Bookings
    getBookings: async () => {
        const response = await api.get(API_ENDPOINTS.BOOKINGS);
        return response.data;
    },
    createBooking: async (data) => {
        const response = await api.post(API_ENDPOINTS.BOOKINGS, data);
        return response.data;
    },
    confirmBooking: async (id) => {
        const response = await api.post(API_ENDPOINTS.BOOKING_CONFIRM(id));
        return response.data;
    },
    cancelBooking: async (id) => {
        const response = await api.post(API_ENDPOINTS.BOOKING_CANCEL(id));
        return response.data;
    },

    // Services
    getServices: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.SERVICES, { params });
        return response.data;
    },
    getService: async (id) => {
        const response = await api.get(API_ENDPOINTS.SERVICE_DETAIL(id));
        return response.data;
    },
    createService: async (data) => {
        const response = await api.post(API_ENDPOINTS.SERVICES, data);
        return response.data;
    },
    getAvailableSlots: async (serviceId) => {
        const response = await api.get(API_ENDPOINTS.SERVICE_AVAILABLE_SLOTS(serviceId));
        return response.data;
    },

    // Time Slots
    createTimeSlot: async (data) => {
        const response = await api.post(API_ENDPOINTS.TIME_SLOTS, data);
        return response.data;
    },
    bookTimeSlot: async (id) => {
        const response = await api.post(API_ENDPOINTS.TIME_SLOT_BOOK(id));
        return response.data;
    },

    // Orders
    getOrders: async () => {
        const response = await api.get(API_ENDPOINTS.MY_ORDERS);
        return response.data;
    },
    createOrder: async (data) => {
        const response = await api.post(API_ENDPOINTS.ORDERS, data);
        return response.data;
    },
    updateOrderStatus: async (id, status) => {
        const response = await api.post(API_ENDPOINTS.ORDER_UPDATE_STATUS(id), { status });
        return response.data;
    },

    // Reviews
    getReviews: async (establishmentId) => {
        const response = await api.get(API_ENDPOINTS.REVIEWS, { params: { establishment: establishmentId } });
        return response.data;
    },
    createReview: async (data) => {
        const response = await api.post(API_ENDPOINTS.REVIEWS, data);
        return response.data;
    },
};

export default shopService;
