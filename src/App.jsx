import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ROUTES } from "./constants/routes";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import GoogleCallback from "./pages/auth/GoogleCallback";
import VerifyEmail from "./pages/auth/VerifyEmail";
import RegistrationSuccess from "./pages/auth/RegistrationSuccess";
import LoginSuccess from "./pages/auth/LoginSuccess";
import ProfileSetup from "./pages/auth/ProfileSetup";
import ResetPassword from "./pages/auth/ResetPassword";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Rooms from "./pages/Rooms";
import Messages from "./pages/Messages";
import Resources from "./pages/Resources";
import Institutions from "./pages/Institutions";
import Organizations from "./pages/Organizations";
import Payments from "./pages/Payments";
import PaymentMethods from "./pages/PaymentMethods";
import Specializations from "./pages/Specializations";
import Settings from "./pages/Settings";

// New Feature Pages
import ActivityLog from "./pages/ActivityLog";
import Devices from "./pages/Devices";
import PermissionsSettings from "./pages/PermissionsSettings";
import Shop from "./pages/shop/Shop";
import ProductDetails from "./pages/shop/ProductDetails";
import PiggyBanks from "./pages/payments/PiggyBanks";

// Payment System Components
import ProductCatalog from "./pages/products/ProductCatalog";
import SubscriptionPlans from "./pages/subscription/SubscriptionPlans";
import TierPlans from "./pages/subscription/TierPlans";
import GroupTargets from "./pages/payments/GroupTargets";

// New Integrated Pages
import CreateInstitution from "./pages/institutions/CreateInstitution";
import InstitutionVerification from "./pages/institutions/InstitutionVerification";
import TransactionHistory from "./pages/TransactionHistory";
import CreateAnnouncement from "./pages/CreateAnnouncement";

// New Portal Components
import EntityCreationPortal from "./components/entities/EntityCreationPortal";
import VerificationDashboard from "./components/entities/VerificationDashboard";
import TOTPSetupComponent from "./components/auth/TOTPSetup";
import PaymentForm from "./components/payments/PaymentForm";
import ServiceConverter from "./components/announcements/ServiceConverter";

import { ToastProvider } from "./contexts/ToastContext";
import "./styles/animations.css";

// Helper component to handle params for VerificationDashboard
const VerificationDashboardWrapper = ({ entityType }) => {
  const { id } = useParams();
  return (
    <MainLayout>
      <VerificationDashboard entityId={id} entityType={entityType} />
    </MainLayout>
  );
};

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
  const navigate = useNavigate();

  return (
    <ToastProvider>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.VERIFY_EMAIL_OTP} element={<VerifyEmail />} />
        <Route
          path={ROUTES.REGISTRATION_SUCCESS}
          element={<RegistrationSuccess />}
        />
        <Route path={ROUTES.LOGIN_SUCCESS} element={<LoginSuccess />} />
        <Route path={ROUTES.PROFILE_SETUP} element={<ProfileSetup />} />

        {/* OAuth Callbacks */}
        <Route path={ROUTES.GOOGLE_CALLBACK} element={<GoogleCallback />} />

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
                  onSuccess={() => navigate("/announcements")}
                  onCancel={() => navigate("/announcements")}
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
                onSuccess={(entity) =>
                  navigate(`/institutions/portal/${entity.id}/verify`)
                }
                onCancel={() => navigate("/dashboard")}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institutions/portal/:id/verify"
          element={
            <ProtectedRoute>
              <VerificationDashboardWrapper entityType="institution" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizations/portal/create"
          element={
            <ProtectedRoute>
              <EntityCreationPortal
                entityType="organization"
                onSuccess={(entity) =>
                  navigate(`/organizations/portal/${entity.id}/verify`)
                }
                onCancel={() => navigate("/dashboard")}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/portal/:id/verify"
          element={
            <ProtectedRoute>
              <VerificationDashboardWrapper entityType="organization" />
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
                  onSuccess={() => navigate("/payments")}
                  onCancel={() => navigate("/payments")}
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />


        {/* Redirect root to dashboard (ROUTES.DASHBOARD = '/dashboard') */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
