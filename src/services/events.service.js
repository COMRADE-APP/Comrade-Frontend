/**
 * Enhanced Events Service
 * Comprehensive API service for Events with ticketing, sharing, reactions, and permissions
 */
import api from './api';

const BASE_URL = '/api/events';

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
     * Get user's created events
     */
    getMyEvents: () => {
        return api.get(`${BASE_URL}/event/my_events/`);
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
        return api.patch(`${BASE_URL}/${id}/`, eventData);
    },

    /**
     * Delete event
     */
    deleteEvent: (id) => {
        return api.delete(`${BASE_URL}/${id}/`);
    },

    /**
     * AI Parse Event Document for Auto-fill
     */
    parseDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`${BASE_URL}/event/parse-document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // ===== TICKETING =====

    /**
     * Purchase event ticket / Book slots
     */
    purchaseTicket: (eventId, ticketData) => {
        return api.post(`${BASE_URL}/slot_bookings/book_slot/`, { event_id: eventId, ...ticketData });
    },

    /**
     * Get event analytics dashboard data
     */
    getAnalytics: (eventId) => {
        return api.get(`${BASE_URL}/event_analytics/event_dashboard/`, { params: { event_id: eventId } });
    },

    /**
     * Get available tickets for event
     */
    getEventTickets: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/tickets/`);
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
        return api.post(`${BASE_URL}/${eventId}/mark_interested/`, interestedData);
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
        return api.post(`${BASE_URL}/${eventId}/generate_share_link/`, {
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
        return api.post(`${BASE_URL}/${eventId}/repost/`, repostData);
    },

    // ===== REPORTING & BLOCKING =====

    /**
     * Report event
     */
    reportEvent: (eventId, reportData) => {
        return api.post(`${BASE_URL}/${eventId}/report/`, reportData);
    },

    /**
     * Block event from feed
     */
    blockEvent: (eventId, reason = '') => {
        return api.post(`${BASE_URL}/${eventId}/block/`, { reason });
    },

    /**
     * Unblock event
     */
    unblockEvent: (eventId) => {
        return api.delete(`${BASE_URL}/${eventId}/unblock/`);
    },

    /**
     * Submit event feedback / review
     */
    submitFeedback: (eventId, feedbackData) => {
        // feedbackData should have { rating, feedback_text }
        return api.post(`${BASE_URL}/events/${eventId}/submit_review/`, feedbackData);
    },

    /**
     * Get event feedback / reviews
     */
    getEventFeedback: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/reviews/`);
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
        return api.post(`${BASE_URL}/${eventId}/toggle_room/`);
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
        return api.post(`${BASE_URL}/${eventId}/convert_to_announcement/`, {
            retain_event: retainEvent
        });
    },

    // ===== HELP SYSTEM =====

    /**
     * Request help from event organizers
     */
    requestHelp: (eventId, helpData) => {
        return api.post(`${BASE_URL}/${eventId}/request_help/`, helpData);
    },

    /**
     * Get help requests for event (organizers only)
     */
    getHelpRequests: (eventId) => {
        return api.get(`${BASE_URL}/${eventId}/help_requests/`);
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
        return api.get(`${BASE_URL}/?interested=true`);
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
        return api.get(`${BASE_URL}/${eventId}/stats/`);
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
        return api.get(`${BASE_URL}/`, { params });
    },

    // ===== LOGISTICS: DOCUMENTS =====

    /**
     * Get documents for an event
     */
    getEventDocuments: (eventId) => {
        return api.get(`${BASE_URL}/event_documents/?event=${eventId}`);
    },

    /**
     * Upload document to event
     */
    uploadDocument: (eventId, documentData) => {
        const formData = new FormData();
        formData.append('event', eventId);
        Object.keys(documentData).forEach(key => {
            formData.append(key, documentData[key]);
        });
        return api.post(`${BASE_URL}/event_documents/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Download document (tracks download count)
     */
    downloadDocument: (documentId) => {
        return api.post(`${BASE_URL}/event_documents/${documentId}/download/`);
    },

    /**
     * Archive document
     */
    archiveDocument: (documentId) => {
        return api.post(`${BASE_URL}/event_documents/${documentId}/archive/`);
    },

    // ===== LOGISTICS: ARTICLES =====

    /**
     * Get articles linked to event
     */
    getEventArticles: (eventId, linkType = null) => {
        const params = { event: eventId };
        if (linkType) params.link_type = linkType;
        return api.get(`${BASE_URL}/event_article_links/`, { params });
    },

    /**
     * Link article to event
     */
    linkArticleToEvent: (eventId, articleId, linkType = 'related') => {
        return api.post(`${BASE_URL}/event_article_links/`, {
            event: eventId,
            article: articleId,
            link_type: linkType
        });
    },

    /**
     * Unlink article from event
     */
    unlinkArticleFromEvent: (linkId) => {
        return api.delete(`${BASE_URL}/event_article_links/${linkId}/`);
    },

    // ===== LOGISTICS: RESEARCH =====

    /**
     * Get research projects linked to event
     */
    getEventResearch: (eventId) => {
        return api.get(`${BASE_URL}/event_research_links/?event=${eventId}`);
    },

    /**
     * Link research to event
     */
    linkResearchToEvent: (eventId, researchId, presentationOrder = 0, isKeynote = false) => {
        return api.post(`${BASE_URL}/event_research_links/`, {
            event: eventId,
            research: researchId,
            presentation_order: presentationOrder,
            is_keynote: isKeynote
        });
    },

    // ===== LOGISTICS: ANNOUNCEMENTS =====

    /**
     * Get announcements linked to event
     */
    getEventAnnouncements: (eventId) => {
        return api.get(`${BASE_URL}/event_announcement_links/?event=${eventId}`);
    },

    /**
     * Link announcement to event
     */
    linkAnnouncementToEvent: (eventId, announcementId, linkType = 'promotion') => {
        return api.post(`${BASE_URL}/event_announcement_links/`, {
            event: eventId,
            announcement: announcementId,
            link_type: linkType
        });
    },

    // ===== LOGISTICS: PRODUCTS =====

    /**
     * Get products linked to event
     */
    getEventProducts: (eventId, availableOnly = false) => {
        const params = { event: eventId };
        if (availableOnly) params.available = 'true';
        return api.get(`${BASE_URL}/event_product_links/`, { params });
    },

    /**
     * Get exclusive event products
     */
    getExclusiveProducts: (eventId = null) => {
        const params = eventId ? { event: eventId } : {};
        return api.get(`${BASE_URL}/event_product_links/exclusive/`, { params });
    },

    /**
     * Link product to event
     */
    linkProductToEvent: (eventId, productData) => {
        return api.post(`${BASE_URL}/event_product_links/`, {
            event: eventId,
            ...productData
        });
    },

    // ===== LOGISTICS: PAYMENT GROUPS (PIGGY BANKS) =====

    /**
     * Get payment groups linked to event
     */
    getEventPaymentGroups: (eventId, purpose = null) => {
        const params = { event: eventId };
        if (purpose) params.purpose = purpose;
        return api.get(`${BASE_URL}/event_payment_group_links/`, { params });
    },

    /**
     * Get funding progress for event
     */
    getEventFundingProgress: (eventId) => {
        return api.get(`${BASE_URL}/event_payment_group_links/progress/?event=${eventId}`);
    },

    /**
     * Link payment group to event
     */
    linkPaymentGroupToEvent: (eventId, paymentGroupId, purpose = 'general', targetAmount = 0) => {
        return api.post(`${BASE_URL}/event_payment_group_links/`, {
            event: eventId,
            payment_group: paymentGroupId,
            purpose,
            target_amount: targetAmount
        });
    },

    // ===== REACTIONS (love, excited, remind-me) =====

    addReaction: (eventId, reactionType) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_reaction/`, { reaction_type: reactionType });
    },

    removeReaction: (eventId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/remove_reaction/`);
    },

    // ===== USER REMINDERS (3-channel: notification, system message, email) =====

    setUserReminder: (eventId, timeBefore) => {
        return api.post(`${BASE_URL}/events/${eventId}/set_user_reminder/`, { time_before: timeBefore });
    },

    removeUserReminder: (eventId, timeBefore = null) => {
        const params = timeBefore ? `?time_before=${timeBefore}` : '';
        return api.delete(`${BASE_URL}/events/${eventId}/remove_user_reminder/${params}`);
    },

    getMyReminders: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/my_reminders/`);
    },

    // ===== SCHEDULE MANAGEMENT =====

    getSchedule: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/schedule/`);
    },

    addScheduleItem: (eventId, data) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_schedule_item/`, data);
    },

    deleteScheduleItem: (eventId, itemId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/delete_schedule_item/${itemId}/`);
    },

    // ===== SPEAKERS =====

    getSpeakers: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/event_speakers/`);
    },

    addSpeaker: (eventId, data) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_speaker/`, data);
    },

    // ===== MATERIALS/FILES =====

    getMaterials: (eventId) => {
        return api.get(`${BASE_URL}/events/${eventId}/materials/`);
    },

    getEventDocuments: (eventId) => {
        return api.get(`${BASE_URL}/event_documents/?event=${eventId}`);
    },

    uploadDocument: (eventId, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        formData.append('event', eventId);
        return api.post(`${BASE_URL}/event_documents/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    downloadDocument: (docId) => {
        return api.post(`${BASE_URL}/event_documents/${docId}/download/`);
    },

    archiveDocument: (docId) => {
        return api.patch(`${BASE_URL}/event_documents/${docId}/`, { is_archived: true });
    },

    getEventArticles: (eventId) => {
        return api.get(`${BASE_URL}/event_article_links/?event=${eventId}`);
    },

    getEventResearch: (eventId) => {
        return api.get(`${BASE_URL}/event_research_links/?event=${eventId}`);
    },

    getEventAnnouncements: (eventId) => {
        return api.get(`${BASE_URL}/event_announcement_links/?event=${eventId}`);
    },

    getEventProducts: (eventId) => {
        return api.get(`${BASE_URL}/event_product_links/?event=${eventId}`);
    },

    addMaterial: (eventId, data) => {
        return api.post(`${BASE_URL}/events/${eventId}/add_material/`, data);
    },

    deleteMaterial: (eventId, materialId) => {
        return api.delete(`${BASE_URL}/events/${eventId}/delete_material/${materialId}/`);
    },

    // ===== ANALYTICS =====

    logInteraction: (eventId, interactionType, durationSeconds = 0) => {
        return api.post(`${BASE_URL}/event_analytics/log_interaction/`, {
            event_id: eventId,
            interaction_type: interactionType,
            duration_seconds: durationSeconds
        }).catch(() => { });
    },

    getEventAnalytics: (eventId) => {
        return api.get(`${BASE_URL}/event_analytics/event_dashboard/?event_id=${eventId}`);
    },

    // ===== SLOT BOOKING =====

    bookSlot: (eventId, ticketId = null, ticketTierId = null, quantity = 1) => {
        return api.post(`${BASE_URL}/slot_bookings/book_slot/`, {
            event_id: eventId,
            ticket_id: ticketId,
            ticket_tier_id: ticketTierId,
            quantity: quantity
        });
    },

    getMyBookings: () => {
        return api.get(`${BASE_URL}/slot_bookings/my_bookings/`);
    },

    getAvailability: (eventId) => {
        return api.get(`${BASE_URL}/slot_bookings/availability/${eventId}/`);
    },

    cancelBooking: (bookingId) => {
        return api.post(`${BASE_URL}/slot_bookings/${bookingId}/cancel/`);
    },

    confirmPayment: (bookingId) => {
        return api.post(`${BASE_URL}/slot_bookings/${bookingId}/confirm_payment/`);
    },
};

export default eventsService;

