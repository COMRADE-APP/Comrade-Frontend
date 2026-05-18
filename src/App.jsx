import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ROUTES } from './constants/routes';
import MainLayout from './components/layout/MainLayout';
import StripeProvider from './contexts/StripeProvider';
import { CartProvider } from './contexts/CartContext';
import CartDrawer from './components/shop/CartDrawer';
import { ToastProvider } from './contexts/ToastContext';

import { publicRoutes } from './routes/auth.routes';
import { coreRoutes } from './routes/core.routes';
import { contentRoutes } from './routes/content.routes';
import { eventRoutes } from './routes/event.routes';
import { socialRoutes } from './routes/social.routes';
import { paymentRoutes } from './routes/payment.routes';
import { fundingRoutes } from './routes/funding.routes';
import { shopRoutes } from './routes/shop.routes';
import { careerRoutes } from './routes/career.routes';
import { entityRoutes } from './routes/entity.routes';
import { learningRoutes } from './routes/learning.routes';
import { adminRoutes } from './routes/admin.routes';
import { portalRoutes } from './routes/portal.routes';
import { verificationRoutes } from './routes/verification.routes';

const Lazy = (importFn) => (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
        {React.createElement(React.lazy(importFn))}
    </Suspense>
);

const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

const wrapLayout = (children, stripe = false) => {
    const content = <MainLayout>{children}</MainLayout>;
    return stripe ? <StripeProvider>{content}</StripeProvider> : content;
};

const Protected = ({ children, stripe = false }) => (
    <ProtectedRoute>
        {wrapLayout(children, stripe)}
    </ProtectedRoute>
);

const stripeRoutes = new Set(['payment-methods', 'payment-methods-alt', 'checkout']);

function App() {
    const protectedRoutes = [
        ...coreRoutes,
        ...contentRoutes,
        ...eventRoutes,
        ...socialRoutes,
        ...paymentRoutes,
        ...fundingRoutes,
        ...shopRoutes,
        ...careerRoutes,
        ...entityRoutes,
        ...learningRoutes,
        ...adminRoutes,
        ...portalRoutes,
        ...verificationRoutes,
    ].map(r => React.cloneElement(r, {
        element: <Protected stripe={stripeRoutes.has(r.key)}>{r.props.element}</Protected>
    }));

    return (
        <ToastProvider>
            <CartProvider>
                <Routes>
                    {publicRoutes}
                    {protectedRoutes}

                    <Route path="/institutions/create" element={<ProtectedRoute>{Lazy(() => import('./pages/institutions/CreateInstitution'))}</ProtectedRoute>} />
                    <Route path="/institutions/portal/create" element={<ProtectedRoute>{Lazy(() => import('./components/entities/EntityCreationPortal'))}</ProtectedRoute>} />
                    <Route path="/organizations/create" element={<ProtectedRoute>{Lazy(() => import('./pages/organizations/CreateOrganization'))}</ProtectedRoute>} />
                    <Route path="/organizations/portal/create" element={<ProtectedRoute>{Lazy(() => import('./components/entities/EntityCreationPortal'))}</ProtectedRoute>} />
                    <Route path="/setup-totp" element={<ProtectedRoute>{Lazy(() => import('./components/auth/TOTPSetup'))}</ProtectedRoute>} />

                    <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
                </Routes>
                <CartDrawer />
            </CartProvider>
        </ToastProvider>
    );
}

export default App;
