import React, { useState, useEffect } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import ProviderLayout from '../layouts/ProviderLayout';
import { useAuth } from '../contexts/AuthContext';
import providerService from '../services/provider.service';
import { Lazy } from './auth.routes';

const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
);

const ProviderRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const [checkingProvider, setCheckingProvider] = useState(true);
    const [hasProvider, setHasProvider] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            setCheckingProvider(false);
            return;
        }
        if (user?.user_type === 'provider' || user?.is_provider) {
            setHasProvider(true);
            setCheckingProvider(false);
            return;
        }
        providerService.getMyRegistrations()
            .then(regs => {
                setHasProvider(regs?.length > 0);
                setCheckingProvider(false);
            })
            .catch(() => {
                setHasProvider(false);
                setCheckingProvider(false);
            });
    }, [loading, isAuthenticated, user]);

    if (loading || checkingProvider) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!hasProvider) {
        return <Navigate to={ROUTES.PROVIDER_REGISTRATION} replace />;
    }

    return children;
};

const ProviderDashboard = () => Lazy(() => import('../pages/providers/ProviderDashboard'));
const ProviderProducts = () => Lazy(() => import('../pages/providers/ProviderProducts'));
const ProviderOrders = () => Lazy(() => import('../pages/providers/ProviderOrders'));
const ProviderTransactions = () => Lazy(() => import('../pages/providers/ProviderTransactions'));
const ProviderQueries = () => Lazy(() => import('../pages/providers/ProviderQueries'));
const ProviderStaff = () => Lazy(() => import('../pages/providers/ProviderStaff'));
const ProviderRegistration = () => Lazy(() => import('../pages/providers/ProviderRegistration'));

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingFallback />;
    return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

const ProviderAnalytics = () => Lazy(() => import('../pages/providers/ProviderAnalytics'));
const ProviderSettingsPage = () => Lazy(() => import('../pages/providers/ProviderSettingsPage'));
const StackEditor = () => Lazy(() => import('../pages/providers/StackEditor'));
const ProviderSpecializationEditor = () => Lazy(() => import('../pages/providers/ProviderSpecializationEditor'));
const ProviderLoanEdit = () => Lazy(() => import('../pages/providers/ProviderLoanEdit'));
const ProviderInsuranceEdit = () => Lazy(() => import('../pages/providers/ProviderInsuranceEdit'));

export const providerRoutes = [
    <Route key="provider-dashboard-redirect" path="/providers/dashboard" element={<Navigate to={ROUTES.PROVIDER_DASHBOARD} replace />} />,

    <Route key="provider-layout" element={<ProviderRoute><ProviderLayout /></ProviderRoute>}>
        <Route key="provider-dashboard" path={ROUTES.PROVIDER_DASHBOARD} element={<ProviderDashboard />} />
        <Route key="provider-analytics" path={ROUTES.PROVIDER_ANALYTICS} element={<ProviderAnalytics />} />
        <Route key="provider-products" path={ROUTES.PROVIDER_PRODUCTS} element={<ProviderProducts />} />
        <Route key="provider-orders" path={ROUTES.PROVIDER_ORDERS} element={<ProviderOrders />} />
        <Route key="provider-transactions" path={ROUTES.PROVIDER_TRANSACTIONS} element={<ProviderTransactions />} />
        <Route key="provider-queries" path={ROUTES.PROVIDER_QUERIES} element={<ProviderQueries />} />
        <Route key="provider-staff" path={ROUTES.PROVIDER_STAFF} element={<ProviderStaff />} />
        <Route key="provider-settings" path={ROUTES.PROVIDER_SETTINGS} element={<ProviderSettingsPage />} />
    </Route>,

    <Route key="provider-registration" path={ROUTES.PROVIDER_REGISTRATION} element={<ProtectedRoute><ProviderRegistration /></ProtectedRoute>} />,

    <Route key="stack-editor" path="/stacks/:stackId/edit" element={<ProtectedRoute><StackEditor /></ProtectedRoute>} />,
    <Route key="spec-editor" path="/provider/products/specialization/:specId" element={<ProtectedRoute><ProviderSpecializationEditor /></ProtectedRoute>} />,
    <Route key="loan-edit" path="/provider/products/loan/:loanId" element={<ProtectedRoute><ProviderLoanEdit /></ProtectedRoute>} />,
    <Route key="insurance-edit" path="/provider/products/insurance/:insuranceId" element={<ProtectedRoute><ProviderInsuranceEdit /></ProtectedRoute>} />,
];
