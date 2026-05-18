import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const AdminPortal = () => Lazy(() => import('../pages/admin/AdminPortal'));
const AdminUsers = () => Lazy(() => import('../pages/admin/AdminUsers'));
const AdminContent = () => Lazy(() => import('../pages/admin/AdminContent'));
const AdminRoleRequests = () => Lazy(() => import('../pages/admin/AdminRoleRequests'));
const AdminVerifications = () => Lazy(() => import('../pages/admin/AdminVerifications'));
const AdminAnalytics = () => Lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminSettings = () => Lazy(() => import('../pages/admin/AdminSettings'));
const AdminDeletionReview = () => Lazy(() => import('../pages/admin/AdminDeletionReview'));
const AdminBills = () => Lazy(() => import('../pages/admin/AdminBills'));
const AdminLoans = () => Lazy(() => import('../pages/admin/AdminLoans'));
const AdminInsurance = () => Lazy(() => import('../pages/admin/AdminInsurance'));
const AdminTransactionsKitties = () => Lazy(() => import('../pages/admin/AdminTransactionsKitties'));

const MLDashboard = () => Lazy(() => import('../pages/MLDashboard'));
const PricingDashboard = () => Lazy(() => import('../pages/ml/PricingDashboard'));
const RecommendationDashboard = () => Lazy(() => import('../pages/ml/RecommendationDashboard'));
const DistributionDashboard = () => Lazy(() => import('../pages/ml/DistributionDashboard'));
const ScrapingDashboard = () => Lazy(() => import('../pages/ml/ScrapingDashboard'));

export const adminRoutes = [
    <Route key="admin-deletion" path={ROUTES.ADMIN_DELETION_REVIEW} element={<AdminDeletionReview />} />,
    <Route key="admin-portal" path={ROUTES.ADMIN_PORTAL} element={<AdminPortal />} />,
    <Route key="admin-users" path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />,
    <Route key="admin-content" path={ROUTES.ADMIN_CONTENT} element={<AdminContent />} />,
    <Route key="admin-role-requests" path={ROUTES.ADMIN_ROLE_REQUESTS} element={<AdminRoleRequests />} />,
    <Route key="admin-verifications" path={ROUTES.ADMIN_VERIFICATIONS} element={<AdminVerifications />} />,
    <Route key="admin-analytics" path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalytics />} />,
    <Route key="admin-settings" path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />,
    <Route key="admin-bills" path="/admin/bills" element={<AdminBills />} />,
    <Route key="admin-loans" path="/admin/loans" element={<AdminLoans />} />,
    <Route key="admin-insurance" path="/admin/insurance" element={<AdminInsurance />} />,
    <Route key="admin-trans-kitties" path="/admin/transactions-kitties" element={<AdminTransactionsKitties />} />,

    <Route key="ml-dashboard" path="/admin/ml-dashboard" element={<MLDashboard />} />,
    <Route key="ml-pricing" path="/admin/ml/pricing" element={<PricingDashboard />} />,
    <Route key="ml-recommendation" path="/admin/ml/recommendation" element={<RecommendationDashboard />} />,
    <Route key="ml-distribution" path="/admin/ml/distribution" element={<DistributionDashboard />} />,
    <Route key="ml-scraping" path="/admin/ml/scraping" element={<ScrapingDashboard />} />,
];
