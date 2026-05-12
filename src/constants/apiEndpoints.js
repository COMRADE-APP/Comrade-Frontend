const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login/`,
    LOGIN_VERIFY: `${API_BASE_URL}/auth/login-verify/`,
    RESEND_OTP: `${API_BASE_URL}/auth/resend-otp/`,
    LOGOUT: `${API_BASE_URL}/auth/logout/`,
    LOGOUT_ALL: `${API_BASE_URL}/auth/logout-all/`,
    REGISTER: `${API_BASE_URL}/auth/register/`,
    REGISTER_VERIFY: `${API_BASE_URL}/auth/register-verify/`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify/`,
    HEARTBEAT: `${API_BASE_URL}/auth/heartbeat/`,

    PASSWORD_RESET_REQUEST: `${API_BASE_URL}/auth/password-reset-request/`,
    PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/auth/password-reset-confirm/`,

    SETUP_2FA: `${API_BASE_URL}/auth/setup-2fa/`,
    CONFIRM_2FA_SETUP: `${API_BASE_URL}/auth/confirm-2fa-setup/`,
    VERIFY_2FA: `${API_BASE_URL}/auth/verify-2fa/`,
    VERIFY_SMS_OTP: `${API_BASE_URL}/auth/verify-sms-otp/`,

    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
    ROLE_CHANGE_REQUEST: `${API_BASE_URL}/auth/role-change-request/`,
    ROLE_CHANGE_REQUESTS: `${API_BASE_URL}/auth/role-change-requests/`,

    PROFILE: `${API_BASE_URL}/auth/profile/`,
    PROFILE_SETUP: `${API_BASE_URL}/auth/profile-setup/`,
    PROFILE_AVATAR: `${API_BASE_URL}/auth/profile/avatar/`,
    PROFILE_COVER: `${API_BASE_URL}/auth/profile/cover/`,

    SOCIAL_GOOGLE_LOGIN: `${API_BASE_URL}/accounts/google/login/`,
    SOCIAL_FACEBOOK_LOGIN: `${API_BASE_URL}/accounts/facebook/login/`,
    SOCIAL_GITHUB_LOGIN: `${API_BASE_URL}/accounts/github/login/`,
    SOCIAL_APPLE_LOGIN: `${API_BASE_URL}/accounts/apple/login/`,
    SOCIAL_TWITTER_LOGIN: `${API_BASE_URL}/accounts/twitter_oauth2/login/`,
    SOCIAL_LINKEDIN_LOGIN: `${API_BASE_URL}/accounts/linkedin_oauth2/login/`,
    SOCIAL_MICROSOFT_LOGIN: `${API_BASE_URL}/accounts/microsoft/login/`,

    SOCIAL_GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback/`,
    SOCIAL_FACEBOOK_CALLBACK: `${API_BASE_URL}/auth/facebook/callback/`,
    SOCIAL_GITHUB_CALLBACK: `${API_BASE_URL}/auth/github/callback/`,
    SOCIAL_APPLE_CALLBACK: `${API_BASE_URL}/auth/apple/callback/`,
    SOCIAL_TWITTER_CALLBACK: `${API_BASE_URL}/auth/twitter/callback/`,
    SOCIAL_LINKEDIN_CALLBACK: `${API_BASE_URL}/auth/linkedin/callback/`,
    SOCIAL_MICROSOFT_CALLBACK: `${API_BASE_URL}/auth/microsoft/callback/`,

    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password/`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password/`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile/`,
    DEVICES: `${API_BASE_URL}/auth/devices/`,
    REVOKE_DEVICE: (id) => `${API_BASE_URL}/auth/devices/${id}/revoke/`,
    ACTIVITY_LOG: `${API_BASE_URL}/auth/activity/`,

    TOTP_SETUP: `${API_BASE_URL}/auth/totp/setup/`,
    TOTP_VERIFY_SETUP: `${API_BASE_URL}/auth/totp/verify-setup/`,
    TOTP_VERIFY_LOGIN: `${API_BASE_URL}/auth/totp/verify-login/`,
    TOTP_DISABLE: `${API_BASE_URL}/auth/totp/disable/`,
    TOTP_BACKUP_CODES: `${API_BASE_URL}/auth/totp/backup-codes/`,

    // Announcements
    ANNOUNCEMENTS: `${API_BASE_URL}/api/announcements/`,
    ANNOUNCEMENT_DETAIL: (id) => `${API_BASE_URL}/api/announcements/${id}/`,

    // Events
    EVENTS: `${API_BASE_URL}/api/events/`,
    EVENT_DETAIL: (id) => `${API_BASE_URL}/api/events/${id}/`,
    EVENT_REGISTER: (id) => `${API_BASE_URL}/api/events/${id}/register/`,

    // Event Slot Bookings
    SLOT_BOOKINGS: `${API_BASE_URL}/api/events/slot_bookings/`,
    SLOT_BOOKING_DETAIL: (id) => `${API_BASE_URL}/api/events/slot_bookings/${id}/`,
    SLOT_BOOK: `${API_BASE_URL}/api/events/slot_bookings/book_slot/`,
    SLOT_MY_BOOKINGS: `${API_BASE_URL}/api/events/slot_bookings/my_bookings/`,
    SLOT_AVAILABILITY: (eventId) => `${API_BASE_URL}/api/events/slot_bookings/availability/${eventId}/`,
    SLOT_CANCEL: (id) => `${API_BASE_URL}/api/events/slot_bookings/${id}/cancel/`,
    SLOT_CONFIRM_PAYMENT: (id) => `${API_BASE_URL}/api/events/slot_bookings/${id}/confirm_payment/`,

    // Tasks
    TASKS: `${API_BASE_URL}/api/tasks/tasks/`,
    TASKS_MY: `${API_BASE_URL}/api/tasks/my_tasks/`,
    TASK_DETAIL: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/`,
    TASK_SUBMIT: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/submit/`,
    TASK_QUESTIONS: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/questions/`,
    RESPONSE_DETAIL: (id) => `${API_BASE_URL}/api/tasks/responses/${id}/`,
    TASK_RESPONSES: (id) => `${API_BASE_URL}/api/tasks/tasks/${id}/responses/`,
    TASK_GRADE_RESPONSE: (taskId, responseId) => `${API_BASE_URL}/api/tasks/tasks/${taskId}/grade_response/`,
    TASK_UPDATE_STATUS: (taskId) => `${API_BASE_URL}/api/tasks/tasks/${taskId}/update_response_status/`,
    TASK_AUTO_GRADE: (taskId) => `${API_BASE_URL}/api/tasks/tasks/${taskId}/auto_grade/`,
    TASK_GRADING_CONFIG: (taskId) => `${API_BASE_URL}/api/tasks/tasks/${taskId}/grading_config/`,

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
    TYPING: (id) => `${API_BASE_URL}/api/rooms/typing/${id}/`,

    // Room Chat
    ROOM_CHATS: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/chats/`,
    ROOM_CHAT_FORWARD: (roomId, chatId) => `${API_BASE_URL}/api/rooms/rooms/${roomId}/chats/${chatId}/forward/`,
    ROOM_CHAT_READ: (roomId, chatId) => `${API_BASE_URL}/api/rooms/rooms/${roomId}/chats/${chatId}/read/`,
    ROOM_CHAT_DELETE: (roomId, chatId) => `${API_BASE_URL}/api/rooms/rooms/${roomId}/chats/${chatId}/`,

    // Room Settings
    ROOM_SETTINGS: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/room_settings/`,

    // Room Members Detail
    ROOM_MEMBERS_DETAIL: (id) => `${API_BASE_URL}/api/rooms/rooms/${id}/members_detail/`,
    ROOM_MEMBER_FOLLOW: (roomId, userId) => `${API_BASE_URL}/api/rooms/rooms/${roomId}/members/${userId}/follow/`,

    // Room Opinions
    ROOM_OPINIONS: (roomId) => `${API_BASE_URL}/api/opinions/opinions/room/${roomId}/opinions/`,

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
    RESOURCES: `${API_BASE_URL}/api/resources/resource/`,
    RESOURCE_DETAIL: (id) => `${API_BASE_URL}/api/resources/resource/${id}/`,
    RESOURCE_UPLOAD: `${API_BASE_URL}/api/resources/resource/`,

    // Institutions
    INSTITUTIONS: `${API_BASE_URL}/api/institutions/institutions/`,
    INSTITUTION_DETAIL: (id) => `${API_BASE_URL}/api/institutions/institutions/${id}/`,
    INST_SET_PORTAL_PASSWORD: (id) => `${API_BASE_URL}/api/institutions/institutions/${id}/set_portal_password/`,
    INST_VERIFY_PORTAL_PASSWORD: (id) => `${API_BASE_URL}/api/institutions/institutions/${id}/verify_portal_password/`,
    MY_INSTITUTIONS: `${API_BASE_URL}/api/institutions/institutions/my_institutions/`,

    // Organizations
    ORGANIZATIONS: `${API_BASE_URL}/api/organizations/organisation/`,
    ORGANIZATION_DETAIL: (id) => `${API_BASE_URL}/api/organizations/organisation/${id}/`,
    ORGANISATION_MEMBERS: `${API_BASE_URL}/api/organizations/organisation_members/`,
    ORG_SET_PORTAL_PASSWORD: (id) => `${API_BASE_URL}/api/organizations/organisation/${id}/set_portal_password/`,
    ORG_VERIFY_PORTAL_PASSWORD: (id) => `${API_BASE_URL}/api/organizations/organisation/${id}/verify_portal_password/`,
    MY_ORGANIZATIONS: `${API_BASE_URL}/api/organizations/organisation/my_organizations/`,

    // Orders (Shop)
    ORDERS: `${API_BASE_URL}/api/orders/`,
    MY_ORDERS: `${API_BASE_URL}/api/orders/my_orders/`,
    ORDER_UPDATE_STATUS: (id) => `${API_BASE_URL}/api/orders/${id}/update_status/`,

    // Payment
    PAYMENT_PROFILE: `${API_BASE_URL}/api/payments/profiles/my_profile/`,
    PAYMENT_BALANCE: `${API_BASE_URL}/api/payments/profiles/balance/`,
    TRANSACTIONS: `${API_BASE_URL}/api/payments/transactions/`,
    TRANSACTION_DETAIL: (id) => `${API_BASE_URL}/api/payments/transactions/${id}/`,
    CREATE_TRANSACTION: `${API_BASE_URL}/api/payments/create/`,
    TRANSACTION_HISTORY: `${API_BASE_URL}/api/payments/transactions/history/`,

    // Currency Exchange
    CURRENCY_CONVERT: `${API_BASE_URL}/api/payments/profiles/convert/`,
    EXCHANGE_RATES: `${API_BASE_URL}/api/payments/profiles/exchange_rate/`,
    ALL_RATES: `${API_BASE_URL}/api/payments/profiles/all_rates/`,
    SUPPORTED_CURRENCIES: `${API_BASE_URL}/api/payments/profiles/supported_currencies/`,
    SET_PREFERRED_CURRENCY: `${API_BASE_URL}/api/payments/profiles/set_preferred_currency/`,
    DETECT_CURRENCY: `${API_BASE_URL}/api/payments/profiles/detect_currency/`,

    // Transaction Actions
    DEPOSIT: `${API_BASE_URL}/api/payments/deposit/`,
    WITHDRAW: `${API_BASE_URL}/api/payments/withdraw/`,
    TRANSFER: `${API_BASE_URL}/api/payments/transfer/`,
    VERIFY_ACCOUNT: `${API_BASE_URL}/api/payments/verify-account/`,

    // Registration
    PARTNER_APPLICATIONS: `${API_BASE_URL}/api/payments/partner-applications/`,
    AGENT_APPLICATIONS: `${API_BASE_URL}/api/payments/agent-applications/`,
    SUPPLIER_APPLICATIONS: `${API_BASE_URL}/api/payments/supplier-applications/`,
    SHOP_REGISTRATIONS: `${API_BASE_URL}/api/payments/shop-registrations/`,

    // Partners
    PARTNERS: `${API_BASE_URL}/api/payments/partners/`,
    PARTNER_STATUS: `${API_BASE_URL}/api/payments/partners/my_status/`,

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
    WITHDRAWAL_REQUESTS: `${API_BASE_URL}/api/payments/withdrawal-requests/`,
    ROUND_CONTRIBUTIONS: `${API_BASE_URL}/api/payments/round-contributions/`,
    ROUND_POSITIONS: `${API_BASE_URL}/api/payments/round-positions/`,
    GROUP_SETTINGS_CHANGES: `${API_BASE_URL}/api/payments/group-settings-changes/`,

    // Loans
    LOAN_PRODUCTS: `${API_BASE_URL}/api/payments/loan-products/`,
    LOAN_APPLICATIONS: `${API_BASE_URL}/api/payments/loan-applications/`,

    // Kitties (Entity Fund Pools)
    MY_KITTIES: `${API_BASE_URL}/api/payments/groups/my_kitties/`,
    KITTY_WITHDRAW: (id) => `${API_BASE_URL}/api/payments/groups/${id}/kitty_withdraw/`,
    KITTY_TRANSACTIONS: (id) => `${API_BASE_URL}/api/payments/groups/${id}/kitty_transactions/`,

    // Group Invitations
    GROUP_INVITATIONS: `${API_BASE_URL}/api/payments/invitations/`,
    GROUP_INVITATION_DETAIL: (id) => `${API_BASE_URL}/api/payments/invitations/${id}/`,
    INVITATION_ACCEPT: (id) => `${API_BASE_URL}/api/payments/invitations/${id}/accept/`,
    INVITATION_REJECT: (id) => `${API_BASE_URL}/api/payments/invitations/${id}/reject/`,
    INVITATION_PENDING: `${API_BASE_URL}/api/payments/invitations/pending/`,

    // Group Discourse & Voting
    PUBLIC_GROUPS: `${API_BASE_URL}/api/payments/join-requests/public_groups/`,
    RECOMMENDED_GROUPS: `${API_BASE_URL}/api/payments/join-requests/recommended_groups/`,
    JOIN_REQUESTS: `${API_BASE_URL}/api/payments/join-requests/`,
    JOIN_REQUESTS_INCOMING: `${API_BASE_URL}/api/payments/join-requests/incoming/`,
    JOIN_REQUEST_APPROVE: (id) => `${API_BASE_URL}/api/payments/join-requests/${id}/approve/`,
    JOIN_REQUEST_REJECT: (id) => `${API_BASE_URL}/api/payments/join-requests/${id}/reject/`,
    JOIN_REQUEST_WITHDRAW: (id) => `${API_BASE_URL}/api/payments/join-requests/${id}/withdraw/`,
    
    GROUP_VOTES: `${API_BASE_URL}/api/payments/group-votes/`,
    GROUP_VOTE_BY_GROUP: (id) => `${API_BASE_URL}/api/payments/group-votes/by_group/?group_id=${id}`,
    GROUP_VOTE_CAST: (id) => `${API_BASE_URL}/api/payments/group-votes/${id}/cast_vote/`,

    // Group Discourse Posts & Phases
    GROUP_POSTS: `${API_BASE_URL}/api/payments/group-posts/`,
    GROUP_POST_REPLIES: `${API_BASE_URL}/api/payments/group-post-replies/`,
    GROUP_POST_REACT: (id) => `${API_BASE_URL}/api/payments/group-posts/${id}/react/`,
    GROUP_POST_PIN: (id) => `${API_BASE_URL}/api/payments/group-posts/${id}/pin/`,
    GROUP_POST_UPVOTE: (id) => `${API_BASE_URL}/api/payments/group-posts/${id}/upvote/`,
    GROUP_POST_TOGGLE_SHARE: (id) => `${API_BASE_URL}/api/payments/group-posts/${id}/toggle_shareability/`,
    GROUP_REPLY_REACT: (id) => `${API_BASE_URL}/api/payments/group-post-replies/${id}/react/`,
    GROUP_REPLY_UPVOTE: (id) => `${API_BASE_URL}/api/payments/group-post-replies/${id}/upvote/`,
    GROUP_PHASES: `${API_BASE_URL}/api/payments/group-phases/`,
    
    // Group Portfolio
    GROUP_PORTFOLIO: (id) => `${API_BASE_URL}/api/payments/group-portfolio/${id}/`,

    // Specializations & Stacks
    SPECIALIZATIONS: `${API_BASE_URL}/api/specializations/specializations/`,
    SPECIALIZATION_DETAIL: (id) => `${API_BASE_URL}/api/specializations/specializations/${id}/`,
    SPECIALIZATION_JOIN: (id) => `${API_BASE_URL}/api/specializations/specializations/${id}/join/`,
    SPECIALIZATION_ENROLL: (id) => `${API_BASE_URL}/api/specializations/specializations/${id}/enroll/`,
    SPECIALIZATION_PROGRESS: (id) => `${API_BASE_URL}/api/specializations/specializations/${id}/progress/`,
    MY_ENROLLMENTS: `${API_BASE_URL}/api/specializations/specializations/my_enrollments/`,
    STACKS: `${API_BASE_URL}/api/specializations/stacks/`,
    STACK_DETAIL: (id) => `${API_BASE_URL}/api/specializations/stacks/${id}/`,
    STACK_COMPLETE: (id) => `${API_BASE_URL}/api/specializations/stacks/${id}/mark_as_complete/`,

    // Lessons
    LESSONS: `${API_BASE_URL}/api/specializations/lessons/`,
    LESSON_DETAIL: (id) => `${API_BASE_URL}/api/specializations/lessons/${id}/`,
    LESSON_COMPLETE: (id) => `${API_BASE_URL}/api/specializations/lessons/${id}/complete/`,

    // Quizzes
    QUIZZES: `${API_BASE_URL}/api/specializations/quizzes/`,
    QUIZ_DETAIL: (id) => `${API_BASE_URL}/api/specializations/quizzes/${id}/`,
    QUIZ_SUBMIT: (id) => `${API_BASE_URL}/api/specializations/quizzes/${id}/submit_attempt/`,
    QUIZ_MY_ATTEMPTS: (id) => `${API_BASE_URL}/api/specializations/quizzes/${id}/my_attempts/`,
    QUIZ_QUESTIONS: `${API_BASE_URL}/api/specializations/quiz-questions/`,

    // Enrollments
    ENROLLMENTS: `${API_BASE_URL}/api/specializations/enrollments/`,
    ENROLLMENT_DETAIL: (id) => `${API_BASE_URL}/api/specializations/enrollments/${id}/`,
    ENROLLMENT_DROP: (id) => `${API_BASE_URL}/api/specializations/enrollments/${id}/drop/`,
    ENROLLMENT_UNLOCK: (id) => `${API_BASE_URL}/api/specializations/enrollments/${id}/unlock/`,

    // Progress
    LEARNER_PROGRESS: `${API_BASE_URL}/api/specializations/progress/`,

    // Certificates
    CERTIFICATES: `${API_BASE_URL}/api/specializations/certificates/`,
    ISSUED_CERTIFICATES: `${API_BASE_URL}/api/specializations/issued_certificates/`,
    VERIFY_CERTIFICATE: `${API_BASE_URL}/api/specializations/issued_certificates/verify/`,


    // Shop & Products
    PRODUCTS: `${API_BASE_URL}/api/payments/products/`,
    PRODUCT_DETAIL: (id) => `${API_BASE_URL}/api/payments/products/${id}/`,
    RECOMMENDATIONS: `${API_BASE_URL}/api/payments/products/recommendations/`,

    // Piggy Bank (Group Targets)
    GROUP_TARGETS: `${API_BASE_URL}/api/payments/targets/`,
    GROUP_TARGET_DETAIL: (id) => `${API_BASE_URL}/api/payments/targets/${id}/`,
    CONTRIBUTE_TARGET: (id) => `${API_BASE_URL}/api/payments/targets/${id}/contribute/`,

    // Donations & Charity
    DONATIONS: `${API_BASE_URL}/api/payments/donations/`,
    DONATION_DETAIL: (id) => `${API_BASE_URL}/api/payments/donations/${id}/`,
    CONTRIBUTE_DONATION: (id) => `${API_BASE_URL}/api/payments/donations/${id}/contribute/`,

    // Group Investments
    GROUP_INVESTMENTS: `${API_BASE_URL}/api/payments/group-investments/`,
    GROUP_INVESTMENT_DETAIL: (id) => `${API_BASE_URL}/api/payments/group-investments/${id}/`,
    QUOTE_INVESTMENT: (id) => `${API_BASE_URL}/api/payments/group-investments/${id}/quote/`,

    // Subscriptions
    User_SUBSCRIPTIONS: `${API_BASE_URL}/api/payments/subscriptions/`,
    SUBSCRIPTION_DETAIL: (id) => `${API_BASE_URL}/api/payments/subscriptions/${id}/`,

    // Opinions & Social
    OPINIONS: `${API_BASE_URL}/api/opinions/opinions/`,
    OPINIONS_FEED: `${API_BASE_URL}/api/opinions/feed/`,
    OPINIONS_TRENDING: `${API_BASE_URL}/api/opinions/opinions/trending/`,
    OPINION_DETAIL: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/`,
    OPINION_LIKE: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/like/`,
    OPINION_REPOST: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/repost/`,
    OPINION_BOOKMARK: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/bookmark/`,
    OPINION_COMMENTS: (id) => `${API_BASE_URL}/api/opinions/opinions/${id}/comments/`,

    // Stories
    STORIES: `${API_BASE_URL}/api/opinions/stories/`,
    STORY_VIEW: (id) => `${API_BASE_URL}/api/opinions/stories/${id}/view/`,
    STORY_VIEWERS: (id) => `${API_BASE_URL}/api/opinions/stories/${id}/viewers/`,
    STORY_LIKE: (id) => `${API_BASE_URL}/api/opinions/stories/${id}/like/`,
    STORY_UNLIKE: (id) => `${API_BASE_URL}/api/opinions/stories/${id}/unlike/`,
    MY_STORIES: `${API_BASE_URL}/api/opinions/stories/my_stories/`,

    // Following
    FOLLOW_TOGGLE: `${API_BASE_URL}/api/opinions/follow/toggle/`,
    FOLLOWERS: `${API_BASE_URL}/api/opinions/follow/followers/`,
    FOLLOWING: `${API_BASE_URL}/api/opinions/follow/following/`,
    FOLLOW_SUGGESTIONS: `${API_BASE_URL}/api/opinions/follow/suggestions/`,
    BOOKMARKS: `${API_BASE_URL}/api/opinions/bookmarks/`,

    // Articles
    ARTICLES: {
        LIST: `${API_BASE_URL}/api/articles/`,
        DETAIL: (id) => `${API_BASE_URL}/api/articles/${id}/`,
        MY_DRAFTS: `${API_BASE_URL}/api/articles/my-drafts/`,
        MY_ARTICLES: `${API_BASE_URL}/api/articles/my-articles/`,
        LIKE: (id) => `${API_BASE_URL}/api/articles/${id}/like/`,
        BOOKMARK: (id) => `${API_BASE_URL}/api/articles/${id}/bookmark/`,
        COMMENTS: (id) => `${API_BASE_URL}/api/articles/${id}/comments/`,
    },
    FUNDING: {
        BUSINESSES: `${API_BASE_URL}/api/funding/businesses/`,
        DOCUMENTS: `${API_BASE_URL}/api/funding/documents/`,
        REQUESTS: `${API_BASE_URL}/api/funding/requests/`,
        OPPORTUNITIES: `${API_BASE_URL}/api/funding/opportunities/`,
        VENTURES: `${API_BASE_URL}/api/funding/ventures/`,
        VENTURE_DETAIL: (id) => `${API_BASE_URL}/api/funding/ventures/${id}/`,
        VENTURE_REQUESTS: (id) => `${API_BASE_URL}/api/funding/ventures/${id}/funding_requests/`,
        VENTURE_REVIEW: (id) => `${API_BASE_URL}/api/funding/ventures/${id}/review_request/`,
    },

    // Marketplace
    ESTABLISHMENTS: `${API_BASE_URL}/api/payments/establishments/`,
    ESTABLISHMENT_DETAIL: (id) => `${API_BASE_URL}/api/payments/establishments/${id}/`,
    ESTABLISHMENT_MENU: (id) => `${API_BASE_URL}/api/payments/establishments/${id}/menu/`,
    ESTABLISHMENT_ROOMS: (id) => `${API_BASE_URL}/api/payments/establishments/${id}/rooms/`,
    ESTABLISHMENT_SERVICES: (id) => `${API_BASE_URL}/api/payments/establishments/${id}/services/`,
    ESTABLISHMENT_REVIEWS: (id) => `${API_BASE_URL}/api/payments/establishments/${id}/reviews_list/`,
    MY_ESTABLISHMENTS: `${API_BASE_URL}/api/payments/establishments/my_establishments/`,
    MENU_ITEMS: `${API_BASE_URL}/api/payments/menu-items/`,
    MENU_ITEM_DETAIL: (id) => `${API_BASE_URL}/api/payments/menu-items/${id}/`,
    HOTEL_ROOMS: `${API_BASE_URL}/api/payments/hotel-rooms/`,
    HOTEL_ROOM_DETAIL: (id) => `${API_BASE_URL}/api/payments/hotel-rooms/${id}/`,
    BOOKINGS: `${API_BASE_URL}/api/payments/bookings/`,
    BOOKING_DETAIL: (id) => `${API_BASE_URL}/api/payments/bookings/${id}/`,
    BOOKING_CONFIRM: (id) => `${API_BASE_URL}/api/payments/bookings/${id}/confirm/`,
    BOOKING_CANCEL: (id) => `${API_BASE_URL}/api/payments/bookings/${id}/cancel/`,
    SERVICES: `${API_BASE_URL}/api/payments/services/`,
    SERVICE_DETAIL: (id) => `${API_BASE_URL}/api/payments/services/${id}/`,
    SERVICE_AVAILABLE_SLOTS: (id) => `${API_BASE_URL}/api/payments/services/${id}/available_slots/`,
    TIME_SLOTS: `${API_BASE_URL}/api/payments/time-slots/`,
    TIME_SLOT_BOOK: (id) => `${API_BASE_URL}/api/payments/time-slots/${id}/book/`,
    ORDERS: `${API_BASE_URL}/api/payments/orders/`,
    ORDER_DETAIL: (id) => `${API_BASE_URL}/api/payments/orders/${id}/`,
    ORDER_UPDATE_STATUS: (id) => `${API_BASE_URL}/api/payments/orders/${id}/update_status/`,
    MY_ORDERS: `${API_BASE_URL}/api/payments/orders/my_orders/`,
    REVIEWS: `${API_BASE_URL}/api/payments/reviews/`,

    // Activity Tracking & Privacy
    TRACKING: {
        ACTIVITIES: `${API_BASE_URL}/api/activity/activities/`,
        ACTIVITY_STATS: `${API_BASE_URL}/api/activity/activities/stats/`,
        ACTIVITY_LOG: `${API_BASE_URL}/api/activity/activities/log/`,
        ACTIONS: `${API_BASE_URL}/api/activity/actions/`,
        SESSIONS: `${API_BASE_URL}/api/activity/sessions/`,
        CONSENTS: `${API_BASE_URL}/api/activity/consents/`,
        CONSENT_UPDATE: `${API_BASE_URL}/api/activity/consents/update_consent/`,
        CONSENT_ALL: `${API_BASE_URL}/api/activity/consents/all_permissions/`,
        CONNECTIONS: `${API_BASE_URL}/api/activity/connections/`,
        CONNECTION_CURRENT: `${API_BASE_URL}/api/activity/connections/current/`,
        SEARCHES: `${API_BASE_URL}/api/activity/searches/`,
        EXPORT: `${API_BASE_URL}/api/activity/export/`,
    },

    // Verification System
    VERIFICATION: {
        LIST: `${API_BASE_URL}/api/v1/verification/verifications/`,
        DETAIL: (id) => `${API_BASE_URL}/api/v1/verification/verifications/${id}/`,
        CREATE: `${API_BASE_URL}/api/v1/verification/verifications/`,
        SUBMIT: `${API_BASE_URL}/api/v1/verification/verifications/submit/`,
        STAFF_DASHBOARD: `${API_BASE_URL}/api/v1/verification/verifications/staff_dashboard/`,
        BULK_ACTION: `${API_BASE_URL}/api/v1/verification/verifications/bulk_action/`,
        
        // Liveness Verification
        LIVENESS_INITIATE: `${API_BASE_URL}/api/v1/verification/liveness/initiate/`,
        LIVENESS_GET_SESSION: `${API_BASE_URL}/api/v1/verification/liveness/get_session/`,
        LIVENESS_COMPLETE: `${API_BASE_URL}/api/v1/verification/liveness/complete/`,
        LIVENESS_RETRY: `${API_BASE_URL}/api/v1/verification/liveness/retry/`,
        
        // Documents & Videos
        DOCUMENTS: `${API_BASE_URL}/api/v1/verification/documents/`,
        DOCUMENT_DETAIL: (id) => `${API_BASE_URL}/api/v1/verification/documents/${id}/`,
        VIDEOS: `${API_BASE_URL}/api/v1/verification/videos/`,
        VIDEO_DETAIL: (id) => `${API_BASE_URL}/api/v1/verification/videos/${id}/`,
        
        // Identifications
        IDENTIFICATIONS: `${API_BASE_URL}/api/v1/verification/identifications/`,
        IDENTIFICATION_DETAIL: (id) => `${API_BASE_URL}/api/v1/verification/identifications/${id}/`,
        IDENTIFICATION_VERIFY: (id) => `${API_BASE_URL}/api/v1/verification/identifications/${id}/verify/`,
        
        // Checklist & Stats
        CHECKLIST: `${API_BASE_URL}/api/v1/verification/checklist/`,
        STATS: `${API_BASE_URL}/api/v1/verification/stats/`,
    },

    // ============== BILLS & AIRTIME ==============
    BILLS: {
        PROVIDERS: `${API_BASE_URL}/api/payments/bill-providers/`,
        PROVIDER_DETAIL: (id) => `${API_BASE_URL}/api/payments/bill-providers/${id}/`,
        
        // User's Bill Payments
        LIST: `${API_BASE_URL}/api/payments/bill-payments/`,
        DETAIL: (id) => `${API_BASE_URL}/api/payments/bill-payments/${id}/`,
        CREATE: `${API_BASE_URL}/api/payments/bill-payments/`,
        
        // Standing Orders (Recurring)
        STANDING_ORDERS: `${API_BASE_URL}/api/payments/standing-orders/`,
        STANDING_ORDER_DETAIL: (id) => `${API_BASE_URL}/api/payments/standing-orders/${id}/`,
        STANDING_ORDER_CANCEL: (id) => `${API_BASE_URL}/api/payments/standing-orders/${id}/cancel/`,
        
        // Service Providers (Saved accounts)
        SERVICE_PROVIDERS: `${API_BASE_URL}/api/payments/service-providers/`,
        SERVICE_PROVIDER_DETAIL: (id) => `${API_BASE_URL}/api/payments/service-providers/${id}/`,
        
        // Admin
        ADMIN_LIST: `${API_BASE_URL}/api/payments/admin/bills/`,
        ADMIN_STATS: `${API_BASE_URL}/api/payments/admin/bills/stats/`,
        ADMIN_BULK_ACTION: `${API_BASE_URL}/api/payments/admin/bills/`,
    },

    // ============== LOANS & CREDIT ==============
    LOANS: {
        // Products
        PRODUCTS: `${API_BASE_URL}/api/payments/loan-products/`,
        PRODUCT_DETAIL: (id) => `${API_BASE_URL}/api/payments/loan-products/${id}/`,
        
        // Credit Score
        CREDIT_SCORE: `${API_BASE_URL}/api/payments/credit-scores/my_score/`,
        CREDIT_HISTORY: `${API_BASE_URL}/api/payments/credit-scores/`,
        
        // Applications
        LIST: `${API_BASE_URL}/api/payments/loan-applications/`,
        DETAIL: (id) => `${API_BASE_URL}/api/payments/loan-applications/${id}/`,
        CREATE: `${API_BASE_URL}/api/payments/loan-applications/`,
        
        // User Actions
        APPROVE: (id) => `${API_BASE_URL}/api/payments/loan-applications/${id}/approve/`,
        REJECT: (id) => `${API_BASE_URL}/api/payments/loan-applications/${id}/reject/`,
        DISBURSE: (id) => `${API_BASE_URL}/api/payments/loan-applications/${id}/disburse/`,
        REPAY: (id) => `${API_BASE_URL}/api/payments/loan-applications/${id}/repay/`,
        
        // Repayments
        REPAYMENTS: `${API_BASE_URL}/api/payments/loan-repayments/`,
        
        // Admin
        ADMIN_LIST: `${API_BASE_URL}/api/payments/admin/loans/`,
        ADMIN_STATS: `${API_BASE_URL}/api/payments/admin/loans/stats/`,
        ADMIN_BULK_ACTION: `${API_BASE_URL}/api/payments/admin/loans/`,
    },

    // ============== INSURANCE ==============
    INSURANCE: {
        // Products
        PRODUCTS: `${API_BASE_URL}/api/payments/insurance-products/`,
        PRODUCT_DETAIL: (id) => `${API_BASE_URL}/api/payments/insurance-products/${id}/`,
        
        // Policies
        POLICIES: `${API_BASE_URL}/api/payments/insurance-policies/`,
        POLICY_DETAIL: (id) => `${API_BASE_URL}/api/payments/insurance-policies/${id}/`,
        POLICY_RENEW: (id) => `${API_BASE_URL}/api/payments/insurance-policies/${id}/renew/`,
        POLICY_CANCEL: (id) => `${API_BASE_URL}/api/payments/insurance-policies/${id}/cancel/`,
        
        // Claims
        CLAIMS: `${API_BASE_URL}/api/payments/insurance-claims/`,
        CLAIM_DETAIL: (id) => `${API_BASE_URL}/api/payments/insurance-claims/${id}/`,
        CLAIM_CREATE: `${API_BASE_URL}/api/payments/insurance-claims/`,
        
        // Admin
        ADMIN_LIST: `${API_BASE_URL}/api/payments/admin/insurance/`,
        ADMIN_STATS: `${API_BASE_URL}/api/payments/admin/insurance/stats/`,
        ADMIN_BULK_ACTION: `${API_BASE_URL}/api/payments/admin/insurance/`,
    },

    // ============== TRANSACTIONS & KITTIES ==============
    PAYMENT_ADMIN: {
        TRANSACTIONS: `${API_BASE_URL}/api/payments/admin/transactions/`,
        TRANSACTIONS_STATS: `${API_BASE_URL}/api/payments/admin/transactions/stats/`,
        
        KITTIES: `${API_BASE_URL}/api/payments/admin/kitties/`,
        KITTIES_STATS: `${API_BASE_URL}/api/payments/admin/kitties/stats/`,
        KITTY_FREEZE: (id) => `${API_BASE_URL}/api/payments/admin/kitties/${id}/freeze/`,
        KITTY_UNFREEZE: (id) => `${API_BASE_URL}/api/payments/admin/kitties/${id}/unfreeze/`,
    },

    // ============== PAYMENT PROCESSING ==============
    PAYMENT_PROCESSING: {
        PROCESS: `${API_BASE_URL}/api/payments/process/`,
        REFUND: `${API_BASE_URL}/api/payments/refund/`,
        DETECT_METHOD: `${API_BASE_URL}/api/payments/detect-method/`,
        
        // Deposits
        DEPOSIT: `${API_BASE_URL}/api/payments/deposit/`,
        
        // Withdrawals
        WITHDRAW: `${API_BASE_URL}/api/payments/withdraw/`,
        
        // Transfers
        TRANSFER: `${API_BASE_URL}/api/payments/transfer/`,
        
        // Verify
        VERIFY_ACCOUNT: `${API_BASE_URL}/api/payments/verify-account/`,
    },

    // ============== ESCROW ==============
    ESCROW: {
        LIST: `${API_BASE_URL}/api/payments/escrow/`,
        DETAIL: (id) => `${API_BASE_URL}/api/payments/escrow/${id}/`,
        CREATE: `${API_BASE_URL}/api/payments/escrow/`,
        FUND: (id) => `${API_BASE_URL}/api/payments/escrow/${id}/fund/`,
        DELIVER: (id) => `${API_BASE_URL}/api/payments/escrow/${id}/deliver/`,
        RELEASE: (id) => `${API_BASE_URL}/api/payments/escrow/${id}/release/`,
        DISPUTE: (id) => `${API_BASE_URL}/api/payments/escrow/${id}/dispute/`,
    },

    // ============== GATEWAY CONFIG ==============
    GATEWAY: {
        CONFIG: `${API_BASE_URL}/api/payments/gateway-config/`,
        
        // Stripe
        STRIPE_WEBHOOK: `${API_BASE_URL}/api/payments/stripe/webhook/`,
        
        // PayPal
        PAYPAL_WEBHOOK: `${API_BASE_URL}/api/payments/paypal/webhook/`,
        
        // M-Pesa
        MPESA_CALLBACK: `${API_BASE_URL}/api/payments/mpesa/callback/`,
    },
}

export default API_ENDPOINTS;

