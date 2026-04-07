
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
    ONBOARDING: '/onboarding',
    SOCIAL_PASSWORD_VERIFY: '/social-verify',
    VERIFY_2FA: '/verify-2fa',
    VERIFY_SMS: '/verify-sms',
    SETUP_2FA: '/settings/security/2fa',
    DASHBOARD: '/dashboard',
    ANNOUNCEMENTS: '/announcements',
    EVENTS: '/events',
    TASKS: '/tasks',
    PROFILE: '/profile',
    PROFILE_DETAIL: '/profile/:id',
    ADMIN_PORTAL: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_CONTENT: '/admin/content',
    ADMIN_ROLE_REQUESTS: '/admin/role-requests',
    ADMIN_VERIFICATIONS: '/admin/verifications',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_SETTINGS: '/admin/settings',
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
    PRODUCT_DETAILS: '/shop/item/:id',
    TIER_PLANS: '/tier-plans',
    PIGGY_BANKS: '/piggy-banks',
    DONATIONS: '/donations',
    GROUP_INVESTMENTS: '/group-investments',
    KITTIES: '/payments/kitties',

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

    // Business Funding
    FUNDING: '/funding',
    OPPORTUNITIES: '/opportunities',
    CREATE_BUSINESS: '/business/create',
    BILL_PAYMENTS: '/bill-payments',
    LOANS: '/loans',
    ESCROW: '/escrow',
    INSURANCE: '/insurance',

    // Careers & Gigs
    GIGS: '/gigs',
    CREATE_GIG: '/gigs/create',
    CAREERS: '/careers',

    // Create Content
    CREATE_EVENT: '/events/create',
    CREATE_TASK: '/tasks/create',
    CREATE_ROOM: '/rooms/create',
    CREATE_RESOURCE: '/resources/create',
    CREATE_RESEARCH: '/research/create',
    CREATE_ANNOUNCEMENT: '/announcements/create',
    CREATE_SPECIALIZATION: '/specializations/create',
    CREATE_STACK: '/specializations/stacks/create',

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

    // Role-Specific Portals
    STAFF_PORTAL: '/portal/staff',
    AUTHOR_PORTAL: '/portal/author',
    MODERATOR_PORTAL: '/portal/moderator',
    LECTURER_PORTAL: '/portal/lecturer',
    INSTITUTION_PORTAL: '/portal/institution',

    // System Operations
    ML_DASHBOARD: '/admin/ml-dashboard',
    ML_PRICING: '/admin/ml/pricing',
    ML_RECOMMENDATION: '/admin/ml/recommendation',
    ML_DISTRIBUTION: '/admin/ml/distribution',
    ML_SCRAPING: '/admin/ml/scraping',

    // Voice Assistant
    VOICE_SETTINGS: '/settings/voice',
};
