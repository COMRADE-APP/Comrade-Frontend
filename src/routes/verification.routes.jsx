import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const VerificationApplication = () => Lazy(() => import('../pages/VerificationApplication'));
const MyVerifications = () => Lazy(() => import('../pages/MyVerifications'));
const LivenessVerification = () => Lazy(() => import('../pages/LivenessVerification'));
const StaffVerificationDashboard = () => Lazy(() => import('../pages/StaffVerificationDashboard'));

export const verificationRoutes = [
    <Route
        key="verification-apply"
        path={ROUTES.VERIFICATION_APPLY}
        element={
            <MainLayout>
                <VerificationApplication />
            </MainLayout>
        }
    />,
    <Route
        key="verification-detail"
        path={ROUTES.VERIFICATION_DETAIL}
        element={
            <MainLayout>
                <MyVerifications />
            </MainLayout>
        }
    />,
    <Route
        key="verification-liveness"
        path={ROUTES.VERIFICATION_LIVENESS}
        element={
            <MainLayout>
                <LivenessVerification />
            </MainLayout>
        }
    />,
    <Route
        key="my-verifications"
        path={ROUTES.MY_VERIFICATIONS}
        element={
            <MainLayout>
                <MyVerifications />
            </MainLayout>
        }
    />,
    <Route
        key="staff-verifications"
        path={ROUTES.STAFF_VERIFICATIONS}
        element={
            <MainLayout>
                <StaffVerificationDashboard />
            </MainLayout>
        }
    />,
];