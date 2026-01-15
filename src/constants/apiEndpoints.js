const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Authentication
    LOGIN: `${API_BASE_URL}/auth/login/`,
    LOGIN_VERIFY: `${API_BASE_URL}/auth/login-verify/`,
    RESEND_OTP: `${API_BASE_URL}/auth/resend-otp/`,
    LOGOUT: `${API_BASE_URL}/auth/logout/`,
    REGISTER: `${API_BASE_URL}/auth/register/`,
    REGISTER_VERIFY: `${API_BASE_URL}/auth/register-verify/`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify/`, // Initial email verification link (GET)

    // Password Reset
    PASSWORD_RESET_REQUEST: `${API_BASE_URL}/auth/password-reset-request/`,
    PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/auth/password-reset-confirm/`,

    // 2FA / OTP
    SETUP_2FA: `${API_BASE_URL}/auth/setup-2fa/`,
    CONFIRM_2FA_SETUP: `${API_BASE_URL}/auth/confirm-2fa-setup/`,
    VERIFY_2FA: `${API_BASE_URL}/auth/verify-2fa/`,
    VERIFY_SMS_OTP: `${API_BASE_URL}/auth/verify-sms-otp/`,

    // Account Settings
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
    ROLE_CHANGE_REQUEST: `${API_BASE_URL}/auth/role-change-request/`,
    ROLE_CHANGE_REQUESTS: `${API_BASE_URL}/auth/role-change-requests/`,

    GOOGLE_LOGIN: `${API_BASE_URL}/accounts/google/login/`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback/`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password/`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password/`,

    // Announcements
    ANNOUNCEMENTS: `${API_BASE_URL}/api/announcements/`,
    ANNOUNCEMENT_DETAIL: (id) => `${API_BASE_URL}/api/announcements/${id}/`,

    // Events
    EVENTS: `${API_BASE_URL}/api/events/`,
    EVENT_DETAIL: (id) => `${API_BASE_URL}/api/events/${id}/`,
    EVENT_REGISTER: (id) => `${API_BASE_URL}/api/events/${id}/register/`,

    // Tasks
    TASKS: `${API_BASE_URL}/api/tasks/tasks/`,
    TASKS_MY: `${API_BASE_URL}/api/tasks/my_tasks/`,
    TASK_DETAIL: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/`,
    TASK_SUBMIT: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/submit/`,
    TASK_QUESTIONS: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/questions/`,

    // User
    USER_PROFILE: `${API_BASE_URL}/api/users/profile/`,
    USER_UPDATE: `${API_BASE_URL}/api/users/update/`,
    USER_SEARCH: `${API_BASE_URL}/users/search/`,

    // Rooms
    ROOMS: `${API_BASE_URL}/api/rooms/rooms/`,
    ROOMS_MY: `${API_BASE_URL}/api/rooms/rooms/my_rooms/`,
    ROOMS_RECOMMENDATIONS: `${API_BASE_URL}/api/rooms/rooms/recommendations/`,
    ROOM_DETAIL: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/`,
    ROOM_MESSAGES: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/messages/`,
    ROOM_JOIN: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/join/`,
    ROOM_LEAVE: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/leave/`,
    ROOM_MEMBERS: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/members/`,
    ROOM_MAKE_MODERATOR: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/make_moderator/`,
    ROOM_REMOVE_MODERATOR: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/remove_moderator/`,

    // Direct Messages
    DM_ROOMS: `${API_BASE_URL}/api/rooms/dm_rooms/`,
    DM_ROOM_DETAIL: (id) => `${API_BASE_URL}/api/rooms/dm_rooms/${id}/`,
    DM_ROOM_GET_OR_CREATE: `${API_BASE_URL}/api/rooms/dm_rooms/get_or_create/`,
    DM_ROOM_MESSAGES: (id) => `${API_BASE_URL}/api/rooms/dm_rooms/${id}/messages/`,
    DM_ROOM_MARK_READ: (id) => `${API_BASE_URL}/api/rooms/dm_rooms/${id}/mark_all_read/`,
    DM_MESSAGE_SEND: `${API_BASE_URL}/api/rooms/direct_messages/send/`,
    DM_MESSAGE_MARK_READ: (id) => `${API_BASE_URL}/api/rooms/direct_messages/${id}/mark_read/`,

    // Messages (legacy - kept for compatibility)
    MESSAGES: `${API_BASE_URL}/api/rooms/dm_rooms/`,
    MESSAGE_SEND: `${API_BASE_URL}/api/rooms/direct_messages/send/`,
    CONVERSATION: (userId) => `${API_BASE_URL}/api/messages/conversation/${userId}/`,

    // Resources
    RESOURCES: `${API_BASE_URL}/api/resources/`,
    RESOURCE_DETAIL: (id) => `${API_BASE_URL}/api/resources/${id}/`,
    RESOURCE_UPLOAD: `${API_BASE_URL}/api/resources/upload/`,

    // Institutions
    INSTITUTIONS: `${API_BASE_URL}/api/institutions/`,
    INSTITUTION_DETAIL: (id) => `${API_BASE_URL}/api/institutions/${id}/`,

    // Organizations
    ORGANIZATIONS: `${API_BASE_URL}/api/organizations/`,
    ORGANIZATION_DETAIL: (id) => `${API_BASE_URL}/api/organizations/${id}/`,

    // Payment
    PAYMENT_PROFILE: `${API_BASE_URL}/api/payments/profile/`,
    TRANSACTIONS: `${API_BASE_URL}/api/payments/transactions/`,
    TRANSACTION_DETAIL: (id) => `${API_BASE_URL}/api/payments/transactions/${id}/`,
    CREATE_TRANSACTION: `${API_BASE_URL}/api/payments/create/`,
    TRANSACTION_HISTORY: `${API_BASE_URL}/api/payments/history/`,

    // Payment Methods
    PAYMENT_METHODS: `${API_BASE_URL}/api/payments/methods/`,
    PAYMENT_METHOD_DETAIL: (id) => `${API_BASE_URL}/api/payments/methods/${id}/`,
    ADD_PAYMENT_METHOD: `${API_BASE_URL}/api/payments/methods/add/`,
    SET_DEFAULT_PAYMENT_METHOD: (id) => `${API_BASE_URL}/api/payments/methods/${id}/set_default/`,

    // Payment Processing
    PROCESS_PAYMENT: `${API_BASE_URL}/api/payments/process/`,
    REFUND_PAYMENT: `${API_BASE_URL}/api/payments/refund/`,

    // Payment Gateway Intents
    CREATE_STRIPE_INTENT: `${API_BASE_URL}/api/payments/stripe/create-intent/`,
    CREATE_PAYPAL_PAYMENT: `${API_BASE_URL}/api/payments/paypal/create-payment/`,
    INITIATE_MPESA_PAYMENT: `${API_BASE_URL}/api/payments/mpesa/initiate/`,

    // Payment Groups
    PAYMENT_GROUPS: `${API_BASE_URL}/api/payments/groups/`,
    PAYMENT_GROUP_DETAIL: (id) => `${API_BASE_URL}/api/payments/groups/${id}/`,
    CONTRIBUTE_TO_GROUP: (id) => `${API_BASE_URL}/api/payments/groups/${id}/contribute/`,

    // Specializations & Stacks
    SPECIALIZATIONS: `${API_BASE_URL}/api/specializations/`,
    SPECIALIZATION_DETAIL: (id) => `${API_BASE_URL}/api/specializations/${id}/`,
    SPECIALIZATION_JOIN: (id) => `${API_BASE_URL}/api/specializations/${id}/join/`,
    STACKS: `${API_BASE_URL}/api/stacks/`,
    STACK_DETAIL: (id) => `${API_BASE_URL}/api/stacks/${id}/`,
    STACK_COMPLETE: (id) => `${API_BASE_URL}/api/stacks/${id}/complete/`,
    CERTIFICATES: `${API_BASE_URL}/api/certificates/`,

    // Shop & Products
    PRODUCTS: `${API_BASE_URL}/api/payments/products/`,
    PRODUCT_DETAIL: (id) => `${API_BASE_URL}/api/payments/products/${id}/`,
    RECOMMENDATIONS: `${API_BASE_URL}/api/payments/products/recommendations/`,

    // Piggy Bank (Group Targets)
    GROUP_TARGETS: `${API_BASE_URL}/api/payments/targets/`,
    GROUP_TARGET_DETAIL: (id) => `${API_BASE_URL}/api/payments/targets/${id}/`,
    CONTRIBUTE_TARGET: (id) => `${API_BASE_URL}/api/payments/targets/${id}/contribute/`,

    // Subscriptions
    User_SUBSCRIPTIONS: `${API_BASE_URL}/api/payments/subscriptions/`,
    SUBSCRIPTION_DETAIL: (id) => `${API_BASE_URL}/api/payments/subscriptions/${id}/`,

    // Social Auth - Login Initiation
    GOOGLE_LOGIN: `${API_BASE_URL}/accounts/google/login/`,
    FACEBOOK_LOGIN: `${API_BASE_URL}/accounts/facebook/login/`,
    GITHUB_LOGIN: `${API_BASE_URL}/accounts/github/login/`,
    APPLE_LOGIN: `${API_BASE_URL}/accounts/apple/login/`,
    TWITTER_LOGIN: `${API_BASE_URL}/accounts/twitter_oauth2/login/`,
    LINKEDIN_LOGIN: `${API_BASE_URL}/accounts/linkedin_oauth2/login/`,
    MICROSOFT_LOGIN: `${API_BASE_URL}/accounts/microsoft/login/`,

    // Social Auth - Callbacks (JWT conversion)
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback/`,
    FACEBOOK_CALLBACK: `${API_BASE_URL}/auth/facebook/callback/`,
    GITHUB_CALLBACK: `${API_BASE_URL}/auth/github/callback/`,
    APPLE_CALLBACK: `${API_BASE_URL}/auth/apple/callback/`,
    TWITTER_CALLBACK: `${API_BASE_URL}/auth/twitter/callback/`,
    LINKEDIN_CALLBACK: `${API_BASE_URL}/auth/linkedin/callback/`,
    MICROSOFT_CALLBACK: `${API_BASE_URL}/auth/microsoft/callback/`,

    // Profile & Security
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile/`,
    DEVICES: `${API_BASE_URL}/auth/devices/`,
    REVOKE_DEVICE: (id) => `${API_BASE_URL}/auth/devices/${id}/revoke/`,
    ACTIVITY_LOG: `${API_BASE_URL}/auth/activity/`,

    // TOTP 2FA (Authenticator App)
    TOTP_SETUP: `${API_BASE_URL}/auth/totp/setup/`,
    TOTP_VERIFY_SETUP: `${API_BASE_URL}/auth/totp/verify-setup/`,
    TOTP_VERIFY_LOGIN: `${API_BASE_URL}/auth/totp/verify-login/`,
    TOTP_DISABLE: `${API_BASE_URL}/auth/totp/disable/`,
    TOTP_BACKUP_CODES: `${API_BASE_URL}/auth/totp/backup-codes/`,

    // Opinions & Social
    OPINIONS: `${API_BASE_URL}/api/opinions/opinions/`,
    OPINIONS_FEED: `${API_BASE_URL}/api/opinions/opinions/feed/`,
    OPINIONS_TRENDING: `${API_BASE_URL}/api/opinions/opinions/trending/`,
    OPINION_DETAIL: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/`,
    OPINION_LIKE: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/like/`,
    OPINION_REPOST: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/repost/`,
    OPINION_BOOKMARK: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/bookmark/`,
    OPINION_COMMENTS: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/comments/`,

    // Following
    FOLLOW_TOGGLE: `${API_BASE_URL}/api/opinions/follow/toggle/`,
    FOLLOWERS: `${API_BASE_URL}/api/opinions/follow/followers/`,
    FOLLOWING: `${API_BASE_URL}/api/opinions/follow/following/`,
    FOLLOW_SUGGESTIONS: `${API_BASE_URL}/api/opinions/follow/suggestions/`,
    BOOKMARKS: `${API_BASE_URL}/api/opinions/bookmarks/`,
}

export default API_ENDPOINTS;

