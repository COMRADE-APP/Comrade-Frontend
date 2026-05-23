import api from './api';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE = '/api/v1/notifications';
const WS_BASE = '/ws';

export const notificationService = {
    stompClient: null,
    connected: false,
    subscriptions: [],

    // REST API Methods
    async getNotifications(params = {}) {
        const response = await api.get(`${BASE}/`, { params });
        return response.data;
    },

    async getUnreadCount() {
        const response = await api.get(`${BASE}/unread_count/`);
        return response.data;
    },

    async markAsRead(notificationId) {
        const response = await api.post(`${BASE}/${notificationId}/mark_read/`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.post(`${BASE}/mark_all_read/`);
        return response.data;
    },

    async updatePreferences(preferences) {
        const response = await api.patch(`${BASE}/preferences/`, preferences);
        return response.data;
    },

    async getPreferences() {
        const response = await api.get(`${BASE}/preferences/`);
        return response.data;
    },

    // Provider-specific notification methods
    async getProviderNotifications() {
        const response = await api.get(`${BASE}/`, { 
            params: { 
                notification_type__startswith: 'provider' 
            } 
        });
        return response.data;
    },

    async getApplicationNotifications() {
        const response = await api.get(`${BASE}/`, { 
            params: { 
                notification_type__in: [
                    'provider_application_submitted',
                    'provider_application_approved',
                    'provider_application_rejected',
                    'provider_application_requires_changes'
                ] 
            } 
        });
        return response.data;
    },

    async getTransactionNotifications() {
        const response = await api.get(`${BASE}/`, { 
            params: { 
                notification_type__in: [
                    'provider_transaction_complete',
                    'provider_transaction_refund',
                    'provider_payout_received'
                ] 
            } 
        });
        return response.data;
    },

    // WebSocket Connection
    connect(userId, onNotification) {
        if (this.stompClient && this.connected) {
            return;
        }

        const socket = new SockJS(`${WS_BASE}/ws/notifications/`);
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, (frame) => {
            this.connected = true;
            console.log('Connected to notification WebSocket');

            // Subscribe to user's notification channel
            const subscription = this.stompClient.subscribe(`/user/notify_${userId}`, (message) => {
                const notification = JSON.parse(message.body);
                if (onNotification) {
                    onNotification(notification.payload || notification);
                }
            });

            this.subscriptions.push(subscription);
        }, (error) => {
            console.error('WebSocket connection error:', error);
            this.connected = false;
        });
    },

    disconnect() {
        if (this.stompClient) {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions = [];
            this.stompClient.disconnect();
            this.stompClient = null;
            this.connected = false;
        }
    },

    // Notification type helpers
    isProviderNotification(type) {
        return type?.startsWith('provider_');
    },

    isApplicationNotification(type) {
        return ['provider_application_submitted', 'provider_application_approved', 
            'provider_application_rejected', 'provider_application_requires_changes'].includes(type);
    },

    isTransactionNotification(type) {
        return ['provider_transaction_complete', 'provider_transaction_refund', 
            'provider_payout_received'].includes(type);
    },

    isQueryNotification(type) {
        return type === 'provider_query_response';
    },

    // Get action URL based on notification type
    getActionUrl(notification) {
        const { notification_type, extra_data } = notification;
        
        if (notification_type === 'provider_application_submitted' || 
            notification_type === 'provider_application_approved' ||
            notification_type === 'provider_application_rejected' ||
            notification_type === 'provider_application_requires_changes') {
            return `/payments/applications/${extra_data?.application_id || ''}`;
        }
        
        if (notification_type === 'provider_query_response') {
            return `/payments/queries/${extra_data?.query_id || ''}`;
        }
        
        if (notification_type === 'provider_transaction_complete' || 
            notification_type === 'provider_transaction_refund') {
            return `/payments/transactions/${extra_data?.transaction_id || ''}`;
        }
        
        if (notification_type === 'provider_payout_received') {
            return `/providers/dashboard`;
        }

        return notification.action_url || '/';
    },

    // Get display title for notification type
    getDisplayTitle(notification) {
        const { notification_type } = notification;
        const titles = {
            'provider_application_submitted': 'Application Submitted',
            'provider_application_approved': 'Application Approved',
            'provider_application_rejected': 'Application Rejected',
            'provider_application_requires_changes': 'Action Required',
            'provider_query_response': 'Query Response',
            'provider_transaction_complete': 'Transaction Complete',
            'provider_transaction_refund': 'Refund Issued',
            'provider_payout_received': 'Payout Received',
            'provider_document_approved': 'Document Approved',
            'provider_document_rejected': 'Document Rejected',
        };
        return titles[notification_type] || notification.title || 'Notification';
    }
};

export default notificationService;