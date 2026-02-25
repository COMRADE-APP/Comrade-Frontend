/**
 * English translations (default language)
 */
const en = {
    // Common
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        search: 'Search',
        filter: 'Filter',
        viewAll: 'View All',
        seeMore: 'See More',
        noResults: 'No results found',
        required: 'Required',
        optional: 'Optional',
    },

    // Navigation
    nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        payments: 'Payments',
        shop: 'Shop',
        settings: 'Settings',
        profile: 'Profile',
        messages: 'Messages',
        notifications: 'Notifications',
        logout: 'Log Out',
    },

    // Authentication
    auth: {
        login: 'Sign In',
        register: 'Create Account',
        createAccount: 'Create your account',
        joinQomrade: 'Join Qomrade and start collaborating',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phoneNumber: 'Phone Number',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        dateOfBirth: 'Date of Birth',
        dateOfBirthOptional: 'Date of Birth (Optional)',
        iAmA: 'I am a',
        student: 'Student',
        normalUser: 'Normal User (Non-Student)',
        lecturer: 'Lecturer',
        staff: 'Staff',
        creatingAccount: 'Creating account...',
        alreadyHaveAccount: 'Already have an account?',
        signIn: 'Sign in',
        forgotPassword: 'Forgot password?',
        // Validation
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        phoneRequired: 'Phone number is required',
        phoneMinLength: 'Phone number must be at least 10 digits',
        passwordRequired: 'Password is required',
        passwordRules: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
        passwordsMismatch: 'Passwords do not match',
        birthdayFuture: 'Date of birth cannot be in the future',
    },

    // Payments
    payments: {
        title: 'Payments',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        sendMoney: 'Send Money',
        balance: 'Balance',
        amount: 'Amount',
        recipient: 'Recipient',
        notes: 'Notes',
        reviewConfirm: 'Review & Confirm',
        processing: 'Processing...',
        transactionSuccess: 'Transaction Successful',
        transactionFailed: 'Transaction Failed',
        paymentMethod: 'Payment Method',
        selectMethod: 'Select payment method',
        qomradeBalance: 'Qomrade Balance',
    },

    // Settings
    settings: {
        title: 'Settings',
        language: 'Language',
        currency: 'Currency',
        theme: 'Theme',
        privacy: 'Privacy',
        security: 'Security',
        notifications: 'Notifications',
        account: 'Account',
        preferences: 'Preferences',
        selectLanguage: 'Select language',
        selectCurrency: 'Select currency',
    },

    // Time
    time: {
        justNow: 'Just now',
        minutesAgo: '{{count}} minutes ago',
        hoursAgo: '{{count}} hours ago',
        daysAgo: '{{count}} days ago',
        yesterday: 'Yesterday',
    },
};

export default en;
