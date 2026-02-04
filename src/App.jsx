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
import Organizations from './pages/Organizations';
import CreateOrganization from './pages/organizations/CreateOrganization';
import OrganizationDetail from './pages/organizations/OrganizationDetail';
import OrganizationVerification from './pages/organizations/OrganizationVerification';
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
import CreatePaymentGroup from './pages/payments/CreatePaymentGroup';
import PaymentGroups from './pages/payments/PaymentGroups';
import PaymentGroupDetail from './pages/payments/PaymentGroupDetail';
import VerifyAccount from './pages/payments/VerifyAccount';
import BusinessRegistration from './pages/payments/BusinessRegistration';
import RegisterAgent from './pages/payments/RegisterAgent';
import RegisterSupplier from './pages/payments/RegisterSupplier';
import RegisterShop from './pages/payments/RegisterShop';

// Opinions & Social
import Opinions from './pages/Opinions';
import OpinionDetail from './pages/OpinionDetail';
import Following from './pages/Following';
import Research from './pages/Research';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Notifications from './pages/Notifications';

// New Integrated Pages
import Institutions from './pages/Institutions';
import CreateInstitution from './pages/institutions/CreateInstitution';
import InstitutionVerification from './pages/institutions/InstitutionVerification';
import InstitutionDetail from './pages/institutions/InstitutionDetail';
import TransactionHistory from './pages/TransactionHistory';
import CreateAnnouncement from './pages/CreateAnnouncement';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import CreateTask from './pages/CreateTask';
import CreateRoom from './pages/CreateRoom';
import CreateResource from './pages/CreateResource';
import CreateResearch from './pages/CreateResearch';
import CreateArticle from './pages/CreateArticle';
import AdminDeletionReview from './pages/admin/AdminDeletionReview';
import BecomePartner from './pages/partners/BecomePartner';
import CreateProduct from './pages/products/CreateProduct';
import QomAI from './pages/QomAI';
import FundingHub from './pages/funding/FundingHub';
import CreateBusiness from './pages/funding/CreateBusiness';

// Careers & Gigs
import GigsPage from './pages/careers/GigsPage';
import CareersPage from './pages/careers/CareersPage';
import CreateGig from './pages/careers/CreateGig';

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
                path={ROUTES.QOMAI}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <QomAI />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.FUNDING}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <FundingHub />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={'/funding/create'}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateBusiness />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            {/* Gigs Routes */}
            <Route
                path={ROUTES.GIGS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <GigsPage />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.CREATE_GIG}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateGig />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            {/* Careers Routes */}
            <Route
                path={ROUTES.CAREERS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CareersPage />
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
                path="/events/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <EventDetail />
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
                path={ROUTES.PROFILE_DETAIL}
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
                path={ROUTES.NOTIFICATIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Notifications />
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
                path={ROUTES.OPINIONS}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Opinions />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/opinions/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <OpinionDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.FOLLOWING}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Following />
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
                path={ROUTES.RESEARCH}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Research />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ARTICLES}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Articles />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/articles/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ArticleDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path={ROUTES.ADMIN_DELETION_REVIEW}
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <AdminDeletionReview />
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
                path="/institutions/create"
                element={
                    <ProtectedRoute>
                        <CreateInstitution />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/institutions/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <InstitutionDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/institutions/:id/verification"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <InstitutionVerification />
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
                path="/organizations/create"
                element={
                    <ProtectedRoute>
                        <CreateOrganization />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/organizations/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <OrganizationDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/organizations/:id/verification"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <OrganizationVerification />
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

            {/* Payment Groups Routes */}
            <Route
                path="/payments/groups"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentGroups />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payments/groups/:groupId"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentGroupDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payments/create-group"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreatePaymentGroup />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/payments/verify-account"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <VerifyAccount />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Business Registration Routes */}
            <Route
                path="/business/register"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <BusinessRegistration />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payments/register-agent"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <RegisterAgent />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payments/register-supplier"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <RegisterSupplier />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payments/register-shop"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <RegisterShop />
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
            <Route
                path="/institutions/:id"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <InstitutionDetail />
                        </MainLayout>
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
                path="/events/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateEvent />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tasks/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateTask />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/rooms/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateRoom />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/resources/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateResource />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/research/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateResearch />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/articles/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateArticle />
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
            <Route
                path="/partners/apply"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <BecomePartner />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/products/create"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreateProduct />
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

            {/* Payment Groups */}
            <Route
                path="/payments/groups"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentGroups />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Payment Group Detail */}
            <Route
                path="/payments/groups/:groupId"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PaymentGroupDetail />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Create Payment Group */}
            <Route
                path="/payments/create-group"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <CreatePaymentGroup />
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
