
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL_OTP: '/verify-email',
    VERIFY_REGISTRATION: '/verify-registration',
    REGISTRATION_SUCCESS: '/registration-success',
    LOGIN_SUCCESS: '/login-success',
    PROFILE_SETUP: '/profile-setup',
    VERIFY_2FA: '/verify-2fa',
    VERIFY_SMS: '/verify-sms',
    SETUP_2FA: '/settings/security/2fa',
    DASHBOARD: '/dashboard',
    ANNOUNCEMENTS: '/announcements',
    EVENTS: '/events',
    TASKS: '/tasks',
    PROFILE: '/profile',
    PROFILE_DETAIL: '/profile/:id',
    ADMIN_DELETION_REVIEW: '/admin/deletion-review',
    COMMUNITY: '/community',
    ROOMS: '/rooms',
    MESSAGES: '/messages',
    RESOURCES: '/resources',
    INSTITUTIONS: '/institutions',
    ORGANIZATIONS: '/organizations',
    PAYMENTS: '/payments',
    PAYMENT_METHODS: '/payments/methods',
    PAYMENT_GROUPS: '/payments/groups',
    PAYMENT_GROUP_DETAIL: '/payments/groups/:groupId',
    CREATE_PAYMENT_GROUP: '/payments/create-group',
    SPECIALIZATIONS: '/specializations',
    SETTINGS: '/settings',

    // OAuth Callbacks - Unified callback for all providers
    AUTH_CALLBACK: '/auth/callback',
    GOOGLE_CALLBACK: '/auth/callback',
    APPLE_CALLBACK: '/auth/apple/callback',
    FACEBOOK_CALLBACK: '/auth/facebook/callback',
    X_CALLBACK: '/auth/x/callback',
    GITHUB_CALLBACK: '/auth/github/callback',
    MICROSOFT_CALLBACK: '/auth/microsoft/callback',

    // New Features
    ACTIVITY: '/activity',
    DEVICES: '/devices',
    PERMISSIONS: '/permissions',
    SHOP: '/shop',
    PRODUCT_DETAILS: '/shop/:id',
    TIER_PLANS: '/tier-plans',
    PIGGY_BANKS: '/piggy-banks',

    // Opinions & Social
    OPINIONS: '/opinions',
    OPINION_DETAIL: '/opinions/:id',
    NOTIFICATIONS: '/notifications',
    FOLLOWING: '/following',

    // Content
    RESEARCH: '/research',
    ARTICLES: '/articles',

    // AI Assistant
    QOMAI: '/qomai',

    // Create Content
    CREATE_EVENT: '/events/create',
    CREATE_TASK: '/tasks/create',
    CREATE_ROOM: '/rooms/create',
    CREATE_RESOURCE: '/resources/create',
    CREATE_RESEARCH: '/research/create',
    CREATE_ANNOUNCEMENT: '/announcements/create',

    // New Portal Features
    CREATE_INSTITUTION: '/institutions/portal/create',
    VERIFY_INSTITUTION: '/institutions/portal/:id/verify',
    CREATE_ORGANIZATION: '/organizations/portal/create',
    VERIFY_ORGANIZATION: '/organizations/portal/:id/verify',
    SETUP_TOTP: '/settings/security/totp',
    PAYMENT_CHECKOUT: '/payments/checkout',
    CONVERT_SERVICE: '/announcements/convert',
    ADMIN_REVIEW_INSTITUTIONS: '/admin/review/institutions',
    ADMIN_REVIEW_ORGANIZATIONS: '/admin/review/organizations',
    PORTAL_EXAMPLE: '/portal/example',
}
