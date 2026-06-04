import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ROUTES } from './constants/routes';
import MainLayout from './components/layout/MainLayout';
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
import { providerRoutes } from './routes/provider.routes';

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

const Protected = ({ children }) => (
    <ProtectedRoute>
        <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
);

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
        element: <Protected>{r.props.element}</Protected>
    }));

    return (
        <ToastProvider>
            <CartProvider>
                <Routes>
                    {publicRoutes}
                    {protectedRoutes}

                    {providerRoutes}

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
