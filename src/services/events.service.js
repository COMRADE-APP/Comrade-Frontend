/**
 * Enhanced Events Service
 * Comprehensive API service for Events with ticketing, sharing, reactions, and permissions
 */
import api from './api';

const BASE_URL = '/events';

const eventsService = {
    // ===== CORE EVENT OPERATIONS =====

    /**
     * Get all events (with optional filters)
     */
    getAllEvents: (params = {}) => {
        return api.get(`${BASE_URL}/events/`, { params });
    },

    /**
     * Get event by ID
     */
    getEvent: (id) => {
        return api.get(`${BASE_URL}/events/${id}/`);
    },

    /**
     * Create new event
     */
    createEvent: (eventData) => {
        return api.post(`${BASE_URL}/event/`, eventData);
    },

    /**
     * Update event
     */
    updateEvent: (id, eventData) => {
        return api.patch(`${BASE_URL}/events/${id}/`, eventData);
    },

    /**
     * Delete event
     */
    deleteEvent: (id) => {
        return api.delete(`${BASE_URL}/events/${id}/`);
    },

    // ===== TICKETING =====

    /**
     * Purchase event ticket
     */
    purchaseTicket: (eventId, ticketData) => {
        return api.post(`${BASE_URL}/events/${eventId}/purchase_ticket/`, ticketData);
    },

    /**
     * Get user's ticket purchases
     */
    getMyTickets: () => {
        return api.get(`${BASE_URL}/tickets/my-tickets/`);
    },

    // ===== INTEREST & REACTIONS =====

    /**
     * Mark event as interested
     */
    markInterested: (eventId, interestedData = { interested: true, notify_updates: true }) => {
        return api.post(`${BASE_URL}/events/${eventId}/mark_interested/`, interestedData);
    },

    /**
     * Add reaction to event
     */
    addReaction: (eventId, reactionType) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_reaction/`, { reaction_type: reactionType });
    },

    /**
     * Remove reaction from event
     */
    removeReaction: (eventId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/remove_reaction/`);
    },

    // ===== COMMENTS =====

    /**
     * Add comment to event
     */
    addComment: (eventId, commentData) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_comment/`, commentData);
    },

    /**
     * Get all comments for event
     */
    getComments: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/comments/`);
    },

    /**
     * Update comment
     */
    updateComment: (commentId, content) => {
        return api.patch(`${BASE_URL}/comments/${commentId}/`, { content });
    },

    /**
     * Delete comment
     */
    deleteComment: (commentId) => {
        return api.delete(`${BASE_URL}/comments/${commentId}/`);
    },

    // ===== SHARING =====

    /**
     * Share event
     */
    shareEvent: (eventId, shareData) => {
        return api.post(`${BASE_URL}/events/${eventId}/share/`, shareData);
    },

    /**
     * Generate shareable link
     */
    generateShareLink: (eventId, platform = '', expiresHours = null) => {
        return api.post(`${BASE_URL}/events/${eventId}/generate_share_link/`, {
            platform,
            expires_hours: expiresHours
        });
    },

    // ===== PIN & REPOST =====

    /**
     * Pin event to dashboard
     */
    pinEvent: (eventId) => {
        return api.post(`${BASE_URL}/events/${eventId}/pin/`);
    },

    /**
     * Unpin event from dashboard
     */
    unpinEvent: (eventId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/unpin/`);
    },

    /**
     * Repost event to rooms
     */
    repostEvent: (eventId, repostData) => {
        return api.post(`${BASE_URL}/events/${eventId}/repost/`, repostData);
    },

    // ===== REPORTING & BLOCKING =====

    /**
     * Report event
     */
    reportEvent: (eventId, reportData) => {
        return api.post(`${BASE_URL}/events/${eventId}/report/`, reportData);
    },

    /**
     * Block event from feed
     */
    blockEvent: (eventId, reason = '') => {
        return api.post(`${BASE_URL}/events/${eventId}/block/`, { reason });
    },

    /**
     * Unblock event
     */
    unblockEvent: (eventId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/unblock/`);
    },

    // ===== REMINDERS =====

    /**
     * Set event reminder
     */
    setReminder: (eventId, reminderData) => {
        return api.post(`${BASE_URL}/events/${eventId}/set_reminder/`, reminderData);
    },

    /**
     * Get user's reminders
     */
    getMyReminders: () => {
        return api.get(`${BASE_URL}/reminders/`);
    },

    // ===== ROOM MANAGEMENT =====

    /**
     * Toggle event room (activate/deactivate)
     */
    toggleEventRoom: (eventId) => {
        return api.post(`${BASE_URL}/events/${eventId}/toggle_room/`);
    },

    /**
     * Get event room details
     */
    getEventRoom: (eventId) => {
        return api.get(`${BASE_URL}/event-rooms/${eventId}/`);
    },

    // ===== CONVERSION =====

    /**
     * Convert event to announcement
     */
    convertToAnnouncement: (eventId, retainEvent = true) => {
        return api.post(`${BASE_URL}/events/${eventId}/convert_to_announcement/`, {
            retain_event: retainEvent
        });
    },

    // ===== HELP SYSTEM =====

    /**
     * Request help from event organizers
     */
    requestHelp: (eventId, helpData) => {
        return api.post(`${BASE_URL}/events/${eventId}/request_help/`, helpData);
    },

    /**
     * Get help requests for event (organizers only)
     */
    getHelpRequests: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/help_requests/`);
    },

    /**
     * Respond to help request
     */
    respondToHelp: (requestId, responseData) => {
        return api.post(`${BASE_URL}/help-requests/${requestId}/respond/`, responseData);
    },

    // ===== RESOURCES =====

    /**
     * Get event resources
     */
    getEventResources: (eventId) => {
        return api.get(`${BASE_URL}/resource-access/?event=${eventId}`);
    },

    /**
       * Purchase event resource
       */
    purchaseResource: (resourceAccessId, purchaseData) => {
        return api.post(`${BASE_URL}/resource-purchases/`, {
            resource_access: resourceAccessId,
            ...purchaseData
        });
    },

    // ===== PERMISSIONS =====

    /**
     * Get event permissions
     */
    getEventPermissions: (eventId) => {
        return api.get(`${BASE_URL}/permissions/?event=${eventId}`);
    },

    /**
     * Grant event permission
     */
    grantPermission: (eventId, permissionData) => {
        return api.post(`${BASE_URL}/permissions/`, {
            event: eventId,
            ...permissionData
        });
    },

    // ===== INTERESTS & ATTENDANCE =====

    /**
     * Get interested events
     */
    getInterestedEvents: () => {
        return api.get(`${BASE_URL}/events/?interested=true`);
    },

    /**
     * Get pinned events
     */
    getPinnedEvents: () => {
        return api.get(`${BASE_URL}/pins/`);
    },

    // ===== STATISTICS =====

    /**
     * Get event statistics
     */
    getEventStats: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/stats/`);
    },

    // ===== SOCIAL FEATURES =====

    /**
     * Get event reactions summary
     */
    getReactionsSummary: (eventId) => {
        return api.get(`${BASE_URL}/reactions/?event=${eventId}`);
    },

    /**
     * Get event shares
     */
    getShares: (eventId) => {
        return api.get(`${BASE_URL}/shares/?event=${eventId}`);
    },

    // ===== VISIBILITY =====

    /**
     * Update event visibility
     */
    updateVisibility: (eventId, visibilityData) => {
        return api.patch(`${BASE_URL}/event_visibilities/${eventId}/`, visibilityData);
    },

    /**
     * Get feed events (respecting visibility & blocks)
     */
    getFeedEvents: (params = {}) => {
        return api.get(`${BASE_URL}/events/`, { params });
    },
};

export default eventsService;
