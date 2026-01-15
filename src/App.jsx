import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ROUTES } from './constants/routes';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import GoogleCallback from './pages/auth/GoogleCallback';
import { AppleCallback, FacebookCallback, XCallback, GitHubCallback, MicrosoftCallback } from './pages/auth/OAuthCallback';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyRegistration from './pages/auth/VerifyRegistration';
import RegistrationSuccess from './pages/auth/RegistrationSuccess';
import LoginSuccess from './pages/auth/LoginSuccess';
import ProfileSetup from './pages/auth/ProfileSetup';
import ResetPassword from './pages/auth/ResetPassword';
import Setup2FA from './pages/auth/Setup2FA';
import Verify2FA from './pages/auth/Verify2FA';
import VerifySMS from './pages/auth/VerifySMS';
import TOTPSetup from './pages/auth/TOTPSetup';

// Main Pages
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Messages from './pages/Messages';
import Resources from './pages/Resources';
import Institutions from './pages/Institutions';
import Organizations from './pages/Organizations';
import Payments from './pages/Payments';
import PaymentMethods from './pages/PaymentMethods';
import Specializations from './pages/Specializations';
import Settings from './pages/Settings';

// New Feature Pages
import ActivityLog from './pages/ActivityLog';
import Devices from './pages/Devices';
import PermissionsSettings from './pages/PermissionsSettings';
import Shop from './pages/shop/Shop';
import ProductDetails from './pages/shop/ProductDetails';
import PiggyBanks from './pages/payments/PiggyBanks';

// Payment System Components
import ProductCatalog from './pages/products/ProductCatalog';
import SubscriptionPlans from './pages/subscription/SubscriptionPlans';
import TierPlans from './pages/subscription/TierPlans';
import GroupTargets from './pages/payments/GroupTargets';

// New Integrated Pages
import CreateInstitution from './pages/institutions/CreateInstitution';
import InstitutionVerification from './pages/institutions/InstitutionVerification';
import TransactionHistory from './pages/TransactionHistory';
import CreateAnnouncement from './pages/CreateAnnouncement';

// New Portal Components
import EntityCreationPortal from './components/entities/EntityCreationPortal';
import VerificationDashboard from './components/entities/VerificationDashboard';
import TOTPSetupComponent from './components/auth/TOTPSetup';
import PaymentForm from './components/payments/PaymentForm';
import ServiceConverter from './components/announcements/ServiceConverter';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
            <Route path={ROUTES.VERIFY_EMAIL_OTP} element={<VerifyEmail />} />
            <Route path={ROUTES.VERIFY_REGISTRATION} element={<VerifyRegistration />} />
            <Route path={ROUTES.REGISTRATION_SUCCESS} element={<RegistrationSuccess />} />
            <Route path={ROUTES.LOGIN_SUCCESS} element={<LoginSuccess />} />
            <Route path={ROUTES.PROFILE_SETUP} element={<ProfileSetup />} />
            <Route path={ROUTES.VERIFY_2FA} element={<Verify2FA />} />
            <Route path={ROUTES.VERIFY_SMS} element={<VerifySMS />} />
            <Route path={ROUTES.SETUP_2FA} element={<Setup2FA />} />

            {/* OAuth Callbacks */}
            <Route path={ROUTES.GOOGLE_CALLBACK} element={<GoogleCallback />} />
            <Route path={ROUTES.APPLE_CALLBACK} element={<AppleCallback />} />
            <Route path={ROUTES.FACEBOOK_CALLBACK} element={<FacebookCallback />} />
            <Route path={ROUTES.X_CALLBACK} element={<XCallback />} />
            <Route path={ROUTES.GITHUB_CALLBACK} element={<GitHubCallback />} />
            <Route path={ROUTES.MICROSOFT_CALLBACK} element={<MicrosoftCallback />} />

            {/* Protected Routes */}
            <Route
                path={ROUTES.DASHBOARD}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ANNOUNCEMENTS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Announcements />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.EVENTS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Events />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.TASKS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Tasks />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PROFILE}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Profile />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.COMMUNITY}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Community />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ROOMS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Rooms />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/rooms/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <RoomDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.MESSAGES}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Messages />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.RESOURCES}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Resources />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.INSTITUTIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Institutions />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ORGANIZATIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Organizations />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PAYMENTS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Payments />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PAYMENT_METHODS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentMethods />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.SPECIALIZATIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Specializations />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.SETTINGS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Settings />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ACTIVITY}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ActivityLog />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.DEVICES}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Devices />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PERMISSIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PermissionsSettings />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.SHOP}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Shop />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PRODUCT_DETAILS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ProductDetails />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PIGGY_BANKS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PiggyBanks />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/shop/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ProductDetails />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Payment System Routes */}
            <Route
                path="/products"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ProductCatalog />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/subscriptions"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <SubscriptionPlans />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/savings-goals"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <GroupTargets />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.TIER_PLANS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <TierPlans />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.PIGGY_BANKS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PiggyBanks />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* TOTP Setup Route */}
            <Route
                path="/setup-totp"
                element={
                    <ProtectedRoute>
                        <TOTPSetup />
                    </ProtectedRoute>
                }
            />

            {/* Institution Routes */}
            <Route
                path="/institutions/create"
                element={
                    <ProtectedRoute>
                        <CreateInstitution />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/institutions/:institutionId/verification"
                element={
                    <ProtectedRoute>
                        <InstitutionVerification />
                    </ProtectedRoute>
                }
            />

            {/* Transaction History */}
            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <TransactionHistory />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Announcements */}
            <Route
                path="/announcements/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateAnnouncement />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/announcements/convert"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ServiceConverter
                                onSuccess={() => window.location.href = '/announcements'}
                                onCancel={() => window.location.href = '/announcements'}
                            />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Enhanced Portal Routes */}
            <Route
                path="/institutions/portal/create"
                element={
                    <ProtectedRoute>
                        <EntityCreationPortal
                            entityType="institution"
                            onSuccess={(entity) => window.location.href = `/institutions/portal/${entity.id}/verify`}
                            onCancel={() => window.location.href = '/dashboard'}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/institutions/portal/:id/verify"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <VerificationDashboard
                                entityId={window.location.pathname.split('/')[3]}
                                entityType="institution"
                            />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/organizations/portal/create"
                element={
                    <ProtectedRoute>
                        <EntityCreationPortal
                            entityType="organization"
                            onSuccess={(entity) => window.location.href = `/organizations/portal/${entity.id}/verify`}
                            onCancel={() => window.location.href = '/dashboard'}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/organizations/portal/:id/verify"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <VerificationDashboard
                                entityId={window.location.pathname.split('/')[3]}
                                entityType="organization"
                            />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Payment Processing Route */}
            <Route
                path="/payments/checkout"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentForm
                                amount={100}
                                currency="USD"
                                description="Payment"
                                onSuccess={() => window.location.href = '/payments'}
                                onCancel={() => window.location.href = '/payments'}
                            />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Security Settings - TOTP */}
            <Route
                path="/settings/security/totp"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <TOTPSetupComponent
                                onComplete={() => window.location.href = '/settings'}
                                onCancel={() => window.location.href = '/settings'}
                            />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Redirect root to dashboard (ROUTES.DASHBOARD = '/dashboard') */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
    );
}

export default App;
