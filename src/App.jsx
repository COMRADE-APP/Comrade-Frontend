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
import GroupTargets from './pages/payments/GroupTargets';

// New Integrated Pages
import CreateInstitution from './pages/institutions/CreateInstitution';
import InstitutionVerification from './pages/institutions/InstitutionVerification';
import TransactionHistory from './pages/TransactionHistory';
import CreateAnnouncement from './pages/CreateAnnouncement';

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

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
    );
}

export default App;
